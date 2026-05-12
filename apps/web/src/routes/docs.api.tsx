import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/api');

export const Route = createFileRoute('/docs/api')({
  head: () => routeHead,
  component: ApiRoute,
});

function ApiRoute() {
  return <GuidePageView pageId="api" />;
}
