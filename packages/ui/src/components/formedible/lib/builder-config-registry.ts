import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import type { FormField } from '@formedible/ui/components/formedible/lib/builder-types';
import type { BuilderConfigContext, FieldConfigFormDefinition } from '@formedible/ui/components/formedible/lib/builder-config-types';
import {
  baseDefaultValues,
  baseFieldUpdate,
  booleanValue,
  builderOptionsToOptions,
  optionalNumberValue,
  optionalStringValue,
  optionsToBuilderOptions,
  stringArrayValue,
} from '@formedible/ui/components/formedible/lib/builder-config-transforms';

const emptyFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [];

const resizeOptions = ['none', 'both', 'horizontal', 'vertical', 'block', 'inline'] as const;
const ratingIconOptions = ['star', 'heart', 'thumbs'] as const;
const sizeOptions = ['sm', 'md', 'lg'] as const;
const colorFormatOptions = ['hex', 'rgb', 'hsl'] as const;
const phoneFormatOptions = ['national', 'international'] as const;
const countryOptions = ['US', 'CA', 'GB', 'FR', 'DE'] as const;
const durationFormatOptions = ['hms', 'hm', 'ms', 'hours', 'minutes', 'seconds'] as const;
const objectLayoutOptions = ['stack', 'grid'] as const;
const arrayItemTypeOptions = ['string', 'text', 'email', 'number', 'checkbox', 'switch', 'object'] as const;

function option(value: string, label = value): { readonly value: string; readonly label: string } {
  return { value, label };
}

function pageOptions(context: BuilderConfigContext): readonly { readonly value: string; readonly label: string }[] {
  return context.availablePages.map((page) => option(String(page), `Page ${page}`));
}

function tabOptions(context: BuilderConfigContext): readonly { readonly value: string; readonly label: string }[] {
  const tabs = context.metadata?.tabs ?? [];
  return [option('', 'No tab'), ...tabs.map((tab) => option(tab.id, tab.label))];
}

function commonFields(context: BuilderConfigContext): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  return [
    { name: 'label', type: 'text', label: 'Label', required: true, section: { title: 'Identity', description: 'How this field appears to users.' } },
    { name: 'name', type: 'text', label: 'Name', required: true, description: 'The key used in form values and generated code.' },
    { name: 'description', type: 'textarea', label: 'Description', textareaConfig: { rows: 2 } },
    { name: 'placeholder', type: 'text', label: 'Placeholder' },
    { name: 'required', type: 'switch', label: 'Required', section: { title: 'Behavior', description: 'General behavior shared by every field.' } },
    { name: 'disabled', type: 'switch', label: 'Disabled' },
    { name: 'page', type: 'select', label: 'Page', options: pageOptions(context), section: { title: 'Placement', description: 'Where this field belongs in page or tab layouts.' } },
    { name: 'tab', type: 'select', label: 'Tab', options: tabOptions(context) },
    { name: 'sectionTitle', type: 'text', label: 'Section title' },
    { name: 'sectionDescription', type: 'textarea', label: 'Section description', textareaConfig: { rows: 2 } },
    { name: 'requiredMessage', type: 'text', label: 'Required message', section: { title: 'Validation', description: 'Serializable validation metadata used for generated schemas.' } },
  ];
}

const stringValidationFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
  { name: 'minLength', type: 'number', label: 'Minimum length', min: 0, step: 1 },
  { name: 'maxLength', type: 'number', label: 'Maximum length', min: 0, step: 1 },
  { name: 'pattern', type: 'text', label: 'Regex pattern' },
];

const numericValidationFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
  { name: 'validationMin', type: 'number', label: 'Validation minimum' },
  { name: 'validationMax', type: 'number', label: 'Validation maximum' },
];

const arrayValidationFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
  { name: 'minItems', type: 'number', label: 'Minimum items', min: 0, step: 1 },
  { name: 'maxItems', type: 'number', label: 'Maximum items', min: 0, step: 1 },
];

const optionListFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
  {
    name: 'options',
    type: 'array',
    label: 'Options',
    section: { title: 'Options', description: 'Dogfooded array of nested option objects.' },
    arrayConfig: {
      itemType: 'object',
      itemLabel: 'Option',
      sortable: true,
      minItems: 1,
      defaultValue: { label: '', value: '', disabled: false, description: '' },
      objectConfig: {
        layout: 'grid',
        columns: 2,
        fields: [
          { name: 'label', type: 'text', label: 'Label', required: true },
          { name: 'value', type: 'text', label: 'Value', required: true },
          { name: 'disabled', type: 'switch', label: 'Disabled' },
          { name: 'description', type: 'textarea', label: 'Description', textareaConfig: { rows: 2 } },
        ],
      },
    },
  },
];

function definition(
  type: FormedibleFieldType,
  label: string,
  specificFields: readonly FormedibleFieldConfig<FormedibleFormValues>[],
  defaultValues: (field: FormField, context: BuilderConfigContext) => FormedibleFormValues = () => ({}),
  toFieldUpdate: (values: FormedibleFormValues, field: FormField) => Partial<FormField> = () => ({}),
): FieldConfigFormDefinition {
  return {
    type,
    title: `${label} Configuration`,
    description: `Configure the Formedible ${label.toLowerCase()} field with a Formedible-powered form.`,
    fields: (context) => [...commonFields(context), ...specificFields],
    defaultValues: (field, context) => ({
      ...baseDefaultValues(field, context.availablePages[0] ?? 1),
      ...defaultValues(field, context),
    }),
    toFieldUpdate: (values, field) => ({
      ...baseFieldUpdate(values),
      ...toFieldUpdate(values, field),
    }),
  };
}

function optionsDefaults(field: FormField): FormedibleFormValues {
  return { options: optionsToBuilderOptions(field.options) };
}

function optionsUpdate(values: FormedibleFormValues): Partial<FormField> {
  return { options: builderOptionsToOptions(values.options) };
}

function textLikeDefinition(type: FormedibleFieldType, label: string): FieldConfigFormDefinition {
  return definition(type, label, stringValidationFields);
}

export const fieldConfigFormDefinitions: readonly FieldConfigFormDefinition[] = [
  textLikeDefinition('text', 'Text'),
  textLikeDefinition('email', 'Email'),
  textLikeDefinition('url', 'URL'),
  textLikeDefinition('tel', 'Telephone'),
  definition('password', 'Password', [
    ...stringValidationFields,
    { name: 'showToggle', type: 'switch', label: 'Show visibility toggle', section: { title: 'Password Settings' } },
    { name: 'strengthMeter', type: 'switch', label: 'Show strength meter' },
    { name: 'minStrength', type: 'number', label: 'Minimum strength', min: 0, max: 4, step: 1 },
  ], (field) => ({
    showToggle: field.passwordConfig?.showToggle ?? true,
    strengthMeter: field.passwordConfig?.strengthMeter ?? false,
    minStrength: field.passwordConfig?.minStrength,
  }), (values) => ({
    passwordConfig: {
      showToggle: booleanValue(values, 'showToggle'),
      strengthMeter: booleanValue(values, 'strengthMeter'),
      minStrength: optionalNumberValue(values, 'minStrength'),
    },
  })),
  definition('textarea', 'Textarea', [
    ...stringValidationFields,
    { name: 'rows', type: 'number', label: 'Rows', min: 1, step: 1, section: { title: 'Textarea Settings' } },
    { name: 'cols', type: 'number', label: 'Columns', min: 1, step: 1 },
    { name: 'textareaMaxLength', type: 'number', label: 'Character max length', min: 0, step: 1 },
    { name: 'resize', type: 'select', label: 'Resize behavior', options: resizeOptions.map((value) => option(value)) },
    { name: 'showWordCount', type: 'switch', label: 'Show word count' },
  ], (field) => ({
    rows: field.rows ?? field.textareaConfig?.rows,
    cols: field.textareaConfig?.cols,
    textareaMaxLength: field.maxLength ?? field.textareaConfig?.maxLength,
    resize: field.textareaConfig?.resize ?? '',
    showWordCount: field.textareaConfig?.showWordCount ?? false,
  }), (values) => ({
    rows: optionalNumberValue(values, 'rows'),
    maxLength: optionalNumberValue(values, 'textareaMaxLength'),
    textareaConfig: {
      rows: optionalNumberValue(values, 'rows'),
      cols: optionalNumberValue(values, 'cols'),
      maxLength: optionalNumberValue(values, 'textareaMaxLength'),
      resize: optionalStringValue(values, 'resize') as 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline' | undefined,
      showWordCount: booleanValue(values, 'showWordCount'),
    },
  })),
  definition('number', 'Number', [
    ...numericValidationFields,
    { name: 'min', type: 'number', label: 'Input minimum', section: { title: 'Number Settings' } },
    { name: 'max', type: 'number', label: 'Input maximum' },
    { name: 'step', type: 'number', label: 'Step' },
  ], (field) => ({ min: field.min ?? field.numberConfig?.min, max: field.max ?? field.numberConfig?.max, step: field.step ?? field.numberConfig?.step }), (values) => ({
    min: optionalNumberValue(values, 'min'),
    max: optionalNumberValue(values, 'max'),
    step: optionalNumberValue(values, 'step'),
    numberConfig: { min: optionalNumberValue(values, 'min'), max: optionalNumberValue(values, 'max'), step: optionalNumberValue(values, 'step') },
  })),
  definition('select', 'Select', optionListFields, optionsDefaults, optionsUpdate),
  definition('radio', 'Radio Group', optionListFields, optionsDefaults, optionsUpdate),
  definition('checkbox', 'Checkbox', emptyFields),
  definition('switch', 'Switch', emptyFields),
  definition('multiSelect', 'Multi-Select', [
    ...optionListFields,
    ...arrayValidationFields,
    { name: 'maxSelections', type: 'number', label: 'Maximum selections', min: 0, step: 1, section: { title: 'Multi-Select Settings' } },
    { name: 'searchable', type: 'switch', label: 'Searchable' },
    { name: 'creatable', type: 'switch', label: 'Creatable options' },
    { name: 'multiPlaceholder', type: 'text', label: 'Button placeholder' },
    { name: 'noOptionsText', type: 'text', label: 'No options text' },
  ], (field) => ({
    ...optionsDefaults(field),
    maxSelections: field.multiSelectConfig?.maxSelections,
    searchable: field.multiSelectConfig?.searchable ?? true,
    creatable: field.multiSelectConfig?.creatable ?? false,
    multiPlaceholder: field.multiSelectConfig?.placeholder ?? '',
    noOptionsText: field.multiSelectConfig?.noOptionsText ?? '',
  }), (values) => ({
    ...optionsUpdate(values),
    multiSelectConfig: {
      maxSelections: optionalNumberValue(values, 'maxSelections'),
      searchable: booleanValue(values, 'searchable'),
      creatable: booleanValue(values, 'creatable'),
      placeholder: optionalStringValue(values, 'multiPlaceholder'),
      noOptionsText: optionalStringValue(values, 'noOptionsText'),
    },
  })),
  definition('combobox', 'Combobox', [
    ...optionListFields,
    { name: 'searchable', type: 'switch', label: 'Searchable', section: { title: 'Combobox Settings' } },
    { name: 'comboboxPlaceholder', type: 'text', label: 'Combobox placeholder' },
    { name: 'searchPlaceholder', type: 'text', label: 'Search placeholder' },
    { name: 'noOptionsText', type: 'text', label: 'No options text' },
  ], (field) => ({
    ...optionsDefaults(field),
    searchable: field.comboboxConfig?.searchable ?? true,
    comboboxPlaceholder: field.comboboxConfig?.placeholder ?? '',
    searchPlaceholder: field.comboboxConfig?.searchPlaceholder ?? '',
    noOptionsText: field.comboboxConfig?.noOptionsText ?? '',
  }), (values) => ({
    ...optionsUpdate(values),
    comboboxConfig: {
      searchable: booleanValue(values, 'searchable'),
      placeholder: optionalStringValue(values, 'comboboxPlaceholder'),
      searchPlaceholder: optionalStringValue(values, 'searchPlaceholder'),
      noOptionsText: optionalStringValue(values, 'noOptionsText'),
    },
  })),
  definition('autocomplete', 'Autocomplete', [
    ...optionListFields,
    { name: 'debounceMs', type: 'number', label: 'Debounce milliseconds', min: 0, step: 50, section: { title: 'Autocomplete Settings' } },
    { name: 'minChars', type: 'number', label: 'Minimum characters', min: 0, step: 1 },
    { name: 'maxResults', type: 'number', label: 'Maximum results', min: 1, step: 1 },
    { name: 'allowCustom', type: 'switch', label: 'Allow custom values' },
    { name: 'autocompletePlaceholder', type: 'text', label: 'Autocomplete placeholder' },
    { name: 'noOptionsText', type: 'text', label: 'No options text' },
    { name: 'loadingText', type: 'text', label: 'Loading text' },
  ], (field) => ({
    ...optionsDefaults(field.autocompleteConfig?.options === undefined ? field : { ...field, options: field.autocompleteConfig.options }),
    debounceMs: field.autocompleteConfig?.debounceMs,
    minChars: field.autocompleteConfig?.minChars,
    maxResults: field.autocompleteConfig?.maxResults,
    allowCustom: field.autocompleteConfig?.allowCustom ?? false,
    autocompletePlaceholder: field.autocompleteConfig?.placeholder ?? '',
    noOptionsText: field.autocompleteConfig?.noOptionsText ?? '',
    loadingText: field.autocompleteConfig?.loadingText ?? '',
  }), (values) => ({
    autocompleteConfig: {
      options: builderOptionsToOptions(values.options),
      debounceMs: optionalNumberValue(values, 'debounceMs'),
      minChars: optionalNumberValue(values, 'minChars'),
      maxResults: optionalNumberValue(values, 'maxResults'),
      allowCustom: booleanValue(values, 'allowCustom'),
      placeholder: optionalStringValue(values, 'autocompletePlaceholder'),
      noOptionsText: optionalStringValue(values, 'noOptionsText'),
      loadingText: optionalStringValue(values, 'loadingText'),
    },
  })),
  definition('multiCombobox', 'Multi-Combobox', [
    ...optionListFields,
    ...arrayValidationFields,
    { name: 'maxSelections', type: 'number', label: 'Maximum selections', min: 0, step: 1, section: { title: 'Multi-Combobox Settings' } },
    { name: 'searchable', type: 'switch', label: 'Searchable' },
    { name: 'creatable', type: 'switch', label: 'Creatable options' },
    { name: 'multiPlaceholder', type: 'text', label: 'Button placeholder' },
    { name: 'searchPlaceholder', type: 'text', label: 'Search placeholder' },
    { name: 'noOptionsText', type: 'text', label: 'No options text' },
  ], (field) => ({
    ...optionsDefaults(field),
    maxSelections: field.multiComboboxConfig?.maxSelections,
    searchable: field.multiComboboxConfig?.searchable ?? true,
    creatable: field.multiComboboxConfig?.creatable ?? false,
    multiPlaceholder: field.multiComboboxConfig?.placeholder ?? '',
    searchPlaceholder: field.multiComboboxConfig?.searchPlaceholder ?? '',
    noOptionsText: field.multiComboboxConfig?.noOptionsText ?? '',
  }), (values) => ({
    ...optionsUpdate(values),
    multiComboboxConfig: {
      maxSelections: optionalNumberValue(values, 'maxSelections'),
      searchable: booleanValue(values, 'searchable'),
      creatable: booleanValue(values, 'creatable'),
      placeholder: optionalStringValue(values, 'multiPlaceholder'),
      searchPlaceholder: optionalStringValue(values, 'searchPlaceholder'),
      noOptionsText: optionalStringValue(values, 'noOptionsText'),
    },
  })),
  definition('date', 'Date', [
    { name: 'minDate', type: 'text', label: 'Minimum date', placeholder: '2026-01-01', section: { title: 'Date Settings' } },
    { name: 'maxDate', type: 'text', label: 'Maximum date', placeholder: '2026-12-31' },
    { name: 'dateFormat', type: 'text', label: 'Display format', placeholder: 'yyyy-MM-dd' },
  ], (field) => ({ minDate: stringConfigValue(field.dateConfig?.minDate), maxDate: stringConfigValue(field.dateConfig?.maxDate), dateFormat: field.dateConfig?.format ?? '' }), (values) => ({
    dateConfig: { minDate: optionalStringValue(values, 'minDate'), maxDate: optionalStringValue(values, 'maxDate'), format: optionalStringValue(values, 'dateFormat') },
  })),
  definition('slider', 'Slider', [
    ...numericValidationFields,
    { name: 'min', type: 'number', label: 'Slider minimum', section: { title: 'Slider Settings' } },
    { name: 'max', type: 'number', label: 'Slider maximum' },
    { name: 'step', type: 'number', label: 'Step' },
    { name: 'valueLabelPrefix', type: 'text', label: 'Value label prefix' },
    { name: 'valueLabelSuffix', type: 'text', label: 'Value label suffix' },
    { name: 'valueDisplayPrecision', type: 'number', label: 'Display precision', min: 0, step: 1 },
    { name: 'showRawValue', type: 'switch', label: 'Show raw value' },
    { name: 'showValue', type: 'switch', label: 'Show value in label' },
    sliderMarksField(),
    sliderMappingField(),
  ], (field) => ({
    min: field.sliderConfig?.min ?? field.min,
    max: field.sliderConfig?.max ?? field.max,
    step: field.sliderConfig?.step ?? field.step,
    valueLabelPrefix: field.sliderConfig?.valueLabelPrefix ?? '',
    valueLabelSuffix: field.sliderConfig?.valueLabelSuffix ?? '',
    valueDisplayPrecision: field.sliderConfig?.valueDisplayPrecision,
    showRawValue: field.sliderConfig?.showRawValue ?? false,
    showValue: field.sliderConfig?.showValue ?? true,
    marks: field.sliderConfig?.marks ?? [],
    valueMapping: field.sliderConfig?.valueMapping ?? [],
  }), (values) => ({
    min: optionalNumberValue(values, 'min'),
    max: optionalNumberValue(values, 'max'),
    step: optionalNumberValue(values, 'step'),
    sliderConfig: {
      min: optionalNumberValue(values, 'min'),
      max: optionalNumberValue(values, 'max'),
      step: optionalNumberValue(values, 'step'),
      valueLabelPrefix: optionalStringValue(values, 'valueLabelPrefix'),
      valueLabelSuffix: optionalStringValue(values, 'valueLabelSuffix'),
      valueDisplayPrecision: optionalNumberValue(values, 'valueDisplayPrecision'),
      showRawValue: booleanValue(values, 'showRawValue'),
      showValue: booleanValue(values, 'showValue'),
      marks: numberLabelArray(values.marks, 'value'),
      valueMapping: sliderValueMapping(values.valueMapping),
    },
  })),
  definition('rating', 'Rating', [
    ...numericValidationFields,
    { name: 'ratingMax', type: 'number', label: 'Maximum rating', min: 1, step: 1, section: { title: 'Rating Settings' } },
    { name: 'allowHalf', type: 'switch', label: 'Allow half ratings' },
    { name: 'icon', type: 'select', label: 'Icon', options: ratingIconOptions.map((value) => option(value)) },
    { name: 'size', type: 'select', label: 'Size', options: sizeOptions.map((value) => option(value)) },
    { name: 'showValue', type: 'switch', label: 'Show value' },
  ], (field) => ({
    ratingMax: field.ratingConfig?.max ?? field.max ?? 5,
    allowHalf: field.ratingConfig?.allowHalf ?? false,
    icon: field.ratingConfig?.icon ?? 'star',
    size: field.ratingConfig?.size ?? 'md',
    showValue: field.ratingConfig?.showValue ?? true,
  }), (values) => ({
    max: optionalNumberValue(values, 'ratingMax'),
    ratingConfig: {
      max: optionalNumberValue(values, 'ratingMax'),
      allowHalf: booleanValue(values, 'allowHalf'),
      icon: optionalStringValue(values, 'icon') as 'star' | 'heart' | 'thumbs' | undefined,
      size: optionalStringValue(values, 'size') as 'sm' | 'md' | 'lg' | undefined,
      showValue: booleanValue(values, 'showValue'),
    },
  })),
  definition('color', 'Color', colorFields(), colorDefaults, colorUpdate),
  definition('colorPicker', 'Color Picker', colorFields(), colorDefaults, colorUpdate),
  definition('phone', 'Phone', [
    { name: 'defaultCountry', type: 'select', label: 'Default country', options: countryOptions.map((value) => option(value)), section: { title: 'Phone Settings' } },
    { name: 'phoneFormat', type: 'select', label: 'Format', options: phoneFormatOptions.map((value) => option(value)) },
    { name: 'allowedCountries', type: 'multiSelect', label: 'Allowed countries', options: countryOptions.map((value) => option(value)), multiSelectConfig: { searchable: true } },
    { name: 'phonePlaceholder', type: 'text', label: 'Phone placeholder' },
  ], (field) => ({
    defaultCountry: field.phoneConfig?.defaultCountry ?? 'US',
    phoneFormat: field.phoneConfig?.format ?? 'national',
    allowedCountries: field.phoneConfig?.allowedCountries ?? [...countryOptions],
    phonePlaceholder: field.phoneConfig?.placeholder ?? '',
  }), (values) => ({
    phoneConfig: {
      defaultCountry: optionalStringValue(values, 'defaultCountry'),
      format: optionalStringValue(values, 'phoneFormat') as 'national' | 'international' | undefined,
      allowedCountries: stringArrayValue(values, 'allowedCountries'),
      placeholder: optionalStringValue(values, 'phonePlaceholder'),
    },
  })),
  definition('file', 'File Upload', [
    { name: 'accept', type: 'text', label: 'Accepted file types', placeholder: '.pdf,image/*', section: { title: 'File Settings' } },
    { name: 'multiple', type: 'switch', label: 'Allow multiple files' },
    { name: 'maxSize', type: 'number', label: 'Maximum file size in bytes', min: 0, step: 1 },
    { name: 'maxFiles', type: 'number', label: 'Maximum files', min: 1, step: 1 },
  ], (field) => ({ accept: field.fileConfig?.accept ?? '', multiple: field.fileConfig?.multiple ?? false, maxSize: field.fileConfig?.maxSize, maxFiles: field.fileConfig?.maxFiles }), (values) => ({
    fileConfig: { accept: optionalStringValue(values, 'accept'), multiple: booleanValue(values, 'multiple'), maxSize: optionalNumberValue(values, 'maxSize'), maxFiles: optionalNumberValue(values, 'maxFiles') },
  })),
  definition('array', 'Array', [
    ...arrayValidationFields,
    { name: 'itemType', type: 'select', label: 'Item type', options: arrayItemTypeOptions.map((value) => option(value)), section: { title: 'Array Settings' } },
    { name: 'arrayMinItems', type: 'number', label: 'Minimum items', min: 0, step: 1 },
    { name: 'arrayMaxItems', type: 'number', label: 'Maximum items', min: 0, step: 1 },
    { name: 'sortable', type: 'switch', label: 'Sortable' },
    { name: 'itemLabel', type: 'text', label: 'Item label' },
    { name: 'itemPlaceholder', type: 'text', label: 'Item placeholder' },
    { name: 'addButtonLabel', type: 'text', label: 'Add button label' },
    { name: 'removeButtonLabel', type: 'text', label: 'Remove button label' },
  ], (field) => ({
    itemType: field.arrayConfig?.itemType ?? 'string',
    arrayMinItems: field.arrayConfig?.minItems,
    arrayMaxItems: field.arrayConfig?.maxItems,
    sortable: field.arrayConfig?.sortable ?? false,
    itemLabel: stringConfigValue(field.arrayConfig?.itemLabel),
    itemPlaceholder: stringConfigValue(field.arrayConfig?.itemPlaceholder),
    addButtonLabel: stringConfigValue(field.arrayConfig?.addButtonLabel),
    removeButtonLabel: stringConfigValue(field.arrayConfig?.removeButtonLabel),
  }), (values) => ({
    arrayConfig: {
      itemType: optionalStringValue(values, 'itemType') as FormedibleFieldType | 'string' | 'email' | undefined,
      minItems: optionalNumberValue(values, 'arrayMinItems'),
      maxItems: optionalNumberValue(values, 'arrayMaxItems'),
      sortable: booleanValue(values, 'sortable'),
      itemLabel: optionalStringValue(values, 'itemLabel'),
      itemPlaceholder: optionalStringValue(values, 'itemPlaceholder'),
      addButtonLabel: optionalStringValue(values, 'addButtonLabel'),
      removeButtonLabel: optionalStringValue(values, 'removeButtonLabel'),
    },
  })),
  definition('object', 'Object', objectConfigFields(), (field) => ({
    objectLayout: field.objectConfig?.layout ?? 'stack',
    objectColumns: field.objectConfig?.columns ?? 1,
    nestedFields: field.objectConfig?.fields ?? field.nestedFields ?? [],
  }), (values, field) => ({
    objectConfig: {
      layout: optionalStringValue(values, 'objectLayout') as 'stack' | 'grid' | undefined,
      columns: optionalNumberValue(values, 'objectColumns'),
      fields: nestedFieldsValue(values.nestedFields, field.objectConfig?.fields ?? field.nestedFields),
    },
  })),
  definition('duration', 'Duration', [
    { name: 'durationFormat', type: 'select', label: 'Format', options: durationFormatOptions.map((value) => option(value)), section: { title: 'Duration Settings' } },
    { name: 'maxHours', type: 'number', label: 'Maximum hours', min: 0, step: 1 },
    { name: 'maxMinutes', type: 'number', label: 'Maximum minutes', min: 0, step: 1 },
    { name: 'maxSeconds', type: 'number', label: 'Maximum seconds', min: 0, step: 1 },
    { name: 'showLabels', type: 'switch', label: 'Show labels' },
  ], (field) => ({
    durationFormat: field.durationConfig?.format ?? 'hms',
    maxHours: field.durationConfig?.maxHours,
    maxMinutes: field.durationConfig?.maxMinutes,
    maxSeconds: field.durationConfig?.maxSeconds,
    showLabels: field.durationConfig?.showLabels ?? true,
  }), (values) => ({
    durationConfig: {
      format: optionalStringValue(values, 'durationFormat') as 'hms' | 'hm' | 'ms' | 'hours' | 'minutes' | 'seconds' | undefined,
      maxHours: optionalNumberValue(values, 'maxHours'),
      maxMinutes: optionalNumberValue(values, 'maxMinutes'),
      maxSeconds: optionalNumberValue(values, 'maxSeconds'),
      showLabels: booleanValue(values, 'showLabels'),
    },
  })),
  definition('location', 'Location', [
    { name: 'enableSearch', type: 'switch', label: 'Enable search', section: { title: 'Location Settings' } },
    { name: 'enableGeolocation', type: 'switch', label: 'Enable geolocation' },
    { name: 'enableManualEntry', type: 'switch', label: 'Enable manual coordinates' },
    { name: 'showMap', type: 'switch', label: 'Show map' },
    { name: 'searchPlaceholder', type: 'text', label: 'Search placeholder' },
    { name: 'searchDebounceMs', type: 'number', label: 'Search debounce milliseconds', min: 0, step: 50 },
    { name: 'minQueryLength', type: 'number', label: 'Minimum query length', min: 0, step: 1 },
    { name: 'locationMaxResults', type: 'number', label: 'Maximum results', min: 1, step: 1 },
  ], (field) => ({
    enableSearch: field.locationConfig?.enableSearch ?? true,
    enableGeolocation: field.locationConfig?.enableGeolocation ?? true,
    enableManualEntry: field.locationConfig?.enableManualEntry ?? true,
    showMap: field.locationConfig?.showMap ?? false,
    searchPlaceholder: field.locationConfig?.searchPlaceholder ?? '',
    searchDebounceMs: field.locationConfig?.searchOptions?.debounceMs,
    minQueryLength: field.locationConfig?.searchOptions?.minQueryLength,
    locationMaxResults: field.locationConfig?.searchOptions?.maxResults,
  }), (values) => ({
    locationConfig: {
      enableSearch: booleanValue(values, 'enableSearch'),
      enableGeolocation: booleanValue(values, 'enableGeolocation'),
      enableManualEntry: booleanValue(values, 'enableManualEntry'),
      showMap: booleanValue(values, 'showMap'),
      searchPlaceholder: optionalStringValue(values, 'searchPlaceholder'),
      searchOptions: {
        debounceMs: optionalNumberValue(values, 'searchDebounceMs'),
        minQueryLength: optionalNumberValue(values, 'minQueryLength'),
        maxResults: optionalNumberValue(values, 'locationMaxResults'),
      },
    },
  })),
  definition('masked', 'Masked Input', maskedFields(), maskedDefaults, maskedUpdate),
  definition('maskedInput', 'Masked Input', maskedFields(), maskedDefaults, maskedUpdate),
];

const definitionsByType = new Map(fieldConfigFormDefinitions.map((item) => [item.type, item]));

export function getFieldConfigFormDefinition(type: FormedibleFieldType): FieldConfigFormDefinition {
  const definition = definitionsByType.get(type) ?? definitionsByType.get('text');

  if (definition !== undefined) {
    return definition;
  }

  throw new Error('No field config form definitions are registered.');
}

function stringConfigValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

function colorFields(): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  return [
    { name: 'colorFormat', type: 'select', label: 'Color format', options: colorFormatOptions.map((value) => option(value)), section: { title: 'Color Settings' } },
    { name: 'showPreview', type: 'switch', label: 'Show preview' },
    { name: 'allowCustom', type: 'switch', label: 'Allow custom value' },
    {
      name: 'presetColors',
      type: 'array',
      label: 'Preset colors',
      arrayConfig: { itemType: 'string', itemLabel: 'Color', sortable: true, defaultValue: '#000000' },
    },
  ];
}

function colorDefaults(field: FormField): FormedibleFormValues {
  return { colorFormat: field.colorConfig?.format ?? 'hex', showPreview: field.colorConfig?.showPreview ?? true, allowCustom: field.colorConfig?.allowCustom ?? true, presetColors: field.colorConfig?.presetColors ?? [] };
}

function colorUpdate(values: FormedibleFormValues): Partial<FormField> {
  return {
    colorConfig: {
      format: optionalStringValue(values, 'colorFormat') as 'hex' | 'rgb' | 'hsl' | undefined,
      showPreview: booleanValue(values, 'showPreview'),
      allowCustom: booleanValue(values, 'allowCustom'),
      presetColors: stringArrayValue(values, 'presetColors'),
    },
  };
}

function objectConfigFields(): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  return [
    { name: 'objectLayout', type: 'select', label: 'Layout', options: objectLayoutOptions.map((value) => option(value)), section: { title: 'Object Settings' } },
    { name: 'objectColumns', type: 'number', label: 'Columns', min: 1, max: 6, step: 1 },
    {
      name: 'nestedFields',
      type: 'array',
      label: 'Nested fields',
      description: 'Initial dogfooding editor for nested object field definitions.',
      arrayConfig: {
        itemType: 'object',
        itemLabel: 'Nested Field',
        sortable: true,
        defaultValue: { name: 'nested_field', type: 'text', label: 'Nested Field' },
        objectConfig: {
          layout: 'grid',
          columns: 2,
          fields: [
            { name: 'label', type: 'text', label: 'Label', required: true },
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'type', type: 'select', label: 'Type', options: ['text', 'email', 'number', 'checkbox', 'select', 'textarea'] },
            { name: 'placeholder', type: 'text', label: 'Placeholder' },
          ],
        },
      },
    },
  ];
}

function maskedFields(): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  return [
    { name: 'mask', type: 'text', label: 'Mask pattern', placeholder: '(999) 999-9999', section: { title: 'Mask Settings' } },
    { name: 'showMask', type: 'switch', label: 'Show mask guide' },
    { name: 'guide', type: 'switch', label: 'Guide missing characters' },
    { name: 'keepCharPositions', type: 'switch', label: 'Keep character positions' },
  ];
}

function maskedDefaults(field: FormField): FormedibleFormValues {
  return { mask: stringConfigValue(field.mask ?? field.maskedInputConfig?.mask), showMask: field.maskedInputConfig?.showMask ?? false, guide: field.maskedInputConfig?.guide ?? false, keepCharPositions: field.maskedInputConfig?.keepCharPositions ?? false };
}

function maskedUpdate(values: FormedibleFormValues): Partial<FormField> {
  const mask = optionalStringValue(values, 'mask');
  return { mask, maskedInputConfig: { mask: mask ?? '', placeholder: optionalStringValue(values, 'placeholder'), showMask: booleanValue(values, 'showMask'), guide: booleanValue(values, 'guide'), keepCharPositions: booleanValue(values, 'keepCharPositions') } };
}

function sliderMarksField(): FormedibleFieldConfig<FormedibleFormValues> {
  return {
    name: 'marks',
    type: 'array',
    label: 'Marks',
    arrayConfig: {
      itemType: 'object',
      itemLabel: 'Mark',
      sortable: true,
      defaultValue: { value: 0, label: '' },
      objectConfig: { fields: [{ name: 'value', type: 'number', label: 'Value' }, { name: 'label', type: 'text', label: 'Label' }] },
    },
  };
}

function sliderMappingField(): FormedibleFieldConfig<FormedibleFormValues> {
  return {
    name: 'valueMapping',
    type: 'array',
    label: 'Value mapping',
    arrayConfig: {
      itemType: 'object',
      itemLabel: 'Mapping',
      sortable: true,
      defaultValue: { sliderValue: 0, displayValue: '', label: '' },
      objectConfig: { fields: [{ name: 'sliderValue', type: 'number', label: 'Slider value' }, { name: 'displayValue', type: 'text', label: 'Display value' }, { name: 'label', type: 'text', label: 'Label' }] },
    },
  };
}

function numberLabelArray(value: unknown, valueKey: string): readonly { readonly value: number; readonly label: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({ value: typeof item[valueKey] === 'number' ? item[valueKey] : Number(item[valueKey]), label: typeof item.label === 'string' ? item.label : '' }))
    .filter((item) => Number.isFinite(item.value));
}

function sliderValueMapping(value: unknown): readonly { readonly sliderValue: number; readonly displayValue: string; readonly label?: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      sliderValue: typeof item.sliderValue === 'number' ? item.sliderValue : Number(item.sliderValue),
      displayValue: stringConfigValue(item.displayValue),
      label: typeof item.label === 'string' && item.label.length > 0 ? item.label : undefined,
    }))
    .filter((item) => Number.isFinite(item.sliderValue) && item.displayValue.length > 0);
}

function currentNestedField(
  item: Record<string, unknown>,
  index: number,
  currentFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] | undefined,
): FormedibleFieldConfig<FormedibleFormValues> | undefined {
  const byIndex = currentFields?.[index];

  if (byIndex !== undefined && typeof item.name === 'string' && byIndex.name === item.name) {
    return byIndex;
  }

  if (typeof item.name === 'string') {
    return currentFields?.find((field) => field.name === item.name) ?? byIndex;
  }

  return byIndex;
}

function nestedFieldsValue(
  value: unknown,
  currentFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] | undefined,
): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // The nested editor only exposes name/type/label/placeholder per item, so every update
  // carries just those keys. Spread-merge each edited item against the currently stored
  // nested field to preserve options, required, disabled, description and nested
  // arrayConfig/objectConfig that unrelated keystrokes would otherwise strip.
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => {
      const { placeholder: _editedPlaceholder, ...preserved } = currentNestedField(item, index, currentFields) ?? {};
      const merged: FormedibleFieldConfig<FormedibleFormValues> = {
        ...preserved,
        name: typeof item.name === 'string' && item.name.length > 0 ? item.name : 'nested_field',
        type: typeof item.type === 'string' ? item.type as FormedibleFieldType : 'text',
        label: typeof item.label === 'string' && item.label.length > 0 ? item.label : 'Nested Field',
      };
      const placeholder = typeof item.placeholder === 'string' && item.placeholder.length > 0 ? item.placeholder : undefined;

      return placeholder === undefined ? merged : { ...merged, placeholder };
    });
}
