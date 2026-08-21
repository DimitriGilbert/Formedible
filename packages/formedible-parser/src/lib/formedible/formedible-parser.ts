import type {
  FormedibleFieldConfig,
  FormedibleFieldOption,
  FormedibleFieldType,
  FormedibleFormValues,
  FormedibleObjectConfig,
  FormediblePageConfig,
  UseFormedibleOptions,
} from '@/components/formedible/lib/types';
import type {
  EnhancedParserError,
  EnhancedParserOptions,
  FormedibleExtractionResult,
  FormedibleParseResult,
  FormedibleStructuredOutput,
  ParserError,
  ParserOptions,
  ParsedFormConfig,
  SchemaInferenceOptions,
  SchemaInferenceResult,
  ValidationWithSuggestionsResult,
} from '@/components/formedible/lib/parser-types';
import { defaultParserConfig } from './parser-config-schema';

export const version = '0.1.0';

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
const fieldTypeAliases = {
  'radio-group': 'radio',
  radioGroup: 'radio',
  'checkbox-group': 'multiSelect',
  checkboxGroup: 'multiSelect',
  multiselect: 'multiSelect',
  'multi-select': 'multiSelect',
  'text-area': 'textarea',
  'number-input': 'number',
  'date-picker': 'date',
  'file-upload': 'file',
  'color-picker': 'colorPicker',
  color: 'colorPicker',
  telephone: 'phone',
} as const satisfies Readonly<Record<string, FormedibleFieldType>>;
const fieldTypeAliasMap: ReadonlyMap<string, FormedibleFieldType> = new Map(Object.entries(fieldTypeAliases));
const zodSentinel = '__FORMEDIBLE_ZOD_EXPRESSION__';
const maxCodeLength = 1000000;

const allowedFieldKeys = new Set([
  'name',
  'type',
  'label',
  'placeholder',
  'description',
  'tab',
  'section',
  'className',
  'inputClassName',
  'page',
  'min',
  'max',
  'step',
  'rows',
  'maxLength',
  'required',
  'disabled',
  'dynamicPlaceholder',
  'defaultValue',
  'options',
  'optionSets',
  'datalist',
  'help',
  'mask',
  'nestedFields',
  'objectConfig',
  'arrayConfig',
  'textareaConfig',
  'passwordConfig',
  'numberConfig',
  'dateConfig',
  'sliderConfig',
  'ratingConfig',
  'multiSelectConfig',
  'comboboxConfig',
  'autocompleteConfig',
  'maskedInputConfig',
  'multiComboboxConfig',
  'colorConfig',
  'phoneConfig',
  'durationConfig',
  'locationConfig',
  'fileConfig',
]);

const executableSyntaxPattern = /(?:=>|\bfunction\s*\(|\bclass\s+[A-Za-z_$]|\bnew\s+[A-Za-z_$][\w$]*\s*\(|\beval\s*\(|\bFunction\s*\(|\bsetTimeout\s*\(|\bsetInterval\s*\(|\brequire\s*\(|\bimport\s*\(|<\s*[A-Z][A-Za-z0-9]*(?:\s|>|\/))/;

type CodeRegionKind = 'code' | 'comment' | 'single' | 'double' | 'template';

interface CodeRegion {
  readonly kind: CodeRegionKind;
  readonly text: string;
}

// Scans config source into contiguous regions, classifying each chunk as code,
// comment, or one of the string-literal kinds. Every transform that rewrites or
// audits executable syntax must operate on non-string regions only, so prose in
// string values (e.g. "Close the window", "key => value") stays verbatim.
// Template literals: the quoted text is a string region, while ${...}
// interpolation expressions are scanned as code so executable content inside
// interpolations is still audited and sanitized. Unterminated literals extend
// to the end of the input, which keeps the scanner total (it never throws).
function scanCodeRegions(code: string): readonly CodeRegion[] {
  const regions: CodeRegion[] = [];
  let kind: CodeRegionKind = 'code';
  let buffer = '';

  const flush = (): void => {
    if (buffer.length > 0) {
      regions.push({ kind, text: buffer });
      buffer = '';
    }
  };

  const begin = (next: CodeRegionKind): void => {
    flush();
    kind = next;
  };

  let index = 0;
  let literal: 'single' | 'double' | 'template' | undefined;
  let escaped = false;
  const interpolationDepths: number[] = [];

  while (index < code.length) {
    const character = code[index];

    if (literal !== undefined) {
      buffer += character;

      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (literal === 'template') {
        if (character === '`') {
          literal = undefined;
          begin('code');
        } else if (character === '$' && code[index + 1] === '{') {
          buffer += '{';
          index += 2;
          interpolationDepths.push(0);
          literal = undefined;
          begin('code');
          continue;
        }
      } else if ((literal === 'single' && character === '\'') || (literal === 'double' && character === '"')) {
        literal = undefined;
        begin('code');
      }

      index += 1;
      continue;
    }

    if (character === '/' && code[index + 1] === '/') {
      const lineEnd = code.indexOf('\n', index);
      const commentEnd = lineEnd === -1 ? code.length : lineEnd;
      begin('comment');
      buffer += code.slice(index, commentEnd);
      index = commentEnd;
      begin('code');
      continue;
    }

    if (character === '/' && code[index + 1] === '*') {
      const closeIndex = code.indexOf('*/', index + 2);
      const commentEnd = closeIndex === -1 ? code.length : closeIndex + 2;
      begin('comment');
      buffer += code.slice(index, commentEnd);
      index = commentEnd;
      begin('code');
      continue;
    }

    const literalKind: CodeRegionKind | undefined =
      character === '\'' ? 'single' : character === '"' ? 'double' : character === '`' ? 'template' : undefined;

    if (literalKind !== undefined) {
      begin(literalKind);
      buffer += character;
      literal = literalKind;
      escaped = false;
    } else {
      buffer += character;

      const interpolationDepth = interpolationDepths.at(-1);

      if (character === '{' && interpolationDepth !== undefined) {
        interpolationDepths[interpolationDepths.length - 1] = interpolationDepth + 1;
      } else if (character === '}' && interpolationDepth !== undefined) {
        if (interpolationDepth === 0) {
          interpolationDepths.pop();
          begin('template');
          literal = 'template';
          escaped = false;
        } else {
          interpolationDepths[interpolationDepths.length - 1] = interpolationDepth - 1;
        }
      }
    }

    index += 1;
  }

  flush();
  return regions;
}

// Converts a single-quoted string region (delimiters included) into the
// equivalent JSON double-quoted string: delimiters flip to `"`, the JSON-illegal
// `\'` escape becomes a plain `'`, and bare `"` characters in the content are
// escaped so the flipped region stays a single valid JSON token.
function convertSingleQuotedRegion(region: string): string {
  let output = '"';
  let escaped = false;

  for (let index = 1; index < region.length; index += 1) {
    const character = region[index];

    if (escaped) {
      output += character === '\'' ? character : `\\${character}`;
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '\'') {
      break;
    }

    output += character === '"' ? '\\"' : character;
  }

  return `${output}"`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createParserError(message: string, code: string): ParserError {
  const error = new Error(message) as ParserError;
  Object.defineProperty(error, 'name', { value: 'ParserError' });
  Object.defineProperty(error, 'code', { value: code, enumerable: true });

  return error;
}

function createMaxNestingDepthError(maxNestingDepth: number): ParserError {
  return createParserError(`Configuration exceeds the maximum nesting depth of ${maxNestingDepth}.`, 'EXCEEDS_MAX_NESTING_DEPTH');
}

// Guards every recursive value walk (cloneJsonValue, sanitizeDefaultValue,
// sanitizePlainConfig, sanitizeField) so hostile deeply nested input fails with
// a coded error long before the call stack overflows. The default comes from
// defaultParserConfig.maxNestingDepth and can be overridden per parse call via
// ParserOptions.maxNestingDepth.
function assertNestingDepth(depth: number, maxNestingDepth: number): void {
  if (depth > maxNestingDepth) {
    throw createMaxNestingDepthError(maxNestingDepth);
  }
}

function parserErrorToEnhanced(error: unknown, code?: string): EnhancedParserError {
  const message = error instanceof Error ? error.message : String(error);
  const type: EnhancedParserError['type'] = message.includes('field type') || message.includes('not allowed') ? 'field_type' : message.includes('schema') ? 'schema' : 'validation';

  return {
    type,
    message,
    suggestion: type === 'field_type' ? `Use one of the supported field types: ${supportedFieldTypes.join(', ')}` : 'Return only an AI-safe Formedible config object.',
    location: code === undefined ? undefined : extractErrorLocation(code, error),
  };
}

function assertNoExecutableSyntax(code: string): void {
  const violates = scanCodeRegions(code).some((region) => region.kind !== 'single' && region.kind !== 'double' && region.kind !== 'template' && executableSyntaxPattern.test(region.text));

  if (violates) {
    throw createParserError('Executable callbacks, constructors, imports, and component markup are not supported in AI-generated Formedible configs.', 'EXECUTABLE_INPUT');
  }
}

function neutralizeExecutableConstructs(code: string): string {
  return code
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

function sanitizeCode(code: string): string {
  return scanCodeRegions(code)
    .map((region) => {
      if (region.kind === 'comment') {
        return '';
      }

      return region.kind === 'code' ? neutralizeExecutableConstructs(region.text) : region.text;
    })
    .join('');
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

function normalizeObjectLiteralSyntax(code: string): string {
  return code
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/:\s*undefined/g, ': null');
}

function parseObjectLiteral(code: string, maxNestingDepth: number): Record<string, unknown> {
  try {
    const parsed = JSON.parse(code) as unknown;

    if (!isRecord(parsed)) {
      throw createParserError('Definition must be an object', 'INVALID_DEFINITION');
    }

    return parsed;
  } catch (error) {
    // JSON.parse recurses internally, so pathologically nested input can
    // overflow the stack before any sanitizer runs. Map that to the coded
    // nesting error instead of leaking a raw RangeError.
    if (error instanceof RangeError) {
      throw createMaxNestingDepthError(maxNestingDepth);
    }

    const processed = scanCodeRegions(replaceZodExpressions(code.trim()))
      .map((region) => {
        if (region.kind === 'single') {
          return convertSingleQuotedRegion(region.text);
        }

        return region.kind === 'code' ? normalizeObjectLiteralSyntax(region.text) : region.text;
      })
      .join('');

    try {
      const parsed = JSON.parse(processed) as unknown;

      if (!isRecord(parsed)) {
        throw createParserError('Definition must be an object', 'INVALID_DEFINITION');
      }

      return parsed;
    } catch (fallbackError) {
      if (fallbackError instanceof RangeError) {
        throw createMaxNestingDepthError(maxNestingDepth);
      }

      throw createParserError('Invalid syntax. Use JSON or a JavaScript object literal.', 'SYNTAX_ERROR');
    }
  }
}

function cloneJsonValue(value: unknown, depth: number, maxNestingDepth: number): unknown {
  assertNestingDepth(depth, maxNestingDepth);

  if (Array.isArray(value)) {
    return value.map((entry) => cloneJsonValue(entry, depth + 1, maxNestingDepth));
  }

  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry, depth + 1, maxNestingDepth)]));
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }

  if (value === undefined) {
    return undefined;
  }

  throw createParserError('Structured Formedible output contains non-serializable values.', 'UNSUPPORTED_STRUCTURED_VALUE');
}

function sanitizeDefaultValue(value: unknown, depth: number, maxNestingDepth: number): unknown {
  assertNestingDepth(depth, maxNestingDepth);

  if (typeof value === 'string' || typeof value === 'boolean' || value === null) {
    return value;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value;
    }

    throw createParserError('Field defaultValue contains a non-serializable number.', 'UNSUPPORTED_CONFIG_VALUE');
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeDefaultValue(entry, depth + 1, maxNestingDepth));
  }

  if (isRecord(value)) {
    const prototype = Object.getPrototypeOf(value) as object | null;

    if (prototype !== Object.prototype && prototype !== null) {
      throw createParserError('Field defaultValue must be a JSON-serializable plain object.', 'UNSUPPORTED_CONFIG_VALUE');
    }

    const output: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw createParserError(`Field defaultValue contains unsupported key '${key}'.`, 'UNSUPPORTED_CONFIG_KEY');
      }

      output[key] = sanitizeDefaultValue(entry, depth + 1, maxNestingDepth);
    }

    return output;
  }

  throw createParserError('Field defaultValue contains non-serializable values.', 'UNSUPPORTED_CONFIG_VALUE');
}

function parseStructuredObject(value: unknown, maxNestingDepth: number): Record<string, unknown> {
  const cloned = cloneJsonValue(value, 0, maxNestingDepth);

  if (!isRecord(cloned)) {
    throw createParserError('Structured Formedible output must be an object.', 'INVALID_STRUCTURED_OUTPUT');
  }

  return cloned;
}

// Unwraps single-payload envelopes some models wrap around the config. A direct
// ParsedFormConfig must NOT be unwrapped here: its required `formOptions` member
// is config content, not an envelope key, so unwrapping it would strip the
// config and fail validation (Finding 1 round-trip regression).
function pickStructuredCandidate(value: FormedibleStructuredOutput): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  for (const key of ['formedible', 'formConfig', 'config', 'output']) {
    if (candidate[key] !== undefined) {
      return candidate[key];
    }
  }

  return value;
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

function sanitizeOptionSets(value: unknown): Readonly<Record<string, readonly FormedibleFieldOption[]>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const output: Record<string, readonly FormedibleFieldOption[]> = {};

  for (const [key, options] of Object.entries(value)) {
    const sanitizedOptions = sanitizeOptions(options);

    if (sanitizedOptions !== undefined) {
      output[key] = sanitizedOptions;
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

function sanitizeHelpConfig(value: unknown, depth: number, maxNestingDepth: number): string | Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return sanitizePlainConfig(value, depth, maxNestingDepth);
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

function sanitizePlainConfig(value: unknown, depth: number, maxNestingDepth: number): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  assertNestingDepth(depth, maxNestingDepth);

  const output: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (['component', 'render', 'children', 'onChange', 'onBlur', 'onFocus', 'onSubmit', 'conditional'].includes(key)) {
      throw createParserError(`Unsupported executable config key '${key}'`, 'UNSUPPORTED_CONFIG_KEY');
    }

    if (typeof nestedValue === 'function' || nestedValue === zodSentinel) {
      throw createParserError(`Unsupported executable value for key '${key}'`, 'UNSUPPORTED_CONFIG_VALUE');
    }

    if (Array.isArray(nestedValue)) {
      output[key] = nestedValue.filter((entry) => typeof entry !== 'function' && entry !== zodSentinel);
      continue;
    }

    const nestedConfig = sanitizePlainConfig(nestedValue, depth + 1, maxNestingDepth);
    output[key] = nestedConfig ?? nestedValue;
  }

  return output;
}

function sanitizeObjectConfig(value: unknown, depth: number, maxNestingDepth: number): FormedibleObjectConfig<FormedibleFormValues> | undefined {
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
    config.fields = sanitizeFields(value.fields, depth + 1, maxNestingDepth);
  }

  return config as FormedibleObjectConfig<FormedibleFormValues>;
}

function sanitizeArrayConfig(value: unknown, depth: number, maxNestingDepth: number): Record<string, unknown> | undefined {
  const config = sanitizePlainConfig(value, depth, maxNestingDepth);

  if (!config) {
    return undefined;
  }

  if (config.objectConfig !== undefined) {
    config.objectConfig = sanitizeObjectConfig(config.objectConfig, depth + 1, maxNestingDepth);
  }

  return config;
}

function sanitizeField(field: unknown, index: number, depth: number, maxNestingDepth: number): FormedibleFieldConfig<FormedibleFormValues> {
  assertNestingDepth(depth, maxNestingDepth);

  if (!isRecord(field)) {
    throw createParserError(`Field at index ${index} must be an object`, 'INVALID_FIELD');
  }

  if (typeof field.name !== 'string' || typeof field.type !== 'string') {
    throw createParserError(`Field at index ${index} must have string name and type properties`, 'MISSING_REQUIRED_FIELD');
  }

  if (field.name.trim().length === 0) {
    throw createParserError(`Field at index ${index} must have a non-empty name`, 'INVALID_FIELD_NAME');
  }

  if (field.name === '__proto__') {
    throw createParserError(`Field at index ${index} cannot use the reserved name '__proto__'`, 'INVALID_FIELD_NAME');
  }

  for (const key of Object.keys(field)) {
    if (!allowedFieldKeys.has(key)) {
      throw createParserError(`Field at index ${index} has unsupported key '${key}'`, 'UNSUPPORTED_FIELD_KEY');
    }
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
    output.defaultValue = sanitizeDefaultValue(field.defaultValue, depth + 1, maxNestingDepth);
  }

  copyString(field, output, 'mask');

  const options = sanitizeOptions(field.options);
  if (options !== undefined) {
    output.options = options;
  }

  const optionSets = sanitizeOptionSets(field.optionSets);
  if (optionSets !== undefined) {
    output.optionSets = optionSets;
  }

  const datalist = sanitizeOptions(field.datalist);
  if (datalist !== undefined) {
    output.datalist = datalist;
  }

  const help = sanitizeHelpConfig(field.help, depth + 1, maxNestingDepth);
  if (help !== undefined) {
    output.help = help;
  }

  if (Array.isArray(field.nestedFields)) {
    output.nestedFields = sanitizeFields(field.nestedFields, depth + 1, maxNestingDepth);
  }

  const objectConfig = sanitizeObjectConfig(field.objectConfig, depth + 1, maxNestingDepth);
  if (objectConfig !== undefined) {
    output.objectConfig = objectConfig;
  }

  const arrayConfig = sanitizeArrayConfig(field.arrayConfig, depth + 1, maxNestingDepth);
  if (arrayConfig !== undefined) {
    output.arrayConfig = arrayConfig;
  }

  for (const key of [
    'textareaConfig',
    'passwordConfig',
    'numberConfig',
    'dateConfig',
    'sliderConfig',
    'ratingConfig',
    'multiSelectConfig',
    'comboboxConfig',
    'autocompleteConfig',
    'maskedInputConfig',
    'multiComboboxConfig',
    'colorConfig',
    'phoneConfig',
    'durationConfig',
    'locationConfig',
    'fileConfig',
  ]) {
    const config = sanitizePlainConfig(field[key], depth + 1, maxNestingDepth);

    if (config !== undefined) {
      output[key] = config;
    }
  }

  return output as FormedibleFieldConfig<FormedibleFormValues>;
}

function sanitizeFields(fields: readonly unknown[], depth: number, maxNestingDepth: number): readonly FormedibleFieldConfig<FormedibleFormValues>[] {
  return fields.map((field, index) => sanitizeField(field, index, depth, maxNestingDepth));
}

function normalizeAiGeneratedField(field: unknown, pageNumber: number | undefined): unknown {
  if (!isRecord(field)) {
    return field;
  }

  const normalized: Record<string, unknown> = { ...field };

  if (typeof normalized.type === 'string') {
    normalized.type = fieldTypeAliasMap.get(normalized.type) ?? normalized.type;
  }

  if (typeof normalized.name !== 'string' && typeof normalized.id === 'string') {
    normalized.name = normalized.id;
  }

  delete normalized.id;

  if (typeof normalized.description !== 'string' && typeof normalized.helperText === 'string') {
    normalized.description = normalized.helperText;
  }

  delete normalized.helperText;

  if (normalized.type === 'rating') {
    const ratingConfig = isRecord(normalized.ratingConfig) ? { ...normalized.ratingConfig } : {};

    if (typeof normalized.maxRating === 'number' && typeof ratingConfig.max !== 'number') {
      ratingConfig.max = normalized.maxRating;
    }

    if (typeof normalized.icons === 'string' && typeof ratingConfig.icon !== 'string') {
      ratingConfig.icon = normalized.icons === 'star' || normalized.icons === 'heart' || normalized.icons === 'thumbs' ? normalized.icons : undefined;
    }

    normalized.ratingConfig = ratingConfig;
  }

  delete normalized.maxRating;
  delete normalized.icons;
  delete normalized.visibleIf;

  if (pageNumber !== undefined && typeof normalized.page !== 'number') {
    normalized.page = pageNumber;
  }

  return normalized;
}

function normalizeAiGeneratedPage(page: unknown, index: number): { readonly pageConfig: Record<string, unknown>; readonly fields: readonly unknown[] } | undefined {
  if (!isRecord(page)) {
    return undefined;
  }

  const pageNumber = typeof page.page === 'number' ? page.page : index + 1;
  const pageConfig: Record<string, unknown> = {
    page: pageNumber,
    title: typeof page.title === 'string' ? page.title : `Page ${pageNumber}`,
  };

  copyString(page, pageConfig, 'description');

  return {
    pageConfig,
    fields: Array.isArray(page.fields) ? page.fields.map((field) => normalizeAiGeneratedField(field, pageNumber)) : [],
  };
}

function normalizeAiGeneratedConfig(parsed: Record<string, unknown>): Record<string, unknown> {
  const source = isRecord(parsed.form) ? parsed.form : parsed;
  const normalized: Record<string, unknown> = { ...source };

  if (!Array.isArray(normalized.fields) && Array.isArray(normalized.pages)) {
    const pages = normalized.pages.flatMap((page, index) => {
      const normalizedPage = normalizeAiGeneratedPage(page, index);
      return normalizedPage ? [normalizedPage] : [];
    });

    normalized.fields = pages.flatMap((page) => page.fields);
    normalized.pages = pages.map((page) => page.pageConfig);
  } else if (Array.isArray(normalized.fields)) {
    normalized.fields = normalized.fields.map((field) => normalizeAiGeneratedField(field, undefined));
  }

  if (isRecord(normalized.settings) && typeof normalized.submitLabel !== 'string' && typeof normalized.settings.submitButtonText === 'string') {
    normalized.submitLabel = normalized.settings.submitButtonText;
  }

  delete normalized.settings;

  return normalized;
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
      // Page numbers are 1-based, matching normalizeAiGeneratedPage, so fields
      // declaring page: 1 land on the first auto-numbered page.
      page: typeof page.page === 'number' ? page.page : index + 1,
      title: typeof page.title === 'string' ? page.title : `Page ${index + 1}`,
    };

    copyString(page, output, 'description');

    return [output as FormediblePageConfig<FormedibleFormValues>];
  });
}

function validateAndSanitize(parsed: Record<string, unknown>, options: ParserOptions | EnhancedParserOptions | undefined, maxNestingDepth: number): ParsedFormConfig {
  const normalizedParsed = normalizeAiGeneratedConfig(parsed);
  const strictValidation = options?.strictValidation ?? true;
  const configuredTopLevelKeys = options?.allowedKeys === undefined ? undefined : new Set(options.allowedKeys);
  const configuredFieldTypes = options?.allowedFieldTypes === undefined ? undefined : new Set(options.allowedFieldTypes);

  if (!Array.isArray(normalizedParsed.fields)) {
    throw createParserError('Fields must be an array', 'INVALID_FIELDS');
  }

  const output: Record<string, unknown> = {
    fields: sanitizeFields(normalizedParsed.fields, 0, maxNestingDepth).map((field) => {
      const fieldType = field.type;
      if (configuredFieldTypes !== undefined && typeof fieldType === 'string' && !configuredFieldTypes.has(fieldType)) {
        throw createParserError(`Field type '${field.type}' is not allowed.`, 'DISALLOWED_FIELD_TYPE');
      }

      return filterFieldByAllowedKeys(field, options?.allowedFieldKeys);
    }),
    formOptions: isRecord(normalizedParsed.formOptions) ? sanitizePlainConfig(normalizedParsed.formOptions, 0, maxNestingDepth) : { defaultValues: {} },
  };

  if (isRecord(output.formOptions) && options?.allowedFormOptionsKeys !== undefined) {
    output.formOptions = filterRecordKeys(output.formOptions, options.allowedFormOptionsKeys);
  }

  if (isRecord(output.formOptions) && !isRecord(output.formOptions.defaultValues)) {
    output.formOptions = { ...output.formOptions, defaultValues: {} };
  }

  for (const [key, value] of Object.entries(normalizedParsed)) {
    if (!allowedTopLevelKeys.has(key)) {
      if (strictValidation) {
        throw createParserError(`Unsupported top-level key '${key}'`, 'UNSUPPORTED_TOP_LEVEL_KEY');
      }
      continue;
    }

    if (configuredTopLevelKeys !== undefined && key !== 'fields' && key !== 'formOptions' && !configuredTopLevelKeys.has(key)) {
      continue;
    }

    if (key === 'fields' || key === 'formOptions') {
      continue;
    }

    if (key === 'schema') {
      const schema = sanitizePlainConfig(value, 0, maxNestingDepth);
      if (schema !== undefined) {
        output.schema = schema;
      }
      continue;
    }

    if (
      ['title', 'description', 'submitLabel', 'nextLabel', 'previousLabel', 'collapseLabel', 'expandLabel', 'formClassName', 'fieldClassName', 'labelClassName', 'buttonClassName', 'submitButtonClassName'].includes(
        key,
      )
    ) {
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
        const allowedPageKeys = options?.allowedPageKeys;
        output.pages = allowedPageKeys === undefined ? pages : pages.map((page) => filterRecordKeys(page, allowedPageKeys) as FormediblePageConfig<FormedibleFormValues>);
      }
      continue;
    }

    if (key === 'progress' && isRecord(value)) {
      output.progress = options?.allowedProgressKeys === undefined ? sanitizePlainConfig(value, 0, maxNestingDepth) : filterRecordKeys(value, options.allowedProgressKeys);
      continue;
    }

    if (['tabs', 'crossFieldValidation', 'conditionalSections'].includes(key) && Array.isArray(value)) {
      output[key] = value.filter((entry) => typeof entry !== 'function');
      continue;
    }

    const config = sanitizePlainConfig(value, 0, maxNestingDepth);
    if (config !== undefined) {
      output[key] = config;
    }
  }

  // EnhancedParserOptions.baseSchema + mergeStrategy are consumed here so the
  // advertised merge behavior actually applies to parsed configs. The static
  // mergeSchemas method delegates to the same implementation.
  const enhancedOptions: EnhancedParserOptions | undefined = options;
  const baseSchema = enhancedOptions?.baseSchema;

  if (baseSchema !== undefined) {
    return mergeParsedConfigWithBaseSchema(output as ParsedFormConfig, baseSchema, enhancedOptions?.mergeStrategy ?? 'extend') as ParsedFormConfig;
  }

  return output as ParsedFormConfig;
}

function filterRecordKeys(value: Readonly<Record<string, unknown>>, allowedKeys: readonly string[]): Record<string, unknown> {
  const allowedKeySet = new Set(allowedKeys);
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowedKeySet.has(key)));
}

function filterFieldByAllowedKeys(field: FormedibleFieldConfig<FormedibleFormValues>, allowedKeys: readonly string[] | undefined): FormedibleFieldConfig<FormedibleFormValues> {
  if (allowedKeys === undefined) {
    return field;
  }

  const fieldKeys = new Set(['name', 'type', ...allowedKeys]);
  return Object.fromEntries(Object.entries(field).filter(([key]) => fieldKeys.has(key))) as FormedibleFieldConfig<FormedibleFormValues>;
}

export function extractFormedibleCode(content: string): FormedibleExtractionResult {
  const formedibleBlock = content.match(/```formedible\s*\n([\s\S]*?)```/);

  if (formedibleBlock?.[1]) {
    return { code: formedibleBlock[1].trim(), source: 'fenced', errors: [] };
  }

  if (/```(?:json|ts|tsx|typescript|javascript|js)\b/i.test(content)) {
    return {
      source: 'none',
      errors: [
        {
          type: 'validation',
          message: 'Generated forms must use a lowercase ```formedible fenced block.',
          suggestion: 'Wrap the Formedible configuration in ```formedible, not json/ts/tsx/javascript fences.',
        },
      ],
    };
  }

  return { source: 'none', errors: [] };
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

// Shared by FormedibleParser.mergeSchemas and validateAndSanitize (when
// EnhancedParserOptions.baseSchema is provided) so parsed configs and the
// public static API merge base schemas identically.
function mergeParsedConfigWithBaseSchema(
  parsedConfig: UseFormedibleOptions<FormedibleFormValues>,
  baseSchema: unknown,
  strategy: 'extend' | 'override' | 'intersect',
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
      fields: (parsedConfig.fields ?? []).filter((field) => Object.prototype.hasOwnProperty.call(properties, field.name)),
      schema: baseSchema,
    };
  }

  const existingNames = new Set((parsedConfig.fields ?? []).map((field) => field.name));
  const addedFields = Object.entries(properties).flatMap(([name, schema]) => {
    if (existingNames.has(name)) {
      return [];
    }

    const field = createFieldFromSchema(name, schema);
    return field === undefined ? [] : [field];
  });

  return {
    ...parsedConfig,
    fields: [...(parsedConfig.fields ?? []), ...addedFields],
    schema: baseSchema,
  };
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

    const maxNestingDepth = options?.maxNestingDepth ?? defaultParserConfig.maxNestingDepth;

    try {
      assertNoExecutableSyntax(code);
      const sanitizedCode = sanitizeCode(code);
      const parsed = parseObjectLiteral(sanitizedCode, maxNestingDepth);

      return validateAndSanitize(parsed, options, maxNestingDepth);
    } catch (error) {
      // Residual RangeErrors (for example from JSON.parse on pathologically
      // nested input) surface as the coded nesting error, never a raw
      // RangeError.
      if (error instanceof RangeError) {
        throw createMaxNestingDepthError(maxNestingDepth);
      }

      throw error;
    }
  }

  static parseStructured(output: FormedibleStructuredOutput, options?: ParserOptions | EnhancedParserOptions): ParsedFormConfig {
    const maxNestingDepth = options?.maxNestingDepth ?? defaultParserConfig.maxNestingDepth;

    try {
      const candidate = pickStructuredCandidate(output);
      if (typeof candidate === 'string') {
        assertNoExecutableSyntax(candidate);
      }

      const parsed = typeof candidate === 'string' ? parseObjectLiteral(sanitizeCode(candidate), maxNestingDepth) : parseStructuredObject(candidate, maxNestingDepth);

      return validateAndSanitize(parsed, options, maxNestingDepth);
    } catch (error) {
      if (error instanceof RangeError) {
        throw createMaxNestingDepthError(maxNestingDepth);
      }

      throw error;
    }
  }

  static parseAiOutput(output: string | FormedibleStructuredOutput, options?: ParserOptions | EnhancedParserOptions): FormedibleParseResult {
    try {
      if (typeof output !== 'string') {
        return { success: true, config: this.parseStructured(output, options), source: 'structured', errors: [] };
      }

      const extraction = extractFormedibleCode(output);
      if (extraction.code !== undefined) {
        return { success: true, config: this.parse(extraction.code, options), code: extraction.code, source: 'fenced', errors: extraction.errors };
      }

      if (extraction.errors.length > 0) {
        return { success: false, source: 'none', errors: extraction.errors };
      }

      if (!output.trim().startsWith('{')) {
        return { success: false, source: 'none', errors: [] };
      }

      return { success: true, config: this.parse(output, options), code: output, source: 'direct', errors: [] };
    } catch (error) {
      return {
        success: false,
        source: typeof output === 'string' ? 'direct' : 'structured',
        errors: [parserErrorToEnhanced(error, typeof output === 'string' ? output : undefined)],
      };
    }
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

      validateAndSanitize(config, { strictValidation: true }, defaultParserConfig.maxNestingDepth);
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
      for (const field of config.fields ?? []) {
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
    return mergeParsedConfigWithBaseSchema(parsedConfig, baseSchema, strategy);
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

export type { FormedibleExtractionResult, FormedibleFieldConfig, FormedibleObjectConfig, FormediblePageConfig, FormedibleParseResult, FormedibleStructuredOutput, ParserError, ParserOptions, UseFormedibleOptions };
