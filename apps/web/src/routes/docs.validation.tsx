import { createFileRoute } from '@tanstack/react-router';

import { GuidePageView } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/validation')({
  component: ValidationRoute,
});

function ValidationRoute() {
  return <GuidePageView pageId="validation" />;
}
