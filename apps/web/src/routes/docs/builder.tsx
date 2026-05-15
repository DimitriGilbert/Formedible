import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/builder');

const relatedLinks = [
  { title: 'API', description: 'Hook options, field config, tabs, pages, persistence, analytics, and form props.', href: '/docs/api' },
  { title: 'AI Builder', description: 'Prompt-assisted form drafts that feed the same builder and field model.', href: '/docs/ai-builder' },
  { title: 'Getting Started', description: 'Install the copied app surface and render your first Formedible form.', href: '/docs/getting-started' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Overview',
    body: 'FormBuilder is the visual authoring surface for Formedible. It gives product teams a field palette, a live preview, and generated code from the same field config used by hand-written forms.',
    bullets: [
      'Use visual field authoring when a team needs to add labels, options, validation flags, pages, and tabs without editing source first.',
      'Keep the live preview close to the builder so reviewers see the renderer output before saving config.',
      'Copy generated code into product-owned files, then type-check it with the rest of the app.',
    ],
  },
  {
    title: 'Getting started',
    body: 'Import FormBuilder from the installed shadcn UI package path and mount it where your app owns navigation, persistence, review state, and save actions. The default view ships with Builder, Preview, and Code tabs.',
    bullets: [
      'Import FormBuilder from @formedible/ui/components/formedible/builder/form-builder.',
      'Render it inside an app route, modal, or admin workspace with a clear aria label or nearby heading.',
      'Use the default tabs first: Builder for editing fields, Preview for rendered output, and Code for generated source.',
    ],
  },
  {
    title: 'Tab system',
    body: 'Builder tabs are plain TabConfig objects, so you can swap the default set for a narrower workflow. The exported helpers cover the usual product shapes without hand-editing tab order.',
    bullets: [
      'getBuilderOnlyTabs returns the field editor alone for embedded admin panels.',
      'getBuilderAndPreviewTabs keeps editing and preview together when code export belongs somewhere else.',
      'getBuilderAndCodeTabs skips preview for review flows that only need editing plus source output.',
      'createTabsWithOrder accepts tab ids such as code, builder, preview and returns enabled tabs in that order.',
      'createTabsWithDisabled keeps the default order while disabling ids you do not want visible.',
    ],
  },
  {
    title: 'Field store',
    body: 'FieldStore is the small external store behind the builder. FormBuilder subscribes with useSyncExternalStore, so field edits stay outside React component state while still rendering stable snapshots.',
    bullets: [
      'addField creates a typed FormField with a generated id, default name, label, page, and required flag.',
      'updateField patches one field, notifies structure listeners, and notifies subscribers watching that field id.',
      'deleteField removes the field, clears its field-level listeners, and rebuilds the ordered snapshot.',
      'duplicateField copies an existing field with a new id, name suffix, and copy label.',
      'Field order lives in the store snapshot; reorder controls should change that order before listeners are notified.',
      'importFields replaces the store contents and advances generated ids past imported field ids.',
    ],
  },
  {
    title: 'Code generation',
    body: 'generateFormCode turns builder metadata and fields into reviewable source strings. It does not hide the result behind a runtime export; the output is meant to be copied, checked, and owned by the app.',
    bullets: [
      'fullCode is the complete React component with zod import, useFormedible call, schema, config, and rendered Form.',
      'formConfig is the serialized Formedible config object, including fields, defaults, pages, tabs, labels, and progress settings when present.',
      'schemaCode is the z.object snippet inferred from field types and required flags.',
      'Use generated output as a draft, then add product submit behavior and stronger validation where needed.',
    ],
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/builder')({
  head: () => routeHead,
  component: BuilderRoute,
});

function BuilderRoute() {
  return (
    <DocsGuidePage
      eyebrow="Builder"
      title="Mount the visual builder as a first-party app surface."
      description="Compose fields, preview the rendered form, and generate source from the same model used by useFormedible. The builder stays in your app, beside your review and save flow."
      codeExampleIds={['builder-imports']}
      sections={sections}
      related={relatedLinks}
    />
  );
}
