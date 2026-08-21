import { normalizeFieldConfig } from '@/lib/formedible/normalize-field-config';
import type { FormedibleFormValues, NormalizedUseFormedibleOptions, UseFormedibleOptions } from '@/lib/formedible/types';

export function normalizeOptions<TFormValues extends FormedibleFormValues>(
  options: UseFormedibleOptions<TFormValues>,
): NormalizedUseFormedibleOptions<TFormValues> {
  return {
    ...options,
    fields: (options.fields ?? []).map((field) => normalizeFieldConfig(field)),
  };
}
