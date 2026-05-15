import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/dynamic-text');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const registrationExample = { title: 'Live example: registration', description: 'Page 2 copy reads {{firstName}} from page 1.', href: '/docs/examples?example=registration' };
const flowExample = { title: 'Live example: flow', description: 'Eight-step rental flow with tokens in labels and page descriptions.', href: '/docs/examples?example=flow' };
const rentalFlowExample = { title: 'Live example: rental flow', description: 'Nineteen-step rental flow with tokenized labels and conditional pages.', href: '/docs/examples?example=rental-flow' };

const sections = [
  {
    title: 'Token syntax',
    body: 'Dynamic text runs through resolveDynamicText. It matches double-brace tokens made of word characters and dots, trims spaces inside the braces, and reads values with getValueAtFieldPath.',
    bullets: [
      'Use {{firstName}} for top-level fields and {{address.city}} for nested paths.',
      '{{ firstName }} and {{firstName}} resolve the same field.',
      'The regex is /\{\{\s*([\w.]+)\s*\}\}/g, so token names cannot contain hyphens.',
    ],
    snippet: {
      title: 'Supported token syntax',
      language: 'tsx',
      code: `fields: [
  { name: 'firstName', type: 'text', label: 'First name', page: 1 },
  { name: 'destination', type: 'text', label: 'Where are you heading, {{firstName}}?', page: 2 },
  { name: 'city', type: 'text', placeholder: 'Search near {{ address.city }}' },
];`,
    },
    references: [
      sourceReference('Source: resolveDynamicText', 'packages/formedible/src/lib/formedible/dynamic-text.ts#L6-L15', 'Regex matching, field-path lookup, and nullish value handling.'),
      sourceReference('Source: field-path lookup', 'packages/formedible/src/lib/formedible/field-path.ts', 'Nested dot-path lookup used by dynamic text and string conditions.'),
      flowExample,
    ],
  },
  {
    title: 'Where tokens work',
    body: 'Tokens work only where useFormedible calls resolveDynamicText. That includes field labels, descriptions, input hints, sections, page copy, and tab copy.',
    bullets: [
      'withDynamicText resolves field label, description, input hint, and section before render.',
      'renderPageHeader resolves page title and page description before FormProgress receives them.',
      'FormTabs receives resolved label and description values for every visible tab.',
      'dynamicPlaceholder is typed, but string input hints resolve even when the flag is not set.',
    ],
    snippet: {
      title: 'Supported config locations',
      language: 'tsx',
      code: `const { Form } = useFormedible({
  fields: [
    {
      name: 'destination',
      type: 'radio',
      label: 'Where are you going, {{name}}?',
      description: 'We will personalize the next steps for {{name}}.',
      placeholder: 'Search near {{destination}}',
      section: { title: 'Trip for {{name}}', description: 'Destination: {{destination}}' },
      page: 2,
      tab: 'trip',
    },
  ],
  pages: [{ page: 2, title: 'Hello {{name}}', description: 'Trip to {{destination}}' }],
  tabs: [{ id: 'trip', label: 'Trip for {{name}}', description: '{{destination}} details' }],
  formOptions: { defaultValues, onSubmit },
});`,
    },
    references: [
      sourceReference('Source: withDynamicText', 'packages/formedible/src/hooks/use-formedible.tsx#L155-L174', 'Field label, description, input hint, and section resolution.'),
      sourceReference('Source: page copy', 'packages/formedible/src/hooks/use-formedible.tsx#L309-L326', 'Page title and description resolution.'),
      sourceReference('Source: tab copy', 'packages/formedible/src/hooks/use-formedible.tsx#L384-L390', 'Tab label and description resolution.'),
    ],
  },
  {
    title: 'Resolution behavior',
    body: 'The resolver is narrow on purpose. Non-string ReactNode values pass through unchanged, missing values become an empty string, and present values are stringified.',
    bullets: [
      'resolveDynamicText(text, values) returns text immediately when typeof text is not string.',
      'For a matched token, undefined and null become an empty string.',
      'Present values are converted with String(value), so numbers and booleans render as text.',
    ],
    snippet: {
      title: 'Resolver behavior from source',
      language: 'ts',
      code: `resolveDynamicText('Hello {{firstName}}', { firstName: 'Mina' });
// 'Hello Mina'

resolveDynamicText('City: {{address.city}}', { address: { city: 'Lisbon' } });
// 'City: Lisbon'

resolveDynamicText('Missing: {{middleName}}', { firstName: 'Mina' });
// 'Missing: '

resolveDynamicText(<strong>Fixed label</strong>, { firstName: 'Mina' });
// returns the ReactNode unchanged`,
    },
    references: [
      sourceReference('Source: resolveDynamicText', 'packages/formedible/src/lib/formedible/dynamic-text.ts#L6-L15', 'Non-string passthrough, token lookup, and stringification.'),
      sourceReference('Test: rental dynamic text', 'tests/formedible/phase10-behavior.test.ts#L167-L186', 'Checks token interpolation and conditional navigation in the rental flow.'),
      sourceReference('Test: advanced flow dynamic text', 'tests/formedible/advanced-fields.test.tsx#L229-L242', 'Checks interpolated page copy and conditional destination behavior.'),
    ],
  },
  {
    title: 'Practical patterns',
    body: 'Use tokens for small bits of context: a name in the next page, a destination in later labels, or a car type in an extras step. Keep tokenized copy near the field that collects the value.',
    bullets: [
      'Registration page 2 uses description: "How can we reach you {{firstName}} ?" after firstName is collected on page 1.',
      'The flow example uses labels such as "Hi {{name}}! Where are you headed for vacation?" and "Any extras for your {{carType}}?".',
      'The rental-flow example uses conditional pages and labels such as "What special accommodations does {{firstName}} need?" and "Where should we send {{firstName}}\'s {{destination}} rental confirmation?".',
    ],
    snippet: {
      title: 'Patterns copied from live examples',
      language: 'tsx',
      code: `pages: [
  { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}} ?' },
  { page: 7, title: 'Extras', description: 'Choose extras to make your {{carType}} more comfortable' },
],
fields: [
  { name: 'destination', type: 'radio', label: 'Hi {{name}}! Where are you headed for vacation?', page: 2 },
  { name: 'extras', type: 'multiSelect', label: 'Any extras for your {{carType}}?', page: 7 },
  { name: 'email', type: 'email', label: "Where should we send {{firstName}}'s {{destination}} rental confirmation?", page: 19 },
];`,
    },
    references: [
      sourceReference('Example source: registration', 'apps/web/src/components/docs/examples/registration-form.tsx', 'Dynamic firstName page description in a three-step form.'),
      sourceReference('Example source: flow', 'apps/web/src/components/docs/examples/flow-form.tsx', 'Dynamic labels and page descriptions across the compact rental flow.'),
      sourceReference('Example source: rental flow', 'apps/web/src/components/docs/examples/rental-car-flow-form.tsx', 'Tokenized labels in a longer conditional rental flow.'),
      registrationExample,
      flowExample,
      rentalFlowExample,
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options, field config types, and form-level copy entry points.', href: '/docs/api' },
  { title: 'Fields', description: 'Field labels, descriptions, input hints, sections, and dynamicPlaceholder.', href: '/docs/fields' },
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
      title="Personalize labels and page copy with template tokens."
      description="Labels, descriptions, input hints, and page descriptions can include tokens such as {{firstName}} that read from current form values."
      sections={sections}
      related={relatedLinks}
    />
  );
}
