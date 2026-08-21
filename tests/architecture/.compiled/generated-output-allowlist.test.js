import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { isIgnoredGeneratedFilePath, listIgnoredGeneratedFilePaths, pinnedGeneratedFilePaths, repositoryRoot } from './utils.js';
describe('generated output allowlist', () => {
    it('ignores the pinned generated route tree only at its exact repository path', () => {
        strictEqual(isIgnoredGeneratedFilePath('apps/web/src/routeTree.gen.ts'), true);
    });
    it('does not ignore same-named generated files in other directories', () => {
        strictEqual(isIgnoredGeneratedFilePath('packages/ui/src/routeTree.gen.ts'), false);
        strictEqual(isIgnoredGeneratedFilePath('apps/web/src/nested/routeTree.gen.ts'), false);
        strictEqual(isIgnoredGeneratedFilePath('routeTree.gen.ts'), false);
    });
    it('keeps every pinned generated path present in the repository', async () => {
        for (const pinnedPath of pinnedGeneratedFilePaths) {
            await stat(join(repositoryRoot, pinnedPath));
        }
    });
    it('ignores exactly the pinned path set when collecting the repository', async () => {
        const ignoredPaths = await listIgnoredGeneratedFilePaths();
        deepStrictEqual([...ignoredPaths].sort(), [...pinnedGeneratedFilePaths].sort());
        ok(pinnedGeneratedFilePaths.length > 0, 'the generated output allowlist must stay non-empty or the scan is vacuous');
    });
});
