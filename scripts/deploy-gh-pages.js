import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultDeployOutputDirectory = 'apps/web/dist/client';

function currentRootDirectory() {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseDeployOutputDirectory(argv) {
  if (argv.length === 0) {
    return defaultDeployOutputDirectory;
  }

  const [firstArgument, secondArgument, ...extraArguments] = argv;

  if (extraArguments.length > 0) {
    throw new Error('deploy-gh-pages accepts at most one output directory, or --dir <output-directory>.');
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

export function deployGhPages(options = {}) {
  const rootDirectory = resolve(options.rootDirectory ?? currentRootDirectory());
  const outputDirectory = options.outputDirectory ?? defaultDeployOutputDirectory;

  return new Promise((resolveDeploy, rejectDeploy) => {
    const childProcess = spawn('pnpm', ['exec', 'gh-pages', '--dotfiles', '-d', outputDirectory], {
      cwd: rootDirectory,
      stdio: 'inherit',
      shell: false,
    });

    childProcess.on('error', (error) => {
      rejectDeploy(new Error(`Failed to start gh-pages deploy: ${error.message}`));
    });

    childProcess.on('close', (exitCode, signal) => {
      if (exitCode === 0) {
        resolveDeploy();
        return;
      }

      const reason = signal === null ? `exit code ${String(exitCode)}` : `signal ${signal}`;
      rejectDeploy(new Error(`gh-pages deploy failed with ${reason}.`));
    });
  });
}

async function main() {
  const outputDirectory = parseDeployOutputDirectory(process.argv.slice(2));
  await deployGhPages({ outputDirectory });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
