import type { DocsCodeExampleId } from './code-examples';

export type DocsCardTone = 'amber' | 'blue' | 'green' | 'rose' | 'violet';

export type DocsMetric = {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
};

export type DocsCardContent = {
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly href: `#${string}` | `/docs/${string}`;
  readonly tone: DocsCardTone;
  readonly bullets: readonly string[];
};

export type DocsSectionContent = {
  readonly id: 'install-surface' | 'field-model' | 'builder' | 'ai-builder' | 'examples';
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly codeExampleIds: readonly DocsCodeExampleId[];
};

export const docsHeroMetrics = [
  { value: '22+', label: 'field types', detail: 'Rendered through copied shadcn-style components.' },
  { value: '0', label: 'package lock-in', detail: 'Consumer imports stay inside the app.' },
  { value: '1', label: 'field model', detail: 'Manual, builder, and AI flows share the same config.' },
] satisfies readonly DocsMetric[];

export const docsCards = [
  {
    title: 'Install surface',
    eyebrow: 'Start clean',
    description: 'Bring Formedible into a TanStack Start app as generated hooks, fields, and utilities that belong to the consumer codebase.',
    href: '#install-surface',
    tone: 'amber',
    bullets: ['App-local imports', 'Typed TanStack Form options', 'shadcn-compatible UI primitives'],
  },
  {
    title: 'Field model',
    eyebrow: 'Shape once',
    description: 'Describe field behavior with one readable model for simple forms, multi-page flows, tabs, arrays, analytics, and persistence.',
    href: '#field-model',
    tone: 'blue',
    bullets: ['Conditional fields', 'Dynamic labels', 'Nested arrays and objects'],
  },
  {
    title: 'Builder',
    eyebrow: 'Compose visually',
    description: 'Use the builder as a first-party app surface for field authoring, previewing, and copying production configuration.',
    href: '#builder',
    tone: 'green',
    bullets: ['Real preview output', 'Generated config review', 'Consumer component paths'],
  },
  {
    title: 'AI Builder',
    eyebrow: 'Generate safely',
    description: 'Turn structured prompts into the same field model without hiding the generated configuration from reviewers.',
    href: '#ai-builder',
    tone: 'violet',
    bullets: ['Provider selection', 'Reviewable output', 'Same renderer path'],
  },
  {
    title: 'Examples',
    eyebrow: 'Verify behavior',
    description: 'Run real Formedible examples that exercise the current app-local hook instead of stale package-era docs snippets.',
    href: '/docs/examples',
    tone: 'rose',
    bullets: ['Compatibility coverage', 'Accessible live forms', 'No removed helpers'],
  },
] satisfies readonly DocsCardContent[];

export const docsSections = [
  {
    id: 'install-surface',
    eyebrow: 'Clean-room shadcn install surface',
    title: 'The docs describe what exists in this TanStack Start app.',
    description:
      'Formedible is documented here as copied source: the hook, field components, layouts, builder, and AI builder are imported from consumer paths. That keeps customization explicit and avoids runtime references to old package documentation.',
    codeExampleIds: ['shadcn-install-surface'],
  },
  {
    id: 'field-model',
    eyebrow: 'Content model',
    title: 'One typed configuration powers every rendering mode.',
    description:
      'Fields stay declarative while TanStack Form owns state and validation. The same model covers single-page forms, page flows, tabs, arrays, dynamic options, persistence, and analytics callbacks.',
    codeExampleIds: ['typed-hook-usage', 'field-registry-extension'],
  },
  {
    id: 'builder',
    eyebrow: 'Builder integration',
    title: 'The builder is a consumer component, not a separate docs artifact.',
    description:
      'Mount the builder from the app path, let users assemble fields visually, then keep generated configuration reviewable before it is pasted into production code.',
    codeExampleIds: ['builder-imports'],
  },
  {
    id: 'ai-builder',
    eyebrow: 'AI-assisted generation',
    title: 'Prompted form generation still lands on the same source model.',
    description:
      'Provider selection, chat, generated preview, and final renderer all live in the app. AI can accelerate drafting without creating a second incompatible form format.',
    codeExampleIds: ['ai-builder-imports'],
  },
] satisfies readonly DocsSectionContent[];
