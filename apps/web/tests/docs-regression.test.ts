import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { docsCompatibilityExamples } from '../src/docs/compatibility-examples';

const appRoot = process.cwd();
const docsSourceRoot = join(appRoot, 'src');

const requiredExampleIds = [
  'contact-form',
  'registration-form',
  'checkout-form',
  'job-application-form',
  'survey-form-dynamic-options',
  'conditional-pages-form',
  'persistence-form',
  'tabbed-form',
  'array-fields-form',
  'nested-conditional-object-in-array-form',
  'flow-form',
  'rental-car-flow-form',
  'analytics-tracking-form',
  'advanced-field-types-form',
] as const;

async function collectRuntimeFiles(directoryPath: string): Promise<readonly string[]> {
  const children = await readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const child of children) {
    const childPath = join(directoryPath, child.name);

    if (child.isDirectory()) {
      files.push(...(await collectRuntimeFiles(childPath)));
      continue;
    }

    if (/\.(?:ts|tsx)$/.test(child.name) && child.name !== 'routeTree.gen.ts') {
      files.push(childPath);
    }
  }

  return files;
}

describe('docs compatibility examples', () => {
  it('covers every required compatibility example exactly once', () => {
    const actualIds = docsCompatibilityExamples.map((example) => example.id).sort();

    assert.deepEqual(actualIds, [...requiredExampleIds].sort());
  });

  it('renders examples from real Formedible Form output', () => {
    for (const example of docsCompatibilityExamples) {
      assert.ok(example.options.fields.length > 0, `${example.id} must define public fields`);
      assert.equal(typeof example.options.formOptions.onSubmit, 'function', `${example.id} must use a real submit handler`);
    }
  });

  it('keeps runtime docs imports on consumer-safe paths', async () => {
    const docsFile = await readFile(join(appRoot, 'src/docs/compatibility-examples.tsx'), 'utf8');

    assert.match(docsFile, /from ['"]@\/hooks\/use-formedible['"]/);
    assert.doesNotMatch(docsFile, /@formedible\/formedible|packages\/formedible|old_version_for_knowledge_purpose|tests\/compatibility-examples/);
    assert.doesNotMatch(docsFile, /from ['"][^'"]+\.(?:js|mjs)['"]/);
  });

  it('does not reference old docs or test-only compatibility data from runtime app code', async () => {
    const files = await collectRuntimeFiles(docsSourceRoot);
    const violations: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf8');

      if (/old_version_for_knowledge_purpose|tests\/compatibility-examples/.test(content)) {
        violations.push(relative(appRoot, file));
      }
    }

    assert.deepEqual(violations, []);
  });

  it('does not document removed validation or debug return helpers', async () => {
    const docsFile = await readFile(join(appRoot, 'src/docs/compatibility-examples.tsx'), 'utf8');

    assert.doesNotMatch(docsFile, /validateField|validateForm|debug|Debug/);
  });
});
