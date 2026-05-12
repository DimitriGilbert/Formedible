import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/validation');

export const Route = createFileRoute('/docs/validation')({
  head: () => routeHead,
  component: ValidationRoute,
});

function ValidationRoute() {
  return <GuidePageView pageId="validation" />;
}
