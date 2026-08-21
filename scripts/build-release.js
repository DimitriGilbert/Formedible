import { spawn } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createReleaseAssets } from './create-release-assets.js';
import { deployGhPages } from './deploy-gh-pages.js';
import { prepareRegistryHost } from './prepare-registry-host.js';
import { prepareWebDeploy } from './prepare-web-deploy.js';
import { validatePublicRegistries } from './validate-public-registries.js';

const defaultWebDeployDirectory = 'apps/web/dist/client';
const localAssetVersionPrefix = 'local';

const sourceBuildCommands = [
  { label: 'Build Formedible package', command: 'pnpm', args: ['run', 'build:pkg'] },
  { label: 'Build parser package', command: 'pnpm', args: ['run', 'build:parser'] },
  { label: 'Build builder package', command: 'pnpm', args: ['run', 'build:builder'] },
  { label: 'Build AI builder package', command: 'pnpm', args: ['run', 'build:ai-builder'] },
];

const validationGateCommands = [
  { scriptName: 'check-types', label: 'Typecheck all packages' },
  { scriptName: 'test:sync', label: 'Sync tests' },
  { scriptName: 'test:consumer-smoke', label: 'Consumer smoke tests' },
  { scriptName: 'test:e2e:existing', label: 'End-to-end tests against existing web build' },
];

const stageAllowlist = [
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^docs\/shadcn-build-release-plan\.md$/,
  /^scripts\/(build-release|build-registries|validate-public-registries|validate-sync-boundaries|prepare-web-deploy|prepare-registry-host|create-release-assets|deploy-gh-pages|quick-sync)\.js$/,
  /^tests\/e2e\/docs-examples\.test\.ts$/,
  /^packages\/(formedible|formedible-parser|builder|ai-builder)\/registry\.json$/,
  /^packages\/(formedible|formedible-parser|builder|ai-builder)\/public\/r\/.+\.json$/,
  /^packages\/ui\/src\/components\/formedible\//,
  /^packages\/(formedible-parser|builder|ai-builder)\/src\/components\/formedible\//,
  /^packages\/(formedible-parser|builder|ai-builder)\/src\/hooks\/use-(formedible|multi-page|form-tabs|form-persistence|form-analytics)\.(ts|tsx)$/,
  /^packages\/(formedible-parser|builder|ai-builder)\/src\/lib\/formedible\//,
  /^packages\/(formedible-parser|builder|ai-builder)\/src\/lib\/utils\.ts$/,
  /^packages\/(builder|ai-builder)\/src\/index\.ts$/,
  /^packages\/(formedible-parser|builder|ai-builder)\/src\/components\/ui\/(badge|button|checkbox|field|input|radio-group|select|slider|switch|textarea)\.tsx$/,
  /^apps\/web\/src\/components\/formedible\//,
  /^apps\/web\/src\/lib\/formedible\//,
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

  return value.split('.').every((identifier) => {
    if (!isValidSemverIdentifier(identifier)) {
      return false;
    }

    if (options.rejectLeadingZeroNumericIdentifiers && isNumericIdentifier(identifier)) {
      return identifier === '0' || !identifier.startsWith('0');
    }

    return true;
  });
}

function parseSemverVersion(version) {
  const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/.exec(version);

  if (match === null) {
    return undefined;
  }

  const prerelease = match[4];
  const buildMetadata = match[5];

  if (
    !hasValidIdentifierList(prerelease, { rejectLeadingZeroNumericIdentifiers: true }) ||
    !hasValidIdentifierList(buildMetadata, { rejectLeadingZeroNumericIdentifiers: false })
  ) {
    return undefined;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: prerelease === undefined ? [] : prerelease.split('.'),
  };
}

function parseReleaseVersion(release) {
  if (!release.startsWith('v')) {
    return undefined;
  }

  return parseSemverVersion(release.slice(1));
}

function compareIdentifiers(left, right) {
  const leftIsNumeric = isNumericIdentifier(left);
  const rightIsNumeric = isNumericIdentifier(right);

  if (leftIsNumeric && rightIsNumeric) {
    return Number(left) - Number(right);
  }

  if (leftIsNumeric) {
    return -1;
  }

  if (rightIsNumeric) {
    return 1;
  }

  return left.localeCompare(right);
}

function compareSemver(left, right) {
  const numericDifference = left.major - right.major || left.minor - right.minor || left.patch - right.patch;

  if (numericDifference !== 0) {
    return numericDifference;
  }

  if (left.prerelease.length === 0 && right.prerelease.length === 0) {
    return 0;
  }

  if (left.prerelease.length === 0) {
    return 1;
  }

  if (right.prerelease.length === 0) {
    return -1;
  }

  const sharedLength = Math.min(left.prerelease.length, right.prerelease.length);

  for (let index = 0; index < sharedLength; index += 1) {
    const leftIdentifier = left.prerelease[index];
    const rightIdentifier = right.prerelease[index];

    if (leftIdentifier === undefined || rightIdentifier === undefined) {
      throw new Error('Internal semver comparison error: missing prerelease identifier.');
    }

    const identifierDifference = compareIdentifiers(leftIdentifier, rightIdentifier);
    if (identifierDifference !== 0) {
      return identifierDifference;
    }
  }

  return left.prerelease.length - right.prerelease.length;
}

function parseFlags(argv) {
  const flags = {
    noPublish: false,
    skipGithub: false,
    skipWebDeploy: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--release') {
      const value = argv[index + 1];
      if (value === undefined || value.trim() === '') {
        throw new Error('Missing required version after --release. Expected a value like v1.0.0.');
      }

      if (flags.release !== undefined) {
        throw new Error('Release version was provided more than once.');
      }

      flags.release = value;
      index += 1;
      continue;
    }

    if (argument.startsWith('--release=')) {
      const value = argument.slice('--release='.length);
      if (value.trim() === '') {
        throw new Error('Missing required version after --release=. Expected a value like v1.0.0.');
      }

      if (flags.release !== undefined) {
        throw new Error('Release version was provided more than once.');
      }

      flags.release = value;
      continue;
    }

    if (argument === '--no-publish') {
      flags.noPublish = true;
      continue;
    }

    if (argument === '--skip-github') {
      flags.skipGithub = true;
      continue;
    }

    if (argument === '--skip-web-deploy') {
      flags.skipWebDeploy = true;
      continue;
    }

    if (argument === '--skip-build') {
      throw new Error('--skip-build is not supported. Release builds always rebuild from scratch.');
    }

    throw new Error(`Unsupported option: ${argument}`);
  }

  if (!flags.noPublish && flags.release === undefined) {
    throw new Error('Real publish requires --release vX.Y.Z. Use --no-publish for local release preparation without a release version.');
  }

  if (flags.release !== undefined && parseReleaseVersion(flags.release) === undefined) {
    throw new Error(`Invalid release version: ${flags.release}. Expected semver with a v prefix, such as v1.0.0.`);
  }

  return flags;
}

function runCommand(command, args, options) {
  return new Promise((resolveCommand, rejectCommand) => {
    const childProcess = spawn(command, args, {
      cwd: options.rootDirectory,
      stdio: options.stdio,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    if (childProcess.stdout !== null) {
      childProcess.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
    }

    if (childProcess.stderr !== null) {
      childProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    childProcess.on('error', (error) => {
      rejectCommand(new Error(`Failed to start ${command} ${args.join(' ')}: ${error.message}`));
    });

    childProcess.on('close', (exitCode, signal) => {
      if (exitCode === 0) {
        resolveCommand({ stdout, stderr });
        return;
      }

      const reason = signal === null ? `exit code ${String(exitCode)}` : `signal ${signal}`;
      rejectCommand(new Error(`${command} ${args.join(' ')} failed with ${reason}.`));
    });
  });
}

async function runInherited(rootDirectory, label, command, args) {
  console.info(`\n==> ${label}`);
  await runCommand(command, args, { rootDirectory, stdio: 'inherit' });
}

async function runCaptured(rootDirectory, command, args) {
  return runCommand(command, args, { rootDirectory, stdio: 'pipe' });
}

async function readRootPackageJson(rootDirectory) {
  const packageJsonPath = resolve(rootDirectory, 'package.json');
  const packageJsonContent = await readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  if (typeof packageJson !== 'object' || packageJson === null || Array.isArray(packageJson)) {
    throw new Error('Root package.json must contain a JSON object.');
  }

  return { packageJsonPath, packageJson };
}

function readPackageVersion(packageJson) {
  const version = packageJson.version;

  if (typeof version !== 'string' || parseSemverVersion(version) === undefined) {
    throw new Error('Root package.json version must be a valid semver string without a v prefix.');
  }

  return version;
}

function assertMandatoryScripts(packageJson) {
  const scripts = packageJson.scripts;

  if (typeof scripts !== 'object' || scripts === null || Array.isArray(scripts)) {
    throw new Error('Root package.json must define a scripts object.');
  }

  const requiredScripts = [
    'build:pkg',
    'build:parser',
    'build:builder',
    'build:ai-builder',
    'build:registries',
    'build:web',
    ...validationGateCommands.map((gate) => gate.scriptName),
  ];

  const missingScripts = requiredScripts.filter((scriptName) => typeof scripts[scriptName] !== 'string');

  if (missingScripts.length > 0) {
    throw new Error(`Missing mandatory release script(s): ${missingScripts.join(', ')}.`);
  }
}

export async function updateRootVersion(rootDirectory, release) {
  const { packageJsonPath, packageJson } = await readRootPackageJson(rootDirectory);
  const currentVersion = readPackageVersion(packageJson);
  const currentSemver = parseSemverVersion(currentVersion);
  const releaseSemver = parseReleaseVersion(release);

  if (currentSemver === undefined || releaseSemver === undefined) {
    throw new Error('Internal version validation error.');
  }

  if (currentVersion === release.slice(1) && await isSameVersionRerunWorktreeState(rootDirectory)) {
    console.info(`Root package.json is already at ${currentVersion}, matching --release ${release}; skipping the version bump for this rerun.`);
    return;
  }

  if (compareSemver(releaseSemver, currentSemver) <= 0) {
    throw new Error(
      `Release ${release} must be greater than current root package.json version ${currentVersion}. ` +
      'A same-version rerun only continues when root package.json already carries the release version and is the only dirty deploy-affecting file; ' +
      'commit, stash, or revert any other dirty deploy-affecting files, or provide a greater release version.',
    );
  }

  packageJson.version = release.slice(1);
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
  console.info(`Updated root package.json version: ${currentVersion} -> ${packageJson.version}`);
}

async function isSameVersionRerunWorktreeState(rootDirectory) {
  const files = await changedFiles(rootDirectory);
  const deployAffectingPaths = files
    .flatMap((file) => releaseFilePaths(file))
    .filter((filePath) => isDeployAffectingDirtyFile(filePath));

  return deployAffectingPaths.length === 1 && deployAffectingPaths[0] === 'package.json';
}

function toLocalAssetVersion(currentVersion) {
  return `v${currentVersion}-${localAssetVersionPrefix}`;
}

function isAllowlistedReleaseFile(filePath) {
  return stageAllowlist.some((pattern) => pattern.test(filePath));
}

function normalizeGitPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function parseGitStatus(output) {
  const files = [];
  const entries = output.split('\0').filter((entry) => entry.length > 0);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const status = entry.slice(0, 2);
    const rawPath = entry.slice(3);
    const sourcePath = status.includes('R') || status.includes('C') ? entries[index + 1] : undefined;

    files.push({
      status,
      path: normalizeGitPath(rawPath),
      sourcePath: sourcePath === undefined ? undefined : normalizeGitPath(sourcePath),
    });

    if (sourcePath !== undefined) {
      index += 1;
    }
  }

  return files;
}

async function changedFiles(rootDirectory) {
  const result = await runCaptured(rootDirectory, 'git', ['status', '--porcelain', '-z']);
  return parseGitStatus(result.stdout);
}

async function stagedFiles(rootDirectory) {
  const result = await runCaptured(rootDirectory, 'git', ['diff', '--cached', '--name-only', '-z']);
  return result.stdout
    .split('\0')
    .filter((filePath) => filePath.length > 0)
    .map(normalizeGitPath);
}

function isStagedStatus(status) {
  return status[0] !== ' ' && status[0] !== '?';
}

function releaseFilePaths(file) {
  return file.sourcePath === undefined ? [file.path] : [file.path, file.sourcePath];
}

function isFullyAllowlistedReleaseFile(file) {
  return releaseFilePaths(file).every((filePath) => isAllowlistedReleaseFile(filePath));
}

function describeGitStatusFile(file) {
  if (file.sourcePath !== undefined) {
    return `${file.status} ${file.sourcePath} -> ${file.path}`;
  }

  return `${file.status} ${file.path}`;
}

function isDeployAffectingDirtyFile(filePath) {
  return (
    filePath === 'package.json' ||
    filePath === 'pnpm-lock.yaml' ||
    filePath === 'pnpm-workspace.yaml' ||
    filePath.startsWith('apps/web/') ||
    filePath.startsWith('packages/') ||
    filePath.startsWith('scripts/') ||
    filePath.startsWith('public/') ||
    /(^|\/)(vite|tsconfig|tailwind|postcss|components|turbo)\.[cm]?[jt]s(on)?$/.test(filePath)
  );
}

async function assertNoUnallowlistedDeployAffectingDirtyFiles(rootDirectory) {
  const files = await changedFiles(rootDirectory);
  const unallowlistedDeployAffectingFiles = files.filter((file) => (
    !isFullyAllowlistedReleaseFile(file) &&
    releaseFilePaths(file).some((filePath) => isDeployAffectingDirtyFile(filePath))
  ));

  if (unallowlistedDeployAffectingFiles.length > 0) {
    throw new Error(
      'Real publish cannot build deploy artifacts while deploy-affecting dirty files exist outside the release allowlist. ' +
      `Commit, stash, or revert these files before publishing:\n- ${unallowlistedDeployAffectingFiles.map(describeGitStatusFile).join('\n- ')}`,
    );
  }
}

async function stageReleaseFiles(rootDirectory) {
  const files = await changedFiles(rootDirectory);
  const unexpectedStaged = files.filter((file) => isStagedStatus(file.status) && !isFullyAllowlistedReleaseFile(file));

  if (unexpectedStaged.length > 0) {
    throw new Error(`Unexpected pre-staged file(s) outside release allowlist:\n- ${unexpectedStaged.map(describeGitStatusFile).join('\n- ')}`);
  }

  const allowlistCrossingFiles = files.filter((file) => releaseFilePaths(file).some((filePath) => isAllowlistedReleaseFile(filePath)) && !isFullyAllowlistedReleaseFile(file));

  if (allowlistCrossingFiles.length > 0) {
    throw new Error(`Release file rename/copy crosses the release allowlist boundary:\n- ${allowlistCrossingFiles.map(describeGitStatusFile).join('\n- ')}`);
  }

  const allowlistedFiles = files
    .filter(isFullyAllowlistedReleaseFile)
    .flatMap((file) => releaseFilePaths(file));
  const uniqueAllowlistedFiles = [...new Set(allowlistedFiles)];

  if (uniqueAllowlistedFiles.length === 0) {
    throw new Error('No release-relevant files changed. Refusing to create an empty release commit.');
  }

  await runInherited(rootDirectory, 'Stage allowlisted release files', 'git', ['add', '--', ...uniqueAllowlistedFiles]);

  const staged = await stagedFiles(rootDirectory);
  const unexpected = staged.filter((filePath) => !isAllowlistedReleaseFile(filePath));

  if (unexpected.length > 0) {
    throw new Error(`Unexpected staged file(s) outside release allowlist:\n- ${unexpected.join('\n- ')}`);
  }

  console.info('\nStaged release files:');
  for (const filePath of staged) {
    console.info(`- ${filePath}`);
  }
}

async function runGithubRelease(rootDirectory, release, assetPaths) {
  const relativeAssetPaths = assetPaths.map((assetPath) => relative(rootDirectory, assetPath));
  await runInherited(rootDirectory, 'Create GitHub release', 'gh', ['release', 'create', release, ...relativeAssetPaths, '--title', release, '--notes', `Release ${release}`]);
}

function printFileList(title, files) {
  console.info(`\n${title}:`);
  if (files.length === 0) {
    console.info('- (none)');
    return;
  }

  for (const file of files) {
    console.info(`- ${file}`);
  }
}

async function listDeployOutputFiles(rootDirectory, webDeployDirectory) {
  const absoluteDeployDirectory = resolve(rootDirectory, webDeployDirectory);
  const files = [];

  async function collect(relativeDirectory) {
    const directoryEntries = await readdir(resolve(absoluteDeployDirectory, relativeDirectory), { withFileTypes: true });
    const sortedEntries = directoryEntries.toSorted((left, right) => left.name.localeCompare(right.name));

    for (const entry of sortedEntries) {
      const relativeEntryPath = relativeDirectory === '' ? entry.name : `${relativeDirectory}/${entry.name}`;

      if (entry.isDirectory()) {
        await collect(relativeEntryPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(`${webDeployDirectory}/${relativeEntryPath}`);
      }
    }
  }

  await collect('');
  return files;
}

async function printNoPublishSummary(rootDirectory, release, assetVersion, assetPaths, webDeployDirectory) {
  const releaseRelevantFiles = (await changedFiles(rootDirectory))
    .filter(isFullyAllowlistedReleaseFile)
    .map(describeGitStatusFile);
  const deployFiles = await listDeployOutputFiles(rootDirectory, webDeployDirectory);
  const tagName = release ?? '(no git tag; no --release was provided)';

  console.info('\nNo-publish mode completed without commit, tag, push, deploy, or GitHub release side effects.');
  console.info(`Local release asset version: ${assetVersion}`);
  if (release === undefined) {
    console.info('No --release was provided, so root package.json was not changed and local assets use a clearly local version derived from the current package version.');
  }

  printFileList('Files that would be committed in real publish', [...new Set(releaseRelevantFiles)]);
  printFileList('Git tag that would be created', [tagName]);
  printFileList('Refs that would be pushed', release === undefined ? ['(none; real publish requires --release)'] : ['current branch release commit', tagName]);
  printFileList(`Deploy output files under ${webDeployDirectory} that would be deployed recursively`, deployFiles);
  printFileList('GitHub release assets that would be released', assetPaths.map((assetPath) => relative(rootDirectory, assetPath)));
}

async function runReleaseFlow(flags) {
  const rootDirectory = currentRootDirectory();
  const { packageJson } = await readRootPackageJson(rootDirectory);
  const startingVersion = readPackageVersion(packageJson);
  assertMandatoryScripts(packageJson);

  if (!flags.noPublish) {
    await assertNoUnallowlistedDeployAffectingDirtyFiles(rootDirectory);
  }

  if (flags.release !== undefined) {
    await updateRootVersion(rootDirectory, flags.release);
  } else {
    console.info(`No --release provided. Root package.json remains at ${startingVersion}.`);
  }

  for (const buildCommand of sourceBuildCommands) {
    await runInherited(rootDirectory, buildCommand.label, buildCommand.command, buildCommand.args);
  }

  await runInherited(rootDirectory, 'Build shadcn registries', 'pnpm', ['run', 'build:registries']);
  await runInherited(rootDirectory, 'Sync components and package-local copies', 'node', ['scripts/quick-sync.js']);

  console.info('\n==> Validate public registries');
  await validatePublicRegistries({ rootDirectory });
  await runInherited(rootDirectory, 'Validate sync boundaries', 'node', ['scripts/validate-sync-boundaries.js']);

  await runInherited(rootDirectory, 'Build web app', 'pnpm', ['run', 'build:web']);

  console.info('\n==> Prepare web deploy output');
  const preparedWebDeployDirectory = await prepareWebDeploy({ rootDirectory, outputDirectory: defaultWebDeployDirectory });
  console.info(`Prepared web deploy output: ${preparedWebDeployDirectory}`);

  console.info('\n==> Copy public registry files into deploy output');
  const copiedRegistryFiles = await prepareRegistryHost({ rootDirectory, outputDirectory: defaultWebDeployDirectory });
  for (const copiedRegistryFile of copiedRegistryFiles) {
    console.info(`- ${copiedRegistryFile}`);
  }

  for (const gate of validationGateCommands) {
    await runInherited(rootDirectory, gate.label, 'pnpm', ['run', gate.scriptName]);
  }

  console.info('\n==> Refresh prepared deploy output after validation gates');
  await prepareWebDeploy({ rootDirectory, outputDirectory: defaultWebDeployDirectory });
  const refreshedRegistryFiles = await prepareRegistryHost({ rootDirectory, outputDirectory: defaultWebDeployDirectory });
  for (const refreshedRegistryFile of refreshedRegistryFiles) {
    console.info(`- ${refreshedRegistryFile}`);
  }

  const assetVersion = flags.release ?? toLocalAssetVersion(startingVersion);
  if (flags.release === undefined) {
    console.info(`\n==> Create local release assets with derived no-publish version ${assetVersion}`);
  } else {
    console.info(`\n==> Create release assets for ${assetVersion}`);
  }
  const assetPaths = await createReleaseAssets({ rootDirectory, release: assetVersion });
  for (const assetPath of assetPaths) {
    console.info(`- ${assetPath}`);
  }

  if (flags.noPublish) {
    await printNoPublishSummary(rootDirectory, flags.release, assetVersion, assetPaths, defaultWebDeployDirectory);
    return;
  }

  if (flags.release === undefined) {
    throw new Error('Internal release validation error: real publish reached without --release.');
  }

  await stageReleaseFiles(rootDirectory);
  await runInherited(rootDirectory, 'Create release commit', 'git', ['commit', '-m', `release ${flags.release}`]);
  await runInherited(rootDirectory, 'Create release tag', 'git', ['tag', flags.release]);
  await runInherited(rootDirectory, 'Push release commit', 'git', ['push']);
  await runInherited(rootDirectory, 'Push release tag', 'git', ['push', 'origin', flags.release]);

  if (flags.skipWebDeploy) {
    console.info('\nSkipping GitHub Pages deploy because --skip-web-deploy was provided.');
  } else {
    console.info('\n==> Deploy GitHub Pages');
    await deployGhPages({ rootDirectory, outputDirectory: defaultWebDeployDirectory });
  }

  if (flags.skipGithub) {
    console.info('\nSkipping GitHub release because --skip-github was provided.');
  } else {
    await runGithubRelease(rootDirectory, flags.release, assetPaths);
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.noPublish) {
    console.info('Running release orchestrator in --no-publish mode.');
  } else {
    console.info(`Running real publish flow for ${flags.release}.`);
  }

  await runReleaseFlow(flags);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error('\nRelease orchestrator failed. Completed steps are not rolled back automatically; fix manually and rerun the full command.');
    console.error(error);
    process.exitCode = 1;
  });
}
