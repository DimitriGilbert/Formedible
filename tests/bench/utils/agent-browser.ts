import { execFile, spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { allocateLocalhostPort } from '../../consumer-smoke/utils/ports';
import type {
  HarnessArrayOpResult,
  HarnessKeystrokeResult,
  HarnessLoopOptions,
  HarnessMountResult,
  HarnessPersistenceResult,
  HarnessStatus,
  HarnessSubmitResult,
  HarnessSwitchResult,
} from '../lib/harness-protocol';

/**
 * Benchmark browser driver (PERF-BENCHMARK-PLAN.md Phase 1, DECISION-2
 * revised): real Chromium driven by `agent-browser`, modeled on
 * `tests/e2e/utils/agent-browser.ts` (per-suite utils are the repo
 * convention). This module implements the adapter-operations surface from
 * `adapter-types.ts` adapted to browser reality — mount, keystroke, switchPage,
 * switchTab, arrayAdd, arrayRemove, submit, persistenceSave, and rendered-field
 * counting — by driving the REAL page served from the committed fixture.
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
const fixtureViteConfig = path.join(
  repositoryRoot,
  'tests',
  'bench',
  'fixtures',
  'current-consumer',
  'vite.config.ts',
);

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

async function runAgentBrowser(args: readonly string[], session: string): Promise<AgentBrowserResult> {
  const result = await execFileAsync('pnpm', ['exec', 'agent-browser', '--session', session, ...args], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      AGENT_BROWSER_MAX_OUTPUT: process.env.AGENT_BROWSER_MAX_OUTPUT ?? '50000',
    },
    maxBuffer: 1024 * 1024 * 10,
  });

  return { stdout: result.stdout, stderr: result.stderr };
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
  /** User agent of the session's Chromium (environment metadata). */
  readonly chromiumUserAgent: string;
  /** Opens `/?scenario=<id>` on the fixture origin and waits until mounted. */
  openScenario(scenarioId: string): Promise<void>;
  mountLoop(options: HarnessLoopOptions): Promise<HarnessMountResult>;
  keystrokeLoop(fieldName: string, text: string, options: HarnessLoopOptions): Promise<HarnessKeystrokeResult>;
  submitLoop(options: HarnessLoopOptions): Promise<HarnessSubmitResult>;
  switchPageLoop(pageNumber: number, options: HarnessLoopOptions): Promise<HarnessSwitchResult>;
  switchTabLoop(tabIndex: number, options: HarnessLoopOptions): Promise<HarnessSwitchResult>;
  arrayAddLoop(fieldName: string, options: HarnessLoopOptions): Promise<HarnessArrayOpResult>;
  arrayRemoveLoop(
    fieldName: string,
    itemIndex: number,
    options: HarnessLoopOptions,
  ): Promise<HarnessArrayOpResult>;
  persistenceSaveLoop(options: HarnessLoopOptions): Promise<HarnessPersistenceResult>;
}

/**
 * Opens the session's browser on about:blank (which launches Chromium for the
 * session), pins the fixed viewport, captures the user agent, and returns the
 * driver bound to that session and fixture origin.
 */
export async function createAgentBrowserDriver(session: string, origin: string): Promise<BenchBrowserDriver> {
  await runAgentBrowser(['open', 'about:blank'], session);
  await runAgentBrowser(['set', 'viewport', String(BENCH_VIEWPORT_WIDTH), String(BENCH_VIEWPORT_HEIGHT)], session);

  const chromiumUserAgent = await evalExpression<string>(session, 'navigator.userAgent');

  const openScenario = async (scenarioId: string): Promise<void> => {
    await runAgentBrowser(['open', `${origin}/?scenario=${encodeURIComponent(scenarioId)}`], session);
    await waitForHarnessReady(session);
  };

  return {
    chromiumUserAgent,
    openScenario,
    mountLoop: (options) => evalExpression<HarnessMountResult>(session, harnessCall('mountLoop', [options])),
    keystrokeLoop: (fieldName, text, options) =>
      evalExpression<HarnessKeystrokeResult>(session, harnessCall('keystrokeLoop', [fieldName, text, options])),
    submitLoop: (options) => evalExpression<HarnessSubmitResult>(session, harnessCall('submitLoop', [options])),
    switchPageLoop: (pageNumber, options) =>
      evalExpression<HarnessSwitchResult>(session, harnessCall('switchPageLoop', [pageNumber, options])),
    switchTabLoop: (tabIndex, options) =>
      evalExpression<HarnessSwitchResult>(session, harnessCall('switchTabLoop', [tabIndex, options])),
    arrayAddLoop: (fieldName, options) =>
      evalExpression<HarnessArrayOpResult>(session, harnessCall('arrayAddLoop', [fieldName, options])),
    arrayRemoveLoop: (fieldName, itemIndex, options) =>
      evalExpression<HarnessArrayOpResult>(session, harnessCall('arrayRemoveLoop', [fieldName, itemIndex, options])),
    persistenceSaveLoop: (options) =>
      evalExpression<HarnessPersistenceResult>(session, harnessCall('persistenceSaveLoop', [options])),
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

/** Builds the committed fixture once per run (`vite build`, deterministic output). */
export async function buildCurrentConsumerFixture(): Promise<void> {
  await execFileAsync(
    'pnpm',
    ['--dir', 'apps/web', 'exec', 'vite', 'build', '--config', fixtureViteConfig],
    { cwd: repositoryRoot, maxBuffer: 1024 * 1024 * 10 },
  );
}

/**
 * Serves the prebuilt fixture with `vite preview` on an allocated port
 * (port-book pattern). Deterministic static preview of committed output — one
 * server lifecycle per run, stopped by the runner's `finally`.
 */
export async function startCurrentConsumerPreview(): Promise<BenchFixturePreview> {
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
      fixtureViteConfig,
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
