export const siteMeta = {
  name: 'Formedible',
  title: 'Formedible Docs',
  titleTemplate: '%s · Formedible',
  description:
    'Production-ready Formedible documentation with real shadcn-compatible form examples, builder guidance, and AI Builder workflows.',
  siteUrl: 'https://formedible.dev',
  repositoryUrl: 'https://github.com/DimitriGilbert/Formedible',
  organizationId: 'https://formedible.dev/#organization',
  softwareId: 'https://formedible.dev/#software',
  websiteId: 'https://formedible.dev/#website',
  lastModified: '2026-05-23',
  ogImagePath: '/og.svg',
  locale: 'en_US',
  themeColor: '#09090b',
  twitterSite: '@formedible',
  keywords: [
    'Formedible',
    'React forms',
    'TanStack Form',
    'shadcn/ui forms',
    'form builder',
    'AI form builder',
    'Zod validation',
  ],
} as const;

export type PublicRoutePath =
  | '/'
  | '/docs'
  | '/docs/getting-started'
  | '/docs/examples'
  | '/docs/fields'
  | '/docs/validation'
  | '/docs/advanced-features'
  | '/docs/analytics'
  | '/docs/persistence'
  | '/docs/dynamic-text'
  | '/docs/builder'
  | '/docs/ai-builder'
  | '/docs/parser'
  | '/docs/api'
  | '/builder'
  | '/ai-builder';

export type PublicRouteMeta = {
  readonly path: PublicRoutePath;
  readonly title: string;
  readonly description: string;
  readonly changeFrequency: 'weekly' | 'monthly';
  readonly priority: string;
};

export const publicRouteMeta = [
  {
    path: '/',
    title: 'Formedible Docs',
    description: siteMeta.description,
    changeFrequency: 'weekly',
    priority: '1.0',
  },
  {
    path: '/docs',
    title: 'Documentation hub',
    description: 'Choose a Formedible documentation route by job-to-be-done, from setup to examples, builders, parser workflows, and API details.',
    changeFrequency: 'weekly',
    priority: '0.9',
  },
  {
    path: '/docs/getting-started',
    title: 'Getting started',
    description: 'Create a Formedible form from app-local source with consumer-safe imports and TanStack Form state ownership.',
    changeFrequency: 'monthly',
    priority: '0.8',
  },
  {
    path: '/docs/examples',
    title: 'Examples',
    description: 'Browse fourteen real Formedible compatibility examples rendered by the current consumer-safe hook and field components.',
    changeFrequency: 'weekly',
    priority: '0.8',
  },
  {
    path: '/docs/fields',
    title: 'Fields',
    description: 'Review Formedible field configuration for basic inputs, advanced controls, arrays, objects, and custom registry usage.',
    changeFrequency: 'monthly',
    priority: '0.8',
  },
  {
    path: '/docs/validation',
    title: 'Validation',
    description: 'Keep Formedible validation explicit across schemas, inline rules, async checks, and cross-field workflow constraints.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  {
    path: '/docs/advanced-features',
    title: 'Advanced features',
    description: 'Build Formedible pages, tabs, conditionals, dynamic options, progress, and navigation from one typed configuration model.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  {
    path: '/docs/analytics',
    title: 'Analytics',
    description: 'Instrument Formedible form behavior with stable callbacks for starts, focus, blur, page changes, completion, and abandonment.',
    changeFrequency: 'monthly',
    priority: '0.6',
  },
  {
    path: '/docs/persistence',
    title: 'Persistence',
    description: 'Restore Formedible drafts with a small storage contract that supports stable keys, debounced writes, and excluded fields.',
    changeFrequency: 'monthly',
    priority: '0.6',
  },
  {
    path: '/docs/dynamic-text',
    title: 'Dynamic text',
    description: 'Personalize Formedible labels, descriptions, hints, and page copy with template interpolation from current form values.',
    changeFrequency: 'monthly',
    priority: '0.6',
  },
  {
    path: '/docs/builder',
    title: 'Builder docs',
    description: 'Use the Formedible visual builder as a first-party app surface for field authoring, preview, and generated config review.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  {
    path: '/docs/ai-builder',
    title: 'AI Builder docs',
    description: 'Generate draft Formedible forms with provider selection, generated preview, and a review workflow that preserves deterministic source.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  {
    path: '/docs/parser',
    title: 'Parser',
    description: 'Parse text or structured input into Formedible configuration that converges on the same reviewable field model.',
    changeFrequency: 'monthly',
    priority: '0.6',
  },
  {
    path: '/docs/api',
    title: 'API reference',
    description: 'Review the practical Formedible API map for fields, formOptions, pages, tabs, persistence, analytics, labels, and return values.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  {
    path: '/builder',
    title: 'Visual builder',
    description: 'Compose Formedible fields interactively, preview output, and copy reviewed configuration from the docs builder workspace.',
    changeFrequency: 'weekly',
    priority: '0.8',
  },
  {
    path: '/ai-builder',
    title: 'AI-assisted builder',
    description: 'Draft Formedible forms with AI assistance while keeping generated fields, options, validation, and defaults visible for review.',
    changeFrequency: 'weekly',
    priority: '0.8',
  },
] satisfies readonly PublicRouteMeta[];

export const publicRoutes = publicRouteMeta.map((route) => route.path);

export function getPublicRouteMeta(path: PublicRoutePath): PublicRouteMeta {
  return publicRouteMeta.find((route) => route.path === path) ?? publicRouteMeta[0];
}

export function formatPageTitle(title?: string): string {
  if (!title || title === siteMeta.title) {
    return siteMeta.title;
  }

  return siteMeta.titleTemplate.replace('%s', title);
}
