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
      title="Ship your first Formedible form from copied app code."
      description="Start with a TanStack Start app, add the shadcn surface, then build a typed form that you can edit like the rest of your UI."
      codeExampleIds={['shadcn-install-surface', 'typed-hook-usage']}
      related={[
        { title: 'Fields', description: 'See each supported field type, options shape, and nested array or object pattern.', href: '/docs/fields' },
        { title: 'Validation', description: 'Wire Zod, field rules, async checks, and cross-field validation into the same form config.', href: '/docs/validation' },
        { title: 'API', description: 'Map the hook options, returned Form component, labels, persistence, analytics, pages, and tabs.', href: '/docs/api' },
        { title: 'Examples', description: 'Open live forms that cover real Formedible behavior in the current app.', href: '/docs/examples' },
      ]}
      sections={[
        {
          title: 'Prerequisites',
          body: 'Bring Formedible into a project that already looks like the app you plan to ship. The install assumes a TanStack Start setup with shadcn ready to copy files into your source tree.',
          bullets: ['Use Node.js 18 or newer.', 'Use pnpm for the workspace commands shown in these docs.', 'Start from a TanStack Start project with shadcn initialized.'],
        },
        {
          title: 'Install the surface',
          body: 'Run the shadcn add command from your app. It copies the hook, field components, type helpers, layout pieces, and registry into your project instead of hiding them behind a package import.',
          bullets: ['Expect files under your components, hooks, and lib folders.', 'Keep imports pointed at the copied source in your app.', 'Treat generated fields like normal shadcn-style components: edit them when your product needs a different look.'],
        },
        {
          title: 'First form',
          body: 'Define the form values first, then create fields whose names match those keys. useFormedible returns a Form component that renders labels, errors, controls, and submit behavior for you.',
          bullets: ['Give every controlled field a defaultValue in formOptions.defaultValues.', 'Keep select and radio values as literal unions when you want stronger TypeScript checks.', 'Render <Form /> directly, or pass className and aria-label when the page needs more control.'],
        },
        {
          title: 'Add validation',
          body: 'For schema validation, create a Zod object and pass it as schema on the useFormedible options. Formedible builds the submit validator from that schema, so invalid values stay out of your submit handler.',
          bullets: ['Match schema keys to field names exactly.', 'Infer the values type from the schema when the schema is the source of truth.', 'Set defaults that satisfy the schema so the form starts in a valid shape where possible.'],
        },
        {
          title: 'Customize field UI',
          body: 'The copied components are yours. Update the local text field, select field, error block, or wrapper classes in source control, then use a per-field component override for one-off product UI.',
          bullets: ['Edit copied field components for design-system-wide changes.', 'Use the component prop when one field needs custom rendering.', 'Keep accessibility behavior from the base field when replacing visuals.'],
        },
        {
          title: 'Next steps',
          body: 'Once the first form works, move through the docs by the thing you want to change next: field shape, validation rules, hook options, or larger examples.',
          bullets: ['Fields explains supported types and nested data.', 'Validation covers schemas, field rules, async checks, and cross-field logic.', 'Examples shows live forms you can compare against your own implementation.'],
        },
      ]}
    />
  );
}
