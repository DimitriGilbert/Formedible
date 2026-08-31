# Field reference — every Formedible field type

All examples import types from `@/components/ui/formedible/lib/types` and assume a values type. Field renderer sources live in `components/ui/formedible/fields/` after install; type `type` defaults to `'text'`.

Value shapes (what the field stores in form values):

| Type | Value | Type | Value |
| --- | --- | --- | --- |
| text/email/password/url/tel/masked | `string` | select/radio/combobox/autocomplete | `string` (option value) |
| textarea | `string` | multiSelect/multiCombobox | `string[]` |
| number/slider/rating | `number` | checkbox/switch | `boolean` |
| date | `Date \| undefined` (user picks store a local-midnight `Date`; clearing stores `undefined`) | phone | `string` |
| color | `string` (per `colorConfig.format`) | file | `File \| undefined` (or `File[]` with `multiple`) |
| array | scalar items: `string[]`; object items: item objects | object | nested object |
| duration | `{ hours, minutes, seconds, totalSeconds }` | location | `{ lat, lng, address?, city?, state?, country? }` |

## Common keys on every field

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = {
  fullName: string;
  nickname: string;
  account: { tier: string };
};

export const commonFields = [
  {
    name: 'fullName',                    // required — must exist in defaultValues/schema
    type: 'text',                        // FormedibleFieldType | custom string
    label: 'Full name',                  // ReactNode; supports {{token}} interpolation
    description: 'As printed on your ID',
    placeholder: 'Ada Lovelace',
    disabled: false,
    required: true,                      // adds the built-in required validator + label mark
    className: 'max-w-sm',               // field shell; hook-level fieldClassName appends to every field
    inputClassName: 'font-mono',         // inner control (where the renderer exposes it)
    labelClassName: 'text-muted-foreground',   // hook-level labelClassName appends to every label
    page: 1,                             // multi-page forms
    tab: 'profile',                      // tabbed forms
    section: 'Identity',                 // or { title, description, collapsible, defaultExpanded }
    conditional: 'account.tier',         // string = truthy path; or (values) => boolean
    help: {                              // ReactNode also accepted
      text: 'Your name appears on the certificate',
      tooltip: 'Exactly as on your government ID',
      position: 'top',                   // 'top' | 'bottom' | 'left' | 'right'
      link: { url: 'https://example.com/names', text: 'Naming rules' },
    },
  },
  {
    name: 'nickname',
    type: 'text',
    datalist: ['Ada', 'Grace', 'Linus'], // native suggestions for text-like and number inputs
    conditional: (values) => values.account.tier === 'premium',
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

## Text-like: text, email, password, url, tel

`email` and `url` share the text renderer and add built-in format checks (see `references/validation.md`).

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = { workEmail: string; secret: string; site: string };

export const textFields = [
  { name: 'workEmail', type: 'email', label: 'Work email', placeholder: 'ada@example.com' },
  { name: 'site', type: 'url', label: 'Website', placeholder: 'https://example.com' },
  {
    name: 'secret',
    type: 'password',
    label: 'Password',
    passwordConfig: {
      showToggle: true,       // hide/reveal button
      strengthMeter: true,    // derived strength meter
      minStrength: 3,         // 0-4 guidance shown by the meter
    },
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

Masked input (top-level `mask` or full `maskedInputConfig`; `maskedInput` type is an alias):

```ts
{ name: 'ssn', type: 'masked', mask: '999-99-9999' }
// mask chars: 9/0 digits, a/A letters, * alphanumeric; function masks allowed
{
  name: 'code',
  type: 'maskedInput',
  maskedInputConfig: {
    mask: 'AAA-0000',
    showMask: true,
    guide: true,
    keepCharPositions: true,
    pipe: (conformedValue) => (conformedValue.endsWith('0000') ? false : `${conformedValue}X`),
  },
}
```

## textarea

```ts
{
  name: 'bio',
  type: 'textarea',
  label: 'Short bio',
  rows: 4,               // top-level; wins over textareaConfig.rows
  maxLength: 500,        // top-level; also a built-in validator
  textareaConfig: { rows: 4, cols: 40, maxLength: 500, resize: 'vertical', showWordCount: true },
}
```

## number

```ts
{
  name: 'salaryExpectation',
  type: 'number',
  label: 'Salary expectation',
  min: 0,             // top-level wins over numberConfig; also a built-in validator
  max: 300000,
  step: 1000,
  numberConfig: { min: 0, max: 300000, step: 1000 },
}
```

## checkbox and switch (booleans)

```ts
{ name: 'subscribe', type: 'checkbox', label: 'Subscribe to updates' }
{ name: 'notifications', type: 'switch', label: 'Enable notifications' }
```

`required: true` on a checkbox/switch rejects `false` (unchecked fails the required check).

## Selection: select and radio

Options are strings or `{ value, label, description?, disabled? }` objects; a function receives current values and re-resolves on change.

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = { plan: string; cadence: string; country: string; region: string };

export const selectionFields = [
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
  { name: 'cadence', type: 'radio', label: 'Billing cadence', options: ['monthly', 'yearly'] },
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

      return values.country === 'ca'
        ? [{ value: 'on', label: 'Ontario' }, { value: 'qc', label: 'Quebec' }]
        : [];
    },
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

## Multi-value: multiSelect, combobox, autocomplete, multiCombobox

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = { features: string[]; country: string; city: string; tags: string[] };

export const multiFields = [
  {
    name: 'features',
    type: 'multiSelect',                       // 'multiselect' alias normalizes to this
    label: 'Features',
    options: [
      { value: 'forms', label: 'Forms' },
      { value: 'validation', label: 'Validation' },
      { value: 'analytics', label: 'Analytics' },
    ],
    multiSelectConfig: {
      searchable: true,
      creatable: true,                          // lets users add values not in options
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
      options: ['Paris', 'Berlin', 'Tokyo'],    // wins over top-level options
      asyncOptions: async (query) => {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
        const cities = (await response.json()) as readonly string[];

        return cities;                          // stale responses are ignored automatically
      },
      minChars: 1,
      debounceMs: 300,
      maxResults: 5,
      allowCustom: false,
      noOptionsText: 'No city found',
      loadingText: 'Searching…',
    },
  },
  {
    name: 'tags',
    type: 'multiCombobox',                      // 'multicombobox' alias normalizes to this
    label: 'Tags',
    options: ['bug', 'feature', 'docs'],
    multiComboboxConfig: { searchable: true, creatable: true, maxSelections: 3 },
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

## date

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = { startDate: Date | undefined; birthDate: Date | undefined; meeting: string };

export const dateFields = [
  { name: 'startDate', type: 'date', label: 'Start date', dateConfig: { minDate: '2026-01-01' } },
  {
    name: 'birthDate',
    type: 'date',
    label: 'Birth date',
    dateConfig: {
      minDate: new Date('1900-01-01'),   // Date or 'YYYY-MM-DD' string
      maxDate: new Date(),
      disablePastDates: true,            // effective min becomes the later of minDate and today
      disableFutureDates: true,          // effective max becomes the earlier of maxDate and today
      disableDate: (date, values) => date.getDay() === 0 || values.meeting !== '',
      format: 'MM/dd/yyyy',              // display format hint
    },
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

Picking a date stores a `Date` (local midnight); clearing stores `undefined`. The `'YYYY-MM-DD'` form is display-only (input value, `minDate`/`maxDate` bounds) — string `defaultValues` pass through untouched until edited. Zod gotcha: type the schema for `Date` (`z.date().optional()`, or `z.coerce.date()` to also accept strings); `z.string()` fails the moment a user picks a date.

## slider

```ts
import type { FormedibleFieldConfig, FormedibleSliderVisualizationProps } from '@/components/ui/formedible/lib/types';

function SpeedVisual({ value, isActive }: FormedibleSliderVisualizationProps) {
  return <span className={isActive ? 'font-bold' : undefined}>{value} km/h</span>;
}

type Values = { performance: number; passengers: number; speed: number };

export const sliderFields = [
  {
    name: 'performance',
    type: 'slider',
    label: 'Performance',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 10,
      showValue: true,
      valueLabelSuffix: '%',
      marks: [{ value: 50, label: 'Midpoint' }],
      gradientColors: { start: '#ef4444', end: '#22c55e', direction: 'horizontal' },
    },
  },
  { name: 'passengers', type: 'slider', label: 'Passengers', sliderConfig: { min: 1, max: 8, step: 1, showValue: true } },
  {
    name: 'speed',
    type: 'slider',
    label: 'Speed',
    sliderConfig: {
      min: 0,
      max: 200,
      step: 10,
      valueMapping: [
        { sliderValue: 0, displayValue: 'Stopped', label: '0' },
        { sliderValue: 200, displayValue: 'Max', label: '200' },
      ],
      visualizationComponent: SpeedVisual,
    },
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

Other `sliderConfig` keys: `valueLabelPrefix`, `valueDisplayPrecision`, `showRawValue`.

## rating

```ts
{
  name: 'satisfaction',
  type: 'rating',
  label: 'Satisfaction',
  ratingConfig: { max: 5, allowHalf: true, icon: 'star', size: 'lg', showValue: true },
  // icon: 'star' | 'heart' | 'thumbs'; size: 'sm' | 'md' | 'lg'
}
```

## phone

```ts
{
  name: 'phone',
  type: 'phone',
  label: 'Phone',
  phoneConfig: {
    defaultCountry: 'US',
    format: 'national',              // 'national' | 'international'
    allowedCountries: ['US', 'CA'],
    placeholder: '555-0100',
  },
}
```

## color

```ts
{
  name: 'accentColor',
  type: 'color',                     // 'colorPicker' alias normalizes to this
  label: 'Accent color',
  colorConfig: {
    format: 'hex',                   // 'hex' | 'rgb' | 'hsl'
    showPreview: true,
    presetColors: ['#0f172a', '#2563eb', '#dc2626'],
    allowCustom: true,
  },
}
```

## duration

```ts
import type { FormedibleDurationValue, FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = { workDuration: FormedibleDurationValue | undefined };

export const durationField = [{
  name: 'workDuration',
  type: 'duration',
  label: 'Work duration',
  durationConfig: { format: 'hm', maxHours: 24, maxMinutes: 59, maxSeconds: 59, showLabels: true },
  // format: 'hms' | 'hm' | 'ms' | 'hours' | 'minutes' | 'seconds'
}] satisfies readonly FormedibleFieldConfig<Values>[];
```

## location

```ts
import type { FormedibleFieldConfig, FormedibleLocationValue } from '@/components/ui/formedible/lib/types';

type Values = { office: FormedibleLocationValue | undefined };

export const locationField = [{
  name: 'office',
  type: 'location',
  label: 'Office',
  locationConfig: {
    defaultLocation: { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'FR' },
    enableSearch: true,            // requires searchCallback for real data
    enableGeolocation: true,       // browser geolocation; pair with reverseGeocodeCallback
    enableManualEntry: true,
    showMap: true,                 // typed for compatibility; no tile map is rendered
    searchPlaceholder: 'Search an address',
    searchOptions: { debounceMs: 300, minQueryLength: 3, maxResults: 5 },
    searchCallback: async (query, options) => {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=${options.limit ?? 5}`);
      const results = (await response.json()) as readonly FormedibleLocationValue[];

      return results;
    },
    reverseGeocodeCallback: async (lat, lng) => ({ lat, lng, address: `${lat}, ${lng}` }),
  },
}] satisfies readonly FormedibleFieldConfig<Values>[];
```

## file

```ts
{
  name: 'resume',
  type: 'file',
  label: 'Resume',
  accept: '.pdf,.doc,.docx',          // top-level; falls back to fileConfig.accept
  fileConfig: {
    accept: '.pdf',
    multiple: false,
    maxSize: 5_242_880,               // bytes; oversize files are rejected with reason 'maxSize'
    maxFiles: 1,                      // reason 'maxFiles'
    onFilesChange: (files) => console.log('files', files),
    onFileRemove: (file) => console.log('removed', file.name),
    onFilesRejected: (rejections) => rejections.forEach((r) => console.warn(r.reason, r.file.name)),
  },
}
```

## array — scalar and object items

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = {
  members: { name: string; email: string; role: string }[];
  backupEmails: string[];
};

export const arrayFields = [
  {
    name: 'members',
    type: 'array',
    label: 'Team members',
    arrayConfig: {
      itemType: 'object',
      minItems: 1,
      maxItems: 10,
      sortable: true,                                  // up/down reorder controls
      defaultValue: { name: '', email: '', role: 'developer' },
      objectConfig: {                                  // array items consume only fields/layout/columns
        layout: 'grid',                                // 'stack' | 'grid' ('vertical'/'horizontal' render like stack)
        columns: 2,
        fields: [                                      // wins over nestedFields
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'email', type: 'email', label: 'Email' },
          { name: 'role', type: 'select', label: 'Role', options: ['developer', 'designer', 'qa'] },
        ],
      },
      // Consumed by the array renderer via the config's custom-prop passthrough
      // (accepted at runtime, not named in FormedibleArrayConfig):
      itemLabel: 'Member',
      addButtonLabel: 'Add member',
      removeButtonLabel: 'Remove',
    },
  },
  {
    name: 'backupEmails',
    type: 'array',
    label: 'Backup emails',
    arrayConfig: { itemType: 'email', minItems: 1, maxItems: 5, defaultValue: '', itemPlaceholder: 'backup@example.com' },
  },
] satisfies readonly FormedibleFieldConfig<Values>[];
```

`arrayConfig.objectConfig` consumes only `fields`, `layout`, and `columns` — each item always renders in a bordered row. `collapsible`/`showCard`/`defaultExpanded` (and `collapseLabel`/`expandLabel`) work only on a `type: 'object'` field's own `objectConfig`; `defaultCollapsed`, though typed on `FormedibleArrayObjectConfig`, is read nowhere.

Conditionals inside array object items evaluate against that item's local values:

```ts
objectConfig: {
  fields: [
    { name: 'equipementRoom', type: 'switch', label: 'Equipment in room' },
    {
      name: 'equipementListRoom',
      type: 'textarea',
      label: 'Equipment list',
      maxLength: 1000,
      conditional: (itemValues) => itemValues.equipementRoom === true,
    },
  ],
}
```

## object — nested object fields

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type Values = { billing: { company: string; taxId: string } };

export const objectField = [{
  name: 'billing',
  type: 'object',
  label: 'Billing profile',
  objectConfig: {           // fields here win over nestedFields
    collapsible: true,
    defaultExpanded: true,
    showCard: true,
    collapseLabel: 'Hide billing',
    expandLabel: 'Show billing',
    layout: 'grid',
    columns: 2,
    fields: [
      { name: 'company', type: 'text', label: 'Company' },
      { name: 'taxId', type: 'text', label: 'Tax ID' },
    ],
  },
  // nestedFields: [...] works too; objectConfig.fields takes precedence
}] satisfies readonly FormedibleFieldConfig<Values>[];
```

## Custom rendering

Render order per field: `field.component` → `defaultComponents[type]` → built-in registry → text fallback. Wrapping order: per-field `wrapper` first, then hook-level `globalWrapper`.

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';
import type {
  FormedibleFieldConfig,
  FormedibleFieldRenderProps,
  FormedibleFieldWrapperProps,
} from '@/components/ui/formedible/lib/types';

type Values = { projectCode: string; displayName: string };

function ProjectCodeField({ fieldConfig, field }: FormedibleFieldRenderProps<Values>) {
  const value = typeof field.value === 'string' ? field.value : '';

  return (
    <label className="grid gap-2">
      <span>{fieldConfig.label}</span>
      <input
        id={field.id}
        name={field.name}
        value={value}
        className="h-9 rounded-md border px-3"
        aria-invalid={field.error ? true : undefined}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
      />
      {field.error ? <span className="text-xs text-destructive">{field.error}</span> : null}
    </label>
  );
}

function AuditWrapper({ children, fieldConfig }: FormedibleFieldWrapperProps<Values>) {
  return <div data-field-name={fieldConfig.name}>{children}</div>;
}

export function ProjectForm() {
  const projectForm = useFormedible<Values>({
    fields: [
      { name: 'projectCode', type: 'text', label: 'Project code', component: ProjectCodeField, wrapper: AuditWrapper },
      { name: 'displayName', type: 'text', label: 'Display name' },
    ],
    defaultComponents: { text: ProjectCodeField },  // type-wide override; custom type strings match verbatim
    formOptions: { defaultValues: { projectCode: '', displayName: '' } },
  });

  return <projectForm.Form />;
}
```

Custom component props contract (`FormedibleFieldComponentProps`): the render-props shape (`field` controller with `id/name/value/error/onBlur/onChange/formValues`, `fieldConfig`, `renderField`) plus legacy flat props (`fieldApi`, `label`, `placeholder`, `description`, `disabled`, `required`, `options`, `min`, `max`, `step`, `rows`, `maxLength`, resolved nested configs). The `field` controller's `onChange(value)` writes the value; `onBlur()` marks blur; `error` is the formatted validation message.

## Sections

Consecutive fields sharing a `section` render under one header. Object form adds collapse controls.

```ts
[
  { name: 'street', type: 'text', label: 'Street', section: 'Address' },
  { name: 'city', type: 'text', label: 'City', section: 'Address' },
  {
    name: 'billing',
    type: 'object',
    section: { title: 'Billing', description: 'Paid invoices only', collapsible: true, defaultExpanded: false },
  },
]
```
