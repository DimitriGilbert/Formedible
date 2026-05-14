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

export type DocsGuideSection = {
  readonly title: string;
  readonly body: string;
  readonly bullets: readonly string[];
  readonly table?: {
    readonly headers: readonly string[];
    readonly rows: readonly { readonly cells: readonly string[] }[];
  };
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
          <div className="overflow-hidden rounded-2xl">
            <div className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="grid content-start">
                {sections.map((section) => (
                  <div key={section.title} className="bg-background p-6 md:p-8">
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
                    {section.table ? <ApiPropertyTable rows={createApiPropertyTableRows(section.table)} /> : null}
                  </div>
                ))}
              </div>

              <div className="grid content-start">
                {codeExampleIds?.map((exampleId) => (
                  <div key={exampleId} className="bg-muted p-6 md:p-8">
                    <CodeBlock example={docsCodeExamples[exampleId]} />
                  </div>
                ))}

                <nav aria-label="Related documentation" className="bg-background p-6 md:p-8">
                  <p className="text-sm font-semibold text-foreground">Related routes</p>
                  <div className="mt-4 overflow-hidden rounded-2xl">
                    <div className="grid gap-px bg-border">
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
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
