import { createFileRoute } from '@tanstack/react-router';

import { FormBuilder } from '@formedible/ui/components/formedible/builder/form-builder';
import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { SiteFooter } from '@/components/layout/site-footer';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/builder');

export const Route = createFileRoute('/builder')({
  head: () => routeHead,
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
    <div>
      <section className="px-6 py-20 lg:px-12" aria-labelledby="builder-page-title">
        <PageContainer>
          <p className="text-sm font-semibold text-primary">Visual builder</p>
          <h1 id="builder-page-title" className="mt-3 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Compose Formedible fields, preview output, and copy reviewed config.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            This page mounts the synced FormBuilder component inside a docs-friendly workspace. Use it to explore the field model, test layouts, and understand how builder output maps back to source-controlled Formedible options.
          </p>

          <div className="mt-6 flex items-center gap-4">
            <a
              className="text-sm font-medium text-primary underline underline-offset-4 decoration-primary/30"
              href="/docs/builder"
            >
              Builder docs
            </a>
            <a
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
              href="/docs/fields"
            >
              Field model
            </a>
            <a
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
              href="/docs/api"
            >
              API reference
            </a>
          </div>
        </PageContainer>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 lg:px-12">
        <PageContainer>
          <div className="overflow-hidden rounded-2xl">
            <div className="grid gap-px bg-border md:grid-cols-2">
              <div className="bg-background p-6 md:p-8">
                <p className="text-sm font-semibold text-foreground">Usage guidance</p>
                <ul className="mt-4 grid gap-3">
                  {builderGuidance.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background p-6 md:p-8">
                <p className="text-sm font-semibold text-foreground">Limitations to review</p>
                <ul className="mt-4 grid gap-3">
                  {builderLimitations.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 lg:px-12" aria-labelledby="builder-workspace-title">
        <PageContainer>
          <p className="text-sm font-semibold text-foreground">Interactive workspace</p>
          <h2 id="builder-workspace-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            FormBuilder
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            On small screens, scroll within the builder panel to reach wide controls and generated code.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl bg-muted p-3">
            <FormBuilder className="min-w-[58rem] lg:min-w-0" />
          </div>
        </PageContainer>
      </section>

      <SectionDivider />
      <SiteFooter />
    </div>
  );
}
