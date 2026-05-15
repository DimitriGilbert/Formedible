import { spawn } from 'node:child_process';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const outputDirectoryName = 'release-assets';
const defaultWebDeployDirectory = 'apps/web/dist/client';

const registryAssets = [
  {
    name: 'formedible-core',
    source: 'packages/formedible/public/r/formedible-core.json',
  },
  {
    name: 'formedible-parser',
    source: 'packages/formedible-parser/public/r/formedible-parser.json',
  },
  {
    name: 'form-builder',
    source: 'packages/builder/public/r/form-builder.json',
  },
  {
    name: 'ai-builder',
    source: 'packages/ai-builder/public/r/ai-builder.json',
  },
];

const requiredWebFiles = [
  '.nojekyll',
  'CNAME',
  'r/formedible-core.json',
  'r/formedible-parser.json',
  'r/form-builder.json',
  'r/ai-builder.json',
];

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function isNumericIdentifier(identifier) {
  return /^[0-9]+$/.test(identifier);
}

function isValidSemverIdentifier(identifier) {
  return /^[0-9A-Za-z-]+$/.test(identifier);
}

function hasValidIdentifierList(value, options) {
  if (value === undefined) {
    return true;
  }

  if (value.length === 0) {
    return false;
  }

  const identifiers = value.split('.');

  return identifiers.every((identifier) => {
    if (!isValidSemverIdentifier(identifier)) {
      return false;
    }

    if (options.rejectLeadingZeroNumericIdentifiers && isNumericIdentifier(identifier)) {
      return identifier === '0' || !identifier.startsWith('0');
    }

    return true;
  });
}

function isValidReleaseVersion(release) {
  const match = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/.exec(release);

  if (match === null) {
    return false;
  }

  const prerelease = match[4];
  const buildMetadata = match[5];

  return (
    hasValidIdentifierList(prerelease, { rejectLeadingZeroNumericIdentifiers: true }) &&
    hasValidIdentifierList(buildMetadata, { rejectLeadingZeroNumericIdentifiers: false })
  );
}

function parseReleaseArgument(argv) {
  let release;
  const positionalArguments = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--release') {
      const value = argv[index + 1];
      if (value === undefined || value.trim() === '') {
        throw new Error('Missing required version after --release. Expected a value like v1.2.3.');
      }

      if (release !== undefined) {
        throw new Error('Release version was provided more than once.');
      }

      release = value;
      index += 1;
      continue;
    }

    if (argument.startsWith('--release=')) {
      const value = argument.slice('--release='.length);
      if (value.trim() === '') {
        throw new Error('Missing required version after --release=. Expected a value like v1.2.3.');
      }

      if (release !== undefined) {
        throw new Error('Release version was provided more than once.');
      }

      release = value;
      continue;
    }

    if (argument.startsWith('--')) {
      throw new Error(`Unsupported option: ${argument}`);
    }

    positionalArguments.push(argument);
  }

  if (positionalArguments.length > 1) {
    throw new Error('Expected at most one positional release version, such as v1.2.3.');
  }

  const positionalRelease = positionalArguments[0];
  if (release !== undefined && positionalRelease !== undefined) {
    throw new Error('Use either --release vX.Y.Z or a positional vX.Y.Z release, not both.');
  }

  const parsedRelease = release ?? positionalRelease;
  if (parsedRelease === undefined) {
    throw new Error('Missing release version. Use --release vX.Y.Z or pass vX.Y.Z as the positional argument.');
  }

  if (!isValidReleaseVersion(parsedRelease)) {
    throw new Error(`Invalid release version: ${parsedRelease}. Expected semver with a v prefix, such as v1.2.3.`);
  }

  return parsedRelease;
}

async function assertFileExists(filePath, missingMessage) {
  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      throw new Error(`Expected file but found a different path type: ${filePath}`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(missingMessage);
    }

    throw error;
  }
}

async function assertDirectoryExists(directoryPath, missingMessage) {
  try {
    const directoryStats = await stat(directoryPath);
    if (!directoryStats.isDirectory()) {
      throw new Error(`Expected directory but found a different path type: ${directoryPath}`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(missingMessage);
    }

    throw error;
  }
}

function runZip(args, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('zip', args, { cwd, stdio: 'inherit' });

    child.on('error', (error) => {
      rejectPromise(new Error(`Failed to start zip. Ensure the zip command is installed. ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`zip exited with code ${String(code)} while creating release assets.`));
    });
  });
}

async function cleanCurrentReleaseAssets(outputDirectory, release) {
  const assetNames = [
    ...registryAssets.map((asset) => `${asset.name}-${release}.zip`),
    `web-${release}.zip`,
  ];

  await Promise.all(
    assetNames.map((assetName) => rm(resolve(outputDirectory, assetName), { force: true })),
  );
}

async function assertPreparedInputs(rootDirectory, webDeployDirectory) {
  for (const registryAsset of registryAssets) {
    const sourcePath = resolve(rootDirectory, registryAsset.source);
    await assertFileExists(sourcePath, `Missing built public registry file: ${sourcePath}. Run pnpm run build:registries first.`);
  }

  await assertDirectoryExists(
    webDeployDirectory,
    `Prepared web deploy output directory does not exist: ${webDeployDirectory}. Run pnpm run build:web, node scripts/prepare-web-deploy.js, and node scripts/prepare-registry-host.js first.`,
  );

  for (const requiredFile of requiredWebFiles) {
    const filePath = resolve(webDeployDirectory, requiredFile);
    await assertFileExists(
      filePath,
      `Missing prepared web deploy file: ${filePath}. Run node scripts/prepare-web-deploy.js and node scripts/prepare-registry-host.js first.`,
    );
  }
}

async function createRegistryAsset(rootDirectory, outputDirectory, release, registryAsset) {
  const sourcePath = resolve(rootDirectory, registryAsset.source);
  const zipPath = resolve(outputDirectory, `${registryAsset.name}-${release}.zip`);

  await runZip(['-qj', zipPath, sourcePath], rootDirectory);

  return zipPath;
}

async function createWebAsset(outputDirectory, release, webDeployDirectory) {
  const zipPath = resolve(outputDirectory, `web-${release}.zip`);

  await runZip(['-rq', zipPath, '.'], webDeployDirectory);

  return zipPath;
}

export async function createReleaseAssets(options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? currentRootDirectory());
  const release = options.release;
  const outputDirectory = resolve(rootDirectory, options.outputDirectory ?? outputDirectoryName);
  const webDeployDirectory = resolve(rootDirectory, options.webDeployDirectory ?? defaultWebDeployDirectory);

  if (typeof release !== 'string' || !isValidReleaseVersion(release)) {
    throw new Error('createReleaseAssets requires a release version using semver with a v prefix, such as v1.2.3.');
  }

  await assertPreparedInputs(rootDirectory, webDeployDirectory);
  await mkdir(outputDirectory, { recursive: true });
  await cleanCurrentReleaseAssets(outputDirectory, release);

  const createdAssets = [];

  for (const registryAsset of registryAssets) {
    createdAssets.push(await createRegistryAsset(rootDirectory, outputDirectory, release, registryAsset));
  }

  createdAssets.push(await createWebAsset(outputDirectory, release, webDeployDirectory));

  return createdAssets;
}

async function main() {
  const release = parseReleaseArgument(process.argv.slice(2));
  const createdAssets = await createReleaseAssets({ release });

  console.info(`Created ${String(createdAssets.length)} release assets:`);
  for (const assetPath of createdAssets) {
    console.info(`- ${assetPath}`);
  }

  const outputDirectory = resolve(currentRootDirectory(), outputDirectoryName);
  const outputEntries = await readdir(outputDirectory);
  console.info(`Release asset directory: ${outputDirectory}`);
  console.info(`Directory entries: ${String(outputEntries.length)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
