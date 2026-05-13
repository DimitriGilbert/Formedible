import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { docsCompatibilityExamples } from '../src/features/docs/compatibility-examples';
import { docsCodeExamples } from '../src/features/docs/code-examples';
import { getRenderedExampleMapping, renderedExampleMappings } from '../src/components/docs/rendered-example-showcase';
import { createRouteSeoHead } from '../src/features/docs/seo';
import { publicRouteMeta, siteMeta } from '../src/features/docs/site-meta';
import * as copiedCodeExamples from '../src/data/code-examples';
import { copiedCodeExampleEntries } from '../src/routes/docs/examples';

const appRoot = process.cwd();
const docsSourceRoot = join(appRoot, 'src');
const authoredRuntimeRoots = [
  join(appRoot, 'src/components'),
  join(appRoot, 'src/features/docs'),
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

  it('keeps the examples route as a focused examples browser', async () => {
    const [routeSource, showcaseSource] = await Promise.all([
      readFile(join(appRoot, 'src/routes/docs/examples.tsx'), 'utf8'),
      readFile(join(appRoot, 'src/components/docs/rendered-example-showcase.tsx'), 'utf8'),
    ]);

    assert.match(routeSource, /createFileRoute\('\/docs\/examples'\)/);
    assert.match(routeSource, /from ['"]@\/data\/code-examples['"]/);
    assert.match(routeSource, /data-examples-browser="focused"/);
    assert.match(routeSource, /data-examples-grid="true"/);
    assert.match(routeSource, /data-active-example-area="true"/);
    assert.match(routeSource, /data-example-index-item=\{example\.key\}/);
    assert.match(routeSource, /<RenderedExampleShowcase example=\{activeExample\} index=\{activeExampleIndex\} \/>/);
    assert.match(showcaseSource, /data-code-example-id=\{example\.id\}/);
    assert.match(showcaseSource, /data-code-example-export=\{String\(example\.key\)\}/);
    assert.match(showcaseSource, /data-focused-preview-area="true"/);
    assert.match(showcaseSource, /data-focused-code-area="true"/);
    assert.match(showcaseSource, /data-rendered-preview-for=\{example\.key\}/);
    assert.match(showcaseSource, /<DocsExampleForm example=\{compatibilityExample\} \/>/);
    assert.match(showcaseSource, /<code>\{example\.code\}<\/code>/);
    assert.doesNotMatch(showcaseSource, /examples\.map\(\(example/);
    assert.doesNotMatch(routeSource, /DocsHub|@\/docs\/core-pages/);
    assert.doesNotMatch(`${routeSource}\n${showcaseSource}`, /old_version_for_knowledge_purpose|tests\/compatibility-examples|generated\/formedible|@formedible\/formedible|packages\/formedible/);
  });

  it('keeps docs hub routing separate from docs examples routing', async () => {
    const [docsLayoutSource, docsIndexSource, examplesSource] = await Promise.all([
      readFile(join(appRoot, 'src/routes/docs/route.tsx'), 'utf8'),
      readFile(join(appRoot, 'src/routes/docs/index.tsx'), 'utf8'),
      readFile(join(appRoot, 'src/routes/docs/examples.tsx'), 'utf8'),
    ]);

    assert.match(docsLayoutSource, /createFileRoute\('\/docs'\)/);
    assert.match(docsLayoutSource, /<Outlet \/>/);
    assert.doesNotMatch(docsLayoutSource, /DocsHub/);
    assert.match(docsIndexSource, /createFileRoute\('\/docs\/'\)/);
    assert.match(docsIndexSource, /function DocsIndexRoute/);
    assert.match(examplesSource, /createFileRoute\('\/docs\/examples'\)/);
    assert.match(examplesSource, /copiedCodeExampleEntries/);
    assert.doesNotMatch(examplesSource, /DocsHub/);
  });

  it('renders every copied code example export on the examples route', () => {
    const exportedExamples = Object.keys(copiedCodeExamples).map((exportName) => [exportName, copiedCodeExamples[exportName as keyof typeof copiedCodeExamples]] as const);
    const renderedByExport = new Map(copiedCodeExampleEntries.map((example) => [String(example.key), example]));

    assert.equal(copiedCodeExampleEntries.length, exportedExamples.length);

    for (const [exportName, code] of exportedExamples) {
      const routeExample = renderedByExport.get(exportName);

      assert.ok(routeExample, `${exportName} must be present on the examples route`);
      assert.equal(routeExample.code, code, `${exportName} must render the copied source string`);
      assert.ok(routeExample.title.length > 0, `${exportName} must have a readable title`);
      assert.ok(routeExample.description.length > 0, `${exportName} must have example copy`);
      assert.ok(routeExample.category.length > 0, `${exportName} must have navigation metadata`);
    }
  });

  it('maps copied code examples to rendered previews when feasible', () => {
    const compatibilityIds = new Set(docsCompatibilityExamples.map((example) => example.id));
    const renderedMappings = Object.entries(renderedExampleMappings).filter(([, mapping]) => mapping.status === 'rendered');

    assert.ok(renderedMappings.length >= 10, 'most copied examples should have live rendered previews');

    for (const [exportName, mapping] of Object.entries(renderedExampleMappings)) {
      assert.ok(exportName in copiedCodeExamples, `${exportName} must be backed by the copied code source of truth`);

      if (mapping.status === 'rendered') {
        assert.ok(mapping.compatibilityId, `${exportName} must name the current rendered docs example`);
        assert.ok(compatibilityIds.has(mapping.compatibilityId), `${exportName} must map to an existing docs runtime example`);
      } else {
        assert.ok(mapping.reason && mapping.reason.length > 40, `${exportName} code-only mapping must explain why`);
      }
    }

    for (const entry of copiedCodeExampleEntries) {
      const mapping = getRenderedExampleMapping(entry);

      assert.match(mapping.status, /rendered|code-only/);
      if (mapping.status === 'rendered') {
        assert.ok(mapping.compatibilityId && compatibilityIds.has(mapping.compatibilityId), `${entry.key} rendered preview must resolve`);
      } else {
        assert.ok(mapping.reason && mapping.reason.length > 40, `${entry.key} code-only entry must explain why`);
      }
    }
  });

  it('keeps all required example definitions substantial and consumer-safe', () => {
    for (const expectedId of requiredExampleIds) {
      const example = docsCompatibilityExamples.find((candidate) => candidate.id === expectedId);

      assert.ok(example, `${expectedId} must be documented`);
      assert.ok(example.summary.length >= 40, `${expectedId} must include useful copy`);
      assert.ok(example.options.fields.length >= 1, `${expectedId} must render at least one field`);
    }
  });

  it('keeps runtime docs imports on consumer-safe paths', async () => {
    const docsFile = await readFile(join(appRoot, 'src/features/docs/compatibility-examples.tsx'), 'utf8');

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
    const compatibilitySource = await readFile(join(appRoot, 'src/features/docs/compatibility-examples.tsx'), 'utf8');
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
    const docsFile = await readFile(join(appRoot, 'src/features/docs/compatibility-examples.tsx'), 'utf8');

    assert.doesNotMatch(docsFile, /validateField|validateForm|debug|Debug/);
  });
});
