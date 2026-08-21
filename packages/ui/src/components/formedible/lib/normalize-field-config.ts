import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues, NormalizedFieldConfig, NormalizedFieldType } from '@formedible/ui/components/formedible/lib/types';

/**
 * Normalizes legacy type aliases to their canonical field type. Custom type
 * strings (used with `defaultComponents` registrations) pass through verbatim.
 */
export function normalizeFieldType(type: FormedibleFieldType | (string & {}) | undefined): NormalizedFieldType | (string & {}) {
  if (!type) {
    return 'text';
  }

  switch (type) {
    case 'multiselect':
      return 'multiSelect';
    case 'multicombobox':
      return 'multiCombobox';
    case 'colorPicker':
      return 'color';
    case 'maskedInput':
      return 'masked';
    default:
      return type;
  }
}

export function normalizeFieldConfig<TFormValues extends FormedibleFormValues>(
  field: FormedibleFieldConfig<TFormValues>,
): NormalizedFieldConfig<TFormValues> {
  return {
    ...field,
    type: normalizeFieldType(field.type),
    disabled: field.disabled ?? false,
    required: field.required ?? false,
  };
}
