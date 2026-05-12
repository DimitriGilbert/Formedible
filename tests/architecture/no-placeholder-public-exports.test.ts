import { describe, it } from 'node:test';

import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, type RepositoryFile } from './utils.js';

const sourceRootEntrypointPattern = /^packages\/[^/]+\/src\/index\.(?:ts|tsx)$/;
const placeholderPatterns = [
  /\bplaceholder\b/i,
  /\bnot implemented\b/i,
  /\bcoming soon\b/i,
  /throw\s+new\s+Error\s*\(\s*['"][^'"]*(?:not implemented|placeholder|coming soon)/i,
  /return\s+null\s*;/,
  /return\s+<[^>]+>\s*(?:TODO|Placeholder|Coming soon|Not implemented)/i,
];

export function findPlaceholderPublicExportViolations(files: readonly RepositoryFile[]): string[] {
  return files
    .filter((file) => sourceRootEntrypointPattern.test(file.relativePath))
    .flatMap((file) =>
      placeholderPatterns
        .filter((pattern) => pattern.test(file.content))
        .map((pattern) => `public source entrypoint contains placeholder runtime in ${file.relativePath}: ${pattern.source}`),
    );
}

describe('no placeholder public exports', () => {
  it('rejects sample placeholder source entrypoint exports', () => {
    assertHasViolations(
      findPlaceholderPublicExportViolations([
        {
          relativePath: 'packages/formedible/src/index.tsx',
          content: "export function Formedible() { return null; }",
        },
      ]),
    );
  });

  it('rejects placeholder public exports in the repository', async () => {
    assertNoViolations(findPlaceholderPublicExportViolations(await collectRepositoryTextFiles()));
  });
});
