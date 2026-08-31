import { FormedibleParser } from 'formedible-bench-main-parser';

import { collectWorktreeEnvironment, writeRunArtifact, type BenchEnvironment, type BenchRecord } from './artifacts';
import { assertBaselineReady, generateMainTsconfigs } from './baseline-worktree';
import { DEFAULT_MEASURED_RUNS, DEFAULT_WARMUP_RUNS, SMOKE_MEASURED_RUNS } from './bench-timing';
import { printReport } from './report-table';
import {
  buildScenarioRecords,
  executeBrowserScenario,
  isParserScenarioId,
  logScenarioMetrics,
  parseBenchArguments,
  resolveRequestedScenarioIds,
  runParserScenario,
  withFixtureSession,
} from './run-common';
import { getScenario } from './scenarios/index';
import type { BenchImplementation } from './adapter-types';

/**
 * MAIN-baseline benchmark runner (PERF-BENCHMARK-PLAN.md Phase 2): the shared
 * runner glue (`run-common.ts`) wired to the `main`-branch implementation on
 * ITS OWN pinned dependencies (DECISION-1). This file adds exactly the
 * main-specific wiring: baseline-worktree readiness + tsconfig generation, the
 * cross-comparable-only scenario filter, the DECISION-1 dependency-isolation
 * assertion against every served fixture page, the in-page resolved-version
 * block, main's parser import from the worktree, and the divergence notes
 * attached to the affected records (submit lifecycle, page-navigation gating).
 *
 * CLI: `--smoke` (DECISION-3 subset, N=5), `--only <scenario-id>`
 * (repeatable), `--runs <n>`. Assumes `bench:baseline:setup` ran; fails with a
 * pointer to it when the worktree is missing.
 */

const IMPLEMENTATION: BenchImplementation = 'main';
const BROWSER_SESSION = 'formedible-bench-main';
const LOG_PREFIX = '[bench:main]';

const USAGE = 'Usage: tsx tests/bench/lib/run-main.ts [--smoke] [--only <scenario-id>]... [--runs <n>]';

const BROWSER_MEDIUM_NOTE =
  'medium: chromium (agent-browser, in-page performance.now() loops; main fixture aliased to the baseline worktree)';
const NODE_MEDIUM_NOTE = 'medium: node (no DOM; FormedibleParser imported from the baseline worktree)';
const PAGE_REACT_FORM_KEY = '@tanstack/react-form (in-page)';
const PAGE_REACT_KEY = 'react (in-page)';
const MAIN_SUBMIT_NOTES = [
  "divergence: main never wires the top-level schema option into validation; the fixture distributes the scenario zod schema across per-field validation entries",
  "divergence: main's submit wrapper unconditionally resets the form and tears down isSubmitting only after onSubmit resolves (resetOnSubmitSuccess is ignored); samples are captured inside onSubmit and the fixture lets the lifecycle settle (frame + task, untimed) before the next submit, because the browser refuses requestSubmit() while the submit button is still disabled mid-lifecycle",
] as const;
const MAIN_PAGE_NAV_NOTES = [
  'divergence: main gates forward page navigation on per-page validation (D12) while the rewrite navigates freely; the scenario keeps every page valid (schema-valid defaults), so the measured paths stay comparable',
  'divergence: currentPage is a 1-based index over VISIBLE pages on main (D11); with no conditionals all 5 pages are visible, so the index equals the page number',
] as const;
const MAIN_AUTOSAVE_NOTE =
  "divergence: main's autosave runs inside a form-store subscription (clearTimeout + setTimeout churn per change), while the rewrite also builds a JSON signature of the whole values object per change — the overhead metric therefore prices different mechanisms on each side";

/**
 * DECISION-1 isolation assertion for the browser medium: the versions the
 * served page REPORTS (resolved through the fixture's worktree aliasing)
 * must equal the worktree's installed manifests. The current repo's
 * @tanstack/react-form sits on a different version line, so any leak of the
 * repo's tree into the page fails here, loudly, before anything is measured.
 */
function assertDependencyIsolation(pageVersions: Readonly<Record<string, string>>, environment: BenchEnvironment): void {
  const expectedReactForm = environment.versions['@tanstack/react-form'];
  const pageReactForm = pageVersions['@tanstack/react-form'];

  if (pageReactForm === undefined || pageReactForm !== expectedReactForm) {
    throw new Error(
      `Dependency isolation violated: the served main fixture page resolved @tanstack/react-form ` +
        `${pageReactForm ?? 'unreported'}, but the baseline worktree's installed tree pins ` +
        `${expectedReactForm ?? 'unknown'}. The page is not running main's pinned dependencies ` +
        '(DECISION-1); re-run pnpm run bench:baseline:setup and pnpm run bench:baseline.',
    );
  }

  const expectedReact = environment.versions['react'];
  const pageReact = pageVersions['react'];

  if (pageReact === undefined || pageReact !== expectedReact) {
    throw new Error(
      `Dependency isolation violated: the served main fixture page resolved react ` +
        `${pageReact ?? 'unreported'}, but the baseline worktree's installed tree pins ` +
        `${expectedReact ?? 'unknown'} (DECISION-1); re-run pnpm run bench:baseline:setup and pnpm run bench:baseline.`,
    );
  }
}

/** Records what the served page actually resolved (the isolation proof). */
function withInPageVersions(
  environment: BenchEnvironment,
  pageVersions: Readonly<Record<string, string>>,
): BenchEnvironment {
  return {
    ...environment,
    versions: {
      ...environment.versions,
      [PAGE_REACT_FORM_KEY]: pageVersions['@tanstack/react-form'] ?? 'unreported',
      [PAGE_REACT_KEY]: pageVersions['react'] ?? 'unreported',
    },
  };
}

/** Implementation-specific notes for a main browser record. */
function browserNotes(scenarioId: string, sharedNotes: readonly string[]): readonly string[] {
  const notes = [BROWSER_MEDIUM_NOTE];

  if (scenarioId.startsWith('submit-')) {
    notes.push(...MAIN_SUBMIT_NOTES);
  }

  if (scenarioId === 'pageswitch-50' || scenarioId === 'memory-500') {
    notes.push(...MAIN_PAGE_NAV_NOTES);
  }

  if (scenarioId === 'autosave-50') {
    notes.push(MAIN_AUTOSAVE_NOTE);
  }

  return [...notes, ...sharedNotes];
}

async function main(): Promise<void> {
  const cli = parseBenchArguments(USAGE, process.argv.slice(2));
  const runs = cli.runs ?? (cli.smoke ? SMOKE_MEASURED_RUNS : DEFAULT_MEASURED_RUNS);
  const resolvedIds = resolveRequestedScenarioIds(cli.smoke, cli.only);
  // The registry's default set now carries current-only scenarios (§3.2:
  // streaming, instrumentation extras, bundle) that have no main counterpart —
  // they are skipped silently-by-design here, while an EXPLICIT --only of a
  // non-cross scenario still fails loudly below.
  const requestedIds =
    cli.only.length > 0 ? resolvedIds : resolvedIds.filter((id) => getScenario(id).comparable === 'cross');
  const nonCrossIds = requestedIds.filter((id) => getScenario(id).comparable !== 'cross');

  if (nonCrossIds.length > 0) {
    throw new Error(
      `The main baseline only runs cross-comparable scenarios; not comparable here: ${nonCrossIds.join(', ')}.`,
    );
  }

  const skippedCurrentOnlyIds = resolvedIds.filter((id) => !requestedIds.includes(id));

  if (skippedCurrentOnlyIds.length > 0) {
    console.log(
      `${LOG_PREFIX} skipping current-only scenarios (no main counterpart): ${skippedCurrentOnlyIds.join(', ')}`,
    );
  }

  const worktreeDirectory = assertBaselineReady();

  generateMainTsconfigs();
  console.log(`${LOG_PREFIX} baseline worktree: ${worktreeDirectory}`);

  const browserScenarioIds = requestedIds.filter((id) => !isParserScenarioId(id));
  const nodeScenarioIds = requestedIds.filter((id) => isParserScenarioId(id));
  const baseEnvironment = collectWorktreeEnvironment(worktreeDirectory);
  let environment: BenchEnvironment = baseEnvironment;
  const records: BenchRecord[] = [];

  if (browserScenarioIds.length > 0) {
    await withFixtureSession('main-consumer', BROWSER_SESSION, LOG_PREFIX, baseEnvironment, async (browser) => {
      environment = browser.environment;

      const onFixtureOpened = async (): Promise<void> => {
        const pageVersions = await browser.driver.readRuntimeVersions();

        assertDependencyIsolation(pageVersions, environment);

        if (environment.versions[PAGE_REACT_FORM_KEY] === undefined) {
          environment = withInPageVersions(environment, pageVersions);
        }
      };

      for (const scenarioId of browserScenarioIds) {
        const outcome = await executeBrowserScenario(browser.driver, scenarioId, runs, onFixtureOpened);

        records.push(
          ...buildScenarioRecords(IMPLEMENTATION, scenarioId, outcome.metrics, environment, browserNotes(scenarioId, outcome.notes)),
        );
        logScenarioMetrics(LOG_PREFIX, scenarioId, outcome.metrics);
      }

      console.log(
        `${LOG_PREFIX} dependency isolation asserted in-page: @tanstack/react-form ${environment.versions[PAGE_REACT_FORM_KEY] ?? 'unknown'}, react ${environment.versions[PAGE_REACT_KEY] ?? 'unknown'}`,
      );
    });
  }

  for (const scenarioId of nodeScenarioIds) {
    const metrics = runParserScenario(FormedibleParser, scenarioId, runs);

    records.push(...buildScenarioRecords(IMPLEMENTATION, scenarioId, metrics, environment, [NODE_MEDIUM_NOTE]));
    logScenarioMetrics(LOG_PREFIX, scenarioId, metrics);
  }

  printReport(IMPLEMENTATION, records, environment, {
    mode: cli.smoke ? 'smoke' : 'full',
    runs,
    only: cli.only,
    warmupRuns: DEFAULT_WARMUP_RUNS,
  });

  const artifactFile = writeRunArtifact(IMPLEMENTATION, records);

  console.log(`Artifact written: ${artifactFile}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));

  process.exit(1);
});
