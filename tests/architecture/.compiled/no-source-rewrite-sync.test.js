import { describe, it } from 'node:test';
import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, isFileWritingScript } from './utils.js';
// Writer scripts come into scope by content (see isFileWritingScript), not by
// filename. The `.js`-suffix import smell is scoped to Formedible-referencing
// specifiers: release tooling legitimately imports sibling scripts such as
// './create-release-assets.js', which is normal Node ESM rather than
// ESM-rewritten Formedible source (FROM-SCRATCH-2.md "Sync Model" forbids
// adding `.js` suffixes to synced Formedible modules).
const rewritePatterns = [
    /\bMagicString\b/,
    /\bts-morph\b/,
    /\bimport\b[\s\S]*?['"][^'"]*formedible[^'"]*\.m?js['"][\s\S]*?\bwriteFile/i,
    /writeFile[\s\S]*?\bcontent\s*\./,
    /@formedible\/ui\/lib\/formedible\//,
];
export function findSourceRewriteSyncViolations(files) {
    return files
        .filter(isFileWritingScript)
        .flatMap((file) => rewritePatterns
        .filter((pattern) => pattern.test(file.content))
        .map((pattern) => `sync source rewrite logic is forbidden in ${file.relativePath}: ${pattern.source}`));
}
describe('no source rewrite sync', () => {
    it('rejects sample sync import rewriting through TypeScript AST mutation', () => {
        assertHasViolations(findSourceRewriteSyncViolations([
            {
                relativePath: 'scripts/quick-sync.ts',
                content: "import { Project } from 'ts-morph';\nawait writeFile(target, project.getFullText());",
            },
        ]));
    });
    it('rejects sample sync importing a formedible module with an ESM-rewritten suffix before writing files', () => {
        assertHasViolations(findSourceRewriteSyncViolations([
            {
                relativePath: 'scripts/copy-core.ts',
                content: "import { fields } from '../packages/formedible/src/lib/formedible/types.js';\nawait writeFile(target, fields);",
            },
        ]));
    });
    it('allows sample release tooling that imports sibling scripts with Node ESM suffixes', () => {
        assertNoViolations(findSourceRewriteSyncViolations([
            {
                relativePath: 'scripts/build-release.js',
                content: "import { createReleaseAssets } from './create-release-assets.js';\nimport { deployGhPages } from './deploy-gh-pages.js';\nawait writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\\n`, 'utf8');",
            },
        ]));
    });
    it('ignores sample validator that never writes files', () => {
        assertNoViolations(findSourceRewriteSyncViolations([
            {
                relativePath: 'scripts/validate-example.js',
                content: "import { Project } from 'ts-morph';\nconsole.info(new Project());",
            },
        ]));
    });
    it('rejects source rewrite sync in the repository', async () => {
        assertNoViolations(findSourceRewriteSyncViolations(await collectRepositoryTextFiles()));
    });
});
