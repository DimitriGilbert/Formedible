import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { pathExists } from './temp-workspace.js';

export interface InspectedPackageJson {
  readonly path: string;
  readonly name: string;
  readonly scripts: Readonly<Record<string, string>>;
}

export interface GeneratedBetterTStackAppInspection {
  readonly rootPackage: InspectedPackageJson;
  readonly webPackage: InspectedPackageJson;
  readonly uiPackage: InspectedPackageJson;
  readonly webPackageDirectory: string;
  readonly uiPackageDirectory: string;
}

/**
 * Reads generated package.json files before the smoke harness chooses package paths or scripts.
 */
export async function inspectGeneratedBetterTStackApp(appDirectory: string): Promise<GeneratedBetterTStackAppInspection> {
  const rootPackage = await readPackageJson(join(appDirectory, 'package.json'));
  const candidateWebPackageDirectory = join(appDirectory, 'apps', 'web');
  const candidateUiPackageDirectory = join(appDirectory, 'packages', 'ui');

  if (!(await pathExists(candidateWebPackageDirectory))) {
    const appEntries = await listDirectoryIfPresent(join(appDirectory, 'apps'));
    throw new Error(
      `Expected Better-T-Stack TanStack Start web package at apps/web, but it was not found under ${appDirectory}. apps entries: ${appEntries.join(
        ', ',
      )}`,
    );
  }

  if (!(await pathExists(candidateUiPackageDirectory))) {
    const packageEntries = await listDirectoryIfPresent(join(appDirectory, 'packages'));
    throw new Error(
      `Expected Better-T-Stack shared UI package at packages/ui, but it was not found under ${appDirectory}. packages entries: ${packageEntries.join(
        ', ',
      )}`,
    );
  }

  const webPackage = await readPackageJson(join(candidateWebPackageDirectory, 'package.json'));
  const uiPackage = await readPackageJson(join(candidateUiPackageDirectory, 'package.json'));

  return {
    rootPackage,
    webPackage,
    uiPackage,
    webPackageDirectory: candidateWebPackageDirectory,
    uiPackageDirectory: candidateUiPackageDirectory,
  };
}

async function readPackageJson(path: string): Promise<InspectedPackageJson> {
  const raw = await readFile(path, 'utf8');
  const parsed: unknown = JSON.parse(raw);

  if (!isPackageJson(parsed)) {
    throw new Error(`Generated package file is missing required name/scripts fields: ${path}`);
  }

  return {
    path,
    name: parsed.name,
    scripts: parsed.scripts,
  };
}

async function listDirectoryIfPresent(directory: string): Promise<readonly string[]> {
  if (!(await pathExists(directory))) {
    return [];
  }

  return await readdir(directory);
}

function isPackageJson(value: unknown): value is { readonly name: string; readonly scripts: Record<string, string> } {
  if (!isRecord(value) || typeof value.name !== 'string' || !isRecord(value.scripts)) {
    return false;
  }

  return Object.values(value.scripts).every((script) => typeof script === 'string');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
