import { once } from 'node:events';
import { execFile, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';

const execFileAsync = promisify(execFile);

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

export async function closeAgentBrowser(session: string): Promise<void> {
  try {
    await runAgentBrowser(['close'], session);
  } catch (error) {
    console.error(`Failed to close agent-browser session "${session}".`, error);
  }
}

export async function getWebTarget(): Promise<WebTarget> {
  const baseUrl = process.env.E2E_BASE_URL?.trim();

  if (baseUrl) {
    const origin = normalizeBaseUrl(baseUrl);
    await waitForHttpOk(origin);

    return {
      origin,
      stop: async () => undefined,
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

  preview.stdout.on('data', () => undefined);
  preview.stderr.on('data', () => undefined);

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
