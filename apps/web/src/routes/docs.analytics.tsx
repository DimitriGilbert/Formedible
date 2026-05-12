import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/analytics');

export const Route = createFileRoute('/docs/analytics')({
  head: () => routeHead,
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return <GuidePageView pageId="analytics" />;
}
