import { useMemo, useState } from 'react';

import { DocsExampleForm, docsCompatibilityExamples } from '@/features/docs/compatibility-examples';

export type RenderedExampleStatus = 'rendered' | 'code-only';

export type ShowcaseCodeExample = {
  readonly key: string;
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly code: string;
  readonly metrics: readonly { readonly label: string; readonly value: string }[];
  readonly caveats: readonly string[];
};

export type RenderedExampleMapping = {
  readonly status: RenderedExampleStatus;
  readonly compatibilityId?: string;
  readonly reason?: string;
};

type FocusedExampleTab = 'preview' | 'code';

export const renderedExampleMappings: Readonly<Record<string, RenderedExampleMapping>> = {
  contactFormCode: { status: 'rendered', compatibilityId: 'contact-form' },
  profileFormCode: {
    status: 'code-only',
    reason: 'This legacy profile snippet demonstrates an animation wrapper that is intentionally not executed in the current docs runtime.',
  },
  surveyFormCode: { status: 'rendered', compatibilityId: 'survey-form-dynamic-options' },
  exampleContactFormCode: { status: 'rendered', compatibilityId: 'contact-form' },
  exampleRegistrationFormCode: { status: 'rendered', compatibilityId: 'registration-form' },
  exampleSurveyFormCode: { status: 'rendered', compatibilityId: 'survey-form-dynamic-options' },
  exampleCheckoutFormCode: { status: 'rendered', compatibilityId: 'checkout-form' },
  exampleJobApplicationFormCode: { status: 'rendered', compatibilityId: 'job-application-form' },
  analyticsTrackingFormCode: { status: 'rendered', compatibilityId: 'analytics-tracking-form' },
  persistenceFormCode: { status: 'rendered', compatibilityId: 'persistence-form' },
  arrayFieldsCode: { status: 'rendered', compatibilityId: 'array-fields-form' },
  advancedFieldTypesCode: { status: 'rendered', compatibilityId: 'advanced-field-types-form' },
};

const compatibilityExamplesById = new Map(docsCompatibilityExamples.map((example) => [example.id, example] as const));

export function getRenderedExampleMapping(example: ShowcaseCodeExample): RenderedExampleMapping {
  const mapping = renderedExampleMappings[example.key];

  if (!mapping) {
    return {
      status: 'code-only',
      reason: 'No current app-local rendered form matches this copied source export closely enough, so the verified source remains available as a code-only reference.',
    };
  }

  if (mapping.status === 'rendered' && mapping.compatibilityId && compatibilityExamplesById.has(mapping.compatibilityId)) {
    return mapping;
  }

  return {
    status: 'code-only',
    reason: mapping.reason ?? 'The configured rendered preview is not available in the current docs runtime, so this entry is shown as a code-only reference.',
  };
}

export function RenderedExampleShowcase({ example, index }: { readonly example: ShowcaseCodeExample; readonly index: number }) {
  return <RenderedExampleArticle key={example.id} example={example} index={index} />;
}

function RenderedExampleArticle({ example, index }: { readonly example: ShowcaseCodeExample; readonly index: number }) {
  const mapping = useMemo(() => getRenderedExampleMapping(example), [example]);
  const [activeTab, setActiveTab] = useState<FocusedExampleTab>('preview');
  const previewLabelId = `${example.id}-preview-label`;
  const codeLabelId = `${example.id}-code-label`;
  const previewPanelId = `${example.id}-preview-panel`;
  const codePanelId = `${example.id}-code-panel`;

  return (
    <article id={example.id} data-code-example-id={example.id} data-code-example-export={String(example.key)} data-rendered-example-status={mapping.status} className="scroll-mt-8 overflow-hidden rounded-2xl">
      <div className="border-b border-border bg-muted p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-primary">{example.category}</p>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">{mapping.status === 'rendered' ? 'Rendered preview' : 'Code-only reference'}</span>
            </div>
            <h2 className="mt-3 text-sm font-semibold text-foreground">{example.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{example.description}</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-background text-sm font-semibold text-primary">{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="border-b border-border bg-background p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <ExampleMetadata example={example} mapping={mapping} />
          <div className="inline-grid grid-cols-2 rounded-xl border border-border bg-muted p-1" role="tablist" aria-label="Focused example view">
            <button
              type="button"
              role="tab"
              id={`${example.id}-preview-tab`}
              aria-selected={activeTab === 'preview'}
              aria-controls={previewPanelId}
              onClick={() => setActiveTab('preview')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${activeTab === 'preview' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Preview
            </button>
            <button
              type="button"
              role="tab"
              id={`${example.id}-code-tab`}
              aria-selected={activeTab === 'code'}
              aria-controls={codePanelId}
              onClick={() => setActiveTab('code')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${activeTab === 'code' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Source
            </button>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div id={previewPanelId} role="tabpanel" aria-labelledby={`${example.id}-preview-tab`} hidden={activeTab !== 'preview'} data-focused-preview-area="true">
          <ExamplePreview example={example} mapping={mapping} labelId={previewLabelId} />
        </div>
        <div id={codePanelId} role="tabpanel" aria-labelledby={`${example.id}-code-tab`} hidden={activeTab !== 'code'} data-focused-code-area="true">
          <ExampleCode example={example} labelId={codeLabelId} />
        </div>
      </div>
    </article>
  );
}

function ExampleMetadata({ example, mapping }: { readonly example: ShowcaseCodeExample; readonly mapping: RenderedExampleMapping }) {
  return (
    <div className="grid gap-4">
      <dl className="grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
        {example.metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </dl>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:max-w-3xl">
        <div className="bg-muted p-4">
          <p className="text-sm font-semibold text-muted-foreground">Export</p>
          <code className="mt-2 block break-all text-sm font-semibold text-foreground">{String(example.key)}</code>
        </div>
        <span className="rounded-full border border-border bg-muted px-4 py-2 text-center text-xs font-semibold text-muted-foreground">Focused view</span>
      </div>
      {example.caveats.length > 0 ? <DisplayNotes notes={example.caveats} /> : null}
      {mapping.status === 'code-only' ? <CodeOnlyNotice reason={mapping.reason ?? 'This copied source is preserved as a code-only reference.'} /> : null}
    </div>
  );
}

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="bg-muted p-4 text-center">
      <dt className="text-2xl font-bold tracking-tight text-foreground">{value}</dt>
      <dd className="mt-1 text-sm text-muted-foreground">{label}</dd>
    </div>
  );
}

function DisplayNotes({ notes }: { readonly notes: readonly string[] }) {
  return (
    <div className="bg-primary/10 p-4 text-sm leading-relaxed text-foreground">
      <p className="font-semibold">Display notes for copied source</p>
      <ul className="mt-2 grid gap-1.5">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeOnlyNotice({ reason }: { readonly reason: string }) {
  return (
    <div className="bg-muted p-4 text-sm leading-relaxed text-foreground">
      <p className="font-semibold">Code-only reference</p>
      <p className="mt-1">{reason}</p>
    </div>
  );
}

function ExamplePreview({ example, mapping, labelId }: { readonly example: ShowcaseCodeExample; readonly mapping: RenderedExampleMapping; readonly labelId: string }) {
  const compatibilityExample = mapping.compatibilityId ? compatibilityExamplesById.get(mapping.compatibilityId) : undefined;

  return (
    <section aria-labelledby={labelId} className="grid min-h-0 min-w-0 gap-4 bg-background p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id={labelId} className="text-sm font-semibold text-primary">Rendered preview</p>
          <p className="mt-1 text-sm text-muted-foreground">Current docs runtime using app-local Formedible components.</p>
        </div>
        {compatibilityExample ? <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{compatibilityExample.id}</span> : null}
      </div>
      <div className="overflow-hidden rounded-2xl bg-muted p-4 md:p-5">
        {compatibilityExample ? (
          <div data-rendered-preview-for={example.key} data-compatibility-example-id={compatibilityExample.id} className="max-h-[58rem] overflow-auto pr-1">
            <DocsExampleForm example={compatibilityExample} />
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm font-semibold text-foreground">No live preview for this copied export</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{mapping.reason ?? 'The copied source remains available as a verified code-only reference below.'}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ExampleCode({ example, labelId }: { readonly example: ShowcaseCodeExample; readonly labelId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <figure id={`${example.id}-source`} className="min-h-0 min-w-0 bg-muted">
      <figcaption className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span id={labelId} className="text-xs font-semibold text-muted-foreground">Actual copied source code</span>
          <p className="mt-1 text-xs text-muted-foreground">apps/web/src/data/code-examples.ts</p>
        </div>
        <button type="button" onClick={() => setIsExpanded((current) => !current)} className="w-fit rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none transition hover:bg-primary/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={isExpanded} aria-controls={`${example.id}-code-block`}>
          {isExpanded ? 'Limit height' : 'Expand code'}
        </button>
      </figcaption>
      <pre id={`${example.id}-code-block`} aria-labelledby={labelId} className={`${isExpanded ? 'max-h-none' : 'max-h-[64rem]'} overflow-auto p-6 text-sm leading-6 text-foreground [tab-size:2]`}>
        <code>{example.code}</code>
      </pre>
    </figure>
  );
}
