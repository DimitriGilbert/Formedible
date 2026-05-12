import { createFileRoute } from '@tanstack/react-router';

import { DocsHub } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs');

export const Route = createFileRoute('/docs')({
  head: () => routeHead,
  component: DocsHub,
});
