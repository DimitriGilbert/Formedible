import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/getting-started');

export const Route = createFileRoute('/docs/getting-started')({
  head: () => routeHead,
  component: GettingStartedRoute,
});

function GettingStartedRoute() {
  return <GuidePageView pageId="getting-started" />;
}
