# Builder Dogfooding Config Forms Plan

## Goal

Make `packages/builder` the primary showcase of Formedible capabilities by replacing the current mostly hand-coded field configurator with Formedible-powered configuration forms.

Each builder field type should have a dedicated configuration form composed from shared common sections and field-specific sections. This turns the builder into dogfooding: configuring Formedible fields should itself demonstrate arrays, nested objects, validation, pages, tabs, previews, and generated code.

## Current State

The builder already has a good standalone package boundary:

- Public builder API is exported from `packages/builder/src/index.ts`.
- Editable field type metadata lives in `packages/builder/src/lib/formedible/builder-types.ts`.
- Field state is centralized in `packages/builder/src/components/formedible/builder/field-store.ts`.
- The current selected-field editor is `packages/builder/src/components/formedible/builder/field-configurator.tsx`.
- Preview already dogfoods `useFormedible` in `packages/builder/src/components/formedible/builder/form-preview.tsx`.
- Code generation is handled in `packages/builder/src/lib/formedible/code-generation.ts`.
- Runtime field support lives in `packages/builder/src/components/formedible/fields/field-registry.tsx`.

The main gap is `FieldConfigurator`. It currently renders raw React inputs manually and only has limited special handling for:

- Basic metadata: `label`, `name`, `placeholder`, `description`, `required`.
- Page selection when multiple pages exist.
- Options for `select`, `radio`, and `multiSelect` as a newline textarea.
- Numeric `min`, `max`, and `step` for `number`, `slider`, and `rating`.

This does not showcase Formedible's array/object field capabilities and does not expose most field-specific config objects already supported by the runtime.

## Target Architecture

Create a Formedible-powered config-form layer for the builder.

New files:

- `packages/builder/src/lib/formedible/builder-config-types.ts`
- `packages/builder/src/lib/formedible/builder-config-registry.ts`
- `packages/builder/src/lib/formedible/builder-config-transforms.ts`
- `packages/builder/src/components/formedible/builder/field-configuration-form.tsx`
- `packages/builder/src/components/formedible/builder/config-fields/option-list-config.ts`
- `packages/builder/src/components/formedible/builder/config-fields/nested-fields-config.ts`

`FieldConfigurator` should become a thin shell that:

- Reads the selected `FormField` from `globalFieldStore`.
- Looks up a config form definition by `field.type`.
- Renders `FieldConfigurationForm`.
- Persists changes through `globalFieldStore.updateField`.

The actual configuration UI should be rendered through `useFormedible`.

## Config Form Definition

Each field type should have a registry entry shaped like this:

```ts
interface FieldConfigFormDefinition {
  readonly type: FormedibleFieldType;
  readonly title: string;
  readonly description: string;
  readonly fields: readonly FormedibleFieldConfig[];
  readonly defaultValues: (field: FormField, context: BuilderConfigContext) => FormedibleFormValues;
  readonly toFieldUpdate: (values: FormedibleFormValues, field: FormField) => Partial<FormField>;
}
```

Each definition composes common field arrays with specific field arrays:

- Common identity fields.
- Common behavior fields.
- Common placement fields.
- Common validation fields.
- Field-specific configuration fields.

## Common Form Parts

These should be reusable Formedible field arrays, not JSX helper components.

### Identity

- `label`: text
- `name`: text
- `description`: textarea
- `placeholder`: text
- `helpText`: textarea, maps to `help.text`
- `dynamicPlaceholder`: switch

### Behavior

- `required`: switch
- `disabled`: switch
- `defaultValue`: field-specific editor
- `conditionalSource`: placeholder for later conditional builder support

### Placement

- `page`: select generated from `metadata.pages`
- `tab`: select generated from `metadata.tabs`
- `sectionTitle`: text
- `sectionDescription`: textarea

### Validation

- `requiredMessage`: text
- `minLength`: number for string-like fields
- `maxLength`: number for string-like fields
- `pattern`: text for string-like fields
- `min`: number for numeric fields
- `max`: number for numeric fields
- `step`: number for numeric fields
- `minItems`: number for array-like fields
- `maxItems`: number for array-like fields

Do not store function validators directly on `FormField`. They are not safely serializable. Add builder-owned validation metadata and teach code generation to produce Zod schema code from it.

## Option List Editor

Replace the current newline textarea options editor with a reusable Formedible array/object editor.

Applies to:

- `select`
- `radio`
- `multiSelect`
- `combobox`
- `autocomplete`
- `multiCombobox`

Desired config field:

```ts
{
  name: 'options',
  type: 'array',
  label: 'Options',
  arrayConfig: {
    itemType: 'object',
    itemLabel: 'Option',
    sortable: true,
    minItems: 1,
    defaultValue: {
      label: '',
      value: '',
      disabled: false,
      description: '',
    },
    objectConfig: {
      fields: [
        { name: 'label', type: 'text', label: 'Label', required: true },
        { name: 'value', type: 'text', label: 'Value', required: true },
        { name: 'disabled', type: 'switch', label: 'Disabled' },
        { name: 'description', type: 'textarea', label: 'Description' },
      ],
    },
  },
}
```

This is the core dogfooding moment: the builder uses Formedible arrays and nested object fields to configure Formedible options.

## Field Palette Coverage

Expand `builderFieldTypes` to expose all canonical runtime-supported field types:

- `text`
- `email`
- `password`
- `url`
- `tel`
- `textarea`
- `number`
- `select`
- `radio`
- `checkbox`
- `switch`
- `date`
- `slider`
- `rating`
- `color`
- `phone`
- `file`
- `array`
- `object`
- `multiSelect`
- `combobox`
- `autocomplete`
- `multiCombobox`
- `duration`
- `location`
- `masked`

Do not expose aliases such as `multiselect`, `multicombobox`, `colorPicker`, and `maskedInput` in the add-field palette unless needed for import compatibility.

## Field-Specific Forms

### Text, Email, URL, Tel

- Common identity fields.
- Placeholder.
- Datalist as an array of label/value options.
- String validation: min length, max length, pattern, required message.
- Preset schema generation:
  - `email`: `z.string().email()`.
  - `url`: `z.string().url()`.
  - `tel`: phone-ish pattern guidance.

### Password

- Common identity fields.
- Placeholder.
- `passwordConfig.showToggle`.
- `passwordConfig.strengthMeter`.
- `passwordConfig.minStrength`.
- Min length, max length, pattern.

### Textarea

- Common identity fields.
- `textareaConfig.rows`.
- `textareaConfig.cols`.
- `textareaConfig.maxLength`.
- `textareaConfig.resize`.
- `textareaConfig.showWordCount`.
- String validation.

### Number

- Common identity fields.
- `min`.
- `max`.
- `step`.
- `numberConfig.min`.
- `numberConfig.max`.
- `numberConfig.step`.
- Numeric validation.

### Select

- Common identity fields.
- Options array/object editor.
- Placeholder.
- Default selected value.
- Required validation.

### Radio

- Common identity fields.
- Options array/object editor.
- Default selected value.
- Required validation.

### Checkbox

- Common identity fields.
- Default checked.
- Required true validation.
- Description/help emphasis because checkbox label often carries the prompt.

### Switch

- Common identity fields.
- Default checked.
- Required true validation where useful.

### Multi-Select

- Common identity fields.
- Options array/object editor.
- `multiSelectConfig.maxSelections`.
- `multiSelectConfig.searchable`.
- `multiSelectConfig.creatable`.
- `multiSelectConfig.placeholder`.
- `multiSelectConfig.noOptionsText`.
- Array min/max validation.

### Combobox

- Common identity fields.
- Options array/object editor.
- `comboboxConfig.searchable`.
- `comboboxConfig.placeholder`.
- `comboboxConfig.searchPlaceholder`.
- `comboboxConfig.noOptionsText`.
- Required validation.

### Autocomplete

- Common identity fields.
- Options array/object editor.
- `autocompleteConfig.debounceMs`.
- `autocompleteConfig.minChars`.
- `autocompleteConfig.maxResults`.
- `autocompleteConfig.allowCustom`.
- `autocompleteConfig.placeholder`.
- `autocompleteConfig.noOptionsText`.
- `autocompleteConfig.loadingText`.
- Do not expose `asyncOptions` as a raw function in the visual builder initially.

### Multi-Combobox

- Common identity fields.
- Options array/object editor.
- `maxSelections`.
- `searchable`.
- `creatable`.
- `placeholder`.
- `searchPlaceholder`.
- `noOptionsText`.

### Date

- Common identity fields.
- `dateConfig.minDate`.
- `dateConfig.maxDate`.
- `dateConfig.format`.
- Later: safe disable-date presets, not raw functions.

### Slider

- Common identity fields.
- `sliderConfig.min`.
- `sliderConfig.max`.
- `sliderConfig.step`.
- `sliderConfig.valueLabelPrefix`.
- `sliderConfig.valueLabelSuffix`.
- `sliderConfig.valueDisplayPrecision`.
- `sliderConfig.showRawValue`.
- `sliderConfig.showValue`.
- `sliderConfig.marks` as array of `{ value, label }`.
- `sliderConfig.valueMapping` as array of `{ sliderValue, displayValue, label }`.
- Do not expose `visualizationComponent` initially because it is a component reference.

### Rating

- Common identity fields.
- `ratingConfig.max`.
- `ratingConfig.allowHalf`.
- `ratingConfig.icon`: select `star`, `heart`, `thumbs`.
- `ratingConfig.size`: select `sm`, `md`, `lg`.
- `ratingConfig.showValue`.
- Numeric min/max validation.

### Color

- Common identity fields.
- `colorConfig.format`: select `hex`, `rgb`, `hsl`.
- `colorConfig.showPreview`.
- `colorConfig.presetColors` as array of color values.
- `colorConfig.allowCustom`.
- Default color.

### Phone

- Common identity fields.
- `phoneConfig.defaultCountry`.
- `phoneConfig.format`: select `national`, `international`.
- `phoneConfig.allowedCountries` as multi-select from supported country codes.
- `phoneConfig.placeholder`.

### File

- Common identity fields.
- `fileConfig.accept`.
- `fileConfig.multiple`.
- `fileConfig.maxSize`.
- `fileConfig.maxFiles`.
- Required validation.
- Do not expose `onFilesChange` or `onFileRemove` in the visual builder initially.

### Array

- Common identity fields.
- `arrayConfig.itemType`.
- `arrayConfig.minItems`.
- `arrayConfig.maxItems`.
- `arrayConfig.sortable`.
- `arrayConfig.itemLabel`.
- `arrayConfig.itemPlaceholder`.
- `arrayConfig.addButtonLabel`.
- `arrayConfig.removeButtonLabel`.
- `arrayConfig.defaultValue`.
- If `itemType === 'object'`, show a nested field builder for `arrayConfig.objectConfig.fields`.

### Object

- Common identity fields.
- `objectConfig.layout`: select `stack`, `grid`.
- `objectConfig.columns`.
- `objectConfig.fields` nested field builder.
- Reuse the same field definition palette recursively, with an initial depth limit to keep UX understandable.

### Duration

- Common identity fields.
- `durationConfig.format`: select `hms`, `hm`, `ms`, `hours`, `minutes`, `seconds`.
- `durationConfig.maxHours`.
- `durationConfig.maxMinutes`.
- `durationConfig.maxSeconds`.
- `durationConfig.showLabels`.

### Location

- Common identity fields.
- `locationConfig.enableSearch`.
- `locationConfig.enableGeolocation`.
- `locationConfig.enableManualEntry`.
- `locationConfig.showMap`.
- `locationConfig.searchPlaceholder`.
- `locationConfig.searchOptions.debounceMs`.
- `locationConfig.searchOptions.minQueryLength`.
- `locationConfig.searchOptions.maxResults`.
- Do not expose `searchCallback` or `reverseGeocodeCallback` as raw function editors initially.

### Masked

- Common identity fields.
- `mask`.
- `maskedInputConfig.mask`.
- `maskedInputConfig.placeholder`.
- `maskedInputConfig.showMask`.
- `maskedInputConfig.guide`.
- `maskedInputConfig.keepCharPositions`.
- Do not expose `pipe` initially.

## Code Generation Updates

`packages/builder/src/lib/formedible/code-generation.ts` must become field-aware.

Current `serializeField` omits several supported config objects. It should serialize:

- `defaultValue`
- `help`
- `datalist`
- `textareaConfig`
- `passwordConfig`
- `numberConfig`
- `arrayConfig`
- `objectConfig`
- `autocompleteConfig`
- `maskedInputConfig`
- All config objects already handled today.

Schema generation should use builder validation metadata to emit:

- `z.string().email()` for email.
- `z.string().url()` for URL.
- Min/max length rules.
- Numeric min/max rules.
- Enum-like unions for static select/radio options.
- Array min/max rules for multi-select and array fields.
- Recursive object schemas for object fields and array object items.

## Preview Updates

`FormPreview` currently receives empty `defaultValues` from the preview tab. Improve this by deriving preview defaults from fields:

- Explicit `field.defaultValue` wins.
- String-like fields default to `''`.
- Number/rating/slider fields default to `min` or `0`.
- Checkbox/switch fields default to `false`.
- Multi-select and array fields default to `[]`.
- Object fields default to `{}`.
- File/location fields default to `null`.

Preview should also build a schema from builder validation metadata so validation behavior is visible while configuring.

## Nested Field Builder

For `array` and `object`, reuse the same field configuration registry recursively.

Add a `FieldListEditor` that manages `readonly FormedibleFieldConfig[]` and supports:

- Add field.
- Select field.
- Duplicate field.
- Delete field.
- Reorder field.
- Configure nested field.

Nested fields should store generated local IDs for editing convenience, but the serialized Formedible config should remain clean inside `objectConfig.fields` or `arrayConfig.objectConfig.fields`.

Start with a recursion depth limit to avoid confusing UX.

## Metadata Forms

The builder itself should also dogfood Formedible for form metadata/settings.

Add a metadata/settings configurator for:

- Title.
- Description.
- Layout type: pages or tabs.
- Pages as array of `{ page, title, description }`.
- Tabs as array of `{ id, label, description }`.
- Submit label.
- Next label.
- Previous label.
- Show progress.

This should eventually replace any ad hoc metadata editing and demonstrate arrays for pages/tabs.

## Implementation Phases

1. Add the config-form registry and common field groups.
2. Replace manual `FieldConfigurator` internals with a Formedible-powered `FieldConfigurationForm`.
3. Add the reusable option array/object editor and migrate `select`, `radio`, and `multiSelect` first.
4. Expand `builderFieldTypes` to all canonical runtime-supported fields.
5. Add specific config forms for each field type.
6. Add nested field editing for object and array fields.
7. Add builder validation metadata and update code generation.
8. Update preview default values and validation.
9. Add metadata/settings forms.
10. Sync builder package and verify consumers.

## Tests

Extend `packages/builder/src/builder.test.tsx` with coverage for:

- Every `builderFieldTypes` value has a config form definition.
- Every exposed field type exists in `field-registry.tsx`.
- Option-based config forms output `{ label, value, disabled, description }[]`.
- Code generation serializes nested config objects.
- Code generation emits schema rules from builder validation metadata.
- Array/object nested fields round-trip through serialization.
- `FieldConfigurator` source uses `useFormedible`, so dogfooding cannot silently regress.

## Verification

Use builder package commands first:

```bash
pnpm run check-types:builder
pnpm --filter @formedible/builder run test
pnpm run build:builder
```

Then sync and verify consumers:

```bash
pnpm --filter @formedible/builder run sync
pnpm run check-types
```

## Principle

The builder should not be a UI for Formedible built with raw inputs. It should be a Formedible form factory. Configuring fields should demonstrate the same capabilities users are about to generate: arrays, nested objects, options, validation, dynamic defaults, pages, tabs, preview, and production-ready code generation.
