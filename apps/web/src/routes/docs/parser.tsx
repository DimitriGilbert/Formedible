import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/parser');

export const Route = createFileRoute('/docs/parser')({
  head: () => routeHead,
  component: ParserRoute,
});

function ParserRoute() {
  return (
    <DocsGuidePage
      eyebrow="Parser"
      title="Parse text or structured input into Formedible configuration."
      description="The parser surface is useful for migration and import workflows because output converges on the same UseFormedibleOptions-compatible model."
      sections={[
        {
          title: 'Migration input',
          body: 'Use parser utilities to convert legacy form descriptions, simple schemas, or generated text into candidate fields that can be reviewed.',
          bullets: ['Validate parsed field names before rendering.', 'Normalize option values into stable strings.', 'Keep migration review separate from production submission.'],
        },
        {
          title: 'Parser output',
          body: 'Parser output should be treated like builder output: a draft field model that becomes source only after review.',
          bullets: ['Reject unsupported field types early.', 'Apply product naming conventions.', 'Run route, docs, and build checks after adding parsed examples.'],
        },
      ]}
    />
  );
}
