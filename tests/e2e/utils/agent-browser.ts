import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import { appendFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const recordingsDirectory = path.resolve(__dirname, '../../.recordings');

/**
 * Tracks how many recording segments have been started per session so a mid-test
 * re-open continues into `<session>-part2.webm`, `-part3.webm`, and so on. The
 * initial recording (started by `openPageAndCheckBrowserFailures`) is implicit
 * segment 1 and is not stored. Sessions embed the process pid and each test
 * process runs once, so counters never need resetting within a run.
 */
const recordingSegmentCounts = new Map<string, number>();

export interface AgentBrowserResult {
  readonly stdout: string;
  readonly stderr: string;
}

export interface PreviewServer {
  readonly origin: string;
  readonly stop: () => Promise<void>;
}

export interface WebTarget {
  readonly origin: string;
  readonly stop: () => Promise<void>;
}

export type BrowserFailureSource = 'console' | 'page-error' | 'network';

export interface AllowedBrowserFailure {
  readonly source: BrowserFailureSource;
  readonly pattern: RegExp;
  readonly reason: string;
}

/**
 * Opens a page, runs test interactions, then asserts agent-browser did not
 * capture console errors, uncaught page errors, or failed network requests.
 * `testName` is the owning node:test title; when recording is enabled it is
 * written to the recordings manifest so the stitcher can name the merged video
 * after the test.
 */
export interface OpenPageOptions<TInteractionResult> {
  readonly session: string;
  readonly testName: string;
  readonly url: string;
  readonly allowedFailures?: readonly AllowedBrowserFailure[];
  readonly run: () => Promise<TInteractionResult>;
}

interface BrowserFailure {
  readonly source: BrowserFailureSource;
  readonly diagnostic: string;
}

type JsonObject = Record<string, unknown>;

export async function runAgentBrowser(args: readonly string[], session: string): Promise<AgentBrowserResult> {
  const result = await execFileAsync('pnpm', ['exec', 'agent-browser', '--session', session, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AGENT_BROWSER_MAX_OUTPUT: process.env.AGENT_BROWSER_MAX_OUTPUT ?? '50000',
    },
    maxBuffer: 1024 * 1024 * 10,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Whether opt-in e2e video recording is enabled through the E2E_RECORD
 * environment variable. Only the exact values "1" and "true" (case-insensitive)
 * enable it; every other value keeps recording off so CI runs do not accumulate
 * videos.
 */
export function isE2ERecordingEnabled(): boolean {
  const value = process.env.E2E_RECORD;

  return value === '1' || value?.toLowerCase() === 'true';
}

/**
 * Starts a WebM recording for the session after the page is opened. Recording
 * must start after `open`: `record start` swaps in a fresh recorded context that
 * re-navigates to the current page, while a recording started before `open`
 * keeps recording a context the `open` navigation never joins. `recordingName`
 * selects the output file (without extension). Returns the absolute output path.
 */
async function startSessionRecording(session: string, recordingName = session): Promise<string> {
  await mkdir(recordingsDirectory, { recursive: true });

  const recordingPath = path.join(recordingsDirectory, `${recordingName}.webm`);

  await runAgentBrowser(['record', 'start', recordingPath], session);
  console.log(`[e2e] recording session ${session} -> ${recordingPath}`);

  return recordingPath;
}

/**
 * Appends one `{ session, testName }` line to the recordings manifest so
 * scripts/stitch-e2e-recordings.js can name each session's merged video after
 * its test. The manifest is JSON-lines because node:test runs every test file
 * as its own process and files may record concurrently; a small append is
 * atomic while rewriting a shared JSON array would race.
 */
async function appendRecordingManifestEntry(session: string, testName: string): Promise<void> {
  const manifestPath = path.join(recordingsDirectory, 'manifest.json');

  await appendFile(manifestPath, `${JSON.stringify({ session, testName })}\n`, 'utf8');
}

/**
 * Stops the active session recording, tolerating the CLI failure raised when no
 * recording is in progress so cleanup stays best-effort. Any other failure is
 * rethrown.
 */
async function stopSessionRecording(session: string): Promise<void> {
  try {
    await runAgentBrowser(['record', 'stop'], session);
  } catch (error) {
    if (!isNoRecordingInProgressError(error)) {
      throw error;
    }
  }
}

/**
 * Forces one invisible compositor repaint so a recording stopped right now ends
 * on the page state the test has actually reached. The screencast only emits
 * frames on repaints, and the recorder goes quiet while the page sits idle, so
 * the most recent visual change (the very last interaction of a test, or the
 * state just before a mid-test re-open) can otherwise fall off the end of the
 * video. Toggling a compositing hint on the root element leaves no visible or
 * behavioral trace and cannot affect test outcomes; when called after test
 * interactions it also runs after diagnostics are collected. Best-effort:
 * failures are logged and ignored so recording teardown still runs.
 */
async function flushFinalRecordingFrame(session: string): Promise<void> {
  try {
    await runAgentBrowser(
      [
        'eval',
        `(() => {
          const root = document.documentElement;
          root.style.willChange = 'transform';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            root.style.willChange = '';
          }));
        })()`,
      ],
      session,
    );
    await delay(500);
  } catch (error) {
    console.error(`Failed to flush the final recording frame for session "${session}".`, error);
  }
}

interface ExecFileFailure extends Error {
  readonly stdout?: string;
  readonly stderr?: string;
}

function isNoRecordingInProgressError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const failure = error as ExecFileFailure;
  const output = `${failure.message}\n${failure.stdout ?? ''}\n${failure.stderr ?? ''}`;

  return output.includes('No recording in progress');
}

/**
 * Re-opens the session page mid-test. A plain `open` swaps the session's active
 * page out from under the recording context, which keeps recording the previous
 * page forever, so the video truncates at the re-open. When recording is enabled
 * the active recording is therefore stopped first (tolerating a missing one,
 * after flushing its final frame so the segment ends on the page state the test
 * had reached) and a fresh one started into the next segment file after the
 * navigation. With recording disabled this is exactly a plain `open`.
 */
export async function reopenPageWithRecording(session: string, url: string): Promise<void> {
  if (!isE2ERecordingEnabled()) {
    await runAgentBrowser(['open', url], session);
    return;
  }

  await flushFinalRecordingFrame(session);
  await stopSessionRecording(session);
  await runAgentBrowser(['open', url], session);

  const nextSegment = (recordingSegmentCounts.get(session) ?? 1) + 1;

  recordingSegmentCounts.set(session, nextSegment);
  await startSessionRecording(session, `${session}-part${nextSegment}`);
}

export async function openPageAndCheckBrowserFailures<TInteractionResult>(
  options: OpenPageOptions<TInteractionResult>,
): Promise<TInteractionResult> {
  await clearBrowserDiagnostics(options.session);
  await runAgentBrowser(['open', options.url], options.session);

  const recordingPath = isE2ERecordingEnabled() ? await startSessionRecording(options.session) : undefined;

  if (recordingPath !== undefined) {
    await appendRecordingManifestEntry(options.session, options.testName);
  }

  try {
    let interactionResult!: TInteractionResult;
    let interactionError: unknown;

    try {
      interactionResult = await options.run();
    } catch (error) {
      interactionError = error;
    }

    const diagnosticsError = await getBrowserFailureAssertionError(options.session, options.allowedFailures ?? []);

    if (interactionError && diagnosticsError) {
      throw new AggregateError(
        [interactionError, diagnosticsError],
        'Page interaction failed and browser diagnostics reported failures.',
      );
    }

    if (interactionError) {
      throw interactionError;
    }

    if (diagnosticsError) {
      throw diagnosticsError;
    }

    return interactionResult;
  } finally {
    if (recordingPath !== undefined) {
      await flushFinalRecordingFrame(options.session);
      await stopSessionRecording(options.session);
    }
  }
}

export async function assertNoBrowserFailures(
  session: string,
  allowedFailures: readonly AllowedBrowserFailure[] = [],
): Promise<void> {
  const assertionError = await getBrowserFailureAssertionError(session, allowedFailures);

  if (assertionError) {
    throw assertionError;
  }
}

export async function closeAgentBrowser(session: string): Promise<void> {
  try {
    await runAgentBrowser(['close'], session);
  } catch (error) {
    console.error(`Failed to close agent-browser session "${session}".`, error);
  }
}

async function clearBrowserDiagnostics(session: string): Promise<void> {
  await runAgentBrowser(['console', '--clear'], session);
  await runAgentBrowser(['errors', '--clear'], session);
  await runAgentBrowser(['network', 'requests', '--clear'], session);
}

async function getBrowserFailureAssertionError(
  session: string,
  allowedFailures: readonly AllowedBrowserFailure[],
): Promise<Error | undefined> {
  validateAllowedFailures(allowedFailures);

  const [consoleResult, errorsResult, networkResult] = await Promise.all([
    runAgentBrowser(['console', '--json'], session),
    runAgentBrowser(['errors', '--json'], session),
    runAgentBrowser(['network', 'requests', '--json'], session),
  ]);
  const failures = [
    ...getConsoleFailures(consoleResult),
    ...getPageFailures(errorsResult),
    ...getNetworkFailures(networkResult),
  ];
  const unallowedFailures = failures.filter((failure) => !isAllowedFailure(failure, allowedFailures));

  if (unallowedFailures.length === 0) {
    return undefined;
  }

  const diagnostics = unallowedFailures
    .map((failure, index) => `${index + 1}. [${failure.source}] ${failure.diagnostic}`)
    .join('\n\n');

  return new Error(`Browser diagnostics reported runtime failures.\n\n${diagnostics}`);
}

function validateAllowedFailures(allowedFailures: readonly AllowedBrowserFailure[]): void {
  for (const allowedFailure of allowedFailures) {
    assert.notEqual(allowedFailure.reason.trim(), '', 'Allowed browser failures must document a non-empty reason.');
  }
}

function isAllowedFailure(failure: BrowserFailure, allowedFailures: readonly AllowedBrowserFailure[]): boolean {
  return allowedFailures.some((allowedFailure) => {
    if (allowedFailure.source !== failure.source) {
      return false;
    }

    allowedFailure.pattern.lastIndex = 0;

    return allowedFailure.pattern.test(failure.diagnostic);
  });
}

function getConsoleFailures(result: AgentBrowserResult): readonly BrowserFailure[] {
  const messages = readJsonArray(result.stdout, 'messages');

  return messages.flatMap((message) => {
    const diagnostic = formatUnknownDiagnostic(message);
    const level = getStringProperty(message, ['level', 'type', 'severity']);

    if (level && ['error', 'fatal'].includes(level.toLowerCase())) {
      return [{ source: 'console', diagnostic }];
    }

    return [];
  });
}

function getPageFailures(result: AgentBrowserResult): readonly BrowserFailure[] {
  const errors = readJsonArray(result.stdout, 'errors');

  return errors.map((error) => ({
    source: 'page-error',
    diagnostic: formatUnknownDiagnostic(error),
  }));
}

function getNetworkFailures(result: AgentBrowserResult): readonly BrowserFailure[] {
  const requests = readJsonArray(result.stdout, 'requests');

  return requests.flatMap((request) => {
    const diagnostic = formatUnknownDiagnostic(request);
    const status = getNumberProperty(request, ['status', 'statusCode', 'responseStatus']);
    const errorText = getStringProperty(request, ['errorText', 'failureText', 'error', 'failedReason']);
    const failed = getBooleanProperty(request, ['failed', 'failure']);

    if ((status !== undefined && status >= 400) || Boolean(errorText) || failed === true) {
      return [{ source: 'network', diagnostic }];
    }

    return [];
  });
}

function readJsonArray(stdout: string, propertyName: string): readonly unknown[] {
  const parsed = parseJsonObject(stdout);
  const data = toJsonObject(parsed.data);
  const value = data?.[propertyName];

  if (!Array.isArray(value)) {
    throw new Error(`agent-browser JSON output did not include data.${propertyName} array. Output: ${stdout}`);
  }

  return value;
}

function parseJsonObject(stdout: string): JsonObject {
  const parsed: unknown = JSON.parse(stdout);
  const object = toJsonObject(parsed);

  if (!object) {
    throw new Error(`agent-browser JSON output was not an object. Output: ${stdout}`);
  }

  return object;
}

function toJsonObject(value: unknown): JsonObject | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as JsonObject;
}

function getStringProperty(value: unknown, propertyNames: readonly string[]): string | undefined {
  const object = toJsonObject(value);

  if (!object) {
    return undefined;
  }

  for (const propertyName of propertyNames) {
    const propertyValue = object[propertyName];

    if (typeof propertyValue === 'string') {
      return propertyValue;
    }
  }

  return undefined;
}

function getNumberProperty(value: unknown, propertyNames: readonly string[]): number | undefined {
  const object = toJsonObject(value);

  if (!object) {
    return undefined;
  }

  for (const propertyName of propertyNames) {
    const propertyValue = object[propertyName];

    if (typeof propertyValue === 'number') {
      return propertyValue;
    }
  }

  return undefined;
}

function getBooleanProperty(value: unknown, propertyNames: readonly string[]): boolean | undefined {
  const object = toJsonObject(value);

  if (!object) {
    return undefined;
  }

  for (const propertyName of propertyNames) {
    const propertyValue = object[propertyName];

    if (typeof propertyValue === 'boolean') {
      return propertyValue;
    }
  }

  return undefined;
}

function formatUnknownDiagnostic(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

export async function getWebTarget(): Promise<WebTarget> {
  const baseUrl = process.env.E2E_BASE_URL?.trim();

  if (baseUrl) {
    const origin = normalizeBaseUrl(baseUrl);
    await waitForHttpOk(origin);

    return {
      origin,
      stop: async () => {},
    };
  }

  return startWebPreview();
}

export async function startWebPreview(): Promise<PreviewServer> {
  const port = await findAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const preview = spawnPreviewServer(port);

  try {
    await waitForHttpOk(origin);
  } catch (error) {
    await stopProcess(preview);
    throw error;
  }

  return {
    origin,
    stop: () => stopProcess(preview),
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`E2E_BASE_URL must be a valid URL. Received: ${baseUrl}`);
  }
}

async function findAvailablePort(): Promise<number> {
  const server = createServer();

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  if (!address || typeof address === 'string') {
    throw new Error('Unable to allocate a local port for the e2e preview server.');
  }

  return address.port;
}

function spawnPreviewServer(port: number): ChildProcessWithoutNullStreams {
  const preview = spawn('pnpm', ['--dir', 'apps/web', 'exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'pipe',
  });

  preview.stdout.resume();
  preview.stderr.resume();

  return preview;
}

async function waitForHttpOk(origin: string): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < 30_000) {
    try {
      const response = await fetch(origin);

      if (response.ok) {
        return;
      }

      lastError = new Error(`Preview server responded with ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for web preview at ${origin}. Last error: ${String(lastError)}`);
}

async function stopProcess(process: ChildProcessWithoutNullStreams): Promise<void> {
  if (process.exitCode !== null || process.signalCode !== null) {
    return;
  }

  process.kill('SIGTERM');

  try {
    await Promise.race([once(process, 'exit'), delay(5_000)]);
  } finally {
    if (process.exitCode === null && process.signalCode === null) {
      process.kill('SIGKILL');
      await once(process, 'exit');
    }
  }
}
