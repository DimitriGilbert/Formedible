export const siteMeta = {
  name: 'Formedible',
  title: 'Formedible Docs',
  titleTemplate: '%s · Formedible',
  description:
    'Production-ready Formedible documentation with real shadcn-compatible form examples, builder guidance, and AI Builder workflows.',
  siteUrl: 'https://formedible.dev',
  locale: 'en_US',
  themeColor: '#09090b',
  twitterSite: '@formedible',
} as const;

export function formatPageTitle(title?: string): string {
  if (!title || title === siteMeta.title) {
    return siteMeta.title;
  }

  return siteMeta.titleTemplate.replace('%s', title);
}
