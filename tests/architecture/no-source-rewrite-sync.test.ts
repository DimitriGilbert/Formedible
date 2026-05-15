import { describe, it } from 'node:test';

import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, type RepositoryFile } from './utils.js';

const syncPathPattern = /^scripts\/.*sync.*\.(?:cjs|js|mjs|ts)$/;
const rewritePatterns = [
  /\bMagicString\b/,
  /\bts-morph\b/,
  /\bimport\b[\s\S]*?\.js['"][\s\S]*?writeFile/,
  /writeFile[\s\S]*?\bcontent\s*\./,
  /@formedible\/ui\/lib\/formedible\//,
];

export function findSourceRewriteSyncViolations(files: readonly RepositoryFile[]): string[] {
  return files
    .filter((file) => syncPathPattern.test(file.relativePath))
    .flatMap((file) =>
      rewritePatterns
        .filter((pattern) => pattern.test(file.content))
        .map((pattern) => `sync source rewrite logic is forbidden in ${file.relativePath}: ${pattern.source}`),
    );
}

describe('no source rewrite sync', () => {
  it('rejects sample sync import rewriting through TypeScript AST mutation', () => {
    assertHasViolations(
      findSourceRewriteSyncViolations([
        {
          relativePath: 'scripts/quick-sync.ts',
          content: "import { Project } from 'ts-morph';\nawait writeFile(target, project.getFullText());",
        },
      ]),
    );
  });

  it('rejects source rewrite sync in the repository', async () => {
    assertNoViolations(findSourceRewriteSyncViolations(await collectRepositoryTextFiles()));
  });
});
