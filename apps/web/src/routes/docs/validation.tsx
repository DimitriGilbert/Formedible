import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/validation');

export const Route = createFileRoute('/docs/validation')({
  head: () => routeHead,
  component: ValidationRoute,
});

function ValidationRoute() {
  return (
    <DocsGuidePage
      eyebrow="Validation"
      title="Keep validation explicit at the schema, field, and workflow layers."
      description="Formedible passes validation concerns through the current TanStack Form integration while field-level helpers keep common UI feedback close to the field config."
      codeExampleIds={['typed-hook-usage']}
      sections={[
        {
          title: 'Schema and form validators',
          body: 'Use Zod or TanStack Form validators through formOptions when the full form needs a contract. Schema names should match field names exactly.',
          bullets: ['Keep defaultValues aligned with schema output.', 'Use enum defaults with literal values.', 'Return useful messages from validators rather than generic failures.'],
        },
        {
          title: 'Field, async, and cross-field rules',
          body: 'Field validation receives the value, current form values, and context. Async validation can debounce remote checks. Cross-field validation watches named fields together.',
          bullets: ['Return string messages for invalid values.', 'Use AbortSignal-aware async checks.', 'Keep conditionals boolean and deterministic.'],
        },
      ]}
    />
  );
}
