import { createFileRoute } from '@tanstack/react-router';

import { DocsHub } from '@/docs/core-pages';

export const Route = createFileRoute('/docs/')({
  component: DocsHub,
});
