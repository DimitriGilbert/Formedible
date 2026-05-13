import { createFileRoute } from '@tanstack/react-router';

import { CodeBlock } from '@/components/docs/code-block';
import { DocsCard } from '@/components/docs/docs-card';
import { PageHeader } from '@/components/docs/page-header';
import { docsCodeExamples } from '@/features/docs/code-examples';
import { docsCards, docsHeroMetrics, docsSections } from '@/features/docs/content';

export const Route = createFileRoute('/docs/')({
  component: DocsIndexRoute,
});

const hubLinks = [
  { title: 'Getting started', description: 'Install shape, first form, and project conventions.', href: '/docs/getting-started' },
  { title: 'Examples', description: 'Fourteen real compatibility examples rendered by the current hook.', href: '/docs/examples' },
  { title: 'Fields', description: 'Supported field types, options, arrays, objects, and custom registry guidance.', href: '/docs/fields' },
  { title: 'Validation', description: 'Schema, inline, async, and cross-field validation patterns.', href: '/docs/validation' },
  { title: 'Advanced features', description: 'Pages, tabs, conditional UI, dynamic options, and navigation.', href: '/docs/advanced-features' },
  { title: 'Analytics', description: 'Memoized callback contracts for field, page, and completion events.', href: '/docs/analytics' },
  { title: 'Persistence', description: 'Draft restoration with localStorage or sessionStorage.', href: '/docs/persistence' },
  { title: 'Dynamic text', description: 'Template interpolation for labels, descriptions, and page copy.', href: '/docs/dynamic-text' },
  { title: 'Builder', description: 'Visual builder usage and generated configuration review.', href: '/docs/builder' },
  { title: 'AI Builder', description: 'Provider selection, generated preview, and safe review workflow.', href: '/docs/ai-builder' },
  { title: 'Parser', description: 'Turn text or structured config into the same field model.', href: '/docs/parser' },
  { title: 'API', description: 'UseFormedibleOptions, field configuration, callbacks, and return value map.', href: '/docs/api' },
] as const;

function DocsIndexRoute() {
  return (
    <main className="min-h-0 overflow-hidden bg-background text-foreground">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader
          eyebrow="Formedible Docs"
          title="A complete IA for source-owned forms."
          description="Start with the current app-local hook, choose a route by job-to-be-done, and move from field config to rendered examples, builders, parser workflows, and API details."
        >
          <dl className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/65 p-4 shadow-xl shadow-black/10 backdrop-blur">
            {docsHeroMetrics.map((metric) => (
              <div key={metric.label} className="grid grid-cols-[4rem_1fr] gap-3 rounded-2xl bg-card/70 p-3">
                <dt className="text-3xl font-black tracking-[-0.08em] text-primary">{metric.value}</dt>
                <dd className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                </dd>
              </div>
            ))}
          </dl>
        </PageHeader>

        <nav aria-label="Documentation routes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubLinks.map((link) => (
            <a key={link.href} href={link.href} className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-xl shadow-black/10 outline-none transition hover:-translate-y-1 hover:border-primary/45 focus-visible:ring-2 focus-visible:ring-ring">
              <h2 className="text-xl font-bold tracking-[-0.04em]">{link.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{link.description}</p>
            </a>
          ))}
        </nav>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {docsCards.map((card, index) => (
            <DocsCard key={card.href} card={card} index={index} />
          ))}
        </div>

        <div className="grid gap-10">
          {docsSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 rounded-[2rem] border border-border/70 bg-card/55 p-5 shadow-xl shadow-black/10 sm:p-7 lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
                <div className="lg:sticky lg:top-32">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">{section.eyebrow}</p>
                  <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.06em] text-foreground sm:text-4xl">{section.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{section.description}</p>
                </div>
                <div className="grid gap-5">
                  {section.codeExampleIds.map((exampleId) => (
                    <CodeBlock key={exampleId} example={docsCodeExamples[exampleId]} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
