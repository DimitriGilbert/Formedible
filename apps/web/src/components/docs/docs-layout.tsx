import { CodeBlock } from './code-block';
import { DocsExampleForm, docsCompatibilityExamples } from '@/features/docs/compatibility-examples';
import { docsCodeExamples } from '@/features/docs/code-examples';
import { docsCards, docsHeroMetrics, docsSections } from '@/features/docs/content';
import { DocsCard } from './docs-card';
import { PageHeader } from './page-header';
import { SectionDivider } from '@/components/layout/section-divider';

export function DocsLayout() {
  return (
    <main className="overflow-x-hidden">
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto w-full max-w-[1400px]">
          <PageHeader
            eyebrow="Formedible Docs"
            title="Forms as source code, not a black box."
            description="This documentation targets the current clean-room TanStack Start implementation: shadcn-compatible components copied into the app, TanStack Form underneath, and builder surfaces that emit the same typed field model."
          >
            <div className="overflow-hidden rounded-2xl">
              <div className="grid gap-px bg-border">
                {docsHeroMetrics.map((metric) => (
                  <div key={metric.label} className="bg-muted p-6">
                    <dt className="text-3xl font-bold text-primary">{metric.value}</dt>
                    <dd>
                      <p className="mt-2 text-sm font-semibold text-foreground">{metric.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{metric.detail}</p>
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          </PageHeader>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="overflow-hidden rounded-2xl">
            <nav aria-label="Documentation sections" className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-5">
              {docsCards.map((card, index) => (
                <DocsCard key={card.href} card={card} index={index} />
              ))}
            </nav>
          </div>
        </div>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="grid gap-16">
            {docsSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
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
              </section>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      <section id="examples" className="scroll-mt-28 px-6 py-20 lg:px-12">
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="grid gap-6">
            <div>
              <p className="text-sm font-semibold text-primary">Compatibility examples</p>
              <h2 className="mt-3 text-sm font-semibold text-foreground">Real forms rendered from the current hook.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                These examples deliberately import <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">useFormedible</code> from{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">@/hooks/use-formedible</code>, then render the returned <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">Form</code> component.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl">
              <div className="grid gap-px bg-border lg:grid-cols-2">
                {docsCompatibilityExamples.map((example) => (
                  <article key={example.id} id={example.id} className="bg-background">
                    <div className="border-b border-border bg-muted p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">{example.id}</p>
                          <h3 className="mt-1 text-sm font-semibold text-foreground">{example.title}</h3>
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{example.summary}</p>
                    </div>
                    <div className="p-6">
                      <DocsExampleForm example={example} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
