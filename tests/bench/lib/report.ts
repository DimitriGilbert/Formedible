import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readNewestRunArtifact,
  readRunArtifact,
  type BenchEnvironment,
  type BenchRecord,
  type RunArtifact,
} from './artifacts';
import { BENCH_SCENARIOS, getScenario, type BenchMetricSpec, type BenchScenario } from './scenarios/index';

/**
 * Phase 4 compare / report / regression-gate script (PERF-BENCHMARK-PLAN.md
 * §Phase 4, DECISION-4 + DECISION-7).
 *
 * Modes:
 * - `--mode current-vs-main`: newest current run artifact vs. newest main run
 *   artifact, cross-comparable scenarios only. INFORMATIONAL — no thresholds
 *   are applied; exit 0 unless an artifact is missing (then 2).
 * - `--mode current-vs-reference`: newest current run artifact vs. the
 *   committed `tests/bench/results/reference.json` under DECISION-7 thresholds
 *   (headline metric >10% or secondary metric >25% regression exits 1);
 *   `--allow-regression` downgrades failures to warnings.
 *
 * Standalone operation: `--update-reference` snapshots the newest current
 * artifact's records to the committed reference file (explicit flag guard, no
 * other flags accepted alongside).
 *
 * Exit codes: 0 pass | 1 regression | 2 usage / missing-artifact error.
 *
 * Design notes this report honors (BENCH-FINDINGS): memory-500 heap rows and
 * autosave-50 `autosave-overhead-ms` are informational and NEVER gated
 * (GC sign-flips / sub-noise-floor deltas); parser rows only gate when both
 * sides are full-registry runs (parser medians are order-sensitive in
 * `--only`/subset runs); the `autosave-overhead-ms` min/max cells are hidden
 * (element-wise differences of two independent sample sets are not a
 * realizable spread); every row is labeled with its measurement medium so
 * browser-collected and node-collected numbers are never confused.
 */

const USAGE = [
  'Usage: tsx tests/bench/lib/report.ts --mode <current-vs-main|current-vs-reference> [--reference <file>] [--allow-regression]',
  '       tsx tests/bench/lib/report.ts --update-reference',
].join('\n');

type ReportMode = 'current-vs-main' | 'current-vs-reference';
type MetricClassification = 'headline' | 'secondary' | 'informational';
type Verdict = 'PASS' | 'FAIL' | 'WARN' | 'MISSING' | 'N/A' | 'BETTER' | 'WORSE' | 'EVEN';

/** DECISION-7: a headline metric regressing beyond this fails the run. */
const HEADLINE_REGRESSION_THRESHOLD_PERCENT = 10;
/** DECISION-7: a secondary metric regressing beyond this fails the run. */
const SECONDARY_REGRESSION_THRESHOLD_PERCENT = 25;

/**
 * DECISION-7 headline rows: the primary metrics of `mount-100`, `typing-50`,
 * `submit-100`, and `bundle-minimal` (both bundle metrics are that scenario's
 * primary payload metrics). Keys are `<scenario-id>/<metric-name>`.
 */
const HEADLINE_METRIC_KEYS: readonly string[] = [
  'mount-100/mount-ms',
  'typing-50/ms-per-keystroke',
  'submit-100/submit-round-trip-ms',
  'bundle-minimal/bundle-bytes-raw',
  'bundle-minimal/bundle-bytes-gzip',
];

/**
 * Informational rows that print and WARN but never gate: the memory-500 heap
 * metrics (the browser may collect garbage before each measurement, so the
 * sign flips between single sessions — [P3.1-val]) and the autosave-50
 * overhead delta (it sits below the measurement noise floor — [P3.1]).
 */
const INFORMATIONAL_METRIC_KEYS: readonly string[] = [
  'memory-500/heap-growth-mb',
  'memory-500/mb-per-100-interactions',
  'autosave-50/autosave-overhead-ms',
];

/**
 * Metrics whose min/max are derived element-wise from two independent sample
 * sets (median(with) - median(without) order statistics): their spread cells
 * print `-` so an inverted min>max pair never reads as a sample spread
 * ([P3.1-val] design note).
 */
const DERIVED_SPREAD_METRIC_KEYS: readonly string[] = ['autosave-50/autosave-overhead-ms'];

const DIVERGENCE_NOTE_PREFIX = 'divergence: ';
const REPORT_MODES: readonly string[] = ['current-vs-main', 'current-vs-reference'];

const reportLibDirectory = dirname(fileURLToPath(import.meta.url));
const REFERENCE_FILE = join(reportLibDirectory, '..', 'results', 'reference.json');

/** Parsed CLI state: either the standalone reference snapshot, or a comparison. */
type ParsedOperation =
  | { readonly updateReference: true }
  | {
      readonly updateReference: false;
      readonly mode: ReportMode;
      readonly reference: string | undefined;
      readonly allowRegression: boolean;
    };

/** The comparison member of {@link ParsedOperation}. */
type ComparisonOperation = Extract<ParsedOperation, { readonly updateReference: false }>;

interface ComparisonRow {
  readonly scenario: BenchScenario;
  readonly metric: BenchMetricSpec;
  readonly medium: string;
  readonly baselineRecord: BenchRecord | undefined;
  readonly currentRecord: BenchRecord | undefined;
  readonly deltaPercent: number | undefined;
  readonly verdict: Verdict;
}

interface ComparisonContext {
  readonly mode: ReportMode;
  readonly baselineLabel: string;
  readonly allowRegression: boolean;
  readonly parserRowsDowngraded: boolean;
  readonly currentMap: Map<string, BenchRecord>;
  readonly baselineMap: Map<string, BenchRecord>;
  readonly warnings: string[];
  readonly usedCurrentKeys: Set<string>;
  readonly usedBaselineKeys: Set<string>;
}

function failUsage(reason: string): never {
  console.error(`${reason}\n${USAGE}`);

  process.exit(2);
}

function failArtifact(message: string): never {
  console.error(message);

  process.exit(2);
}

function parseReportArguments(argv: readonly string[]): ParsedOperation {
  let mode: ReportMode | undefined;
  let reference: string | undefined;
  let allowRegression = false;
  let updateReference = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--allow-regression') {
      allowRegression = true;

      continue;
    }

    if (argument === '--update-reference') {
      updateReference = true;

      continue;
    }

    if (argument === '--mode') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('--')) {
        failUsage(`--mode requires one of: ${REPORT_MODES.join(' | ')}.`);
      }

      if (!REPORT_MODES.includes(value)) {
        failUsage(`Unknown --mode "${value}". Expected one of: ${REPORT_MODES.join(' | ')}.`);
      }

      mode = value as ReportMode;
      index += 1;

      continue;
    }

    if (argument === '--reference') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('--')) {
        failUsage('--reference requires a file path argument.');
      }

      reference = value;
      index += 1;

      continue;
    }

    failUsage(`Unknown argument "${argument}".`);
  }

  if (updateReference && (mode !== undefined || reference !== undefined || allowRegression)) {
    failUsage(
      '--update-reference is a standalone operation (explicit flag guard): it snapshots the newest current ' +
        `artifact to ${REFERENCE_FILE} and accepts no other flags.`,
    );
  }

  if (allowRegression && mode !== undefined && mode !== 'current-vs-reference') {
    failUsage('--allow-regression only applies to --mode current-vs-reference (current-vs-main is informational already).');
  }

  if (updateReference) {
    return { updateReference: true };
  }

  if (mode === undefined) {
    failUsage('--mode is required (or pass --update-reference).');
  }

  return { updateReference: false, mode, reference, allowRegression };
}
/**
 * Minimal runtime shape check for records read from a possibly hand-edited
 * reference file (the type comes from a JSON.parse cast, so the compiler
 * cannot vouch for it).
 */
function isRecordLike(value: unknown): value is BenchRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.implementation === 'string' &&
    typeof candidate.scenario === 'string' &&
    typeof candidate.metric === 'string' &&
    typeof candidate.median === 'number' &&
    Number.isFinite(candidate.median) &&
    typeof candidate.node === 'string'
  );
}

function assertReadableRecords(records: readonly BenchRecord[], label: string): void {
  if (records.length === 0) {
    failArtifact(`${label} contains no records.`);
  }

  const malformed = records.filter((record) => !isRecordLike(record));

  if (malformed.length > 0) {
    failArtifact(`${label} contains ${malformed.length} malformed record(s); every record needs implementation/scenario/metric/median/node.`);
  }
}

function loadReferenceArtifact(file: string): RunArtifact {
  if (!existsSync(file)) {
    failArtifact(
      `Reference file not found: ${file}. Snapshot one with: pnpm run bench:full, then ` +
        'tsx tests/bench/lib/report.ts --update-reference.',
    );
  }

  let artifact: RunArtifact;

  try {
    artifact = readRunArtifact(file);
  } catch (error: unknown) {
    failArtifact(`Reference file ${file} is not a readable benchmark record array: ${error instanceof Error ? error.message : String(error)}`);
  }

  assertReadableRecords(artifact.records, `Reference file ${file}`);

  const nonCurrent = artifact.records.filter((record) => record.implementation !== 'current');

  if (nonCurrent.length > 0) {
    failArtifact(
      `Reference file ${file} carries ${nonCurrent.length} record(s) from implementation ` +
        `"${nonCurrent[0]?.implementation ?? 'unknown'}" — the regression reference must be a current-implementation snapshot.`,
    );
  }

  return artifact;
}

function recordKey(record: BenchRecord): string {
  return `${record.scenario}/${record.metric}`;
}

function buildRecordMap(records: readonly BenchRecord[], label: string, warnings: string[]): Map<string, BenchRecord> {
  const map = new Map<string, BenchRecord>();
  let duplicates = 0;

  for (const record of records) {
    const key = recordKey(record);

    if (map.has(key)) {
      duplicates += 1;
    }

    map.set(key, record);
  }

  if (duplicates > 0) {
    warnings.push(`WARNING: the ${label} side contains ${duplicates} duplicate (scenario, metric) record(s); the last occurrence is used`);
  }

  return map;
}

function environmentOf(records: readonly BenchRecord[], label: string, warnings: string[]): BenchEnvironment {
  const first = records[0];

  if (first === undefined) {
    throw new Error(`${label} contains no records.`);
  }

  const distinctEnvironments = new Set(
    records.map((record) => `${record.gitSha}|${record.gitBranch}|${record.node}|${JSON.stringify(record.versions)}`),
  );

  if (distinctEnvironments.size > 1) {
    warnings.push(
      `WARNING: the ${label} side mixes ${distinctEnvironments.size} environments in one artifact; ` +
        'the first record\'s environment is printed and used for the environment comparison',
    );
  }

  return { gitSha: first.gitSha, gitBranch: first.gitBranch, node: first.node, versions: first.versions };
}

function scenarioCoverageIds(records: readonly BenchRecord[]): Set<string> {
  return new Set(records.map((record) => record.scenario));
}

function mediumLabelOf(record: BenchRecord): string {
  const mediumNote = record.notes.find((note) => note.startsWith('medium:'));

  if (mediumNote === undefined) {
    return 'unlabeled';
  }

  if (mediumNote.includes('react-devtools')) {
    return 'chromium+devtools';
  }

  if (mediumNote.includes('vite build')) {
    return 'vite build';
  }

  if (mediumNote.includes('chromium')) {
    return 'chromium';
  }

  if (mediumNote.includes('node')) {
    return 'node';
  }

  return 'unlabeled';
}

function classifyMetric(scenarioId: string, metricName: string): MetricClassification {
  const key = `${scenarioId}/${metricName}`;

  if (HEADLINE_METRIC_KEYS.includes(key)) {
    return 'headline';
  }

  if (INFORMATIONAL_METRIC_KEYS.includes(key)) {
    return 'informational';
  }

  return 'secondary';
}

/**
 * The DECISION-7 classification keys are Phase-4 constants, but the registry
 * stays the single source of truth for ids and metric names — every key must
 * resolve to a registered (scenario, metric) pair or the report fails loudly
 * here instead of silently gating the wrong row.
 */
function assertClassificationKeysRegistered(): void {
  const classified: readonly (readonly [readonly string[], string])[] = [
    [HEADLINE_METRIC_KEYS, 'headline'],
    [INFORMATIONAL_METRIC_KEYS, 'informational'],
    [DERIVED_SPREAD_METRIC_KEYS, 'derived-spread'],
  ];

  for (const [keys, classification] of classified) {
    for (const key of keys) {
      const separatorIndex = key.indexOf('/');
      const scenarioId = key.slice(0, separatorIndex);
      const metricName = key.slice(separatorIndex + 1);
      const scenario = getScenario(scenarioId);

      if (!scenario.metrics.some((spec) => spec.name === metricName)) {
        throw new Error(
          `The ${classification} key "${key}" does not match the scenario registry ` +
            `(scenario "${scenarioId}" registers: ${scenario.metrics.map((spec) => spec.name).join(', ')}).`,
        );
      }
    }
  }
}

function changePercentBetween(current: number, baseline: number): number | undefined {
  if (baseline === 0) {
    return undefined;
  }

  return ((current - baseline) / baseline) * 100;
}

function verdictOf(
  context: ComparisonContext,
  scenario: BenchScenario,
  metric: BenchMetricSpec,
  classification: MetricClassification,
  changePercent: number | undefined,
  regressionPercent: number | undefined,
): Verdict {
  if (classification === 'informational') {
    return 'WARN';
  }

  if (context.mode === 'current-vs-main') {
    if (changePercent === undefined) {
      return 'N/A';
    }

    if (changePercent === 0) {
      return 'EVEN';
    }

    const higherIsBetter = metric.unit === 'parses/sec';

    if (higherIsBetter) {
      return changePercent < 0 ? 'WORSE' : 'BETTER';
    }

    return changePercent < 0 ? 'BETTER' : 'WORSE';
  }

  if (regressionPercent === undefined) {
    return 'N/A';
  }

  const threshold =
    classification === 'headline' ? HEADLINE_REGRESSION_THRESHOLD_PERCENT : SECONDARY_REGRESSION_THRESHOLD_PERCENT;

  if (regressionPercent <= threshold) {
    return 'PASS';
  }

  // Parser medians are order-sensitive in subset runs ([P1-val]/[P3.1]
  // design notes): they only gate on order-stable full-registry runs.
  if (scenario.id.startsWith('parser-') && context.parserRowsDowngraded) {
    return 'WARN';
  }

  if (context.allowRegression) {
    return 'WARN';
  }

  return 'FAIL';
}

function buildComparisonRows(context: ComparisonContext): readonly ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  let runCountMismatches = 0;

  for (const scenario of BENCH_SCENARIOS) {
    // current-vs-main compares cross-comparable scenarios only; the
    // current-only ids still mark their keys as looked-up so their records
    // never surface as stale leftovers.
    const emitsRows = context.mode !== 'current-vs-main' || scenario.comparable === 'cross';

    for (const metric of scenario.metrics) {
      const key = `${scenario.id}/${metric.name}`;
      const currentRecord = context.currentMap.get(key);
      const baselineRecord = context.baselineMap.get(key);

      if (currentRecord === undefined && baselineRecord === undefined) {
        continue;
      }

      context.usedCurrentKeys.add(key);
      context.usedBaselineKeys.add(key);

      if (!emitsRows) {
        continue;
      }

      const currentMedium = currentRecord === undefined ? undefined : mediumLabelOf(currentRecord);
      const baselineMedium = baselineRecord === undefined ? undefined : mediumLabelOf(baselineRecord);

      let medium = currentMedium ?? baselineMedium ?? 'unlabeled';

      if (currentMedium !== undefined && baselineMedium !== undefined && currentMedium !== baselineMedium) {
        medium = `${currentMedium}!=${baselineMedium}`;
        context.warnings.push(
          `WARNING: medium mismatch for ${key}: current "${currentMedium}" vs ${context.baselineLabel} "${baselineMedium}" ` +
            '— the two medians were not collected through the same medium',
        );
      }

      const changePercent =
        currentRecord !== undefined && baselineRecord !== undefined
          ? changePercentBetween(currentRecord.median, baselineRecord.median)
          : undefined;
      const higherIsBetter = metric.unit === 'parses/sec';
      const regressionPercent = changePercent === undefined ? undefined : higherIsBetter ? -changePercent : changePercent;
      const classification = classifyMetric(scenario.id, metric.name);

      if (currentRecord === undefined) {
        context.warnings.push(
          `WARNING: ${key} has no record in the current artifact (MISSING rows never fail)`,
        );
      }

      if (baselineRecord === undefined) {
        context.warnings.push(
          `WARNING: ${key} has no record on the ${context.baselineLabel} side (MISSING rows never fail — ` +
            'adding scenarios does not break old references)',
        );
      }

      if (
        currentRecord !== undefined &&
        baselineRecord !== undefined &&
        classification !== 'informational' &&
        currentRecord.runs !== baselineRecord.runs
      ) {
        runCountMismatches += 1;
      }

      rows.push({
        scenario,
        metric,
        medium,
        baselineRecord,
        currentRecord,
        deltaPercent: changePercent,
        verdict: verdictOf(context, scenario, metric, classification, changePercent, regressionPercent),
      });
    }
  }

  if (runCountMismatches > 0) {
    context.warnings.push(
      `WARNING: ${runCountMismatches} gated row(s) compare medians from different run counts (see the runs column) — ` +
        'N-run medians from a smaller N are noisier; prefer same-N comparisons',
    );
  }

  return rows;
}

function warnLeftoverKeys(map: Map<string, BenchRecord>, used: ReadonlySet<string>, label: string, warnings: string[]): void {
  const leftovers = [...map.keys()].filter((key) => !used.has(key));

  if (leftovers.length === 0) {
    return;
  }

  const listed = leftovers.slice(0, 8).join(', ');

  warnings.push(
    `WARNING: the ${label} side carries ${leftovers.length} record key(s) no registered scenario asks for (ignored): ` +
      `${listed}${leftovers.length > 8 ? ', ...' : ''}`,
  );
}

function formatValue(value: number): string {
  const absolute = Math.abs(value);

  if (absolute >= 1000) {
    return value.toFixed(0);
  }

  if (absolute >= 10) {
    return value.toFixed(2);
  }

  if (absolute >= 1) {
    return value.toFixed(3);
  }

  return value.toFixed(4);
}

function formatDelta(deltaPercent: number | undefined): string {
  if (deltaPercent === undefined) {
    return 'n/a';
  }

  const rounded = Math.round(deltaPercent * 10) / 10;

  if (rounded === 0) {
    return '0.0%';
  }

  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`;
}

function spreadCell(row: ComparisonRow): string {
  if (row.baselineRecord === undefined) {
    return '-';
  }

  if (DERIVED_SPREAD_METRIC_KEYS.includes(recordKey(row.baselineRecord))) {
    return '-';
  }

  return `${formatValue(row.baselineRecord.min)}..${formatValue(row.baselineRecord.max)}`;
}

function printSideHeader(label: string, source: string, records: readonly BenchRecord[], environment: BenchEnvironment): void {
  const scenarioCount = scenarioCoverageIds(records).size;

  console.log(`${label}: ${source} (${records.length} records, ${scenarioCount} scenarios)`);
  console.log(`  node ${environment.node} | branch ${environment.gitBranch} | sha ${environment.gitSha}`);
  console.log(`  ${Object.entries(environment.versions)
    .map(([name, version]) => `${name} ${version}`)
    .join(' | ')}`);
}

function printComparisonTable(rows: readonly ComparisonRow[], baselineLabel: string): void {
  const header = [
    'scenario',
    'metric',
    'medium',
    `${baselineLabel} median`,
    `${baselineLabel} min..max`,
    'runs',
    'current',
    'delta %',
    'verdict',
  ];
  const tableRows = rows.map((row) => [
    row.scenario.id,
    row.metric.name,
    row.medium,
    row.baselineRecord === undefined ? 'MISSING' : formatValue(row.baselineRecord.median),
    spreadCell(row),
    row.baselineRecord === undefined ? '-' : String(row.baselineRecord.runs),
    row.currentRecord === undefined ? 'MISSING' : formatValue(row.currentRecord.median),
    formatDelta(row.deltaPercent),
    row.verdict,
  ]);
  const widths = header.map((title, columnIndex) =>
    Math.max(title.length, ...tableRows.map((row) => row[columnIndex]?.length ?? 0)),
  );
  // Left-aligned text columns, right-aligned numeric columns, verdict last.
  const rightAlignedFrom = 3;
  const rightAlignedTo = 7;

  const formatRow = (row: readonly string[]): string =>
    row
      .map((cell, columnIndex) => {
        const width = widths[columnIndex] ?? 0;

        return columnIndex >= rightAlignedFrom && columnIndex <= rightAlignedTo ? cell.padStart(width) : cell.padEnd(width);
      })
      .join('  ')
      .trimEnd();

  console.log(formatRow(header));

  for (const row of tableRows) {
    console.log(formatRow(row));
  }
}

function printLegend(context: ComparisonContext): void {
  console.log('legend:');

  console.log(
    `  delta % = (current - ${context.baselineLabel}) / ${context.baselineLabel} * 100, raw sign ` +
      '(for parses/sec a NEGATIVE delta is the regression direction — throughput fell)',
  );

  if (context.mode === 'current-vs-reference') {
    console.log(
      `  verdicts: PASS within threshold | FAIL beyond threshold (exit 1) | WARN informational or downgraded, never gated ` +
        '| MISSING no record on one side (pass) | N/A delta undefined (zero baseline)',
    );
    console.log(
      `  thresholds (DECISION-7): headline > ${HEADLINE_REGRESSION_THRESHOLD_PERCENT}% or secondary > ` +
        `${SECONDARY_REGRESSION_THRESHOLD_PERCENT}% regression fails the run` +
        (context.allowRegression ? ' — --allow-regression downgrades FAIL rows to WARN (exit 0)' : ''),
    );
  } else {
    console.log(
      '  verdicts: BETTER current is faster/smaller | WORSE current is slower/larger | EVEN identical medians | ' +
        'WARN informational row, direction not meaningful | MISSING no record on one side | N/A delta undefined',
    );
    console.log(
      '  mode current-vs-main is INFORMATIONAL: no thresholds are applied; the exit code is 0 unless an artifact is missing',
    );
  }

  console.log(
    '  same-machine policy: thresholds assume same machine + same node; every row prints the ' +
      `${context.baselineLabel} runs/min..max spread so noise is visible; node/chromium mismatches are warned above`,
  );
  console.log(
    '  never gated by design: memory-500 heap rows (the browser may collect garbage before each measurement — ' +
      'sign flips between single sessions are expected) and autosave-50 autosave-overhead-ms (the raw signed delta ' +
      'sits below the measurement noise floor)',
  );
  console.log(
    "  autosave-overhead-ms min..max print '-': they are element-wise differences of two independent sample sets, " +
      'not a realizable spread',
  );
}

function printDivergenceNotes(baselineRecords: readonly BenchRecord[]): void {
  console.log('main-baseline divergence notes (from the main artifact records — D11/D12 and lifecycle divergences):');

  const printed = new Set<string>();

  for (const scenario of BENCH_SCENARIOS) {
    if (scenario.comparable !== 'cross') {
      continue;
    }

    for (const record of baselineRecords) {
      if (record.scenario !== scenario.id) {
        continue;
      }

      for (const note of record.notes) {
        if (!note.startsWith(DIVERGENCE_NOTE_PREFIX)) {
          continue;
        }

        const key = `${scenario.id}::${note}`;

        if (printed.has(key)) {
          continue;
        }

        printed.add(key);
        console.log(`  divergence [${scenario.id}]: ${note.slice(DIVERGENCE_NOTE_PREFIX.length)}`);
      }
    }
  }

  if (printed.size === 0) {
    console.log('  (none recorded in this artifact)');
  }
}

function countVerdict(rows: readonly ComparisonRow[], verdict: Verdict): number {
  return rows.filter((row) => row.verdict === verdict).length;
}

function runComparison(mode: ReportMode, operation: ComparisonOperation): number {
  const current = readNewestRunArtifact('current');

  if (current === undefined) {
    failArtifact('No current-implementation run artifact found under tests/bench/results/runs/ — run `pnpm run bench:full` first.');
  }

  assertReadableRecords(current.records, 'The newest current artifact');

  const baselineLabel = mode === 'current-vs-main' ? 'main' : 'reference';
  let baseline: RunArtifact;
  let baselineSource: string;

  if (mode === 'current-vs-main') {
    const main = readNewestRunArtifact('main');

    if (main === undefined) {
      failArtifact(
        'No main-baseline run artifact found under tests/bench/results/runs/ — run `pnpm run bench:baseline` first ' +
          '(setup: `pnpm run bench:baseline:setup`).',
      );
    }

    assertReadableRecords(main.records, 'The newest main artifact');
    baseline = main;
    baselineSource = main.file;
  } else {
    baselineSource = operation.reference ?? REFERENCE_FILE;
    baseline = loadReferenceArtifact(baselineSource);
  }

  const warnings: string[] = [];
  const currentEnvironment = environmentOf(current.records, 'current', warnings);
  const baselineEnvironment = environmentOf(baseline.records, baselineLabel, warnings);

  if (currentEnvironment.node !== baselineEnvironment.node) {
    warnings.push(
      `WARNING: node version differs — current ${currentEnvironment.node} vs ${baselineLabel} ${baselineEnvironment.node}; ` +
        'DECISION-7 thresholds assume same machine AND same node',
    );
  }

  const currentChromium = currentEnvironment.versions['chromium'];
  const baselineChromium = baselineEnvironment.versions['chromium'];

  if (currentChromium !== undefined && baselineChromium !== undefined && currentChromium !== baselineChromium) {
    warnings.push(
      `WARNING: chromium version differs — current ${currentChromium} vs ${baselineLabel} ${baselineChromium}; ` +
        'browser-version drift invalidates same-machine UI comparisons',
    );
  }

  const currentCoverage = scenarioCoverageIds(current.records);
  const baselineCoverage = scenarioCoverageIds(baseline.records);
  // Parser gating needs order-stable full-registry runs on BOTH sides
  // ([P1-val]/[P3.1]: parser medians swing >45% when the parser is not the
  // last scenario in the process, e.g. `--only` subsets).
  const parserRowsDowngraded =
    mode === 'current-vs-reference' &&
    (currentCoverage.size < BENCH_SCENARIOS.length || baselineCoverage.size < BENCH_SCENARIOS.length);

  if (parserRowsDowngraded) {
    warnings.push(
      `WARNING: parser rows are downgraded to WARN (never gated): the compared sides are not full-registry runs ` +
        `(current covers ${currentCoverage.size}/${BENCH_SCENARIOS.length} scenarios, ${baselineLabel} covers ` +
        `${baselineCoverage.size}/${BENCH_SCENARIOS.length}) — parser medians are order-sensitive in subset runs; ` +
        'gate only against a full-run reference',
    );
  }

  const context: ComparisonContext = {
    mode,
    baselineLabel,
    allowRegression: operation.allowRegression,
    parserRowsDowngraded,
    currentMap: buildRecordMap(current.records, 'current', warnings),
    baselineMap: buildRecordMap(baseline.records, baselineLabel, warnings),
    warnings,
    usedCurrentKeys: new Set<string>(),
    usedBaselineKeys: new Set<string>(),
  };
  const rows = buildComparisonRows(context);

  warnLeftoverKeys(context.currentMap, context.usedCurrentKeys, 'current', warnings);
  warnLeftoverKeys(context.baselineMap, context.usedBaselineKeys, baselineLabel, warnings);

  console.log(`Formedible benchmark report — mode: ${mode}`);
  printSideHeader('current', current.file, current.records, currentEnvironment);
  printSideHeader(baselineLabel, baselineSource, baseline.records, baselineEnvironment);
  console.log('');

  for (const warning of warnings) {
    console.log(warning);
  }

  if (warnings.length > 0) {
    console.log('');
  }

  printComparisonTable(rows, context.baselineLabel);
  console.log('');

  if (mode === 'current-vs-main') {
    printDivergenceNotes(baseline.records);
    console.log('');
  }

  printLegend(context);
  console.log('');

  const failures = countVerdict(rows, 'FAIL');
  const missing = countVerdict(rows, 'MISSING');
  const warns = countVerdict(rows, 'WARN');

  if (mode === 'current-vs-reference') {
    if (failures > 0) {
      console.log(`result: REGRESSION — ${failures} row(s) beyond the DECISION-7 threshold (${warns} warn, ${missing} missing) — exit 1`);

      return 1;
    }

    console.log(
      `result: PASS — ${rows.length} row(s): ${countVerdict(rows, 'PASS')} pass, ${warns} warn, ${missing} missing — exit 0`,
    );

    return 0;
  }

  console.log(
    `result: informational — ${countVerdict(rows, 'BETTER')} better / ${countVerdict(rows, 'WORSE')} worse / ` +
      `${countVerdict(rows, 'EVEN')} even / ${warns} informational-warn / ${missing} missing — exit 0`,
  );

  return 0;
}

/** `--update-reference`: snapshot the newest current artifact to the committed reference file (DECISION-4). */
function updateReferenceSnapshot(): void {
  const current = readNewestRunArtifact('current');

  if (current === undefined) {
    failArtifact('No current-implementation run artifact found under tests/bench/results/runs/ — run `pnpm run bench:full` before snapshotting a reference.');
  }

  assertReadableRecords(current.records, 'The newest current artifact');

  const warnings: string[] = [];
  const environment = environmentOf(current.records, 'current artifact', warnings);
  const coverage = scenarioCoverageIds(current.records);

  writeFileSync(REFERENCE_FILE, `${JSON.stringify(current.records, null, 2)}\n`, 'utf8');

  console.log(`Reference snapshot written: ${REFERENCE_FILE}`);
  console.log(`  source artifact: ${current.file} (${current.records.length} records across ${coverage.size} scenarios)`);
  console.log(`  node ${environment.node} | branch ${environment.gitBranch} | sha ${environment.gitSha}`);

  if (coverage.size < BENCH_SCENARIOS.length) {
    console.log(
      `  WARNING: the source artifact covers ${coverage.size} of ${BENCH_SCENARIOS.length} registered scenarios — ` +
        'reference snapshots should come from a full run (`pnpm run bench:full`)',
    );
  }

  for (const warning of warnings) {
    console.log(`  ${warning}`);
  }
}

function main(): number {
  assertClassificationKeysRegistered();

  const operation = parseReportArguments(process.argv.slice(2));

  if (operation.updateReference) {
    updateReferenceSnapshot();

    return 0;
  }

  return runComparison(operation.mode, operation);
}

try {
  process.exitCode = main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.stack : String(error));

  process.exitCode = 2;
}
