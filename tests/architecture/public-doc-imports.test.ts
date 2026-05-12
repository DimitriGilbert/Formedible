import { describe, it } from 'node:test';

import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, extractImportSpecifiers, type RepositoryFile } from './utils.js';

const documentationPathPattern = /(^|\/)(docs|app\/docs|src\/app\/docs|README\.(?:md|mdx)$|.*\.(?:md|mdx)$)/;
const allowedFormedibleDocImports = new Set([
  '@/hooks/use-formedible',
  '@/components/formedible/form',
  '@/components/formedible/field-renderer',
  '@/components/formedible/fields/field-wrapper',
  '@/components/formedible/fields/text-field',
  '@/components/formedible/fields/field-registry',
  '@/lib/formedible/types',
  '@/lib/formedible/normalize-field-config',
]);

function referencesFormedible(specifier: string): boolean {
  const referencesFormedibleUiInstall = specifier.startsWith('@formedible/ui/components/formedible/');

  if (specifier.startsWith('@formedible/ui/')) {
    return referencesFormedibleUiInstall;
  }

  const referencesFormediblePackage = specifier === '@formedible/formedible' || specifier.startsWith('@formedible/formedible/');

  return referencesFormediblePackage || /formedible|registry\/default/i.test(specifier);
}

function isForbiddenDocImport(specifier: string): boolean {
  return referencesFormedible(specifier) && !allowedFormedibleDocImports.has(specifier);
}

export function findPublicDocImportViolations(files: readonly RepositoryFile[]): string[] {
  return files
    .filter((file) => documentationPathPattern.test(file.relativePath))
    .flatMap((file) =>
      extractImportSpecifiers(file.content)
        .filter(isForbiddenDocImport)
        .map((specifier) => `public docs must import Formedible from local shadcn install paths, not ${specifier} in ${file.relativePath}`),
    );
}

describe('public docs imports', () => {
  it('rejects sample docs importing Formedible from package or generated surfaces', () => {
    assertHasViolations(
      findPublicDocImportViolations([
        {
          relativePath: 'docs/getting-started.mdx',
          content: "import { useFormedible } from '@formedible/formedible';",
        },
      ]),
    );
  });

  it('rejects sample docs importing Formedible from non-allowlisted local paths', () => {
    assertHasViolations(
      findPublicDocImportViolations([
        {
          relativePath: 'docs/getting-started.mdx',
          content: "import { useFormedible } from '@/lib/use-formedible';",
        },
      ]),
    );
  });

  it('rejects sample docs importing Formedible through broad package UI paths', () => {
    assertHasViolations(
      findPublicDocImportViolations([
        {
          relativePath: 'docs/getting-started.mdx',
          content: "import { Formedible } from '@formedible/ui/components/formedible/form';",
        },
      ]),
    );
  });

  it('allows sample docs importing Formedible from exact local shadcn install paths', () => {
    assertNoViolations(
      findPublicDocImportViolations([
        {
          relativePath: 'docs/getting-started.mdx',
          content: "import { Formedible } from '@/components/formedible/form';\nimport { useFormedible } from '@/hooks/use-formedible';",
        },
      ]),
    );
  });

  it('allows sample docs importing non-Formedible shadcn primitives from the UI package', () => {
    assertNoViolations(
      findPublicDocImportViolations([
        {
          relativePath: 'README.md',
          content: "import { Button } from '@formedible/ui/components/button';",
        },
      ]),
    );
  });

  it('rejects invalid Formedible imports in repository docs', async () => {
    assertNoViolations(findPublicDocImportViolations(await collectRepositoryTextFiles()));
  });
});
