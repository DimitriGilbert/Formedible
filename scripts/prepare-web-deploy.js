import { stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultDeployOutputDirectory = 'apps/web/dist/client';
const customDomain = 'formedible.dev';

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseDeployOutputDirectory(argv) {
  if (argv.length === 0) {
    return defaultDeployOutputDirectory;
  }

  const [firstArgument, secondArgument, ...extraArguments] = argv;

  if (extraArguments.length > 0) {
    throw new Error('prepare-web-deploy accepts at most one output directory, or --dir <output-directory>.');
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

async function assertDirectoryExists(directoryPath) {
  try {
    const directoryStats = await stat(directoryPath);
    if (!directoryStats.isDirectory()) {
      throw new Error(`Web deploy output path exists but is not a directory: ${directoryPath}`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Web deploy output directory does not exist: ${directoryPath}. Run pnpm run build:web before preparing deploy output.`,
      );
    }

    throw error;
  }
}

export async function prepareWebDeploy(options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? currentRootDirectory());
  const outputDirectory = resolve(rootDirectory, options.outputDirectory ?? defaultDeployOutputDirectory);

  await assertDirectoryExists(outputDirectory);
  await writeFile(resolve(outputDirectory, '.nojekyll'), '', 'utf8');
  await writeFile(resolve(outputDirectory, 'CNAME'), customDomain, 'utf8');

  return outputDirectory;
}

async function main() {
  const outputDirectory = parseDeployOutputDirectory(process.argv.slice(2));
  const preparedDirectory = await prepareWebDeploy({ outputDirectory });
  console.info(`Prepared web deploy output: ${preparedDirectory}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
