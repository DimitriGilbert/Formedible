import { createFileRoute } from '@tanstack/react-router';

import { DocsExampleForm, docsCompatibilityExamples, type DocsCompatibilityExample } from '@/docs/compatibility-examples';
import { PageHeader } from '@/docs/page-header';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/examples');

export const Route = createFileRoute('/docs/examples')({
  head: () => routeHead,
  component: ExamplesRoute,
});

function ExamplesRoute() {
  return (
    <main className="min-h-0 bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader
          eyebrow="Examples"
          title="Fourteen production-shaped Formedible patterns."
          description="Browse real rendered forms, implementation notes, and consumer-safe snippets adapted from the historical examples into the current TanStack Start docs architecture."
        >
          <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 shadow-xl shadow-black/5">
            <p className="text-5xl font-black tracking-[-0.08em] text-primary">14</p>
            <p className="mt-2 text-sm font-semibold text-foreground">covered examples</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Contact, registration, checkout, arrays, flows, analytics, advanced fields, and more.</p>
          </div>
        </PageHeader>

        <section className="grid gap-4 rounded-[2rem] border border-border/70 bg-card/80 p-4 shadow-2xl shadow-black/10 backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:p-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">How to use this page</p>
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground">Every preview below is mounted from the app-local hook.</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              The examples intentionally use current shadcn consumer paths such as <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">@/hooks/use-formedible</code>. Snippets mirror the rendered configuration without importing old reference files or test compatibility fixtures at runtime.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <dt className="text-2xl font-black tracking-tight text-foreground">{docsCompatibilityExamples.length}</dt>
              <dd className="mt-1 text-xs font-semibold text-muted-foreground">forms</dd>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <dt className="text-2xl font-black tracking-tight text-foreground">{docsCompatibilityExamples.reduce((count, example) => count + example.options.fields.length, 0)}</dt>
              <dd className="mt-1 text-xs font-semibold text-muted-foreground">fields</dd>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <dt className="text-2xl font-black tracking-tight text-foreground">0</dt>
              <dd className="mt-1 text-xs font-semibold text-muted-foreground">legacy imports</dd>
            </div>
          </dl>
        </section>

        <nav aria-label="Example index" className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
          {docsCompatibilityExamples.map((example) => (
            <a key={example.id} href={`#${example.id}`} className="shrink-0 rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground outline-none transition hover:border-primary/45 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
              {example.title}
            </a>
          ))}
        </nav>

        <div className="grid gap-8">
          {docsCompatibilityExamples.map((example, index) => (
            <article key={example.id} id={example.id} data-example-id={example.id} className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-2xl shadow-black/10">
              <div className="grid gap-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)]">
                <div className="flex flex-col border-b border-border/70 bg-muted/20 xl:border-b-0 xl:border-r">
                  <div className="space-y-4 border-b border-border/70 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{example.id}</p>
                        <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-3xl">{example.title}</h2>
                      </div>
                      <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{example.summary}</p>
                  </div>
                  <ExampleNotes example={example} />
                  <ExampleCode example={example} />
                </div>
                <div className="bg-background/70 p-4 sm:p-6">
                  <div className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-inner shadow-black/5 sm:p-5">
                    <DocsExampleForm example={example} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ExampleNotes({ example }: { readonly example: DocsCompatibilityExample }) {
  const details = getExampleDetails(example);

  return (
    <div className="grid gap-4 border-b border-border/70 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {details.metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-border/70 bg-background/70 p-3">
            <p className="text-xl font-black tracking-tight text-foreground">{metric.value}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {details.notes.map((note) => (
          <li key={note} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExampleCode({ example }: { readonly example: DocsCompatibilityExample }) {
  return (
    <figure className="min-h-0 bg-zinc-950">
      <figcaption className="border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Current consumer snippet</figcaption>
      <pre className="max-h-[30rem] overflow-auto p-5 text-[0.78rem] leading-6 text-zinc-100 [tab-size:2]">
        <code>{createExampleSnippet(example)}</code>
      </pre>
    </figure>
  );
}

function getExampleDetails(example: DocsCompatibilityExample) {
  const pageCount = example.options.pages?.length ?? 1;
  const tabCount = example.options.tabs?.length ?? 0;
  const conditionalCount = example.options.fields.filter((field) => Boolean(field.conditional)).length;
  const arrayCount = example.options.fields.filter((field) => field.type === 'array').length;
  const dynamicOptionsCount = example.options.fields.filter((field) => typeof field.options === 'function').length;
  const notes = [
    `${example.options.fields.length} public field${example.options.fields.length === 1 ? '' : 's'} rendered from the current docs configuration.`,
    pageCount > 1 ? `${pageCount} pages demonstrate progress, navigation, and dynamic page copy.` : 'Single-page layout keeps the interaction compact for embedding.',
    tabCount > 0 ? `${tabCount} tabs group related fields without leaving the form context.` : 'Uses the default Formedible layout so field behavior stays easy to inspect.',
    conditionalCount > 0 ? `${conditionalCount} conditional field${conditionalCount === 1 ? '' : 's'} respond to current form values.` : 'Validation and submit handling are wired through the real hook output.',
    arrayCount > 0 ? `${arrayCount} array field${arrayCount === 1 ? '' : 's'} cover repeatable scalar or object inputs.` : 'Submission writes to session storage in the docs runtime for easy local inspection.',
    dynamicOptionsCount > 0 ? `${dynamicOptionsCount} field${dynamicOptionsCount === 1 ? '' : 's'} compute options from current answers.` : 'Snippet imports only the app-local Formedible consumer hook.',
  ];

  return {
    metrics: [
      { label: 'fields', value: String(example.options.fields.length) },
      { label: pageCount > 1 ? 'pages' : tabCount > 0 ? 'tabs' : 'layout', value: pageCount > 1 ? String(pageCount) : tabCount > 0 ? String(tabCount) : '1' },
      { label: 'conditional', value: String(conditionalCount) },
    ],
    notes,
  };
}

function createExampleSnippet(example: DocsCompatibilityExample): string {
  const componentName = `${toPascalCase(example.id)}Example`;
  const conditionSources = example.options.fields.flatMap((field) => (field.conditional ? [field.conditional.toString()] : []));
  const helperSections = [
    conditionSources.some((source) => source.includes('isTruthyValue'))
      ? `
function isTruthyValue(values: ${componentName}Values, fieldName: string): boolean {
  return Boolean(values[fieldName]);
}
`
      : '',
    conditionSources.some((source) => source.includes('matchesValue'))
      ? `

function matchesValue(values: ${componentName}Values, fieldName: string, expectedValue: unknown): boolean {
  return values[fieldName] === expectedValue;
}
`
      : '',
    conditionSources.some((source) => source.includes('hasValue'))
      ? `

function hasValue(values: ${componentName}Values, fieldName: string): boolean {
  const value = values[fieldName];

  return value !== undefined && value !== null && value !== '';
}
`
      : '',
  ];
  const helperBlock = helperSections.filter((section) => section.length > 0).join('');
  const fieldLines = example.options.fields.map((field) => {
    const fieldName = field.name ?? 'field';
    const fieldLabel = typeof field.label === 'string' ? field.label : fieldName;
    const parts = [`name: ${quoteCodeString(fieldName)}`, `type: ${quoteCodeString(String(field.type))}`, `label: ${quoteCodeString(fieldLabel)}`];

    if ('page' in field && typeof field.page === 'number') {
      parts.push(`page: ${field.page}`);
    }

    if ('tab' in field && typeof field.tab === 'string') {
      parts.push(`tab: ${quoteCodeString(field.tab)}`);
    }

    if (field.required) {
      parts.push('required: true');
    }

    if (field.conditional) {
      parts.push(`conditional: ${field.conditional.toString()}`);
    }

    if (typeof field.options === 'function') {
      parts.push(`options: ${field.options.toString()}`);
    } else if (Array.isArray(field.options)) {
      parts.push(`options: ${formatOptions(field.options)}`);
    }

    if (field.type === 'array') {
      parts.push(`arrayConfig: ${formatValue(field.arrayConfig)}`);
    }

    return `      { ${parts.join(', ')} },`;
  });
  const pageLines = example.options.pages?.map((page) => `      { page: ${page.page}, title: ${quoteCodeString(typeof page.title === 'string' ? page.title : `Page ${page.page}`)} },`) ?? [];
  const tabLines = example.options.tabs?.map((tab) => {
    if (typeof tab === 'string') {
      return `      { id: ${quoteCodeString(tab)}, label: ${quoteCodeString(tab)} },`;
    }

    return `      { id: ${quoteCodeString(tab.id)}, label: ${quoteCodeString(typeof tab.label === 'string' ? tab.label : tab.id)} },`;
  }) ?? [];
  const optionalBlocks = [
    pageLines.length > 0 ? `    pages: [\n${pageLines.join('\n')}\n    ],` : '',
    tabLines.length > 0 ? `    tabs: [\n${tabLines.join('\n')}\n    ],` : '',
    example.options.progress ? '    progress: { showSteps: true, showPercentage: true },' : '',
    example.options.persistence ? `    persistence: { key: ${quoteCodeString(example.options.persistence.key ?? example.id)}, storage: ${quoteCodeString(example.options.persistence.storage ?? 'localStorage')}, restoreOnMount: true },` : '',
    example.options.analytics ? '    analytics: analyticsHandlers,' : '',
  ].filter((block) => block.length > 0);
  const analyticsBlock = example.options.analytics
    ? `
const analyticsHandlers = {
  onFormStart: (timestamp: number) => window.sessionStorage.setItem(${quoteCodeString(`${example.id}-started-at`)}, String(timestamp)),
  onFieldFocus: (fieldName: string, timestamp: number) => window.sessionStorage.setItem(${quoteCodeString(`${example.id}-focused-field`)}, fieldName + ':' + String(timestamp)),
};
`
    : '';

  return `import { useFormedible } from '@/hooks/use-formedible';

type ${componentName}Values = Record<string, unknown>;
${helperBlock}${analyticsBlock}

export function ${componentName}() {
  const { Form } = useFormedible<${componentName}Values>({
    fields: [
${fieldLines.join('\n')}
    ],
${optionalBlocks.length > 0 ? `${optionalBlocks.join('\n')}\n` : ''}    formOptions: {
      defaultValues: ${formatDefaultValues(example.options.formOptions.defaultValues)},
      onSubmit: ({ value }) => {
        window.sessionStorage.setItem(${quoteCodeString(`${example.id}-submission`)}, JSON.stringify(value));
      },
    },
  });

  return <Form aria-label={${quoteCodeString(example.title)}} />;
}`;
}

function formatOptions(options: readonly unknown[]): string {
  const values = options.map((option) => {
    if (typeof option === 'string') {
      return quoteCodeString(option);
    }

    if (typeof option === 'object' && option !== null && 'value' in option && typeof option.value === 'string') {
      return `{ value: ${quoteCodeString(option.value)}, label: ${quoteCodeString('label' in option && typeof option.label === 'string' ? option.label : option.value)} }`;
    }

    return formatValue(option);
  });

  return `[${values.join(', ')}]`;
}

function formatDefaultValues(values: unknown): string {
  if (!values || typeof values !== 'object') {
    return '{}';
  }

  const entries = Object.entries(values as Record<string, unknown>).map(([key, value]) => `${key}: ${formatValue(value)}`);

  return `{ ${entries.join(', ')} }`;
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return quoteCodeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => formatValue(entry)).join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => `${key}: ${formatValue(entry)}`);

    return `{ ${entries.join(', ')} }`;
  }

  return 'undefined';
}

function quoteCodeString(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toPascalCase(value: string): string {
  return value
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}
