export type SiteNavigationHref = `/${string}`;

export type SiteNavigationItem = {
  readonly id: 'home' | 'docs' | 'examples' | 'builder' | 'ai-builder';
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
    href: '/#docs',
    description: 'Read the current Formedible documentation surface.',
  },
  {
    id: 'examples',
    label: 'Examples',
    href: '/#examples',
    description: 'Browse real Formedible form examples.',
  },
  {
    id: 'builder',
    label: 'Builder',
    href: '/#builder',
    description: 'Review Formedible builder integration guidance.',
  },
  {
    id: 'ai-builder',
    label: 'AI Builder',
    href: '/#ai-builder',
    description: 'Explore AI-assisted Formedible generation patterns.',
  },
];
