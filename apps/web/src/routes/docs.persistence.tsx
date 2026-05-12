import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/persistence')({
  component: PersistenceRoute,
});

function PersistenceRoute() {
  return <GuidePageView pageId="persistence" />;
}
