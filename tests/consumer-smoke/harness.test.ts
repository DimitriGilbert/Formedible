import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { join, relative } from 'node:path';
import test from 'node:test';

import { closeAgentBrowser, openPageAndCheckBrowserFailures, runAgentBrowserEval } from './utils/agent-browser.js';
import { createBetterTStackBootstrapPlan } from './utils/better-t-stack.js';
import { runCommand } from './utils/command-runner.js';
import { createGeneratedAppServerCommand, startGeneratedAppServer } from './utils/generated-app-server.js';
import { createGeneratedAppCommand, writeGeneratedLargeFormRoute } from './utils/generated-form-route.js';
import { inspectGeneratedBetterTStackApp } from './utils/package-inspection.js';
import { allocateLocalhostPort } from './utils/ports.js';
import { createConsumerSmokeRegistryBoundary, assertSupportedRegistryBoundary } from './utils/registry-boundary.js';
import { createConsumerSmokeWorkspace, pathExists } from './utils/temp-workspace.js';

test('consumer smoke temp workspace is created under OS temp and cleaned in finally', async () => {
  const workspace = await createConsumerSmokeWorkspace();
  let failed = true;

  try {
    assert.match(workspace.rootDirectory, /formedible-consumer-smoke-/);
    assert.equal(await pathExists(workspace.rootDirectory), true);
    assert.equal(workspace.appName, 'formedible-smoke');
    assert.equal(workspace.appDirectory.endsWith('/formedible-smoke'), true);
    failed = false;
  } finally {
    const cleanup = await workspace.cleanup({ failed });

    assert.equal(cleanup.preserved, false);
    assert.equal(await pathExists(workspace.rootDirectory), false);
  }
});

test('consumer smoke debug escape hatch preserves failed workspace with diagnostics', async () => {
  const previousKeepValue = process.env.KEEP_FORMEDIBLE_SMOKE_APP;
  const workspace = await createConsumerSmokeWorkspace();

  try {
    process.env.KEEP_FORMEDIBLE_SMOKE_APP = '1';

    const cleanup = await workspace.cleanup({ failed: true });

    assert.equal(cleanup.preserved, true);
    assert.equal(cleanup.directory, workspace.rootDirectory);
    assert.match(cleanup.reason, /KEEP_FORMEDIBLE_SMOKE_APP=1/);
    assert.match(cleanup.reason, new RegExp(escapeRegExp(workspace.rootDirectory)));
    assert.equal(await pathExists(workspace.rootDirectory), true);
  } finally {
    restoreEnvironmentValue('KEEP_FORMEDIBLE_SMOKE_APP', previousKeepValue);
    await rm(workspace.rootDirectory, { recursive: true, force: true });
  }
});

test('consumer smoke port allocation returns bindable non-default localhost ports', async () => {
  const ports = await Promise.all([allocateLocalhostPort(), allocateLocalhostPort(), allocateLocalhostPort()]);

  for (const port of ports) {
    assert.equal(Number.isInteger(port), true);
    assert.equal(port > 0, true, `Expected allocated port to be positive, received ${port}.`);
    assert.notEqual(port, 3000, 'Consumer smoke harness must not use TanStack or Vite default port 3000.');
    assert.notEqual(port, 5173, 'Consumer smoke harness must not use Vite default port 5173.');
  }
});

test('consumer smoke registry boundary uses the built local shadcn registry file', () => {
  const boundary = createConsumerSmokeRegistryBoundary(process.cwd());
  const installCommand = boundary.createLocalRegistryInstallCommand('/tmp/generated-consumer/apps/web');

  assertSupportedRegistryBoundary(boundary);
  assert.deepEqual(boundary.registryBuildCommand, {
    command: 'pnpm',
    args: ['--dir', 'packages/formedible', 'build:registry'],
    cwd: process.cwd(),
  });
  assert.match(boundary.registryFilePath, /packages\/formedible\/public\/r\/formedible-core\.json$/);
  assert.deepEqual(installCommand, {
    command: 'pnpm',
    args: ['dlx', 'shadcn@latest', 'add', boundary.registryFilePath, '--yes', '--overwrite'],
    cwd: '/tmp/generated-consumer/apps/web',
  });
  assert.equal(installCommand.args.includes('packages/formedible/src'), false);
  assert.equal(installCommand.args.includes('scripts/quick-sync.js'), false);
});

test('dependent registry items install Formedible core through registryDependencies', async () => {
  const repositoryRoot = process.cwd();

  await assertRegistryItemDependencies(join(repositoryRoot, 'packages/builder/public/r/form-builder.json'), {
    dependencies: ['https://formedible.dev/r/formedible-core.json'],
    targets: ['@ui/formedible/builder/form-builder.tsx', '@ui/formedible/lib/builder-types.ts'],
  });
  await assertRegistryItemDependencies(join(repositoryRoot, 'packages/formedible-parser/public/r/formedible-parser.json'), {
    dependencies: ['https://formedible.dev/r/formedible-core.json'],
    targets: ['@ui/formedible/lib/formedible-parser.ts', '@ui/formedible/lib/parser-types.ts'],
  });
  await assertRegistryItemDependencies(join(repositoryRoot, 'packages/ai-builder/public/r/ai-builder.json'), {
    dependencies: ['https://formedible.dev/r/formedible-core.json', 'https://formedible.dev/r/formedible-parser.json'],
    targets: ['@ui/formedible/ai/ai-builder.tsx', '@ui/formedible/lib/ai-parser.ts'],
  });
});

test('consumer smoke bootstraps Better-T-Stack app and installs Formedible from local registry file', { timeout: 600_000 }, async () => {
  const repositoryRoot = process.cwd();
  const workspace = await createConsumerSmokeWorkspace();
  let failed = true;

  try {
    assertDirectoryOutsideRepository(workspace.rootDirectory, repositoryRoot);

    const boundary = createConsumerSmokeRegistryBoundary(repositoryRoot);
    const bootstrapPlan = await createBetterTStackBootstrapPlan(repositoryRoot, workspace.rootDirectory);

    assert.match(bootstrapPlan.sourceCommand, /pnpm create better-t-stack@latest formedible /);
    assert.deepEqual(bootstrapPlan.scaffoldCommand.args, [
      'create',
      'better-t-stack@latest',
      workspace.appName,
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
    ]);

    await runCommand(boundary.registryBuildCommand);
    await runCommand(createRegistryBuildCommand(repositoryRoot, 'packages/builder'));
    await runCommand(createRegistryBuildCommand(repositoryRoot, 'packages/formedible-parser'));
    await runCommand(createRegistryBuildCommand(repositoryRoot, 'packages/ai-builder'));
    await runCommand(bootstrapPlan.scaffoldCommand, { environment: { ...process.env, CI: '1' } });

    const appInspection = await inspectGeneratedBetterTStackApp(workspace.appDirectory);

    assert.equal(appInspection.webPackageDirectory, join(workspace.appDirectory, 'apps', 'web'));
    assert.equal(appInspection.uiPackageDirectory, join(workspace.appDirectory, 'packages', 'ui'));
    assert.equal(typeof appInspection.rootPackage.scripts.dev, 'string', packageDiagnostic(appInspection.rootPackage.path));
    assert.equal(typeof appInspection.rootPackage.scripts.build, 'string', packageDiagnostic(appInspection.rootPackage.path));
    assert.equal(typeof appInspection.webPackage.scripts.dev, 'string', packageDiagnostic(appInspection.webPackage.path));
    assert.equal(typeof appInspection.webPackage.scripts.build, 'string', packageDiagnostic(appInspection.webPackage.path));

    const installCommand = boundary.createLocalRegistryInstallCommand(appInspection.webPackageDirectory);

    assert.equal(installCommand.cwd, appInspection.webPackageDirectory);
    assert.equal(installCommand.args[3], boundary.registryFilePath);
    assertSupportedRegistryBoundary(boundary);

    const localRegistry = await startLocalRegistryServer(repositoryRoot, await allocateLocalhostPort());

    try {
      await runCommand(createRegistryUrlInstallCommand(appInspection.webPackageDirectory, `${localRegistry.origin}/r/form-builder.json`), { environment: { ...process.env, CI: '1' } });
      await runCommand(createRegistryUrlInstallCommand(appInspection.webPackageDirectory, `${localRegistry.origin}/r/ai-builder.json`), { environment: { ...process.env, CI: '1' } });
    } finally {
      await localRegistry.stop();
    }

    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/formedible/hooks/use-formedible.tsx');
    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/formedible/fields');
    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/formedible/lib/types.ts');
    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/formedible/lib/formedible-parser.ts');
    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/formedible/builder/form-builder.tsx');
    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/formedible/ai/ai-builder.tsx');
    await assertInstalledPath(appInspection.uiPackageDirectory, 'src/components/button.tsx');

    const generatedRoute = await writeGeneratedLargeFormRoute(appInspection);
    assert.equal(generatedRoute.routePath, '/formedible-smoke');
    assert.equal(
      await pathExists(generatedRoute.routeFilePath),
      true,
      `Expected generated smoke route to be written at ${generatedRoute.routeFilePath}. Inspected route entries before writing: ${generatedRoute.routeDirectoryEntries.join(
        ', ',
      )}`,
    );
    assertGeneratedLargeFormRouteSource(generatedRoute.source);

    const typecheckCommand = createGeneratedAppCommand(appInspection, 'typecheck');
    const buildCommand = createGeneratedAppCommand(appInspection, 'build');

    await runCommand(buildCommand, { environment: { ...process.env, CI: '1' } });
    await runCommand(typecheckCommand, { environment: { ...process.env, CI: '1' } });

    const previewPort = await allocateLocalhostPort();
    const serverCommand = createGeneratedAppServerCommand(appInspection, previewPort);
    const session = `formedible-consumer-smoke-${process.pid}-${Date.now()}`;
    const server = await startGeneratedAppServer(serverCommand);

    try {
      assert.notEqual(serverCommand.port, 3000, 'Generated app browser smoke must not use TanStack or Vite default port 3000.');
      assert.notEqual(serverCommand.port, 5173, 'Generated app browser smoke must not use Vite default port 5173.');
      assert.equal(server.origin, `http://127.0.0.1:${previewPort}`);
      assert.match(server.commandText, new RegExp(`--port ${previewPort}`));

      await openPageAndCheckBrowserFailures({
        session,
        url: `${server.origin}/formedible-smoke`,
        allowedFailures: [
          {
            source: 'network',
            pattern: /favicon\.ico/,
            reason: 'Generated Better-T-Stack preview does not include a favicon; this is unrelated to Formedible runtime behavior.',
          },
        ],
        run: async () => {
          await runAgentBrowserEval(consumerSmokeBrowserInteractionScript, session);
        },
      });
    } finally {
      await closeAgentBrowser(session);
      await server.stop();
    }

    failed = false;
  } finally {
    const cleanup = await workspace.cleanup({ failed });

    if (cleanup.preserved) {
      throw new Error(cleanup.reason);
    }
  }
});

function restoreEnvironmentValue(key: string, previousValue: string | undefined): void {
  if (previousValue === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = previousValue;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface RegistryItemFile {
  readonly target?: string;
}

interface RegistryItemJson {
  readonly registryDependencies?: readonly string[];
  readonly files?: readonly RegistryItemFile[];
}

async function assertRegistryItemDependencies(path: string, expected: { readonly dependencies: readonly string[]; readonly targets: readonly string[] }): Promise<void> {
  const registryItem = parseRegistryItemJson(await readFile(path, 'utf8'));
  const dependencies = registryItem.registryDependencies ?? [];
  const targets = (registryItem.files ?? []).map((file) => file.target).filter((target): target is string => target !== undefined);

  for (const dependency of expected.dependencies) {
    assert.equal(dependencies.includes(dependency), true, `${path} must depend on ${dependency}`);
  }

  for (const target of expected.targets) {
    assert.equal(targets.includes(target), true, `${path} must install ${target}`);
  }
}

function parseRegistryItemJson(content: string): RegistryItemJson {
  const parsed: unknown = JSON.parse(content);

  assert.equal(typeof parsed, 'object');
  assert.notEqual(parsed, null);

  return parsed as RegistryItemJson;
}

function createRegistryBuildCommand(repositoryRoot: string, packageDirectory: string) {
  return {
    command: 'pnpm',
    args: ['--dir', packageDirectory, 'build:registry'],
    cwd: repositoryRoot,
  };
}

function createRegistryUrlInstallCommand(webPackageDirectory: string, registryUrl: string) {
  return {
    command: 'pnpm',
    args: ['dlx', 'shadcn@latest', 'add', registryUrl, '--yes', '--overwrite'],
    cwd: webPackageDirectory,
  };
}

interface LocalRegistryServer {
  readonly origin: string;
  readonly stop: () => Promise<void>;
}

async function startLocalRegistryServer(repositoryRoot: string, port: number): Promise<LocalRegistryServer> {
  const files = new Map<string, string>([
    ['/r/formedible-core.json', await readLocalRegistryItem(repositoryRoot, 'packages/formedible/public/r/formedible-core.json')],
    ['/r/form-builder.json', await readLocalRegistryItem(repositoryRoot, 'packages/builder/public/r/form-builder.json')],
    ['/r/formedible-parser.json', await readLocalRegistryItem(repositoryRoot, 'packages/formedible-parser/public/r/formedible-parser.json')],
    ['/r/ai-builder.json', await readLocalRegistryItem(repositoryRoot, 'packages/ai-builder/public/r/ai-builder.json')],
  ]);
  const origin = `http://127.0.0.1:${port}`;
  const server = createServer((request, response) => {
    const content = files.get(request.url ?? '');

    if (content === undefined) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(content.replaceAll('https://formedible.dev/r/', `${origin}/r/`));
  });

  await listen(server, port);

  return {
    origin,
    stop: () => closeServer(server),
  };
}

async function readLocalRegistryItem(repositoryRoot: string, relativePath: string): Promise<string> {
  return readFile(join(repositoryRoot, relativePath), 'utf8');
}

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function assertDirectoryOutsideRepository(directory: string, repositoryRoot: string): void {
  const relativePath = relative(repositoryRoot, directory);

  if (relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith('/'))) {
    throw new Error(`Generated consumer smoke app must remain outside the repo workspace. Directory: ${directory}`);
  }
}

async function assertInstalledPath(webPackageDirectory: string, relativePath: string): Promise<void> {
  const absolutePath = join(webPackageDirectory, relativePath);

  assert.equal(await pathExists(absolutePath), true, `Expected shadcn local registry install to create ${absolutePath}.`);
}

function packageDiagnostic(path: string): string {
  return `Expected generated package.json to expose scripts after inspection: ${path}`;
}

function assertGeneratedLargeFormRouteSource(source: string): void {
  assert.match(source, /createFileRoute\('\/formedible-smoke'\)/);
  assert.match(source, /Smoke form submitted/);
  assert.match(source, /type: 'multiCombobox'/);
  assert.match(source, /type: 'location'/);
  assert.match(source, /type: 'duration'/);
  assert.match(source, /persistence: \{/);
  assert.match(source, /analytics,/);
  assert.doesNotMatch(source, /\bany\b/);
  assert.doesNotMatch(source, /console\.(log|error)/);
  assert.doesNotMatch(source, /\b(alert|confirm)\s*\(/);
  assert.doesNotMatch(source, /TODO|FIXME/);
}

const consumerSmokeBrowserInteractionScript = String.raw`
(async () => {
  const storageKey = 'formedible-consumer-smoke-large-form';

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function visibleElements() {
    return Array.from(document.querySelectorAll('body *')).filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    });
  }

  function pageText() {
    return document.body.innerText || '';
  }

  function findVisibleElementByText(text) {
    return visibleElements().find((element) => element.textContent?.trim() === text);
  }

  function clickVisibleText(text) {
    const element = findVisibleElementByText(text);
    assert(element instanceof HTMLElement, 'Expected visible element with text: ' + text);
    activateElement(element);
  }

  function clickButton(text) {
    const button = visibleElements().find((element) => element instanceof HTMLButtonElement && element.textContent?.trim() === text);
    assert(button instanceof HTMLButtonElement, 'Expected visible button with text: ' + text);
    activateElement(button);
  }

  function clickButtonByLabel(label) {
    const button = visibleElements().find((element) => element instanceof HTMLButtonElement && element.getAttribute('aria-label') === label);
    assert(button instanceof HTMLButtonElement, 'Expected visible button with label: ' + label);
    activateElement(button);
  }

  function clickNamedControl(name) {
    const element = document.querySelector('[name="' + CSS.escape(name) + '"]');
    assert(element instanceof HTMLElement, 'Expected named control: ' + name);
    activateElement(element);
  }

  function clickLabeledControl(labelText) {
    const label = visibleElements().find((element) => element instanceof HTMLLabelElement && element.textContent?.trim() === labelText);
    assert(label instanceof HTMLLabelElement, 'Expected label: ' + labelText);
    assert(typeof label.htmlFor === 'string' && label.htmlFor.length > 0, 'Expected labelled control id for: ' + labelText);
    const element = document.getElementById(label.htmlFor);
    assert(element instanceof HTMLElement, 'Expected labelled control element for: ' + labelText);
    activateElement(element);
  }

  function activateElement(element) {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'mouse' }));
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'mouse' }));
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.click();
  }

  function setInputValue(name, value) {
    const element = document.querySelector('[name="' + CSS.escape(name) + '"]');
    assert(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement, 'Expected text input: ' + name);
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value');
    assert(descriptor?.set, 'Expected value setter for: ' + name);
    descriptor.set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  async function waitFor(predicate, message) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < 10000) {
      if (predicate()) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(message);
  }

  await waitFor(() => pageText().includes('Formedible Consumer Smoke Form'), 'Large smoke form heading did not render.');
  await waitFor(() => pageText().includes('Identity'), 'Profile tab fields did not render.');

  setInputValue('fullName', 'Ada Browser Smoke');
  setInputValue('workEmail', 'ada.browser@example.com');
  setInputValue('bio', 'Browser-level smoke coverage updates a representative subset of generated consumer fields.');
  setInputValue('age', '37');

  clickButton('Preferences');
  await waitFor(() => pageText().includes('Preferences') && pageText().includes('Improvement Notes'), 'Conditional improvement field did not render.');
  setInputValue('improvements', 'Conditional field exercised by the browser smoke test.');
  setInputValue('phoneNumber', '+14155550101');

  clickButton('Advanced Fields');
  await waitFor(() => pageText().includes('Technical Skills') && pageText().includes('Support Subject'), 'Advanced tab did not render.');
  await waitFor(() => {
    const stateControl = document.querySelector('[name="state"]');
    return stateControl instanceof HTMLButtonElement && stateControl.textContent?.includes('ca') === true;
  }, 'Dynamic state option for the default country did not initialize.');

  clickButton('Arrays');
  await waitFor(() => document.querySelector('[data-formedible-array-item="teamMembers[0]"]') !== null, 'Initial team member array item did not render.');
  clickButton('Add Team Member');
  await waitFor(() => document.querySelector('[data-formedible-array-item="teamMembers[1]"]') !== null, 'Added team member array item did not render.');
  setInputValue('teamMembers[1].name', 'Katherine Johnson');
  setInputValue('teamMembers[1].email', 'katherine@example.com');
  setInputValue('teamMembers[1].skills', 'orbital mechanics, verification');
  clickButtonByLabel('Remove Member 2');
  await waitFor(() => document.querySelector('[data-formedible-array-item="teamMembers[1]"]') === null, 'Removed team member array item remained visible.');

  clickNamedControl('roomDetails[0].equipementRoom');
  await waitFor(() => pageText().includes('Equipment List'), 'Nested conditional equipment field did not render.');
  setInputValue('roomDetails[0].equipementListRoom', 'Projector and whiteboard');

  clickButton('Submit Smoke Form');
  await waitFor(() => pageText().includes('Smoke form submitted'), 'Deterministic smoke form success state did not appear.');
  assert(window.localStorage.getItem(storageKey) === null, 'Expected Formedible persistence cleanup to clear local storage after submit.');

  return 'formedible consumer smoke browser interactions completed';
})()
`;
