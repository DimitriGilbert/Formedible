import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues, NormalizedFieldConfig, NormalizedFieldType } from '@formedible/ui/components/formedible/lib/types';

export function normalizeFieldType(type: FormedibleFieldType | undefined): NormalizedFieldType {
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
