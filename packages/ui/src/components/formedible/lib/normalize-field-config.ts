import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues, NormalizedFieldConfig, NormalizedFieldType } from '@formedible/ui/components/formedible/lib/types';

const fieldTypeAliases: Partial<Record<FormedibleFieldType, NormalizedFieldType>> = {
  multiselect: 'multiSelect',
  multicombobox: 'multiCombobox',
  colorPicker: 'color',
  maskedInput: 'masked',
};

export function normalizeFieldType(type: FormedibleFieldType | undefined): NormalizedFieldType {
  if (!type) {
    return 'text';
  }

  const alias = fieldTypeAliases[type];
  if (alias) {
    return alias;
  }

  if (type === 'multiselect' || type === 'multicombobox' || type === 'colorPicker' || type === 'maskedInput') {
    return 'text';
  }

  return type;
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
