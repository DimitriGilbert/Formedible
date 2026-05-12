import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/ai-builder');

export const Route = createFileRoute('/docs/ai-builder')({
  head: () => routeHead,
  component: AiBuilderRoute,
});

function AiBuilderRoute() {
  return <GuidePageView pageId="ai-builder" />;
}
