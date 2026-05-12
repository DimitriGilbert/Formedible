import { describe, it } from 'node:test';

import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, type RepositoryFile } from './utils.js';

const formedibleFieldPathPattern = /^packages\/formedible\/src\/components\/formedible\/fields\/.*\.(?:tsx|jsx)$/;
const rawHtmlPrimitivePattern = /<(input|select|textarea|button|label|checkbox)\b/g;

export function findRawHtmlFieldPrimitiveViolations(files: readonly RepositoryFile[]): string[] {
  return files
    .filter((file) => formedibleFieldPathPattern.test(file.relativePath))
    .flatMap((file) => {
      const matches = [...file.content.matchAll(rawHtmlPrimitivePattern)];

      return matches.map((match) => `Formedible field must use shadcn primitive instead of raw <${match[1]}> in ${file.relativePath}`);
    });
}

describe('shadcn primitive usage', () => {
  it('rejects sample raw HTML basic field primitives', () => {
    assertHasViolations(
      findRawHtmlFieldPrimitiveViolations([
        {
          relativePath: 'packages/formedible/src/components/formedible/fields/text-field.tsx',
          content: 'export function TextField() { return <input />; }',
        },
      ]),
    );
  });

  it('rejects raw HTML basic field primitives in the repository', async () => {
    assertNoViolations(findRawHtmlFieldPrimitiveViolations(await collectRepositoryTextFiles()));
  });
});
