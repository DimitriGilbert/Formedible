import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/fields');

export const Route = createFileRoute('/docs/fields')({
  head: () => routeHead,
  component: FieldsRoute,
});

function FieldsRoute() {
  return <GuidePageView pageId="fields" />;
}
