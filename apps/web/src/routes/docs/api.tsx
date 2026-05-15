import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/api');

const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'Fields', description: 'Field config, supported types, nested fields, and field-level validation.', href: '/docs/fields' },
  { title: 'Validation', description: 'Schema, inline, async, and cross-field validation patterns.', href: '/docs/validation' },
  { title: 'Getting Started', description: 'Install the copied surface and render your first typed form.', href: '/docs/getting-started' },
  { title: 'Examples', description: 'Working forms that use the same hook and field model documented here.', href: '/docs/examples' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'useFormedible hook',
    body: 'Call useFormedible with a typed config object. The generic parameter is your form value shape, so field names, defaultValues, validation callbacks, and submit handlers stay tied to the same type.',
    bullets: [
      'Signature: useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(config: UseFormedibleOptions<TFormValues>).',
      'TFormValues is a Record<string, unknown> shape. Pass your own interface or a z.infer type when you know the fields ahead of time.',
      'The hook returns a Form component, the TanStack form instance, page state, navigation helpers, progress value, and persistence helpers.',
    ],
  },
  {
    title: 'UseFormedibleOptions',
    body: 'This is the main API. fields and formOptions are required. Everything else adds rendering behavior, validation, persistence, analytics, labels, or form-level event hooks without changing the field model.',
    bullets: [
      'Use fields for the visible form structure and formOptions for TanStack Form defaults and lifecycle callbacks.',
      'Pages and tabs are alternatives in the renderer. If tabs are configured, tab filtering wins over page filtering.',
      'Pass custom components through defaultComponents or globalWrapper when the copied registry needs product-specific UI.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('fields', 'readonly FormedibleFieldConfig<TFormValues>[]', 'Required', 'Declarative field list rendered by the form. Each field can set type, label, options, page, tab, section, conditional logic, validation, and field-specific config.'),
        createPropertyRow('formOptions', 'FormedibleFormOptions<TFormValues>', 'Required', 'Default values and lifecycle callbacks passed around the TanStack Form instance.'),
        createPropertyRow('schema', 'unknown', 'undefined', 'Form-level schema consumed by the Formedible validator builder. Standard-schema and Zod-style schemas are supported by the validation utilities.'),
        createPropertyRow('crossFieldValidation', 'readonly FormedibleCrossFieldValidation<TFormValues>[]', 'undefined', 'Rules that inspect multiple values at once. Use this for checks such as matching passwords or date ranges.'),
        createPropertyRow('asyncValidation', 'Partial<Record<keyof TFormValues | string, FormedibleAsyncValidation<TFormValues>>>', 'undefined', 'Field-name keyed async validators. Each validator receives the field value, current values, and an AbortSignal.'),
        createPropertyRow('pages', 'readonly FormediblePageConfig<TFormValues>[]', 'undefined', 'Optional page metadata for multi-step forms. Fields join a page with their page number; missing page values default to page 1.'),
        createPropertyRow('tabs', 'readonly (string | FormedibleTabConfig<TFormValues>)[]', 'undefined', 'Tab definitions. String entries become simple tab ids and labels; object entries can add descriptions and conditional visibility.'),
        createPropertyRow('progress', 'FormedibleProgressConfig', 'undefined', 'Controls the multi-page progress header. showSteps and showPercentage toggle step text and percentage text.'),
        createPropertyRow('persistence', 'FormediblePersistenceConfig<TFormValues>', 'undefined', 'Storage settings for saving values between visits. Includes key, storage type, debounceMs, excluded fields, and restoreOnMount.'),
        createPropertyRow('analytics', 'FormedibleAnalyticsConfig<TFormValues>', 'undefined', 'Callbacks for form start, field focus, field blur, field change, field completion, field errors, page changes, completion, abandon, and reset.'),
        createPropertyRow('defaultComponents', 'Partial<Record<NormalizedFieldType, FormedibleFieldComponent<TFormValues>>>', 'undefined', 'Per-field-type component overrides. Use this when one product field should replace the default renderer for a type.'),
        createPropertyRow('globalWrapper', 'FormedibleFieldWrapper<TFormValues>', 'undefined', 'Wrapper component applied around rendered fields. Good for shared chrome, instrumentation, or layout constraints.'),
        createPropertyRow('submitLabel', 'ReactNode', "'Submit'", 'Text or node used for the submit button in both single-page forms and the final page of multi-page forms.'),
        createPropertyRow('nextLabel', 'ReactNode', "'Next'", 'Text or node used by the multi-page next button.'),
        createPropertyRow('previousLabel', 'ReactNode', "'Previous'", 'Text or node used by the multi-page previous button.'),
        createPropertyRow('onPageChange', "(page: number, direction: 'next' | 'previous') => void", 'undefined', 'Called after the current page changes. The first argument is the new page number.'),
        createPropertyRow('autoSubmitOnChange', 'boolean', 'false', 'When true, field changes schedule a form submit after the configured debounce.'),
        createPropertyRow('autoSubmitDebounceMs', 'number', '300', 'Delay used by autoSubmitOnChange. Ignored when autoSubmitOnChange is not enabled.'),
        createPropertyRow('disabled', 'boolean', 'false', 'Disables the rendered fieldset and all built-in navigation or submit controls.'),
        createPropertyRow('loading', 'boolean', 'false', 'Marks the form busy with aria-busy and disables controls while external work is running.'),
        createPropertyRow('showSubmitButton', 'boolean', 'true', 'Set to false when a parent component owns submission controls.'),
        createPropertyRow('collapseLabel', 'ReactNode', 'undefined', 'Compatibility label for collapsible array or object UI that supports collapsing.'),
        createPropertyRow('expandLabel', 'ReactNode', 'undefined', 'Compatibility label for collapsible array or object UI that supports expanding.'),
        createPropertyRow('formClassName', 'string', 'undefined', 'Class name passed to the internal FormLayout, not the native form element.'),
        createPropertyRow('onFormReset', 'FormedibleFormEventHandler<TFormValues>', 'undefined', 'Form-level reset callback. Runs with the native event and a small form API context.'),
        createPropertyRow('onFormInput', 'FormedibleFormEventHandler<TFormValues>', 'undefined', 'Form-level input callback. Useful for analytics or autosave that needs the native event.'),
        createPropertyRow('onFormInvalid', 'FormedibleFormEventHandler<TFormValues>', 'undefined', 'Form-level invalid callback for native invalid events.'),
        createPropertyRow('onFormKeyDown', 'FormedibleFormEventHandler<TFormValues, KeyboardEvent>', 'undefined', 'Form-level keydown callback.'),
        createPropertyRow('onFormKeyUp', 'FormedibleFormEventHandler<TFormValues, KeyboardEvent>', 'undefined', 'Form-level keyup callback.'),
        createPropertyRow('onFormFocus', 'FormedibleFormEventHandler<TFormValues, FocusEvent>', 'undefined', 'Form-level focus callback. Runs after the onFocus prop passed to the rendered Form component.'),
        createPropertyRow('onFormBlur', 'FormedibleFormEventHandler<TFormValues, FocusEvent>', 'undefined', 'Form-level blur callback. Runs after the onBlur prop passed to the rendered Form component.'),
      ],
    },
  },
  {
    title: 'FormedibleFormOptions',
    body: 'formOptions holds the value defaults and high-level form callbacks. These callbacks receive the current value object plus a small formApi context with state.values and handleSubmit.',
    bullets: [
      'defaultValues must match TFormValues. Keep it complete so every controlled field starts from a known value.',
      'onSubmit may be async. Formedible tracks completion, calls your handler, then clears configured persistence storage.',
      'onChange, onBlur, and onFocus are called from field events after Formedible updates analytics and TanStack Form state.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('defaultValues', 'TFormValues', 'Required', 'Initial form values passed to TanStack Form.'),
        createPropertyRow('onSubmit', '(context: FormedibleFormEventContext<TFormValues>) => void | Promise<void>', 'undefined', 'Runs when the form submits successfully through Formedible.'),
        createPropertyRow('onChange', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs after a field change with the next value object.'),
        createPropertyRow('onBlur', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs after a field blur.'),
        createPropertyRow('onFocus', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs after a field focus.'),
        createPropertyRow('onReset', '(context: FormedibleFormEventContext<TFormValues>) => void', 'undefined', 'Runs from the rendered form reset handler before the Formedible onFormReset event callback.'),
      ],
    },
  },
  {
    title: 'Return value',
    body: 'useFormedible returns everything needed to render the form and coordinate page flow or saved drafts from nearby UI.',
    bullets: [
      'Form is the component you render. It accepts standard form attributes and handles submit through TanStack Form.',
      'form is the underlying TanStack Form API instance for advanced cases that need direct state or methods.',
      'The page and persistence helpers are safe to ignore for simple one-page forms.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('Form', '(props: ComponentProps<\'form\'>) => ReactNode', 'Returned', 'Rendered form component. It forwards standard form attributes and injects fields, layout, navigation, and submit handling.'),
        createPropertyRow('form', 'Return value from useForm<TFormValues>', 'Returned', 'Underlying TanStack Form instance.'),
        createPropertyRow('currentPage', 'number', '1', 'Current visible page number in multi-page mode.'),
        createPropertyRow('totalPages', 'number', '1', 'Count of currently visible pages.'),
        createPropertyRow('visiblePages', 'readonly number[]', '[1]', 'Page numbers that pass page-level conditional logic.'),
        createPropertyRow('goToNextPage', '() => void', 'Returned', 'Moves to the next visible page when one exists.'),
        createPropertyRow('goToPreviousPage', '() => void', 'Returned', 'Moves to the previous visible page when one exists.'),
        createPropertyRow('setCurrentPage', '(page: number) => void', 'Returned', 'Sets the current page directly.'),
        createPropertyRow('isFirstPage', 'boolean', 'true', 'True when currentPage is the first visible page.'),
        createPropertyRow('isLastPage', 'boolean', 'true', 'True when currentPage is the last visible page.'),
        createPropertyRow('progressValue', 'number', '100', 'Progress percentage for the active multi-page flow.'),
        createPropertyRow('saveToStorage', '() => void', 'Returned', 'Writes current values, timestamp, and current page to configured storage.'),
        createPropertyRow('loadFromStorage', '() => PersistedFormPayload<TFormValues> | undefined', 'Returned', 'Loads configured storage into form fields and restores current page when possible.'),
        createPropertyRow('clearStorage', '() => void', 'Returned', 'Removes the configured persistence payload.'),
      ],
    },
  },
  {
    title: 'Form component props',
    body: 'The returned Form component is typed as ComponentProps<\'form\'>, so standard HTML form attributes can be passed where you render it. Formedible owns submit handling; use formOptions.onSubmit for submission work.',
    bullets: [
      'Use aria-label or aria-labelledby when the page heading does not give the form a clear accessible name.',
      'className goes to the native form element. formClassName goes to the internal layout wrapper.',
      'Native event props run first, then matching UseFormedibleOptions form event handlers run with the Formedible form API context.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('className', 'string', 'undefined', 'Class name for the native form element.'),
        createPropertyRow('aria-label', 'string', 'undefined', 'Accessible name for the form when no visible label is connected.'),
        createPropertyRow('aria-labelledby', 'string', 'undefined', 'References visible text that names the form.'),
        createPropertyRow('id', 'string', 'undefined', 'Native form id.'),
        createPropertyRow('name', 'string', 'undefined', 'Native form name.'),
        createPropertyRow('autoComplete', 'string', 'undefined', 'Native autocomplete mode for the form.'),
        createPropertyRow('noValidate', 'boolean', 'false', 'Native flag that disables browser validation UI.'),
        createPropertyRow('data-*', 'string | number | boolean | undefined', 'undefined', 'Custom data attributes are forwarded to the native form.'),
        createPropertyRow('onBlur / onFocus', 'FocusEventHandler<HTMLFormElement>', 'undefined', 'Native focus callbacks. Formedible also calls onFormBlur and onFormFocus from the hook config.'),
        createPropertyRow('onInput / onInvalid', 'FormEventHandler<HTMLFormElement>', 'undefined', 'Native input and invalid callbacks. Formedible also calls onFormInput and onFormInvalid from the hook config.'),
        createPropertyRow('onKeyDown / onKeyUp', 'KeyboardEventHandler<HTMLFormElement>', 'undefined', 'Native keyboard callbacks. Formedible also calls onFormKeyDown and onFormKeyUp from the hook config.'),
        createPropertyRow('onReset', 'FormEventHandler<HTMLFormElement>', 'undefined', 'Native reset callback. Formedible also calls formOptions.onReset, onFormReset, and reset analytics.'),
        createPropertyRow('onSubmit', 'FormEventHandler<HTMLFormElement>', 'Handled by Formedible', 'The rendered component prevents the native submit and calls form.handleSubmit. Put submit side effects in formOptions.onSubmit.'),
      ],
    },
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
      title="The API surface you reach for while building real forms."
      description="Start with useFormedible, wire fields and formOptions, then add validation, pages, tabs, persistence, analytics, and native form attributes only when the product needs them."
      sections={sections}
      codeExampleIds={['shadcn-install-surface', 'typed-hook-usage']}
      related={relatedLinks}
    />
  );
}
