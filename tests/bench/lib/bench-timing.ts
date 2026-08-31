/**
 * Timing core shared by every benchmark adapter and runner.
 *
 * All measurements wrap `performance.now()` and report a fixed sample summary
 * (`median`, `p75`, `min`, `max`, `runs`). Benchmarks are deterministic in
 * shape: fixed warmup counts, fixed measured-run counts, nearest-rank
 * percentiles, and no wall-clock assertions anywhere.
 */

export interface TimingStats {
  readonly median: number;
  readonly p75: number;
  readonly min: number;
  readonly max: number;
  readonly runs: number;
}

export interface TimingOptions {
  readonly warmupRuns: number;
  readonly measuredRuns: number;
}

/** Default warmup runs executed (untimed) before measured runs begin. */
export const DEFAULT_WARMUP_RUNS = 3;

/** Default measured runs for jsdom timing scenarios (full suite). */
export const DEFAULT_MEASURED_RUNS = 25;

/** Measured runs used by `bench:smoke` (DECISION-3). */
export const SMOKE_MEASURED_RUNS = 5;

export function defaultTimingOptions(measuredRuns: number = DEFAULT_MEASURED_RUNS): TimingOptions {
  return { warmupRuns: DEFAULT_WARMUP_RUNS, measuredRuns };
}

/**
 * Nearest-rank percentile over an ascending-sorted sample. Index arithmetic is
 * deterministic for a fixed sample length; never interpolates.
 */
function percentile(sortedSamples: readonly number[], fraction: number): number {
  if (sortedSamples.length === 0) {
    throw new Error('Cannot compute percentiles from an empty sample set.');
  }

  const rank = Math.max(1, Math.ceil(fraction * sortedSamples.length));
  const index = Math.min(sortedSamples.length, rank) - 1;
  const sample = sortedSamples[index];

  if (sample === undefined) {
    throw new Error(`Percentile index ${index} is outside the sample set.`);
  }

  return sample;
}

/** Summarizes externally collected samples (for example adapter-measured operations). */
export function summarize(samples: readonly number[]): TimingStats {
  if (samples.length === 0) {
    throw new Error('Cannot summarize an empty sample set.');
  }

  const sorted = [...samples].sort((first, second) => first - second);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === undefined || max === undefined) {
    throw new Error('Sorted sample set is missing boundary samples.');
  }

  return {
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    min,
    max,
    runs: samples.length,
  };
}

/**
 * Times a single operation once and returns the elapsed milliseconds. Adapter
 * operations use this so both implementations measure identically.
 */
export async function timeMs(operation: () => void | Promise<void>): Promise<number> {
  const start = performance.now();

  await operation();

  return performance.now() - start;
}

/**
 * Times a single synchronous operation once and returns the elapsed
 * nanoseconds (for sub-millisecond workloads such as parser throughput).
 */
export function timeNs(operation: () => void): number {
  const start = performance.now();

  operation();

  return (performance.now() - start) * 1_000_000;
}

/**
 * Executes the warmup runs (untimed) followed by the measured runs and
 * summarizes the measured samples in milliseconds.
 */
export async function measureMs(
  operation: () => void | Promise<void>,
  options: Partial<TimingOptions> = {},
): Promise<TimingStats> {
  const resolved: TimingOptions = { ...defaultTimingOptions(), ...options };
  const samples: number[] = [];

  for (let run = 0; run < resolved.warmupRuns; run += 1) {
    await operation();
  }

  for (let run = 0; run < resolved.measuredRuns; run += 1) {
    samples.push(await timeMs(operation));
  }

  return summarize(samples);
}

/**
 * Executes the warmup runs (untimed) followed by the measured runs and
 * summarizes the measured samples in nanoseconds.
 */
export function measureNs(operation: () => void, options: Partial<TimingOptions> = {}): TimingStats {
  const resolved: TimingOptions = { ...defaultTimingOptions(), ...options };
  const samples: number[] = [];

  for (let run = 0; run < resolved.warmupRuns; run += 1) {
    operation();
  }

  for (let run = 0; run < resolved.measuredRuns; run += 1) {
    samples.push(timeNs(operation));
  }

  return summarize(samples);
}

/**
 * Scales every sample summary value by a linear factor, preserving the sample
 * count. Used to report per-operation metrics (for example total keystroke
 * time / keystroke count = ms per keystroke).
 */
export function scaleStats(stats: TimingStats, factor: number): TimingStats {
  return {
    median: stats.median * factor,
    p75: stats.p75 * factor,
    min: stats.min * factor,
    max: stats.max * factor,
    runs: stats.runs,
  };
}
