export { useFormedible } from '@/hooks/use-formedible';
export { getFieldComponent } from '@/components/formedible/fields/field-registry';
export { normalizeFieldConfig, normalizeFieldType } from '@/lib/formedible/normalize-field-config';
export { resolveDynamicText } from '@/lib/formedible/dynamic-text';
export { defaultFormedibleFormMessages, resolveFormedibleFormMessages, resolveFormedibleValidationMessages } from '@/lib/formedible/messages';
export type {
  FormedibleFieldConfig,
  FormedibleFieldType,
  FormedibleFormMessages,
  FormedibleFormValues,
  FormedibleValidationMessages,
  NormalizedFieldConfig,
  NormalizedFieldType,
  UseFormedibleOptions,
} from '@/lib/formedible/types';
