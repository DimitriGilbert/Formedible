import ts from 'typescript';

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const sourceFileExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const sourceFileExtensionPattern = /\.[cm]?[jt]sx?$/;
const ignoredDirectories = new Set(['.compiled', '.tmp', 'dist', 'node_modules']);

const validationScopes = [
  {
    label: 'apps/web synced shadcn surface',
    root: 'apps/web/src',
    validate: validateWebSyncImport,
  },
  {
    label: 'packages/builder shadcn internals',
    root: 'packages/builder/src',
    validate: validatePackageWorkspaceImport,
  },
  {
    label: 'packages/ai-builder shadcn internals',
    root: 'packages/ai-builder/src',
    validate: validatePackageWorkspaceImport,
  },
  {
    label: 'packages/formedible-parser shadcn internals',
    root: 'packages/formedible-parser/src',
    validate: validatePackageWorkspaceImport,
  },
  {
    label: 'packages/ui Formedible install surface',
    root: 'packages/ui/src/components/formedible',
    validate: validateUiInstallSurfaceImport,
  },
];

function isSourceFileName(fileName) {
  return sourceFileExtensions.has(fileName.slice(fileName.lastIndexOf('.')));
}

function formatLocation(rootDirectory, occurrence) {
  return `${relative(rootDirectory, occurrence.filePath)}:${occurrence.line}:${occurrence.column}`;
}

function parseSourceKind(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    return ts.ScriptKind.TSX;
  }

  if (filePath.endsWith('.ts')) {
    return ts.ScriptKind.TS;
  }

  return ts.ScriptKind.JS;
}

function getModuleSpecifier(node) {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier)) {
    return { specifier: node.moduleSpecifier.text, position: node.moduleSpecifier.getStart() };
  }

  return undefined;
}

function collectImportOccurrences(filePath, content) {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, parseSourceKind(filePath));
  const occurrences = [];

  function visit(node) {
    const moduleSpecifier = getModuleSpecifier(node);

    if (moduleSpecifier !== undefined) {
      const location = sourceFile.getLineAndCharacterOfPosition(moduleSpecifier.position);
      occurrences.push({
        filePath,
        line: location.line + 1,
        column: location.character + 1,
        specifier: moduleSpecifier.specifier,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return occurrences;
}

async function collectSourceFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectSourceFiles(entryPath)));
      }
      continue;
    }

    if (entry.isFile() && isSourceFileName(entry.name) && sourceFileExtensionPattern.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function isExactOrSubpath(specifier, expectedSpecifier) {
  return specifier === expectedSpecifier || specifier.startsWith(`${expectedSpecifier}/`) || sourceFileExtensionPattern.test(specifier.slice(expectedSpecifier.length));
}

function validateWebSyncImport(occurrence) {
  if (occurrence.specifier.startsWith('@formedible/ui/lib/formedible/')) {
    return `apps/web synced shadcn files must not import invalid package lib mirror ${occurrence.specifier}`;
  }

  return undefined;
}

function validatePackageWorkspaceImport(occurrence) {
  if (occurrence.specifier === '@formedible/ui' || occurrence.specifier.startsWith('@formedible/ui/')) {
    return `Package/plugin shadcn internals must keep local source copies and must not import ${occurrence.specifier}`;
  }

  return undefined;
}

function validateUiInstallSurfaceImport(occurrence) {
  if (occurrence.specifier === '@ui' || occurrence.specifier.startsWith('@ui/')) {
    return `packages/ui Formedible install surface must not import public registry alias ${occurrence.specifier}`;
  }

  if (occurrence.specifier.includes('/formedible/ui/') || occurrence.specifier.endsWith('/formedible/ui')) {
    return `packages/ui Formedible install surface must not import obsolete Formedible UI internals from ${occurrence.specifier}`;
  }

  return undefined;
}

async function validateScope(rootDirectory, scope) {
  const scopeRoot = join(rootDirectory, scope.root);
  const sourceFiles = await collectSourceFiles(scopeRoot);
  const failures = [];

  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, 'utf8');
    const occurrences = collectImportOccurrences(filePath, content);

    for (const occurrence of occurrences) {
      const message = scope.validate(occurrence);

      if (message !== undefined) {
        failures.push({ ...occurrence, message, scopeLabel: scope.label });
      }
    }
  }

  return failures;
}

async function validateSyncBoundaries(rootDirectory) {
  const failures = [];

  for (const scope of validationScopes) {
    failures.push(...(await validateScope(rootDirectory, scope)));
  }

  return failures;
}

async function main() {
  const rootDirectory = process.cwd();
  const failures = await validateSyncBoundaries(rootDirectory);

  if (failures.length === 0) {
    return;
  }

  console.error('Sync boundary validation failed:');

  for (const failure of failures) {
    console.error(`- [${failure.scopeLabel}] ${formatLocation(rootDirectory, failure)} ${failure.message}`);
  }

  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
