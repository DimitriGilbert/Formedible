import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { CommandSpec } from './registry-boundary.js';

const groundedProjectName = 'formedible';
const smokeProjectName = 'formedible-smoke';

const expectedGroundedFlags = [
  '--frontend',
  'tanstack-start',
  '--backend',
  'none',
  '--runtime',
  'none',
  '--database',
  'none',
  '--orm',
  'none',
  '--api',
  'none',
  '--auth',
  'none',
  '--payments',
  'none',
  '--addons',
  'turborepo',
  '--examples',
  'none',
  '--db-setup',
  'none',
  '--web-deploy',
  'none',
  '--server-deploy',
  'none',
  '--git',
  '--package-manager',
  'pnpm',
  '--install',
] as const;

export interface BetterTStackBootstrapPlan {
  readonly sourceCommand: string;
  readonly scaffoldCommand: CommandSpec;
}

/**
 * Creates the Better-T-Stack scaffold command from bts.jsonc's reproducibleCommand.
 */
export async function createBetterTStackBootstrapPlan(
  repositoryRoot: string,
  generatedRootDirectory: string,
): Promise<BetterTStackBootstrapPlan> {
  const sourceCommand = await readBetterTStackReproducibleCommand(repositoryRoot);
  const tokens = tokenizeSimpleCommand(sourceCommand);
  const groundedProjectIndex = tokens.indexOf(groundedProjectName);

  if (groundedProjectIndex === -1) {
    throw new Error(`bts.jsonc reproducibleCommand does not contain expected project name ${groundedProjectName}: ${sourceCommand}`);
  }

  const commandPrefix = tokens.slice(0, groundedProjectIndex);
  const groundedFlags = tokens.slice(groundedProjectIndex + 1);

  assertGroundedCommandPrefix(commandPrefix, sourceCommand);
  assertGroundedFlags(groundedFlags, sourceCommand);

  return {
    sourceCommand,
    scaffoldCommand: {
      command: commandPrefix[0] ?? 'pnpm',
      args: [...commandPrefix.slice(1), smokeProjectName, ...groundedFlags],
      cwd: generatedRootDirectory,
    },
  };
}

async function readBetterTStackReproducibleCommand(repositoryRoot: string): Promise<string> {
  const btsJsonc = await readFile(join(repositoryRoot, 'bts.jsonc'), 'utf8');
  const match = /"reproducibleCommand"\s*:\s*"([^"]+)"/.exec(btsJsonc);

  if (!match?.[1]) {
    throw new Error('Unable to find reproducibleCommand in bts.jsonc.');
  }

  return match[1];
}

function tokenizeSimpleCommand(command: string): string[] {
  const tokens = command.trim().split(/\s+/).filter((token) => token.length > 0);

  if (tokens.length === 0) {
    throw new Error('Better-T-Stack reproducibleCommand is empty.');
  }

  return tokens;
}

function assertGroundedCommandPrefix(commandPrefix: readonly string[], sourceCommand: string): void {
  const expectedPrefix = ['pnpm', 'create', 'better-t-stack@latest'];

  if (!arraysEqual(commandPrefix, expectedPrefix)) {
    throw new Error(
      `Unexpected Better-T-Stack command prefix in bts.jsonc. Expected ${expectedPrefix.join(' ')}, received ${commandPrefix.join(
        ' ',
      )}. Source: ${sourceCommand}`,
    );
  }
}

function assertGroundedFlags(flags: readonly string[], sourceCommand: string): void {
  if (!arraysEqual(flags, expectedGroundedFlags)) {
    throw new Error(
      `Unexpected Better-T-Stack flags in bts.jsonc. Expected ${expectedGroundedFlags.join(' ')}, received ${flags.join(
        ' ',
      )}. Source: ${sourceCommand}`,
    );
  }
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
