import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultDeployOutputDirectory = 'apps/web/dist/client';

const registryFiles = [
  {
    source: 'packages/formedible/public/r/formedible-core.json',
    destination: 'r/formedible-core.json',
  },
  {
    source: 'packages/formedible-parser/public/r/formedible-parser.json',
    destination: 'r/formedible-parser.json',
  },
  {
    source: 'packages/builder/public/r/form-builder.json',
    destination: 'r/form-builder.json',
  },
  {
    source: 'packages/ai-builder/public/r/ai-builder.json',
    destination: 'r/ai-builder.json',
  },
];

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseDeployOutputDirectory(argv) {
  if (argv.length === 0) {
    return defaultDeployOutputDirectory;
  }

  const [firstArgument, secondArgument, ...extraArguments] = argv;

  if (extraArguments.length > 0) {
    throw new Error('prepare-registry-host accepts at most one output directory, or --dir <output-directory>.');
  }

  if (firstArgument === '--dir') {
    if (secondArgument === undefined || secondArgument.trim() === '') {
      throw new Error('Missing required output directory after --dir.');
    }

    return secondArgument;
  }

  if (secondArgument !== undefined) {
    throw new Error('Unexpected extra argument. Use --dir <output-directory> or pass a single output directory.');
  }

  if (firstArgument === undefined || firstArgument.trim() === '') {
    throw new Error('Output directory argument must not be empty.');
  }

  return firstArgument;
}

async function assertDirectoryExists(path, missingMessage) {
  try {
    const pathStats = await stat(path);
    if (!pathStats.isDirectory()) {
      throw new Error(`Expected directory but found a different path type: ${path}`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(missingMessage);
    }

    throw error;
  }
}

async function assertFileExists(path, missingMessage) {
  try {
    const pathStats = await stat(path);
    if (!pathStats.isFile()) {
      throw new Error(`Expected file but found a different path type: ${path}`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(missingMessage);
    }

    throw error;
  }
}

export async function prepareRegistryHost(options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? currentRootDirectory());
  const outputDirectory = resolve(rootDirectory, options.outputDirectory ?? defaultDeployOutputDirectory);
  const registryOutputDirectory = resolve(outputDirectory, 'r');

  await assertDirectoryExists(
    outputDirectory,
    `Web deploy output directory does not exist: ${outputDirectory}. Run pnpm run build:web before copying registry files.`,
  );

  for (const registryFile of registryFiles) {
    const sourcePath = resolve(rootDirectory, registryFile.source);
    await assertFileExists(sourcePath, `Missing built public registry file: ${sourcePath}. Run pnpm run build:registries first.`);
  }

  await mkdir(registryOutputDirectory, { recursive: true });

  for (const registryFile of registryFiles) {
    const sourcePath = resolve(rootDirectory, registryFile.source);
    const destinationPath = resolve(outputDirectory, registryFile.destination);
    await copyFile(sourcePath, destinationPath);
  }

  return registryFiles.map((registryFile) => resolve(outputDirectory, registryFile.destination));
}

async function main() {
  const outputDirectory = parseDeployOutputDirectory(process.argv.slice(2));
  const copiedFiles = await prepareRegistryHost({ outputDirectory });
  console.info(`Copied ${String(copiedFiles.length)} registry files into deploy output:`);
  for (const copiedFile of copiedFiles) {
    console.info(`- ${copiedFile}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
