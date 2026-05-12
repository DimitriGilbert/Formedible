import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/parser');

export const Route = createFileRoute('/docs/parser')({
  head: () => routeHead,
  component: ParserRoute,
});

function ParserRoute() {
  return <GuidePageView pageId="parser" />;
}
