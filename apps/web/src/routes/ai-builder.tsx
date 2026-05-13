import { createFileRoute } from '@tanstack/react-router';

import { AIBuilder } from '@/components/formedible/ai/ai-builder';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/ai-builder');

export const Route = createFileRoute('/ai-builder')({
  head: () => routeHead,
  component: AiBuilderRoute,
});

const aiBuilderGuidance = [
  'Describe audience, required fields, validation rules, pages, and success criteria in the prompt.',
  'Inspect generated fields, options, defaults, labels, and page flow before accepting the result.',
  'Copy accepted configuration into source control so production forms remain deterministic without AI availability.',
] as const;

const aiBuilderLimitations = [
  'Direct provider mode needs a user-supplied API key and may contact the selected provider when Generate form is pressed.',
  'Generated forms can be incomplete or wrong; review and type-check the output before using it in product code.',
  'Do not paste secrets, regulated data, or private customer records into prompts or generated examples.',
] as const;

function AiBuilderRoute() {
  return (
    <main className="min-h-0 bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="ai-builder-page-title">
        <header className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-xl shadow-black/10 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">AI-assisted builder</p>
            <h1 id="ai-builder-page-title" className="max-w-4xl text-balance text-4xl font-black tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              Generate draft forms without creating a second form format.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              This route mounts the synced AIBuilder component with provider selection, chat history, generated code extraction, and preview rendering. The output still targets the same Formedible field model documented across the app.
            </p>
          </div>

          <nav aria-label="AI Builder documentation links" className="flex flex-wrap gap-3 lg:justify-end">
            <a className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href="/docs/ai-builder">
              AI Builder docs
            </a>
            <a className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href="/docs/builder">
              Builder docs
            </a>
            <a className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href="/docs/validation">
              Validation
            </a>
          </nav>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="ai-builder-guidance-title" className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <h2 id="ai-builder-guidance-title" className="text-xl font-bold tracking-[-0.03em]">Usage guidance</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              {aiBuilderGuidance.map((item) => (
                <li key={item} className="rounded-2xl bg-background/70 p-4">{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="ai-builder-limitations-title" className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <h2 id="ai-builder-limitations-title" className="text-xl font-bold tracking-[-0.03em]">Limitations to review</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              {aiBuilderLimitations.map((item) => (
                <li key={item} className="rounded-2xl bg-background/70 p-4">{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="ai-builder-workspace-title" className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Interactive workspace</p>
              <h2 id="ai-builder-workspace-title" className="mt-2 text-3xl font-black tracking-[-0.05em]">AIBuilder</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              The panel stacks on mobile and uses internal scroll areas for chat history and previews.
            </p>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/65 p-2 shadow-2xl shadow-black/15 sm:p-3">
            <AIBuilder className="min-h-[720px]" />
          </div>
        </section>
      </section>
    </main>
  );
}
