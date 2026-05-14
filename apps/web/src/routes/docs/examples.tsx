import { useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@formedible/ui/components/scroll-area';

import { DemoCard } from '@/components/demo/demo-card';
import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { SiteFooter } from '@/components/layout/site-footer';
import { migratedDocsExamples, type MigratedDocsExample } from '@/components/docs/examples';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/examples');
const allCategory = 'All';
const categories = [allCategory, ...Array.from(new Set(migratedDocsExamples.map((example) => example.category)))];
const totalLineCount = migratedDocsExamples.reduce((total, example) => total + countLines(example.code), 0);

export const Route = createFileRoute('/docs/examples')({
  head: () => routeHead,
  component: ExamplesRoute,
});

function ExamplesRoute() {
  const [activeCategory, setActiveCategory] = useState<string>(allCategory);
  const [activeExampleId, setActiveExampleId] = useState<string>(migratedDocsExamples[0]?.id ?? '');

  const visibleExamples = useMemo(
    () => migratedDocsExamples.filter((example) => activeCategory === allCategory || example.category === activeCategory),
    [activeCategory],
  );

  const activeExample = visibleExamples.find((example) => example.id === activeExampleId) ?? visibleExamples[0] ?? migratedDocsExamples[0];

  if (!activeExample) {
    return null;
  }

  function selectCategory(category: string) {
    setActiveCategory(category);
    const nextExample = migratedDocsExamples.find((example) => category === allCategory || example.category === category);

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
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                Docs
              </Link>

              <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
                Interactive Examples
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Real examples migrated from the previous docs implementation. These are live Formedible components,
                including custom slider visualizations, dynamic text, conditional pages, persistence, analytics, and
                nested array/object fields.
              </p>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl">
              <div className="grid grid-cols-3 gap-px bg-border">
                <Metric value={String(migratedDocsExamples.length)} label="Examples" />
                <Metric value={String(categories.length - 1)} label="Categories" />
                <Metric value={String(totalLineCount)} label="Lines" />
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
              const count = migratedDocsExamples.filter(
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
              <div className="overflow-hidden rounded-2xl bg-muted">
                <ScrollArea className="max-h-[72vh]">
                  <div className="p-2">
                    <div className="grid gap-0.5">
                      {visibleExamples.map((example) => {
                        const absoluteIndex = migratedDocsExamples.findIndex((candidate) => candidate.id === example.id);
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
                                isSelected ? 'bg-background/20 text-background' : 'bg-background text-primary'
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
            </aside>

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-primary">
                  {activeExample.category}
                </span>
                <span className="text-xs text-muted-foreground">{countLines(activeExample.code)} lines</span>
                <span className="text-xs text-muted-foreground">{countPattern(activeExample.code, /name:\s*[\"']/g)} fields</span>
                <span className="text-xs text-muted-foreground">{countPages(activeExample.code)} pages</span>
              </div>

              <MigratedExampleDemoCard example={activeExample} />
            </div>
          </div>
        </PageContainer>
      </section>

      <SectionDivider />
      <SiteFooter />
    </div>
  );
}

function MigratedExampleDemoCard({ example }: { readonly example: MigratedDocsExample }) {
  const ExampleComponent = example.Component;

  return (
    <DemoCard
      title={example.title}
      description={example.description}
      preview={(
        <div className="max-h-[58rem] overflow-auto pr-1">
          <ExampleComponent />
        </div>
      )}
      code={example.code}
      codeTitle={example.codeTitle}
      codeDescription={example.codeDescription}
    />
  );
}

function Metric({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <div className="bg-muted p-4 text-center">
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function countLines(value: string): number {
  return value.split('\n').length;
}

function countPattern(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function countPages(value: string): number {
  return new Set([...value.matchAll(/page:\s*(\d+)/g)].map((match) => match[1])).size || 1;
}
