import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage, type DocsGuideLink, type DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/fields');

const fieldTypes = [
  'text, email, password, url, tel, textarea, number',
  'select, radio, checkbox, switch, date, slider, rating',
  'phone, file, array, object, multiSelect, combobox, multiCombobox',
  'color, colorPicker, duration, location, masked, maskedInput',
] as const;

const commonFieldRows = [
  { cells: ['name', 'string', '—', 'Path used by TanStack Form. It can be a top-level key or a nested path such as team.0.email.'] },
  { cells: ['type', 'FormedibleFieldType', 'text', 'Renderer choice. Aliases normalize before render, so multiselect maps to multiSelect and colorPicker maps to color.'] },
  { cells: ['label', 'ReactNode', '—', 'Visible label shown above or beside the control. Dynamic text can replace tokens from current form values.'] },
  { cells: ['description', 'ReactNode', '—', 'Help copy rendered with the field, separate from validation messages.'] },
  { cells: ['placeholder', 'string', '—', 'Native placeholder or picker prompt. Some nested configs can provide their own placeholder fallback.'] },
  { cells: ['disabled', 'boolean', 'false', 'Disables the rendered control. The form-level disabled option can disable every field at once.'] },
  { cells: ['required', 'boolean', 'false', 'Marks the field as required in the UI. Use schema or field validation for the actual rule.'] },
  { cells: ['className', 'string', '—', 'Class for the field shell. Use inputClassName when only the input element needs styling.'] },
  { cells: ['page', 'number', '—', 'Places the field on a multi-page step. Page visibility can also be conditional.'] },
  { cells: ['tab', 'string', '—', 'Places the field in a tab by id. Tabs are declared on the useFormedible options.'] },
  { cells: ['section', 'string | FormedibleFieldSection', '—', 'Groups nearby fields under a static section header. Object values can include title and description.'] },
] satisfies NonNullable<DocsGuideSection['table']>['rows'];

const sections = [
  {
    title: 'Field configuration',
    body: 'FormedibleFieldConfig is the contract shared by hand-written forms, builder output, AI drafts, and parser results. Start with name, type, label, and default values in formOptions; then add layout, validation, and field-specific config only when the field needs it.',
    bullets: [
      'Unknown keys are kept as metadata for custom renderers, but built-in behavior reads the supported keys and nested config objects.',
      'The renderer normalizes legacy aliases before lookup, which keeps copied older snippets from breaking.',
      'Schema validation still lives with TanStack Form; required is a UI hint, not a full validation strategy.',
    ],
    table: {
      headers: ['Property', 'Type', 'Default', 'Description'],
      rows: commonFieldRows,
    },
  },
  {
    title: 'Text inputs',
    body: 'Text-like fields share the same basic input path: text, email, password, url, tel, and textarea. Use the HTML-specific type when the browser can help with keyboards, autofill, or native semantics; use textarea for long copy.',
    bullets: [
      'textarea can use rows, maxLength, or textareaConfig for rows, cols, resize, and word count display.',
      'password reads passwordConfig for showToggle, strengthMeter, and minStrength.',
      'email has no emailConfig. Put email rules in a schema, validation, inlineValidation, or asyncValidation.',
      'Text-like fields can expose native suggestions through datalist without becoming select fields.',
    ],
  },
  {
    title: 'Selection fields',
    body: 'select, radio, checkbox, and switch cover single-choice and boolean UI. Option-based fields accept plain strings or option objects with value, label, disabled, description, and extra metadata for custom components.',
    bullets: [
      'Use string options for quick lists when label and value can match.',
      'Use option objects when the UI needs disabled choices, rich labels, descriptions, or stable values.',
      'checkbox and switch are best for boolean values; radio and select are better when users choose one value from a list.',
      'Keep option values as strings unless a custom renderer owns a different shape end to end.',
    ],
  },
  {
    title: 'Advanced inputs',
    body: 'Advanced fields stay readable by putting their special behavior in nested config objects instead of crowding the top-level field shape.',
    bullets: [
      'sliderConfig supports min, max, step, marks, value mapping, labels, precision, and a custom visualization component.',
      'ratingConfig controls max, half ratings, icon style, size, and whether the value is shown.',
      'phoneConfig sets country behavior; fileConfig sets accept, multiple, maxSize, maxFiles, and file callbacks.',
      'colorConfig, maskedInputConfig, durationConfig, and locationConfig each own the picker, formatting, or search settings for that field.',
    ],
  },
  {
    title: 'Multi-value fields',
    body: 'multiSelect, combobox, autocomplete, and multiCombobox handle searchable lists and values that may grow while the user types. They all use the same option model, then add search or creation settings through their own config.',
    bullets: [
      'multiSelectConfig and multiComboboxConfig support maxSelections, searchable, creatable, placeholder, and noOptionsText.',
      'comboboxConfig is for one selected value with optional searchPlaceholder and noOptionsText copy.',
      'autocompleteConfig can own static options, asyncOptions, debounceMs, minChars, maxResults, allowCustom, and loading text.',
      'For dependent lists, pass options as a function of current values instead of duplicating fields.',
    ],
  },
  {
    title: 'Structural fields',
    body: 'array and object fields let one field describe nested form UI. They are still normal field configs, so nested inputs keep labels, validation, conditions, sections, and custom renderers.',
    bullets: [
      'arrayConfig controls itemType, minItems, maxItems, sortable, defaultValue, and objectConfig for object items.',
      'nestedFields can describe object children; objectConfig.fields is the more explicit form when layout settings travel with the field.',
      'objectConfig supports stack or grid layout plus columns, which keeps nested cards from needing page-level helper components.',
      'The Dynamic Array Fields example shows sortable object arrays and scalar arrays using the live renderer.',
    ],
  },
  {
    title: 'Dynamic behavior',
    body: 'Fields can react to form values without leaving the config model. Conditions, option functions, and dynamic placeholder text cover most dependent-field cases.',
    bullets: [
      'conditional can be a string path for truthy checks or a function that receives current form values.',
      'Page and tab configs can also be conditional, so whole chunks of a form can appear only when they apply.',
      'options can be a function when choices depend on earlier answers, like country-specific states or plan-specific add-ons.',
      'dynamicPlaceholder lets placeholder text resolve tokens from current values, matching the dynamic label and description behavior.',
    ],
  },
  {
    title: 'Custom rendering',
    body: 'Because Formedible is copied into the app, custom rendering is local code. Use a field component for one field, a wrapper for one field shell, or registry-level defaults when a field type should render differently everywhere.',
    bullets: [
      'component replaces the renderer for a single field while keeping the same field controller props.',
      'wrapper wraps one field; globalWrapper wraps every rendered field from useFormedible options.',
      'defaultComponents lets the copied registry fall back to your components by normalized field type.',
      'The Advanced Field Types example shows a custom slider visualization without changing the field model.',
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options, config types, and renderer contracts.', href: '/docs/api' },
  { title: 'Validation', description: 'Schema, field, async, inline, and cross-field validation patterns.', href: '/docs/validation' },
  { title: 'Getting Started', description: 'Install the copied app surface and render your first typed form.', href: '/docs/getting-started' },
  { title: 'Dynamic Array Fields', description: 'Open sortable object arrays and scalar arrays in the live examples browser.', href: '/docs/examples?example=arrays' },
  { title: 'Advanced Field Types', description: 'Open custom slider visualization and advanced controls in the live examples browser.', href: '/docs/examples?example=advanced-fields' },
] satisfies readonly DocsGuideLink[];

export const Route = createFileRoute('/docs/fields')({
  head: () => routeHead,
  component: FieldsRoute,
});

function FieldsRoute() {
  return (
    <DocsGuidePage
      eyebrow="Field model"
      title="Configure fields once and reuse them everywhere."
      description="Every manual form, builder form, AI-generated form, and parser result targets the same field configuration model."
      codeExampleIds={['field-registry-extension']}
      related={relatedLinks}
      aside={(
        <div className="overflow-hidden rounded-2xl">
          <div className="grid gap-px bg-border">
            {fieldTypes.map((group) => (
              <p key={group} className="bg-muted p-4 text-sm leading-6 text-muted-foreground">
                {group}
              </p>
            ))}
          </div>
        </div>
      )}
      sections={sections}
    />
  );
}
