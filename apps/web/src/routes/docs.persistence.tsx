import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/docs/persistence');

export const Route = createFileRoute('/docs/persistence')({
  head: () => routeHead,
  component: PersistenceRoute,
});

function PersistenceRoute() {
  return <GuidePageView pageId="persistence" />;
}
