import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage, type DocsGuideLink, type DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/fields');

const fieldTypes = [
  'text, email, password, url, tel, textarea, number',
  'select, radio, checkbox, switch, date, slider, rating',
  'phone, file, array, object, multiSelect, combobox, autocomplete',
  'multiCombobox, color, duration, location, masked',
  'aliases: multiselect, multicombobox, colorPicker, maskedInput',
] as const;

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/main';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return {
    title,
    description,
    href: `${sourceBase}/${path}`,
  };
}

const commonFieldRows = [
  { cells: ['name', 'string', 'required', 'TanStack Form field path. Nested paths are joined by the renderer; see field-path.ts and object-field.tsx.'] },
  { cells: ['type', 'FormedibleFieldType', 'text', 'Renderer key. normalize-field-config.ts maps multiselect, multicombobox, colorPicker, and maskedInput aliases before registry lookup.'] },
  { cells: ['label', 'ReactNode', '—', 'Rendered by field-wrapper.tsx. Dynamic text tokens are resolved in use-formedible.tsx.'] },
  { cells: ['description', 'ReactNode', '—', 'Field help copy rendered below the label by field-wrapper.tsx, separate from validation errors.'] },
  { cells: ['placeholder', 'string', '—', 'Passed to renderers that read a placeholder: text, textarea, number, password, phone, autocomplete, combobox-style fields, and primitive array items. Tokens resolve in use-formedible.tsx.'] },
  { cells: ['dynamicPlaceholder', 'boolean', '—', 'Declared on the type for compatibility. Current dynamic placeholder behavior comes from token resolution on placeholder.'] },
  { cells: ['disabled', 'boolean', 'false', 'Set per field or through the form-level disabled option; normalization fills the default.'] },
  { cells: ['required', 'boolean', 'false', 'Marks the label/control as required and also feeds Formedible’s built-in required-value validator before schema, validation, inlineValidation, asyncValidation, min, max, and related validators.'] },
  { cells: ['className / inputClassName', 'string', '—', 'className styles the field shell; inputClassName is passed by input renderers that expose an inner control class.'] },
  { cells: ['page / tab / section', 'number / string / FormedibleFieldSection', '—', 'Layout metadata used by use-multi-page.ts, use-form-tabs.ts, and section rendering in use-formedible.tsx.'] },
  { cells: ['conditional', 'string | (values) => boolean', '—', 'String paths are truthy checks; functions receive current form values or local object-array item values.'] },
  { cells: ['options', 'FormedibleFieldOption[] | (values) => FormedibleFieldOption[]', '[]', 'Used by select, radio, multiSelect, combobox, autocomplete fallback, and multiCombobox through advanced-field-utils.ts.'] },
  { cells: ['optionSets', 'Record<string, FormedibleFieldOption[]>', '—', 'Typed compatibility metadata. Built-in field renderers read options or nested autocompleteConfig.options instead.'] },
  { cells: ['datalist', 'FormedibleFieldOption[]', '—', 'Native datalist suggestions for text-field.tsx and number-field.tsx.'] },
  { cells: ['arrayConfig / objectConfig / nestedFields', 'nested config', '—', 'Structural config for array-field.tsx and object-field.tsx. objectConfig.fields wins over nestedFields for object fields.'] },
  { cells: ['min / max / step', 'number', '—', 'Top-level number bounds used by number-field.tsx and as slider fallbacks.'] },
  { cells: ['rows / maxLength', 'number', '—', 'Top-level textarea settings. They take priority over textareaConfig.rows and textareaConfig.maxLength.'] },
  { cells: ['mask / maskedInputConfig', 'FormedibleMaskedInputMask / nested config', '—', 'Consumed by masked-field.tsx. type: "maskedInput" normalizes to masked before lookup.'] },
  { cells: ['textareaConfig / passwordConfig / numberConfig', 'nested config', '—', 'Consumed by textarea-field.tsx, password-field.tsx, and number-field.tsx. Top-level rows, maxLength, min, max, and step take priority where supported.'] },
  { cells: ['dateConfig / sliderConfig / ratingConfig / fileConfig', 'nested config', '—', 'Advanced renderer config defined in types.ts and consumed by the matching field component.'] },
  { cells: ['multiSelectConfig / comboboxConfig / autocompleteConfig / multiComboboxConfig', 'nested config', '—', 'Search, creation, max-selection, and autocomplete settings consumed by the matching option renderers.'] },
  { cells: ['colorConfig / phoneConfig / durationConfig / locationConfig', 'nested config', '—', 'Advanced renderer config defined in types.ts and consumed by the matching field component.'] },
  { cells: ['help', 'ReactNode | FormedibleHelpConfig', '—', 'Supplementary help rendered by field-wrapper.tsx when present.'] },
  { cells: ['validation / inlineValidation', 'validator config', '—', 'Field-level validation inputs read by buildFieldValidators.'] },
  { cells: ['emailConfig', 'never', 'unsupported', 'Intentionally unsupported; use schema or validation for email-specific rules.'] },
  { cells: ['component / wrapper', 'FormedibleFieldComponent / FormedibleFieldWrapper', '—', 'Per-field render escape hatches used by field-renderer.tsx before registry fallback and globalWrapper.'] },
  { cells: ['custom props', 'unknown', '—', 'Retained for custom renderers and metadata. Built-in behavior should use supported config keys above.'] },
] satisfies NonNullable<DocsGuideSection['table']>['rows'];

const sections = [
  {
    title: 'Field configuration',
    body: 'FormedibleFieldConfig defines the public keys. normalizeFieldConfig fills runtime defaults before the registry chooses a renderer.',
    bullets: [
      'Source: packages/formedible/src/lib/formedible/types.ts lines 224-284 define the top-level field keys and nested config objects.',
      'Renderer lookup: packages/formedible/src/components/formedible/fields/field-registry.tsx maps normalized field types to components.',
      'Alias behavior is tested in tests/formedible/advanced-fields.test.tsx under “legacy alias fields render field-specific compatibility UI”.',
    ],
    table: {
      headers: ['Property', 'Type', 'Default', 'Description'],
      rows: commonFieldRows,
    },
    references: [
      sourceReference('FormedibleFieldConfig', 'packages/formedible/src/lib/formedible/types.ts#L224-L284', 'Top-level field config keys, nested config hooks, and custom renderer fields.'),
      sourceReference('normalizeFieldConfig', 'packages/formedible/src/lib/formedible/normalize-field-config.ts#L3-L35', 'Alias normalization plus disabled and required defaults.'),
      sourceReference('fieldRegistry', 'packages/formedible/src/components/formedible/fields/field-registry.tsx#L30-L63', 'The renderer map used after a field type is normalized.'),
    ],
  },
  {
    title: 'Text inputs',
    body: 'Text-like fields share the same base config. Add renderer-specific config only when the field needs it.',
    bullets: [
      'Text, email, url, and tel share text-field.tsx; datalist renders native suggestions there and in number-field.tsx.',
      'Textarea config: { textareaConfig: { rows: 4, maxLength: 500, resize: "vertical", showWordCount: true } }. See textarea-field.tsx and tests/formedible/basic-fields.test.tsx.',
      'Password config: { passwordConfig: { showToggle: true, strengthMeter: true, minStrength: 3 } }. See password-field.tsx.',
      'Masked config: { type: "masked", mask: "999-99-9999" } or { type: "maskedInput", maskedInputConfig: { mask: "000-00-0000" } }. See masked-field.tsx and tests/formedible/advanced-fields.test.tsx.',
    ],
    snippet: {
      title: 'Text, email, textarea, and password config',
      language: 'ts',
      code: `import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type AccountValues = {
  fullName: string;
  workEmail: string;
  bio: string;
  password: string;
};

export const accountFields = [
  {
    name: 'fullName',
    type: 'text',
    label: 'Full name',
    placeholder: 'Ada Lovelace',
    datalist: ['Ada Lovelace', 'Grace Hopper'],
  },
  {
    name: 'workEmail',
    type: 'email',
    label: 'Work email',
    placeholder: 'ada@example.com',
  },
  {
    name: 'bio',
    type: 'textarea',
    label: 'Short bio',
    textareaConfig: {
      rows: 4,
      maxLength: 500,
      resize: 'vertical',
      showWordCount: true,
    },
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    passwordConfig: {
      showToggle: true,
      strengthMeter: true,
      minStrength: 3,
    },
  },
] satisfies readonly FormedibleFieldConfig<AccountValues>[];`,
    },
    references: [
      sourceReference('TextField', 'packages/formedible/src/components/formedible/fields/text-field.tsx', 'text, email, url, and tel use this renderer.'),
      sourceReference('TextareaField', 'packages/formedible/src/components/formedible/fields/textarea-field.tsx#L7-L35', 'rows, maxLength, cols, resize, and showWordCount consumption.'),
      sourceReference('PasswordField', 'packages/formedible/src/components/formedible/fields/password-field.tsx#L48-L50', 'showToggle, strengthMeter, and minStrength config reads.'),
    ],
  },
  {
    title: 'Selection fields',
    body: 'Selection fields use options; checkbox and switch use booleans. String options are normalized before render.',
    bullets: [
      'Select config: { name: "role", type: "select", options: [{ value: "qa", label: "QA" }] }. See apps/web/src/components/docs/examples/array-fields-form.tsx.',
      'Radio config: { name: "destination", type: "radio", options: ["beach", "mountains", "city"] }. See tests/formedible/advanced-fields.test.tsx vacationFlowFields.',
      'Checkbox and switch render boolean controls from checkbox-field.tsx and switch-field.tsx; tests/formedible/basic-fields.test.tsx covers their primitive imports and default boolean value path.',
      'Dependent options use a function: options: (values) => values.plan === "team" ? ["audit", "roles"] : ["profile"]. The resolver is resolveFieldOptions in advanced-field-utils.ts.',
    ],
    snippet: {
      title: 'Select, radio, checkbox, switch, and option objects',
      language: 'ts',
      code: `import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type PreferenceValues = {
  plan: string;
  cadence: string;
  includeReceipt: boolean;
  betaAccess: boolean;
};

export const preferenceFields = [
  {
    name: 'plan',
    type: 'select',
    label: 'Plan',
    options: [
      { value: 'solo', label: 'Solo' },
      { value: 'team', label: 'Team', description: 'Shared billing and seats' },
      { value: 'enterprise', label: 'Enterprise', disabled: true },
    ],
  },
  {
    name: 'cadence',
    type: 'radio',
    label: 'Billing cadence',
    options: ['monthly', 'yearly'],
  },
  { name: 'includeReceipt', type: 'checkbox', label: 'Email me a receipt' },
  { name: 'betaAccess', type: 'switch', label: 'Enable beta access' },
] satisfies readonly FormedibleFieldConfig<PreferenceValues>[];`,
    },
    references: [
      sourceReference('resolveFieldOptions', 'packages/formedible/src/components/formedible/fields/advanced-field-utils.ts#L5-L20', 'String-to-object option normalization and functional option resolution.'),
      sourceReference('SelectField', 'packages/formedible/src/components/formedible/fields/select-field.tsx', 'The select renderer reads normalized options.'),
      sourceReference('Survey example', 'apps/web/src/components/docs/examples/survey-form.tsx#L168-L217', 'Radio and multiSelect field usage in a live docs example.'),
    ],
  },
  {
    title: 'Advanced inputs',
    body: 'Advanced fields keep settings in nested config objects. Use the config that matches the field type.',
    bullets: [
      'Live example: /docs/examples?example=advanced-fields, id advanced-fields, source apps/web/src/components/docs/examples/advanced-field-types-form.tsx.',
      'Rating config: { ratingConfig: { max: 5, allowHalf: true, icon: "star", size: "lg", showValue: true } }. Source: rating-field.tsx.',
      'Slider config: { sliderConfig: { min: 0, max: 100, step: 5, valueLabelSuffix: "%", showValue: true, marks: [{ value: 50, label: "Mid" }] } }. Source: slider-field.tsx and tests/formedible/advanced-fields.test.tsx.',
      'Color, phone, duration, location, date, and file keys are defined in types.ts lines 513-651 and consumed by their matching field files.',
    ],
    snippet: {
      title: 'Rating, slider, color, file, date, and location config',
      language: 'ts',
      code: `import type { FormedibleFieldConfig, FormedibleLocationValue } from '@/components/ui/formedible/lib/types';

type AdvancedValues = {
  satisfaction: number;
  performance: number;
  accentColor: string;
  resume: File | undefined;
  startDate: Date;
  office: FormedibleLocationValue | undefined;
};

export const advancedFields = [
  {
    name: 'satisfaction',
    type: 'rating',
    label: 'Satisfaction',
    ratingConfig: { max: 5, allowHalf: true, icon: 'star', size: 'lg', showValue: true },
  },
  {
    name: 'performance',
    type: 'slider',
    label: 'Performance',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 5,
      valueLabelSuffix: '%',
      showValue: true,
      marks: [{ value: 50, label: 'Midpoint' }],
    },
  },
  {
    name: 'accentColor',
    type: 'color',
    label: 'Accent color',
    colorConfig: { format: 'hex', showPreview: true, presetColors: ['#0f172a', '#2563eb'] },
  },
  {
    name: 'resume',
    type: 'file',
    label: 'Resume',
    fileConfig: { accept: '.pdf', maxFiles: 1, maxSize: 2_000_000 },
  },
  {
    name: 'startDate',
    type: 'date',
    label: 'Start date',
    dateConfig: { minDate: '2026-01-01' },
  },
  {
    name: 'office',
    type: 'location',
    label: 'Office',
    locationConfig: { enableSearch: true, enableManualEntry: true, showMap: true },
  },
] satisfies readonly FormedibleFieldConfig<AdvancedValues>[];`,
    },
    references: [
      { title: 'Advanced fields live example', description: 'Rendered docs example for advanced field types.', href: '/docs/examples?example=advanced-fields' },
      sourceReference('Advanced field example source', 'apps/web/src/components/docs/examples/advanced-field-types-form.tsx', 'The live example source for ratings, sliders, files, location, duration, color, and password.'),
      sourceReference('Advanced config types', 'packages/formedible/src/lib/formedible/types.ts#L513-L651', 'Date, slider, rating, color, phone, duration, location, and file config interfaces.'),
    ],
  },
  {
    title: 'Multi-value fields',
    body: 'multiSelect, combobox, autocomplete, and multiCombobox share the option model. Their nested configs control search, creation, limits, and autocomplete loading.',
    bullets: [
      'multiSelect config: { multiSelectConfig: { searchable: true, creatable: true, maxSelections: 3, placeholder: "Pick skills" } }. Source: multi-select-field.tsx.',
      'combobox config: { comboboxConfig: { searchable: true, searchPlaceholder: "Search countries", noOptionsText: "No match" } }. Source: combobox-field.tsx.',
      'autocomplete config: { autocompleteConfig: { options: ["France"], minChars: 1, debounceMs: 300, allowCustom: false } }. Source: autocomplete-field.tsx; stale async behavior is tested in tests/formedible/advanced-fields.test.tsx.',
      'Example pointers: contact uses combobox and multiCombobox in apps/web/src/components/docs/examples/contact-form.tsx; survey uses multiSelect in apps/web/src/components/docs/examples/survey-form.tsx.',
    ],
    snippet: {
      title: 'multiSelect, combobox, and autocomplete config',
      language: 'ts',
      code: `import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type DiscoveryValues = {
  features: string[];
  country: string;
  city: string;
};

export const discoveryFields = [
  {
    name: 'features',
    type: 'multiSelect',
    label: 'Features',
    options: [
      { value: 'forms', label: 'Forms' },
      { value: 'validation', label: 'Validation' },
      { value: 'analytics', label: 'Analytics' },
    ],
    multiSelectConfig: {
      searchable: true,
      creatable: true,
      maxSelections: 3,
      placeholder: 'Pick features',
      noOptionsText: 'No features found',
    },
  },
  {
    name: 'country',
    type: 'combobox',
    label: 'Country',
    options: ['France', 'Germany', 'Japan'],
    comboboxConfig: {
      searchable: true,
      placeholder: 'Select country',
      searchPlaceholder: 'Search countries',
      noOptionsText: 'No country found',
    },
  },
  {
    name: 'city',
    type: 'autocomplete',
    label: 'City',
    autocompleteConfig: {
      options: ['Paris', 'Berlin', 'Tokyo'],
      minChars: 1,
      debounceMs: 300,
      maxResults: 5,
      allowCustom: false,
      noOptionsText: 'No city found',
    },
  },
] satisfies readonly FormedibleFieldConfig<DiscoveryValues>[];`,
    },
    references: [
      sourceReference('MultiSelectField', 'packages/formedible/src/components/formedible/fields/multi-select-field.tsx#L12-L78', 'maxSelections, searchable, creatable, placeholder, and noOptionsText reads.'),
      sourceReference('AutocompleteField', 'packages/formedible/src/components/formedible/fields/autocomplete-field.tsx#L66-L152', 'debounce, minChars, maxResults, asyncOptions, and stale request handling.'),
      sourceReference('Contact example source', 'apps/web/src/components/docs/examples/contact-form.tsx#L124-L168', 'Combobox and multiCombobox usage in the docs contact example.'),
    ],
  },
  {
    title: 'Structural fields',
    body: 'array and object fields render child fields with nested paths. objectConfig.fields wins over nestedFields for object fields.',
    bullets: [
      'Working link: /docs/examples?example=arrays, id arrays, source apps/web/src/components/docs/examples/array-fields-form.tsx.',
      'Object arrays use { arrayConfig: { itemType: "object", minItems: 1, maxItems: 10, sortable: true, defaultValue: { name: "", email: "" }, objectConfig: { layout: "grid", columns: 2, fields: [{ name: "name", type: "text", label: "Name" }, { name: "email", type: "email", label: "Email" }] } } }. Source: array-field.tsx.',
      'Scalar arrays use { arrayConfig: { itemType: "email", itemPlaceholder: "contact@company.com", defaultValue: "" } }. itemLabel, addButtonLabel, removeButtonLabel, and itemPlaceholder are consumed by array-field.tsx.',
      'Object fields use objectConfig.fields first, then nestedFields. Source: object-field.tsx; nested behavior is covered in tests/formedible/nested-fields.test.tsx.',
    ],
    snippet: {
      title: 'Array, object, and nestedFields config',
      language: 'ts',
      code: `import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type TeamValues = {
  members: { name: string; email: string; role: string }[];
  backupEmails: string[];
  billing: { company: string; taxId: string };
};

export const teamFields = [
  {
    name: 'members',
    type: 'array',
    label: 'Team members',
    arrayConfig: {
      itemType: 'object',
      itemLabel: 'Member',
      minItems: 1,
      maxItems: 10,
      sortable: true,
      defaultValue: { name: '', email: '', role: 'developer' },
      objectConfig: {
        layout: 'grid',
        columns: 2,
        fields: [
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'email', type: 'email', label: 'Email' },
          { name: 'role', type: 'select', label: 'Role', options: ['developer', 'designer', 'qa'] },
        ],
      },
    },
  },
  {
    name: 'backupEmails',
    type: 'array',
    label: 'Backup emails',
    arrayConfig: { itemType: 'email', itemPlaceholder: 'backup@example.com', defaultValue: '' },
  },
  {
    name: 'billing',
    type: 'object',
    label: 'Billing profile',
    nestedFields: [
      { name: 'company', type: 'text', label: 'Company' },
      { name: 'taxId', type: 'text', label: 'Tax ID' },
    ],
  },
] satisfies readonly FormedibleFieldConfig<TeamValues>[];`,
    },
    references: [
      { title: 'Arrays live example', description: 'Rendered docs example for sortable object arrays and scalar arrays.', href: '/docs/examples?example=arrays' },
      sourceReference('Array fields example source', 'apps/web/src/components/docs/examples/array-fields-form.tsx', 'Live example source for object arrays, scalar arrays, defaults, and max item counts.'),
      sourceReference('ArrayField', 'packages/formedible/src/components/formedible/fields/array-field.tsx#L62-L165', 'Nested path construction, item controls, objectConfig.fields rendering, and primitive item rendering.'),
      sourceReference('ObjectField', 'packages/formedible/src/components/formedible/fields/object-field.tsx#L12-L14', 'objectConfig.fields precedence over nestedFields.'),
    ],
  },
  {
    title: 'Dynamic behavior',
    body: 'Dynamic behavior lives in field config. Conditions, option functions, and text tokens resolve from current values.',
    bullets: [
      'Visibility config: { conditional: "billingAddress" } checks a path; { conditional: (values) => values.destination === "beach" } runs against current values.',
      'Dynamic text uses tokens in label, description, placeholder, page title, page description, and section copy. See resolveDynamicText in dynamic-text.ts and use-formedible.tsx.',
      'Live examples: /docs/examples?example=conditional-pages for page-level conditions and /docs/examples?example=conditional-object-array for conditions inside array object items.',
      'Tests: tests/formedible/advanced-fields.test.tsx checks dynamic labels, conditional car fields, and page copy; tests/formedible/section-rendering.test.tsx checks section output.',
    ],
    snippet: {
      title: 'conditional string/function and dynamic options',
      language: 'ts',
      code: `import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type TravelValues = {
  hasCompanyAccount: boolean;
  companyName: string;
  country: string;
  region: string;
};

export const travelFields = [
  { name: 'hasCompanyAccount', type: 'switch', label: 'Booking for a company?' },
  {
    name: 'companyName',
    type: 'text',
    label: 'Company name',
    conditional: 'hasCompanyAccount',
  },
  {
    name: 'country',
    type: 'select',
    label: 'Country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
    ],
  },
  {
    name: 'region',
    type: 'select',
    label: 'Region for {{country}}',
    conditional: (values) => values.country !== '',
    options: (values) => {
      if (values.country === 'us') {
        return [{ value: 'ca', label: 'California' }, { value: 'ny', label: 'New York' }];
      }

      if (values.country === 'ca') {
        return [{ value: 'on', label: 'Ontario' }, { value: 'qc', label: 'Quebec' }];
      }

      return [];
    },
  },
] satisfies readonly FormedibleFieldConfig<TravelValues>[];`,
    },
    references: [
      sourceReference('useFormedible conditional rendering', 'packages/formedible/src/hooks/use-formedible.tsx#L141-L163', 'String and function conditionals plus label, description, placeholder, and section text resolution.'),
      sourceReference('Multi-page conditionals', 'packages/formedible/src/hooks/use-multi-page.ts#L27-L55', 'Page and field conditional checks.'),
      sourceReference('Survey dynamic options source', 'apps/web/src/components/docs/examples/survey-form.tsx#L218-L276', 'Country-to-region option function in a docs example.'),
      { title: 'Conditional pages live example', description: 'Rendered example for page-level conditions.', href: '/docs/examples?example=conditional-pages' },
    ],
  },
  {
    title: 'Custom rendering',
    body: 'Custom rendering has a fixed order: field component, defaultComponents, then registry. Field wrapper wraps first, then globalWrapper.',
    bullets: [
      'Per-field component wins first through the component key. Then defaultComponents[renderConfig.type], then getFieldComponent(type) from field-registry.tsx.',
      'Per-field wrapper wraps a single field; globalWrapper wraps rendered fields from useFormedible options. Both receive fieldConfig, field, and children.',
      'The shared code card on this page uses docsCodeExamples id field-registry-extension from apps/web/src/features/docs/code-examples.ts.',
      'The advanced-fields live example shows sliderConfig.visualizationComponent for custom slider visuals without replacing the whole slider renderer.',
    ],
    snippet: {
      title: 'Per-field component and wrapper override',
      language: 'tsx',
      code: `import type { ReactNode } from 'react';
import type { FormedibleFieldConfig, FormedibleFieldRenderProps, FormedibleFieldWrapperProps } from '@/components/ui/formedible/lib/types';

type CustomValues = { projectCode: string };

function ProjectCodeField({ fieldConfig, field }: FormedibleFieldRenderProps<CustomValues>) {
  return (
    <label className="grid gap-2">
      <span>{fieldConfig.label}</span>
      <input
        id={field.id}
        name={field.name}
        value={typeof field.value === 'string' ? field.value : ''}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
      />
    </label>
  );
}

function AuditWrapper({ children, fieldConfig }: FormedibleFieldWrapperProps<CustomValues>) {
  return <div data-field-name={fieldConfig.name}>{children}</div>;
}

export const customFields = [
  {
    name: 'projectCode',
    type: 'text',
    label: 'Project code',
    component: ProjectCodeField,
    wrapper: AuditWrapper,
  },
] satisfies readonly FormedibleFieldConfig<CustomValues>[];

export function GlobalWrapper({ children }: { readonly children: ReactNode }) {
  return <section className="rounded-lg border p-4">{children}</section>;
}`, 
    },
    references: [
      sourceReference('FieldRenderer', 'packages/formedible/src/components/formedible/field-renderer.tsx#L4-L23', 'Render order for component, defaultComponent, registry, wrapper, and globalWrapper.'),
      sourceReference('fieldRegistry', 'packages/formedible/src/components/formedible/fields/field-registry.tsx#L30-L63', 'Built-in normalized type to component map.'),
      sourceReference('UseFormedibleOptions', 'packages/formedible/src/lib/formedible/types.ts#L448-L460', 'defaultComponents and globalWrapper option types.'),
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options, config types, and renderer contracts.', href: '/docs/api' },
  { title: 'Validation', description: 'Schema, field, async, inline, and cross-field validation patterns.', href: '/docs/validation' },
  { title: 'Getting Started', description: 'Install the copied files and render your first typed form.', href: '/docs/getting-started' },
  { title: 'Dynamic Array Fields', description: 'Open sortable object arrays and scalar arrays in the live examples browser.', href: '/docs/examples?example=arrays' },
  { title: 'Advanced Field Types', description: 'Open ratings, files, location, duration, color, and custom slider visuals.', href: '/docs/examples?example=advanced-fields' },
] satisfies readonly DocsGuideLink[];

export const Route = createFileRoute('/docs/fields')({
  head: () => routeHead,
  component: FieldsRoute,
});

function FieldsRoute() {
  return (
    <DocsGuidePage
      eyebrow="Field model"
      title="Field configuration"
      description="Use these config keys with the source files and examples that read them."
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
