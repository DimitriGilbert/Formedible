import type {
  FormedibleFieldConfig,
  FormedibleFieldOption,
  FormedibleFieldType,
  FormedibleFormValues,
  FormedibleObjectConfig,
  FormediblePageConfig,
  UseFormedibleOptions,
} from '@/lib/formedible/types';
import type {
  EnhancedParserError,
  EnhancedParserOptions,
  ParserError,
  ParserOptions,
  ParsedFormConfig,
  SchemaInferenceOptions,
  SchemaInferenceResult,
  ValidationWithSuggestionsResult,
} from '@/lib/formedible/parser-types';

export const supportedFieldTypes = [
  'text',
  'email',
  'password',
  'url',
  'tel',
  'textarea',
  'select',
  'checkbox',
  'switch',
  'number',
  'date',
  'slider',
  'file',
  'rating',
  'phone',
  'colorPicker',
  'location',
  'duration',
  'multiSelect',
  'autocomplete',
  'masked',
  'object',
  'array',
  'radio',
] as const satisfies readonly FormedibleFieldType[];

export type SupportedFieldType = (typeof supportedFieldTypes)[number];

export interface SupportedFieldTypeInfo {
  readonly type: SupportedFieldType;
  readonly schema: string;
  readonly description: string;
}

export const supportedFieldTypeInfo: readonly SupportedFieldTypeInfo[] = [
  { type: 'text', schema: 'z.string()', description: 'Single-line text input' },
  { type: 'email', schema: 'z.string().email()', description: 'Email input' },
  { type: 'password', schema: 'z.string().min(1)', description: 'Password input' },
  { type: 'url', schema: 'z.string().url()', description: 'URL input' },
  { type: 'tel', schema: 'z.string()', description: 'Telephone input' },
  { type: 'textarea', schema: 'z.string()', description: 'Multi-line text input' },
  { type: 'select', schema: 'z.string()', description: 'Single select input' },
  { type: 'checkbox', schema: 'z.boolean()', description: 'Checkbox input' },
  { type: 'switch', schema: 'z.boolean()', description: 'Switch input' },
  { type: 'number', schema: 'z.number()', description: 'Number input' },
  { type: 'date', schema: 'z.string().datetime()', description: 'Date input' },
  { type: 'slider', schema: 'z.number()', description: 'Slider input' },
  { type: 'file', schema: 'z.instanceof(File)', description: 'File upload input' },
  { type: 'rating', schema: 'z.number()', description: 'Rating input' },
  { type: 'phone', schema: 'z.string()', description: 'Phone number input' },
  { type: 'colorPicker', schema: 'z.string()', description: 'Color picker input' },
  { type: 'location', schema: 'z.object({ lat: z.number(), lng: z.number() })', description: 'Location input' },
  { type: 'duration', schema: 'z.number()', description: 'Duration input' },
  { type: 'multiSelect', schema: 'z.array(z.string())', description: 'Multi-select input' },
  { type: 'autocomplete', schema: 'z.string()', description: 'Autocomplete input' },
  { type: 'masked', schema: 'z.string()', description: 'Masked text input' },
  { type: 'object', schema: 'z.object({})', description: 'Nested object input' },
  { type: 'array', schema: 'z.array(z.unknown())', description: 'Repeatable array input' },
  { type: 'radio', schema: 'z.string()', description: 'Radio group input' },
];

const allowedTopLevelKeys = new Set([
  'fields',
  'schema',
  'title',
  'description',
  'submitLabel',
  'nextLabel',
  'previousLabel',
  'collapseLabel',
  'expandLabel',
  'formClassName',
  'fieldClassName',
  'labelClassName',
  'buttonClassName',
  'submitButtonClassName',
  'autoScroll',
  'pages',
  'progress',
  'tabs',
  'autoSubmitOnChange',
  'autoSubmitDebounceMs',
  'disabled',
  'loading',
  'resetOnSubmitSuccess',
  'showSubmitButton',
  'crossFieldValidation',
  'asyncValidation',
  'analytics',
  'layout',
  'conditionalSections',
  'persistence',
  'formOptions',
]);

const supportedFieldTypeSet = new Set<string>(supportedFieldTypes);
const zodSentinel = '__FORMEDIBLE_ZOD_EXPRESSION__';
const maxCodeLength = 1000000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createParserError(message: string, code: string): ParserError {
  const error = new Error(message) as ParserError;
  Object.defineProperty(error, 'name', { value: 'ParserError' });
  Object.defineProperty(error, 'code', { value: code, enumerable: true });

  return error;
}

function sanitizeCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\b(eval|Function|setTimeout|setInterval|require|import)\s*\([^)]*\)/g, 'null')
    .replace(/\b(document|window|globalThis|global|process|__proto__|constructor|prototype)\b/g, 'null')
    .replace(/new\s+Date\(\)\.toISOString\(\)\.split\([^)]*\)\[0\]/g, '"2024-01-01"')
    .replace(/new\s+Date\(\)/g, '"2024-01-01T00:00:00.000Z"')
    .replace(/\([^)]*\)\s*=>\s*\{[^}]*\}/g, 'null')
    .replace(/[A-Za-z_$][\w$]*\s*=>\s*\{[^}]*\}/g, 'null')
    .replace(/\([^)]*\)\s*=>\s*[^,}\]]+/g, 'null')
    .replace(/[A-Za-z_$][\w$]*\s*=>\s*[^,}\]]+/g, 'null')
    .replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, 'null')
    .replace(/new\s+[A-Za-z_$][\w$]*\([^)]*\)/g, 'null');
}

function findExpressionEnd(source: string, startIndex: number): number {
  let index = startIndex;
  let depth = 0;
  let stringDelimiter: string | undefined;
  let escaped = false;

  while (index < source.length) {
    const character = source[index];

    if (stringDelimiter !== undefined) {
      if (character === stringDelimiter && !escaped) {
        stringDelimiter = undefined;
      }
      escaped = character === '\\' && !escaped;
      index += 1;
      continue;
    }

    if (character === '\'' || character === '"' || character === '`') {
      stringDelimiter = character;
      escaped = false;
      index += 1;
      continue;
    }

    if (character === '(') {
      depth += 1;
    }

    if (character === ')') {
      depth -= 1;
    }

    index += 1;

    if (depth === 0) {
      const chainMatch = source.slice(index).match(/^\.[A-Za-z_$][\w$]*\s*\(/);

      if (chainMatch) {
        index += chainMatch[0].length - 1;
        depth = 0;
        continue;
      }

      return index;
    }
  }

  return source.length;
}

function replaceZodExpressions(code: string): string {
  let output = '';
  let index = 0;

  while (index < code.length) {
    const match = code.slice(index).match(/(?<![A-Za-z_$\w])z\.[A-Za-z_$][\w$]*\s*\(/);

    if (!match || match.index === undefined) {
      output += code.slice(index);
      break;
    }

    const expressionStart = index + match.index;
    const openParenIndex = expressionStart + match[0].lastIndexOf('(');
    let expressionEnd = findExpressionEnd(code, openParenIndex);
    let chainMatch = code.slice(expressionEnd).match(/^\.[A-Za-z_$][\w$]*\s*\(/);

    while (chainMatch) {
      const chainOpenParenIndex = expressionEnd + chainMatch[0].lastIndexOf('(');
      expressionEnd = findExpressionEnd(code, chainOpenParenIndex);
      chainMatch = code.slice(expressionEnd).match(/^\.[A-Za-z_$][\w$]*\s*\(/);
    }

    output += `${code.slice(index, expressionStart)}"${zodSentinel}"`;
    index = expressionEnd;
  }

  return output.replace(/z\.[A-Za-z_$][\w$]*/g, `"${zodSentinel}"`);
}

function parseObjectLiteral(code: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(code) as unknown;

    if (!isRecord(parsed)) {
      throw createParserError('Definition must be an object', 'INVALID_DEFINITION');
    }

    return parsed;
  } catch {
    const processed = replaceZodExpressions(code.trim())
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/(?<!\\)'/g, '"')
      .replace(/:\s*undefined/g, ': null');

    try {
      const parsed = JSON.parse(processed) as unknown;

      if (!isRecord(parsed)) {
        throw createParserError('Definition must be an object', 'INVALID_DEFINITION');
      }

      return parsed;
    } catch {
      throw createParserError('Invalid syntax. Use JSON or a JavaScript object literal.', 'SYNTAX_ERROR');
    }
  }
}

function normalizeOption(option: unknown): FormedibleFieldOption | undefined {
  if (typeof option === 'string') {
    return option;
  }

  if (!isRecord(option) || typeof option.value !== 'string') {
    return undefined;
  }

  return {
    ...option,
    value: option.value,
    label: typeof option.label === 'string' ? option.label : option.value,
  };
}

function sanitizeOptions(value: unknown): readonly FormedibleFieldOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((option) => {
    const normalized = normalizeOption(option);
    return normalized === undefined ? [] : [normalized];
  });
}

function copyString(source: Readonly<Record<string, unknown>>, target: Record<string, unknown>, key: string): void {
  if (typeof source[key] === 'string') {
    target[key] = source[key];
  }
}

function copyNumber(source: Readonly<Record<string, unknown>>, target: Record<string, unknown>, key: string): void {
  if (typeof source[key] === 'number') {
    target[key] = source[key];
  }
}

function copyBoolean(source: Readonly<Record<string, unknown>>, target: Record<string, unknown>, key: string): void {
  if (typeof source[key] === 'boolean') {
    target[key] = source[key];
  }
}

function sanitizePlainConfig(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const output: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (typeof nestedValue === 'function' || nestedValue === zodSentinel) {
      continue;
    }

    if (Array.isArray(nestedValue)) {
      output[key] = nestedValue.filter((entry) => typeof entry !== 'function' && entry !== zodSentinel);
      continue;
    }

    const nestedConfig = sanitizePlainConfig(nestedValue);
    output[key] = nestedConfig ?? nestedValue;
  }

  return output;
}

function sanitizeObjectConfig(value: unknown): FormedibleObjectConfig<FormedibleFormValues> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config: Record<string, unknown> = {};
  copyNumber(value, config, 'columns');

  for (const key of ['layout', 'title', 'description', 'collapseLabel', 'expandLabel']) {
    copyString(value, config, key);
  }

  for (const key of ['collapsible', 'defaultCollapsed', 'defaultExpanded', 'showCard']) {
    copyBoolean(value, config, key);
  }

  if (Array.isArray(value.fields)) {
    config.fields = sanitizeFields(value.fields);
  }

  return config as FormedibleObjectConfig<FormedibleFormValues>;
}

function sanitizeArrayConfig(value: unknown): Record<string, unknown> | undefined {
  const config = sanitizePlainConfig(value);

  if (!config) {
    return undefined;
  }

  if (config.objectConfig !== undefined) {
    config.objectConfig = sanitizeObjectConfig(config.objectConfig);
  }

  return config;
}

function sanitizeField(field: unknown, index: number): FormedibleFieldConfig<FormedibleFormValues> {
  if (!isRecord(field)) {
    throw createParserError(`Field at index ${index} must be an object`, 'INVALID_FIELD');
  }

  if (typeof field.name !== 'string' || typeof field.type !== 'string') {
    throw createParserError(`Field at index ${index} must have string name and type properties`, 'MISSING_REQUIRED_FIELD');
  }

  if (!supportedFieldTypeSet.has(field.type)) {
    throw createParserError(`Field at index ${index} has invalid type '${field.type}'`, 'UNSUPPORTED_FIELD_TYPE');
  }

  const output: Record<string, unknown> = {
    name: field.name,
    type: field.type,
  };

  for (const key of ['label', 'placeholder', 'description', 'tab', 'section', 'className', 'inputClassName']) {
    copyString(field, output, key);
  }

  for (const key of ['page', 'min', 'max', 'step', 'rows', 'maxLength']) {
    copyNumber(field, output, key);
  }

  for (const key of ['required', 'disabled', 'dynamicPlaceholder']) {
    copyBoolean(field, output, key);
  }

  if (field.defaultValue !== undefined) {
    output.defaultValue = field.defaultValue;
  }

  const options = sanitizeOptions(field.options);
  if (options !== undefined) {
    output.options = options;
  }

  if (Array.isArray(field.nestedFields)) {
    output.nestedFields = sanitizeFields(field.nestedFields);
  }

  const objectConfig = sanitizeObjectConfig(field.objectConfig);
  if (objectConfig !== undefined) {
    output.objectConfig = objectConfig;
  }

  const arrayConfig = sanitizeArrayConfig(field.arrayConfig);
  if (arrayConfig !== undefined) {
    output.arrayConfig = arrayConfig;
  }

  for (const key of [
    'dateConfig',
    'sliderConfig',
    'ratingConfig',
    'multiSelectConfig',
    'comboboxConfig',
    'multiComboboxConfig',
    'colorConfig',
    'phoneConfig',
    'durationConfig',
    'locationConfig',
    'fileConfig',
  ]) {
    const config = sanitizePlainConfig(field[key]);

    if (config !== undefined) {
      output[key] = config;
    }
  }

  return output as FormedibleFieldConfig<FormedibleFormValues>;
}

function sanitizeFields(fields: readonly unknown[]): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  return fields.map((field, index) => sanitizeField(field, index));
}

function sanitizePages(value: unknown): readonly FormediblePageConfig<FormedibleFormValues>[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((page, index) => {
    if (!isRecord(page)) {
      return [];
    }

    const output: Record<string, unknown> = {
      page: typeof page.page === 'number' ? page.page : index,
      title: typeof page.title === 'string' ? page.title : `Page ${index + 1}`,
    };

    copyString(page, output, 'description');

    return [output as FormediblePageConfig<FormedibleFormValues>];
  });
}

function validateAndSanitize(parsed: Record<string, unknown>, strictValidation: boolean): ParsedFormConfig {
  if (!Array.isArray(parsed.fields)) {
    throw createParserError('Fields must be an array', 'INVALID_FIELDS');
  }

  const output: Record<string, unknown> = {
    fields: sanitizeFields(parsed.fields),
    formOptions: isRecord(parsed.formOptions) ? sanitizePlainConfig(parsed.formOptions) : { defaultValues: {} },
  };

  if (isRecord(output.formOptions) && !isRecord(output.formOptions.defaultValues)) {
    output.formOptions = { ...output.formOptions, defaultValues: {} };
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (!allowedTopLevelKeys.has(key)) {
      if (strictValidation) {
        continue;
      }
      continue;
    }

    if (key === 'fields' || key === 'formOptions') {
      continue;
    }

    if (key === 'schema') {
      const schema = sanitizePlainConfig(value);
      if (schema !== undefined) {
        output.schema = schema;
      }
      continue;
    }

    if (['title', 'description', 'submitLabel', 'nextLabel', 'previousLabel', 'collapseLabel', 'expandLabel', 'formClassName'].includes(key)) {
      if (typeof value === 'string') {
        output[key] = value;
      }
      continue;
    }

    if (['autoScroll', 'autoSubmitOnChange', 'disabled', 'loading', 'resetOnSubmitSuccess', 'showSubmitButton'].includes(key)) {
      if (typeof value === 'boolean') {
        output[key] = value;
      }
      continue;
    }

    if (key === 'autoSubmitDebounceMs' && typeof value === 'number') {
      output[key] = value;
      continue;
    }

    if (key === 'pages') {
      const pages = sanitizePages(value);
      if (pages !== undefined) {
        output.pages = pages;
      }
      continue;
    }

    if (['tabs', 'crossFieldValidation', 'conditionalSections'].includes(key) && Array.isArray(value)) {
      output[key] = value.filter((entry) => typeof entry !== 'function');
      continue;
    }

    const config = sanitizePlainConfig(value);
    if (config !== undefined) {
      output[key] = config;
    }
  }

  return output as ParsedFormConfig;
}

function inferZodTypeFromField(field: FormedibleFieldConfig<FormedibleFormValues>): string | undefined {
  const info = supportedFieldTypeInfo.find((entry) => entry.type === field.type);

  if (!info) {
    return undefined;
  }

  let schema = info.schema;

  if ((field.type === 'text' || field.type === 'textarea') && schema === 'z.string()') {
    if (typeof field.min === 'number') {
      schema += `.min(${field.min})`;
    }
    if (typeof field.max === 'number') {
      schema += `.max(${field.max})`;
    }
  }

  if ((field.type === 'number' || field.type === 'slider') && schema === 'z.number()') {
    if (typeof field.min === 'number') {
      schema += `.min(${field.min})`;
    }
    if (typeof field.max === 'number') {
      schema += `.max(${field.max})`;
    }
  }

  return field.required === false ? `${schema}.optional()` : schema;
}

function createFieldFromSchema(name: string, schema: unknown): FormedibleFieldConfig<FormedibleFormValues> | undefined {
  if (!isRecord(schema)) {
    return undefined;
  }

  const type = schema.type === 'number' ? 'number' : schema.type === 'boolean' ? 'checkbox' : 'text';
  const label = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');

  return { name, type, label };
}

function extractErrorLocation(code: string, error: unknown): EnhancedParserError['location'] | undefined {
  const message = error instanceof Error ? error.message : String(error);
  const positionMatch = message.match(/at position (\d+)/i);

  if (positionMatch?.[1]) {
    const position = Number.parseInt(positionMatch[1], 10);
    const lines = code.slice(0, position).split('\n');
    const lastLine = lines.at(-1) ?? '';

    return { line: lines.length, column: lastLine.length + 1 };
  }

  const fieldMatch = message.match(/field at index (\d+)/i);

  if (fieldMatch?.[1]) {
    return { field: `field[${fieldMatch[1]}]` };
  }

  return undefined;
}

export class FormedibleParser {
  static parse(code: string, options?: ParserOptions | EnhancedParserOptions): ParsedFormConfig {
    if (typeof code !== 'string' || code.trim().length === 0) {
      throw createParserError('Input code must be a non-empty string', 'INVALID_INPUT');
    }

    if (code.length > maxCodeLength) {
      throw createParserError(`Code length exceeds maximum allowed size of ${maxCodeLength} characters`, 'CODE_TOO_LARGE');
    }

    const sanitizedCode = sanitizeCode(code);
    const parsed = parseObjectLiteral(sanitizedCode);

    return validateAndSanitize(parsed, options?.strictValidation ?? true);
  }

  static isValidFieldType(type: string): type is SupportedFieldType {
    return supportedFieldTypeSet.has(type);
  }

  static getSupportedFieldTypes(): readonly SupportedFieldType[] {
    return supportedFieldTypes;
  }

  static getSupportedFieldTypeInfo(): readonly SupportedFieldTypeInfo[] {
    return supportedFieldTypeInfo;
  }

  static validateConfig(config: unknown): { readonly isValid: boolean; readonly errors: readonly string[] } {
    try {
      if (!isRecord(config)) {
        throw createParserError('Definition must be an object', 'INVALID_DEFINITION');
      }

      validateAndSanitize(config, true);
      return { isValid: true, errors: [] };
    } catch (error) {
      return { isValid: false, errors: [error instanceof Error ? error.message : String(error)] };
    }
  }

  static parseWithSchemaInference(code: string, options?: SchemaInferenceOptions): SchemaInferenceResult {
    const config = this.parse(code);
    const properties: Record<string, string> = {};
    let confidence = options?.enabled ? 0.5 : 0;

    if (options?.enabled) {
      for (const field of config.fields) {
        const schema = inferZodTypeFromField(field);

        if (schema !== undefined) {
          properties[field.name] = schema;
          confidence += 0.1;
        }
      }
    }

    return {
      config,
      inferredSchema: options?.enabled ? { type: 'object', properties, isInferred: true } : undefined,
      confidence: Math.min(confidence, 1),
    };
  }

  static mergeSchemas(
    parsedConfig: UseFormedibleOptions<FormedibleFormValues>,
    baseSchema: unknown,
    strategy: 'extend' | 'override' | 'intersect' = 'extend',
  ): UseFormedibleOptions<FormedibleFormValues> {
    if (!isRecord(baseSchema)) {
      return parsedConfig;
    }

    if (strategy === 'override') {
      return { ...parsedConfig, schema: baseSchema };
    }

    const properties = isRecord(baseSchema.properties) ? baseSchema.properties : {};

    if (strategy === 'intersect') {
      return {
        ...parsedConfig,
        fields: parsedConfig.fields.filter((field) => Object.prototype.hasOwnProperty.call(properties, field.name)),
        schema: baseSchema,
      };
    }

    const existingNames = new Set(parsedConfig.fields.map((field) => field.name));
    const addedFields = Object.entries(properties).flatMap(([name, schema]) => {
      if (existingNames.has(name)) {
        return [];
      }

      const field = createFieldFromSchema(name, schema);
      return field === undefined ? [] : [field];
    });

    return {
      ...parsedConfig,
      fields: [...parsedConfig.fields, ...addedFields],
      schema: baseSchema,
    };
  }

  static validateWithSuggestions(code: string): ValidationWithSuggestionsResult {
    try {
      this.parse(code);
      return { isValid: true, errors: [], suggestions: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const type: EnhancedParserError['type'] = message.includes('invalid type') ? 'field_type' : message.includes('schema') ? 'schema' : 'syntax';
      const suggestion =
        type === 'field_type'
          ? `Use one of the supported field types: ${supportedFieldTypes.join(', ')}`
          : 'Use valid JSON or JavaScript object literal syntax.';

      return {
        isValid: false,
        errors: [{ type, message, suggestion, location: extractErrorLocation(code, error) }],
        suggestions: [suggestion, 'Ensure every field has a string name and supported type.'],
      };
    }
  }
}

export type { FormedibleFieldConfig, FormedibleObjectConfig, FormediblePageConfig, ParserError, ParserOptions, UseFormedibleOptions };
