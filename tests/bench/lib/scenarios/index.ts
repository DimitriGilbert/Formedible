/**
 * Scenario registry — the single source of truth for benchmark scenario ids,
 * metric names, units, comparability, and smoke membership (DECISION-2/3/6).
 *
 * `comparable: 'cross'` scenarios run against every implementation adapter;
 * `comparable: 'current-only'` scenarios are tracked over time for the current
 * implementation only. Ids are stable: artifacts, the compare report, and the
 * regression reference all key off them.
 *
 * A scenario may report several metrics (`autosave-50` records the with/without
 * typing medians plus their delta; `memory-500` records heap growth plus the
 * retained-growth slope; the parser triple also derives parses-per-sec). Each
 * metric becomes its own artifact record under the same scenario id.
 */

export type BenchComparable = 'cross' | 'current-only';

export type BenchUnit = 'ms' | 'ms/op' | 'bytes' | 'MB' | 'renders' | 'parses/sec';

export interface BenchMetricSpec {
  readonly name: string;
  readonly unit: BenchUnit;
}

export interface BenchScenario {
  readonly id: string;
  readonly label: string;
  readonly metrics: readonly BenchMetricSpec[];
  readonly comparable: BenchComparable;
  /** Whether the scenario belongs to the `bench:smoke` fast subset (DECISION-3). */
  readonly smoke: boolean;
  /**
   * Whether the scenario runs only under `bench:full` (the instrumentation
   * extras and the bundle build — current-only extras that either perturb what
   * they measure or are pure build outputs, so they stay out of the default
   * `bench` suite; explicit `--only <id>` always overrides).
   */
  readonly fullOnly?: boolean;
}

export const BENCH_SCENARIOS: readonly BenchScenario[] = [
  {
    id: 'mount-10',
    label: 'Initial render + commit of a 10-field form',
    metrics: [{ name: 'mount-ms', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'mount-50',
    label: 'Initial render + commit of a 50-field form',
    metrics: [{ name: 'mount-ms', unit: 'ms' }],
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'mount-100',
    label: 'Initial render + commit of a 100-field form',
    metrics: [{ name: 'mount-ms', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'typing-10',
    label: '100 synthetic input events into one field of a 10-field form',
    metrics: [{ name: 'ms-per-keystroke', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'typing-50',
    label: '100 synthetic input events into one field of a 50-field form',
    metrics: [{ name: 'ms-per-keystroke', unit: 'ms' }],
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'typing-100',
    label: '100 synthetic input events into one field of a 100-field form',
    metrics: [{ name: 'ms-per-keystroke', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'submit-10',
    label: 'Zod validation + onSubmit round trip on a 10-field form',
    metrics: [{ name: 'submit-round-trip-ms', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'submit-50',
    label: 'Zod validation + onSubmit round trip on a 50-field form',
    metrics: [{ name: 'submit-round-trip-ms', unit: 'ms' }],
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'submit-100',
    label: 'Zod validation + onSubmit round trip on a 100-field form',
    metrics: [{ name: 'submit-round-trip-ms', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'pageswitch-50',
    label: '50 page switches through the 5-page, 50-field form (all pages valid)',
    metrics: [{ name: 'ms-per-switch', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'tabswitch-50',
    label: '40 tab switches through the 4-tab, 50-field form',
    metrics: [{ name: 'ms-per-switch', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'array-50',
    label: '20 add + 20 remove operations on the 20-item object array field',
    metrics: [{ name: 'ms-per-op', unit: 'ms' }],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'autosave-50',
    label: 'Typing workload with persistence autosave enabled vs. disabled (50-field form)',
    metrics: [
      { name: 'ms-per-keystroke-with-autosave', unit: 'ms' },
      { name: 'ms-per-keystroke-without-autosave', unit: 'ms' },
      { name: 'autosave-overhead-ms', unit: 'ms' },
    ],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'memory-500',
    label: 'Heap growth over 500 interleaved interactions (type/switch/add) on the 50-field paged+array form',
    metrics: [
      { name: 'heap-growth-mb', unit: 'MB' },
      { name: 'mb-per-100-interactions', unit: 'MB' },
    ],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'parser-small',
    label: 'FormedibleParser throughput on a small (5-field) config, 50 parses per run',
    metrics: [
      { name: 'ms-per-parse', unit: 'ms' },
      { name: 'parses-per-sec', unit: 'parses/sec' },
    ],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'parser-medium',
    label: 'FormedibleParser throughput on a medium (25-field) config, 50 parses per run',
    metrics: [
      { name: 'ms-per-parse', unit: 'ms' },
      { name: 'parses-per-sec', unit: 'parses/sec' },
    ],
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'parser-large',
    label: 'FormedibleParser throughput on a large (100-field) config, 50 parses per run',
    metrics: [
      { name: 'ms-per-parse', unit: 'ms' },
      { name: 'parses-per-sec', unit: 'parses/sec' },
    ],
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'stream-100chunks',
    label: 'AiStreamScheduler flush → minimal-transcript render cost for 100 synthetic text-delta chunks',
    metrics: [
      { name: 'renders-per-100-chunks', unit: 'renders' },
      { name: 'flush-ms-total', unit: 'ms' },
    ],
    comparable: 'current-only',
    smoke: false,
  },
  {
    id: 'browser-typing-50',
    label: 'React render count + profiler trace for 50 real keystrokes on the typing-50 page',
    metrics: [
      { name: 'renders-per-50-keystrokes', unit: 'renders' },
      { name: 'interaction-trace-ms', unit: 'ms' },
    ],
    comparable: 'current-only',
    smoke: false,
    fullOnly: true,
  },
  {
    id: 'browser-mount-100',
    label: 'Load vitals for the 100-field form page (LCP fresh load, INP from a real interaction)',
    metrics: [
      { name: 'lcp-ms', unit: 'ms' },
      { name: 'inp-ms', unit: 'ms' },
    ],
    comparable: 'current-only',
    smoke: false,
    fullOnly: true,
  },
  {
    id: 'bundle-minimal',
    label: 'Minimal consumer app JS payload (sum of built assets/*.js, raw and gzip)',
    metrics: [
      { name: 'bundle-bytes-raw', unit: 'bytes' },
      { name: 'bundle-bytes-gzip', unit: 'bytes' },
    ],
    comparable: 'current-only',
    smoke: false,
    fullOnly: true,
  },
];

export const SMOKE_SCENARIO_IDS: readonly string[] = BENCH_SCENARIOS.filter((scenario) => scenario.smoke).map(
  (scenario) => scenario.id,
);

export function getScenario(id: string): BenchScenario {
  const scenario = BENCH_SCENARIOS.find((candidate) => candidate.id === id);

  if (!scenario) {
    throw new Error(`Unknown benchmark scenario id "${id}". Registered ids: ${BENCH_SCENARIOS.map((entry) => entry.id).join(', ')}.`);
  }

  return scenario;
}
