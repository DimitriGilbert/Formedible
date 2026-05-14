import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

import { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';

import { CodeBlock } from './code-block';

import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { InstallCommand } from '@/components/layout/install-command';
import { SiteFooter } from '@/components/layout/site-footer';
import { docsCodeExamples } from '@/features/docs/code-examples';

type MiniLeadValues = {
  readonly email: string;
  readonly useCase: string;
  readonly wantsBuilder: boolean;
};

const miniLeadSubmissionKey = 'formedible-docs-mini-lead-preview';

function persistMiniLeadPreview(values: MiniLeadValues) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(miniLeadSubmissionKey, JSON.stringify(values));
  }
}

const featureCards = [
  {
    title: 'Typed field model',
    description: 'Describe fields once, then reuse the same configuration in hand-written forms, the builder, AI generation, and parser output.',
    href: '/docs/fields',
  },
  {
    title: 'Multi-step flows',
    description: 'Pages, tabs, conditional routes, dynamic copy, progress, and navigation labels are first-class options.',
    href: '/docs/advanced-features',
  },
  {
    title: 'Validation close to state',
    description: 'Use TanStack Form options, Zod schemas, inline checks, async checks, and cross-field rules without hiding the contract.',
    href: '/docs/validation',
  },
  {
    title: 'Real rendered examples',
    description: 'The docs examples mount the current consumer hook and copied components instead of stale compatibility fixtures.',
    href: '/docs/examples',
  },
] as const;

const workflowCards = [
  {
    eyebrow: 'Visual builder',
    title: 'Compose, preview, copy.',
    description: 'Use the builder as an app-local workbench for designing fields and reviewing generated configuration.',
    href: '/docs/builder',
    cta: 'Open builder docs',
  },
  {
    eyebrow: 'AI builder',
    title: 'Generate forms without inventing a second format.',
    description: 'Prompted output lands on the same public field model, ready for review and revision.',
    href: '/docs/ai-builder',
    cta: 'Open AI builder docs',
  },
] as const;

const featureColClasses = ['md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];

function MiniLeadForm() {
  const { Form } = useFormedible<MiniLeadValues>({
    fields: [
      { name: 'email', type: 'email', label: 'Work email', required: true },
      {
        name: 'useCase',
        type: 'select',
        label: 'Primary use case',
        options: ['product onboarding', 'internal tools', 'lead capture', 'research survey'],
        required: true,
      },
      { name: 'wantsBuilder', type: 'switch', label: 'I want a visual builder too' },
    ],
    formOptions: {
      defaultValues: { email: '', useCase: 'product onboarding', wantsBuilder: true },
      onSubmit: ({ value }) => persistMiniLeadPreview(value),
    },
    submitLabel: 'Preview submission',
  });

  return <Form aria-label="Mini Formedible example" />;
}

export function HomeLanding() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <SectionDivider />
      <FeatureSection />
      <SectionDivider />
      <WorkflowSection />
      <SectionDivider />
      <CodePreviewSection />
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="px-6 pt-20 pb-20 lg:px-12">
      <PageContainer className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold text-primary">
            TanStack Form docs rebuilt for production
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Ship complex React forms from one readable configuration.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Formedible renders shadcn-compatible field components from app-local source, with pages, tabs, validation,
            persistence, analytics, builders, and live examples documented against the current implementation.
          </p>

          <div className="mt-8">
            <InstallCommand />
          </div>

          <div className="mt-4 flex items-center gap-6">
            <Link
              to="/docs/getting-started"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Start building
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="/docs/examples"
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
            >
              View examples
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl">
          <div className="bg-muted p-6 md:p-8">
            <div className="mb-5 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Live mini example</p>
              <p className="text-sm font-semibold text-foreground">A real Formedible form</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Rendered by the same app-local hook used throughout the docs.
              </p>
            </div>
            <MiniLeadForm />
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function FeatureSection() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <PageContainer>
        <p className="text-sm font-semibold text-primary">Core surface</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Every route points at working implementation details.
        </h2>
        <div className="mt-8 overflow-hidden rounded-2xl">
          <div className="grid gap-px bg-border md:grid-cols-12">
            {featureCards.map((card, i) => (
              <a
                key={card.href}
                href={card.href}
                className={`group bg-background p-6 md:p-8 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${featureColClasses[i]}`}
              >
                <p className="text-sm font-semibold text-foreground group-hover:text-primary">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
              </a>
            ))}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <PageContainer>
        <div className="overflow-hidden rounded-2xl">
          <div className="grid gap-px bg-border md:grid-cols-12">
            <article className="bg-background p-6 md:col-span-7 md:p-8">
              <p className="text-sm font-semibold text-primary">{workflowCards[0].eyebrow}</p>
              <p className="mt-3 text-sm font-semibold text-foreground">{workflowCards[0].title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflowCards[0].description}</p>
              <div className="mt-4">
                <a
                  href={workflowCards[0].href}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  {workflowCards[0].cta}
                  <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </article>
            <article className="bg-background p-6 md:col-span-5 md:p-8">
              <p className="text-sm font-semibold text-primary">{workflowCards[1].eyebrow}</p>
              <p className="mt-3 text-sm font-semibold text-foreground">{workflowCards[1].title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflowCards[1].description}</p>
              <div className="mt-4">
                <a
                  href={workflowCards[1].href}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  {workflowCards[1].cta}
                  <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </article>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

function CodePreviewSection() {
  return (
    <section className="px-6 py-20 lg:px-12">
      <PageContainer>
        <CodeBlock example={docsCodeExamples['typed-hook-usage']} />
      </PageContainer>
    </section>
  );
}
