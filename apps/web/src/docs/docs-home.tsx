import { DocsExampleForm, docsCompatibilityExamples } from './compatibility-examples';

export function DocsHome() {
  return (
    <main className="min-h-0 overflow-y-auto bg-background text-foreground">
      <section id="docs" className="mx-auto flex w-full max-w-7xl scroll-mt-28 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Formedible Docs</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Real consumer examples from the shadcn install surface.</h1>
          <p className="text-lg text-muted-foreground">
            Each example imports <code className="rounded bg-muted px-1.5 py-0.5">useFormedible</code> from <code className="rounded bg-muted px-1.5 py-0.5">@/hooks/use-formedible</code> and renders the real <code className="rounded bg-muted px-1.5 py-0.5">&lt;Form /&gt;</code> output.
          </p>
        </div>

        <div id="examples" className="grid scroll-mt-28 gap-6 lg:grid-cols-2">
          {docsCompatibilityExamples.map((example) => (
            <article key={example.id} id={example.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-5 space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{example.id}</p>
                <h2 className="text-2xl font-semibold tracking-tight">{example.title}</h2>
                <p className="text-sm text-muted-foreground">{example.summary}</p>
              </div>
              <DocsExampleForm example={example} />
            </article>
          ))}
        </div>

        <section id="builder" className="scroll-mt-28 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">Builder</p>
            <h2 className="text-2xl font-semibold tracking-tight">Form builder integration path</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Use the builder surface to compose Formedible fields, preview generated forms, and copy the resulting configuration into a consumer application without leaving the documented shadcn-compatible component flow.
            </p>
          </div>
        </section>

        <section id="ai-builder" className="scroll-mt-28 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">AI Builder</p>
            <h2 className="text-2xl font-semibold tracking-tight">AI-assisted form generation workflow</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              The AI Builder workflow turns structured prompts into Formedible configurations, then keeps the generated output reviewable through the same field definitions and validation patterns shown in these examples.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
