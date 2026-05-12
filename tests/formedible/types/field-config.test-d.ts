import type { FormedibleFieldConfig, NormalizedFieldConfig } from '../../../packages/formedible/src/lib/formedible/types';

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
  { name: 'password', type: 'password', showToggle: true, strengthMeter: true },
  { name: 'website', type: 'url' },
  { name: 'phone', type: 'tel' },
  { name: 'message', type: 'textarea', rows: 6, showWordCount: true },
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
  { name: 'legacyFavoriteColor', type: 'colorPicker' },
  { name: 'workDuration', type: 'duration' },
  { name: 'workLocation', type: 'location', enableSearch: true },
  { name: 'ssn', type: 'masked', mask: '999-99-9999' },
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

export { compatibilityFields, customFieldKeepsArbitraryProps, normalizedAlias };
