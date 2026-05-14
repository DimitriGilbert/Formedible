import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

import type { GeneratedBetterTStackAppInspection } from './package-inspection.js';
import type { CommandSpec } from './registry-boundary.js';

export interface GeneratedAppServerCommand {
  readonly command: CommandSpec;
  readonly scriptName: 'preview' | 'start' | 'serve';
  readonly port: number;
  readonly origin: string;
  readonly environment: NodeJS.ProcessEnv;
}

export interface RunningGeneratedAppServer {
  readonly origin: string;
  readonly commandText: string;
  readonly stop: () => Promise<void>;
}

export function createGeneratedAppServerCommand(
  inspection: GeneratedBetterTStackAppInspection,
  port: number,
): GeneratedAppServerCommand {
  const scriptName = firstExistingServerScript(inspection.webPackage.scripts);

  if (!scriptName) {
    throw new Error(`Generated web package does not expose a preview/start server script: ${inspection.webPackage.path}`);
  }

  const origin = `http://127.0.0.1:${port}`;

  return {
    command: {
      command: 'pnpm',
      args: ['run', scriptName, '--host', '127.0.0.1', '--port', String(port)],
      cwd: packageDirectory(inspection.webPackage.path),
    },
    scriptName,
    port,
    origin,
    environment: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(port),
    },
  };
}

export async function startGeneratedAppServer(serverCommand: GeneratedAppServerCommand): Promise<RunningGeneratedAppServer> {
  const process = spawn(serverCommand.command.command, serverCommand.command.args, {
    cwd: serverCommand.command.cwd,
    env: serverCommand.environment,
    stdio: 'pipe',
  });
  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];

  process.stdout.on('data', (chunk: Buffer) => {
    stdoutChunks.push(chunk);
  });

  process.stderr.on('data', (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });

  try {
    await waitForHttpOk(`${serverCommand.origin}/formedible-smoke`, process, stdoutChunks, stderrChunks);
  } catch (error) {
    await stopProcess(process);
    throw error;
  }

  return {
    origin: serverCommand.origin,
    commandText: [serverCommand.command.command, ...serverCommand.command.args].join(' '),
    stop: () => stopProcess(process),
  };
}

function firstExistingServerScript(scripts: Readonly<Record<string, string>>): 'preview' | 'start' | 'serve' | undefined {
  if (typeof scripts.preview === 'string') {
    return 'preview';
  }

  if (typeof scripts.start === 'string') {
    return 'start';
  }

  if (typeof scripts.serve === 'string' && /\bpreview\b|\bstart\b/.test(scripts.serve)) {
    return 'serve';
  }

  return undefined;
}

function packageDirectory(packagePath: string): string {
  return packagePath.endsWith('/package.json') ? packagePath.slice(0, -'/package.json'.length) : packagePath;
}

async function waitForHttpOk(
  url: string,
  process: ChildProcessWithoutNullStreams,
  stdoutChunks: readonly Buffer[],
  stderrChunks: readonly Buffer[],
): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < 45_000) {
    if (process.exitCode !== null || process.signalCode !== null) {
      throw new Error(
        [
          `Generated app server exited before ${url} became available.`,
          `exitCode: ${process.exitCode ?? 'none'}`,
          `signalCode: ${process.signalCode ?? 'none'}`,
          'stdout:',
          Buffer.concat(stdoutChunks).toString('utf8'),
          'stderr:',
          Buffer.concat(stderrChunks).toString('utf8'),
        ].join('\n'),
      );
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }

      lastError = new Error(`Generated app server responded with ${response.status} for ${url}.`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw new Error(
    [
      `Timed out waiting for generated app server at ${url}.`,
      `Last error: ${String(lastError)}`,
      'stdout:',
      Buffer.concat(stdoutChunks).toString('utf8'),
      'stderr:',
      Buffer.concat(stderrChunks).toString('utf8'),
    ].join('\n'),
  );
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
