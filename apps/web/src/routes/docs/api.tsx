import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/api');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/main';

const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

function docsExampleReference(title: string, example: string, description: string): DocsGuideLink {
  return { title, description, href: `/docs/examples?example=${example}` };
}

const relatedLinks = [
  { title: 'Fields', description: 'Field config, supported types, nested fields, and field-level validation.', href: '/docs/fields' },
  { title: 'Validation', description: 'Schema, inline, async, and cross-field validation patterns.', href: '/docs/validation' },
  { title: 'Persistence', description: 'Draft payload shape, restore behavior, storage choice, and live demo link.', href: '/docs/persistence' },
  { title: 'Analytics', description: 'Callback names, argument order, and emitted tracking points.', href: '/docs/analytics' },
  { title: 'Examples', description: 'Rendered forms that use the same hook and field model documented here.', href: '/docs/examples' },
] satisfies readonly DocsGuideLink[];

const useFormedibleSnippet = `import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';
import type { FormedibleFormValues } from '@/components/ui/formedible/lib/types';

interface ContactValues extends FormedibleFormValues {
  name: string;
  email: string;
}

const { Form, form } = useFormedible<ContactValues>({
  fields: [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
  ],
  formOptions: {
    defaultValues: { name: '', email: '' },
    onSubmit: ({ value }) => sendContact(value),
  },
});`;

const useFormedibleOptionsSnippet = `const formConfig = {
  fields: [
    { name: 'firstName', type: 'text', page: 1, tab: 'profile' },
    { name: 'agreeToTerms', type: 'checkbox', page: 2 },
  ],
  formOptions: {
    defaultValues: { firstName: '', agreeToTerms: false },
  },
  pages: [{ page: 1, title: 'Profile' }, { page: 2, title: 'Terms' }],
  tabs: ['profile'],
  progress: { showSteps: true, showPercentage: true },
  persistence: { key: 'signup-draft', exclude: ['agreeToTerms'], restoreOnMount: true },
  analytics: { onFormStart: (timestamp: number) => recordStart(timestamp) },
} satisfies UseFormedibleOptions<SignupValues>;`;

const formOptionsSnippet = `const formOptions = {
  defaultValues: { email: '', message: '' },
  onChange: ({ value, formApi }) => {
    previewDraft(value);
    formApi?.state.values.email.toLowerCase();
  },
  onSubmit: async ({ value, formApi }) => {
    await submitMessage(value);
    recordSubmittedEmail(formApi?.state.values.email ?? value.email);
  },
} satisfies FormedibleFormOptions<MessageValues>;`;

const returnValueSnippet = `const {
  Form,
  currentPage,
  totalPages,
  visiblePages,
  goToNextPage,
  goToPreviousPage,
  saveToStorage,
  loadFromStorage,
  clearStorage,
} = useFormedible<RegistrationValues>(registrationConfig);

function saveAndContinue() {
  saveToStorage();
  if (currentPage < totalPages) {
    goToNextPage();
  }
}

const restoredPayload = loadFromStorage();
const firstVisiblePage = visiblePages[0];
clearStorage();`;

const formComponentSnippet = `const { Form } = useFormedible<ContactValues>({
  fields,
  formOptions: {
    defaultValues: { name: '', email: '' },
    onSubmit: ({ value }) => sendContact(value),
  },
});

return (
  <Form
    id="contact-form"
    name="contact"
    className="rounded-xl border p-6"
    aria-label="Contact form"
    noValidate
    data-testid="contact-form"
    onInput={(event) => logNativeInput(event.currentTarget.name)}
  />
);`;

const fieldConfigSnippet = `const fields = [
  { name: 'email', type: 'email', label: 'Email', required: true },
  {
    name: 'skills',
    type: 'array',
    arrayConfig: {
      itemType: 'object',
      objectConfig: {
        fields: [{ name: 'name', type: 'text', label: 'Skill name' }],
      },
    },
  },
] satisfies readonly FormedibleFieldConfig<ProfileValues>[];`;

const persistenceSnippet = `const persistence = {
  key: 'contact-draft',
  storage: 'localStorage',
  debounceMs: 750,
  exclude: ['agreeToTerms'],
  restoreOnMount: true,
} satisfies FormediblePersistenceConfig<ContactValues>;`;

const analyticsSnippet = `const analytics = {
  onFormStart: (timestamp) => track('form_start', { timestamp }),
  onFieldChange: (fieldName, value, timestamp) => track('field_change', { fieldName, value, timestamp }),
  onPageChange: (fromPage, toPage, timeSpent, pageState) => track('page_change', { fromPage, toPage, timeSpent, pageState }),
  onFormComplete: (timeSpent, formData) => track('form_complete', { timeSpent, formData }),
  onFormAbandon: (completionPercentage, context) => track('form_abandon', { completionPercentage, context }),
} satisfies FormedibleAnalyticsConfig<RegistrationValues>;`;

const pagesTabsSnippet = `const pages = [
  { page: 1, title: 'Account' },
  { page: 2, title: 'Business', conditional: (values) => values.accountType === 'business' },
] satisfies readonly FormediblePageConfig<AccountValues>[];

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings', conditional: 'email' },
] satisfies readonly FormedibleTabConfig<AccountValues>[];`;

const sections = [
  {
    title: 'useFormedible hook',
    body: 'The hook is exported from the package source. Its generic defaults to FormedibleFormValues, which is Record<string, unknown>. The hook takes UseFormedibleOptions<TFormValues> and returns the rendered Form component plus helpers from the underlying hook stack.',
    bullets: [
      'Signature in source: useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(config: UseFormedibleOptions<TFormValues>).',
      'The implementation passes formOptions.defaultValues to TanStack Form and builds validators from schema, crossFieldValidation, asyncValidation, and each field config.',
      'The returned Form component is declared inside the hook, so it closes over config, form state, analytics, pages, tabs, and persistence helpers.',
    ],
    snippet: { title: 'Typed hook call', language: 'tsx', code: useFormedibleSnippet },
    references: [
      sourceReference('Hook source', 'packages/formedible/src/hooks/use-formedible.tsx#L28-L47', 'Signature, useForm setup, submit path, analytics completion, and persistence clearing.'),
      sourceReference('Options type', 'packages/formedible/src/lib/formedible/types.ts#L448-L480', 'The config object accepted by the hook.'),
      docsExampleReference('Contact example', 'contact', 'Small typed form using the hook and returned Form component.'),
    ],
  },
  {
    title: 'UseFormedibleOptions',
    body: 'This is the full public config shape used by useFormedible. fields and formOptions are required by the interface; every other entry is optional and only has runtime behavior where the hook or its child hooks read it.',
    bullets: [
      'Fields are normalized before rendering. Type aliases such as multiselect and colorPicker are compatibility inputs and normalize to the canonical renderer keys.',
      'Tabs win over pages for field filtering. In use-formedible.tsx, activeFields checks tabs first, pages second, then falls back to all fields.',
      'collapseLabel and expandLabel exist in the options type, but the hook source does not read them.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('fields', 'readonly FormedibleFieldConfig<TFormValues>[]', 'Required', 'Field definitions rendered by FieldRenderer after normalizeOptions.'),
        createPropertyRow('formOptions', 'FormedibleFormOptions<TFormValues>', 'Required', 'Default values plus submit/change/blur/focus/reset callbacks.'),
        createPropertyRow('schema', 'unknown', 'undefined', 'Standard-schema input passed to buildFormValidators and buildFieldValidators.'),
        createPropertyRow('crossFieldValidation', 'readonly FormedibleCrossFieldValidation<TFormValues>[]', 'undefined', 'Rules with fields and validator(values), used by form and field validators.'),
        createPropertyRow('asyncValidation', 'Partial<Record<Extract<keyof TFormValues, string> | string, FormedibleAsyncValidation<TFormValues>>>', 'undefined', 'Field-name keyed async validators passed into buildFieldValidators.'),
        createPropertyRow('pages', 'readonly FormediblePageConfig<TFormValues>[]', 'undefined', 'Page metadata consumed by useMultiPage and FormProgress.'),
        createPropertyRow('tabs', 'readonly (string | FormedibleTabConfig<TFormValues>)[]', 'undefined', 'Tab metadata consumed by useFormTabs and FormTabs.'),
        createPropertyRow('progress', 'FormedibleProgressConfig', 'undefined', 'showSteps and showPercentage passed to FormProgress.'),
        createPropertyRow('persistence', 'FormediblePersistenceConfig<TFormValues>', 'undefined', 'Draft save, load, restore, and clear config passed to useFormPersistence.'),
        createPropertyRow('analytics', 'FormedibleAnalyticsConfig<TFormValues>', 'undefined', 'Callbacks passed to useFormAnalytics.'),
        createPropertyRow('defaultComponents', 'Partial<Record<NormalizedFieldType, FormedibleFieldComponent<TFormValues>>>', 'undefined', 'Per-type component overrides passed to FieldRenderer.'),
        createPropertyRow('globalWrapper', 'FormedibleFieldWrapper<TFormValues>', 'undefined', 'Wrapper passed to FieldRenderer for rendered fields.'),
        createPropertyRow('submitLabel', 'ReactNode', "'Submit'", 'Label for the single submit button or final page navigation submit.'),
        createPropertyRow('nextLabel', 'ReactNode', "'Next'", 'Label for page navigation next button.'),
        createPropertyRow('previousLabel', 'ReactNode', "'Previous'", 'Label for page navigation previous button.'),
        createPropertyRow('onPageChange', "(page: number, direction: 'next' | 'previous') => void", 'undefined', 'Called after the analytics page-change call with destination page and direction.'),
        createPropertyRow('autoSubmitOnChange', 'boolean', 'false', 'When truthy, field changes schedule form.handleSubmit.'),
        createPropertyRow('autoSubmitDebounceMs', 'number', '300', 'Debounce for autoSubmitOnChange.'),
        createPropertyRow('disabled', 'boolean', 'false', 'Disables the fieldset and forces rendered field configs to disabled.'),
        createPropertyRow('loading', 'boolean', 'false', 'Sets aria-busy and disables controls.'),
        createPropertyRow('showSubmitButton', 'boolean', 'true', 'Set false to hide Formedible submit/navigation submit controls.'),
        createPropertyRow('onFormReset', 'FormedibleFormEventHandler<TFormValues>', 'undefined', 'Runs after the native reset prop and formOptions.onReset.'),
        createPropertyRow('onFormInput', 'FormedibleFormEventHandler<TFormValues>', 'undefined', 'Runs after the native onInput prop.'),
        createPropertyRow('onFormInvalid', 'FormedibleFormEventHandler<TFormValues>', 'undefined', 'Runs after the native onInvalid prop.'),
        createPropertyRow('onFormKeyDown', 'FormedibleFormEventHandler<TFormValues, KeyboardEvent>', 'undefined', 'Runs after the native onKeyDown prop.'),
        createPropertyRow('onFormKeyUp', 'FormedibleFormEventHandler<TFormValues, KeyboardEvent>', 'undefined', 'Runs after the native onKeyUp prop.'),
        createPropertyRow('onFormFocus', 'FormedibleFormEventHandler<TFormValues, FocusEvent>', 'undefined', 'Runs after the native onFocus prop.'),
        createPropertyRow('onFormBlur', 'FormedibleFormEventHandler<TFormValues, FocusEvent>', 'undefined', 'Runs after the native onBlur prop.'),
        createPropertyRow('collapseLabel', 'ReactNode', 'undefined', 'Typed compatibility label. The current hook source does not read it.'),
        createPropertyRow('expandLabel', 'ReactNode', 'undefined', 'Typed compatibility label. The current hook source does not read it.'),
        createPropertyRow('formClassName', 'string', 'undefined', 'Class name passed to FormLayout, not the native form element.'),
      ],
    },
    snippet: { title: 'Options groups in one config', language: 'tsx', code: useFormedibleOptionsSnippet },
    references: [
      sourceReference('UseFormedibleOptions interface', 'packages/formedible/src/lib/formedible/types.ts#L448-L480', 'Complete property list.'),
      sourceReference('Runtime reads in useFormedible', 'packages/formedible/src/hooks/use-formedible.tsx#L30-L443', 'Which options the hook reads and where they feed rendering.'),
      sourceReference('Type compatibility test', 'tests/formedible/types/options.test-d.ts#L12-L90', 'A compile-time config covering pages, tabs, persistence, analytics, labels, events, and formOptions.'),
      docsExampleReference('Registration pages example', 'registration', 'Example for pages, progress, navigation labels, and submit handling.'),
      docsExampleReference('Tabbed example', 'tabbed', 'Example for tabs and field tab ids.'),
      docsExampleReference('Persistence example', 'persistence', 'Example for persistence config.'),
      docsExampleReference('Analytics example', 'analytics', 'Example for analytics callbacks.'),
    ],
  },
  {
    title: 'Field config lookup',
    body: 'Field config is part of UseFormedibleOptions, but it deserves its own lookup because fields drive rendering, validation, pages, tabs, nested objects, and arrays.',
    bullets: [
      'Supported type strings are declared in FormedibleFieldType. NormalizedFieldType excludes the legacy aliases after normalization.',
      'Nested fields are carried through nestedFields, arrayConfig.objectConfig.fields, and objectConfig.fields.',
      'emailConfig is typed as never. Use schema or validation for email-specific rules.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('name', 'Extract<keyof TFormValues, string> | string', 'Required', 'Field path sent to TanStack Form.'),
        createPropertyRow('type', 'FormedibleFieldType', "'text' after normalization", 'Renderer key or compatibility alias.'),
        createPropertyRow('label / description / placeholder', 'ReactNode / ReactNode / string', 'undefined', 'Rendered field copy. Dynamic text is resolved at render time.'),
        createPropertyRow('disabled / required', 'boolean', 'false', 'Control state and built-in required validation input.'),
        createPropertyRow('page / tab / section', 'number / string / string | FormedibleFieldSection', 'undefined', 'Layout metadata consumed by pages, tabs, and section headers.'),
        createPropertyRow('conditional', 'string | ((values: TFormValues) => boolean)', 'undefined', 'Visibility condition checked against current values.'),
        createPropertyRow('options', 'readonly FormedibleFieldOption[] | ((values: TFormValues) => readonly FormedibleFieldOption[])', 'undefined', 'Static or values-derived options for option fields.'),
        createPropertyRow('nestedFields / arrayConfig / objectConfig', 'Nested field config objects', 'undefined', 'Nested object and array field configuration.'),
        createPropertyRow('validation / inlineValidation', 'FormedibleFieldValidation<TFormValues> / FormedibleInlineValidation<TFormValues>', 'undefined', 'Field-level sync, schema-like, and inline async validation config.'),
        createPropertyRow('component / wrapper', 'FormedibleFieldComponent<TFormValues> / FormedibleFieldWrapper<TFormValues>', 'undefined', 'Field-level rendering override and wrapper.'),
      ],
    },
    snippet: { title: 'Fields with nested array object config', language: 'tsx', code: fieldConfigSnippet },
    references: [
      sourceReference('FormedibleFieldType and field config', 'packages/formedible/src/lib/formedible/types.ts#L6-L284', 'Supported field types and field config properties.'),
      sourceReference('Render path', 'packages/formedible/src/hooks/use-formedible.tsx#L209-L265', 'FieldRenderer wiring, validators, and field controller callbacks.'),
      docsExampleReference('Arrays example', 'arrays', 'Example for arrayConfig and nested object fields.'),
      docsExampleReference('Contact example', 'contact', 'Minimal fields example.'),
    ],
  },
  {
    title: 'FormedibleFormOptions',
    body: 'formOptions is required. The hook reads defaultValues during useForm setup, then calls the lifecycle callbacks from submit and field events.',
    bullets: [
      'defaultValues is the only required property inside FormedibleFormOptions.',
      'onSubmit receives { value, formApi } after onFormComplete analytics and before persistence is cleared.',
      'onChange receives a shallow next value object for the changed field name, then auto-submit may be scheduled.',
      'onSubmitInvalid is typed as never in the source and locked by the options type test.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('defaultValues', 'TFormValues', 'Required', 'Initial values passed to useForm.'),
        createPropertyRow('onSubmit', '(context: FormedibleFormEventContext<TFormValues>) => void | Promise<void>', 'undefined', 'Submit callback with value and optional formApi context.'),
        createPropertyRow('onChange', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs from field onChange after TanStack field change and analytics field change tracking.'),
        createPropertyRow('onBlur', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs from field onBlur after field.handleBlur and analytics blur/error/complete tracking.'),
        createPropertyRow('onFocus', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs from field onFocus after analytics focus tracking.'),
        createPropertyRow('onReset', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs from the rendered form reset handler after native onReset.'),
        createPropertyRow('onSubmitInvalid', 'never', 'Unsupported', 'Removed helper. Type tests expect an error if it is supplied.'),
      ],
    },
    snippet: { title: 'Submit and change callbacks', language: 'tsx', code: formOptionsSnippet },
    references: [
      sourceReference('FormedibleFormOptions interface', 'packages/formedible/src/lib/formedible/types.ts#L361-L371', 'Source type for defaultValues and lifecycle callbacks.'),
      sourceReference('Submit and field callback wiring', 'packages/formedible/src/hooks/use-formedible.tsx#L39-L47', 'Submit path in useForm.'),
      sourceReference('Field event callback wiring', 'packages/formedible/src/hooks/use-formedible.tsx#L239-L255', 'Focus, blur, and change callback order.'),
      sourceReference('onSubmitInvalid type test', 'tests/formedible/types/options.test-d.ts#L128-L140', 'Compile-time evidence for removed onSubmitInvalid.'),
    ],
  },
  {
    title: 'Persistence config',
    body: 'Persistence stores a JSON payload with values, timestamp, and optionally currentPage. The hook returns manual save/load/clear helpers and also saves on value changes when persistence is configured.',
    bullets: [
      'Payload shape is { values: Partial<TFormValues>, timestamp: number, currentPage?: number }.',
      'Storage defaults to sessionStorage. localStorage is selected only when storage is localStorage; SSR returns no storage.',
      'restoreOnMount calls loadFromStorage in an effect. Value changes schedule saveToStorage after debounceMs ?? 500.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('key', 'string', 'Required', 'Storage key used for the persisted JSON payload.'),
        createPropertyRow('storage', "'localStorage' | 'sessionStorage'", "'sessionStorage'", 'Storage target selected by getConfiguredStorage.'),
        createPropertyRow('debounceMs', 'number', '500', 'Delay before value-change saves.'),
        createPropertyRow('exclude', 'readonly (Extract<keyof TFormValues, string> | string)[]', '[]', 'Top-level keys excluded from persisted values.'),
        createPropertyRow('restoreOnMount', 'boolean', 'false', 'Loads storage on mount and restores currentPage when stored currentPage is <= totalPages.'),
      ],
    },
    snippet: { title: 'Persistence option object', language: 'tsx', code: persistenceSnippet },
    references: [
      sourceReference('Persistence hook', 'packages/formedible/src/hooks/use-form-persistence.ts#L11-L165', 'Payload type, storage selection, save, load, clear, restore, and debounce effects.'),
      sourceReference('Persistence options type', 'packages/formedible/src/lib/formedible/types.ts#L395-L402', 'Config interface.'),
      sourceReference('Persistence behavior tests', 'tests/formedible/phase10-behavior.test.ts#L85-L149', 'Exclude behavior, payload shape, malformed payload handling, and storage defaults.'),
      docsExampleReference('Persistence example', 'persistence', 'Rendered persistence example.'),
    ],
  },
  {
    title: 'Analytics config',
    body: 'Analytics callbacks keep positional arguments. The current runtime emits form start, field focus/blur/change/complete/error, page change, form complete, form abandon, and reset.',
    bullets: [
      'onFormStart runs once from the analytics hook mount effect.',
      'Field events are emitted by FieldRenderer controller handlers in use-formedible.tsx.',
      'Page changes pass fromPage, toPage, timeSpent, and validation state for the page being left.',
      'Superseded page, tab, and performance callbacks are typed as never and are not emitted by the current runtime.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('onFormStart', '(timestamp: number) => void', 'undefined', 'Runs on mount.'),
        createPropertyRow('onFieldFocus', '(fieldName: string, timestamp: number) => void', 'undefined', 'Runs when a Formedible field receives focus.'),
        createPropertyRow('onFieldBlur', '(fieldName: string, timeSpent: number) => void', 'undefined', 'timeSpent is focus-derived; missing focus yields 0.'),
        createPropertyRow('onFieldChange', '(fieldName: string, value: unknown, timestamp: number) => void', 'undefined', 'Runs from field onChange.'),
        createPropertyRow('onFieldComplete', '(fieldName: string, isValid: boolean, timeSpent: number) => void', 'undefined', 'Runs on blur after errors are collected.'),
        createPropertyRow('onFieldError', '(fieldName: string, errors: readonly string[], timestamp: number) => void', 'undefined', 'Runs on blur when formatted errors exist.'),
        createPropertyRow('onPageChange', '(fromPage: number, toPage: number, timeSpent: number, pageValidationState?: { readonly hasErrors: boolean; readonly completionPercentage: number }) => void', 'undefined', 'Runs through useMultiPage changePage.'),
        createPropertyRow('onFormComplete', '(timeSpent: number, formData: TFormValues) => void', 'undefined', 'Runs before formOptions.onSubmit.'),
        createPropertyRow('onFormAbandon', '(completionPercentage: number, context?: AbandonContext) => void', 'undefined', 'Runs on unmount unless completion was tracked.'),
        createPropertyRow('onFormReset', '(timestamp: number, reason?: string) => void', 'undefined', 'Rendered form reset path passes reason reset.'),
      ],
    },
    snippet: { title: 'Analytics callbacks', language: 'tsx', code: analyticsSnippet },
    references: [
      sourceReference('Analytics hook', 'packages/formedible/src/hooks/use-form-analytics.ts#L52-L136', 'Runtime emissions and argument order.'),
      sourceReference('Analytics options type', 'packages/formedible/src/lib/formedible/types.ts#L404-L445', 'Current and superseded callbacks.'),
      sourceReference('Analytics behavior tests', 'tests/formedible/phase10-behavior.test.ts#L188-L245', 'Approved callbacks and positional argument expectations.'),
      docsExampleReference('Analytics example', 'analytics', 'Rendered analytics tracking example.'),
    ],
  },
  {
    title: 'Pages, tabs, and progress',
    body: 'Pages and tabs are separate routing modes inside the rendered form. If visible tabs exist, field filtering uses the active tab and page filtering is not used for the current render pass.',
    bullets: [
      'Visible pages come from field page numbers, sorted ascending, filtered by page conditional and field conditional. Empty results fall back to [1].',
      'progressValue is 100 for a single visible page. Multi-page flows use currentIndex / (totalPages - 1) * 100.',
      'Tabs normalize string tabs to { id, label }. If tabs are omitted, field tab ids create the tab list.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('FormediblePageConfig.page', 'number', 'Required', 'Page number matched by field.page.'),
        createPropertyRow('FormediblePageConfig.title', 'ReactNode', 'Required', 'Rendered in FormProgress for the current page.'),
        createPropertyRow('FormediblePageConfig.description', 'ReactNode', 'undefined', 'Rendered below the current page title.'),
        createPropertyRow('FormediblePageConfig.conditional', 'string | ((values: TFormValues) => boolean)', 'undefined', 'Hides the page when false.'),
        createPropertyRow('FormedibleTabConfig.id', 'string', 'Required', 'Matched by field.tab.'),
        createPropertyRow('FormedibleTabConfig.label', 'ReactNode', 'Required', 'Rendered as the tab label.'),
        createPropertyRow('FormedibleTabConfig.description', 'ReactNode', 'undefined', 'Rendered by FormTabs when present.'),
        createPropertyRow('FormedibleTabConfig.conditional', 'string | ((values: TFormValues) => boolean)', 'undefined', 'Hides the tab when false.'),
        createPropertyRow('FormedibleProgressConfig.showSteps', 'boolean', 'false', 'Shows step count text in FormProgress.'),
        createPropertyRow('FormedibleProgressConfig.showPercentage', 'boolean', 'false', 'Shows progress percentage text in FormProgress.'),
      ],
    },
    snippet: { title: 'Conditional pages and tabs', language: 'tsx', code: pagesTabsSnippet },
    references: [
      sourceReference('Multi-page hook', 'packages/formedible/src/hooks/use-multi-page.ts#L41-L115', 'Visible page calculation, navigation, and progress.'),
      sourceReference('Tabs hook', 'packages/formedible/src/hooks/use-form-tabs.ts#L19-L45', 'Tab normalization, visibility, and active tab reset.'),
      sourceReference('Conditional pages test', 'tests/formedible/phase10-behavior.test.ts#L58-L83', 'Expected visible page paths.'),
      sourceReference('Tabbed behavior test', 'tests/formedible/phase10-behavior.test.ts#L151-L165', 'Expected tab ids and field grouping.'),
      docsExampleReference('Conditional pages example', 'conditional-pages', 'Rendered conditional page flow.'),
      docsExampleReference('Tabbed example', 'tabbed', 'Rendered tabbed form.'),
    ],
  },
  {
    title: 'Return value',
    body: 'The hook returns the native Form wrapper, the TanStack Form instance, multi-page state/helpers, and persistence helpers. Removed validation debug helpers are not part of this contract.',
    bullets: [
      'Page helpers are returned even for single-page forms. useMultiPage falls back to visiblePages [1] and progressValue 100.',
      'Persistence helpers are returned even when persistence is not configured; they no-op or return undefined when storage is unavailable.',
      'Tests keep the return contract explicit and list removed fields: crossFieldErrors, asyncValidationStates, validateCrossFields, validateFieldAsync.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('Form', '(props: ComponentProps<\'form\'>) => ReactNode', 'Returned', 'Component that renders FormRoot, fields, tabs/pages, navigation, and submit handling.'),
        createPropertyRow('form', 'Return value from useForm<TFormValues>', 'Returned', 'Underlying TanStack Form instance.'),
        createPropertyRow('currentPage', 'number', '1', 'Current page number from useMultiPage.'),
        createPropertyRow('totalPages', 'number', '1', 'Count of visible pages, with fallback to 1.'),
        createPropertyRow('visiblePages', 'readonly number[]', '[1]', 'Sorted visible page numbers.'),
        createPropertyRow('goToNextPage', '() => void', 'Returned', 'Moves to the next visible page when one exists.'),
        createPropertyRow('goToPreviousPage', '() => void', 'Returned', 'Moves to the previous visible page when one exists.'),
        createPropertyRow('setCurrentPage', 'Dispatch<SetStateAction<number>>', 'Returned', 'Sets current page state directly; invalid pages are corrected by useMultiPage effect.'),
        createPropertyRow('isFirstPage', 'boolean', 'true', 'True when currentPage is at visiblePages index 0.'),
        createPropertyRow('isLastPage', 'boolean', 'true', 'True when currentPage is at the final visiblePages index.'),
        createPropertyRow('progressValue', 'number', '100', 'Progress percentage from useMultiPage.'),
        createPropertyRow('saveToStorage', '() => void', 'Returned', 'Writes current values, timestamp, and currentPage through configured persistence.'),
        createPropertyRow('loadFromStorage', '() => PersistedFormPayload<TFormValues> | undefined', 'Returned', 'Loads storage, sets form values, restores currentPage when stored currentPage is <= totalPages, and returns the parsed payload.'),
        createPropertyRow('clearStorage', '() => void', 'Returned', 'Removes the configured persistence payload.'),
      ],
    },
    snippet: { title: 'Navigation and persistence helpers', language: 'tsx', code: returnValueSnippet },
    references: [
      sourceReference('Hook return object', 'packages/formedible/src/hooks/use-formedible.tsx#L428-L443', 'Exact returned fields.'),
      sourceReference('Return contract test', 'tests/formedible/phase10-behavior.test.ts#L188-L215', 'Kept and removed return field lists.'),
      sourceReference('Persistence helper source', 'packages/formedible/src/hooks/use-form-persistence.ts#L95-L165', 'saveToStorage, loadFromStorage, clearStorage.'),
    ],
  },
  {
    title: 'Form component props',
    body: 'The exported package form component is a thin ComponentProps<\'form\'> wrapper. The Form returned from useFormedible accepts that same prop shape and then replaces submit handling with form.handleSubmit.',
    bullets: [
      'Native event props run first. Matching onForm* callbacks from UseFormedibleOptions run next with event plus formApi context.',
      'The returned Form prevents default submit, stops propagation, and calls form.handleSubmit. Put submit work in formOptions.onSubmit.',
      'className goes to the native form element. formClassName goes to the internal FormLayout.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('className', 'string', 'undefined', 'Class name for the native form element.'),
        createPropertyRow('aria-label', 'string', 'undefined', 'Accessible name when the form lacks a linked visible heading.'),
        createPropertyRow('aria-labelledby', 'string', 'undefined', 'References visible text that names the form.'),
        createPropertyRow('id', 'string', 'undefined', 'Native form id.'),
        createPropertyRow('name', 'string', 'undefined', 'Native form name.'),
        createPropertyRow('autoComplete', 'string', 'undefined', 'Native autocomplete mode for the form.'),
        createPropertyRow('noValidate', 'boolean', 'false', 'Native flag that disables browser validation UI.'),
        createPropertyRow('data-*', 'string | number | boolean | undefined', 'undefined', 'Custom data attributes forwarded to the native form.'),
        createPropertyRow('onBlur / onFocus', 'FocusEventHandler<HTMLFormElement>', 'undefined', 'Native focus callbacks, followed by onFormBlur and onFormFocus from hook config.'),
        createPropertyRow('onInput / onInvalid', 'FormEventHandler<HTMLFormElement>', 'undefined', 'Native input and invalid callbacks, followed by onFormInput and onFormInvalid.'),
        createPropertyRow('onKeyDown / onKeyUp', 'KeyboardEventHandler<HTMLFormElement>', 'undefined', 'Native keyboard callbacks, followed by onFormKeyDown and onFormKeyUp.'),
        createPropertyRow('onReset', 'FormEventHandler<HTMLFormElement>', 'undefined', 'Native reset callback, followed by formOptions.onReset, onFormReset, and analytics reset.'),
        createPropertyRow('onSubmit', 'FormEventHandler<HTMLFormElement>', 'Handled by Formedible', 'The returned Form ignores the native onSubmit prop and calls form.handleSubmit.'),
      ],
    },
    snippet: { title: 'Native form attrs with formOptions.onSubmit', language: 'tsx', code: formComponentSnippet },
    references: [
      sourceReference('Base Form component', 'packages/formedible/src/components/formedible/form.tsx#L1-L9', 'FormProps = ComponentProps<\'form\'> and prop forwarding.'),
      sourceReference('Returned Form event handling', 'packages/formedible/src/hooks/use-formedible.tsx#L330-L375', 'Native event order, aria-busy, and submit interception.'),
      sourceReference('Rendered layout class target', 'packages/formedible/src/hooks/use-formedible.tsx#L376-L423', 'fieldset, FormLayout formClassName, tabs/pages, and buttons.'),
    ],
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/api')({
  head: () => routeHead,
  component: ApiRoute,
});

function ApiRoute() {
  return (
    <DocsGuidePage
      eyebrow="API reference"
      title="Code-first Formedible API reference"
      description="A source-backed lookup for the hook config, form options, field model, pages, tabs, persistence, analytics, returned helpers, and native form props. Each section includes direct evidence from source, tests, or examples."
      sections={sections}
      codeExampleIds={['shadcn-install-surface', 'typed-hook-usage']}
      related={relatedLinks}
    />
  );
}
