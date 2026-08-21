import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/advanced-features');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const registrationExample = { title: 'Live example: registration', description: 'Three-page registration form with progress and page copy that uses earlier answers.', href: '/docs/examples?example=registration' };
const tabbedExample = { title: 'Live example: tabbed', description: 'Settings form split into personal, preferences, and settings tabs.', href: '/docs/examples?example=tabbed' };
const conditionalPagesExample = { title: 'Live example: conditional pages', description: 'Application form where pages 2, 3, and 5 appear only for matching answers.', href: '/docs/examples?example=conditional-pages' };
const surveyExample = { title: 'Live example: dynamic survey', description: 'Country-specific choices with follow-up questions that appear when needed.', href: '/docs/examples?example=survey' };

const sections = [
  {
    title: 'Multi-page forms',
    body: 'Pages come from the fields. Formedible reads each field page, checks page conditions, and keeps pages that still have a visible field.',
    bullets: [
      'Set page?: number on a field; fields without page land on page 1.',
      'Use FormediblePageConfig for the page title, description, and optional condition.',
      'useFormedible returns currentPage, totalPages, visiblePages, navigation helpers, and progressValue.',
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
      sourceReference('Source: use-multi-page.ts', 'packages/formedible/src/hooks/use-multi-page.ts#L33-L53', 'Visible page filtering, page 1 fallback, and progressValue calculation.'),
      sourceReference('Types: FormediblePageConfig', 'packages/formedible/src/lib/formedible/types.ts#L456-L462', 'Page number, title, description, and conditional fields.'),
      registrationExample,
    ],
  },
  {
    title: 'Tabbed forms',
    body: 'Tabs group the same field list in a different way. A tab shows only when its condition passes and at least one visible field uses that tab id.',
    bullets: [
      'tabs: [\'personal\'] works because normalizeTabs turns strings into { id, label } objects.',
      'If tabs is missing, Formedible infers tab ids from field.tab.',
      'Tab labels and descriptions can use dynamic text tokens.',
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
      sourceReference('Source: use-form-tabs.ts', 'packages/formedible/src/hooks/use-form-tabs.ts#L24-L99', 'Tab normalization, inferred tabs, visible tab filtering, and active tab repair.'),
      sourceReference('Test: tabbed grouping', 'tests/formedible/phase10-behavior.test.ts#L151-L165', 'Checks that the tabbed example groups fields by configured tab ids.'),
      tabbedExample,
    ],
  },
  {
    title: 'Progress indicators',
    body: 'Progress is read-only display state. useMultiPage calculates the current visible step, then FormProgress receives the title, description, value, and display flags.',
    bullets: [
      'progressValue is 100 when one visible page exists.',
      'With multiple visible pages, progressValue is the current visible-page index divided by the last visible-page index, multiplied by 100.',
      'Page titles and descriptions resolve dynamic text before FormProgress receives them.',
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
      sourceReference('Source: use-formedible.tsx', 'packages/formedible/src/hooks/use-formedible.tsx#L857-L877', 'renderPageHeader passing progress props and resolved page copy.'),
      sourceReference('Source: use-multi-page.ts', 'packages/formedible/src/hooks/use-multi-page.ts#L48-L53', 'Visible page count and progressValue formula.'),
      conditionalPagesExample,
    ],
  },
  {
    title: 'Conditional UI',
    body: 'Fields, pages, and tabs share the same conditional shape. A string checks whether a field path is truthy; a function gets current values and returns a boolean.',
    bullets: [
      'conditionMatches handles page and tab conditions; shouldRenderField handles field conditions.',
      'String conditions call getValueAtFieldPath, then coerce the result with Boolean.',
      'Function conditions are best for branches like individual, business, and premium paths.',
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
      sourceReference('Source: conditionMatches', 'packages/formedible/src/hooks/use-multi-page.ts#L26-L31', 'String-path and function condition checks.'),
      sourceReference('Source: field render condition', 'packages/formedible/src/hooks/use-formedible.tsx#L360-L362', 'Field-level conditional checks before rendering.'),
      conditionalPagesExample,
    ],
  },
  {
    title: 'Dynamic options',
    body: 'Choice fields accept a static option list or an option function. Select, radio, combobox, autocomplete, and multi-select fields call the function with current values before rendering.',
    bullets: [
      'options can be readonly FormedibleFieldOption[] or (values) => readonly FormedibleFieldOption[].',
      'resolveFieldOptions maps string options to { value, label } objects.',
      'Use an option function for cases like country-based state or province lists.',
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
      sourceReference('Source: resolveFieldOptions', 'packages/formedible/src/components/formedible/fields/advanced-field-utils.ts#L13-L20', 'Function options called with form values and normalized for renderers.'),
      sourceReference('Types: field options', 'packages/formedible/src/lib/formedible/types.ts#L292-L293', 'The FormedibleFieldConfig options type.'),
      surveyExample,
    ],
  },
  {
    title: 'Auto-submit',
    body: 'Auto-submit lives in useFormedible, not in each field. On change, Formedible updates TanStack Form, calls formOptions.onChange, and schedules a debounced submit when autoSubmitOnChange is true.',
    bullets: [
      'Each new change clears the previous timeout before scheduling the next submit.',
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
      sourceReference('Source: auto-submit scheduler', 'packages/formedible/src/hooks/use-formedible.tsx#L259-L271', 'Timeout cleanup, debounce, and form.handleSubmit scheduling.'),
      sourceReference('Source: field onChange path', 'packages/formedible/src/hooks/use-formedible.tsx#L646-L656', 'The field onChange path calling scheduleAutoSubmit.'),
      sourceReference('Test: autoSubmitOnChange', 'tests/formedible/basic-fields.test.tsx#L661-L724', 'Runtime test for debounced submission and unmount cleanup.'),
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options and type contracts for pages, tabs, progress, conditions, dynamic options, and auto-submit.', href: '/docs/api' },
  { title: 'Fields', description: 'Field config reference for page, tab, conditional, and function-based options.', href: '/docs/fields' },
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
      title="Build richer form flows from one field config."
      description="Pages, tabs, progress, conditional groups, dependent choices, and debounced submits all live in Formedible config. Add only the pieces your form needs."
      sections={sections}
      related={relatedLinks}
    />
  );
}
