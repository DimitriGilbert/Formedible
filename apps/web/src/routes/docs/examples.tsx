import { useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@formedible/ui/components/scroll-area';

import * as copiedCodeExamples from '@/data/code-examples';
import { DemoCard } from '@/components/demo/demo-card';
import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { SiteFooter } from '@/components/layout/site-footer';
import { DocsExampleForm, docsCompatibilityExamples } from '@/features/docs/compatibility-examples';
import { getRenderedExampleMapping, type ShowcaseCodeExample } from '@/components/docs/rendered-example-showcase';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/examples');

type ExampleMetric = {
  readonly label: string;
  readonly value: string;
};

const compatibilityExamplesById = new Map(
  docsCompatibilityExamples.map((example) => [example.id, example] as const),
);

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

const allCategory = 'All';
const categories = [allCategory, ...Array.from(new Set(copiedCodeExampleEntries.map((example) => example.category)))];
const totalLineCount = copiedCodeExampleEntries.reduce((total, example) => total + countLines(example.code), 0);

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

  function selectCategory(category: string) {
    setActiveCategory(category);
    const nextExample = copiedCodeExampleEntries.find((example) => category === allCategory || example.category === category);

    if (nextExample) {
      setActiveExampleId(nextExample.id);
    }
  }

  return (
    <div className="overflow-x-hidden">
      <section className="px-6 py-20 lg:px-12">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <Link
                  to="/docs"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
                >
                  <ArrowLeft size={14} strokeWidth={1.5} />
                  Docs
                </Link>
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
                Examples
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Browse working code and live previews for every form pattern. Each example includes a rendered
                preview using app-local Formedible components and the original source from{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-semibold text-foreground">
                  code-examples.ts
                </code>
                .
              </p>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl">
              <div className="grid grid-cols-3 gap-px bg-border">
                <div className="bg-muted p-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-foreground">{copiedCodeExampleEntries.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Examples</p>
                </div>
                <div className="bg-muted p-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-foreground">{categories.length - 1}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Categories</p>
                </div>
                <div className="bg-muted p-4 text-center">
                  <p className="text-2xl font-bold tracking-tight text-foreground">{totalLineCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Lines</p>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 lg:px-12">
        <PageContainer>
          <div className="mb-8 flex flex-wrap gap-1.5">
            {categories.map((category) => {
              const count = copiedCodeExampleEntries.filter(
                (example) => category === allCategory || example.category === category,
              ).length;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeCategory === category
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {category === allCategory ? `All (${count})` : `${category} (${count})`}
                </button>
              );
            })}
          </div>

          <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="overflow-hidden rounded-2xl">
                <div className="bg-muted">
                  <ScrollArea className="max-h-[72vh]">
                    <div className="p-2">
                      <div className="grid gap-0.5">
                        {visibleExamples.map((example) => {
                          const absoluteIndex = copiedCodeExampleEntries.findIndex((candidate) => candidate.id === example.id);
                          const isSelected = example.id === activeExample.id;

                          return (
                            <button
                              key={example.id}
                              type="button"
                              onClick={() => setActiveExampleId(example.id)}
                              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${
                                isSelected
                                  ? 'bg-foreground text-background'
                                  : 'text-muted-foreground hover:bg-background hover:text-foreground'
                              }`}
                            >
                              <span
                                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                                  isSelected
                                    ? 'bg-background/20 text-background'
                                    : 'bg-background text-primary'
                                }`}
                              >
                                {String(absoluteIndex + 1).padStart(2, '0')}
                              </span>
                              <span className="min-w-0 truncate">{example.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-primary">
                  {activeExample.category}
                </span>
                {activeExample.metrics.map((metric) => (
                  <span key={metric.label} className="text-xs text-muted-foreground">
                    {metric.value} {metric.label}
                  </span>
                ))}
              </div>

              <ExampleDemoCard example={activeExample} />

              {activeExample.caveats.length > 0 && (
                <div className="bg-primary/10 p-5 text-sm leading-relaxed text-foreground">
                  <p className="font-semibold">Display notes</p>
                  <ul className="mt-2 grid gap-1.5">
                    {activeExample.caveats.map((note) => (
                      <li key={note} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </section>

      <SectionDivider />
      <SiteFooter />
    </div>
  );
}

function ExampleDemoCard({ example }: { readonly example: ShowcaseCodeExample }) {
  const mapping = useMemo(() => getRenderedExampleMapping(example), [example]);
  const compatibilityExample = mapping.compatibilityId
    ? compatibilityExamplesById.get(mapping.compatibilityId)
    : undefined;

  const preview = compatibilityExample ? (
    <div className="max-h-[58rem] overflow-auto pr-1">
      <DocsExampleForm example={compatibilityExample} />
    </div>
  ) : (
    <div className="grid min-h-48 place-items-center rounded-xl bg-muted p-8 text-center">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Code-only reference</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {mapping.reason ?? 'No live preview available for this example.'}
        </p>
      </div>
    </div>
  );

  return (
    <DemoCard
      title={example.title}
      description={example.description}
      preview={preview}
      code={example.code}
      codeTitle={String(example.key)}
      codeDescription={`${example.metrics[0]?.value ?? '—'} lines · ${example.metrics[1]?.value ?? '—'} fields`}
    />
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
