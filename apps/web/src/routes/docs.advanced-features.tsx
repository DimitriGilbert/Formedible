import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/advanced-features');

export const Route = createFileRoute('/docs/advanced-features')({
  head: () => routeHead,
  component: AdvancedFeaturesRoute,
});

function AdvancedFeaturesRoute() {
  return <GuidePageView pageId="advanced-features" />;
}
