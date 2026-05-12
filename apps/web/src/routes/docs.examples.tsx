import { createFileRoute } from '@tanstack/react-router';

import { DocsExampleForm, docsCompatibilityExamples } from '@/docs/compatibility-examples';
import { PageHeader } from '@/docs/page-header';

export const Route = createFileRoute('/docs/examples')({
  component: ExamplesRoute,
});

function ExamplesRoute() {
  return (
    <main className="min-h-0 bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader
          eyebrow="Compatibility examples"
          title="Fourteen forms rendered by the current hook."
          description="Each card mounts a real Formedible form from consumer-safe docs configuration. No test-only compatibility data, old reference imports, or package-era runtime paths are used."
        >
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
            <p className="text-5xl font-black tracking-[-0.08em] text-primary">14</p>
            <p className="mt-2 text-sm font-semibold text-foreground">covered examples</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Contact, registration, checkout, arrays, flows, analytics, advanced fields, and more.</p>
          </div>
        </PageHeader>

        <nav aria-label="Example index" className="flex gap-2 overflow-x-auto pb-2">
          {docsCompatibilityExamples.map((example) => (
            <a key={example.id} href={`#${example.id}`} className="shrink-0 rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
              {example.title}
            </a>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-2">
          {docsCompatibilityExamples.map((example, index) => (
            <article key={example.id} id={example.id} className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-xl shadow-black/10">
              <div className="border-b border-border/70 bg-muted/25 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{example.id}</p>
                    <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground">{example.title}</h2>
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
    </main>
  );
}
