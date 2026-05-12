import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/dynamic-text')({
  component: DynamicTextRoute,
});

function DynamicTextRoute() {
  return <GuidePageView pageId="dynamic-text" />;
}
