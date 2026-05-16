import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import type { FormField, FormMetadata } from '@formedible/ui/components/formedible/lib/builder-types';

export interface BuilderConfigContext {
  readonly availablePages: readonly number[];
  readonly metadata?: FormMetadata;
}

export interface BuilderFieldValidationConfig {
  readonly requiredMessage?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly min?: number;
  readonly max?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
}

export interface FieldConfigFormDefinition {
  readonly type: FormedibleFieldType;
  readonly title: string;
  readonly description: string;
  readonly fields: (context: BuilderConfigContext) => readonly FormedibleFieldConfig<FormedibleFormValues>[];
  readonly defaultValues: (field: FormField, context: BuilderConfigContext) => FormedibleFormValues;
  readonly toFieldUpdate: (values: FormedibleFormValues, field: FormField) => Partial<FormField>;
}
