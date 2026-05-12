import { createFileRoute } from '@tanstack/react-router';

import { FormBuilder } from '@/components/formedible/builder/form-builder';

export const Route = createFileRoute('/builder')({
  component: BuilderRoute,
});

const builderGuidance = [
  'Start by adding a small set of required fields, then use Preview before copying generated configuration.',
  'Treat generated output as draft source: review names, options, defaults, validation, pages, and tabs before shipping.',
  'Keep product-specific persistence outside this shell so the builder remains a focused authoring surface.',
] as const;

const builderLimitations = [
  'The builder does not replace code review or type checks for production form configuration.',
  'Custom field components need to be documented in the local field registry before generated config can rely on them.',
  'Saved state in this route is intentionally lightweight; copy accepted output into application source or your own storage workflow.',
] as const;

function BuilderRoute() {
  return (
    <main className="min-h-0 bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10" aria-labelledby="builder-page-title">
        <header className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/70 p-5 shadow-xl shadow-black/10 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">Visual builder</p>
            <h1 id="builder-page-title" className="max-w-4xl text-balance text-4xl font-black tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              Compose Formedible fields, preview output, and copy reviewed config.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              This page mounts the synced FormBuilder component inside a docs-friendly workspace. Use it to explore the field model, test layouts, and understand how builder output maps back to source-controlled Formedible options.
            </p>
          </div>

          <nav aria-label="Builder documentation links" className="flex flex-wrap gap-3 lg:justify-end">
            <a className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href="/docs/builder">
              Builder docs
            </a>
            <a className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href="/docs/fields">
              Field model
            </a>
            <a className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href="/docs/api">
              API reference
            </a>
          </nav>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="builder-guidance-title" className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <h2 id="builder-guidance-title" className="text-xl font-bold tracking-[-0.03em]">Usage guidance</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              {builderGuidance.map((item) => (
                <li key={item} className="rounded-2xl bg-background/70 p-4">{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="builder-limitations-title" className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <h2 id="builder-limitations-title" className="text-xl font-bold tracking-[-0.03em]">Limitations to review</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              {builderLimitations.map((item) => (
                <li key={item} className="rounded-2xl bg-background/70 p-4">{item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="builder-workspace-title" className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Interactive workspace</p>
              <h2 id="builder-workspace-title" className="mt-2 text-3xl font-black tracking-[-0.05em]">FormBuilder</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              On small screens, scroll within the builder panel to reach wide controls and generated code.
            </p>
          </div>
          <div className="overflow-x-auto rounded-[1.75rem] border border-border/70 bg-background/65 p-2 shadow-2xl shadow-black/15 sm:p-3">
            <FormBuilder className="min-w-[58rem] lg:min-w-0" />
          </div>
        </section>
      </section>
    </main>
  );
}
