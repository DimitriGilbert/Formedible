import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/builder')({
  component: BuilderRoute,
});

function BuilderRoute() {
  return <GuidePageView pageId="builder" />;
}
