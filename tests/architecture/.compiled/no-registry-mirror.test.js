import { describe, it } from 'node:test';
import { assertHasViolations, assertNoViolations, collectRepositoryEntries } from './utils.js';
export function findRegistryMirrorViolations(entries) {
    return entries
        .filter((entry) => entry.relativePath === 'registry/default' || entry.relativePath.startsWith('registry/default/'))
        .map((entry) => `registry mirror is forbidden: ${entry.relativePath}`);
}
describe('no registry mirror', () => {
    it('rejects sample registry/default entries', () => {
        assertHasViolations(findRegistryMirrorViolations([{ relativePath: 'registry/default/form.json', isDirectory: false }]));
    });
    it('allows sample shadcn-built registry payload output', () => {
        assertNoViolations(findRegistryMirrorViolations([{ relativePath: 'packages/formedible/.compiled/registry/default/form.json', isDirectory: false }]));
    });
    it('rejects registry/default in the repository', async () => {
        assertNoViolations(findRegistryMirrorViolations(await collectRepositoryEntries()));
    });
});
