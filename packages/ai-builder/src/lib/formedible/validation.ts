import type { DeepKeys, DeepValue, FieldAsyncValidateOrFn, FieldValidateFn, FieldValidators, FormValidateFn, FormValidators, StandardSchemaV1 } from '@tanstack/react-form';

import { firstIssueMessage, formatValidationError } from '@/lib/formedible/zod-errors';
import type {
  FormedibleAsyncValidation,
  FormedibleCrossFieldValidation,
  FormedibleFieldValidation,
  FormedibleFormValues,
  FormedibleValidationResult,
  NormalizedFieldConfig,
} from '@/lib/formedible/types';

export interface FormedibleFormValidationApi<TFormValues extends FormedibleFormValues> {
  readonly state: {
    readonly values: TFormValues;
  };
  readonly parseValuesWithSchema: (schema: StandardSchemaV1<TFormValues, unknown>) => {
    readonly fields: Readonly<Record<string, readonly { readonly message: string }[]>>;
  } | undefined;
  readonly parseValuesWithSchemaAsync: (schema: StandardSchemaV1<TFormValues, unknown>) => Promise<{
    readonly fields: Readonly<Record<string, readonly { readonly message: string }[]>>;
  } | undefined>;
}

export interface FormedibleFieldValidationApi<TFormValues extends FormedibleFormValues> {
  readonly form: FormedibleFormValidationApi<TFormValues>;
}

export interface FormedibleValidatorContext<TFormValues extends FormedibleFormValues> {
  readonly value: unknown;
  readonly fieldApi: FormedibleFieldValidationApi<TFormValues>;
}

export interface FormedibleAsyncValidatorContext<TFormValues extends FormedibleFormValues> extends FormedibleValidatorContext<TFormValues> {
  readonly signal: AbortSignal;
}

export interface FormedibleFieldValidators<TFormValues extends FormedibleFormValues> {
  readonly onChange?: (context: FormedibleValidatorContext<TFormValues>) => string | undefined;
  readonly onBlur?: (context: FormedibleValidatorContext<TFormValues>) => string | undefined;
  readonly onSubmit?: (context: FormedibleValidatorContext<TFormValues>) => string | undefined;
  readonly onChangeAsync?: (context: FormedibleAsyncValidatorContext<TFormValues>) => Promise<string | undefined>;
  readonly onChangeAsyncDebounceMs?: number;
  readonly onChangeListenTo?: readonly string[];
}

type BuiltFieldValidators<TFormValues extends FormedibleFormValues, TName extends DeepKeys<TFormValues>> = FieldValidators<
  TFormValues,
  TName,
  DeepValue<TFormValues, TName>,
  FieldValidateFn<TFormValues, TName, DeepValue<TFormValues, TName>>,
  FieldValidateFn<TFormValues, TName, DeepValue<TFormValues, TName>>,
  FieldAsyncValidateOrFn<TFormValues, TName, DeepValue<TFormValues, TName>> | undefined,
  FieldValidateFn<TFormValues, TName, DeepValue<TFormValues, TName>>,
  undefined,
  FieldValidateFn<TFormValues, TName, DeepValue<TFormValues, TName>>,
  undefined,
  undefined,
  undefined
>;

type BuiltFormValidators<TFormValues extends FormedibleFormValues> = FormValidators<
  TFormValues,
  FormValidateFn<TFormValues>,
  FormValidateFn<TFormValues>,
  undefined,
  FormValidateFn<TFormValues>,
  undefined,
  FormValidateFn<TFormValues>,
  undefined,
  undefined,
  undefined
>;

export interface FormedibleFormValidatorContext<TFormValues extends FormedibleFormValues> {
  readonly value: TFormValues;
  readonly formApi: FormedibleFormValidationApi<TFormValues>;
}

export interface FormedibleFormValidators<TFormValues extends FormedibleFormValues> {
  readonly onChange?: (context: FormedibleFormValidatorContext<TFormValues>) => { readonly fields: Partial<Record<string, string>> } | undefined;
  readonly onBlur?: (context: FormedibleFormValidatorContext<TFormValues>) => { readonly fields: Partial<Record<string, string>> } | undefined;
  readonly onSubmit?: (context: FormedibleFormValidatorContext<TFormValues>) => { readonly fields: Partial<Record<string, string>> } | undefined;
}

function toStandardSchema<TFormValues extends FormedibleFormValues>(schema: unknown): StandardSchemaV1<TFormValues, unknown> | undefined {
  if (typeof schema !== 'object' || schema === null || !('~standard' in schema)) {
    return undefined;
  }

  const standard = schema['~standard'];

  if (typeof standard !== 'object' || standard === null || !('version' in standard) || standard.version !== 1 || !('validate' in standard)) {
    return undefined;
  }

  return schema as StandardSchemaV1<TFormValues, unknown>;
}

function resultToMessage(result: FormedibleValidationResult, fallback?: string): string | undefined {
  if (typeof result === 'string') {
    return result;
  }

  if (result === false) {
    return fallback ?? 'Invalid value';
  }

  return undefined;
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function validateRequired<TFormValues extends FormedibleFormValues>(field: NormalizedFieldConfig<TFormValues>, value: unknown): string | undefined {
  if (!field.required || !isEmptyValue(value)) {
    return undefined;
  }

  return `${String(field.label ?? field.name)} is required`;
}

function validateBuiltInConstraints<TFormValues extends FormedibleFormValues>(field: NormalizedFieldConfig<TFormValues>, value: unknown): string | undefined {
  const requiredError = validateRequired(field, value);

  if (requiredError || isEmptyValue(value)) {
    return requiredError;
  }

  if (field.type === 'email' && typeof value === 'string' && !/^\S+@\S+\.\S+$/.test(value)) {
    return 'Please enter a valid email address';
  }

  if (field.type === 'url' && typeof value === 'string') {
    try {
      new URL(value);
    } catch {
      return 'Please enter a valid URL';
    }
  }

  if (typeof value === 'string' && field.maxLength !== undefined && value.length > field.maxLength) {
    return `Must be at most ${field.maxLength} characters`;
  }

  if (typeof value === 'number') {
    if (field.min !== undefined && value < field.min) {
      return `Must be at least ${field.min}`;
    }

    if (field.max !== undefined && value > field.max) {
      return `Must be at most ${field.max}`;
    }
  }

  return undefined;
}

function runFieldValidation<TFormValues extends FormedibleFormValues>(
  validation: FormedibleFieldValidation<TFormValues> | undefined,
  fieldName: string,
  value: unknown,
  values: TFormValues,
): string | undefined {
  if (!validation) {
    return undefined;
  }

  if (typeof validation === 'function') {
    return resultToMessage(validation(value, values, { value, values, fieldName }), 'Invalid value');
  }

  return resultToMessage(validation.validator(value, values), validation.message);
}

function schemaFieldMessage<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  schema: StandardSchemaV1<TFormValues, unknown> | undefined,
  formApi: FormedibleFormValidationApi<TFormValues>,
): string | undefined {
  if (!schema) {
    return undefined;
  }

  const fields = formApi.parseValuesWithSchema(schema)?.fields;

  return firstIssueMessage(fields?.[fieldName]);
}

async function schemaFieldMessageAsync<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  schema: StandardSchemaV1<TFormValues, unknown> | undefined,
  formApi: FormedibleFormValidationApi<TFormValues>,
): Promise<string | undefined> {
  if (!schema) {
    return undefined;
  }

  const fields = (await formApi.parseValuesWithSchemaAsync(schema))?.fields;

  return firstIssueMessage(fields?.[fieldName]);
}

function crossFieldMessage<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  validations: readonly FormedibleCrossFieldValidation<TFormValues>[] | undefined,
  values: TFormValues,
): string | undefined {
  for (const validation of validations ?? []) {
    if (!validation.fields.includes(fieldName)) {
      continue;
    }

    const message = resultToMessage(validation.validator(values), 'Invalid field combination');

    if (message) {
      return message;
    }
  }

  return undefined;
}

function asyncValidationForField<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  asyncValidation: Partial<Record<string, FormedibleAsyncValidation<TFormValues>>> | undefined,
): FormedibleAsyncValidation<TFormValues> | undefined {
  return asyncValidation?.[fieldName];
}

function fieldDependencies<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  crossFieldValidation: readonly FormedibleCrossFieldValidation<TFormValues>[] | undefined,
): readonly string[] | undefined {
  const dependencies = new Set<string>();

  for (const validation of crossFieldValidation ?? []) {
    if (!validation.fields.includes(fieldName)) {
      continue;
    }

    for (const dependency of validation.fields) {
      if (dependency !== fieldName) {
        dependencies.add(dependency);
      }
    }
  }

  return dependencies.size > 0 ? [...dependencies] : undefined;
}

export function buildFieldValidators<TFormValues extends FormedibleFormValues, TName extends DeepKeys<TFormValues>>(
  field: NormalizedFieldConfig<TFormValues>,
  schema: unknown,
  crossFieldValidation: readonly FormedibleCrossFieldValidation<TFormValues>[] | undefined,
  asyncValidation: Partial<Record<string, FormedibleAsyncValidation<TFormValues>>> | undefined,
): BuiltFieldValidators<TFormValues, TName> {
  const fieldName = field.name;
  const standardSchema = toStandardSchema<TFormValues>(schema);
  const fieldAsyncValidation = asyncValidationForField(fieldName, asyncValidation);
  const inlineValidation = field.inlineValidation?.enabled ? field.inlineValidation : undefined;
  const debounceMs = fieldAsyncValidation?.debounceMs ?? inlineValidation?.debounceMs;
  const onChangeListenTo = fieldDependencies(fieldName, crossFieldValidation);

  const validators: FormedibleFieldValidators<TFormValues> = {
    onChange: ({ value, fieldApi }) =>
      validateBuiltInConstraints(field, value) ??
      runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
      schemaFieldMessage(fieldName, standardSchema, fieldApi.form) ??
      crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
    onBlur: ({ value, fieldApi }) =>
      validateBuiltInConstraints(field, value) ??
      runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
      schemaFieldMessage(fieldName, standardSchema, fieldApi.form) ??
      crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
    onSubmit: ({ value, fieldApi }) =>
      validateBuiltInConstraints(field, value) ??
      runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
      schemaFieldMessage(fieldName, standardSchema, fieldApi.form) ??
      crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
    onChangeAsync:
      fieldAsyncValidation || inlineValidation
        ? async ({ value, fieldApi, signal }) => {
            if (fieldAsyncValidation) {
              const message = resultToMessage(await fieldAsyncValidation.validator(value, fieldApi.form.state.values, signal), 'Invalid value');

              if (message) {
                return message;
              }
            }

            if (inlineValidation?.validator) {
              const message = resultToMessage(await inlineValidation.validator(value, fieldApi.form.state.values, signal), 'Invalid value');

              if (message) {
                return message;
              }
            }

            return schemaFieldMessageAsync(fieldName, standardSchema, fieldApi.form);
          }
        : undefined,
    onChangeAsyncDebounceMs: debounceMs,
    onChangeListenTo,
  };

  return validators as unknown as BuiltFieldValidators<TFormValues, TName>;
}

export function buildFormValidators<TFormValues extends FormedibleFormValues>(
  schema: unknown,
  crossFieldValidation: readonly FormedibleCrossFieldValidation<TFormValues>[] | undefined,
): BuiltFormValidators<TFormValues> | undefined {
  const standardSchema = toStandardSchema<TFormValues>(schema);

  if (!standardSchema && (!crossFieldValidation || crossFieldValidation.length === 0)) {
    return undefined;
  }

  const validate = ({ value, formApi }: FormedibleFormValidatorContext<TFormValues>) => {
    const fields: Partial<Record<string, string>> = {};
    const schemaFields = standardSchema ? formApi.parseValuesWithSchema(standardSchema)?.fields : undefined;

    for (const [fieldName, issues] of Object.entries(schemaFields ?? {})) {
      const message = formatValidationError(issues);

      if (message) {
        fields[fieldName] = message;
      }
    }

    for (const validation of crossFieldValidation ?? []) {
      const message = resultToMessage(validation.validator(value), 'Invalid field combination');

      if (!message) {
        continue;
      }

      for (const fieldName of validation.fields) {
        fields[fieldName] = message;
      }
    }

    return Object.keys(fields).length > 0 ? { fields } : undefined;
  };

  const validators: FormedibleFormValidators<TFormValues> = {
    onChange: validate,
    onBlur: validate,
    onSubmit: validate,
  };

  return validators;
}
