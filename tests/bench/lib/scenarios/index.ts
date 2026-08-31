/**
 * Scenario registry — the single source of truth for benchmark scenario ids,
 * metric names, units, comparability, and smoke membership (DECISION-2/3/6).
 *
 * `comparable: 'cross'` scenarios run against every implementation adapter;
 * `comparable: 'current-only'` scenarios are tracked over time for the current
 * implementation only. Ids are stable: artifacts, the compare report, and the
 * regression reference all key off them.
 */

export type BenchComparable = 'cross' | 'current-only';

export type BenchUnit = 'ms' | 'ms/op' | 'bytes' | 'MB' | 'renders';

export interface BenchScenario {
  readonly id: string;
  readonly label: string;
  readonly metric: string;
  readonly unit: BenchUnit;
  readonly comparable: BenchComparable;
  /** Whether the scenario belongs to the `bench:smoke` fast subset (DECISION-3). */
  readonly smoke: boolean;
}

export const BENCH_SCENARIOS: readonly BenchScenario[] = [
  {
    id: 'mount-10',
    label: 'Initial render + commit of a 10-field form',
    metric: 'mount-ms',
    unit: 'ms',
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'mount-50',
    label: 'Initial render + commit of a 50-field form',
    metric: 'mount-ms',
    unit: 'ms',
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'mount-100',
    label: 'Initial render + commit of a 100-field form',
    metric: 'mount-ms',
    unit: 'ms',
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'typing-10',
    label: '100 synthetic input events into one field of a 10-field form',
    metric: 'ms-per-keystroke',
    unit: 'ms',
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'typing-50',
    label: '100 synthetic input events into one field of a 50-field form',
    metric: 'ms-per-keystroke',
    unit: 'ms',
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'typing-100',
    label: '100 synthetic input events into one field of a 100-field form',
    metric: 'ms-per-keystroke',
    unit: 'ms',
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'submit-10',
    label: 'Zod validation + onSubmit round trip on a 10-field form',
    metric: 'submit-round-trip-ms',
    unit: 'ms',
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'submit-50',
    label: 'Zod validation + onSubmit round trip on a 50-field form',
    metric: 'submit-round-trip-ms',
    unit: 'ms',
    comparable: 'cross',
    smoke: true,
  },
  {
    id: 'submit-100',
    label: 'Zod validation + onSubmit round trip on a 100-field form',
    metric: 'submit-round-trip-ms',
    unit: 'ms',
    comparable: 'cross',
    smoke: false,
  },
  {
    id: 'parser-medium',
    label: 'FormedibleParser throughput on a medium (25-field) config, 50 parses per run',
    metric: 'ms-per-parse',
    unit: 'ms',
    comparable: 'cross',
    smoke: true,
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
