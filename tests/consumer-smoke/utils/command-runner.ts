import { spawn } from 'node:child_process';

import type { CommandSpec } from './registry-boundary.js';

export interface CommandResult {
  readonly commandText: string;
  readonly cwd: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunCommandOptions {
  readonly environment?: NodeJS.ProcessEnv;
}

/**
 * Runs a command and returns captured output for smoke-test diagnostics.
 */
export async function runCommand(spec: CommandSpec, options: RunCommandOptions = {}): Promise<CommandResult> {
  const commandText = formatCommand(spec);

  return await new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(spec.command, spec.args, {
      cwd: spec.cwd,
      env: options.environment ?? process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start command ${commandText} in ${spec.cwd}: ${error.message}`));
    });

    child.on('close', (code) => {
      const result: CommandResult = {
        commandText,
        cwd: spec.cwd,
        exitCode: code ?? -1,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      };

      if (result.exitCode !== 0) {
        reject(commandFailure(result));
        return;
      }

      resolve(result);
    });
  });
}

export function formatCommand(spec: CommandSpec): string {
  return [spec.command, ...spec.args].join(' ');
}

function commandFailure(result: CommandResult): Error {
  return new Error(
    [
      `Command failed with exit code ${result.exitCode}: ${result.commandText}`,
      `cwd: ${result.cwd}`,
      'stdout:',
      result.stdout,
      'stderr:',
      result.stderr,
    ].join('\n'),
  );
}
