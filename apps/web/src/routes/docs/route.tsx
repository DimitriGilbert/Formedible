import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
});

function DocsLayout() {
  return <Outlet />;
}
