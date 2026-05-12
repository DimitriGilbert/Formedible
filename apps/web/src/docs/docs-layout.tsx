import { CodeBlock } from './code-block';
import { docsCodeExamples } from './code-examples';
import { docsCards, docsHeroMetrics, docsSections } from './content';
import { DocsExampleForm, docsCompatibilityExamples } from './compatibility-examples';
import { DocsCard } from './docs-card';
import { PageHeader } from './page-header';

export function DocsLayout() {
  return (
    <main className="min-h-0 overflow-hidden bg-background text-foreground">
      <section id="docs" className="relative mx-auto flex w-full max-w-7xl scroll-mt-28 flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="absolute left-0 top-24 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden="true" />
        <PageHeader
          eyebrow="Formedible Docs"
          title="Forms as source code, not a black box."
          description="This documentation targets the current clean-room TanStack Start implementation: shadcn-compatible components copied into the app, TanStack Form underneath, and builder surfaces that emit the same typed field model."
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

        <nav aria-label="Documentation sections" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {docsCards.map((card, index) => (
            <DocsCard key={card.href} card={card} index={index} />
          ))}
        </nav>

        <div className="grid gap-10">
          {docsSections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 rounded-[2rem] border border-border/70 bg-card/55 p-5 shadow-xl shadow-black/10 sm:p-7 lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
                <div className={index % 2 === 0 ? 'lg:sticky lg:top-32' : 'lg:order-2 lg:sticky lg:top-32'}>
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

        <section id="examples" className="scroll-mt-28 space-y-7">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">Compatibility examples</p>
            <h2 className="text-balance text-4xl font-black tracking-[-0.06em] text-foreground sm:text-5xl">Real forms rendered from the current hook.</h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              These examples deliberately import <code className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">useFormedible</code> from{' '}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">@/hooks/use-formedible</code>, then render the returned <code className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">Form</code> component.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {docsCompatibilityExamples.map((example, index) => (
              <article key={example.id} id={example.id} className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-xl shadow-black/10">
                <div className="border-b border-border/70 bg-muted/25 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{example.id}</p>
                      <h3 className="text-2xl font-bold tracking-[-0.04em] text-foreground">{example.title}</h3>
                    </div>
                    <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{example.summary}</p>
                </div>
                <div className="p-5">
                  <DocsExampleForm example={example} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
