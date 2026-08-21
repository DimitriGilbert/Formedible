import { formatPageTitle, getPublicRouteMeta, siteMeta, type PublicRoutePath } from './site-meta';

export type SeoOptions = {
  readonly title?: string;
  readonly description?: string;
  readonly path: string;
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
  readonly type?: string;
  readonly crossOrigin?: 'anonymous';
};

type ScriptDescriptor = {
  readonly type: 'application/ld+json';
  readonly children: string;
};

type JsonPrimitive = string | number | boolean | null;

type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type SeoMeta = TitleMeta | CharsetMeta | NamedMeta | PropertyMeta;

export type SeoHead = {
  readonly meta: SeoMeta[];
  readonly links: LinkDescriptor[];
  readonly scripts: ScriptDescriptor[];
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

function createOrganizationJsonLd(): JsonValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': siteMeta.organizationId,
    name: siteMeta.name,
    url: siteMeta.siteUrl,
    sameAs: [siteMeta.repositoryUrl],
  };
}

function createWebsiteJsonLd(): JsonValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': siteMeta.websiteId,
    name: siteMeta.name,
    url: siteMeta.siteUrl,
    inLanguage: 'en',
    publisher: { '@id': siteMeta.organizationId },
  };
}

function createBreadcrumbJsonLd(routePath: string, pageTitle: string): JsonValue {
  const normalizedPath = normalizePath(routePath);
  const segments = normalizedPath === '/' ? [] : normalizedPath.slice(1).split('/');
  const items: JsonValue[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: siteMeta.name,
      item: siteMeta.siteUrl,
    },
  ];

  let currentPath = '';

  for (const [index, segment] of segments.entries()) {
    currentPath = `${currentPath}/${segment}`;
    const isCurrentPage = index === segments.length - 1;
    const name = isCurrentPage
      ? pageTitle.replace(` · ${siteMeta.name}`, '')
      : segment.replaceAll('-', ' ').replace(/^\w/, (letter) => letter.toUpperCase());

    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name,
      item: absoluteUrl(currentPath),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@id': `${absoluteUrl(routePath)}#breadcrumb`,
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function createPageJsonLd(routePath: string, pageTitle: string, description: string, imageUrl: string): JsonValue {
  const canonicalUrl = absoluteUrl(routePath);
  const pageId = `${canonicalUrl}#page`;

  if (routePath === '/builder' || routePath === '/ai-builder') {
    return {
      '@context': 'https://schema.org',
      '@id': pageId,
      '@type': 'WebApplication',
      name: pageTitle,
      url: canonicalUrl,
      description,
      image: imageUrl,
      inLanguage: 'en',
      dateModified: siteMeta.lastModified,
      keywords: siteMeta.keywords,
      isPartOf: { '@id': siteMeta.websiteId },
      publisher: { '@id': siteMeta.organizationId },
      about: { '@id': siteMeta.softwareId },
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };
  }

  return {
    '@context': 'https://schema.org',
    '@id': routePath === '/' ? siteMeta.softwareId : pageId,
    '@type': routePath === '/' ? 'SoftwareSourceCode' : 'TechArticle',
    headline: pageTitle,
    name: pageTitle,
    url: canonicalUrl,
    description,
    image: imageUrl,
    inLanguage: 'en',
    dateModified: siteMeta.lastModified,
    keywords: siteMeta.keywords,
    mainEntityOfPage: canonicalUrl,
    isPartOf: { '@id': siteMeta.websiteId },
    publisher: { '@id': siteMeta.organizationId },
    about: { '@id': siteMeta.softwareId },
    ...(routePath === '/'
      ? {
          codeRepository: siteMeta.repositoryUrl,
          programmingLanguage: ['TypeScript', 'React'],
          runtimePlatform: 'Web',
        }
      : {}),
  };
}

function createSiteLinks(): LinkDescriptor[] {
  return [
    { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
    { rel: 'manifest', href: '/site.webmanifest' },
    { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
    { rel: 'preconnect', href: 'https://chemin.dbuild.dev', crossOrigin: 'anonymous' },
    { rel: 'dns-prefetch', href: 'https://chemin.dbuild.dev' },
  ];
}

function createOpenGraphImageMeta(imageUrl: string): SeoMeta[] {
  return [
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:alt', content: `${siteMeta.name} documentation preview` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
  ];
}

/**
 * Site-wide head, rendered by the root route on every page.
 *
 * Owns everything that never varies per page: viewport, robots policy,
 * site identity metas, sitemap/manifest/icon/preconnect links, and the
 * Organization + WebSite JSON-LD entities. The default title/description/
 * Open Graph/Twitter metas double as the fallback for pages without a
 * leaf-level head (for example the 404 fallback).
 *
 * Emits no canonical link and no page-entity JSON-LD — leaf routes own those.
 */
export function createRootHead(): SeoHead {
  const defaultTitle = formatPageTitle();
  const defaultDescription = siteMeta.description;
  const defaultImageUrl = absoluteUrl(siteMeta.ogImagePath);

  return {
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: siteMeta.themeColor },
      { name: 'application-name', content: siteMeta.name },
      { name: 'apple-mobile-web-app-title', content: siteMeta.name },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'keywords', content: siteMeta.keywords.join(', ') },
      { title: defaultTitle },
      { name: 'description', content: defaultDescription },
      { property: 'og:site_name', content: siteMeta.name },
      { property: 'og:locale', content: siteMeta.locale },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: defaultTitle },
      { property: 'og:description', content: defaultDescription },
      { property: 'og:url', content: siteMeta.siteUrl },
      ...createOpenGraphImageMeta(defaultImageUrl),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: siteMeta.twitterSite },
      { name: 'twitter:title', content: defaultTitle },
      { name: 'twitter:description', content: defaultDescription },
      { name: 'twitter:image', content: defaultImageUrl },
    ],
    links: createSiteLinks(),
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(createOrganizationJsonLd()),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(createWebsiteJsonLd()),
      },
    ],
  };
}

/**
 * Page-level head, rendered by leaf routes only.
 *
 * Owns everything that varies per page: title, description, the canonical
 * link, page-specific Open Graph/Twitter metas, and the page-entity +
 * breadcrumb JSON-LD. Site-wide metas and the Organization/WebSite entities
 * come from the root head and must not be repeated here — TanStack Router
 * concatenates links and scripts across matched routes, so duplicating them
 * would ship conflicting canonicals and repeated entities.
 */
export function createSeoHead(options: SeoOptions): SeoHead {
  const pageTitle = formatPageTitle(options.title);
  const description = options.description ?? siteMeta.description;
  const canonicalUrl = absoluteUrl(options.path);
  const imageUrl = absoluteUrl(options.imagePath ?? siteMeta.ogImagePath);

  return {
    meta: [
      { title: pageTitle },
      { name: 'description', content: description },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalUrl },
      ...createOpenGraphImageMeta(imageUrl),
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: imageUrl },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(createPageJsonLd(options.path, pageTitle, description, imageUrl)),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(createBreadcrumbJsonLd(options.path, pageTitle)),
      },
    ],
  };
}

export function createRouteSeoHead(path: PublicRoutePath): SeoHead {
  const routeMeta = getPublicRouteMeta(path);

  return createSeoHead({
    title: routeMeta.title,
    description: routeMeta.description,
    path: routeMeta.path,
  });
}
