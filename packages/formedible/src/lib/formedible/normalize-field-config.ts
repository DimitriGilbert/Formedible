import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues, NormalizedFieldConfig, NormalizedFieldType } from '@/lib/formedible/types';

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

/**
 * Memoized twin of {@link normalizeFieldConfig} for NESTED field configs
 * (`objectConfig.fields` / array `objectConfig.fields`): container fields
 * re-render on every keystroke and used to re-normalize the same immutable
 * nested config objects each time (per array item, for object arrays). The
 * normalized result is cached per config identity; callers only spread the
 * result into fresh per-render objects, so the shared identity is never
 * mutated or leaked into effect dependencies.
 */
const normalizedNestedFieldCache = new WeakMap<object, object>();

export function normalizeNestedFieldConfig<TFormValues extends FormedibleFormValues>(
  field: FormedibleFieldConfig<TFormValues>,
): NormalizedFieldConfig<TFormValues> {
  const cached = normalizedNestedFieldCache.get(field);

  if (cached !== undefined) {
    return cached as NormalizedFieldConfig<TFormValues>;
  }

  const normalized = normalizeFieldConfig<TFormValues>(field);

  normalizedNestedFieldCache.set(field, normalized);

  return normalized;
}
