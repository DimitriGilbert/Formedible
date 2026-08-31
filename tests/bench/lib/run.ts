import { FormedibleParser } from '../../../packages/formedible-parser/src';

import { currentAdapter } from './adapter-current';
import {
  DEFAULT_MEASURED_RUNS,
  DEFAULT_WARMUP_RUNS,
  SMOKE_MEASURED_RUNS,
  summarize,
  scaleStats,
  timeNs,
  type TimingStats,
} from './bench-timing';
import { collectCurrentEnvironment, writeRunArtifact, type BenchEnvironment, type BenchRecord } from './artifacts';
import {
  BENCH_SCENARIOS,
  SMOKE_SCENARIO_IDS,
  getScenario,
  type BenchScenario,
} from './scenarios/index';
import {
  PARSER_RUN_PARSE_COUNT,
  TYPING_EVENT_COUNT,
  createDefaultValues,
  createMediumParserConfig,
  createSubmitSchema,
  createTextHeavyFields,
  createTypingText,
  createValidValues,
} from './scenarios/forms';

/**
 * Current-implementation benchmark runner (jsdom in-process, headless — no dev
 * server). Prints a results table to stdout and writes one run artifact under
 * `tests/bench/results/runs/`.
 *
 * CLI: `--smoke` (DECISION-3 subset, N=5), `--only <scenario-id>` (repeatable),
 * `--runs <n>`. Timed scenarios always execute 3 warmup runs before the
 * measured runs; medians are nearest-rank over the measured samples.
 */

const TYPING_TARGET_FIELD = 'field001';
const MEDIUM_PARSER_FIELD_COUNT = 25;

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

async function mountUnmountCycle(mount: () => Promise<{ readonly root: { unmount(): void } }>): Promise<void> {
  const mounted = await mount();

  mounted.root.unmount();
}

async function runMountScenario(fieldCount: number, runs: number): Promise<TimingStats> {
  const fields = createTextHeavyFields(fieldCount);
  const mountOptions = { fields, defaultValues: createDefaultValues(fields) };
  const mount = () => currentAdapter.mountForm(mountOptions);

  for (let warmup = 0; warmup < DEFAULT_WARMUP_RUNS; warmup += 1) {
    await mountUnmountCycle(mount);
  }

  const samples: number[] = [];

  for (let run = 0; run < runs; run += 1) {
    const mounted = await mount();
    const renderedFieldCount = mounted.getRenderedFieldCount();

    if (renderedFieldCount !== fieldCount) {
      mounted.root.unmount();

      throw new Error(`mount-${fieldCount} rendered ${renderedFieldCount} distinct named fields, expected ${fieldCount}.`);
    }

    samples.push(mounted.mountMs);
    mounted.root.unmount();
  }

  return summarize(samples);
}

async function runTypingScenario(fieldCount: number, runs: number): Promise<TimingStats> {
  const fields = createTextHeavyFields(fieldCount);
  const typingText = createTypingText();
  const mount = () => currentAdapter.mountForm({ fields, defaultValues: createDefaultValues(fields) });

  for (let warmup = 0; warmup < DEFAULT_WARMUP_RUNS; warmup += 1) {
    const mounted = await mount();

    await mounted.keystroke(TYPING_TARGET_FIELD, typingText);
    mounted.root.unmount();
  }

  const samples: number[] = [];

  for (let run = 0; run < runs; run += 1) {
    const mounted = await mount();
    const elapsedMs = await mounted.keystroke(TYPING_TARGET_FIELD, typingText);

    samples.push(elapsedMs);
    mounted.root.unmount();
  }

  return scaleStats(summarize(samples), 1 / TYPING_EVENT_COUNT);
}

async function runSubmitScenario(fieldCount: number, runs: number): Promise<TimingStats> {
  const fields = createTextHeavyFields(fieldCount);
  const schema = createSubmitSchema(fields);
  const validValues = createValidValues(fields);
  let submitCount = 0;
  const mount = () =>
    currentAdapter.mountForm({
      fields,
      defaultValues: validValues,
      schema,
      onSubmit: () => {
        submitCount += 1;
      },
    });

  for (let warmup = 0; warmup < DEFAULT_WARMUP_RUNS; warmup += 1) {
    const mounted = await mount();
    const submitsBefore = submitCount;

    await mounted.submit();

    if (submitCount === submitsBefore) {
      mounted.root.unmount();

      throw new Error(`submit-${fieldCount} warmup submit never reached onSubmit.`);
    }

    mounted.root.unmount();
  }

  const samples: number[] = [];

  for (let run = 0; run < runs; run += 1) {
    const mounted = await mount();
    const submitsBefore = submitCount;
    const elapsedMs = await mounted.submit();

    if (submitCount === submitsBefore) {
      mounted.root.unmount();

      throw new Error(`submit-${fieldCount} measured submit never reached onSubmit.`);
    }

    samples.push(elapsedMs);
    mounted.root.unmount();
  }

  return summarize(samples);
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

async function runScenario(scenario: BenchScenario, runs: number): Promise<TimingStats> {
  if (scenario.id === 'parser-medium') {
    return runParserScenario(runs);
  }

  const match = /^(?:mount|typing|submit)-(\d+)$/.exec(scenario.id);
  const fieldCount = match === null ? Number.NaN : Number.parseInt(match[1] ?? '', 10);

  if (!Number.isInteger(fieldCount) || fieldCount <= 0) {
    throw new Error(`No executor is registered for scenario "${scenario.id}" in this phase.`);
  }

  if (scenario.id.startsWith('mount-')) {
    return runMountScenario(fieldCount, runs);
  }

  if (scenario.id.startsWith('typing-')) {
    return runTypingScenario(fieldCount, runs);
  }

  return runSubmitScenario(fieldCount, runs);
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
  const environment = collectCurrentEnvironment();
  const records: BenchRecord[] = [];

  for (const scenarioId of requestedIds) {
    const scenario = getScenario(scenarioId);
    const stats = await runScenario(scenario, runs);

    records.push(toRecord(scenario, stats, environment));
  }

  printReport(records, environment, { mode: cli.smoke ? 'smoke' : 'full', runs, only: cli.only });

  const artifactFile = writeRunArtifact(currentAdapter.implementation, records);

  console.log(`Artifact written: ${artifactFile}`);
}

function toRecord(scenario: BenchScenario, stats: TimingStats, environment: BenchEnvironment): BenchRecord {
  return {
    implementation: currentAdapter.implementation,
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
    notes: [],
    timestamp: new Date().toISOString(),
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function formatNumber(value: number): string {
  return value.toFixed(4);
}

function printReport(
  records: readonly BenchRecord[],
  environment: BenchEnvironment,
  options: { readonly mode: 'smoke' | 'full'; readonly runs: number; readonly only: readonly string[] },
): void {
  const versions = Object.entries(environment.versions)
    .map(([name, version]) => `${name} ${version}`)
    .join(' | ');

  console.log(`Formedible benchmark — implementation: ${currentAdapter.implementation}`);
  console.log(`node ${environment.node} | branch ${environment.gitBranch} | sha ${environment.gitSha}`);
  console.log(versions);
  console.log(
    `mode: ${options.mode}${options.only.length > 0 ? ` (--only ${options.only.join(', ')})` : ''} | measured runs: ${options.runs} | warmup runs: ${DEFAULT_WARMUP_RUNS}`,
  );
  console.log('');

  const header = ['scenario', 'metric', 'unit', 'median', 'p75', 'min', 'max', 'runs'];
  const rows = records.map((record) => [
    record.scenario,
    record.metric,
    record.unit,
    formatNumber(record.median),
    formatNumber(record.p75),
    formatNumber(record.min),
    formatNumber(record.max),
    String(record.runs),
  ]);
  const widths = header.map((title, columnIndex) =>
    Math.max(title.length, ...rows.map((row) => row[columnIndex]?.length ?? 0)),
  );
  const formatRow = (row: readonly string[]): string =>
    row
      .map((cell, columnIndex) => (columnIndex < 3 ? cell.padEnd(widths[columnIndex] ?? 0) : cell.padStart(widths[columnIndex] ?? 0)))
      .join('  ')
      .trimEnd();

  console.log(formatRow(header));

  for (const row of rows) {
    console.log(formatRow(row));
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));

  process.exit(1);
});
