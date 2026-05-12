import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export interface RepositoryFile {
  readonly relativePath: string;
  readonly content: string;
}

export interface RepositoryEntry {
  readonly relativePath: string;
  readonly isDirectory: boolean;
}

const ignoredDirectoryNames = new Set([
  '.compiled',
  '.git',
  '.next',
  '.output',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'old_version_for_knowledge_purpose',
  'out',
]);

const ignoredGeneratedFileNames = new Set(['routeTree.gen.ts']);

const ignoredRelativeDirectoryPaths = new Set(['tests/architecture']);

const textExtensions = new Set([
  '.cjs',
  '.css',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

export const repositoryRoot = process.cwd();

export function isIgnoredGeneratedFileName(fileName: string): boolean {
  return ignoredGeneratedFileNames.has(fileName);
}

export function normalizePath(path: string): string {
  return path.split(sep).join('/');
}

export function isTextPath(path: string): boolean {
  return [...textExtensions].some((extension) => path.endsWith(extension));
}

export async function collectRepositoryEntries(): Promise<RepositoryEntry[]> {
  const entries: RepositoryEntry[] = [];

  async function walk(directoryPath: string): Promise<void> {
    const children = await readdir(directoryPath, { withFileTypes: true });

    for (const child of children) {
      if (isIgnoredGeneratedFileName(child.name)) {
        continue;
      }

      const absolutePath = join(directoryPath, child.name);
      const relativePath = normalizePath(relative(repositoryRoot, absolutePath));

      if (child.isDirectory() && (ignoredDirectoryNames.has(child.name) || ignoredRelativeDirectoryPaths.has(relativePath))) {
        continue;
      }

      entries.push({ relativePath, isDirectory: child.isDirectory() });

      if (child.isDirectory()) {
        await walk(absolutePath);
      }
    }
  }

  await walk(repositoryRoot);

  return entries;
}

export async function collectRepositoryTextFiles(): Promise<RepositoryFile[]> {
  const entries = await collectRepositoryEntries();
  const files: RepositoryFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory || !isTextPath(entry.relativePath)) {
      continue;
    }

    const filePath = join(repositoryRoot, entry.relativePath);
    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      continue;
    }

    files.push({
      relativePath: entry.relativePath,
      content: await readFile(filePath, 'utf8'),
    });
  }

  return files;
}

export function assertNoViolations(violations: readonly string[]): void {
  if (violations.length > 0) {
    throw new Error(violations.join('\n'));
  }
}

export function assertHasViolations(violations: readonly string[]): void {
  if (violations.length === 0) {
    throw new Error('Expected architecture guardrail to reject the sample input.');
  }
}

export function extractImportSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  const importFromPattern = /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  const sideEffectImportPattern = /import\s+['"]([^'"]+)['"]/g;
  const exportFromPattern = /export\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;

  for (const pattern of [importFromPattern, sideEffectImportPattern, exportFromPattern]) {
    for (const match of content.matchAll(pattern)) {
      const specifier = match[1];

      if (specifier !== undefined) {
        specifiers.push(specifier);
      }
    }
  }

  return specifiers;
}

export function stripCommentsAndWhitespace(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
}
