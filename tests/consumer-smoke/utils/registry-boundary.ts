import { join } from 'node:path';

const registryRelativePath = 'packages/formedible/public/r/formedible-core.json';

export interface CommandSpec {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
}

export interface ConsumerSmokeRegistryBoundary {
  readonly repositoryRoot: string;
  readonly registryFilePath: string;
  readonly registryBuildCommand: CommandSpec;
  readonly createLocalRegistryInstallCommand: (generatedWebPackageDirectory: string) => CommandSpec;
}

/**
 * Describes the only supported Formedible consumer-smoke installation boundary:
 * build the local shadcn registry item, then install that built JSON file from
 * inside the generated app's web package.
 */
export function createConsumerSmokeRegistryBoundary(repositoryRoot: string): ConsumerSmokeRegistryBoundary {
  const registryFilePath = join(repositoryRoot, registryRelativePath);

  return {
    repositoryRoot,
    registryFilePath,
    registryBuildCommand: {
      command: 'pnpm',
      args: ['--dir', 'packages/formedible', 'build:registry'],
      cwd: repositoryRoot,
    },
    createLocalRegistryInstallCommand: (generatedWebPackageDirectory) => ({
      command: 'pnpm',
      args: ['dlx', 'shadcn@latest', 'add', registryFilePath, '--yes', '--overwrite'],
      cwd: generatedWebPackageDirectory,
    }),
  };
}

export function assertSupportedRegistryBoundary(boundary: ConsumerSmokeRegistryBoundary): void {
  if (!boundary.registryFilePath.endsWith(registryRelativePath)) {
    throw new Error(`Consumer smoke install must use the built local registry file. Received: ${boundary.registryFilePath}`);
  }

  const forbiddenFragments = ['packages/formedible/src', 'scripts/quick-sync.js'];
  const installCommand = boundary.createLocalRegistryInstallCommand(join(boundary.repositoryRoot, 'generated/apps/web'));
  const commandText = [installCommand.command, ...installCommand.args, installCommand.cwd].join(' ');

  for (const fragment of forbiddenFragments) {
    if (commandText.includes(fragment)) {
      throw new Error(`Consumer smoke install boundary must not reference ${fragment}. Command: ${commandText}`);
    }
  }
}
