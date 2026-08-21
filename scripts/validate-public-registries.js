import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const requiredCoreDependency = 'https://formedible.dev/r/formedible-core.json';
const requiredParserDependency = 'https://formedible.dev/r/formedible-parser.json';
const requiredBuilderDependency = 'https://formedible.dev/r/form-builder.json';
const requiredScrollAreaDependency = 'scroll-area';
const forbiddenPublicRegistryNames = ['formedible-react-form', 'formedible-classname-runtime'];
const skippedDirectoryNames = new Set(['.git', 'node_modules']);

const publicRegistryPackages = [
  {
    packageRoot: 'packages/formedible',
    itemName: 'formedible-core',
    requiredRegistryDependencies: [],
    validatesRegistryDependencies: false,
  },
  {
    packageRoot: 'packages/formedible-parser',
    itemName: 'formedible-parser',
    requiredRegistryDependencies: [requiredCoreDependency],
    validatesRegistryDependencies: true,
  },
  {
    packageRoot: 'packages/builder',
    itemName: 'form-builder',
    requiredRegistryDependencies: [requiredCoreDependency],
    validatesRegistryDependencies: true,
  },
  {
    packageRoot: 'packages/ai-builder',
    itemName: 'ai-builder',
    requiredRegistryDependencies: [requiredCoreDependency, requiredParserDependency, requiredBuilderDependency, requiredScrollAreaDependency],
    validatesRegistryDependencies: true,
  },
];

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
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

function formatDependencyArray(dependencies) {
  return `[${dependencies.map((dependency) => `'${dependency}'`).join(', ')}]`;
}

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

async function readJsonFile(path) {
  const content = await readFile(path, 'utf8');

  return JSON.parse(content);
}

function collectFileRecords(value) {
  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.files)) {
    return value.files.filter(isRecord);
  }

  if (!Array.isArray(value.items)) {
    return [];
  }

  return value.items.flatMap((item) => (isRecord(item) && Array.isArray(item.files) ? item.files.filter(isRecord) : []));
}

function validateRegistryDependencies(registryItem, expectedDependencies, itemPath, errors) {
  const dependencies = isRecord(registryItem) ? readStringArrayProperty(registryItem, 'registryDependencies') ?? [] : [];
  const dependenciesMatch =
    dependencies.length === expectedDependencies.length &&
    dependencies.every((dependency, index) => dependency === expectedDependencies[index]);

  if (!dependenciesMatch) {
    errors.push(
      `${itemPath} has registryDependencies ${formatDependencyArray(dependencies)}. Expected exactly ${formatDependencyArray(expectedDependencies)}.`,
    );
  }
}

function validatePackageRegistryDependencies(registryJson, expectedDependencies, itemName, registryPath, errors) {
  if (!isRecord(registryJson) || !Array.isArray(registryJson.items)) {
    errors.push(`${registryPath} must contain an items array with embedded public registry items.`);
    return;
  }

  const registryItem = registryJson.items.find((item) => isRecord(item) && readStringProperty(item, 'name') === itemName);

  if (registryItem === undefined) {
    errors.push(`${registryPath} is missing embedded public registry item ${itemName}.`);
    return;
  }

  validateRegistryDependencies(registryItem, expectedDependencies, `${registryPath} item ${itemName}`, errors);
}

function validatePublicTargets(registryJson, registryPath, errors) {
  const files = collectFileRecords(registryJson);

  for (const file of files) {
    const target = readStringProperty(file, 'target');

    if (target === undefined) {
      errors.push(`${registryPath} contains a file entry without a string target.`);
      continue;
    }

    if (!target.startsWith('@ui/formedible/')) {
      errors.push(`${registryPath} contains non-public Formedible target ${target}. Expected @ui/formedible/...`);
    }

    if (target.startsWith('components/formedible/') || target.includes('/components/formedible/')) {
      errors.push(`${registryPath} contains raw Formedible component target ${target}.`);
    }

    if (target.startsWith('lib/formedible/') || target.includes('/lib/formedible/')) {
      errors.push(`${registryPath} contains raw Formedible lib target ${target}.`);
    }
  }
}

async function validateForbiddenNames(path, errors) {
  const content = await readFile(path, 'utf8');

  for (const forbiddenName of forbiddenPublicRegistryNames) {
    if (content.includes(forbiddenName)) {
      errors.push(`${path} contains forbidden bridge/facade name ${forbiddenName}.`);
    }
  }
}

async function findLiteralSrcUiDirectories(directory, matches) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || skippedDirectoryNames.has(entry.name)) {
      continue;
    }

    const entryPath = join(directory, entry.name);
    const segments = entryPath.split(sep);

    if (segments.at(-2) === 'src' && entry.name === '@ui') {
      matches.push(entryPath);
      continue;
    }

    await findLiteralSrcUiDirectories(entryPath, matches);
  }
}

export async function validatePublicRegistries(options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? currentRootDirectory());
  const errors = [];
  const publicRegistryPaths = [];

  for (const registryPackage of publicRegistryPackages) {
    const registryDirectory = join(rootDirectory, registryPackage.packageRoot, 'public', 'r');
    const packageRegistryPath = join(registryDirectory, 'registry.json');
    const itemPath = join(registryDirectory, `${registryPackage.itemName}.json`);

    if (!(await pathExists(packageRegistryPath))) {
      errors.push(`Missing public package registry: ${packageRegistryPath}`);
    } else {
      publicRegistryPaths.push(packageRegistryPath);
      const registryJson = await readJsonFile(packageRegistryPath);
      if (registryPackage.validatesRegistryDependencies) {
        validatePackageRegistryDependencies(
          registryJson,
          registryPackage.requiredRegistryDependencies,
          registryPackage.itemName,
          packageRegistryPath,
          errors,
        );
      }
      validatePublicTargets(registryJson, packageRegistryPath, errors);
    }

    if (!(await pathExists(itemPath))) {
      errors.push(`Missing public registry item: ${itemPath}`);
    } else {
      publicRegistryPaths.push(itemPath);
      const itemJson = await readJsonFile(itemPath);
      if (registryPackage.validatesRegistryDependencies) {
        validateRegistryDependencies(itemJson, registryPackage.requiredRegistryDependencies, itemPath, errors);
      }
      validatePublicTargets(itemJson, itemPath, errors);
    }
  }

  for (const registryPath of publicRegistryPaths) {
    await validateForbiddenNames(registryPath, errors);
  }

  const literalSrcUiDirectories = [];
  await findLiteralSrcUiDirectories(rootDirectory, literalSrcUiDirectories);

  for (const literalSrcUiDirectory of literalSrcUiDirectories) {
    errors.push(`Literal src/@ui directory must not exist: ${literalSrcUiDirectory}`);
  }

  if (errors.length > 0) {
    throw new Error(`Public registry validation failed:\n- ${errors.join('\n- ')}`);
  }
}

async function main() {
  await validatePublicRegistries();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
