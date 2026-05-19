import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultRoutes = [
  {
    ownerRoot: 'packages/formedible',
    destinationRoots: ['packages/ui/src/components'],
    useRegistryTargets: true,
  },
  {
    ownerRoot: 'packages/formedible-parser',
    destinationRoots: ['packages/ui/src/components'],
    useRegistryTargets: true,
  },
  {
    ownerRoot: 'packages/builder',
    destinationRoots: ['packages/ui/src/components'],
    useRegistryTargets: true,
  },
  {
    ownerRoot: 'packages/ai-builder',
    destinationRoots: ['packages/ui/src/components'],
    useRegistryTargets: true,
  },
  {
    ownerRoot: 'packages/ai-picker',
    destinationRoots: ['packages/ui/src/components'],
    useRegistryTargets: true,
  },
];

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringProperty(record, propertyName) {
  const value = record[propertyName];

  return typeof value === 'string' ? value : undefined;
}

function readStringArrayProperty(record, propertyName) {
  const value = record[propertyName];

  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : undefined;
}

async function readJsonFile(path) {
  const content = await readFile(path, 'utf8');

  return JSON.parse(content);
}

async function readRegistryFiles(registryPath) {
  const registry = await readJsonFile(registryPath);

  if (!isRecord(registry) || !Array.isArray(registry.items)) {
    throw new Error(`Invalid registry file: ${registryPath}`);
  }

  const files = [];

  for (const item of registry.items) {
    if (!isRecord(item) || !Array.isArray(item.files)) {
      continue;
    }

    for (const file of item.files) {
      if (!isRecord(file)) {
        continue;
      }

      const sourcePath = readStringProperty(file, 'path');
      const targetPath = readStringProperty(file, 'target');

      if (sourcePath !== undefined && targetPath !== undefined) {
        files.push({ sourcePath, targetPath });
      }
    }
  }

  return files;
}

function readBooleanProperty(record, propertyName) {
  const value = record[propertyName];

  return typeof value === 'boolean' ? value : undefined;
}

function resolveSyncTargetPath(sourcePath, targetPath, useRegistryTargets) {
  if (useRegistryTargets && targetPath.startsWith('@ui/')) {
    return targetPath.slice('@ui/'.length);
  }

  if (!targetPath.startsWith('@')) {
    return targetPath;
  }

  if (!sourcePath.startsWith('src/')) {
    throw new Error(`Registry target alias requires a source path under src/ for copy-only sync. Source: ${sourcePath}. Target: ${targetPath}`);
  }

  return sourcePath.slice('src/'.length);
}

function resolveFromRoot(root, path) {
  return resolve(root, path);
}

function readAliasValue(componentsConfig, aliasName) {
  if (!isRecord(componentsConfig)) {
    return undefined;
  }

  const aliases = componentsConfig.aliases;

  if (!isRecord(aliases)) {
    return undefined;
  }

  return readStringProperty(aliases, aliasName);
}

function rewriteAliasSpecifier(specifier, aliases) {
  const uiAlias = aliases.ui;
  const utilsAlias = aliases.utils;

  if (specifier === '@/lib/utils') {
    return utilsAlias;
  }

  if (specifier.startsWith('@/components/ui/')) {
    return `${uiAlias}/${specifier.slice('@/components/ui/'.length)}`;
  }

  if (specifier.startsWith('@/components/formedible/')) {
    return `${uiAlias}/formedible/${specifier.slice('@/components/formedible/'.length)}`;
  }

  if (specifier.startsWith('@/lib/formedible/')) {
    return `${uiAlias}/formedible/lib/${specifier.slice('@/lib/formedible/'.length)}`;
  }

  if (specifier.startsWith('@/hooks/')) {
    return `${uiAlias}/formedible/hooks/${specifier.slice('@/hooks/'.length)}`;
  }

  if (specifier.startsWith('@/components/ai-picker/')) {
    return `${uiAlias}/formedible/ai-picker/components/${specifier.slice('@/components/ai-picker/'.length)}`;
  }

  if (specifier.startsWith('@/lib/ai-picker-') || specifier === '@/lib/default-picker-schema') {
    return `${uiAlias}/formedible/ai-picker/lib/${specifier.slice('@/lib/'.length)}`;
  }

  return specifier;
}

function rewriteWebSpecifier(specifier) {
  if (specifier === '@/hooks/use-formedible') {
    return '@formedible/ui/components/formedible/hooks/use-formedible';
  }

  if (specifier.startsWith('@/components/formedible/hooks/')) {
    return `@formedible/ui/components/formedible/hooks/${specifier.slice('@/components/formedible/hooks/'.length)}`;
  }

  if (specifier.startsWith('@/components/formedible/fields/')) {
    return `@formedible/ui/components/formedible/fields/${specifier.slice('@/components/formedible/fields/'.length)}`;
  }

  if (specifier === '@/components/formedible/form') {
    return '@formedible/ui/components/formedible/form';
  }

  if (specifier.startsWith('@/components/formedible/form/')) {
    return `@formedible/ui/components/formedible/form/${specifier.slice('@/components/formedible/form/'.length)}`;
  }

  if (specifier.startsWith('@/components/formedible/layout/')) {
    return `@formedible/ui/components/formedible/layout/${specifier.slice('@/components/formedible/layout/'.length)}`;
  }

  if (specifier.startsWith('@/components/formedible/lib/')) {
    return `@formedible/ui/components/formedible/lib/${specifier.slice('@/components/formedible/lib/'.length)}`;
  }

  if (specifier === '@/lib/formedible/types') {
    return '@formedible/ui/components/formedible/lib/types';
  }

  if (specifier === '@/lib/formedible/field-registry') {
    return '@formedible/ui/components/formedible/lib/field-registry';
  }

  if (specifier === '@/lib/formedible/template-interpolation') {
    return '@formedible/ui/components/formedible/lib/template-interpolation';
  }

  return specifier;
}

function rewriteModuleSpecifiers(sourceText, aliases) {
  return sourceText.replace(/(from\s+['"]|import\s*\(\s*['"]|export\s+[^;]*?from\s+['"])(@\/[^'"]+)(['"])/g, (match, prefix, specifier, suffix) => {
    return `${prefix}${rewriteAliasSpecifier(specifier, aliases)}${suffix}`;
  });
}

function rewriteWebCoreSpecifiers(sourceText) {
  return sourceText.replace(/(from\s+['"]|import\s*\(\s*['"]|export\s+[^;]*?from\s+['"])(@\/[^'"]+)(['"])/g, (match, prefix, specifier, suffix) => {
    return `${prefix}${rewriteWebSpecifier(specifier)}${suffix}`;
  });
}

async function readDestinationAliases(rootDirectory, destinationRoot) {
  const componentsConfigPath = destinationRoot === 'packages/ui/src/components'
    ? join(rootDirectory, 'packages/ui/components.json')
    : join(rootDirectory, 'apps/web/components.json');

  if (!(await pathExists(componentsConfigPath))) {
    return undefined;
  }

  const componentsConfig = await readJsonFile(componentsConfigPath);
  const ui = readAliasValue(componentsConfig, 'ui');
  const utils = readAliasValue(componentsConfig, 'utils');

  if (ui === undefined || utils === undefined) {
    throw new Error(`components.json is missing ui/utils aliases: ${componentsConfigPath}`);
  }

  return { ui, utils };
}

async function syncContentForDestination(sourceText, rootDirectory, destinationRoot) {
  if (destinationRoot === 'packages/ui/src/components') {
    const aliases = await readDestinationAliases(rootDirectory, destinationRoot);

    if (aliases === undefined) {
      throw new Error(`Unable to resolve shadcn aliases for ${destinationRoot}`);
    }

    return rewriteModuleSpecifiers(sourceText, aliases);
  }

  if (destinationRoot === 'apps/web/src') {
    return rewriteWebCoreSpecifiers(sourceText);
  }

  return sourceText;
}

async function copyRegistryFiles(route, rootDirectory) {
  const ownerRoot = resolveFromRoot(rootDirectory, route.ownerRoot);
  const registryPath = join(ownerRoot, 'registry.json');

  if (!(await pathExists(registryPath))) {
    console.warn(`Sync warning: registry file not found: ${registryPath}`);
    return { copied: 0, missing: 0 };
  }

  const files = await readRegistryFiles(registryPath);
  let copied = 0;
  let missing = 0;

  for (const file of files) {
    if (file.sourcePath === 'src/index.ts' && route.useRegistryTargets !== true) {
      continue;
    }

    const sourcePath = join(ownerRoot, file.sourcePath);

    if (!(await pathExists(sourcePath))) {
      console.warn(`Sync warning: listed source file not found: ${sourcePath}`);
      missing += 1;
      continue;
    }

    for (const destinationRoot of route.destinationRoots) {
      const targetPath = join(resolveFromRoot(rootDirectory, destinationRoot), resolveSyncTargetPath(file.sourcePath, file.targetPath, route.useRegistryTargets === true));
      await mkdir(dirname(targetPath), { recursive: true });
      const sourceContent = await readFile(sourcePath, 'utf8');
      const syncedContent = await syncContentForDestination(sourceContent, rootDirectory, destinationRoot);
      await writeFile(targetPath, syncedContent);
      copied += 1;
    }
  }

  return { copied, missing };
}

function parseRoute(value) {
  if (!isRecord(value)) {
    throw new Error('Invalid sync route.');
  }

  const ownerRoot = readStringProperty(value, 'ownerRoot');
  const destinationRoots = readStringArrayProperty(value, 'destinationRoots');
  const useRegistryTargets = readBooleanProperty(value, 'useRegistryTargets');

  if (ownerRoot === undefined || destinationRoots === undefined) {
    throw new Error('Sync routes require ownerRoot and destinationRoots.');
  }

  return { ownerRoot, destinationRoots, useRegistryTargets };
}

async function readConfig(path) {
  const config = await readJsonFile(path);

  if (!isRecord(config) || !Array.isArray(config.routes)) {
    throw new Error(`Invalid sync config file: ${path}`);
  }

  return config.routes.map(parseRoute);
}

export async function syncFromRoutes(routes, options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? process.cwd());
  let copied = 0;
  let missing = 0;

  for (const route of routes) {
    const result = await copyRegistryFiles(route, rootDirectory);
    copied += result.copied;
    missing += result.missing;
  }

  return { copied, missing };
}

async function main(args) {
  const configFlagIndex = args.indexOf('--config');
  const rootFlagIndex = args.indexOf('--root');
  const rootDirectory = rootFlagIndex === -1 ? process.cwd() : args[rootFlagIndex + 1];

  if (rootDirectory === undefined) {
    throw new Error('--root requires a directory path.');
  }

  if (configFlagIndex !== -1 && args[configFlagIndex + 1] === undefined) {
    throw new Error('--config requires a file path.');
  }

  const routes = configFlagIndex === -1 ? defaultRoutes : await readConfig(resolve(rootDirectory, args[configFlagIndex + 1]));

  await syncFromRoutes(routes, { rootDirectory });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
