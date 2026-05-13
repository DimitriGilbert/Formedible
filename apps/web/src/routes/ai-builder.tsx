import { createFileRoute } from '@tanstack/react-router';

import { AIBuilder } from '@/components/formedible/ai/ai-builder';
import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { SiteFooter } from '@/components/layout/site-footer';
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
    <div>
      <section className="px-6 py-20 lg:px-12" aria-labelledby="ai-builder-page-title">
        <PageContainer>
          <p className="text-sm font-semibold text-primary">AI-assisted builder</p>
          <h1 id="ai-builder-page-title" className="mt-3 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Generate draft forms without creating a second form format.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            This route mounts the synced AIBuilder component with provider selection, chat history, generated code extraction, and preview rendering. The output still targets the same Formedible field model documented across the app.
          </p>

          <div className="mt-6 flex items-center gap-4">
            <a
              className="text-sm font-medium text-primary underline underline-offset-4 decoration-primary/30"
              href="/docs/ai-builder"
            >
              AI Builder docs
            </a>
            <a
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
              href="/docs/builder"
            >
              Builder docs
            </a>
            <a
              className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
              href="/docs/validation"
            >
              Validation
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
                  {aiBuilderGuidance.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background p-6 md:p-8">
                <p className="text-sm font-semibold text-foreground">Limitations to review</p>
                <ul className="mt-4 grid gap-3">
                  {aiBuilderLimitations.map((item) => (
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

      <section className="px-6 py-20 lg:px-12" aria-labelledby="ai-builder-workspace-title">
        <PageContainer>
          <p className="text-sm font-semibold text-foreground">Interactive workspace</p>
          <h2 id="ai-builder-workspace-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            AIBuilder
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The panel stacks on mobile and uses internal scroll areas for chat history and previews.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl bg-muted p-3">
            <AIBuilder className="min-h-[720px]" />
          </div>
        </PageContainer>
      </section>

      <SectionDivider />
      <SiteFooter />
    </div>
  );
}
