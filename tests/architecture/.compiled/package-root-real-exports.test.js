import { describe, it } from 'node:test';
import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, stripCommentsAndWhitespace } from './utils.js';
const sourceRootEntrypointPattern = /^packages\/[^/]+\/src\/index\.(?:ts|tsx)$/;
const allowedEntrypointStatementPattern = /^(?:export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+['"][^'"]+['"];?|import\s+type\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?|export\s+type\s+\{[\s\S]*?\};?)$/;
export function findPackageRootExportViolations(files) {
    return files
        .filter((file) => sourceRootEntrypointPattern.test(file.relativePath))
        .flatMap((file) => {
        const content = stripCommentsAndWhitespace(file.content);
        if (content.length === 0) {
            return [];
        }
        const statements = content
            .split(/\n(?=(?:export|import)\s)/)
            .map((statement) => statement.trim())
            .filter((statement) => statement.length > 0);
        const invalidStatements = statements.filter((statement) => !allowedEntrypointStatementPattern.test(statement));
        return invalidStatements.map((statement) => `source root entrypoint must re-export real modules instead of implementing runtime behavior in ${file.relativePath}: ${statement}`);
    });
}
describe('package root real exports', () => {
    it('rejects sample source root runtime implementations', () => {
        assertHasViolations(findPackageRootExportViolations([
            {
                relativePath: 'packages/formedible/src/index.ts',
                content: "export function useFormedible() { return { form: null }; }",
            },
        ]));
    });
    it('rejects runtime implementations in repository source root entrypoints', async () => {
        assertNoViolations(findPackageRootExportViolations(await collectRepositoryTextFiles()));
    });
});
