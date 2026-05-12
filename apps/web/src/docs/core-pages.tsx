import type { ReactNode } from 'react';

import { CodeBlock } from './code-block';
import { docsCodeExamples, type DocsCodeExampleId } from './code-examples';
import { docsCards, docsHeroMetrics, docsSections } from './content';
import { DocsCard } from './docs-card';
import { PageHeader } from './page-header';

type GuideLink = {
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

type GuideSection = {
  readonly title: string;
  readonly body: string;
  readonly bullets: readonly string[];
};

type GuidePage = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly sections: readonly GuideSection[];
  readonly codeExampleIds?: readonly DocsCodeExampleId[];
  readonly related?: readonly GuideLink[];
  readonly aside?: ReactNode;
};

export type DocsPageId =
  | 'getting-started'
  | 'fields'
  | 'validation'
  | 'advanced-features'
  | 'analytics'
  | 'persistence'
  | 'dynamic-text'
  | 'builder'
  | 'ai-builder'
  | 'parser'
  | 'api';

const hubLinks = [
  { title: 'Getting started', description: 'Install shape, first form, and project conventions.', href: '/docs/getting-started' },
  { title: 'Examples', description: 'Fourteen real compatibility examples rendered by the current hook.', href: '/docs/examples' },
  { title: 'Fields', description: 'Supported field types, options, arrays, objects, and custom registry guidance.', href: '/docs/fields' },
  { title: 'Validation', description: 'Schema, inline, async, and cross-field validation patterns.', href: '/docs/validation' },
  { title: 'Advanced features', description: 'Pages, tabs, conditional UI, dynamic options, and navigation.', href: '/docs/advanced-features' },
  { title: 'Analytics', description: 'Memoized callback contracts for field, page, and completion events.', href: '/docs/analytics' },
  { title: 'Persistence', description: 'Draft restoration with localStorage or sessionStorage.', href: '/docs/persistence' },
  { title: 'Dynamic text', description: 'Template interpolation for labels, descriptions, and page copy.', href: '/docs/dynamic-text' },
  { title: 'Builder', description: 'Visual builder usage and generated configuration review.', href: '/docs/builder' },
  { title: 'AI Builder', description: 'Provider selection, generated preview, and safe review workflow.', href: '/docs/ai-builder' },
  { title: 'Parser', description: 'Turn text or structured config into the same field model.', href: '/docs/parser' },
  { title: 'API', description: 'UseFormedibleOptions, field configuration, callbacks, and return value map.', href: '/docs/api' },
] satisfies readonly GuideLink[];

const fieldTypes = [
  'text, email, password, url, tel, textarea, number',
  'select, radio, checkbox, switch, date, slider, rating',
  'phone, file, array, object, multiSelect, combobox, multiCombobox',
  'color, colorPicker, duration, location, masked, maskedInput',
] as const;

export const guidePages: Record<DocsPageId, GuidePage> = {
  'getting-started': {
    eyebrow: 'Start here',
    title: 'Create a Formedible form from app-local source.',
    description: 'Use the copied hook and components inside the web app, keep imports on consumer paths, and let TanStack Form own form state.',
    codeExampleIds: ['shadcn-install-surface', 'typed-hook-usage'],
    sections: [
      {
        title: 'Install and import from the consumer app',
        body: 'The rebuilt docs describe Formedible as source that lives in the app. Runtime examples import from @/hooks, @/components, and @/lib/formedible instead of package-era paths.',
        bullets: ['Run the shadcn add command for generated source.', 'Keep field UI customizable in the app tree.', 'Use type-only imports for shared configuration types.'],
      },
      {
        title: 'Define values before fields',
        body: 'Start with a values type or a Zod schema, then create fields whose names match those values. The hook returns a Form component that renders labels, errors, layout, and submission UI.',
        bullets: ['Set defaultValues for every controlled value.', 'Pass validators through formOptions when using schemas.', 'Render <Form className="space-y-4" /> when you need layout control.'],
      },
    ],
  },
  fields: {
    eyebrow: 'Field model',
    title: 'Configure fields once and reuse them everywhere.',
    description: 'Every manual form, builder form, AI-generated form, and parser result targets the same field configuration model.',
    codeExampleIds: ['field-registry-extension'],
    aside: (
      <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
        {fieldTypes.map((group) => (
          <p key={group} className="rounded-2xl bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
            {group}
          </p>
        ))}
      </div>
    ),
    sections: [
      {
        title: 'Common field keys',
        body: 'A field needs a name and usually a type and label. It can also declare description, required, disabled, section, page, tab, conditional, options, validation, and field-specific config objects.',
        bullets: ['Use options arrays for select-like fields.', 'Use option functions for dependent fields.', 'Use field-specific config for sliders, rating, phone, dates, files, location, and duration.'],
      },
      {
        title: 'Arrays and objects',
        body: 'Array fields can render scalar items or nested object cards. Object fields and array objectConfig fields share the same field model, so nested forms stay inspectable.',
        bullets: ['Set minItems and maxItems for boundaries.', 'Provide defaultValue for repeatable item creation.', 'Use objectConfig.fields for nested object inputs.'],
      },
    ],
  },
  validation: {
    eyebrow: 'Validation',
    title: 'Keep validation explicit at the schema, field, and workflow layers.',
    description: 'Formedible passes validation concerns through the current TanStack Form integration while field-level helpers keep common UI feedback close to the field config.',
    codeExampleIds: ['typed-hook-usage'],
    sections: [
      {
        title: 'Schema and form validators',
        body: 'Use Zod or TanStack Form validators through formOptions when the full form needs a contract. Schema names should match field names exactly.',
        bullets: ['Keep defaultValues aligned with schema output.', 'Use enum defaults with literal values.', 'Return useful messages from validators rather than generic failures.'],
      },
      {
        title: 'Field, async, and cross-field rules',
        body: 'Field validation receives the value, current form values, and context. Async validation can debounce remote checks. Cross-field validation watches named fields together.',
        bullets: ['Return string messages for invalid values.', 'Use AbortSignal-aware async checks.', 'Keep conditionals boolean and deterministic.'],
      },
    ],
  },
  'advanced-features': {
    eyebrow: 'Flows',
    title: 'Build pages, tabs, conditionals, and dynamic options from the same configuration.',
    description: 'Advanced Formedible flows are still plain field config: add page or tab membership, configure progress, and make visibility depend on current values.',
    sections: [
      {
        title: 'Pages and tabs',
        body: 'Pages use numeric page identifiers and optional page metadata. Tabs use stable string ids and can include descriptions. Both can be conditional.',
        bullets: ['Start page numbers at 1.', 'Keep page titles accessible and descriptive.', 'Use progress.showSteps or progress.showPercentage when users need orientation.'],
      },
      {
        title: 'Conditional UI and dependent choices',
        body: 'Conditional callbacks receive the current values and must return a boolean. Dynamic options callbacks return the choices available for the current state.',
        bullets: ['Avoid returning undefined from conditionals.', 'Reset dependent defaults when a controlling choice changes.', 'Prefer readable helper functions for repeated conditions.'],
      },
    ],
  },
  analytics: {
    eyebrow: 'Analytics',
    title: 'Instrument form behavior without coupling analytics to rendering.',
    description: 'Analytics callbacks expose start, focus, blur, page change, completion, and abandonment events while the form remains a normal React component.',
    sections: [
      {
        title: 'Callback contract',
        body: 'Use analytics for product telemetry, funnel analysis, or UX research. Callbacks receive timestamps, field names, page transitions, completion percentages, and submitted data.',
        bullets: ['Memoize callbacks in component code.', 'Keep payloads privacy-aware.', 'Treat analytics failures as non-blocking.'],
      },
      {
        title: 'Performance and stability',
        body: 'Because callback identity can affect effects, create stable analytics objects with useMemo when analytics are declared inside components.',
        bullets: ['Use useCallback for individual handlers.', 'Use useMemo for the analytics config object.', 'Do not mutate form data inside analytics callbacks.'],
      },
    ],
  },
  persistence: {
    eyebrow: 'Persistence',
    title: 'Restore drafts with a small, explicit storage contract.',
    description: 'Persistence stores form values under a stable key and can debounce writes, exclude sensitive fields, and restore on mount.',
    sections: [
      {
        title: 'Storage configuration',
        body: 'Use localStorage for longer drafts and sessionStorage for tab-scoped work. Choose a key that includes product area and form version.',
        bullets: ['Set debounceMs for large forms.', 'Exclude terms, secrets, one-time uploads, and ephemeral acknowledgements.', 'Version keys when field shape changes.'],
      },
      {
        title: 'User experience',
        body: 'Draft restoration is most useful in long forms. Pair it with clear copy so users know their work survives navigation.',
        bullets: ['Keep submit behavior authoritative.', 'Clear drafts after successful persistence to your backend.', 'Avoid storing regulated data unless the product policy allows it.'],
      },
    ],
  },
  'dynamic-text': {
    eyebrow: 'Dynamic text',
    title: 'Personalize labels and page copy with template interpolation.',
    description: 'Labels, descriptions, input hints, and page descriptions can include tokens such as {{firstName}} that resolve from current form values.',
    sections: [
      {
        title: 'Token usage',
        body: 'Use dynamic copy to make multi-step flows feel continuous. Tokens are best for already-collected values that improve orientation.',
        bullets: ['Keep fallback copy readable before values exist.', 'Use tokens in labels, descriptions, and page copy.', 'Avoid placing sensitive values in decorative copy.'],
      },
      {
        title: 'Dynamic input hints',
        body: 'Fields can opt into dynamic hint behavior when input guidance should resolve from values too.',
        bullets: ['Prefer labels over hints for required instructions.', 'Keep interpolated copy short.', 'Test empty, partial, and completed states.'],
      },
    ],
  },
  builder: {
    eyebrow: 'Builder',
    title: 'Mount the visual builder as a first-party app surface.',
    description: 'The builder lets teams compose fields, preview output, and copy generated configuration without leaving consumer-owned source paths.',
    codeExampleIds: ['builder-imports'],
    sections: [
      {
        title: 'Review generated configuration',
        body: 'Treat the builder as a drafting tool. Generated config should be reviewed, typed, and checked into product code when it becomes part of the application.',
        bullets: ['Keep generated output visible.', 'Preview with the same renderer used in production.', 'Add product-specific persistence around the builder shell.'],
      },
      {
        title: 'Builder data shape',
        body: 'Builder state maps to the same fields, pages, tabs, persistence, and analytics options used by useFormedible.',
        bullets: ['Normalize option labels before review.', 'Keep custom fields documented in the registry.', 'Use generated code as a starting point, not an opaque artifact.'],
      },
    ],
  },
  'ai-builder': {
    eyebrow: 'AI Builder',
    title: 'Generate draft forms while preserving human review.',
    description: 'AI Builder provider selection, chat, generated preview, and renderer paths live in the app so generated forms still target the public field model.',
    codeExampleIds: ['ai-builder-imports'],
    sections: [
      {
        title: 'Safe generation workflow',
        body: 'Use prompts to draft structure, then inspect the generated fields, options, defaults, validation, and copy before shipping.',
        bullets: ['Prefer structured prompts with audience, fields, and success criteria.', 'Reject generated secrets or hidden network assumptions.', 'Run generated config through type checks.'],
      },
      {
        title: 'Provider boundaries',
        body: 'Provider selection belongs outside the renderer. The final form should not depend on AI availability once configuration has been accepted.',
        bullets: ['Store accepted config separately from chat history.', 'Show generated diffs to reviewers.', 'Keep deterministic defaults in production code.'],
      },
    ],
  },
  parser: {
    eyebrow: 'Parser',
    title: 'Parse text or structured input into Formedible configuration.',
    description: 'The parser surface is useful for migration and import workflows because output converges on the same UseFormedibleOptions-compatible model.',
    sections: [
      {
        title: 'Migration input',
        body: 'Use parser utilities to convert legacy form descriptions, simple schemas, or generated text into candidate fields that can be reviewed.',
        bullets: ['Validate parsed field names before rendering.', 'Normalize option values into stable strings.', 'Keep migration review separate from production submission.'],
      },
      {
        title: 'Parser output',
        body: 'Parser output should be treated like builder output: a draft field model that becomes source only after review.',
        bullets: ['Reject unsupported field types early.', 'Apply product naming conventions.', 'Run route, docs, and build checks after adding parsed examples.'],
      },
    ],
  },
  api: {
    eyebrow: 'API reference',
    title: 'The practical map of the public Formedible docs API.',
    description: 'UseFormedibleOptions is the main API: fields plus formOptions, then optional pages, tabs, progress, persistence, analytics, and labels.',
    sections: [
      {
        title: 'useFormedible options',
        body: 'The hook accepts fields and formOptions as required inputs. formOptions owns defaultValues and onSubmit. Optional features layer on top without changing field names.',
        bullets: ['fields: readonly FormedibleFieldConfig[]', 'formOptions: defaultValues and optional onSubmit', 'schema, validation, asyncValidation, pages, tabs, progress, persistence, analytics'],
      },
      {
        title: 'Returned Form component',
        body: 'The hook returns a Form component ready to render. Pass className and aria-label when the surrounding page needs custom layout or a specific accessible name.',
        bullets: ['Use semantic page headings outside the form.', 'Keep submit, next, and previous labels product-specific.', 'Prefer consumer imports for all runtime docs examples.'],
      },
    ],
  },
};

export function DocsHub() {
  return (
    <main className="min-h-0 overflow-hidden bg-background text-foreground">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader
          eyebrow="Formedible Docs"
          title="A complete IA for source-owned forms."
          description="Start with the current app-local hook, choose a route by job-to-be-done, and move from field config to rendered examples, builders, parser workflows, and API details."
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

        <nav aria-label="Documentation routes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hubLinks.map((link) => (
            <a key={link.href} href={link.href} className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-xl shadow-black/10 outline-none transition hover:-translate-y-1 hover:border-primary/45 focus-visible:ring-2 focus-visible:ring-ring">
              <h2 className="text-xl font-bold tracking-[-0.04em]">{link.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{link.description}</p>
            </a>
          ))}
        </nav>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {docsCards.map((card, index) => (
            <DocsCard key={card.href} card={card} index={index} />
          ))}
        </div>

        <div className="grid gap-10">
          {docsSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 rounded-[2rem] border border-border/70 bg-card/55 p-5 shadow-xl shadow-black/10 sm:p-7 lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
                <div className="lg:sticky lg:top-32">
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
      </section>
    </main>
  );
}

export function GuidePageView({ pageId }: { readonly pageId: DocsPageId }) {
  const page = guidePages[pageId];

  return (
    <main className="min-h-0 bg-background text-foreground">
      <article className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.description}>{page.aside}</PageHeader>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="grid gap-5">
            {page.sections.map((section) => (
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
            {page.codeExampleIds?.map((exampleId) => <CodeBlock key={exampleId} example={docsCodeExamples[exampleId]} />)}
            <nav aria-label="Related documentation" className="rounded-[1.75rem] border border-border/70 bg-card/65 p-5 shadow-xl shadow-black/10">
              <h2 className="text-lg font-bold tracking-[-0.04em]">Related routes</h2>
              <div className="mt-4 grid gap-3">
                {(page.related ?? hubLinks.slice(0, 4)).map((link) => (
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
