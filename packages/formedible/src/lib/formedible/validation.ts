import type { DeepKeys, DeepValue, FieldAsyncValidateOrFn, FieldValidateFn, FieldValidators, FormAsyncValidateOrFn, FormValidateFn, FormValidators, StandardSchemaV1 } from '@tanstack/react-form';

import { isFieldPathVisible } from '@/lib/formedible/field-visibility';
import type { FormediblePageTabVisibility } from '@/lib/formedible/field-visibility';
import { firstIssueMessage, formatValidationError } from '@/lib/formedible/zod-errors';
import type {
  FormedibleAsyncValidation,
  FormedibleCrossFieldValidation,
  FormedibleFieldValidation,
  FormedibleFormValues,
  FormedibleStandardFieldSchema,
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
  FormAsyncValidateOrFn<TFormValues>,
  FormValidateFn<TFormValues>,
  undefined,
  FormValidateFn<TFormValues>,
  FormAsyncValidateOrFn<TFormValues>,
  undefined,
  undefined
>;

export interface FormedibleFormValidatorContext<TFormValues extends FormedibleFormValues> {
  readonly value: TFormValues;
  readonly formApi: FormedibleFormValidationApi<TFormValues>;
}

export interface FormedibleAsyncFormValidatorContext<TFormValues extends FormedibleFormValues> extends FormedibleFormValidatorContext<TFormValues> {
  readonly signal: AbortSignal;
}

export type FormedibleFieldErrorsResult = { readonly fields: Partial<Record<string, string>> } | undefined;

/** Combines two form-validator field-error results into one (later keys win). */
export function mergeFormedibleFieldErrors(first: FormedibleFieldErrorsResult, second: FormedibleFieldErrorsResult): FormedibleFieldErrorsResult {
  const fields: Partial<Record<string, string>> = { ...(first?.fields ?? {}), ...(second?.fields ?? {}) };

  return Object.keys(fields).length > 0 ? { fields } : undefined;
}

export interface FormedibleFormValidators<TFormValues extends FormedibleFormValues> {
  readonly onChange?: (context: FormedibleFormValidatorContext<TFormValues>) => FormedibleFieldErrorsResult;
  readonly onBlur?: (context: FormedibleFormValidatorContext<TFormValues>) => FormedibleFieldErrorsResult;
  readonly onSubmit?: (context: FormedibleFormValidatorContext<TFormValues>) => FormedibleFieldErrorsResult;
  readonly onChangeAsync?: (context: FormedibleAsyncFormValidatorContext<TFormValues>) => Promise<FormedibleFieldErrorsResult>;
  readonly onSubmitAsync?: (context: FormedibleAsyncFormValidatorContext<TFormValues>) => Promise<FormedibleFieldErrorsResult>;
}

type FormedibleParsedSchemaIssues = {
  readonly fields: Readonly<Record<string, readonly { readonly message: string }[]>>;
} | undefined;

interface CachedFormSchemaParse {
  readonly schema: unknown;
  /** Whether the schema resolved synchronously; `false` means the schema only validates asynchronously. */
  readonly syncResolved: boolean;
  readonly syncFields: FormedibleParsedSchemaIssues;
  readonly asyncFields: Promise<FormedibleParsedSchemaIssues> | undefined;
}

const formSchemaParseCache = new WeakMap<FormedibleFormValues, CachedFormSchemaParse>();

interface ProbeableStandardSchema {
  readonly '~standard': { readonly validate: (value: unknown) => unknown };
}

/**
 * Sticky per-schema async verdicts driving async-slot registration. A `false`
 * verdict only ever upgrades to `true`: runtime slots that observe a promise
 * (or a sync parse throwing) flip the verdict so the next render registers the
 * async slots (see `markSchemaAsync`).
 */
const schemaAsyncCache = new WeakMap<object, boolean>();

/**
 * Neutral typed inputs fed to schemas when no real values are at hand. Zod v4
 * only returns a promise once parsing actually reaches an async check, so the
 * probe needs inputs that pass each shape's type check; no single value can,
 * hence the ladder.
 */
const schemaAsyncProbeInputs: readonly unknown[] = ['', 0, false, null, {}, [], new Date(0)];

function toProbeableStandardSchema(schema: unknown): ProbeableStandardSchema | undefined {
  if (typeof schema !== 'object' || schema === null || !('~standard' in schema)) {
    return undefined;
  }

  const standard = (schema as { readonly '~standard'?: unknown })['~standard'];

  if (typeof standard !== 'object' || standard === null || !('validate' in standard) || typeof (standard as { readonly validate?: unknown }).validate !== 'function') {
    return undefined;
  }

  return schema as ProbeableStandardSchema;
}

/**
 * Marks a schema as async after a runtime slot observed asynchronous behavior
 * (a promise from `validate`, or a sync parse throwing like TanStack's
 * standard-schema validator does for async schemas).
 */
function markSchemaAsync(schema: object): void {
  schemaAsyncCache.set(schema, true);
}

/**
 * Detects whether a Standard Schema can validate asynchronously, so async
 * validator slots are only registered for schemas that genuinely need them.
 * Registering an async slot for a sync schema makes form-core schedule its
 * debounced pass through a real `setTimeout` on every change and submit, whose
 * per-cause timer slots a stale change pass can clear mid-submit, leaving
 * `handleSubmit` unsettled.
 *
 * The probe feeds the schema the caller's sample values (form defaults) plus
 * the neutral input ladder and watches for a promise-like `validate` result;
 * sync schemas never produce one. Verdicts are cached per schema identity and
 * upgrade to `true` permanently once any probe or runtime parse observes
 * async behavior, so a schema whose async checks sit behind values the probe
 * could not traverse still picks its async slots back up after the first
 * affected validation pass.
 */
export function isFormedibleSchemaAsync(schema: unknown, sampleValues?: unknown): boolean {
  const probeable = toProbeableStandardSchema(schema);

  if (!probeable) {
    return false;
  }

  const cached = schemaAsyncCache.get(probeable);

  if (cached !== undefined) {
    return cached;
  }

  const inputs = sampleValues === undefined ? schemaAsyncProbeInputs : [sampleValues, ...schemaAsyncProbeInputs];
  let async = false;

  for (const input of inputs) {
    let result: unknown;

    try {
      result = probeable['~standard'].validate(input);
    } catch {
      continue;
    }

    if (isPromiseLike(result)) {
      // The probe only inspects promise-ness; the outcome is discarded and
      // rejections swallowed so a probe can never surface as unhandled.
      try {
        result.then(() => undefined, () => undefined);
      } catch {
        // A thenable whose `then` throws is still treated as async.
      }

      async = true;
      break;
    }
  }

  schemaAsyncCache.set(probeable, async);

  return async;
}

/**
 * Parses the full form values with the schema at most once per values object
 * identity, shared across form-level and field-level validators within the
 * same validation pass. Async schemas (whose sync parse throws in TanStack's
 * standard-schema validator) resolve to `undefined` here so sync validator
 * slots never crash; the async slots own them.
 */
function parseFormSchemaSync<TFormValues extends FormedibleFormValues>(
  schema: StandardSchemaV1<TFormValues, unknown>,
  formApi: FormedibleFormValidationApi<TFormValues>,
): FormedibleParsedSchemaIssues {
  const values = formApi.state.values;
  const cached = formSchemaParseCache.get(values);

  if (cached?.schema === schema && cached.syncResolved) {
    return cached.syncFields;
  }

  let syncFields: FormedibleParsedSchemaIssues = undefined;
  let syncResolved = true;

  try {
    syncFields = formApi.parseValuesWithSchema(schema);
  } catch {
    syncFields = undefined;
    syncResolved = false;
    markSchemaAsync(schema);
  }

  formSchemaParseCache.set(values, {
    schema,
    syncResolved,
    syncFields,
    asyncFields: cached?.schema === schema ? cached.asyncFields : undefined,
  });

  return syncFields;
}

function parseFormSchemaAsync<TFormValues extends FormedibleFormValues>(
  schema: StandardSchemaV1<TFormValues, unknown>,
  formApi: FormedibleFormValidationApi<TFormValues>,
): Promise<FormedibleParsedSchemaIssues> {
  const values = formApi.state.values;
  const cached = formSchemaParseCache.get(values);

  if (cached?.schema === schema) {
    if (cached.asyncFields) {
      return cached.asyncFields;
    }

    if (cached.syncResolved) {
      return Promise.resolve(cached.syncFields);
    }
  }

  const asyncFields = formApi.parseValuesWithSchemaAsync(schema);

  formSchemaParseCache.set(values, {
    schema,
    syncResolved: cached?.schema === schema ? cached.syncResolved : false,
    syncFields: cached?.schema === schema ? cached.syncFields : undefined,
    asyncFields,
  });

  return asyncFields;
}

function toStandardSchema<TFormValues extends FormedibleFormValues>(schema: unknown): StandardSchemaV1<TFormValues, unknown> | undefined {
  if (typeof schema !== 'object' || schema === null || !('~standard' in schema)) {
    return undefined;
  }

  const standard = schema['~standard'];

  if (typeof standard !== 'object' || standard === null || !('version' in standard) || standard.version !== 1 || !('validate' in standard)) {
    return undefined;
  }

  if (typeof standard.validate !== 'function') {
    return undefined;
  }

  return schema as StandardSchemaV1<TFormValues, unknown>;
}

function toStandardFieldSchema(schema: unknown): FormedibleStandardFieldSchema | undefined {
  if (typeof schema !== 'object' || schema === null || !('~standard' in schema)) {
    return undefined;
  }

  const standard = schema['~standard'];

  if (typeof standard !== 'object' || standard === null || !('version' in standard) || standard.version !== 1 || !('validate' in standard)) {
    return undefined;
  }

  if (typeof standard.validate !== 'function') {
    return undefined;
  }

  return schema as FormedibleStandardFieldSchema;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

function validationIssues(result: unknown): readonly unknown[] | undefined {
  if (typeof result !== 'object' || result === null || !('issues' in result) || !Array.isArray(result.issues)) {
    return undefined;
  }

  return result.issues;
}

function schemaValidationMessage(schema: FormedibleStandardFieldSchema, value: unknown): string | undefined {
  const result = schema['~standard'].validate(value);

  if (isPromiseLike(result)) {
    markSchemaAsync(schema);
    return undefined;
  }

  return formatValidationError(validationIssues(result));
}

async function schemaValidationMessageAsync(schema: FormedibleStandardFieldSchema, value: unknown): Promise<string | undefined> {
  const result = await schema['~standard'].validate(value);

  return formatValidationError(validationIssues(result));
}

function isFieldValidationObject<TFormValues extends FormedibleFormValues>(
  validation: FormedibleFieldValidation<TFormValues>,
): validation is Extract<FormedibleFieldValidation<TFormValues>, { readonly validator: unknown }> {
  return typeof validation === 'object' && validation !== null && 'validator' in validation && typeof validation.validator === 'function';
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

function requiredFieldLabel<TFormValues extends FormedibleFormValues>(field: NormalizedFieldConfig<TFormValues>): string {
  if (typeof field.label === 'string' && field.label.length > 0) {
    return field.label;
  }

  return String(field.name);
}

function validateRequired<TFormValues extends FormedibleFormValues>(field: NormalizedFieldConfig<TFormValues>, value: unknown): string | undefined {
  if (!field.required) {
    return undefined;
  }

  const uncheckedBoolean = (field.type === 'checkbox' || field.type === 'switch') && value === false;

  if (!isEmptyValue(value) && !uncheckedBoolean) {
    return undefined;
  }

  return `${requiredFieldLabel(field)} is required`;
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

  const fieldSchema = toStandardFieldSchema(validation);

  if (fieldSchema) {
    return schemaValidationMessage(fieldSchema, value);
  }

  if (!isFieldValidationObject(validation)) {
    return undefined;
  }

  return resultToMessage(validation.validator(value, values), validation.message);
}

function schemaFieldMessage<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  schema: StandardSchemaV1<TFormValues, unknown> | undefined,
  formApi: FormedibleFormValidationApi<TFormValues>,
  rootFields: readonly NormalizedFieldConfig<TFormValues>[] | undefined,
  visibility: FormediblePageTabVisibility<TFormValues> | undefined,
): string | undefined {
  if (!schema) {
    return undefined;
  }

  if (rootFields && !isFieldPathVisible(rootFields, fieldName, formApi.state.values, visibility)) {
    return undefined;
  }

  const fields = parseFormSchemaSync(schema, formApi)?.fields;

  return firstIssueMessage(fields?.[fieldName]);
}

async function schemaFieldMessageAsync<TFormValues extends FormedibleFormValues>(
  fieldName: string,
  schema: StandardSchemaV1<TFormValues, unknown> | undefined,
  formApi: FormedibleFormValidationApi<TFormValues>,
  rootFields: readonly NormalizedFieldConfig<TFormValues>[] | undefined,
  visibility: FormediblePageTabVisibility<TFormValues> | undefined,
): Promise<string | undefined> {
  if (!schema) {
    return undefined;
  }

  if (rootFields && !isFieldPathVisible(rootFields, fieldName, formApi.state.values, visibility)) {
    return undefined;
  }

  const fields = (await parseFormSchemaAsync(schema, formApi))?.fields;

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
  rootFields?: readonly NormalizedFieldConfig<TFormValues>[],
  visibility?: FormediblePageTabVisibility<TFormValues>,
): BuiltFieldValidators<TFormValues, TName> {
  const fieldName = field.name;
  const standardSchema = toStandardSchema<TFormValues>(schema);
  const fieldValidationSchema = toStandardFieldSchema(field.validation);
  const fieldAsyncValidation = asyncValidationForField(fieldName, asyncValidation);
  const inlineValidation = field.inlineValidation?.enabled ? field.inlineValidation : undefined;
  const debounceMs = fieldAsyncValidation?.debounceMs ?? inlineValidation?.debounceMs;
  const onChangeListenTo = fieldDependencies(fieldName, crossFieldValidation);
  /**
   * Async slots are registered only for genuinely-async sources: configured
   * async/inline validators, an async field schema, or an async form schema.
   * A sync schema is fully covered by the sync slots above (built-ins,
   * `runFieldValidation`, `schemaFieldMessage`), and merely registering an
   * async slot would make form-core schedule its debounced pass through a
   * real `setTimeout` whose per-cause timer a stale change pass can clear
   * mid-submit, leaving `handleSubmit` unsettled.
   */
  const fieldSchemaIsAsync = fieldValidationSchema !== undefined && isFormedibleSchemaAsync(fieldValidationSchema);
  const formSchemaIsAsync = standardSchema !== undefined && isFormedibleSchemaAsync(standardSchema);

  const validators: FormedibleFieldValidators<TFormValues> = {
    onChange: ({ value, fieldApi }) =>
      validateBuiltInConstraints(field, value) ??
      runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
      schemaFieldMessage(fieldName, standardSchema, fieldApi.form, rootFields, visibility) ??
      crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
    onBlur: ({ value, fieldApi }) =>
      validateBuiltInConstraints(field, value) ??
      runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
      schemaFieldMessage(fieldName, standardSchema, fieldApi.form, rootFields, visibility) ??
      crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
    onSubmit: ({ value, fieldApi }) =>
      validateBuiltInConstraints(field, value) ??
      runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
      schemaFieldMessage(fieldName, standardSchema, fieldApi.form, rootFields, visibility) ??
      crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
    onChangeAsync:
      fieldAsyncValidation || inlineValidation || fieldSchemaIsAsync || formSchemaIsAsync
        ? async ({ value, fieldApi, signal }) => {
            if (fieldValidationSchema) {
              const message = await schemaValidationMessageAsync(fieldValidationSchema, value);

              if (message) {
                return message;
              }
            }

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

            return schemaFieldMessageAsync(fieldName, standardSchema, fieldApi.form, rootFields, visibility);
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
  rootFields?: readonly NormalizedFieldConfig<TFormValues>[],
  visibility?: FormediblePageTabVisibility<TFormValues>,
): BuiltFormValidators<TFormValues> | undefined {
  const standardSchema = toStandardSchema<TFormValues>(schema);

  if (!standardSchema && (!crossFieldValidation || crossFieldValidation.length === 0)) {
    return undefined;
  }

  const schemaFieldErrors = (
    schemaFields: Readonly<Record<string, readonly { readonly message: string }[]>> | undefined,
    values: TFormValues,
  ): Partial<Record<string, string>> => {
    const fields: Partial<Record<string, string>> = {};

    for (const [fieldName, issues] of Object.entries(schemaFields ?? {})) {
      if (rootFields && !isFieldPathVisible(rootFields, fieldName, values, visibility)) {
        continue;
      }

      const message = formatValidationError(issues);

      if (message) {
        fields[fieldName] = message;
      }
    }

    return fields;
  };

  const validate = ({ value, formApi }: FormedibleFormValidatorContext<TFormValues>) => {
    const fields: Partial<Record<string, string>> = standardSchema ? schemaFieldErrors(parseFormSchemaSync(standardSchema, formApi)?.fields, value) : {};

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

  const validators: FormedibleFormValidators<TFormValues> = standardSchema
    ? {
        onChange: validate,
        onBlur: validate,
        onSubmit: validate,
        onChangeAsync: async ({ value, formApi }: FormedibleAsyncFormValidatorContext<TFormValues>) => {
          const fields = schemaFieldErrors((await parseFormSchemaAsync(standardSchema, formApi))?.fields, value);

          return Object.keys(fields).length > 0 ? { fields } : undefined;
        },
        onSubmitAsync: async ({ value, formApi }: FormedibleAsyncFormValidatorContext<TFormValues>) => {
          const fields = schemaFieldErrors((await parseFormSchemaAsync(standardSchema, formApi))?.fields, value);

          return Object.keys(fields).length > 0 ? { fields } : undefined;
        },
      }
    : {
        onChange: validate,
        onBlur: validate,
        onSubmit: validate,
      };

  return validators;
}
