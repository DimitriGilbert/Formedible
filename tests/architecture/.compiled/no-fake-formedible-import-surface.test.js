import { describe, it } from 'node:test';
import { assertNoViolations, assertHasViolations, collectRepositoryEntries, collectRepositoryTextFiles, } from './utils.js';
const fakeSurfacePattern = /(^|\/)generated\/formedible(\/|$)/;
const moduleReferencePatterns = [
    /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /export\s+(?:type\s+)?[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];
function extractModuleReferenceSpecifiers(content) {
    const specifiers = [];
    for (const pattern of moduleReferencePatterns) {
        for (const match of content.matchAll(pattern)) {
            const specifier = match[1];
            if (specifier !== undefined) {
                specifiers.push(specifier);
            }
        }
    }
    return specifiers;
}
export function findFakeFormediblePathViolations(entries) {
    return entries
        .filter((entry) => fakeSurfacePattern.test(entry.relativePath))
        .map((entry) => `generated Formedible surface is forbidden: ${entry.relativePath}`);
}
export function findFakeFormedibleImportViolations(files) {
    return files.flatMap((file) => extractModuleReferenceSpecifiers(file.content)
        .filter((specifier) => specifier.includes('generated/formedible'))
        .map((specifier) => `generated Formedible import is forbidden in ${file.relativePath}: ${specifier}`));
}
describe('no fake Formedible import surface', () => {
    it('rejects sample generated/formedible paths and imports', () => {
        assertHasViolations([
            ...findFakeFormediblePathViolations([{ relativePath: 'apps/web/src/generated/formedible/index.ts', isDirectory: false }]),
            ...findFakeFormedibleImportViolations([
                { relativePath: 'docs/example.md', content: "import { Formedible } from '@/generated/formedible';" },
            ]),
        ]);
    });
    it('rejects sample require and dynamic import references to generated/formedible', () => {
        assertHasViolations(findFakeFormedibleImportViolations([
            { relativePath: 'scripts/example.cjs', content: "const formedible = require('@/generated/formedible');" },
            { relativePath: 'scripts/example.ts', content: "await import('@/generated/formedible');" },
        ]));
    });
    it('rejects generated/formedible paths and imports in the repository', async () => {
        assertNoViolations([
            ...findFakeFormediblePathViolations(await collectRepositoryEntries()),
            ...findFakeFormedibleImportViolations(await collectRepositoryTextFiles()),
        ]);
    });
});
