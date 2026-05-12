import { createFileRoute } from '@tanstack/react-router';

import { DocsHome } from '@/docs/docs-home';

export const Route = createFileRoute('/')({
  component: DocsHome,
});
