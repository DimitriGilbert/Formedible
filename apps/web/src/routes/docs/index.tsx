import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { type DocsSectionContent, docsCards, docsHeroMetrics, docsSections } from '@/features/docs/content';

import { CodeBlock } from '@/components/docs/code-block';
import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { SiteFooter } from '@/components/layout/site-footer';
import { docsCodeExamples } from '@/features/docs/code-examples';

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

const hubColClasses = [
  'md:col-span-1', 'md:col-span-2', 'md:col-span-1',
  'md:col-span-1', 'md:col-span-3',
  'md:col-span-2', 'md:col-span-1', 'md:col-span-1',
  'md:col-span-1', 'md:col-span-1', 'md:col-span-2',
  'md:col-span-4',
];

const cardColClasses = [
  'md:col-span-7', 'md:col-span-5',
  'md:col-span-5', 'md:col-span-7',
  'md:col-span-12',
];

function DocsIndexRoute() {
  return (
    <div className="overflow-x-hidden">
      <DocsHero />
      <SectionDivider />
      <DocsHubLinks />
      <SectionDivider />
      <DocsCardGrid />
      <SectionDivider />
      <DocsCodeSections />
      <SiteFooter />
    </div>
  );
}

function DocsHero() {
  return (
    <section className="px-6 pt-20 pb-20 lg:px-12">
      <PageContainer className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold text-primary">Formedible Docs</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            A complete IA for source-owned forms.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Start with the current app-local hook, choose a route by job-to-be-done, and move from field config to rendered examples, builders, parser workflows, and API details.
          </p>
          <div className="mt-6">
            <Link
              to="/docs/getting-started"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Read the docs
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl">
          <div className="grid gap-px bg-border">
            {docsHeroMetrics.map((metric) => (
              <div key={metric.label} className="bg-muted p-6">
                <p className="text-3xl font-bold text-primary">{metric.value}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{metric.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function DocsHubLinks() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <PageContainer>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-primary md:text-3xl">
          Documentation
        </h2>
        <div className="mt-8 overflow-hidden rounded-2xl">
          <nav aria-label="Documentation routes" className="grid gap-px bg-border md:grid-cols-4">
            {hubLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`group bg-background p-6 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${hubColClasses[i]}`}
              >
                <p className="text-sm font-semibold text-foreground group-hover:text-primary">{link.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{link.description}</p>
              </a>
            ))}
          </nav>
        </div>
      </PageContainer>
    </section>
  );
}

function DocsCardGrid() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <PageContainer>
        <p className="text-sm font-semibold text-primary">Core surfaces</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          One field model, every rendering mode
        </h2>
        <div className="mt-8 overflow-hidden rounded-2xl">
          <div className="grid gap-px bg-border md:grid-cols-12">
            {docsCards.map((card, i) => (
              <a
                key={card.href}
                href={card.href}
                className={`group bg-background p-6 md:p-8 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${cardColClasses[i]}`}
              >
                <p className="text-sm font-semibold text-muted-foreground">{card.eyebrow}</p>
                <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                <ul className="mt-4 grid gap-1.5">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function DocsCodeSections() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <PageContainer>
        <div className="grid gap-16">
          {docsSections.map((section) => (
            <CodeSection key={section.id} section={section} />
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

function CodeSection({ section }: { readonly section: DocsSectionContent }) {
  return (
    <div id={section.id} className="scroll-mt-28 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
      <div className="lg:sticky lg:top-32">
        <p className="text-sm font-semibold text-primary">{section.eyebrow}</p>
        <h2 className="mt-3 text-sm font-semibold text-foreground">{section.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.description}</p>
      </div>
      <div className="grid gap-4">
        {section.codeExampleIds.map((exampleId) => (
          <CodeBlock key={exampleId} example={docsCodeExamples[exampleId]} />
        ))}
      </div>
    </div>
  );
}
