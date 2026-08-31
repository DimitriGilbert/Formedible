import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BenchImplementation } from './adapter-types';
import type { BenchComparable, BenchUnit } from './scenarios/index';

/**
 * Benchmark result artifacts: one JSON file per run (an array of records),
 * written to `tests/bench/results/runs/<iso>-<implementation>.json`. Run
 * artifacts are gitignored (DECISION-4); the committed regression reference is
 * a separate snapshot produced from a run artifact in Phase 4.
 */

export interface BenchRecord {
  readonly implementation: BenchImplementation;
  readonly gitSha: string;
  readonly gitBranch: string;
  readonly versions: Readonly<Record<string, string>>;
  readonly node: string;
  readonly scenario: string;
  readonly metric: string;
  readonly unit: BenchUnit;
  readonly median: number;
  readonly p75: number;
  readonly min: number;
  readonly max: number;
  readonly runs: number;
  readonly comparable: BenchComparable;
  readonly notes: readonly string[];
  readonly timestamp: string;
}

export interface BenchEnvironment {
  readonly gitSha: string;
  readonly gitBranch: string;
  readonly versions: Readonly<Record<string, string>>;
  readonly node: string;
}

export interface RunArtifact {
  readonly file: string;
  readonly records: readonly BenchRecord[];
}

const benchLibDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(benchLibDirectory, '..', '..', '..');
const runsDirectory = join(repositoryRoot, 'tests', 'bench', 'results', 'runs');

/**
 * Manifests read to embed resolved dependency versions. `@tanstack/ai` is not a
 * formedible dependency (it belongs to the AI packages), so it resolves from
 * `apps/web`'s installed tree; everything else resolves from the formedible
 * package's own tree.
 */
const VERSION_MANIFESTS: Readonly<Record<string, string>> = {
  '@tanstack/react-form': join('packages', 'formedible', 'node_modules', '@tanstack', 'react-form', 'package.json'),
  '@tanstack/ai': join('apps', 'web', 'node_modules', '@tanstack', 'ai', 'package.json'),
  react: join('packages', 'formedible', 'node_modules', 'react', 'package.json'),
};

function readInstalledVersion(manifestPath: string): string {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { version?: unknown };

  return typeof manifest.version === 'string' ? manifest.version : 'unknown';
}

function runGit(args: readonly string[]): string {
  return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

/** Environment metadata for the CURRENT implementation's installed tree. */
export function collectCurrentEnvironment(): BenchEnvironment {
  const versions: Record<string, string> = {};

  for (const [name, manifest] of Object.entries(VERSION_MANIFESTS)) {
    versions[name] = existsSync(join(repositoryRoot, manifest))
      ? readInstalledVersion(join(repositoryRoot, manifest))
      : 'not-installed';
  }

  return {
    gitSha: runGit(['rev-parse', 'HEAD']),
    gitBranch: runGit(['branch', '--show-current']),
    versions,
    node: process.version,
  };
}

function artifactFileName(timestamp: string, implementation: BenchImplementation): string {
  return `${timestamp.replace(/:/g, '-')}-${implementation}.json`;
}

/** Writes one run artifact and returns its absolute path. */
export function writeRunArtifact(implementation: BenchImplementation, records: readonly BenchRecord[]): string {
  mkdirSync(runsDirectory, { recursive: true });

  const file = join(runsDirectory, artifactFileName(new Date().toISOString(), implementation));

  writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  return file;
}

export function readRunArtifact(file: string): RunArtifact {
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as readonly BenchRecord[];

  if (!Array.isArray(parsed)) {
    throw new Error(`Benchmark artifact ${file} does not contain a record array.`);
  }

  return { file, records: parsed };
}

/**
 * Newest run artifact for an implementation. Timestamps embed colons replaced
 * with dashes, so lexicographic file-name order equals chronological order.
 */
export function readNewestRunArtifact(implementation: BenchImplementation): RunArtifact | undefined {
  if (!existsSync(runsDirectory)) {
    return undefined;
  }

  const candidates = readdirSync(runsDirectory)
    .filter((name) => name.endsWith(`-${implementation}.json`))
    .sort((first, second) => (first < second ? -1 : first > second ? 1 : 0));

  const newest = candidates[candidates.length - 1];

  return newest === undefined ? undefined : readRunArtifact(join(runsDirectory, newest));
}
