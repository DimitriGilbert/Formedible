import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultRoutes = [
  {
    ownerRoot: 'packages/formedible',
    destinationRoots: ['packages/ui/src/components'],
    useRegistryTargets: true,
  },
  {
    ownerRoot: 'packages/formedible',
    destinationRoots: ['packages/formedible-parser/src', 'packages/builder/src', 'packages/ai-builder/src'],
  },
  {
    ownerRoot: 'packages/formedible-parser',
    destinationRoots: ['apps/web/src', 'packages/builder/src', 'packages/ai-builder/src'],
  },
  {
    ownerRoot: 'packages/builder',
    destinationRoots: ['apps/web/src', 'packages/ai-builder/src'],
  },
  {
    ownerRoot: 'packages/ai-builder',
    destinationRoots: ['apps/web/src'],
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
    const sourcePath = join(ownerRoot, file.sourcePath);

    if (!(await pathExists(sourcePath))) {
      console.warn(`Sync warning: listed source file not found: ${sourcePath}`);
      missing += 1;
      continue;
    }

    for (const destinationRoot of route.destinationRoots) {
      const targetPath = join(resolveFromRoot(rootDirectory, destinationRoot), resolveSyncTargetPath(file.sourcePath, file.targetPath, route.useRegistryTargets === true));
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
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
