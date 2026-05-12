import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/advanced-features')({
  component: AdvancedFeaturesRoute,
});

function AdvancedFeaturesRoute() {
  return <GuidePageView pageId="advanced-features" />;
}
