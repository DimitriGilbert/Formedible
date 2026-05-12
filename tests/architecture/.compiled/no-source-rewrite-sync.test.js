import { describe, it } from 'node:test';
import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles } from './utils.js';
const syncPathPattern = /^scripts\/.*sync.*\.(?:cjs|js|mjs|ts)$/;
const rewritePatterns = [
    /\.replace(?:All)?\s*\(/,
    /\bMagicString\b/,
    /\bts-morph\b/,
    /\bfrom\s*:\s*['"][^'"]+['"]\s*,\s*to\s*:/,
    /\bimport\b[\s\S]*?\.js['"][\s\S]*?writeFile/,
    /writeFile[\s\S]*?\bcontent\s*\./,
];
export function findSourceRewriteSyncViolations(files) {
    return files
        .filter((file) => syncPathPattern.test(file.relativePath))
        .flatMap((file) => rewritePatterns
        .filter((pattern) => pattern.test(file.content))
        .map((pattern) => `sync source rewrite logic is forbidden in ${file.relativePath}: ${pattern.source}`));
}
describe('no source rewrite sync', () => {
    it('rejects sample sync import rewriting', () => {
        assertHasViolations(findSourceRewriteSyncViolations([
            {
                relativePath: 'scripts/quick-sync.ts',
                content: "await writeFile(target, source.replace(/from '(.+)'/g, \"from '$1.js'\"));",
            },
        ]));
    });
    it('rejects source rewrite sync in the repository', async () => {
        assertNoViolations(findSourceRewriteSyncViolations(await collectRepositoryTextFiles()));
    });
});
