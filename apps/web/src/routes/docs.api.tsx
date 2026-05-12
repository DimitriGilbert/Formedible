import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/api')({
  component: ApiRoute,
});

function ApiRoute() {
  return <GuidePageView pageId="api" />;
}
