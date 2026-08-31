import type { BenchEnvironment, BenchRecord } from './artifacts';
import {
  DEFAULT_WARMUP_RUNS,
  scaleStats,
  summarize,
  timeNs,
  type TimingStats,
} from './bench-timing';
import { roundTo } from './report-table';
import {
  ARRAY_ITEM_COUNT,
  LARGE_PARSER_FIELD_COUNT,
  MEMORY_CHECKPOINT_INTERVAL,
  MEMORY_INTERACTION_COUNT,
  MEDIUM_PARSER_FIELD_COUNT,
  PARSER_RUN_PARSE_COUNT,
  SMALL_PARSER_FIELD_COUNT,
  TYPING_EVENT_COUNT,
  createArrayOpSequence,
  createLargeParserConfig,
  createMediumParserConfig,
  createMemoryWorkload,
  createPageSwitchSequence,
  createSmallParserConfig,
  createTabSwitchSequence,
  createTypingText,
} from './scenarios/forms';
import {
  BENCH_SCENARIOS,
  SMOKE_SCENARIO_IDS,
  getScenario,
  type BenchScenario,
} from './scenarios/index';
import type { BenchImplementation } from './adapter-types';
import { executeMountVitalsScenario } from './browser-metrics';
import { executeStreamScenario } from './stream-bench';
import {
  BENCH_VIEWPORT_NOTE,
  buildBenchFixture,
  closeAgentBrowserSession,
  createAgentBrowserDriver,
  getAgentBrowserVersion,
  startBenchPreview,
  type BenchBrowserDriver,
  type BenchFixtureName,
} from '../utils/agent-browser';

/**
 * Shared runner glue for the benchmark runners (`run.ts` for the current
 * implementation, `run-main.ts` for the main baseline) — everything that is NOT
 * implementation wiring lives here exactly once: CLI parsing, scenario-id
 * resolution, browser-environment metadata, the fixture build/serve/session
 * lifecycle, the browser scenario executors with their result verification,
 * the node parser loop, artifact-record construction, and the memory math.
 *
 * The runners differ only in the parts the plan says they must: which fixture
 * is served, which environment collector feeds the artifact, which parser
 * module the node path imports, the main-baseline worktree readiness +
 * dependency-isolation assertion, and the implementation-specific divergence
 * notes attached to records. The CURRENT-ONLY §3.2 browser scenarios also
 * execute through `executeBrowserScenario` (`stream-100chunks` via
 * `stream-bench.ts`, `browser-mount-100` via `browser-metrics.ts`); the main
 * runner filters non-cross scenarios out of its default set before resolution,
 * so those dispatch arms are unreachable there.
 */

export interface BenchCliOptions {
  readonly smoke: boolean;
  readonly only: readonly string[];
  readonly runs: number | undefined;
}

export function parseBenchArguments(usage: string, argv: readonly string[]): BenchCliOptions {
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
        failUsage(usage, '--only requires a scenario id argument.');
      }

      only.push(value);
      index += 1;

      continue;
    }

    if (argument === '--runs') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('--')) {
        failUsage(usage, '--runs requires a positive integer argument.');
      }

      const parsed = Number.parseInt(value, 10);

      if (!Number.isInteger(parsed) || parsed <= 0) {
        failUsage(usage, `--runs expects a positive integer, received "${value}".`);
      }

      runs = parsed;
      index += 1;

      continue;
    }

    failUsage(usage, `Unknown argument "${argument}".`);
  }

  return { smoke, only, runs };
}

function failUsage(usage: string, reason: string): never {
  console.error(`${reason}\n${usage}`);

  process.exit(1);
}

/** Options for {@link resolveRequestedScenarioIds}. */
export interface ResolveScenarioOptions {
  /**
   * Include the `fullOnly` scenarios (the instrumentation extras and the
   * bundle build — `bench:full`). Explicit `--only` ids are never filtered.
   */
  readonly includeFullOnly?: boolean;
}

export function resolveRequestedScenarioIds(
  smoke: boolean,
  only: readonly string[],
  options: ResolveScenarioOptions = {},
): readonly string[] {
  if (only.length > 0) {
    return only.map((id) => getScenario(id).id);
  }

  const registryIds = smoke
    ? SMOKE_SCENARIO_IDS
    : BENCH_SCENARIOS.filter((scenario) => options.includeFullOnly === true || scenario.fullOnly !== true).map(
        (scenario) => scenario.id,
      );

  return registryIds;
}

export function isParserScenarioId(scenarioId: string): boolean {
  return scenarioId.startsWith('parser-');
}

function chromiumVersionFromUserAgent(userAgent: string): string {
  return /Chrome\/([\d.]+)/.exec(userAgent)?.[1] ?? 'unknown';
}

/** Browser-session state handed to a runner inside {@link withFixtureSession}. */
export interface BrowserSession {
  readonly driver: BenchBrowserDriver;
  /** The runner's environment with chromium/agent-browser/viewport metadata attached. */
  readonly environment: BenchEnvironment;
}

/**
 * Builds the committed fixture, serves it with `vite preview` on an allocated
 * port, opens the agent-browser session, and tears both down in `finally` — a
 * failing run never leaks processes or ports. With `reactDevtools: true` the
 * session launches with the react-devtools hook installed (the render-count
 * instrumentation extras only; timing scenarios never instrument).
 */
export async function withFixtureSession<T>(
  fixture: BenchFixtureName,
  session: string,
  logPrefix: string,
  baseEnvironment: BenchEnvironment,
  body: (browser: BrowserSession) => Promise<T>,
  options: { readonly reactDevtools?: boolean } = {},
): Promise<T> {
  console.log(`${logPrefix} building the committed fixture (vite build) ...`);
  await buildBenchFixture(fixture);

  const preview = await startBenchPreview(fixture);

  console.log(`${logPrefix} fixture preview: ${preview.origin}`);

  try {
    const driver = await createAgentBrowserDriver(session, preview.origin, { reactDevtools: options.reactDevtools });
    const environment: BenchEnvironment = {
      ...baseEnvironment,
      versions: {
        ...baseEnvironment.versions,
        'agent-browser': await getAgentBrowserVersion(),
        chromium: chromiumVersionFromUserAgent(driver.chromiumUserAgent),
        viewport: BENCH_VIEWPORT_NOTE,
      },
    };

    console.log(
      `${logPrefix} agent-browser session "${session}"${options.reactDevtools === true ? ' (react-devtools enabled)' : ''}: chromium ${environment.versions['chromium'] ?? 'unknown'} @ viewport ${BENCH_VIEWPORT_NOTE}`,
    );

    return await body({ driver, environment });
  } finally {
    await closeAgentBrowserSession(session);
    await preview.stop();
    console.log(`${logPrefix} browser session closed; fixture preview stopped`);
  }
}

/** One metric's timing samples for a scenario (units live in the registry). */
export interface ScenarioMetricStats {
  readonly metric: string;
  readonly stats: TimingStats;
}

export interface BrowserScenarioOutcome {
  readonly metrics: readonly ScenarioMetricStats[];
  readonly notes: readonly string[];
}

/**
 * Hook the main runner uses to assert DECISION-1 dependency isolation on every
 * fixture page the executor opens (current passes no hook).
 */
export type FixtureOpenedHook = (fixtureScenarioId: string) => Promise<void>;

const FLAT_SCENARIO_PATTERN = /^(?:mount|typing|submit)-(\d+)$/;
const TYPING_TARGET_FIELD = 'field001';
const ARRAY_FIELD_NAME = 'members';
const AUTOSAVE_METRIC_WITH = 'ms-per-keystroke-with-autosave';
const AUTOSAVE_METRIC_WITHOUT = 'ms-per-keystroke-without-autosave';
const AUTOSAVE_METRIC_OVERHEAD = 'autosave-overhead-ms';

/**
 * Opens the scenario's fixture page(s) and runs the in-page operation loop(s).
 * Every result is verified before its samples are trusted: mount must render
 * the exact field count, typing must land the workload in BOTH the DOM input
 * and the React form state, every submit must reach the consumer `onSubmit`,
 * switch/array sequences must produce one sample per op and end on the expected
 * index/count, and the memory loop must checkpoint the full workload.
 */
export async function executeBrowserScenario(
  driver: BenchBrowserDriver,
  scenarioId: string,
  runs: number,
  onFixtureOpened?: FixtureOpenedHook,
): Promise<BrowserScenarioOutcome> {
  const scenario = getScenario(scenarioId);
  const loopOptions = { warmupRuns: DEFAULT_WARMUP_RUNS, measuredRuns: runs };
  const openScenarioPage = async (fixtureScenarioId: string): Promise<void> => {
    await driver.openScenario(fixtureScenarioId);
    await onFixtureOpened?.(fixtureScenarioId);
  };

  const flatMatch = FLAT_SCENARIO_PATTERN.exec(scenarioId);
  const fieldCount = flatMatch === null ? Number.NaN : Number.parseInt(flatMatch[1] ?? '', 10);

  if (flatMatch !== null && Number.isInteger(fieldCount) && fieldCount > 0) {
    return executeFlatScenario(driver, scenario, fieldCount, loopOptions, openScenarioPage);
  }

  if (scenarioId === 'pageswitch-50') {
    const sequence = createPageSwitchSequence();
    const finalPage = sequence[sequence.length - 1];

    if (finalPage === undefined) {
      throw new Error('The page-switch sequence is empty.');
    }

    await openScenarioPage('paged');

    const result = await driver.switchPageSequenceLoop(sequence, loopOptions);

    if (result.samples.length !== sequence.length * runs) {
      throw new Error(
        `pageswitch-50 collected ${result.samples.length} switch samples, expected ${sequence.length * runs}.`,
      );
    }

    if (result.activeIndex !== finalPage) {
      throw new Error(`pageswitch-50 ended on page ${result.activeIndex}, expected ${finalPage}.`);
    }

    return {
      metrics: [{ metric: 'ms-per-switch', stats: summarize(result.samples) }],
      notes: [
        '50 switches = the [2, 3, 4, 5, 1] page walk repeated 10 times from page 1; every switch targets a page the form is not on (main\'s validation-gated setCurrentPage early-returns on same-page targets)',
        'each switch is timed through one animation-frame settle (requestAnimationFrame), so the sample includes the ~16.7ms frame budget; both implementations settle identically',
      ],
    };
  }

  if (scenarioId === 'tabswitch-50') {
    const sequence = createTabSwitchSequence();
    const finalTab = sequence[sequence.length - 1];

    if (finalTab === undefined) {
      throw new Error('The tab-switch sequence is empty.');
    }

    await openScenarioPage('tabbed');

    const result = await driver.switchTabSequenceLoop(sequence, loopOptions);

    if (result.samples.length !== sequence.length * runs) {
      throw new Error(
        `tabswitch-50 collected ${result.samples.length} switch samples, expected ${sequence.length * runs}.`,
      );
    }

    if (result.activeIndex !== finalTab) {
      throw new Error(`tabswitch-50 ended on tab index ${result.activeIndex}, expected ${finalTab}.`);
    }

    return {
      metrics: [{ metric: 'ms-per-switch', stats: summarize(result.samples) }],
      notes: [
        '40 switches = the [1, 2, 3, 0] tab walk repeated 10 times from tab 0 on the 4-tab, 50-field form',
        'each switch is timed through one animation-frame settle (requestAnimationFrame), so the sample includes the ~16.7ms frame budget; both implementations settle identically',
      ],
    };
  }

  if (scenarioId === 'array-50') {
    const ops = createArrayOpSequence();

    await openScenarioPage('array');

    const result = await driver.arraySequenceLoop(ARRAY_FIELD_NAME, ops, loopOptions);

    if (result.samples.length !== ops.length * runs) {
      throw new Error(`array-50 collected ${result.samples.length} op samples, expected ${ops.length * runs}.`);
    }

    if (result.itemCount !== ARRAY_ITEM_COUNT) {
      throw new Error(`array-50 ended with ${result.itemCount} items, expected ${ARRAY_ITEM_COUNT}.`);
    }

    return {
      metrics: [{ metric: 'ms-per-op', stats: summarize(result.samples) }],
      notes: [
        `40 ops = 20 adds (20 -> 40 items) then 20 removes of fixed item index 19 (40 -> 20 items) on the "${ARRAY_FIELD_NAME}" object array field`,
        'each op is timed through one animation-frame settle (requestAnimationFrame), so the sample includes the ~16.7ms frame budget; both implementations settle identically',
      ],
    };
  }

  if (scenarioId === 'autosave-50') {
    return executeAutosaveScenario(driver, runs, loopOptions, openScenarioPage);
  }

  if (scenarioId === 'memory-500') {
    return executeMemoryScenario(driver, openScenarioPage);
  }

  if (scenarioId === 'stream-100chunks') {
    return executeStreamScenario(driver, runs);
  }

  if (scenarioId === 'browser-mount-100') {
    return executeMountVitalsScenario(driver);
  }

  throw new Error(`No browser executor is registered for scenario "${scenarioId}".`);
}

type OpenScenarioPage = (fixtureScenarioId: string) => Promise<void>;

async function executeFlatScenario(
  driver: BenchBrowserDriver,
  scenario: BenchScenario,
  fieldCount: number,
  loopOptions: { readonly warmupRuns: number; readonly measuredRuns: number },
  openScenarioPage: OpenScenarioPage,
): Promise<BrowserScenarioOutcome> {
  await openScenarioPage(scenario.id);

  if (scenario.id.startsWith('mount-')) {
    const result = await driver.mountLoop(loopOptions);

    if (result.renderedFieldCount !== fieldCount) {
      throw new Error(
        `mount-${fieldCount} rendered ${result.renderedFieldCount} distinct named fields, expected ${fieldCount}.`,
      );
    }

    return { metrics: [{ metric: 'mount-ms', stats: summarize(result.samples) }], notes: [] };
  }

  if (scenario.id.startsWith('typing-')) {
    return {
      metrics: [{ metric: 'ms-per-keystroke', stats: await runTypingMeasurement(driver, loopOptions) }],
      notes: [],
    };
  }

  const result = await driver.submitLoop(loopOptions);

  if (result.submitCount !== result.expectedSubmitCount) {
    throw new Error(
      `submit-${fieldCount}: only ${result.submitCount} of ${result.expectedSubmitCount} submits reached onSubmit (validation failed?).`,
    );
  }

  return { metrics: [{ metric: 'submit-round-trip-ms', stats: summarize(result.samples) }], notes: [] };
}

/** Types the fixed workload into the target field and returns per-keystroke stats. */
async function runTypingMeasurement(
  driver: BenchBrowserDriver,
  loopOptions: { readonly warmupRuns: number; readonly measuredRuns: number },
): Promise<TimingStats> {
  const typingText = createTypingText();
  const result = await driver.keystrokeLoop(TYPING_TARGET_FIELD, typingText, loopOptions);

  if (result.eventCount !== TYPING_EVENT_COUNT) {
    throw new Error(`The typing workload dispatched ${result.eventCount} input events, expected ${TYPING_EVENT_COUNT}.`);
  }

  if (result.finalInputValue !== typingText) {
    throw new Error(
      `The typing input value drifted: expected "${typingText.slice(0, 16)}...", received "${result.finalInputValue.slice(0, 16)}...".`,
    );
  }

  if (result.formValue !== typingText) {
    throw new Error(
      `The typing workload never reached the form state: form value for "${TYPING_TARGET_FIELD}" is ${JSON.stringify(result.formValue)}.`,
    );
  }

  return scaleStats(summarize(result.samples), 1 / result.eventCount);
}

async function executeAutosaveScenario(
  driver: BenchBrowserDriver,
  runs: number,
  loopOptions: { readonly warmupRuns: number; readonly measuredRuns: number },
  openScenarioPage: OpenScenarioPage,
): Promise<BrowserScenarioOutcome> {
  await openScenarioPage('typing-50');

  const withoutAutosave = await runTypingMeasurement(driver, loopOptions);

  await openScenarioPage('persistent');

  const withAutosave = await runTypingMeasurement(driver, loopOptions);

  if (withAutosave.runs !== withoutAutosave.runs) {
    throw new Error(
      `autosave-50 measured ${withAutosave.runs} runs with autosave but ${withoutAutosave.runs} without; the sides must match.`,
    );
  }

  return {
    metrics: [
      { metric: AUTOSAVE_METRIC_WITH, stats: withAutosave },
      { metric: AUTOSAVE_METRIC_WITHOUT, stats: withoutAutosave },
      { metric: AUTOSAVE_METRIC_OVERHEAD, stats: subtractStats(withAutosave, withoutAutosave) },
    ],
    notes: [
      'with = the 50-field typing workload on the fixture page with persistence autosave (localStorage, debounceMs 0); without = the plain typing-50 page (identical form, no persistence configured)',
      'autosave-overhead-ms is the raw per-keystroke delta median(with) - median(without); negative values (autosave cheaper) are reported as-is, never abs()',
      `both sides measured ${runs} runs with ${loopOptions.warmupRuns} untimed warmup runs`,
    ],
  };
}

async function executeMemoryScenario(
  driver: BenchBrowserDriver,
  openScenarioPage: OpenScenarioPage,
): Promise<BrowserScenarioOutcome> {
  const workload = createMemoryWorkload();

  await openScenarioPage('memory');

  const result = await driver.memoryLoop(workload);
  const expectedCheckpoints = Math.floor(MEMORY_INTERACTION_COUNT / MEMORY_CHECKPOINT_INTERVAL) + 1;

  if (result.opCount !== MEMORY_INTERACTION_COUNT) {
    throw new Error(`memory-500 executed ${result.opCount} interactions, expected ${MEMORY_INTERACTION_COUNT}.`);
  }

  if (result.checkpoints.length !== expectedCheckpoints) {
    throw new Error(
      `memory-500 recorded ${result.checkpoints.length} heap checkpoints, expected ${expectedCheckpoints} (one per ${MEMORY_CHECKPOINT_INTERVAL} interactions plus the baseline).`,
    );
  }

  const baseline = result.checkpoints[0];
  const finalCheckpoint = result.checkpoints[result.checkpoints.length - 1];

  if (baseline === undefined || finalCheckpoint === undefined) {
    throw new Error('memory-500 recorded no heap checkpoints.');
  }

  const growthMb = finalCheckpoint.heapMb - baseline.heapMb;
  const slopeMbPerHundredInteractions =
    leastSquaresSlope(result.checkpoints.map((checkpoint) => ({ x: checkpoint.interactions, y: checkpoint.heapMb }))) *
    100;
  const checkpointSummary = result.checkpoints
    .map((checkpoint) => `${checkpoint.interactions}:${roundTo(checkpoint.heapMb, 2)}MB`)
    .join(', ');

  const heapCaveat =
    result.apiName === 'performance.measureUserAgentSpecificMemory'
      ? 'the browser may collect garbage before each measurement (implementation-defined); the harness itself never forces GC'
      : "this legacy counter is bucketed and only refreshes at the browser's own GC/accounting points, so readings are an upper bound on retained growth and small leaks may not resolve; the harness never forces GC";

  return {
    metrics: [
      { metric: 'heap-growth-mb', stats: summarize([growthMb]) },
      { metric: 'mb-per-100-interactions', stats: summarize([slopeMbPerHundredInteractions]) },
    ],
    notes: [
      `heap api: ${result.apiName} (in-page; ${heapCaveat})`,
      'single continuous 500-interaction session per run; repeated sessions in one page would understate retained growth, so N-run medians do not apply here (runs = 1)',
      'workload: 200 types + 100 page switches + 100 array adds + 100 removes; every add is paired with a remove so the live form state returns to its baseline each cycle (growth measures retained memory, not growing user data)',
      `heap checkpoints (interactions:mb): ${checkpointSummary}`,
    ],
  };
}

/** Element-wise difference of two sample summaries (raw deltas, never abs). */
export function subtractStats(minuend: TimingStats, subtrahend: TimingStats): TimingStats {
  return {
    median: minuend.median - subtrahend.median,
    p75: minuend.p75 - subtrahend.p75,
    min: minuend.min - subtrahend.min,
    max: minuend.max - subtrahend.max,
    runs: minuend.runs,
  };
}

/** Least-squares slope of y over x (used for the memory retained-growth slope). */
export function leastSquaresSlope(points: readonly { readonly x: number; readonly y: number }[]): number {
  if (points.length < 2) {
    throw new Error('A least-squares slope needs at least two points.');
  }

  const meanX = points.reduce((total, point) => total + point.x, 0) / points.length;
  const meanY = points.reduce((total, point) => total + point.y, 0) / points.length;

  let covariance = 0;
  let varianceX = 0;

  for (const point of points) {
    covariance += (point.x - meanX) * (point.y - meanY);
    varianceX += (point.x - meanX) ** 2;
  }

  if (varianceX === 0) {
    throw new Error('A least-squares slope needs distinct x values.');
  }

  return covariance / varianceX;
}

/**
 * The node-side parser surface both implementations expose (`FormedibleParser`
 * from the current repo source for `run.ts`, from the baseline worktree for
 * `run-main.ts`). Only what the throughput loop needs is declared.
 */
export interface BenchParserSurface {
  parse(code: string): { readonly fields?: readonly unknown[] };
}

interface ParserWorkload {
  readonly code: string;
  readonly expectedFieldCount: number;
}

const PARSER_WORKLOADS: Readonly<Record<string, ParserWorkload>> = {
  'parser-small': { code: createSmallParserConfig(), expectedFieldCount: SMALL_PARSER_FIELD_COUNT },
  'parser-medium': { code: createMediumParserConfig(), expectedFieldCount: MEDIUM_PARSER_FIELD_COUNT },
  'parser-large': { code: createLargeParserConfig(), expectedFieldCount: LARGE_PARSER_FIELD_COUNT },
};

/** Runs one parser throughput scenario in-process (node, no DOM). */
export function runParserScenario(
  parser: BenchParserSurface,
  scenarioId: string,
  runs: number,
): readonly ScenarioMetricStats[] {
  const workload = PARSER_WORKLOADS[scenarioId];

  if (workload === undefined) {
    throw new Error(`No parser workload is registered for scenario "${scenarioId}".`);
  }

  const probeFieldCount = parser.parse(workload.code).fields?.length ?? 0;

  if (probeFieldCount !== workload.expectedFieldCount) {
    throw new Error(
      `${scenarioId} parsed ${probeFieldCount} fields, expected ${workload.expectedFieldCount}.`,
    );
  }

  const parseBatch = () => {
    for (let parse = 0; parse < PARSER_RUN_PARSE_COUNT; parse += 1) {
      parser.parse(workload.code);
    }
  };

  for (let warmup = 0; warmup < DEFAULT_WARMUP_RUNS; warmup += 1) {
    parseBatch();
  }

  const runSamplesNs: number[] = [];

  for (let run = 0; run < runs; run += 1) {
    runSamplesNs.push(timeNs(parseBatch));
  }

  const msPerParse = scaleStats(summarize(runSamplesNs), 1 / (1_000_000 * PARSER_RUN_PARSE_COUNT));
  const parsesPerSec = summarize(
    runSamplesNs.map((sampleNs) => PARSER_RUN_PARSE_COUNT / (sampleNs / 1_000_000_000)),
  );

  return [
    { metric: 'ms-per-parse', stats: msPerParse },
    { metric: 'parses-per-sec', stats: parsesPerSec },
  ];
}

/**
 * Builds one artifact record per registered metric of a scenario, in registry
 * order — the registry is the single source of truth for metric names and
 * units, so a scenario that produced an unregistered (or missing) metric fails
 * loudly here.
 */
export function buildScenarioRecords(
  implementation: BenchImplementation,
  scenarioId: string,
  metrics: readonly ScenarioMetricStats[],
  environment: BenchEnvironment,
  notes: readonly string[],
): readonly BenchRecord[] {
  const scenario = getScenario(scenarioId);

  return scenario.metrics.map((spec) => {
    const produced = metrics.find((candidate) => candidate.metric === spec.name);

    if (produced === undefined) {
      throw new Error(`Scenario "${scenario.id}" produced no samples for metric "${spec.name}".`);
    }

    return {
      implementation,
      gitSha: environment.gitSha,
      gitBranch: environment.gitBranch,
      versions: environment.versions,
      node: environment.node,
      scenario: scenario.id,
      metric: spec.name,
      unit: spec.unit,
      median: roundTo(produced.stats.median, 6),
      p75: roundTo(produced.stats.p75, 6),
      min: roundTo(produced.stats.min, 6),
      max: roundTo(produced.stats.max, 6),
      runs: produced.stats.runs,
      comparable: scenario.comparable,
      notes,
      timestamp: new Date().toISOString(),
    };
  });
}

/** Prints one stdout line per produced metric, unit included from the registry. */
export function logScenarioMetrics(
  logPrefix: string,
  scenarioId: string,
  metrics: readonly ScenarioMetricStats[],
): void {
  const units = new Map(getScenario(scenarioId).metrics.map((spec) => [spec.name, spec.unit] as const));

  for (const metric of metrics) {
    const unit = units.get(metric.metric);

    console.log(
      `${logPrefix} ${scenarioId} [${metric.metric}]: median ${roundTo(metric.stats.median, 4)}${unit === undefined ? '' : ` ${unit}`}`,
    );
  }
}
