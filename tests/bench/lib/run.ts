import { FormedibleParser } from '../../../packages/formedible-parser/src';

import { collectCurrentEnvironment, writeRunArtifact, type BenchEnvironment, type BenchRecord } from './artifacts';
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
  buildCurrentConsumerFixture,
  closeAgentBrowserSession,
  createAgentBrowserDriver,
  getAgentBrowserVersion,
  startCurrentConsumerPreview,
  type BenchBrowserDriver,
} from '../utils/agent-browser';

/**
 * Current-implementation benchmark runner (real Chromium via agent-browser is
 * the ONLY UI timing medium — DECISION-2 revised; node stays for the DOM-free
 * parser scenario).
 *
 * Per run: build the committed fixture (`vite build`), serve it with
 * `vite preview` on an allocated port, open each scenario page with
 * agent-browser, execute the warmup + measured operation loops IN-PAGE
 * (`performance.now()` sampling, samples returned to this runner), summarize
 * the samples with the shared `bench-timing.ts` statistics, print the results
 * table, and write one artifact under `tests/bench/results/runs/`. The preview
 * server and the browser session are torn down in `finally` so a failing run
 * never leaks processes or ports.
 *
 * CLI: `--smoke` (DECISION-3 subset, N=5), `--only <scenario-id>` (repeatable),
 * `--runs <n>`. Timed scenarios always execute 3 warmup runs before the
 * measured runs; medians are nearest-rank over the measured samples.
 */

const IMPLEMENTATION: BenchImplementation = 'current';
const BROWSER_SESSION = 'formedible-bench-current';
const PARSER_SCENARIO_ID = 'parser-medium';
const TYPING_TARGET_FIELD = 'field001';
const MEDIUM_PARSER_FIELD_COUNT = 25;

const BROWSER_MEDIUM_NOTE = 'medium: chromium (agent-browser, in-page performance.now() loops)';
const NODE_MEDIUM_NOTE = 'medium: node (no DOM)';

interface CliOptions {
  readonly smoke: boolean;
  readonly only: readonly string[];
  readonly runs: number | undefined;
}

const USAGE = 'Usage: tsx tests/bench/lib/run.ts [--smoke] [--only <scenario-id>]... [--runs <n>]';

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
 * Opens the scenario page and runs its operation loop in-page. Every result is
 * verified before its samples are trusted: mount must render the exact field
 * count, typing must land the workload in BOTH the DOM input and the React
 * form state, and every submit must reach the consumer `onSubmit`.
 */
async function runBrowserScenario(
  driver: BenchBrowserDriver,
  scenario: BenchScenario,
  runs: number,
): Promise<TimingStats> {
  const match = /^(?:mount|typing|submit)-(\d+)$/.exec(scenario.id);
  const fieldCount = match === null ? Number.NaN : Number.parseInt(match[1] ?? '', 10);

  if (!Number.isInteger(fieldCount) || fieldCount <= 0) {
    throw new Error(`No browser executor is registered for scenario "${scenario.id}" in this phase.`);
  }

  await driver.openScenario(scenario.id);

  const loopOptions = { warmupRuns: DEFAULT_WARMUP_RUNS, measuredRuns: runs };

  if (scenario.id.startsWith('mount-')) {
    const result = await driver.mountLoop(loopOptions);

    if (result.renderedFieldCount !== fieldCount) {
      throw new Error(
        `mount-${fieldCount} rendered ${result.renderedFieldCount} distinct named fields, expected ${fieldCount}.`,
      );
    }

    return summarize(result.samples);
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
        `typing-${fieldCount} never reached the React form state: form value for "${TYPING_TARGET_FIELD}" is ${JSON.stringify(result.formValue)}.`,
      );
    }

    return scaleStats(summarize(result.samples), 1 / result.eventCount);
  }

  const result = await driver.submitLoop(loopOptions);

  if (result.submitCount !== result.expectedSubmitCount) {
    throw new Error(
      `submit-${fieldCount}: only ${result.submitCount} of ${result.expectedSubmitCount} submits reached onSubmit (validation failed?).`,
    );
  }

  return summarize(result.samples);
}

function runParserScenario(runs: number): TimingStats {
  const code = createMediumParserConfig();
  const probeFieldCount = FormedibleParser.parse(code).fields?.length ?? 0;

  if (probeFieldCount !== MEDIUM_PARSER_FIELD_COUNT) {
    throw new Error(`parser-medium parsed ${probeFieldCount} fields, expected ${MEDIUM_PARSER_FIELD_COUNT}.`);
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
  const browserScenarioIds = requestedIds.filter((id) => id !== PARSER_SCENARIO_ID);
  const nodeScenarioIds = requestedIds.filter((id) => id === PARSER_SCENARIO_ID);
  let environment = collectCurrentEnvironment();
  const records: BenchRecord[] = [];

  if (browserScenarioIds.length > 0) {
    console.log('[bench] building the committed fixture (vite build) ...');
    await buildCurrentConsumerFixture();

    const preview = await startCurrentConsumerPreview();

    console.log(`[bench] fixture preview: ${preview.origin}`);

    try {
      const driver = await createAgentBrowserDriver(BROWSER_SESSION, preview.origin);

      environment = withBrowserMetadata(environment, driver.chromiumUserAgent, await getAgentBrowserVersion());
      console.log(
        `[bench] agent-browser session "${BROWSER_SESSION}": chromium ${environment.versions['chromium'] ?? 'unknown'} @ viewport ${BENCH_VIEWPORT_NOTE}`,
      );

      for (const scenarioId of browserScenarioIds) {
        const scenario = getScenario(scenarioId);
        const stats = await runBrowserScenario(driver, scenario, runs);

        records.push(toRecord(scenario, stats, environment, [BROWSER_MEDIUM_NOTE]));
        console.log(`[bench] ${scenario.id}: median ${roundTo(stats.median, 4)} ${scenario.unit}`);
      }
    } finally {
      await closeAgentBrowserSession(BROWSER_SESSION);
      await preview.stop();
      console.log('[bench] browser session closed; fixture preview stopped');
    }
  }

  for (const scenarioId of nodeScenarioIds) {
    const scenario = getScenario(scenarioId);
    const stats = runParserScenario(runs);

    records.push(toRecord(scenario, stats, environment, [NODE_MEDIUM_NOTE]));
    console.log(`[bench] ${scenario.id}: median ${roundTo(stats.median, 4)} ${scenario.unit}`);
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
