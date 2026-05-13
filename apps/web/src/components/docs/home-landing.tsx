import { useFormedible } from '@/hooks/use-formedible';

import { CodeBlock } from './code-block';
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
    <main className="overflow-hidden bg-background text-foreground">
      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:px-8 lg:py-18">
        <div className="absolute left-[-10rem] top-20 size-72 rounded-full bg-primary/18 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-10 right-0 size-80 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-center gap-8">
          <div className="space-y-6">
            <p className="w-fit rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary shadow-sm">
              TanStack Form docs rebuilt for production
            </p>
            <h1 className="max-w-4xl text-balance text-5xl font-black tracking-[-0.075em] sm:text-6xl lg:text-7xl">
              Ship complex React forms from one readable configuration.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              Formedible renders shadcn-compatible field components from app-local source, with pages, tabs, validation,
              persistence, analytics, builders, and live examples documented against the current implementation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <code className="overflow-x-auto rounded-2xl border border-border/70 bg-zinc-950 px-5 py-4 text-sm font-semibold text-zinc-100 shadow-2xl shadow-black/25">
              pnpm dlx shadcn@latest add formedible
            </code>
            <a
              href="/docs/getting-started"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 outline-none transition hover:-translate-y-0.5 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Start building
            </a>
          </div>

          <nav aria-label="Landing page calls to action" className="flex flex-wrap gap-3">
            <a className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" href="/docs/examples">
              View examples
            </a>
            <a className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" href="/docs/builder">
              Builder workflow
            </a>
            <a className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring" href="/docs/ai-builder">
              AI builder workflow
            </a>
          </nav>
        </div>

        <aside className="relative rounded-[2rem] border border-border/70 bg-card/70 p-4 shadow-2xl shadow-black/20 backdrop-blur" aria-label="Live Formedible mini example">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <div className="mb-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Live mini example</p>
              <h2 className="text-2xl font-black tracking-[-0.05em]">A real Formedible form</h2>
              <p className="text-sm leading-6 text-muted-foreground">Rendered by the same app-local hook used throughout the docs.</p>
            </div>
            <MiniLeadForm />
          </div>
        </aside>
      </section>

      <section aria-labelledby="feature-grid-title" className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">Core surface</p>
          <h2 id="feature-grid-title" className="text-balance text-4xl font-black tracking-[-0.06em] sm:text-5xl">
            Every route points at working implementation details.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <a key={card.href} href={card.href} className="group min-h-64 rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-xl shadow-black/10 outline-none transition hover:-translate-y-1 hover:border-primary/45 focus-visible:ring-2 focus-visible:ring-ring">
              <h3 className="text-2xl font-bold tracking-[-0.04em] group-hover:text-primary">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {workflowCards.map((card) => (
          <article key={card.href} className="rounded-[2rem] border border-border/70 bg-card/70 p-7 shadow-2xl shadow-black/15">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">{card.eyebrow}</p>
            <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.06em]">{card.title}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.description}</p>
            <a href={card.href} className="mt-6 inline-flex rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              {card.cta}
            </a>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <CodeBlock example={docsCodeExamples['typed-hook-usage']} />
      </section>
    </main>
  );
}
