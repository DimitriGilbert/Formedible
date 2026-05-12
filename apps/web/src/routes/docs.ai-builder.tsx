import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/ai-builder')({
  component: AiBuilderRoute,
});

function AiBuilderRoute() {
  return <GuidePageView pageId="ai-builder" />;
}
