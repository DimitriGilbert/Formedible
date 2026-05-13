import { createFileRoute, Outlet } from '@tanstack/react-router';

import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs');

export const Route = createFileRoute('/docs')({
  head: () => routeHead,
  component: DocsLayout,
});

function DocsLayout() {
  return <Outlet />;
}
