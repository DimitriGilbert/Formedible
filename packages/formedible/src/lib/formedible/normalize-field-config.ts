import type { FormedibleFieldConfig, NormalizedFieldConfig } from '@/lib/formedible/types';

export function normalizeFieldConfig<TFormValues extends Record<string, string>>(
  field: FormedibleFieldConfig<TFormValues>,
): NormalizedFieldConfig<TFormValues> {
  return {
    name: field.name,
    type: field.type ?? 'text',
    label: field.label,
    description: field.description,
    placeholder: field.placeholder,
    disabled: field.disabled ?? false,
    required: field.required ?? false,
    className: field.className,
    inputClassName: field.inputClassName,
  };
}
