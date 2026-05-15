import { readdir, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validatePublicRegistries } from './validate-public-registries.js';

const publicRegistryPackages = [
  'packages/formedible',
  'packages/formedible-parser',
  'packages/builder',
  'packages/ai-builder',
];

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

async function removeStaleGeneratedRegistryJson(rootDirectory, packageRoot) {
  const registryDirectory = join(rootDirectory, packageRoot, 'public', 'r');
  let entries;

  try {
    entries = await readdir(registryDirectory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      await unlink(join(registryDirectory, entry.name));
    }
  }
}

function runPackageRegistryBuild(rootDirectory, packageRoot) {
  return new Promise((resolveBuild, rejectBuild) => {
    const childProcess = spawn('pnpm', ['--dir', packageRoot, 'build:registry'], {
      cwd: rootDirectory,
      stdio: 'inherit',
      shell: false,
    });

    childProcess.on('error', (error) => {
      rejectBuild(new Error(`Failed to start registry build for ${packageRoot}: ${error.message}`));
    });

    childProcess.on('close', (exitCode, signal) => {
      if (exitCode === 0) {
        resolveBuild();
        return;
      }

      const reason = signal === null ? `exit code ${String(exitCode)}` : `signal ${signal}`;
      rejectBuild(new Error(`Registry build failed for ${packageRoot} with ${reason}.`));
    });
  });
}

export async function buildRegistries(options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? currentRootDirectory());

  for (const packageRoot of publicRegistryPackages) {
    await removeStaleGeneratedRegistryJson(rootDirectory, packageRoot);
    await runPackageRegistryBuild(rootDirectory, packageRoot);
  }

  await validatePublicRegistries({ rootDirectory });
}

async function main() {
  await buildRegistries();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
