import { z } from 'zod';
import type { ComponentType, ReactNode } from 'react';

import type {
  AnyFieldApi,
  FormedibleAutocompleteConfig,
  FormedibleColorConfig,
  FormedibleFieldComponent,
  FormedibleFieldComponentProps,
  FormedibleFieldConfig,
  FormedibleFieldWrapper,
  FormedibleMaskedInputConfig,
  FormedibleNumberConfig,
  FormediblePasswordConfig,
  NormalizedFieldConfig,
  UseFormedibleOptions,
} from '../../../packages/formedible/src/lib/formedible/types';

interface CompatibilityFormValues extends Record<string, unknown> {
  name: string;
  email: string;
  urgent: boolean;
  skills: string[];
  workLocation?: {
    lat: number;
    lng: number;
  };
}

const compatibilityFields = [
  { name: 'name', type: 'text', label: 'Name' },
  { name: 'email', type: 'email', required: true },
  { name: 'password', type: 'password', passwordConfig: { showToggle: true, strengthMeter: true, minStrength: 3 } },
  { name: 'website', type: 'url' },
  { name: 'phone', type: 'tel' },
  { name: 'message', type: 'textarea', rows: 6, textareaConfig: { rows: 4, maxLength: 500, showWordCount: true } },
  { name: 'salaryExpectation', type: 'number', min: 0, step: 1000 },
  { name: 'plan', type: 'select', options: ['basic', 'pro'] },
  { name: 'contactMethod', type: 'radio', options: [{ value: 'email', label: 'Email' }] },
  { name: 'urgent', type: 'checkbox' },
  { name: 'newsletter', type: 'switch' },
  { name: 'birthDate', type: 'date', minDate: '1900-01-01', maxDate: 'today' },
  { name: 'experienceLevel', type: 'slider', min: 1, max: 10, valueLabelSuffix: '%' },
  { name: 'overallRating', type: 'rating', allowHalf: true, showValue: true },
  { name: 'phoneNumber', type: 'phone', defaultCountry: 'US' },
  { name: 'resume', type: 'file', accept: '.pdf', maxFiles: 1 },
  { name: 'teamMembers', type: 'array', arrayConfig: { itemType: 'object', minItems: 1, objectConfig: { fields: [{ name: 'name', type: 'text' }] } } },
  { name: 'metadata', type: 'object' },
  { name: 'skills', type: 'multiSelect', searchable: true, creatable: true, maxSelections: 3 },
  { name: 'legacySkills', type: 'multiselect' },
  { name: 'subject', type: 'combobox', searchPlaceholder: 'Search subjects' },
  { name: 'country', type: 'autocomplete' },
  { name: 'categories', type: 'multiCombobox' },
  { name: 'legacyCategories', type: 'multicombobox' },
  { name: 'favoriteColor', type: 'color' },
  { name: 'legacyFavoriteColor', type: 'colorPicker', colorConfig: { allowCustom: false, format: 'rgb', presetColors: ['#123456'] } },
  { name: 'workDuration', type: 'duration' },
  { name: 'workLocation', type: 'location', enableSearch: true },
  { name: 'ssn', type: 'masked', mask: '999-99-9999' },
  { name: 'formattedCode', type: 'masked', mask: (value: string) => value.toUpperCase() },
  { name: 'legacySsn', type: 'maskedInput', mask: '999-99-9999' },
] satisfies readonly FormedibleFieldConfig<CompatibilityFormValues>[];

const customFieldKeepsArbitraryProps = {
  name: 'customField',
  type: 'text',
  customRendererProps: { density: 'compact' },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const normalizedAlias = {
  ...customFieldKeepsArbitraryProps,
  type: 'multiSelect',
  disabled: false,
  required: false,
} satisfies NormalizedFieldConfig<CompatibilityFormValues>;

const textareaConfigSupportsLegacySizing = {
  name: 'legacyTextareaConfig',
  type: 'textarea',
  textareaConfig: {
    rows: 4,
    cols: 80,
    resize: 'vertical',
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const passwordConfigSupportsLegacyOptions = {
  name: 'legacyPasswordConfig',
  type: 'password',
  passwordConfig: {
    showToggle: true,
    strengthMeter: true,
    minStrength: 3,
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const explicitPasswordConfig: FormediblePasswordConfig = {
  showToggle: false,
  strengthMeter: true,
  minStrength: 2,
};

const unsupportedPasswordConfigKeysAreRejected = {
  name: 'unsupportedPasswordConfig',
  type: 'password',
  passwordConfig: {
    showToggle: true,
    // @ts-expect-error revealLabel is intentionally unsupported; passwordConfig only supports showToggle, strengthMeter, and minStrength.
    revealLabel: 'Show password',
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const numberConfigSupportsLegacyConstraints = {
  name: 'legacyNumberConfig',
  type: 'number',
  numberConfig: {
    min: 0,
    max: 10,
    step: 2,
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const explicitNumberConfig: FormedibleNumberConfig = {
  min: 0,
  max: 10,
  step: 1,
};

const explicitLegacyColorPickerConfig: FormedibleColorConfig = {
  allowCustom: false,
  format: 'hsl',
  presetColors: ['#123456', '#abcdef'],
  showPreview: true,
};

export const legacyColorPickerAcceptsColorConfig = {
  name: 'legacyColorPickerConfig',
  type: 'colorPicker',
  colorConfig: explicitLegacyColorPickerConfig,
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const datalistSupportsLegacySuggestions = {
  name: 'city',
  type: 'text',
  datalist: ['Paris', { value: 'Berlin', label: 'Berlin, Germany' }],
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const helpSupportsLegacyTooltip = {
  name: 'firstName',
  type: 'text',
  help: { tooltip: 'Personalization helper text' },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const directSchemaValidationSupportsLegacyZodFields = {
  name: 'email',
  type: 'email',
  validation: z.string().email(),
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const compatibilityFieldComponent: FormedibleFieldComponent<CompatibilityFormValues> = ({ fieldConfig, field, renderField }) => {
  field.onChange(field.value);
  renderField?.({ ...fieldConfig, name: 'email' });

  return null;
};

// Legacy flat-props component (main contract): required TanStack fieldApi plus the flat resolved props.
const legacyFlatPropsComponent: ComponentType<{
  fieldApi: AnyFieldApi;
  label?: string;
  description?: string;
  placeholder?: string;
  inputClassName?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  sliderConfig?: { min?: number; max?: number; step?: number };
  phoneConfig?: { defaultCountry?: string; format?: 'national' | 'international' };
}> = ({ fieldApi, label, options }) => (fieldApi && label && options ? null : null);

const legacyFlatPropsComponentIsARenderedComponent: FormedibleFieldComponent<CompatibilityFormValues> = legacyFlatPropsComponent;

// Dual-shape component: receives the legacy flat props AND the render-props shape in one props object.
const dualShapePropsComponent: ComponentType<FormedibleFieldComponentProps<CompatibilityFormValues>> = (props) => {
  const flatLabel: string | undefined = props.label;
  const hasFieldApi: boolean = props.fieldApi !== undefined;
  const nested: ReactNode = props.renderField?.({ ...props.fieldConfig, name: 'email' }) ?? null;
  props.field.onChange(props.field.value);

  return flatLabel !== undefined && hasFieldApi && props.phoneConfig === undefined && nested === null ? null : null;
};

const compatibilityFieldWrapper: FormedibleFieldWrapper<CompatibilityFormValues> = ({ fieldConfig, field, children }) => {
  field.onBlur();

  return fieldConfig.name === field.name ? children : null;
};

const customizationExtensionPoints = {
  fields: [
    {
      name: 'name',
      type: 'text',
      component: compatibilityFieldComponent,
      wrapper: compatibilityFieldWrapper,
    },
    {
      name: 'legacyWidget',
      type: 'myWidget',
      component: legacyFlatPropsComponent,
    },
  ],
  defaultComponents: {
    email: compatibilityFieldComponent,
    myWidget: legacyFlatPropsComponent,
    multiselect: dualShapePropsComponent,
  },
  globalWrapper: compatibilityFieldWrapper,
  formOptions: {
    defaultValues: {
      name: '',
      email: '',
      urgent: false,
      skills: [],
    },
  },
} satisfies UseFormedibleOptions<CompatibilityFormValues>;

const customFieldTypeKeysCompileWithoutRegistration = {
  fields: [
    { name: 'widget', type: 'myWidget' },
    { name: 'otherWidget', type: 'otherWidget', component: dualShapePropsComponent },
  ],
  defaultComponents: {
    myWidget: legacyFlatPropsComponent,
  },
  formOptions: {
    defaultValues: {
      name: '',
      email: '',
      urgent: false,
      skills: [],
    },
  },
} satisfies UseFormedibleOptions<CompatibilityFormValues>;

const customizationExtensionPointsRejectNonComponentDefaultComponent = {
  fields: [{ name: 'name', type: 'text' }],
  defaultComponents: {
    // @ts-expect-error defaultComponents entries must be field components.
    text: 'not-a-component',
  },
  formOptions: {
    defaultValues: {
      name: '',
      email: '',
      urgent: false,
      skills: [],
    },
  },
} satisfies UseFormedibleOptions<CompatibilityFormValues>;

const customizationExtensionPointsRejectInvalidWrapperContract = {
  name: 'email',
  type: 'email',
  // @ts-expect-error field wrapper props require the rendered field children contract.
  wrapper: ({ fieldConfig, field }: { readonly fieldConfig: NormalizedFieldConfig<CompatibilityFormValues>; readonly field: string }) => null,
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const autocompleteConfigSupportsLegacyOptions = {
  name: 'country',
  type: 'autocomplete',
  autocompleteConfig: {
    options: ['France', { value: 'de', label: 'Germany' }],
    debounceMs: 150,
    minChars: 2,
    maxResults: 5,
    allowCustom: true,
    placeholder: 'Type a country',
    noOptionsText: 'No countries found',
    loadingText: 'Loading countries...',
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const explicitAutocompleteConfig: FormedibleAutocompleteConfig = {
  options: ['France'],
  asyncOptions: async (query) => [query],
  debounceMs: 300,
  minChars: 1,
  maxResults: 10,
  allowCustom: false,
  placeholder: 'Search',
  noOptionsText: 'No results',
  loadingText: 'Loading...',
};

const maskedInputConfigSupportsLegacyMaskOptions = {
  name: 'legacyMaskedSsn',
  type: 'maskedInput',
  maskedInputConfig: {
    mask: '000-00-0000',
    placeholder: '___-__-____',
    showMask: true,
    guide: true,
    keepCharPositions: true,
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const explicitMaskedInputConfig: FormedibleMaskedInputConfig = {
  mask: (value) => value.toUpperCase(),
  placeholder: 'ABC-123',
  showMask: false,
  guide: true,
  keepCharPositions: false,
  pipe: (conformedValue) => ({ value: conformedValue, indexesOfPipedChars: [] }),
};

const numberConfigPrecisionIsIntentionallyUnsupported = {
  name: 'legacyNumberPrecision',
  type: 'number',
  numberConfig: {
    min: 0,
    // @ts-expect-error precision is intentionally unsupported because native number inputs and audited compatibility examples only restore min/max/step behavior.
    precision: 2,
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

const emailConfigIsAcceptedForCompatibility = {
  name: 'legacyEmailConfig',
  type: 'email',
  emailConfig: {
    allowedDomains: 'formedible.dev',
    blockedDomains: ['example.com'],
    suggestions: ['formedible.dev'],
    validateMX: true,
  },
} satisfies FormedibleFieldConfig<CompatibilityFormValues>;

export {
  compatibilityFields,
  autocompleteConfigSupportsLegacyOptions,
  customFieldKeepsArbitraryProps,
  customFieldTypeKeysCompileWithoutRegistration,
  datalistSupportsLegacySuggestions,
  directSchemaValidationSupportsLegacyZodFields,
  dualShapePropsComponent,
  emailConfigIsAcceptedForCompatibility,
  compatibilityFieldComponent,
  compatibilityFieldWrapper,
  customizationExtensionPoints,
  customizationExtensionPointsRejectInvalidWrapperContract,
  customizationExtensionPointsRejectNonComponentDefaultComponent,
  explicitAutocompleteConfig,
  explicitMaskedInputConfig,
  explicitNumberConfig,
  explicitPasswordConfig,
  helpSupportsLegacyTooltip,
  legacyFlatPropsComponent,
  legacyFlatPropsComponentIsARenderedComponent,
  maskedInputConfigSupportsLegacyMaskOptions,
  normalizedAlias,
  numberConfigPrecisionIsIntentionallyUnsupported,
  numberConfigSupportsLegacyConstraints,
  passwordConfigSupportsLegacyOptions,
  textareaConfigSupportsLegacySizing,
  unsupportedPasswordConfigKeysAreRejected,
};
