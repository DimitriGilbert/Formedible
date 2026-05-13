import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/getting-started');

export const Route = createFileRoute('/docs/getting-started')({
  head: () => routeHead,
  component: GettingStartedRoute,
});

function GettingStartedRoute() {
  return (
    <DocsGuidePage
      eyebrow="Start here"
      title="Create a Formedible form from app-local source."
      description="Use the copied hook and components inside the web app, keep imports on consumer paths, and let TanStack Form own form state."
      codeExampleIds={['shadcn-install-surface', 'typed-hook-usage']}
      sections={[
        {
          title: 'Install and import from the consumer app',
          body: 'The rebuilt docs describe Formedible as source that lives in the app. Runtime examples import from @/hooks, @/components, and @/lib/formedible instead of package-era paths.',
          bullets: ['Run the shadcn add command for generated source.', 'Keep field UI customizable in the app tree.', 'Use type-only imports for shared configuration types.'],
        },
        {
          title: 'Define values before fields',
          body: 'Start with a values type or a Zod schema, then create fields whose names match those values. The hook returns a Form component that renders labels, errors, layout, and submission UI.',
          bullets: ['Set defaultValues for every controlled value.', 'Pass validators through formOptions when using schemas.', 'Render <Form className="space-y-4" /> when you need layout control.'],
        },
      ]}
    />
  );
}
