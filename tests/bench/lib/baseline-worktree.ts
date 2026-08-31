import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Baseline (main-branch) worktree lifecycle for the benchmark suite
 * (PERF-BENCHMARK-PLAN.md Phase 2, DECISION-5).
 *
 * The `main` implementation runs on its OWN pinned dependencies (DECISION-1)
 * inside a git worktree that lives OUTSIDE this repository (default sibling
 * `../Formedible-main-baseline`, override with `FORMEDIBLE_MAIN_WORKTREE`).
 * `main` is npm-based with a committed `package-lock.json`, so installs use
 * `npm ci` inside the worktree.
 *
 * Modes:
 * - `--setup`   create the worktree if missing (idempotent), sync it to local
 *              `main`, run `npm ci`, and (re)generate the runtime tsconfig
 *              `tests/bench/tsconfig.main.json` from the committed template.
 * - `--refresh` reset the worktree to local `main` HEAD and re-run `npm ci`
 *              ONLY when the recorded HEAD changed (persisted in
 *              `<worktree>/.bench-setup.json`).
 * - `--check`   verify the worktree exists, is on `main`, has `node_modules`,
 *              and print the SHA plus the `@tanstack/react-form` version
 *              resolved from the worktree's own installed tree — the
 *              dependency-isolation proof. Exits non-zero with a pointer to
 *              `bench:baseline:setup` when the baseline is not ready.
 *
 * No absolute machine paths are committed: the worktree location enters the
 * generated tsconfig only at generation time, through the template's
 * placeholder, as a repo-root-relative path.
 */

export const MAIN_WORKTREE_ENV_VAR = 'FORMEDIBLE_MAIN_WORKTREE';

const DEFAULT_WORKTREE_NAME = 'Formedible-main-baseline';
const WORKTREE_BRANCH = 'main';
const SETUP_RECORD_FILE = '.bench-setup.json';
const TEMPLATE_PLACEHOLDER = '__FORMEDIBLE_MAIN_WORKTREE__';

const benchLibDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(benchLibDirectory, '..', '..', '..');
const templateFile = join(benchLibDirectory, 'tsconfig.main.template.json');
const generatedTsconfigFile = join(benchLibDirectory, '..', 'tsconfig.main.json');

export function resolveMainWorktreeDirectory(): string {
  const configured = process.env[MAIN_WORKTREE_ENV_VAR];

  if (configured !== undefined && configured.trim() !== '') {
    return configured.trim();
  }

  return join(repositoryRoot, '..', DEFAULT_WORKTREE_NAME);
}

function runGit(args: readonly string[], cwd: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function runNpmCi(worktreeDirectory: string): void {
  console.log(`Installing baseline dependencies (npm ci) in ${worktreeDirectory} ...`);
  execFileSync('npm', ['ci'], { cwd: worktreeDirectory, stdio: 'inherit' });
}

/** Returns the SHA recorded by the last completed setup, if any. */
function readRecordedSha(worktreeDirectory: string): string | undefined {
  const recordFile = join(worktreeDirectory, SETUP_RECORD_FILE);

  if (!existsSync(recordFile)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(recordFile, 'utf8')) as { sha?: unknown };

    return typeof parsed.sha === 'string' ? parsed.sha : undefined;
  } catch {
    return undefined;
  }
}

function writeSetupRecord(worktreeDirectory: string, sha: string): void {
  const record = { sha, setupCompletedAt: new Date().toISOString() };

  writeFileSync(join(worktreeDirectory, SETUP_RECORD_FILE), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

/** Regenerates `tests/bench/tsconfig.main.json` from the committed template. */
function generateMainTsconfig(worktreeDirectory: string): void {
  const template = readFileSync(templateFile, 'utf8');
  const worktreeFromRepositoryRoot = relative(repositoryRoot, worktreeDirectory).split('\\').join('/');
  const generated = template.split(TEMPLATE_PLACEHOLDER).join(worktreeFromRepositoryRoot);

  writeFileSync(generatedTsconfigFile, generated, 'utf8');
  console.log(`Generated ${generatedTsconfigFile} (worktree: ${worktreeFromRepositoryRoot})`);
}

function requireOnMain(worktreeDirectory: string): string {
  const branch = runGit(['branch', '--show-current'], worktreeDirectory);

  if (branch !== WORKTREE_BRANCH) {
    throw new Error(
      `The baseline worktree ${worktreeDirectory} is on branch "${branch}", expected "${WORKTREE_BRANCH}". ` +
        'Remove the directory and re-run bench:baseline:setup.',
    );
  }

  return branch;
}

function ensureWorktree(worktreeDirectory: string): void {
  if (existsSync(worktreeDirectory)) {
    requireOnMain(worktreeDirectory);
    console.log(`Baseline worktree already exists: ${worktreeDirectory}`);

    return;
  }

  console.log(`Creating baseline worktree at ${worktreeDirectory} (branch ${WORKTREE_BRANCH}) ...`);
  execFileSync('git', ['worktree', 'add', worktreeDirectory, WORKTREE_BRANCH], {
    cwd: repositoryRoot,
    stdio: 'inherit',
  });
}

function resetWorktreeToMain(worktreeDirectory: string, mainSha: string): void {
  console.log(`Resetting baseline worktree to ${WORKTREE_BRANCH} (${mainSha.slice(0, 12)}) ...`);
  execFileSync('git', ['reset', '--hard', mainSha], { cwd: worktreeDirectory, stdio: 'inherit' });
  execFileSync('git', ['clean', '-fd'], { cwd: worktreeDirectory, stdio: 'inherit' });
}

interface ResolvedWorktreePackage {
  readonly name: string;
  readonly resolvedPath: string;
  readonly version: string;
}

/**
 * Walks up from a resolved module file to the owning package manifest (the
 * nearest ancestor `package.json` whose `name` matches the specifier).
 */
function findOwningPackageManifest(startFile: string, packageName: string): string {
  let directory = dirname(startFile);

  for (;;) {
    const candidate = join(directory, 'package.json');

    if (existsSync(candidate)) {
      try {
        const manifest = JSON.parse(readFileSync(candidate, 'utf8')) as { name?: unknown };

        if (manifest.name === packageName) {
          return candidate;
        }
      } catch {
        // Not a readable manifest; keep walking up.
      }
    }

    const parent = dirname(directory);

    if (parent === directory) {
      throw new Error(`No owning package.json found for ${packageName} above ${startFile}.`);
    }

    directory = parent;
  }
}

/**
 * Resolves `specifier` the way Node would from inside the worktree's formedible
 * source (dependency-isolation assertion for `--check`): resolution walks up
 * from the importing file's location and must land inside the worktree.
 */
function resolveFromWorktreeSource(worktreeDirectory: string, specifier: string): ResolvedWorktreePackage {
  const importerFile = join(worktreeDirectory, 'packages', 'formedible', 'src', 'hooks', 'use-formedible.tsx');
  const requireFromWorktree = createRequire(importerFile);
  const resolvedPath = requireFromWorktree.resolve(specifier);
  const manifestFile = findOwningPackageManifest(resolvedPath, specifier);
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as { version?: unknown };
  const version = typeof manifest.version === 'string' ? manifest.version : 'unknown';

  return { name: specifier, resolvedPath, version };
}

function printResolution(probe: ResolvedWorktreePackage, worktreeDirectory: string): void {
  const insideWorktree = probe.resolvedPath.startsWith(`${worktreeDirectory}/`) || probe.resolvedPath.startsWith(`${worktreeDirectory}\\`);

  console.log(`  ${probe.name}: ${probe.version} (${probe.resolvedPath})`);

  if (!insideWorktree) {
    throw new Error(
      `Dependency isolation violated: ${probe.name} resolved OUTSIDE the baseline worktree ` +
        `(${probe.resolvedPath}). Re-run pnpm run bench:baseline:setup.`,
    );
  }
}

function setupBaseline(): void {
  const worktreeDirectory = resolveMainWorktreeDirectory();

  ensureWorktree(worktreeDirectory);

  const mainSha = runGit(['rev-parse', WORKTREE_BRANCH], repositoryRoot);
  const worktreeHead = runGit(['rev-parse', 'HEAD'], worktreeDirectory);

  if (worktreeHead !== mainSha) {
    resetWorktreeToMain(worktreeDirectory, mainSha);
  }

  runNpmCi(worktreeDirectory);
  writeSetupRecord(worktreeDirectory, mainSha);
  generateMainTsconfig(worktreeDirectory);

  console.log(`Baseline setup complete at ${mainSha}.`);
}

function refreshBaseline(): void {
  const worktreeDirectory = resolveMainWorktreeDirectory();

  if (!existsSync(worktreeDirectory)) {
    throw new Error(`Baseline worktree not found at ${worktreeDirectory}. Run pnpm run bench:baseline:setup first.`);
  }

  requireOnMain(worktreeDirectory);

  const mainSha = runGit(['rev-parse', WORKTREE_BRANCH], repositoryRoot);
  const recordedSha = readRecordedSha(worktreeDirectory);
  const nodeModulesPresent = existsSync(join(worktreeDirectory, 'node_modules'));
  const worktreeHead = runGit(['rev-parse', 'HEAD'], worktreeDirectory);

  if (recordedSha === mainSha && worktreeHead === mainSha && nodeModulesPresent) {
    console.log(`Baseline already at ${mainSha}; nothing to refresh.`);
    generateMainTsconfig(worktreeDirectory);

    return;
  }

  resetWorktreeToMain(worktreeDirectory, mainSha);
  runNpmCi(worktreeDirectory);
  writeSetupRecord(worktreeDirectory, mainSha);
  generateMainTsconfig(worktreeDirectory);

  console.log(`Baseline refreshed to ${mainSha}.`);
}

function checkBaseline(): void {
  const worktreeDirectory = resolveMainWorktreeDirectory();

  if (!existsSync(worktreeDirectory)) {
    throw new Error(
      `Baseline worktree not found at ${worktreeDirectory}. Run pnpm run bench:baseline:setup first.`,
    );
  }

  requireOnMain(worktreeDirectory);

  if (!existsSync(join(worktreeDirectory, 'node_modules'))) {
    throw new Error(
      `Baseline worktree ${worktreeDirectory} has no node_modules. Run pnpm run bench:baseline:setup first.`,
    );
  }

  if (!existsSync(generatedTsconfigFile)) {
    throw new Error(
      `${generatedTsconfigFile} is missing. Run pnpm run bench:baseline:setup first.`,
    );
  }

  if (readFileSync(generatedTsconfigFile, 'utf8').includes(TEMPLATE_PLACEHOLDER)) {
    throw new Error(
      `${generatedTsconfigFile} still contains the template placeholder. Re-run pnpm run bench:baseline:setup.`,
    );
  }

  const sha = runGit(['rev-parse', 'HEAD'], worktreeDirectory);
  const recordedSha = readRecordedSha(worktreeDirectory);

  console.log(`Baseline worktree : ${worktreeDirectory}`);
  console.log(`Branch            : ${WORKTREE_BRANCH}`);
  console.log(`HEAD              : ${sha}`);
  console.log(`Last setup SHA    : ${recordedSha ?? 'not recorded'}`);

  if (recordedSha !== undefined && recordedSha !== sha) {
    console.log('NOTE: local main moved since setup; run bench:baseline:setup (or --refresh) to re-sync.');
  }

  printResolution(resolveFromWorktreeSource(worktreeDirectory, '@tanstack/react-form'), worktreeDirectory);
  printResolution(resolveFromWorktreeSource(worktreeDirectory, 'react'), worktreeDirectory);
  printResolution(resolveFromWorktreeSource(worktreeDirectory, 'react-dom'), worktreeDirectory);
  console.log('Baseline check passed.');
}

function main(argv: readonly string[]): void {
  const modes = argv.filter((argument) => argument.startsWith('--'));

  if (modes.length !== 1) {
    throw new Error('Usage: tsx tests/bench/lib/baseline-worktree.ts --setup | --refresh | --check');
  }

  const mode = modes[0];

  if (mode === '--setup') {
    setupBaseline();

    return;
  }

  if (mode === '--refresh') {
    refreshBaseline();

    return;
  }

  if (mode === '--check') {
    checkBaseline();

    return;
  }

  throw new Error(`Unknown mode "${mode}". Usage: tsx tests/bench/lib/baseline-worktree.ts --setup | --refresh | --check`);
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('baseline-worktree.ts')) {
  try {
    main(process.argv.slice(2));
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error));

    process.exit(1);
  }
}
