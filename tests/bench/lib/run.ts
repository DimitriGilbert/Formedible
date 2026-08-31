import { FormedibleParser } from '../../../packages/formedible-parser/src';

import { collectCurrentEnvironment, writeRunArtifact, type BenchEnvironment, type BenchRecord } from './artifacts';
import { DEFAULT_MEASURED_RUNS, DEFAULT_WARMUP_RUNS, SMOKE_MEASURED_RUNS } from './bench-timing';
import { executeBundleScenario } from './bundle-size';
import { executeTypingInstrumentationScenario } from './browser-metrics';
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
import type { BenchImplementation } from './adapter-types';

/**
 * Current-implementation benchmark runner (real Chromium via agent-browser is
 * the ONLY UI timing medium — DECISION-2 revised; node stays for the DOM-free
 * parser scenarios and the bundle build). Everything both runners share (CLI,
 * fixture lifecycle, scenario execution + verification, parser loop, record
 * building) lives in `run-common.ts`; this file wires that glue to the CURRENT
 * implementation: the `current-consumer` fixture, the repo's own environment,
 * and `FormedibleParser` from `packages/formedible-parser/src`.
 *
 * CLI: `--smoke` (DECISION-3 subset, N=5), `--full` (everything incl. the
 * current-only instrumentation extras and the bundle build — `bench:full`),
 * `--only <scenario-id>` (repeatable, always overrides the default set),
 * `--runs <n>`. Timed scenarios always execute 3 warmup runs before the
 * measured runs; medians are nearest-rank over the measured samples.
 *
 * Scenario routing:
 * - timing + streaming + vitals scenarios → one UN-instrumented session over
 *   the fixture (the vitals scenario runs last: its fresh-load navigation
 *   moves the session's page);
 * - `browser-typing-50` → a SECOND session launched with the react-devtools
 *   hook (instrumentation never shares a session with timing, risk #7);
 * - `bundle-minimal` → node-side vite build of the minimal fixture;
 * - `parser-*` → node-side parser loop.
 */

const IMPLEMENTATION: BenchImplementation = 'current';
const BROWSER_SESSION = 'formedible-bench-current';
const INSTRUMENTED_BROWSER_SESSION = 'formedible-bench-current-devtools';
const LOG_PREFIX = '[bench]';
const BUNDLE_SCENARIO_ID = 'bundle-minimal';
const TYPING_INSTRUMENTATION_SCENARIO_ID = 'browser-typing-50';
const VITALS_SCENARIO_ID = 'browser-mount-100';

const USAGE =
  'Usage: tsx tests/bench/lib/run.ts [--smoke | --full] [--only <scenario-id>]... [--runs <n>]';

const BROWSER_MEDIUM_NOTE = 'medium: chromium (agent-browser, in-page performance.now() loops)';
const INSTRUMENTED_MEDIUM_NOTE =
  'medium: chromium (agent-browser, react-devtools render counting + Chrome DevTools profiler on real keyboard input)';
const NODE_MEDIUM_NOTE = 'medium: node (no DOM)';
const BUNDLE_MEDIUM_NOTE = 'medium: vite build (node, no browser)';

async function main(): Promise<void> {
  // `--full` is a current-runner flag (the main baseline has no extras), so it
  // is claimed here and kept out of the shared parser.
  const rawArgv = process.argv.slice(2);
  const full = rawArgv.includes('--full');
  const cli = parseBenchArguments(
    USAGE,
    rawArgv.filter((argument) => argument !== '--full'),
  );

  if (cli.smoke && full) {
    console.error(
      `--smoke (DECISION-3 fast subset) and --full (everything incl. instrumentation extras and bundle) are mutually exclusive.\n${USAGE}`,
    );

    process.exit(1);
  }

  const runs = cli.runs ?? (cli.smoke ? SMOKE_MEASURED_RUNS : DEFAULT_MEASURED_RUNS);
  const requestedIds = resolveRequestedScenarioIds(cli.smoke, cli.only, { includeFullOnly: full });
  const nodeScenarioIds = requestedIds.filter((id) => isParserScenarioId(id));
  const bundleScenarioIds = requestedIds.filter((id) => id === BUNDLE_SCENARIO_ID);
  const instrumentedScenarioIds = requestedIds.filter((id) => id === TYPING_INSTRUMENTATION_SCENARIO_ID);
  // The vitals scenario navigates the session page with fresh loads, so it
  // runs after every other browser scenario of the shared session.
  const browserScenarioIds = requestedIds
    .filter((id) => !isParserScenarioId(id) && id !== BUNDLE_SCENARIO_ID && id !== TYPING_INSTRUMENTATION_SCENARIO_ID)
    .flatMap((id) => (id === VITALS_SCENARIO_ID ? [] : [id]));
  const vitalsScenarioIds = requestedIds.filter((id) => id === VITALS_SCENARIO_ID);
  const orderedBrowserScenarioIds = [...browserScenarioIds, ...vitalsScenarioIds];
  const baseEnvironment = collectCurrentEnvironment();
  let environment: BenchEnvironment = baseEnvironment;
  const records: BenchRecord[] = [];

  if (orderedBrowserScenarioIds.length > 0) {
    await withFixtureSession('current-consumer', BROWSER_SESSION, LOG_PREFIX, baseEnvironment, async (browser) => {
      environment = browser.environment;

      for (const scenarioId of orderedBrowserScenarioIds) {
        const outcome = await executeBrowserScenario(browser.driver, scenarioId, runs);

        records.push(...buildScenarioRecords(IMPLEMENTATION, scenarioId, outcome.metrics, environment, [
          BROWSER_MEDIUM_NOTE,
          ...outcome.notes,
        ]));
        logScenarioMetrics(LOG_PREFIX, scenarioId, outcome.metrics);
      }
    });
  }

  if (instrumentedScenarioIds.length > 0) {
    await withFixtureSession(
      'current-consumer',
      INSTRUMENTED_BROWSER_SESSION,
      LOG_PREFIX,
      baseEnvironment,
      async (browser) => {
        environment = browser.environment;

        for (const scenarioId of instrumentedScenarioIds) {
          const outcome = await executeTypingInstrumentationScenario(browser.driver);

          records.push(...buildScenarioRecords(IMPLEMENTATION, scenarioId, outcome.metrics, environment, [
            INSTRUMENTED_MEDIUM_NOTE,
            ...outcome.notes,
          ]));
          logScenarioMetrics(LOG_PREFIX, scenarioId, outcome.metrics);
        }
      },
      { reactDevtools: true },
    );
  }

  for (const scenarioId of bundleScenarioIds) {
    const result = await executeBundleScenario();

    records.push(...buildScenarioRecords(IMPLEMENTATION, scenarioId, result.metrics, environment, [
      BUNDLE_MEDIUM_NOTE,
      ...result.notes,
    ]));
    logScenarioMetrics(LOG_PREFIX, scenarioId, result.metrics);
  }

  for (const scenarioId of nodeScenarioIds) {
    const metrics = runParserScenario(FormedibleParser, scenarioId, runs);

    records.push(...buildScenarioRecords(IMPLEMENTATION, scenarioId, metrics, environment, [NODE_MEDIUM_NOTE]));
    logScenarioMetrics(LOG_PREFIX, scenarioId, metrics);
  }

  printReport(IMPLEMENTATION, records, environment, {
    mode: cli.smoke ? 'smoke' : full ? 'full+extras' : 'full',
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
