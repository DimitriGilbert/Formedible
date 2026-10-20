export { useFormedible } from '@/hooks/use-formedible';
export { getFieldComponent } from '@/components/formedible/fields/field-registry';
export { normalizeFieldConfig, normalizeFieldType } from '@/lib/formedible/normalize-field-config';
export { resolveDynamicText } from '@/lib/formedible/dynamic-text';
export {
  FIELD_EXTENSION_CONTRACT_VERSION,
  deserializeFieldExtensionValue,
  getFieldExtension,
  isFieldExtensionContractCompatible,
  listFieldExtensions,
  registerFieldExtension,
  serializeFieldExtensionValue,
  subscribeToFieldExtensionRegistrations,
  treatFieldExtensionValueForAi,
  unregisterFieldExtension,
  verifyFieldExtensionAccessibility,
} from '@/lib/formedible/field-extensions';
export type {
  FieldExtension,
  FieldExtensionAccessibilityFinding,
  FieldExtensionAccessibilityMachineCheck,
  FieldExtensionAccessibilityObligations,
  FieldExtensionAiSafeRedactionRules,
  FieldExtensionAiTreatment,
  FieldExtensionAiTreatmentResult,
  FieldExtensionAriaPattern,
  FieldExtensionBuilderMetadata,
  FieldExtensionComponent,
  FieldExtensionConfigurableOption,
  FieldExtensionConfigurableProp,
  FieldExtensionFocusTarget,
  FieldExtensionLabelAssociation,
  FieldExtensionSemver,
  FieldExtensionValueSerialization,
  FieldExtensionWireValue,
  FieldExtensionZodValidation,
} from '@/lib/formedible/field-extensions';
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
