import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/builder');

export const Route = createFileRoute('/docs/builder')({
  head: () => routeHead,
  component: BuilderRoute,
});

function BuilderRoute() {
  return <GuidePageView pageId="builder" />;
}
