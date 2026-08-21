import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
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
// Generated output is ignored by exact repository-relative path, never by bare
// filename, so the ignore cannot silently widen to same-named files elsewhere.
const ignoredGeneratedFilePaths = new Set(['apps/web/src/routeTree.gen.ts']);
const ignoredRelativeDirectoryPaths = new Set(['tests/architecture']);
const scriptFilePathPattern = /^scripts\/.*\.(?:cjs|js|mjs|ts)$/;
// A script comes into sync-contract scope when its content writes files, not
// when its filename mentions sync, so renamed or new writer scripts cannot
// escape the copy-only contract (FROM-SCRATCH-2.md "Sync Model").
const fileWritingCallPattern = /\b(?:writeFile|copyFile)(?:Sync)?\s*\(/;
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
export const pinnedGeneratedFilePaths = [...ignoredGeneratedFilePaths];
export function isIgnoredGeneratedFilePath(relativePath) {
    return ignoredGeneratedFilePaths.has(relativePath);
}
export function normalizePath(path) {
    return path.split(sep).join('/');
}
export function isTextPath(path) {
    return [...textExtensions].some((extension) => path.endsWith(extension));
}
export function isFileWritingScript(file) {
    return scriptFilePathPattern.test(file.relativePath) && fileWritingCallPattern.test(file.content);
}
export async function collectRepositoryEntries() {
    const entries = [];
    await walkRepository((entry) => {
        entries.push(entry);
    });
    return entries;
}
// Reports every repository-relative path the generated-output ignore actually
// skips during collection, so tests can prove only pinned paths are ignored.
export async function listIgnoredGeneratedFilePaths() {
    const ignoredPaths = [];
    await walkRepository(undefined, (relativePath) => {
        ignoredPaths.push(relativePath);
    });
    return ignoredPaths;
}
async function walkRepository(visitEntry, visitIgnored) {
    async function walk(directoryPath) {
        const children = await readdir(directoryPath, { withFileTypes: true });
        for (const child of children) {
            const absolutePath = join(directoryPath, child.name);
            const relativePath = normalizePath(relative(repositoryRoot, absolutePath));
            if (isIgnoredGeneratedFilePath(relativePath)) {
                visitIgnored?.(relativePath);
                continue;
            }
            if (child.isDirectory() && (child.name.startsWith('.') || ignoredDirectoryNames.has(child.name) || ignoredRelativeDirectoryPaths.has(relativePath))) {
                continue;
            }
            visitEntry?.({ relativePath, isDirectory: child.isDirectory() });
            if (child.isDirectory()) {
                await walk(absolutePath);
            }
        }
    }
    await walk(repositoryRoot);
}
export async function collectRepositoryTextFiles() {
    const entries = await collectRepositoryEntries();
    const files = [];
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
export function assertNoViolations(violations) {
    if (violations.length > 0) {
        throw new Error(violations.join('\n'));
    }
}
export function assertHasViolations(violations) {
    if (violations.length === 0) {
        throw new Error('Expected architecture guardrail to reject the sample input.');
    }
}
export function extractImportSpecifiers(content) {
    const specifiers = [];
    const importFromPattern = /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
    const sideEffectImportPattern = /import\s+['"]([^'"]+)['"]/g;
    const exportFromPattern = /export\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
    // require(...) and dynamic import(...) are module references too; without
    // them CommonJS or lazy-loading callers could hide forbidden specifiers.
    const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    const dynamicImportPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const pattern of [importFromPattern, sideEffectImportPattern, exportFromPattern, requirePattern, dynamicImportPattern]) {
        for (const match of content.matchAll(pattern)) {
            const specifier = match[1];
            if (specifier !== undefined) {
                specifiers.push(specifier);
            }
        }
    }
    return specifiers;
}
export function stripCommentsAndWhitespace(content) {
    return content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .trim();
}
