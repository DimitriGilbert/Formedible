import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/dynamic-text');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const registrationExample = { title: 'Live example: registration', description: 'Page 2 description reads {{firstName}} from page 1.', href: '/docs/examples?example=registration' };
const flowExample = { title: 'Live example: flow', description: 'Eight-step rental flow with tokens in labels and page descriptions.', href: '/docs/examples?example=flow' };
const rentalFlowExample = { title: 'Live example: rental flow', description: 'Nineteen-step rental flow with tokenized labels and conditional pages.', href: '/docs/examples?example=rental-flow' };

const sections = [
  {
    title: 'Token syntax',
    body: 'Dynamic text is handled by resolveDynamicText. The resolver only matches double-brace tokens made of word characters and dots, trims whitespace inside the braces, and reads values with getValueAtFieldPath.',
    bullets: [
      'Use {{firstName}} for top-level fields and {{address.city}} for nested object paths.',
      'Whitespace inside the token is accepted: {{ firstName }} resolves the same field as {{firstName}}.',
      'The regex is /\{\{\s*([\w.]+)\s*\}\}/g, so hyphenated token names are not part of the supported syntax.',
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
      sourceReference('Source: resolveDynamicText', 'packages/formedible/src/lib/formedible/dynamic-text.ts#L6-L15', 'Regex matching, field-path lookup, and nullish value behavior.'),
      sourceReference('Source: field-path lookup', 'packages/formedible/src/lib/formedible/field-path.ts', 'Nested dot-path value lookup used by dynamic text and string conditions.'),
      flowExample,
    ],
  },
  {
    title: 'Where tokens work',
    body: 'Tokens work only where useFormedible calls resolveDynamicText. Current source covers field label, field description, string placeholder, field section strings and objects, page title, page description, tab label, and tab description.',
    bullets: [
      'withDynamicText resolves field label, description, placeholder, and section before a field renders.',
      'renderPageHeader resolves page title and page description before passing them to FormProgress.',
      'FormTabs receives resolved label and description values for each visible tab.',
      'dynamicPlaceholder is a typed field flag, but the current resolver does not require the flag before resolving string placeholders.',
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
      sourceReference('Source: withDynamicText', 'packages/formedible/src/hooks/use-formedible.tsx#L155-L174', 'Field label, description, placeholder, and section resolution.'),
      sourceReference('Source: page and tab copy', 'packages/formedible/src/hooks/use-formedible.tsx#L309-L326', 'Page title and description resolution.'),
      sourceReference('Source: tab copy', 'packages/formedible/src/hooks/use-formedible.tsx#L384-L390', 'Tab label and description resolution.'),
    ],
  },
  {
    title: 'Resolution behavior',
    body: 'The resolver is intentionally narrow. It returns non-string ReactNode values unchanged, replaces missing or null values with an empty string, and stringifies present values.',
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
      sourceReference('Test: rental dynamic text', 'tests/formedible/phase10-behavior.test.ts#L167-L186', 'Asserts token interpolation and conditional navigation for rental flow evidence.'),
      sourceReference('Test: advanced flow dynamic text', 'tests/formedible/advanced-fields.test.tsx#L229-L242', 'Asserts interpolated page copy and conditional destination behavior.'),
    ],
  },
  {
    title: 'Practical patterns',
    body: 'The examples use tokens for short context: a name in the next page description, a destination in later labels, and a selected car type in the extras step. Keep tokenized copy close to the field that supplied the value.',
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
  { page: 7, title: 'Extras', description: 'Add any extras to make your {{carType}} more comfortable' },
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
