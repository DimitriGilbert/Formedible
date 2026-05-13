import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/api');

export const Route = createFileRoute('/docs/api')({
  head: () => routeHead,
  component: ApiRoute,
});

function ApiRoute() {
  return (
    <DocsGuidePage
      eyebrow="API reference"
      title="The practical map of the public Formedible docs API."
      description="UseFormedibleOptions is the main API: fields plus formOptions, then optional pages, tabs, progress, persistence, analytics, and labels."
      sections={[
        {
          title: 'useFormedible options',
          body: 'The hook accepts fields and formOptions as required inputs. formOptions owns defaultValues and onSubmit. Optional features layer on top without changing field names.',
          bullets: ['fields: readonly FormedibleFieldConfig[]', 'formOptions: defaultValues and optional onSubmit', 'schema, validation, asyncValidation, pages, tabs, progress, persistence, analytics'],
        },
        {
          title: 'Returned Form component',
          body: 'The hook returns a Form component ready to render. Pass className and aria-label when the surrounding page needs custom layout or a specific accessible name.',
          bullets: ['Use semantic page headings outside the form.', 'Keep submit, next, and previous labels product-specific.', 'Prefer consumer imports for all runtime docs examples.'],
        },
      ]}
    />
  );
}
