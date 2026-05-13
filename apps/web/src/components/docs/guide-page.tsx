import type { ReactNode } from 'react';

import { docsCodeExamples, type DocsCodeExampleId } from '@/features/docs/code-examples';

import { CodeBlock } from './code-block';
import { PageHeader } from './page-header';

export type DocsGuideLink = {
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

export type DocsGuideSection = {
  readonly title: string;
  readonly body: string;
  readonly bullets: readonly string[];
};

type DocsGuidePageProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly sections: readonly DocsGuideSection[];
  readonly codeExampleIds?: readonly DocsCodeExampleId[];
  readonly related?: readonly DocsGuideLink[];
  readonly aside?: ReactNode;
};

const defaultRelatedLinks = [
  { title: 'Getting started', description: 'Install shape, first form, and project conventions.', href: '/docs/getting-started' },
  { title: 'Examples', description: 'Fourteen real compatibility examples rendered by the current hook.', href: '/docs/examples' },
  { title: 'Fields', description: 'Supported field types, options, arrays, objects, and custom registry guidance.', href: '/docs/fields' },
  { title: 'Validation', description: 'Schema, inline, async, and cross-field validation patterns.', href: '/docs/validation' },
] satisfies readonly DocsGuideLink[];

export function DocsGuidePage({ eyebrow, title, description, sections, codeExampleIds, related, aside }: DocsGuidePageProps) {
  return (
    <main className="min-h-0 bg-background text-foreground">
      <article className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader eyebrow={eyebrow} title={title} description={description}>{aside}</PageHeader>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="grid gap-5">
            {sections.map((section) => (
              <section key={section.title} className="rounded-[1.75rem] border border-border/70 bg-card/65 p-6 shadow-xl shadow-black/10">
                <h2 className="text-2xl font-black tracking-[-0.05em]">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
                <ul className="mt-5 grid gap-2 text-sm text-foreground/85">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <aside className="grid content-start gap-5" aria-label="Code examples and related routes">
            {codeExampleIds?.map((exampleId) => <CodeBlock key={exampleId} example={docsCodeExamples[exampleId]} />)}
            <nav aria-label="Related documentation" className="rounded-[1.75rem] border border-border/70 bg-card/65 p-5 shadow-xl shadow-black/10">
              <h2 className="text-lg font-bold tracking-[-0.04em]">Related routes</h2>
              <div className="mt-4 grid gap-3">
                {(related ?? defaultRelatedLinks).map((link) => (
                  <a key={link.href} href={link.href} className="rounded-2xl border border-border/70 bg-background/70 p-4 outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="font-semibold">{link.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.description}</span>
                  </a>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      </article>
    </main>
  );
}
