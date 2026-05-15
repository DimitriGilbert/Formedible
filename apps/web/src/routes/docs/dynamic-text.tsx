import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/dynamic-text');

const sections = [
  {
    title: 'Token syntax',
    body: 'Wrap a field path in double braces and Formedible swaps it with the current value. Plain field names use {{fieldName}}. Spaces inside the braces are fine, so {{ firstName }} resolves the same way. For object values, use dot paths such as {{address.city}}.',
    bullets: [
      'Use the field name from your config: {{firstName}}, {{pickupDate}}, or {{address.city}}.',
      'Whitespace next to the token name is trimmed before lookup.',
      'Nested paths follow the same dot-path lookup used by fields and conditions.',
    ],
  },
  {
    title: 'Where tokens work',
    body: 'Dynamic text is resolved while the hook prepares visible field and section config. Put tokens where copy helps the next step feel connected to earlier answers, not in text that must stay fixed for legal or support reasons.',
    bullets: [
      'Field label, description, and placeholder strings can read current values.',
      'Section objects can use tokens in section.title and section.description.',
      'dynamicPlaceholder marks generated or parsed field configs that treat placeholder text as value-driven hint copy.',
    ],
  },
  {
    title: 'Resolution behavior',
    body: 'The resolver is deliberately small. It only rewrites strings, and it leaves richer ReactNode content alone so custom labels, icons, links, and formatted help blocks keep their shape.',
    bullets: [
      'null and undefined values resolve to an empty string.',
      'Numbers, booleans, dates, and other present values are stringified.',
      'Non-string ReactNodes pass through unchanged.',
    ],
  },
  {
    title: 'Practical patterns',
    body: 'The best dynamic copy is short and useful. Use it to repeat a name, location, date, or choice that the person just gave you, then keep the rest of the instruction stable.',
    bullets: [
      'Personalized labels: “What time should we pick up {{firstName}}?”',
      'Conditional descriptions: pair tokens with conditional fields so the copy appears only after the source answer exists.',
      'Dynamic hints: “Search near {{address.city}}” works well as a placeholder after the city step.',
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options, field config types, and form-level copy entry points.', href: '/docs/api' },
  { title: 'Fields', description: 'Field labels, descriptions, placeholders, sections, and dynamicPlaceholder.', href: '/docs/fields' },
  { title: 'Examples', description: 'Browse all interactive examples and live Formedible demos.', href: '/docs/examples' },
  { title: 'Vacation Car Rental Flow', description: 'Open the compact dynamic-label rental flow in the examples browser.', href: '/docs/examples?example=flow' },
  { title: 'Rental Car Flow Form', description: 'Open the longer rental flow with dynamic text across conditional steps.', href: '/docs/examples?example=rental-flow' },
] satisfies readonly DocsGuideLink[];

export const Route = createFileRoute('/docs/dynamic-text')({
  head: () => routeHead,
  component: DynamicTextRoute,
});

function DynamicTextRoute() {
  return (
    <DocsGuidePage
      eyebrow="Dynamic text"
      title="Personalize labels and page copy with template interpolation."
      description="Labels, descriptions, input hints, and page descriptions can include tokens such as {{firstName}} that resolve from current form values."
      sections={sections}
      related={relatedLinks}
    />
  );
}
