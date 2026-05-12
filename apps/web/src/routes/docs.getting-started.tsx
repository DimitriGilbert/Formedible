import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/getting-started')({
  component: GettingStartedRoute,
});

function GettingStartedRoute() {
  return <GuidePageView pageId="getting-started" />;
}
