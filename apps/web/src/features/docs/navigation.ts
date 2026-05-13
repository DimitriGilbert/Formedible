export type SiteNavigationHref = `/${string}`;

export type SiteNavigationItem = {
  readonly id: 'home' | 'docs' | 'examples' | 'fields' | 'builder' | 'ai-builder';
  readonly label: string;
  readonly href: SiteNavigationHref;
  readonly description: string;
};

export const siteNavigation: readonly SiteNavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    description: 'Open the Formedible documentation landing page.',
  },
  {
    id: 'docs',
    label: 'Docs',
    href: '/docs',
    description: 'Open the Formedible documentation hub.',
  },
  {
    id: 'examples',
    label: 'Examples',
    href: '/docs/examples',
    description: 'Browse real Formedible form examples.',
  },
  {
    id: 'fields',
    label: 'Fields',
    href: '/docs/fields',
    description: 'Review supported field types and configuration patterns.',
  },
  {
    id: 'builder',
    label: 'Builder',
    href: '/builder',
    description: 'Open the interactive Formedible builder workspace.',
  },
  {
    id: 'ai-builder',
    label: 'AI Builder',
    href: '/ai-builder',
    description: 'Open the interactive AI-assisted Formedible builder workspace.',
  },
];
