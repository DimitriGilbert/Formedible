import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const smokeAppName = 'formedible-smoke';
const keepSmokeAppEnvironmentKey = 'KEEP_FORMEDIBLE_SMOKE_APP';

export interface ConsumerSmokeWorkspace {
  readonly rootDirectory: string;
  readonly appName: string;
  readonly appDirectory: string;
  readonly cleanup: (result: ConsumerSmokeCleanupInput) => Promise<ConsumerSmokeCleanupResult>;
}

export interface ConsumerSmokeCleanupInput {
  readonly failed: boolean;
}

export type ConsumerSmokeCleanupResult =
  | {
      readonly preserved: false;
      readonly directory: string;
    }
  | {
      readonly preserved: true;
      readonly directory: string;
      readonly reason: string;
    };

/**
 * Creates an isolated temp workspace for the heavyweight Formedible consumer
 * smoke app. Future phases scaffold the app inside {@link appDirectory}.
 */
export async function createConsumerSmokeWorkspace(): Promise<ConsumerSmokeWorkspace> {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'formedible-consumer-smoke-'));
  const appDirectory = join(rootDirectory, smokeAppName);

  return {
    rootDirectory,
    appName: smokeAppName,
    appDirectory,
    cleanup: (result) => cleanupConsumerSmokeWorkspace(rootDirectory, result),
  };
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) {
      return false;
    }

    throw error;
  }
}

async function cleanupConsumerSmokeWorkspace(
  rootDirectory: string,
  result: ConsumerSmokeCleanupInput,
): Promise<ConsumerSmokeCleanupResult> {
  if (result.failed && process.env[keepSmokeAppEnvironmentKey] === '1') {
    return {
      preserved: true,
      directory: rootDirectory,
      reason: `${keepSmokeAppEnvironmentKey}=1 preserved the failed Formedible consumer smoke workspace at ${rootDirectory}`,
    };
  }

  await rm(rootDirectory, { recursive: true, force: true });

  return {
    preserved: false,
    directory: rootDirectory,
  };
}

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
