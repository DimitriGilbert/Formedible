import { useMemo, useState } from 'react';

import { DocsExampleForm, docsCompatibilityExamples } from '@/docs/compatibility-examples';

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
    <article id={example.id} data-code-example-id={example.id} data-code-example-export={String(example.key)} data-rendered-example-status={mapping.status} className="scroll-mt-8 overflow-hidden rounded-[2.25rem] border border-border/70 bg-card shadow-2xl shadow-black/10">
      <div className="border-b border-border/70 bg-[linear-gradient(135deg,hsl(var(--muted)/0.72),hsl(var(--background))_48%,hsl(var(--primary)/0.08))] p-5 sm:p-7 xl:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-5xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{example.category}</p>
              <span className="rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs font-bold text-muted-foreground">{mapping.status === 'rendered' ? 'Rendered preview' : 'Code-only reference'}</span>
            </div>
            <h2 className="text-3xl font-black tracking-[-0.06em] text-foreground sm:text-4xl xl:text-5xl">{example.title}</h2>
            <p className="max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">{example.description}</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border/70 bg-background/70 text-sm font-black text-primary shadow-lg shadow-black/5">{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="border-b border-border/70 bg-muted/15 p-3 sm:p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <ExampleMetadata example={example} mapping={mapping} />
          <div className="inline-grid grid-cols-2 rounded-2xl border border-border/70 bg-background p-1" role="tablist" aria-label="Focused example view">
            <button
              type="button"
              role="tab"
              id={`${example.id}-preview-tab`}
              aria-selected={activeTab === 'preview'}
              aria-controls={previewPanelId}
              onClick={() => setActiveTab('preview')}
              className={`rounded-xl px-4 py-2 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${activeTab === 'preview' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
              className={`rounded-xl px-4 py-2 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-ring ${activeTab === 'code' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Export</p>
          <code className="mt-2 block break-all text-sm font-semibold text-foreground">{String(example.key)}</code>
        </div>
        <span className="rounded-full border border-border/70 bg-card px-4 py-2 text-center text-xs font-bold text-muted-foreground">Focused view</span>
      </div>
      {example.caveats.length > 0 ? <DisplayNotes notes={example.caveats} /> : null}
      {mapping.status === 'code-only' ? <CodeOnlyNotice reason={mapping.reason ?? 'This copied source is preserved as a code-only reference.'} /> : null}
    </div>
  );
}

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-center shadow-sm shadow-black/5">
      <dt className="text-2xl font-black tracking-[-0.05em] text-foreground">{value}</dt>
      <dd className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</dd>
    </div>
  );
}

function DisplayNotes({ notes }: { readonly notes: readonly string[] }) {
  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-950 dark:text-amber-100">
      <p className="font-semibold">Display notes for copied source</p>
      <ul className="mt-2 grid gap-1.5">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodeOnlyNotice({ reason }: { readonly reason: string }) {
  return (
    <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4 text-sm leading-6 text-sky-950 dark:text-sky-100">
      <p className="font-semibold">Code-only reference</p>
      <p className="mt-1">{reason}</p>
    </div>
  );
}

function ExamplePreview({ example, mapping, labelId }: { readonly example: ShowcaseCodeExample; readonly mapping: RenderedExampleMapping; readonly labelId: string }) {
  const compatibilityExample = mapping.compatibilityId ? compatibilityExamplesById.get(mapping.compatibilityId) : undefined;

  return (
    <section aria-labelledby={labelId} className="grid min-h-0 min-w-0 gap-4 bg-muted/15 p-5 sm:p-6 xl:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id={labelId} className="text-xs font-black uppercase tracking-[0.2em] text-primary">Rendered preview</p>
          <p className="mt-1 text-sm text-muted-foreground">Current docs runtime using app-local Formedible components.</p>
        </div>
        {compatibilityExample ? <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-bold text-muted-foreground">{compatibilityExample.id}</span> : null}
      </div>
      <div className="rounded-[1.75rem] border border-border/70 bg-background p-4 shadow-inner shadow-black/5 sm:p-5">
        {compatibilityExample ? (
          <div data-rendered-preview-for={example.key} data-compatibility-example-id={compatibilityExample.id} className="max-h-[58rem] overflow-auto pr-1">
            <DocsExampleForm example={compatibilityExample} />
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-border/80 bg-muted/30 p-6 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm font-semibold text-foreground">No live preview for this copied export</p>
              <p className="text-sm leading-6 text-muted-foreground">{mapping.reason ?? 'The copied source remains available as a verified code-only reference below.'}</p>
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
    <figure id={`${example.id}-source`} className="min-h-0 min-w-0 bg-zinc-950">
      <figcaption className="sticky top-0 z-10 flex flex-col gap-3 border-b border-white/10 bg-zinc-950/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between xl:px-7">
        <div>
          <span id={labelId} className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Actual copied source code</span>
          <p className="mt-1 text-xs text-zinc-500">apps/web/src/data/code-examples.ts</p>
        </div>
        <button type="button" onClick={() => setIsExpanded((current) => !current)} className="w-fit rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-zinc-300 outline-none transition hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50" aria-expanded={isExpanded} aria-controls={`${example.id}-code-block`}>
          {isExpanded ? 'Limit height' : 'Expand code'}
        </button>
      </figcaption>
      <pre id={`${example.id}-code-block`} aria-labelledby={labelId} className={`${isExpanded ? 'max-h-none' : 'max-h-[64rem]'} overflow-auto p-5 text-[0.8rem] leading-6 text-zinc-100 [tab-size:2] sm:p-6 xl:p-7`}>
        <code>{example.code}</code>
      </pre>
    </figure>
  );
}
