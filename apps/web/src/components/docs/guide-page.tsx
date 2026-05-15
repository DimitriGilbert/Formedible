import type { ReactNode } from 'react';

import { docsCodeExamples, type DocsCodeExampleId } from '@/features/docs/code-examples';
import { PageContainer } from '@/components/layout/page-container';
import { SectionDivider } from '@/components/layout/section-divider';
import { SiteFooter } from '@/components/layout/site-footer';

import { CodeBlock } from './code-block';
import { ApiPropertyTable, type ApiPropertyTableRow } from './api-property-table';

export type DocsGuideLink = {
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

export type DocsGuideSnippet = {
  readonly title?: string;
  readonly language: 'tsx' | 'ts' | 'bash';
  readonly code: string;
};

export type DocsGuideSection = {
  readonly title: string;
  readonly body: string;
  readonly bullets: readonly string[];
  readonly table?: {
    readonly headers: readonly string[];
    readonly rows: readonly { readonly cells: readonly string[] }[];
  };
  readonly snippet?: DocsGuideSnippet;
  readonly references?: readonly DocsGuideLink[];
};

function createApiPropertyTableRows(table: NonNullable<DocsGuideSection['table']>): readonly ApiPropertyTableRow[] {
  const propertyIndex = table.headers.findIndex((header) => header.toLowerCase() === 'property');
  const typeIndex = table.headers.findIndex((header) => header.toLowerCase() === 'type');
  const defaultIndex = table.headers.findIndex((header) => header.toLowerCase() === 'default');
  const descriptionIndex = table.headers.findIndex((header) => header.toLowerCase() === 'description');

  return table.rows.map((row) => ({
    name: row.cells[propertyIndex] ?? '',
    type: row.cells[typeIndex] ?? '',
    defaultValue: row.cells[defaultIndex],
    description: row.cells[descriptionIndex] ?? '',
  }));
}

function isApiPropertyTable(table: NonNullable<DocsGuideSection['table']>): boolean {
  const normalizedHeaders = table.headers.map((header) => header.toLowerCase());

  return ['property', 'type', 'default', 'description'].every((header) => normalizedHeaders.includes(header));
}

function DocsGuideTable({ table }: { readonly table: NonNullable<DocsGuideSection['table']> }) {
  if (isApiPropertyTable(table)) {
    return <ApiPropertyTable rows={createApiPropertyTableRows(table)} />;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-border">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="bg-background">
              {table.headers.map((header) => (
                <th key={header} scope="col" className="px-4 py-3 font-semibold text-foreground">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.cells.join('|')} className="bg-background align-top">
                {table.headers.map((header, index) => (
                  <td key={`${header}-${index}`} className="border-t border-border px-4 py-3 leading-relaxed text-muted-foreground">
                    {index === 0 ? <span className="font-medium text-foreground">{row.cells[index] ?? '—'}</span> : (row.cells[index] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocsGuideSnippetBlock({ snippet }: { readonly snippet: DocsGuideSnippet }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-background p-4">
      <figcaption className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-foreground">{snippet.title ?? 'Code evidence'}</p>
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {snippet.language}
        </span>
      </figcaption>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-muted p-5 text-sm leading-6 text-foreground [tab-size:2]">
        <code className="break-words">{snippet.code}</code>
      </pre>
    </figure>
  );
}

function DocsGuideReferences({ references }: { readonly references: readonly DocsGuideLink[] }) {
  return (
    <nav aria-label="Section evidence references" className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Evidence references</p>
      <div className="mt-3 grid gap-2">
        {references.map((reference) => (
          <a
            key={reference.href}
            href={reference.href}
            className="group rounded-xl bg-muted p-3 outline-none transition hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-primary">{reference.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reference.description}</p>
          </a>
        ))}
      </div>
    </nav>
  );
}

function DocsGuideEvidence({ section }: { readonly section: DocsGuideSection }) {
  const hasReferences = section.references && section.references.length > 0;

  if (!section.snippet && !hasReferences) {
    return null;
  }

  return (
    <aside className="grid content-start gap-5 bg-muted p-6 md:p-8" aria-label={`${section.title} evidence`}>
      {section.snippet ? <DocsGuideSnippetBlock snippet={section.snippet} /> : null}
      {hasReferences ? <DocsGuideReferences references={section.references} /> : null}
    </aside>
  );
}

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
    <div className="overflow-x-hidden">
      <section className="px-6 py-20 lg:px-12">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-primary">{eyebrow}</p>
              <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">{title}</h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p>
            </div>
            {aside ? <div className="min-w-0">{aside}</div> : null}
          </div>
        </PageContainer>
      </section>

      <SectionDivider />

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto w-full">
          <div className="grid gap-10">
            <div className="overflow-hidden rounded-2xl">
              <div className="grid gap-px bg-border">
                {sections.map((section) => {
                  const evidence = <DocsGuideEvidence section={section} />;

                  return (
                    <section key={section.title} className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="bg-background p-6 md:p-8">
                    <p className="text-sm font-semibold text-foreground">{section.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                    {section.bullets.length > 0 ? (
                      <ul className="mt-4 grid gap-1.5">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {section.table ? <DocsGuideTable table={section.table} /> : null}
                      </div>
                      {evidence ?? <div className="hidden bg-muted lg:block" />}
                    </section>
                  );
                })}
              </div>
            </div>

            {codeExampleIds && codeExampleIds.length > 0 ? (
              <div className="overflow-hidden rounded-2xl">
                <div className="grid gap-px bg-border lg:grid-cols-2">
                  {codeExampleIds.map((exampleId) => (
                    <div key={exampleId} className="bg-muted p-6 md:p-8">
                      <CodeBlock example={docsCodeExamples[exampleId]} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <nav aria-label="Related documentation" className="bg-background p-6 md:p-8">
              <p className="text-sm font-semibold text-foreground">Related routes</p>
              <div className="mt-4 overflow-hidden rounded-2xl">
                <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
                  {(related ?? defaultRelatedLinks).map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="group bg-muted p-4 outline-none transition hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">{link.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{link.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
