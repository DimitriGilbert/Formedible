import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/builder');

export const Route = createFileRoute('/docs/builder')({
  head: () => routeHead,
  component: BuilderRoute,
});

function BuilderRoute() {
  return (
    <DocsGuidePage
      eyebrow="Builder"
      title="Mount the visual builder as a first-party app surface."
      description="The builder lets teams compose fields, preview output, and copy generated configuration without leaving consumer-owned source paths."
      codeExampleIds={['builder-imports']}
      sections={[
        {
          title: 'Review generated configuration',
          body: 'Treat the builder as a drafting tool. Generated config should be reviewed, typed, and checked into product code when it becomes part of the application.',
          bullets: ['Keep generated output visible.', 'Preview with the same renderer used in production.', 'Add product-specific persistence around the builder shell.'],
        },
        {
          title: 'Builder data shape',
          body: 'Builder state maps to the same fields, pages, tabs, persistence, and analytics options used by useFormedible.',
          bullets: ['Normalize option labels before review.', 'Keep custom fields documented in the registry.', 'Use generated code as a starting point, not an opaque artifact.'],
        },
      ]}
    />
  );
}
