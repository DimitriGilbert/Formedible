import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import * as copiedCodeExamples from '@/data/code-examples';
import { RenderedExampleShowcase, type ShowcaseCodeExample } from '@/docs/rendered-example-showcase';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/examples');

type ExampleMetric = {
  readonly label: string;
  readonly value: string;
};

const copiedCodeExampleSources = Object.entries(copiedCodeExamples)
  .map(([key, code]) => ({ key, code }))
  .sort((first, second) => getExampleOrder(first.key) - getExampleOrder(second.key) || first.key.localeCompare(second.key));

export const copiedCodeExampleEntries: readonly ShowcaseCodeExample[] = copiedCodeExampleSources.map(({ key, code }) => {
  const category = getExampleCategory(String(key));

  return {
    key,
    id: toKebabCase(String(key).replace(/Code$/, '')),
    title: toTitle(String(key)),
    category,
    description: describeCopiedExample(String(key), code),
    code,
    metrics: getExampleMetrics(code),
    caveats: getDisplayCaveats(code),
  };
});

const allCategory = 'All examples';
const categories = [allCategory, ...Array.from(new Set(copiedCodeExampleEntries.map((example) => example.category)))];
const totalLineCount = copiedCodeExampleEntries.reduce((total, example) => total + countLines(example.code), 0);
const categorySummaries = categories.map((category) => ({
  category,
  count: category === allCategory ? copiedCodeExampleEntries.length : copiedCodeExampleEntries.filter((example) => example.category === category).length,
}));

export const Route = createFileRoute('/docs/examples')({
  head: () => routeHead,
  component: ExamplesRoute,
});

function ExamplesRoute() {
  const [activeCategory, setActiveCategory] = useState<string>(allCategory);
  const [activeExampleId, setActiveExampleId] = useState<string>(copiedCodeExampleEntries[0]?.id ?? '');
  const visibleExamples = useMemo(
    () => copiedCodeExampleEntries.filter((example) => activeCategory === allCategory || example.category === activeCategory),
    [activeCategory],
  );
  const activeExample = visibleExamples.find((example) => example.id === activeExampleId) ?? visibleExamples[0] ?? copiedCodeExampleEntries[0];

  if (!activeExample) {
    return null;
  }

  const activeExampleIndex = copiedCodeExampleEntries.findIndex((example) => example.id === activeExample.id);

  function selectCategory(category: string) {
    setActiveCategory(category);
    const nextExample = copiedCodeExampleEntries.find((example) => category === allCategory || example.category === category);

    if (nextExample) {
      setActiveExampleId(nextExample.id);
    }
  }

  return (
    <main className="min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_31rem),linear-gradient(180deg,hsl(var(--muted)/0.45),hsl(var(--background))_32rem)] text-foreground" data-examples-browser="focused">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="grid gap-6 border-b border-border/70 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="max-w-4xl space-y-4">
            <a href="/docs" className="inline-flex rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-semibold text-muted-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">Back to docs</a>
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">Interactive examples</p>
              <h1 className="text-balance text-4xl font-black tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">Browse one working example at a time.</h1>
              <p className="max-w-3xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
                Adapted from the previous tabbed examples page: choose from a compact index, then inspect a focused live preview or the copied source from <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-semibold text-foreground">apps/web/src/data/code-examples.ts</code>.
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <MetricCard label="exports" value={String(copiedCodeExampleEntries.length)} />
            <MetricCard label="groups" value={String(categories.length - 1)} />
            <MetricCard label="lines" value={String(totalLineCount)} />
          </dl>
        </header>

        <section className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]" aria-label="Examples browser workspace">
          <aside className="lg:sticky lg:top-6 lg:self-start" aria-labelledby="examples-filter-heading">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-xl shadow-black/5 backdrop-blur">
              <div className="border-b border-border/70 p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Index</p>
                <h2 id="examples-filter-heading" className="mt-2 text-2xl font-black tracking-[-0.05em] text-foreground">Examples</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Filter by category, then open one example in the focused viewer.</p>
              </div>

              <div className="grid gap-3 border-b border-border/70 p-3">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground" htmlFor="example-category-select">Category</label>
                <select
                  id="example-category-select"
                  value={activeCategory}
                  onChange={(event) => selectCategory(event.currentTarget.value)}
                  className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categorySummaries.map(({ category, count }) => (
                    <option key={category} value={category}>{category} ({count})</option>
                  ))}
                </select>
                <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0" role="list" aria-label="Example category filters">
                  {categorySummaries.map(({ category, count }) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => selectCategory(category)}
                      className={`flex shrink-0 items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${
                        activeCategory === category ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'border-transparent bg-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/60 hover:text-foreground'
                      }`}
                      aria-pressed={activeCategory === category}
                    >
                      <span>{category}</span>
                      <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-foreground">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <nav aria-label="Example index" className="max-h-[32rem] overflow-auto p-3">
                <div className="grid gap-2" data-examples-grid="true">
                  {visibleExamples.map((example) => {
                    const absoluteIndex = copiedCodeExampleEntries.findIndex((candidate) => candidate.id === example.id);
                    const isSelected = example.id === activeExample.id;

                    return (
                      <button
                        key={example.id}
                        type="button"
                        onClick={() => setActiveExampleId(example.id)}
                        className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/60 hover:text-foreground'
                        }`}
                        aria-current={isSelected ? 'true' : undefined}
                        data-example-index-item={example.key}
                      >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border/70 bg-background text-[0.68rem] font-black text-primary">{String(absoluteIndex + 1).padStart(2, '0')}</span>
                        <span className="min-w-0">
                          <span className="block truncate">{example.title}</span>
                          <span className="block truncate text-xs font-medium text-muted-foreground">{example.category}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </aside>

          <section className="min-w-0" aria-label="Focused rendered preview and source code" data-active-example-area="true">
            <RenderedExampleShowcase example={activeExample} index={activeExampleIndex} />
          </section>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: ExampleMetric) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <dt className="text-2xl font-black tracking-[-0.05em] text-foreground">{value}</dt>
      <dd className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</dd>
    </div>
  );
}

function describeCopiedExample(key: string, code: string): string {
  const title = toTitle(key).toLowerCase();
  const fieldCount = countPattern(code, /name:\s*["']/g);
  const pageCount = countPattern(code, /page:\s*\d/g);
  const schemaName = code.match(/const\s+([A-Za-z0-9]+Schema)\s*=\s*z\.object/)?.[1];
  const schemaCopy = schemaName ? ` It defines ${schemaName} before configuring the form.` : '';
  const pagingCopy = pageCount > 0 ? ` The copied source includes page assignments for a multi-step layout.` : '';

  return `Copied ${title} example with ${fieldCount} field definition${fieldCount === 1 ? '' : 's'} and ${countLines(code)} lines of source code.${schemaCopy}${pagingCopy}`;
}

function getExampleCategory(key: string): string {
  if (/^contactFormCode$|^profileFormCode$|^surveyFormCode$/.test(key)) {
    return 'Quick starts';
  }

  if (key.startsWith('example')) {
    return 'Basic examples';
  }

  if (/analytics|persistence|array|advanced/i.test(key)) {
    return 'Advanced examples';
  }

  return 'Code-only references';
}

function getExampleOrder(key: string): number {
  const preferredOrder: Readonly<Record<string, number>> = {
    exampleContactFormCode: 0,
    exampleRegistrationFormCode: 1,
    exampleSurveyFormCode: 2,
    exampleCheckoutFormCode: 3,
    exampleJobApplicationFormCode: 4,
    contactFormCode: 5,
    profileFormCode: 6,
    surveyFormCode: 7,
    analyticsTrackingFormCode: 8,
    persistenceFormCode: 9,
    arrayFieldsCode: 10,
    advancedFieldTypesCode: 11,
  };

  return preferredOrder[key] ?? 999;
}

function getExampleMetrics(code: string): readonly ExampleMetric[] {
  return [
    { label: 'lines', value: String(countLines(code)) },
    { label: 'fields', value: String(countPattern(code, /name:\s*["']/g)) },
    { label: 'pages', value: String(new Set([...code.matchAll(/page:\s*(\d)/g)].map((match) => match[1])).size || 1) },
  ];
}

function getDisplayCaveats(code: string): readonly string[] {
  const caveats: string[] = [];

  if (code.includes('toast.') || code.includes('gtag(')) {
    caveats.push('The copied snippet references app integration callbacks; no fake imports are added around the displayed source.');
  }

  return caveats;
}

function countLines(value: string): number {
  return value.split('\n').length;
}

function countPattern(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function toTitle(key: string): string {
  return key
    .replace(/Code$/, '')
    .replace(/^example/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (character) => character.toUpperCase());
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}
