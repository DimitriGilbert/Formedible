import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/404')({
  component: StaticFallbackRoute,
});

function StaticFallbackRoute() {
  return <div>Not Found</div>;
}
