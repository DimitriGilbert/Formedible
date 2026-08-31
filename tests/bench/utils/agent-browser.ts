import { execFile, spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { allocateLocalhostPort } from '../../consumer-smoke/utils/ports';
import type { BenchArrayOp, BenchMemoryOp } from '../lib/adapter-types';
import type {
  HarnessArrayOpResult,
  HarnessHeapSnapshot,
  HarnessKeystrokeResult,
  HarnessLoopOptions,
  HarnessMemoryCheckpoint,
  HarnessMemoryResult,
  HarnessMemoryRunResult,
  HarnessMountResult,
  HarnessStatus,
  HarnessStreamResult,
  HarnessStreamRunResult,
  HarnessSubmitResult,
  HarnessSwitchResult,
} from '../lib/harness-protocol';

/**
 * Benchmark browser driver (PERF-BENCHMARK-PLAN.md Phase 1, DECISION-2
 * revised): real Chromium driven by `agent-browser`, modeled on
 * `tests/e2e/utils/agent-browser.ts` (per-suite utils are the repo
 * convention). This module implements the browser-side scenario operations —
 * mount, keystroke, submit, deterministic page-switch / tab-switch / array op
 * sequences, the interleaved memory workload, and rendered-field counting — by
 * driving the REAL page served from the committed fixture.
 *
 * Timing runs IN-PAGE (DECISION-2): each operation loop is a single
 * `agent-browser eval` that executes warmup + measured runs with
 * `performance.now()` around every run and returns the samples array; the
 * runner summarizes those samples with the unchanged `bench-timing.ts` stats.
 * The timing path is never opened with devtools instrumentation, so
 * instrumentation can never contaminate timing medians.
 *
 * The driver knows nothing about either implementation: it drives whatever
 * fixture origin it is given, which is exactly how Phase 2 will run the `main`
 * baseline through the same code.
 */

const execFileAsync = promisify(execFile);

/** Fixed viewport for every timing run (determinism: recorded in artifacts). */
export const BENCH_VIEWPORT_WIDTH = 1280;
export const BENCH_VIEWPORT_HEIGHT = 800;
export const BENCH_VIEWPORT_NOTE = `${BENCH_VIEWPORT_WIDTH}x${BENCH_VIEWPORT_HEIGHT}`;

const utilsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(utilsDirectory, '..', '..', '..');

/** The committed bench fixtures this driver's helpers build and serve. */
export type BenchFixtureName = 'current-consumer' | 'main-consumer' | 'minimal-consumer';

function fixtureViteConfigPath(fixture: BenchFixtureName): string {
  return path.join(repositoryRoot, 'tests', 'bench', 'fixtures', fixture, 'vite.config.ts');
}

const HTTP_OK_TIMEOUT_MS = 30_000;
const HARNESS_READY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;

interface AgentBrowserResult {
  readonly stdout: string;
  readonly stderr: string;
}

interface AgentBrowserEnvelope {
  readonly success?: unknown;
  readonly data?: { readonly result?: unknown } | undefined;
  readonly error?: unknown;
}

/**
 * The memory workload is evaluated in chunks of this many operations so no
 * single `agent-browser eval` outlives the CLI's CDP action timeout. Chunks
 * land on the scenario's checkpoint interval, so the merged checkpoint
 * sequence is identical to a single-shot loop.
 */
const MEMORY_LOOP_CHUNK_SIZE = 100;

/**
 * Raised CLI action timeout for every agent-browser invocation of this driver
 * (the default is 25s): the daemon reads it at startup, and in-page workload
 * evals legitimately run long — one `measureUserAgentSpecificMemory()` call
 * can take 10s+ because the browser collects garbage before measuring, and a
 * keystroke loop at N=25 dispatches thousands of input events. A genuinely
 * hung eval still fails, just later.
 */
const AGENT_BROWSER_ACTION_TIMEOUT_MS = 120_000;

async function runAgentBrowser(args: readonly string[], session: string): Promise<AgentBrowserResult> {
  try {
    const result = await execFileAsync('pnpm', ['exec', 'agent-browser', '--session', session, ...args], {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        AGENT_BROWSER_MAX_OUTPUT: process.env.AGENT_BROWSER_MAX_OUTPUT ?? '50000',
        AGENT_BROWSER_DEFAULT_TIMEOUT: process.env.AGENT_BROWSER_DEFAULT_TIMEOUT ?? String(AGENT_BROWSER_ACTION_TIMEOUT_MS),
      },
      maxBuffer: 1024 * 1024 * 10,
    });

    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error: unknown) {
    if (error instanceof Error) {
      const stderr = (error as Error & { readonly stderr?: string }).stderr ?? '';

      throw new Error(
        `agent-browser ${args.join(' ')} failed: ${error.message}${stderr === '' ? '' : `\nstderr: ${stderr}`}`,
      );
    }

    throw error;
  }
}

/**
 * Evaluates an expression in the session's active page and returns its result.
 * The expression may return a promise — agent-browser awaits it — and must be
 * JSON-serializable.
 */
async function evalExpression<T>(session: string, expression: string): Promise<T> {
  const encoded = Buffer.from(expression, 'utf8').toString('base64');
  const result = await runAgentBrowser(['--json', 'eval', '-b', encoded], session);
  const parsed = JSON.parse(result.stdout) as AgentBrowserEnvelope;

  if (parsed.success !== true) {
    throw new Error(`agent-browser eval failed: ${String(parsed.error ?? result.stderr)}`);
  }

  return parsed.data?.result as T;
}

/**
 * Runs a subcommand with `--json` and returns its `data` payload (the
 * instrumentation commands answer with an envelope whose `data` is either
 * structured or a markdown `report` string the caller parses).
 */
async function runAgentBrowserData(
  args: readonly string[],
  session: string,
): Promise<Readonly<Record<string, unknown>>> {
  const result = await runAgentBrowser([...args, '--json'], session);
  const parsed = JSON.parse(result.stdout) as AgentBrowserEnvelope;

  if (parsed.success !== true) {
    throw new Error(`agent-browser ${args.join(' ')} failed: ${String(parsed.error ?? result.stderr)}`);
  }

  const data = parsed.data;

  if (data === undefined || typeof data !== 'object') {
    throw new Error(`agent-browser ${args.join(' ')} returned no JSON data object.`);
  }

  return data as Readonly<Record<string, unknown>>;
}

/** Render profile parsed from `react renders stop --json` (report markdown). */
export interface ReactRenderProfile {
  /** Total component render invocations during the recording (mounts + re-renders). */
  readonly totalRenders: number;
  readonly mounts: number;
  readonly reRenders: number;
  readonly componentCount: number;
  readonly recordingMs: number;
}

const RENDER_SUMMARY_PATTERN = /^# (\d+) renders \((\d+) mounts \+ (\d+) re-renders\) across (\d+) components$/m;
const RENDER_RECORDING_PATTERN = /^# Render Profile - ([\d.]+)s recording$/m;

function parseRenderProfile(report: string): ReactRenderProfile {
  const summary = RENDER_SUMMARY_PATTERN.exec(report);
  const recording = RENDER_RECORDING_PATTERN.exec(report);

  if (summary === null) {
    throw new Error(`Unable to parse the react-devtools render profile report:\n${report.slice(0, 200)}`);
  }

  return {
    totalRenders: Number.parseInt(summary[1] ?? '', 10),
    mounts: Number.parseInt(summary[2] ?? '', 10),
    reRenders: Number.parseInt(summary[3] ?? '', 10),
    componentCount: Number.parseInt(summary[4] ?? '', 10),
    recordingMs: recording === null ? Number.NaN : Number.parseFloat(recording[1] ?? '') * 1000,
  };
}

/** Page vitals parsed from `vitals --json` (report markdown). */
export interface BrowserVitalsReport {
  readonly ttfbMs: number | undefined;
  readonly lcpMs: number | undefined;
  readonly cls: number | undefined;
  readonly fcpMs: number | undefined;
}

function parseVitals(report: string): BrowserVitalsReport {
  const read = (name: string): number | undefined => {
    const match = new RegExp(`^\\s*${name}\\s+([\\d.]+)`, 'm').exec(report);

    return match === null ? undefined : Number.parseFloat(match[1] ?? '');
  };

  return { ttfbMs: read('TTFB'), lcpMs: read('LCP'), cls: read('CLS'), fcpMs: read('FCP') };
}

function harnessCall(method: string, args: readonly unknown[]): string {
  return `window.__benchHarness.${method}(${args.map((argument) => JSON.stringify(argument)).join(', ')})`;
}

async function waitForHarnessReady(session: string): Promise<void> {
  const startedAt = Date.now();
  let lastFailure: unknown;

  while (Date.now() - startedAt < HARNESS_READY_TIMEOUT_MS) {
    try {
      const status = await evalExpression<HarnessStatus>(session, harnessCall('status', []));

      if (status.error !== undefined) {
        throw new Error(`The benchmark fixture reported: ${status.error}`);
      }

      if (status.ready) {
        return;
      }

      lastFailure = new Error('The benchmark harness has not finished mounting the scenario form.');
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('The benchmark fixture reported:')) {
        throw error;
      }

      lastFailure = error;
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for the bench harness. Last failure: ${String(lastFailure)}`);
}

/** The browser-side operations the runner (and Phase 2) drives scenarios with. */
export interface BenchBrowserDriver {
  /** The fixture origin this driver's {@link openScenario} builds URLs from. */
  readonly origin: string;
  /** User agent of the session's Chromium (environment metadata). */
  readonly chromiumUserAgent: string;
  /** Opens `/?scenario=<id>` on the fixture origin and waits until mounted. */
  openScenario(scenarioId: string): Promise<void>;
  /**
   * Reads the fixture's in-page runtime version report
   * (`window.__benchRuntimeVersions`), when the fixture exposes one — the
   * main-baseline fixture does, as its DECISION-1 dependency-isolation
   * assertion. Fixtures without the global report an empty record.
   */
  readRuntimeVersions(): Promise<Readonly<Record<string, string>>>;
  mountLoop(options: HarnessLoopOptions): Promise<HarnessMountResult>;
  keystrokeLoop(fieldName: string, text: string, options: HarnessLoopOptions): Promise<HarnessKeystrokeResult>;
  submitLoop(options: HarnessLoopOptions): Promise<HarnessSubmitResult>;
  switchPageSequenceLoop(pageNumbers: readonly number[], options: HarnessLoopOptions): Promise<HarnessSwitchResult>;
  switchTabSequenceLoop(tabIndices: readonly number[], options: HarnessLoopOptions): Promise<HarnessSwitchResult>;
  arraySequenceLoop(
    fieldName: string,
    ops: readonly BenchArrayOp[],
    options: HarnessLoopOptions,
  ): Promise<HarnessArrayOpResult>;
  memoryLoop(ops: readonly BenchMemoryOp[]): Promise<HarnessMemoryResult>;
  /** Streaming scenario loop (current-only fixture page): one measured run per eval. */
  streamLoop(options: HarnessLoopOptions): Promise<HarnessStreamResult>;
  /** Generic in-page evaluation (instrumentation collectors, e.g. the INP observer). */
  evaluate<T>(expression: string): Promise<T>;
  /** Opens a raw URL in the session without waiting for the bench harness. */
  openUrl(url: string): Promise<void>;
  /** Focuses the first element matching the selector (real focus events). */
  focusSelector(selector: string): Promise<void>;
  /** Clicks the first element matching the selector (real click events). */
  clickSelector(selector: string): Promise<void>;
  /** Types text into the focused element with real browser keystrokes. */
  keyboardType(text: string): Promise<void>;
  /** Starts react-devtools re-render recording (session must be devtools-enabled). */
  startRenderRecording(): Promise<void>;
  /** Stops the recording and returns the parsed render profile. */
  stopRenderRecording(): Promise<ReactRenderProfile>;
  /** Starts a Chrome DevTools profile (CPU/trace) recording. */
  startProfiler(): Promise<void>;
  /** Stops the profile recording and saves it to `profilePath`. */
  stopProfiler(profilePath: string): Promise<void>;
  /**
   * Reads Core Web Vitals; with `url` the command navigates there first (a
   * fresh load). The CLI collects TTFB/LCP/CLS/FCP — it advertises INP but
   * never reports it, so INP is collected separately in-page.
   */
  readVitals(url?: string): Promise<BrowserVitalsReport>;
}

/** Options for {@link createAgentBrowserDriver}. */
export interface DriverOptions {
  /**
   * Launch the session with the react-devtools hook installed
   * (`open --enable react-devtools`) for the render-count instrumentation
   * extras. Timing scenarios never set this — instrumentation must not
   * contaminate timing medians (plan risk #7).
   */
  readonly reactDevtools?: boolean;
}

/**
 * Result shape every sequence loop returns from the page (samples plus a
 * loop-specific final state).
 */
interface SequencedLoopResult {
  readonly samples: readonly number[];
}

/**
 * Executes a sequence loop ONE MEASURED RUN PER EVAL: the warmup passes go out
 * as a single untimed eval, then every measured run is its own eval whose
 * samples are concatenated driver-side. One sequence pass (tens of
 * frame-settled ops) is a couple of seconds in-page, so no eval approaches the
 * CLI's CDP action timeout even at N=25, while the sample set, run boundaries,
 * and warmup semantics stay identical to a single-shot loop.
 */
async function runSequenceLoopPerRun<T extends SequencedLoopResult>(
  session: string,
  method: string,
  args: readonly unknown[],
  options: HarnessLoopOptions,
): Promise<{ readonly samples: readonly number[]; readonly lastResult: T | undefined }> {
  const samples: number[] = [];
  let lastResult: T | undefined;

  if (options.warmupRuns > 0) {
    lastResult = await evalExpression<T>(
      session,
      harnessCall(method, [...args, { warmupRuns: options.warmupRuns, measuredRuns: 0 }]),
    );
  }

  for (let run = 0; run < options.measuredRuns; run += 1) {
    const result = await evalExpression<T>(
      session,
      harnessCall(method, [...args, { warmupRuns: 0, measuredRuns: 1 }]),
    );

    samples.push(...result.samples);
    lastResult = result;
  }

  return { samples, lastResult };
}

/**
 * Opens the session's browser on about:blank (which launches Chromium for the
 * session), pins the fixed viewport, captures the user agent, and returns the
 * driver bound to that session and fixture origin. With
 * `reactDevtools: true` the session's first open installs the react-devtools
 * hook — required by the render-count instrumentation commands.
 */
export async function createAgentBrowserDriver(
  session: string,
  origin: string,
  options: DriverOptions = {},
): Promise<BenchBrowserDriver> {
  await runAgentBrowser(
    options.reactDevtools === true
      ? ['open', '--enable', 'react-devtools', 'about:blank']
      : ['open', 'about:blank'],
    session,
  );
  await runAgentBrowser(['set', 'viewport', String(BENCH_VIEWPORT_WIDTH), String(BENCH_VIEWPORT_HEIGHT)], session);

  const chromiumUserAgent = await evalExpression<string>(session, 'navigator.userAgent');

  const openScenario = async (scenarioId: string): Promise<void> => {
    await runAgentBrowser(['open', `${origin}/?scenario=${encodeURIComponent(scenarioId)}`], session);
    await waitForHarnessReady(session);
  };

  /**
   * Orchestrates the memory workload: one heap snapshot before the first op,
   * then per chunk of MEMORY_LOOP_CHUNK_SIZE ops a chunk execution eval and a
   * snapshot eval. Ops and heap reads never share an eval (a single heap
   * measurement can take 10s+), so every eval stays well inside the CLI's
   * action timeout while the merged checkpoint sequence matches a single-shot
   * loop exactly.
   */
  const memoryLoop = async (ops: readonly BenchMemoryOp[]): Promise<HarnessMemoryResult> => {
    const apiNames = new Set<string>();
    const checkpoints: HarnessMemoryCheckpoint[] = [];

    const takeSnapshot = async (): Promise<HarnessHeapSnapshot> => {
      const snapshot = await evalExpression<HarnessHeapSnapshot>(session, harnessCall('heapSnapshot', []));

      apiNames.add(snapshot.apiName);

      return snapshot;
    };

    checkpoints.push({ interactions: 0, heapMb: (await takeSnapshot()).heapMb });

    let executed = 0;

    for (let offset = 0; offset < ops.length; offset += MEMORY_LOOP_CHUNK_SIZE) {
      const chunk = ops.slice(offset, offset + MEMORY_LOOP_CHUNK_SIZE);
      const chunkResult = await evalExpression<HarnessMemoryRunResult>(
        session,
        harnessCall('memoryLoop', [chunk]),
      );

      executed += chunkResult.opCount;

      const snapshot = await takeSnapshot();

      checkpoints.push({ interactions: executed, heapMb: snapshot.heapMb });
    }

    if (apiNames.size > 1) {
      throw new Error(`The memory loop switched heap APIs mid-run: ${[...apiNames].join(', ')}.`);
    }

    return {
      apiName: apiNames.values().next().value ?? 'unknown',
      opCount: executed,
      checkpoints,
    };
  };

  /**
   * Streaming scenario loop: warmup passes go out as one untimed eval, then
   * ONE measured run per eval (a run paces 100 chunks over the scheduler's
   * ~16ms frame ticks, so batching every run into one eval could outlive the
   * CLI's CDP action timeout). The per-run flush totals are merged driver-side.
   */
  const streamLoop = async (options: HarnessLoopOptions): Promise<HarnessStreamResult> => {
    if (options.warmupRuns > 0) {
      await evalExpression<HarnessStreamRunResult>(
        session,
        harnessCall('streamLoop', [{ warmupRuns: options.warmupRuns, measuredRuns: 0 }]),
      );
    }

    const flushMsTotals: number[] = [];
    const commitCounts: number[] = [];
    let lastResult: HarnessStreamRunResult | undefined;

    for (let run = 0; run < options.measuredRuns; run += 1) {
      const result = await evalExpression<HarnessStreamRunResult>(
        session,
        harnessCall('streamLoop', [{ warmupRuns: 0, measuredRuns: 1 }]),
      );

      flushMsTotals.push(result.flushMsTotal);
      commitCounts.push(result.commitCount);
      lastResult = result;
    }

    if (lastResult === undefined) {
      throw new Error('The stream loop executed no measured runs.');
    }

    return {
      flushMsTotals,
      commitCounts,
      chunkCount: lastResult.chunkCount,
      finalText: lastResult.finalText,
    };
  };

  return {
    origin,
    chromiumUserAgent,
    openScenario,
    readRuntimeVersions: () =>
      evalExpression<Readonly<Record<string, string>>>(session, 'window.__benchRuntimeVersions ?? {}'),
    mountLoop: (options) => evalExpression<HarnessMountResult>(session, harnessCall('mountLoop', [options])),
    keystrokeLoop: (fieldName, text, options) =>
      evalExpression<HarnessKeystrokeResult>(session, harnessCall('keystrokeLoop', [fieldName, text, options])),
    submitLoop: (options) => evalExpression<HarnessSubmitResult>(session, harnessCall('submitLoop', [options])),
    switchPageSequenceLoop: async (pageNumbers, options) => {
      const { samples, lastResult } = await runSequenceLoopPerRun<HarnessSwitchResult>(
        session,
        'switchPageSequenceLoop',
        [pageNumbers],
        options,
      );

      if (lastResult === undefined) {
        throw new Error('The page-switch loop executed no runs.');
      }

      return { samples, activeIndex: lastResult.activeIndex };
    },
    switchTabSequenceLoop: async (tabIndices, options) => {
      const { samples, lastResult } = await runSequenceLoopPerRun<HarnessSwitchResult>(
        session,
        'switchTabSequenceLoop',
        [tabIndices],
        options,
      );

      if (lastResult === undefined) {
        throw new Error('The tab-switch loop executed no runs.');
      }

      return { samples, activeIndex: lastResult.activeIndex };
    },
    arraySequenceLoop: async (fieldName, ops, options) => {
      const { samples, lastResult } = await runSequenceLoopPerRun<HarnessArrayOpResult>(
        session,
        'arraySequenceLoop',
        [fieldName, ops],
        options,
      );

      if (lastResult === undefined) {
        throw new Error('The array loop executed no runs.');
      }

      return { samples, itemCount: lastResult.itemCount };
    },
    memoryLoop,
    streamLoop,
    evaluate: <T>(expression: string) => evalExpression<T>(session, expression),
    openUrl: async (url: string) => {
      await runAgentBrowser(['open', url], session);
    },
    focusSelector: async (selector: string) => {
      await runAgentBrowser(['focus', selector], session);
    },
    clickSelector: async (selector: string) => {
      await runAgentBrowser(['click', selector], session);
    },
    keyboardType: async (text: string) => {
      await runAgentBrowser(['keyboard', 'type', text], session);
    },
    startRenderRecording: async () => {
      await runAgentBrowser(['react', 'renders', 'start'], session);
    },
    stopRenderRecording: async () => {
      const data = await runAgentBrowserData(['react', 'renders', 'stop'], session);
      const report = data.report;

      if (typeof report !== 'string') {
        throw new Error('agent-browser react renders stop returned no report string.');
      }

      return parseRenderProfile(report);
    },
    startProfiler: async () => {
      await runAgentBrowser(['profiler', 'start'], session);
    },
    stopProfiler: async (profilePath: string) => {
      await runAgentBrowser(['profiler', 'stop', profilePath], session);
    },
    readVitals: async (url?: string) => {
      const data = await runAgentBrowserData(url === undefined ? ['vitals'] : ['vitals', url], session);
      const report = data.report;

      if (typeof report !== 'string') {
        throw new Error('agent-browser vitals returned no report string.');
      }

      return parseVitals(report);
    },
  };
}

/** Closes the session's browser; best-effort so `finally` teardown never masks the real error. */
export async function closeAgentBrowserSession(session: string): Promise<void> {
  try {
    await runAgentBrowser(['close'], session);
  } catch (error) {
    console.error(`Failed to close agent-browser session "${session}".`, error);
  }
}

/** Resolved `agent-browser` CLI version (environment metadata). */
export async function getAgentBrowserVersion(): Promise<string> {
  const result = await execFileAsync('pnpm', ['exec', 'agent-browser', '--version'], {
    cwd: repositoryRoot,
  });
  const output = result.stdout.trim();

  return /\d+\.\d+\.\d+/.exec(output)?.[0] ?? output;
}

export interface BenchFixturePreview {
  readonly origin: string;
  readonly port: number;
  stop(): Promise<void>;
}

async function waitForHttpOk(origin: string): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < HTTP_OK_TIMEOUT_MS) {
    try {
      const response = await fetch(origin);

      if (response.ok) {
        return;
      }

      lastError = new Error(`Fixture preview server responded with ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for the fixture preview at ${origin}. Last error: ${String(lastError)}`);
}

async function stopProcess(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  try {
    await Promise.race([once(child, 'exit'), delay(5_000)]);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
      await once(child, 'exit');
    }
  }
}

/** Builds a committed fixture once per run (`vite build`, deterministic output). */
export async function buildBenchFixture(fixture: BenchFixtureName): Promise<void> {
  await execFileAsync(
    'pnpm',
    ['--dir', 'apps/web', 'exec', 'vite', 'build', '--config', fixtureViteConfigPath(fixture)],
    { cwd: repositoryRoot, maxBuffer: 1024 * 1024 * 10 },
  );
}

/**
 * Serves the prebuilt fixture with `vite preview` on an allocated port
 * (port-book pattern). Deterministic static preview of committed output — one
 * server lifecycle per run, stopped by the runner's `finally`.
 */
export async function startBenchPreview(fixture: BenchFixtureName): Promise<BenchFixturePreview> {
  const port = await allocateLocalhostPort();
  const origin = `http://127.0.0.1:${port}`;
  const preview = spawn(
    'pnpm',
    [
      '--dir',
      'apps/web',
      'exec',
      'vite',
      'preview',
      '--config',
      fixtureViteConfigPath(fixture),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { cwd: repositoryRoot, env: process.env, stdio: 'pipe' },
  );

  preview.stdout.resume();
  preview.stderr.resume();

  try {
    await waitForHttpOk(origin);
  } catch (error) {
    await stopProcess(preview);
    throw error;
  }

  return { origin, port, stop: () => stopProcess(preview) };
}
