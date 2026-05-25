import assert from 'node:assert/strict';
import { copyFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import { runCommand } from './utils/command-runner.js';
import { assertSupportedRegistryBoundary, createConsumerSmokeRegistryBoundary, type CommandSpec } from './utils/registry-boundary.js';
import { createConsumerSmokeWorkspace, pathExists } from './utils/temp-workspace.js';

const oldArrayFieldsFixturePath = join(process.cwd(), 'tests/consumer-smoke/fixtures/old-array-fields-app.tsx');

test('Vite base shadcn preset installs local Formedible registry and builds old array-field schema', { timeout: 600_000 }, async () => {
  const repositoryRoot = process.cwd();
  const workspace = await createConsumerSmokeWorkspace();
  let failed = true;

  try {
    const boundary = createConsumerSmokeRegistryBoundary(repositoryRoot);
    const scaffoldCommand = createViteBaseScaffoldCommand(workspace.rootDirectory);

    assertSupportedRegistryBoundary(boundary);
    assert.deepEqual(scaffoldCommand.args, ['dlx', 'shadcn@latest', 'init', '--preset', 'b5JNwVXgA', '--base', 'base', '--template', 'vite']);

    await runCommand(boundary.registryBuildCommand, { environment: { ...process.env, CI: '1' } });
    await runCommand(scaffoldCommand, { environment: { ...process.env, CI: '1' }, input: `${workspace.appName}\n` });

    assert.equal(await pathExists(workspace.appDirectory), true, `Expected shadcn Vite app to be created at ${workspace.appDirectory}.`);

    const installCommand = boundary.createLocalRegistryInstallCommand(workspace.appDirectory);

    assert.equal(installCommand.args[3], boundary.registryFilePath);
    await runCommand(installCommand, { environment: { ...process.env, CI: '1' } });

    await copyFile(oldArrayFieldsFixturePath, join(workspace.appDirectory, 'src', 'App.tsx'));

    const appSource = await readFile(join(workspace.appDirectory, 'src', 'App.tsx'), 'utf8');
    assert.match(appSource, /name: 'teamMembers'/);
    assert.match(appSource, /type: 'array'/);
    assert.match(appSource, /itemType: 'object'/);

    await runCommand(createViteTypecheckCommand(workspace.appDirectory), { environment: { ...process.env, CI: '1' } });
    await runCommand(createViteBuildCommand(workspace.appDirectory), { environment: { ...process.env, CI: '1' } });

    failed = false;
  } finally {
    const cleanup = await workspace.cleanup({ failed });

    if (cleanup.preserved) {
      console.info(cleanup.reason);
    }
  }
});

function createViteBaseScaffoldCommand(rootDirectory: string): CommandSpec {
  return {
    command: 'pnpm',
    args: ['dlx', 'shadcn@latest', 'init', '--preset', 'b5JNwVXgA', '--base', 'base', '--template', 'vite'],
    cwd: rootDirectory,
  };
}

function createViteTypecheckCommand(appDirectory: string): CommandSpec {
  return {
    command: 'pnpm',
    args: ['exec', 'tsc', '-b'],
    cwd: appDirectory,
  };
}

function createViteBuildCommand(appDirectory: string): CommandSpec {
  return {
    command: 'pnpm',
    args: ['run', 'build'],
    cwd: appDirectory,
  };
}
