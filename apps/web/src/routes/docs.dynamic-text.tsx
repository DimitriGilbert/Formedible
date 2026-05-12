import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/dynamic-text');

export const Route = createFileRoute('/docs/dynamic-text')({
  head: () => routeHead,
  component: DynamicTextRoute,
});

function DynamicTextRoute() {
  return <GuidePageView pageId="dynamic-text" />;
}
