import { formatPageTitle, siteMeta } from './site-meta';

export type SeoOptions = {
  readonly title?: string;
  readonly description?: string;
  readonly path?: string;
  readonly imagePath?: string;
};

type TitleMeta = {
  readonly title: string;
};

type CharsetMeta = {
  readonly charSet: 'utf-8';
};

type NamedMeta = {
  readonly name: string;
  readonly content: string;
};

type PropertyMeta = {
  readonly property: string;
  readonly content: string;
};

type LinkDescriptor = {
  readonly rel: string;
  readonly href: string;
};

export type SeoMeta = TitleMeta | CharsetMeta | NamedMeta | PropertyMeta;

export type SeoHead = {
  readonly meta: SeoMeta[];
  readonly links: LinkDescriptor[];
};

function normalizePath(path: string): string {
  if (path === '/') {
    return '/';
  }

  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function absoluteUrl(path: string): string {
  return `${siteMeta.siteUrl}${normalizePath(path)}`;
}

export function createSeoHead(options: SeoOptions = {}): SeoHead {
  const pageTitle = formatPageTitle(options.title);
  const description = options.description ?? siteMeta.description;
  const canonicalUrl = absoluteUrl(options.path ?? '/');
  const imageUrl = absoluteUrl(options.imagePath ?? '/og-image.png');

  return {
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: siteMeta.themeColor },
      { title: pageTitle },
      { name: 'description', content: description },
      { property: 'og:site_name', content: siteMeta.name },
      { property: 'og:locale', content: siteMeta.locale },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: imageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: siteMeta.twitterSite },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl }],
  };
}
