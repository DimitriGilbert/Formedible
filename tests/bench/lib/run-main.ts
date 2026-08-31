import { FormedibleParser } from 'formedible-bench-main-parser';

import { collectWorktreeEnvironment, writeRunArtifact, type BenchEnvironment, type BenchRecord } from './artifacts';
import { assertBaselineReady, generateMainTsconfigs } from './baseline-worktree';
import {
  DEFAULT_MEASURED_RUNS,
  DEFAULT_WARMUP_RUNS,
  SMOKE_MEASURED_RUNS,
  scaleStats,
  summarize,
  timeNs,
  type TimingStats,
} from './bench-timing';
import { printReport, roundTo } from './report-table';
import { BENCH_SCENARIOS, SMOKE_SCENARIO_IDS, getScenario, type BenchScenario } from './scenarios/index';
import { PARSER_RUN_PARSE_COUNT, TYPING_EVENT_COUNT, createMediumParserConfig, createTypingText } from './scenarios/forms';
import type { BenchImplementation } from './adapter-types';
import {
  BENCH_VIEWPORT_NOTE,
  buildBenchFixture,
  closeAgentBrowserSession,
  createAgentBrowserDriver,
  getAgentBrowserVersion,
  startBenchPreview,
  type BenchBrowserDriver,
} from '../utils/agent-browser';

/**
 * MAIN-baseline benchmark runner (PERF-BENCHMARK-PLAN.md Phase 2): the same
 * runner shape as `run.ts`, executing the cross-comparable scenarios against
 * the `main`-branch implementation on ITS OWN pinned dependencies
 * (DECISION-1).
 *
 * Browser scenarios run through the SAME agent-browser driver against the
 * committed `tests/bench/fixtures/main-consumer/` fixture, whose vite build
 * aliases main's hook source and react/react-dom into the baseline worktree
 * (DECISION-6 revised). Before every measured scenario the runner asserts the
 * dependency isolation in the SERVED PAGE: the fixture reports the
 * `@tanstack/react-form` and `react` versions its module graph actually
 * resolved (the worktree manifests, imported through the same aliasing), and
 * they must equal the worktree's installed versions — the current repo's
 * react-form (a different line) would fail this assertion loudly. The
 * artifact's `versions` block records what the page resolved.
 *
 * The node-side parser scenario imports main's `FormedibleParser` from the
 * worktree in-process (the only surviving worktree import), resolved through
 * the GENERATED `tests/bench/tsconfig.main.json`.
 *
 * CLI: `--smoke` (DECISION-3 subset, N=5), `--only <scenario-id>`
 * (repeatable), `--runs <n>`. Assumes `bench:baseline:setup` ran; fails with
 * a pointer to it when the worktree is missing.
 */

const IMPLEMENTATION: BenchImplementation = 'main';
const BROWSER_SESSION = 'formedible-bench-main';
const PARSER_SCENARIO_ID = 'parser-medium';
const TYPING_TARGET_FIELD = 'field001';
const MEDIUM_PARSER_FIELD_COUNT = 25;

const BROWSER_MEDIUM_NOTE = 'medium: chromium (agent-browser, in-page performance.now() loops; main fixture aliased to the baseline worktree)';
const NODE_MEDIUM_NOTE = 'medium: node (no DOM; FormedibleParser imported from the baseline worktree)';
const PAGE_REACT_FORM_KEY = '@tanstack/react-form (in-page)';
const PAGE_REACT_KEY = 'react (in-page)';
const MAIN_SUBMIT_NOTES = [
  'divergence: main never wires the top-level schema option into validation; the fixture distributes the scenario zod schema across per-field validation entries',
  'divergence: main\'s submit wrapper unconditionally resets the form and tears down isSubmitting only after onSubmit resolves (resetOnSubmitSuccess is ignored); samples are captured inside onSubmit and the fixture lets the lifecycle settle (frame + task, untimed) before the next submit, because the browser refuses requestSubmit() while the submit button is still disabled mid-lifecycle',
] as const;

interface CliOptions {
  readonly smoke: boolean;
  readonly only: readonly string[];
  readonly runs: number | undefined;
}

const USAGE = 'Usage: tsx tests/bench/lib/run-main.ts [--smoke] [--only <scenario-id>]... [--runs <n>]';

function failUsage(reason: string): never {
  console.error(`${reason}\n${USAGE}`);

  process.exit(1);
}

function parseArguments(argv: readonly string[]): CliOptions {
  const smoke = argv.includes('--smoke');
  const only: string[] = [];
  let runs: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--smoke') {
      continue;
    }

    if (argument === '--only') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('--')) {
        failUsage('--only requires a scenario id argument.');
      }

      only.push(value);
      index += 1;

      continue;
    }

    if (argument === '--runs') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('--')) {
        failUsage('--runs requires a positive integer argument.');
      }

      const parsed = Number.parseInt(value, 10);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        failUsage(`--runs expects a positive integer, received "${value}".`);
      }

      runs = parsed;
      index += 1;

      continue;
    }

    failUsage(`Unknown argument "${argument}".`);
  }

  return { smoke, only, runs };
}

function chromiumVersionFromUserAgent(userAgent: string): string {
  return /Chrome\/([\d.]+)/.exec(userAgent)?.[1] ?? 'unknown';
}

function withBrowserMetadata(
  environment: BenchEnvironment,
  chromiumUserAgent: string,
  agentBrowserVersion: string,
): BenchEnvironment {
  return {
    ...environment,
    versions: {
      ...environment.versions,
      'agent-browser': agentBrowserVersion,
      chromium: chromiumVersionFromUserAgent(chromiumUserAgent),
      viewport: BENCH_VIEWPORT_NOTE,
    },
  };
}

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

/**
 * Opens the scenario page on the MAIN fixture, asserts the page runs main's
 * pinned dependencies, then runs its operation loop in-page. Every result is
 * verified before its samples are trusted (same contract as the current
 * runner: exact field counts, workload landed in DOM and form state, every
 * submit reaching the consumer onSubmit).
 */
async function runBrowserScenario(
  driver: BenchBrowserDriver,
  scenario: BenchScenario,
  runs: number,
  environment: BenchEnvironment,
): Promise<{ stats: TimingStats; pageVersions: Readonly<Record<string, string>> }> {
  const match = /^(?:mount|typing|submit)-(\d+)$/.exec(scenario.id);
  const fieldCount = match === null ? Number.NaN : Number.parseInt(match[1] ?? '', 10);

  if (!Number.isInteger(fieldCount) || fieldCount <= 0) {
    throw new Error(`The main fixture serves no browser executor for scenario "${scenario.id}" in this phase.`);
  }

  await driver.openScenario(scenario.id);

  const pageVersions = await driver.readRuntimeVersions();

  assertDependencyIsolation(pageVersions, environment);

  const loopOptions = { warmupRuns: DEFAULT_WARMUP_RUNS, measuredRuns: runs };

  if (scenario.id.startsWith('mount-')) {
    const result = await driver.mountLoop(loopOptions);

    if (result.renderedFieldCount !== fieldCount) {
      throw new Error(
        `mount-${fieldCount} rendered ${result.renderedFieldCount} distinct labeled fields, expected ${fieldCount}.`,
      );
    }

    return { stats: summarize(result.samples), pageVersions };
  }

  if (scenario.id.startsWith('typing-')) {
    const typingText = createTypingText();
    const result = await driver.keystrokeLoop(TYPING_TARGET_FIELD, typingText, loopOptions);

    if (result.eventCount !== TYPING_EVENT_COUNT) {
      throw new Error(`typing-${fieldCount} dispatched ${result.eventCount} input events, expected ${TYPING_EVENT_COUNT}.`);
    }

    if (result.finalInputValue !== typingText) {
      throw new Error(
        `typing-${fieldCount} input value drifted: expected "${typingText.slice(0, 16)}...", received "${result.finalInputValue.slice(0, 16)}...".`,
      );
    }

    if (result.formValue !== typingText) {
      throw new Error(
        `typing-${fieldCount} never reached main's form state: form value for "${TYPING_TARGET_FIELD}" is ${JSON.stringify(result.formValue)}.`,
      );
    }

    return { stats: scaleStats(summarize(result.samples), 1 / result.eventCount), pageVersions };
  }

  const result = await driver.submitLoop(loopOptions);

  if (result.submitCount !== result.expectedSubmitCount) {
    throw new Error(
      `submit-${fieldCount}: only ${result.submitCount} of ${result.expectedSubmitCount} submits reached onSubmit (validation failed?).`,
    );
  }

  return { stats: summarize(result.samples), pageVersions };
}

/** parser-medium against main's FormedibleParser, imported from the worktree. */
function runParserScenario(runs: number): TimingStats {
  const code = createMediumParserConfig();
  const probeFieldCount = FormedibleParser.parse(code).fields?.length ?? 0;

  if (probeFieldCount !== MEDIUM_PARSER_FIELD_COUNT) {
    throw new Error(`parser-medium parsed ${probeFieldCount} fields via main's parser, expected ${MEDIUM_PARSER_FIELD_COUNT}.`);
  }

  const parseBatch = () => {
    for (let parse = 0; parse < PARSER_RUN_PARSE_COUNT; parse += 1) {
      FormedibleParser.parse(code);
    }
  };

  for (let warmup = 0; warmup < DEFAULT_WARMUP_RUNS; warmup += 1) {
    parseBatch();
  }

  const samples: number[] = [];

  for (let run = 0; run < runs; run += 1) {
    samples.push(timeNs(parseBatch));
  }

  return scaleStats(summarize(samples), 1 / (1_000_000 * PARSER_RUN_PARSE_COUNT));
}

async function main(): Promise<void> {
  const cli = parseArguments(process.argv.slice(2));
  const runs = cli.runs ?? (cli.smoke ? SMOKE_MEASURED_RUNS : DEFAULT_MEASURED_RUNS);
  const requestedIds =
    cli.only.length > 0
      ? cli.only.map((id) => getScenario(id).id)
      : cli.smoke
        ? SMOKE_SCENARIO_IDS
        : BENCH_SCENARIOS.map((scenario) => scenario.id);
  const nonCrossIds = requestedIds.filter((id) => getScenario(id).comparable !== 'cross');

  if (nonCrossIds.length > 0) {
    throw new Error(
      `The main baseline only runs cross-comparable scenarios; not comparable here: ${nonCrossIds.join(', ')}.`,
    );
  }

  const worktreeDirectory = assertBaselineReady();

  generateMainTsconfigs();
  console.log(`[bench:main] baseline worktree: ${worktreeDirectory}`);

  const browserScenarioIds = requestedIds.filter((id) => id !== PARSER_SCENARIO_ID);
  const nodeScenarioIds = requestedIds.filter((id) => id === PARSER_SCENARIO_ID);
  let environment = collectWorktreeEnvironment(worktreeDirectory);
  const records: BenchRecord[] = [];

  if (browserScenarioIds.length > 0) {
    console.log('[bench:main] building the main fixture (vite build, aliased to the worktree) ...');
    await buildBenchFixture('main-consumer');

    const preview = await startBenchPreview('main-consumer');

    console.log(`[bench:main] fixture preview: ${preview.origin}`);

    try {
      const driver = await createAgentBrowserDriver(BROWSER_SESSION, preview.origin);

      environment = withBrowserMetadata(environment, driver.chromiumUserAgent, await getAgentBrowserVersion());
      console.log(
        `[bench:main] agent-browser session "${BROWSER_SESSION}": chromium ${environment.versions['chromium'] ?? 'unknown'} @ viewport ${BENCH_VIEWPORT_NOTE}`,
      );

      for (const scenarioId of browserScenarioIds) {
        const scenario = getScenario(scenarioId);
        const outcome = await runBrowserScenario(driver, scenario, runs, environment);

        if (environment.versions[PAGE_REACT_FORM_KEY] === undefined) {
          environment = withInPageVersions(environment, outcome.pageVersions);
        }
        records.push(toRecord(scenario, outcome.stats, environment, browserNotes(scenario.id)));
        console.log(`[bench:main] ${scenario.id}: median ${roundTo(outcome.stats.median, 4)} ${scenario.unit}`);
      }

      console.log(
        `[bench:main] dependency isolation asserted in-page: @tanstack/react-form ${environment.versions[PAGE_REACT_FORM_KEY] ?? 'unknown'}, react ${environment.versions[PAGE_REACT_KEY] ?? 'unknown'}`,
      );
    } finally {
      await closeAgentBrowserSession(BROWSER_SESSION);
      await preview.stop();
      console.log('[bench:main] browser session closed; fixture preview stopped');
    }
  }

  for (const scenarioId of nodeScenarioIds) {
    const scenario = getScenario(scenarioId);
    const stats = runParserScenario(runs);

    records.push(toRecord(scenario, stats, environment, [NODE_MEDIUM_NOTE]));
    console.log(`[bench:main] ${scenario.id}: median ${roundTo(stats.median, 4)} ${scenario.unit}`);
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

function browserNotes(scenarioId: string): readonly string[] {
  return scenarioId.startsWith('submit-') ? [BROWSER_MEDIUM_NOTE, ...MAIN_SUBMIT_NOTES] : [BROWSER_MEDIUM_NOTE];
}

function toRecord(
  scenario: BenchScenario,
  stats: TimingStats,
  environment: BenchEnvironment,
  notes: readonly string[],
): BenchRecord {
  return {
    implementation: IMPLEMENTATION,
    gitSha: environment.gitSha,
    gitBranch: environment.gitBranch,
    versions: environment.versions,
    node: environment.node,
    scenario: scenario.id,
    metric: scenario.metric,
    unit: scenario.unit,
    median: roundTo(stats.median, 6),
    p75: roundTo(stats.p75, 6),
    min: roundTo(stats.min, 6),
    max: roundTo(stats.max, 6),
    runs: stats.runs,
    comparable: scenario.comparable,
    notes,
    timestamp: new Date().toISOString(),
  };
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));

  process.exit(1);
});
