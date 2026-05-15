import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/advanced-features');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const registrationExample = { title: 'Live example: registration', description: 'Three-page registration flow with progress and dynamic page copy.', href: '/docs/examples?example=registration' };
const tabbedExample = { title: 'Live example: tabbed', description: 'Settings form grouped by personal, preferences, and settings tabs.', href: '/docs/examples?example=tabbed' };
const conditionalPagesExample = { title: 'Live example: conditional pages', description: 'Application flow where pages 2, 3, and 5 depend on form values.', href: '/docs/examples?example=conditional-pages' };
const surveyExample = { title: 'Live example: dynamic survey', description: 'Country-specific select options and conditional follow-up questions.', href: '/docs/examples?example=survey' };

const sections = [
  {
    title: 'Multi-page forms',
    body: 'Pages are field-driven. The runtime collects page numbers from fields, applies optional page conditions, then keeps only pages with at least one visible field.',
    bullets: [
      'Field configs use page?: number; fields without page are treated as page 1 by getVisiblePageNumbers.',
      'FormediblePageConfig adds title, description, and conditional for the progress header and page filtering.',
      'The hook returns currentPage, totalPages, visiblePages, navigation helpers, and progressValue from useMultiPage.',
    ],
    snippet: {
      title: 'Page config backed by use-multi-page.ts',
      language: 'tsx',
      code: `const { Form, visiblePages, progressValue } = useFormedible({
  fields: [
    { name: 'firstName', type: 'text', page: 1 },
    { name: 'email', type: 'email', page: 2 },
    { name: 'plan', type: 'radio', page: 3, options: ['basic', 'pro'] },
  ],
  pages: [
    { page: 1, title: 'Personal Information' },
    { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}}?' },
    { page: 3, title: 'Preferences' },
  ],
  progress: { showSteps: true, showPercentage: true },
  formOptions: { defaultValues, onSubmit },
});`,
    },
    references: [
      sourceReference('Source: use-multi-page.ts', 'packages/formedible/src/hooks/use-multi-page.ts#L41-L69', 'Visible page filtering, fallback page 1, and progressValue calculation.'),
      sourceReference('Types: FormediblePageConfig', 'packages/formedible/src/lib/formedible/types.ts#L373-L379', 'The page, title, description, and conditional contract.'),
      registrationExample,
    ],
  },
  {
    title: 'Tabbed forms',
    body: 'Tabs are another grouping layer over the same fields. A tab is visible only when its own condition passes and it has at least one visible field assigned to that tab id.',
    bullets: [
      'normalizeTabs turns string entries into { id, label } objects, so tabs: [\'personal\'] is valid.',
      'When tabs are not provided, ids are inferred from field.tab values.',
      'FormedibleTabConfig supports id, label, description, and conditional; labels and descriptions also pass through dynamic text resolution during render.',
    ],
    snippet: {
      title: 'Tab ids match field.tab',
      language: 'tsx',
      code: `const { Form } = useFormedible({
  fields: [
    { name: 'firstName', type: 'text', tab: 'personal' },
    { name: 'theme', type: 'select', tab: 'preferences', options: ['light', 'dark', 'auto'] },
    { name: 'privacy', type: 'radio', tab: 'settings', options: ['public', 'private'] },
  ],
  tabs: [
    { id: 'personal', label: 'Personal' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'settings', label: 'Settings' },
  ],
  formOptions: { defaultValues, onSubmit },
});`,
    },
    references: [
      sourceReference('Source: use-form-tabs.ts', 'packages/formedible/src/hooks/use-form-tabs.ts#L19-L44', 'Tab normalization, inferred tabs, visible tab filtering, and active tab repair.'),
      sourceReference('Test: tabbed grouping', 'tests/formedible/phase10-behavior.test.ts#L151-L165', 'Asserts that the tabbed example groups fields by configured tab ids.'),
      tabbedExample,
    ],
  },
  {
    title: 'Progress indicators',
    body: 'Progress display reads the page state. It does not change page order; useMultiPage calculates the visible index, and FormProgress receives showSteps, showPercentage, title, description, and value.',
    bullets: [
      'progressValue is 100 when one visible page exists.',
      'With several visible pages, progressValue is current visible-page index divided by last visible-page index, multiplied by 100.',
      'Page titles and descriptions are resolved with dynamic text before they are passed to the progress component.',
    ],
    snippet: {
      title: 'Progress receives current visible step',
      language: 'tsx',
      code: `const currentStep = Math.max(visiblePages.indexOf(currentPage), 0) + 1;

<FormProgress
  currentPage={currentStep}
  totalPages={totalPages}
  value={progressValue}
  showSteps={config.progress?.showSteps}
  showPercentage={config.progress?.showPercentage}
  title={resolveDynamicText(pageConfig?.title, values)}
  description={resolveDynamicText(pageConfig?.description, values)}
/>;`,
    },
    references: [
      sourceReference('Source: use-formedible.tsx', 'packages/formedible/src/hooks/use-formedible.tsx#L309-L326', 'The renderPageHeader path that passes progress props and resolved page copy.'),
      sourceReference('Source: use-multi-page.ts', 'packages/formedible/src/hooks/use-multi-page.ts#L63-L69', 'Visible page count and progressValue formula.'),
      conditionalPagesExample,
    ],
  },
  {
    title: 'Conditional UI',
    body: 'The same conditional type is used by fields, pages, and tabs. A string checks truthiness at a field path; a function receives current values and returns a boolean.',
    bullets: [
      'conditionMatches handles page and tab conditions; shouldRenderField handles field conditions inside useFormedible.',
      'String conditions call getValueAtFieldPath and coerce the result with Boolean.',
      'Function conditions run against the current form values, which is how the conditional-pages example branches individual, business, and premium paths.',
    ],
    snippet: {
      title: 'Field and page conditions',
      language: 'tsx',
      code: `fields: [
  { name: 'applicationType', type: 'radio', page: 1, options: ['individual', 'business'] },
  { name: 'firstName', type: 'text', page: 2, conditional: (values) => values.applicationType === 'individual' },
  { name: 'companyName', type: 'text', page: 3, conditional: (values) => values.applicationType === 'business' },
  { name: 'premiumFeatures', type: 'multiSelect', page: 5, conditional: 'needsPremium' },
],
pages: [
  { page: 2, title: 'Personal Information', conditional: (values) => values.applicationType === 'individual' },
  { page: 3, title: 'Business Information', conditional: (values) => values.applicationType === 'business' },
  { page: 5, title: 'Premium Options', conditional: 'needsPremium' },
],`,
    },
    references: [
      sourceReference('Source: conditionMatches', 'packages/formedible/src/hooks/use-multi-page.ts#L26-L39', 'String path and function conditional evaluation.'),
      sourceReference('Source: field render condition', 'packages/formedible/src/hooks/use-formedible.tsx#L141-L153', 'Field-level conditional checks before rendering.'),
      conditionalPagesExample,
    ],
  },
  {
    title: 'Dynamic options',
    body: 'Option fields accept either a static list or a function. Built-in select, radio, combobox, autocomplete, and multi-select renderers resolve the function with current form values before normalizing options.',
    bullets: [
      'The options type is readonly FormedibleFieldOption[] or (values) => readonly FormedibleFieldOption[].',
      'resolveFieldOptions maps string options to { value, label } and returns an empty list when no option list is available.',
      'The survey example uses country to choose the state/province list.',
    ],
    snippet: {
      title: 'Country-dependent options',
      language: 'tsx',
      code: `const statesByCountry = {
  us: ['ca', 'ny', 'tx', 'fl'],
  ca: ['on', 'qc', 'bc', 'ab'],
  uk: ['england', 'scotland', 'wales', 'ni'],
  au: ['nsw', 'vic', 'qld', 'wa'],
} as const;

fields: [
  { name: 'country', type: 'select', options: ['us', 'ca', 'uk', 'au'] },
  {
    name: 'state',
    type: 'select',
    conditional: (values) => values.country !== undefined && values.country !== '',
    options: (values) => statesByCountry[String(values.country) as keyof typeof statesByCountry] ?? [],
  },
];`,
    },
    references: [
      sourceReference('Source: resolveFieldOptions', 'packages/formedible/src/components/formedible/fields/advanced-field-utils.ts#L13-L20', 'Function options are called with form values and normalized for renderers.'),
      sourceReference('Types: field options', 'packages/formedible/src/lib/formedible/types.ts#L224-L240', 'The FormedibleFieldConfig options type.'),
      surveyExample,
    ],
  },
  {
    title: 'Auto-submit',
    body: 'Auto-submit is implemented in useFormedible, not in individual fields. Every field onChange path updates TanStack Form, calls formOptions.onChange, then schedules a debounced form.handleSubmit when autoSubmitOnChange is true.',
    bullets: [
      'A new change clears the previous timeout before scheduling the next submit.',
      'autoSubmitDebounceMs controls the delay; useFormedible defaults to 300 ms.',
      'The unmount effect clears a pending auto-submit timeout.',
    ],
    snippet: {
      title: 'Debounced submit on change',
      language: 'tsx',
      code: `const { Form } = useFormedible({
  fields,
  autoSubmitOnChange: true,
  autoSubmitDebounceMs: 500,
  showSubmitButton: false,
  formOptions: {
    defaultValues,
    onSubmit: async ({ value }) => {
      await savePreferences(value);
    },
  },
});`,
    },
    references: [
      sourceReference('Source: auto-submit scheduler', 'packages/formedible/src/hooks/use-formedible.tsx#L49-L80', 'Timeout cleanup, debounce, and form.handleSubmit scheduling.'),
      sourceReference('Source: field onChange path', 'packages/formedible/src/hooks/use-formedible.tsx#L249-L255', 'The onChange path that calls scheduleAutoSubmit.'),
      sourceReference('Test: autoSubmitOnChange', 'tests/formedible/basic-fields.test.tsx#L445-L483', 'Runtime test for debounced submission and unmount cleanup.'),
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options and type contracts for pages, tabs, progress, conditions, dynamic options, and auto-submit.', href: '/docs/api' },
  { title: 'Fields', description: 'Field config reference, including page, tab, conditional, and function-based options.', href: '/docs/fields' },
  { title: 'Multi-Step Registration', description: 'Open the live multi-page registration flow in the examples browser.', href: '/docs/examples?example=registration' },
  { title: 'Tabbed Form Layout', description: 'Open the live tabbed settings-style form in the examples browser.', href: '/docs/examples?example=tabbed' },
  { title: 'Conditional Pages', description: 'Open the live conditional page flow in the examples browser.', href: '/docs/examples?example=conditional-pages' },
] satisfies readonly DocsGuideLink[];

export const Route = createFileRoute('/docs/advanced-features')({
  head: () => routeHead,
  component: AdvancedFeaturesRoute,
});

function AdvancedFeaturesRoute() {
  return (
    <DocsGuidePage
      eyebrow="Flows"
      title="Build rich form flows from the same field config."
      description="Pages, tabs, progress, conditional groups, dependent choices, and debounced submits all live in the Formedible config model. Add the behavior where the product needs it; leave the rest out."
      sections={sections}
      related={relatedLinks}
    />
  );
}
