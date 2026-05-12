import type { FormedibleFormValues, NormalizedUseFormedibleOptions, UseFormedibleOptions } from './types.js';

import { normalizeFieldConfig } from './normalize-field-config.js';

export function normalizeOptions<TFormValues extends FormedibleFormValues>(
  options: UseFormedibleOptions<TFormValues>,
): NormalizedUseFormedibleOptions<TFormValues> {
  return {
    ...options,
    fields: options.fields.map((field) => normalizeFieldConfig(field)),
  };
}
