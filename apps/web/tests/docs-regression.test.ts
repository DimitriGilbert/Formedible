import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { docsCompatibilityExamples } from '../src/docs/compatibility-examples';
import { docsCodeExamples } from '../src/docs/code-examples';
import { createRouteSeoHead } from '../src/docs/seo';
import { publicRouteMeta, siteMeta } from '../src/docs/site-meta';

const appRoot = process.cwd();
const docsSourceRoot = join(appRoot, 'src');
const authoredRuntimeRoots = [
  join(appRoot, 'src/components'),
  join(appRoot, 'src/docs'),
  join(appRoot, 'src/hooks'),
  join(appRoot, 'src/lib'),
  join(appRoot, 'src/routes'),
  join(appRoot, 'src/router.tsx'),
] as const;

const forbiddenRuntimeRules = [
  {
    label: 'Next.js imports',
    pattern: /(?:from\s+['"]|import\s+['"])next(?:\/[^'"]*)?['"]/,
  },
  {
    label: 'Radix UI imports',
    pattern: /(?:from\s+['"]|import\s+['"])@radix-ui(?:\/[^'"]*)?['"]/,
  },
  {
    label: 'Framer Motion imports',
    pattern: /(?:from\s+['"]|import\s+['"])framer-motion['"]/,
  },
  {
    label: 'Motion imports',
    pattern: /(?:from\s+['"]|import\s+['"])motion(?:\/[^'"]*)?['"]/,
  },
  {
    label: 'console usage',
    pattern: /\bconsole\s*(?:\.|\[)/,
  },
  {
    label: 'alert usage',
    pattern: /(?:^|[^\w$.])alert\s*\(|\b(?:window|globalThis)\s*\.\s*alert\s*\(/,
  },
  {
    label: 'debug markers',
    pattern: /TODO|FIXME/,
  },
] as const;
const oldReferencePattern = /old_version_for_knowledge_purpose|tests\/compatibility-examples/;

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
  if (/\.(?:ts|tsx)$/.test(directoryPath)) {
    return [directoryPath];
  }

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

async function collectAuthoredRuntimeFiles(): Promise<readonly string[]> {
  const files = await Promise.all(authoredRuntimeRoots.map((root) => collectRuntimeFiles(root)));

  return files.flat().filter((file) => !file.endsWith('routeTree.gen.ts'));
}

function collectMatches(files: readonly string[], pattern: RegExp, contentsByFile: ReadonlyMap<string, string>): readonly string[] {
  const violations: string[] = [];

  for (const file of files) {
    const content = contentsByFile.get(file);

    if (content && pattern.test(content)) {
      violations.push(relative(appRoot, file));
    }
  }

  return violations;
}

function collectRuleViolations(
  files: readonly string[],
  rules: readonly { label: string; pattern: RegExp }[],
  contentsByFile: ReadonlyMap<string, string>,
): readonly string[] {
  const violations: string[] = [];

  for (const rule of rules) {
    for (const file of files) {
      const content = contentsByFile.get(file);

      if (content && rule.pattern.test(content)) {
        violations.push(`${relative(appRoot, file)}: ${rule.label}`);
      }
    }
  }

  return violations.sort();
}

async function readFiles(files: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const entries = await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')] as const));

  return new Map(entries);
}

function getMetaContent(head: ReturnType<typeof createRouteSeoHead>, key: 'name' | 'property', value: string): string | undefined {
  const entry = head.meta.find((meta) => {
    if (key === 'name') {
      return 'name' in meta && meta.name === value;
    }

    return 'property' in meta && meta.property === value;
  });

  if (entry && 'content' in entry) {
    return entry.content;
  }

  return undefined;
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
    const contentsByFile = await readFiles(files);
    const violations = collectMatches(files, oldReferencePattern, contentsByFile);

    assert.deepEqual(violations, []);
  });

  it('keeps authored runtime docs and site files free of legacy framework imports and debug markers', async () => {
    const files = await collectAuthoredRuntimeFiles();
    const contentsByFile = await readFiles(files);
    const violations = collectRuleViolations(files, forbiddenRuntimeRules, contentsByFile);

    assert.deepEqual(violations, []);
  });

  it('keeps docs examples on the app-local useFormedible hook', async () => {
    const compatibilitySource = await readFile(join(appRoot, 'src/docs/compatibility-examples.tsx'), 'utf8');
    const hookImportPattern = /import \{ useFormedible \} from ['"]@\/hooks\/use-formedible['"]/;

    assert.match(compatibilitySource, hookImportPattern);
    assert.match(compatibilitySource, /useFormedible\(/);

    for (const example of Object.values(docsCodeExamples)) {
      if (example.code.includes('useFormedible')) {
        assert.match(example.code, hookImportPattern, `${example.id} must import the app-local hook`);
        assert.match(example.code, /useFormedible[<(]/, `${example.id} must call the app-local hook`);
      }
    }
  });

  it('keeps sitemap entries aligned with every public route', async () => {
    const sitemap = await readFile(join(appRoot, 'public/sitemap.xml'), 'utf8');
    const actualUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
    const expectedUrls = publicRouteMeta.map((route) => `${siteMeta.siteUrl}${route.path === '/' ? '/' : route.path}`).sort();

    assert.deepEqual(actualUrls, expectedUrls);

    for (const route of publicRouteMeta) {
      assert.match(sitemap, new RegExp(`<changefreq>${route.changeFrequency}<\\/changefreq>[\\s\\S]*<priority>${route.priority}<\\/priority>`));
    }
  });

  it('keeps metadata helpers emitting canonical, Open Graph, and Twitter essentials', () => {
    for (const route of publicRouteMeta) {
      const head = createRouteSeoHead(route.path);
      const canonicalUrl = `${siteMeta.siteUrl}${route.path === '/' ? '/' : route.path}`;

      assert.equal(getMetaContent(head, 'name', 'description'), route.description);
      assert.equal(getMetaContent(head, 'property', 'og:type'), 'website');
      assert.equal(getMetaContent(head, 'property', 'og:site_name'), siteMeta.name);
      assert.equal(getMetaContent(head, 'property', 'og:title'), head.meta.find((meta) => 'title' in meta)?.title);
      assert.equal(getMetaContent(head, 'property', 'og:description'), route.description);
      assert.equal(getMetaContent(head, 'property', 'og:url'), canonicalUrl);
      assert.equal(getMetaContent(head, 'property', 'og:image'), `${siteMeta.siteUrl}${siteMeta.ogImagePath}`);
      assert.equal(getMetaContent(head, 'name', 'twitter:card'), 'summary_large_image');
      assert.equal(getMetaContent(head, 'name', 'twitter:site'), siteMeta.twitterSite);
      assert.equal(getMetaContent(head, 'name', 'twitter:title'), head.meta.find((meta) => 'title' in meta)?.title);
      assert.equal(getMetaContent(head, 'name', 'twitter:description'), route.description);
      assert.equal(getMetaContent(head, 'name', 'twitter:image'), `${siteMeta.siteUrl}${siteMeta.ogImagePath}`);
      assert.ok(head.links.some((link) => link.rel === 'canonical' && link.href === canonicalUrl));
    }
  });

  it('does not document removed validation or debug return helpers', async () => {
    const docsFile = await readFile(join(appRoot, 'src/docs/compatibility-examples.tsx'), 'utf8');

    assert.doesNotMatch(docsFile, /validateField|validateForm|debug|Debug/);
  });
});
