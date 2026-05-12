import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/parser')({
  component: ParserRoute,
});

function ParserRoute() {
  return <GuidePageView pageId="parser" />;
}
