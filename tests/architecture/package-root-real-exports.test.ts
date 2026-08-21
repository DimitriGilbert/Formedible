import { describe, it } from 'node:test';

import { assertHasViolations, assertNoViolations, collectRepositoryTextFiles, stripCommentsAndWhitespace, type RepositoryFile } from './utils.js';

const sourceRootEntrypointPattern = /^packages\/([^/]+)\/src\/index\.(ts|tsx)$/;
const packageJsonPathPattern = /^packages\/([^/]+)\/package\.json$/;
// The core Formedible package owns the public API, so its source root
// entrypoint is mandatory. This keeps the scan non-vacuous: it can never pass
// merely because no package happened to ship an entrypoint.
const requiredEntrypointPaths = ['packages/formedible/src/index.ts'];
const allowedEntrypointStatementPattern = /^(?:export\s+(?:type\s+)?(?:\*|\{[\s\S]*?\})\s+from\s+['"][^'"]+['"];?|import\s+type\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?|export\s+type\s+\{[\s\S]*?\};?)$/;
const exportStatementPattern = /^export\b/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Root entrypoint declarations (main, module, exports["."]) that point into
// src/. Build-output declarations such as ./dist/index.js are out of scope for
// a source-tree scan.
function readDeclaredSourceEntrypointPaths(packageJsonContent: string, packageName: string): string[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(packageJsonContent);
  } catch {
    return [];
  }

  if (!isRecord(parsed)) {
    return [];
  }

  const declaredPaths: string[] = [];

  for (const field of ['main', 'module']) {
    const value = parsed[field];

    if (typeof value === 'string') {
      declaredPaths.push(value);
    }
  }

  const exportsValue = parsed['exports'];

  if (typeof exportsValue === 'string') {
    declaredPaths.push(exportsValue);
  } else if (isRecord(exportsValue)) {
    const rootExport = exportsValue['.'];

    if (typeof rootExport === 'string') {
      declaredPaths.push(rootExport);
    } else if (isRecord(rootExport)) {
      for (const condition of ['types', 'import', 'require', 'default']) {
        const value = rootExport[condition];

        if (typeof value === 'string') {
          declaredPaths.push(value);
        }
      }
    }
  }

  return declaredPaths
    .filter((declaredPath) => declaredPath.startsWith('./src/'))
    .map((declaredPath) => `packages/${packageName}/${declaredPath.slice('./'.length)}`);
}

function findEntrypointStatementViolations(file: RepositoryFile): string[] {
  const content = stripCommentsAndWhitespace(file.content);

  if (content.length === 0) {
    return [`source root entrypoint must re-export the package public API; comments-only entrypoints are not real exports in ${file.relativePath}`];
  }

  const statements = content
    .split(/\n(?=(?:export|import)\s)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
  const violations =
    statements.some((statement) => exportStatementPattern.test(statement))
      ? []
      : [`source root entrypoint must contain at least one export statement in ${file.relativePath}`];

  return statements
    .filter((statement) => !allowedEntrypointStatementPattern.test(statement))
    .map((statement) => `source root entrypoint must re-export real modules instead of implementing runtime behavior in ${file.relativePath}: ${statement}`)
    .concat(violations);
}

export function findPackageRootExportViolations(files: readonly RepositoryFile[]): string[] {
  const violations: string[] = [];
  const entrypointFiles = files.filter((file) => sourceRootEntrypointPattern.test(file.relativePath));
  const entrypointPaths = new Set(entrypointFiles.map((file) => file.relativePath));

  for (const requiredPath of requiredEntrypointPaths) {
    if (!entrypointPaths.has(requiredPath)) {
      violations.push(`source root entrypoint is required for the public API package but is missing: ${requiredPath}`);
    }
  }

  for (const file of entrypointFiles) {
    violations.push(...findEntrypointStatementViolations(file));
  }

  const knownPaths = new Set(files.map((file) => file.relativePath));

  for (const file of files) {
    const packageJsonMatch = packageJsonPathPattern.exec(file.relativePath);

    if (packageJsonMatch === null) {
      continue;
    }

    const packageName = packageJsonMatch[1];

    if (packageName === undefined) {
      continue;
    }

    for (const declaredPath of readDeclaredSourceEntrypointPaths(file.content, packageName)) {
      if (!knownPaths.has(declaredPath)) {
        violations.push(`package.json declares a source root entrypoint that does not exist: ${declaredPath}`);
      }
    }
  }

  return violations;
}

describe('package root real exports', () => {
  it('rejects sample source root runtime implementations', () => {
    assertHasViolations(
      findPackageRootExportViolations([
        {
          relativePath: 'packages/formedible/src/index.ts',
          content: "export function useFormedible() { return { form: null }; }",
        },
      ]),
    );
  });

  it('rejects sample comments-only source root entrypoint', () => {
    assertHasViolations(
      findPackageRootExportViolations([
        {
          relativePath: 'packages/formedible/src/index.ts',
          content: '// reserved for future public exports\n',
        },
      ]),
    );
  });

  it('rejects sample source root entrypoint without any export statement', () => {
    assertHasViolations(
      findPackageRootExportViolations([
        {
          relativePath: 'packages/formedible/src/index.ts',
          content: "import type { UseFormedibleOptions } from '@/lib/formedible/types';\n",
        },
      ]),
    );
  });

  it('rejects sample package that declares a missing source root entrypoint', () => {
    assertHasViolations(
      findPackageRootExportViolations([
        {
          relativePath: 'packages/example/package.json',
          content: '{\n  "name": "@formedible/example",\n  "main": "./src/index.ts"\n}\n',
        },
      ]),
    );
  });

  it('allows sample packages with real re-exporting source root entrypoints', () => {
    assertNoViolations(
      findPackageRootExportViolations([
        {
          relativePath: 'packages/formedible/src/index.ts',
          content: "export { useFormedible } from '@/hooks/use-formedible';\n",
        },
        {
          relativePath: 'packages/example/src/index.tsx',
          content: "export { Example } from '@/components/example';\nexport type { ExampleProps } from '@/components/example';\n",
        },
        {
          relativePath: 'packages/example/package.json',
          content: '{\n  "name": "@formedible/example",\n  "main": "./src/index.tsx"\n}\n',
        },
        {
          relativePath: 'packages/ui/package.json',
          content: '{\n  "name": "@formedible/ui",\n  "exports": {\n    "./globals.css": "./src/styles/globals.css",\n    "./lib/*": "./src/lib/*.ts"\n  }\n}\n',
        },
      ]),
    );
  });

  it('rejects runtime implementations in repository source root entrypoints', async () => {
    assertNoViolations(findPackageRootExportViolations(await collectRepositoryTextFiles()));
  });
});
