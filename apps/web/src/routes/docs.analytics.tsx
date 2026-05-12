import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/analytics')({
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return <GuidePageView pageId="analytics" />;
}
