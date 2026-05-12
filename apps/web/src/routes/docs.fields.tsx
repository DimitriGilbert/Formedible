import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/fields')({
  component: FieldsRoute,
});

function FieldsRoute() {
  return <GuidePageView pageId="fields" />;
}
