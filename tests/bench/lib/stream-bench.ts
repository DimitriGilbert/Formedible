import { DEFAULT_WARMUP_RUNS, summarize } from './bench-timing';
import { STREAM_CHUNK_COUNT, createStreamTranscriptText } from './scenarios/forms';
import type { BenchBrowserDriver } from '../utils/agent-browser';
import type { BrowserScenarioOutcome, ScenarioMetricStats } from './run-common';

/**
 * `stream-100chunks` executor (current-only, PERF-BENCHMARK-PLAN.md §3.2):
 * feeds 100 deterministic text-delta chunks through the REAL
 * `AiStreamScheduler` (default ~16ms frame ticking, the production
 * configuration) into the fixture's minimal transcript component and measures,
 * entirely in-page with real React commits:
 *
 * - `renders-per-100-chunks` — React commits of the transcript tree, counted
 *   by an in-page commit-counting hook (a dependency-free `useEffect` inside
 *   the transcript fires once per commit). Chosen over react-devtools render
 *   counting because it counts exactly the transcript subtree's commits with
 *   zero instrumentation overhead, so both stream metrics come from the same
 *   un-instrumented pass (plan risk #7: instrumentation skews timing).
 * - `flush-ms-total` — per run, the summed scheduler-flush → React-commit
 *   latency of all 100 chunks (`performance.now()` sampled at the flush
 *   callback and at the commit's effect).
 *
 * The fixture asserts per run that every chunk flushed separately
 * (flushCount === 100), every flush committed exactly once
 * (commitCount === flushCount), and the transcript text equals the
 * deterministic payload — this executor re-verifies the driver-side view.
 */

export async function executeStreamScenario(driver: BenchBrowserDriver, runs: number): Promise<BrowserScenarioOutcome> {
  await driver.openScenario('stream');

  const result = await driver.streamLoop({ warmupRuns: DEFAULT_WARMUP_RUNS, measuredRuns: runs });

  if (result.chunkCount !== STREAM_CHUNK_COUNT) {
    throw new Error(`stream-100chunks fed ${result.chunkCount} chunks, expected ${STREAM_CHUNK_COUNT}.`);
  }

  if (result.commitCounts.length !== runs || result.flushMsTotals.length !== runs) {
    throw new Error(
      `stream-100chunks collected ${result.commitCounts.length} commit counts and ${result.flushMsTotals.length} flush totals for ${runs} measured runs.`,
    );
  }

  for (const [index, commitCount] of result.commitCounts.entries()) {
    if (commitCount !== STREAM_CHUNK_COUNT) {
      throw new Error(
        `stream-100chunks committed ${commitCount} times in measured run ${index + 1}, expected ${STREAM_CHUNK_COUNT} (one commit per chunk).`,
      );
    }
  }

  if (result.finalText !== createStreamTranscriptText()) {
    throw new Error('stream-100chunks: the transcript text drifted from the deterministic payload.');
  }

  const metrics: readonly ScenarioMetricStats[] = [
    { metric: 'renders-per-100-chunks', stats: summarize([...result.commitCounts]) },
    { metric: 'flush-ms-total', stats: summarize([...result.flushMsTotals]) },
  ];

  return {
    metrics,
    notes: [
      'the real AiStreamScheduler (packages/ai-builder, default ~16ms frame ticking — the exact configuration ChatInterface uses) feeds 100 deterministic text-delta chunks into a minimal transcript component mounted in the page; every chunk is a real React commit',
      'renders-per-100-chunks counts React commits of the transcript tree via an in-page commit-counting hook (a dependency-free useEffect inside the transcript fires once per commit) — react-devtools counting was rejected here because its instrumentation overhead would contaminate flush-ms-total collected in the same pass (plan risk #7); the sanity expectation commits <= chunks x 2 holds exactly (100 commits for 100 chunks, verified per run)',
      'flush-ms-total is the summed per-chunk scheduler-flush -> React-commit latency of one 100-chunk run (performance.now at the flush callback and at the commit effect); chunk pacing (the ~16ms frame ticks) is excluded from the sum, so the metric prices scheduler buffering + transcript render work only',
      `the fixture asserts every run: one flush per chunk (no coalescing), one commit per flush, and the exact deterministic transcript text; ${runs} measured runs after ${DEFAULT_WARMUP_RUNS} warmup runs, one measured run per agent-browser eval`,
    ],
  };
}
