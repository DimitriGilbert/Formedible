import { FormedibleParser } from '@/lib/formedible/formedible-parser';
import type { AiFormParseResult, AiParserConfig } from '@/lib/formedible/ai-types';
import type { FormedibleFieldConfig, FormedibleFormValues, FormediblePageConfig, FormedibleProgressConfig, UseFormedibleOptions } from '@/lib/formedible/types';

const requiredFieldKeys = new Set(['name', 'type']);

function filterRecordKeys<TRecord extends Readonly<Record<string, unknown>>>(value: TRecord, allowedKeys: readonly string[] | undefined): Record<string, unknown> {
  if (!allowedKeys) {
    return { ...value };
  }

  const allowedKeySet = new Set(allowedKeys);
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowedKeySet.has(key)));
}

function filterField(field: FormedibleFieldConfig<FormedibleFormValues>, parserConfig?: AiParserConfig): FormedibleFieldConfig<FormedibleFormValues> {
  if (parserConfig?.allowedFieldTypes && (field.type === undefined || !parserConfig.allowedFieldTypes.includes(field.type))) {
    throw new Error(`Field type '${field.type}' is not allowed.`);
  }

  if (!parserConfig?.allowedFieldKeys) {
    return field;
  }

  const allowedFieldKeys = new Set(parserConfig.allowedFieldKeys);
  return Object.fromEntries(Object.entries(field).filter(([key]) => requiredFieldKeys.has(key) || allowedFieldKeys.has(key))) as FormedibleFieldConfig<FormedibleFormValues>;
}

function filterPages(pages: readonly FormediblePageConfig<FormedibleFormValues>[] | undefined, parserConfig?: AiParserConfig): readonly FormediblePageConfig<FormedibleFormValues>[] | undefined {
  if (!pages || !parserConfig?.allowedPageKeys) {
    return pages;
  }

  return pages.map((page) => filterRecordKeys(page, parserConfig.allowedPageKeys) as FormediblePageConfig<FormedibleFormValues>);
}

function filterProgress(progress: FormedibleProgressConfig | undefined, parserConfig?: AiParserConfig): FormedibleProgressConfig | undefined {
  if (!progress || !parserConfig?.allowedProgressKeys) {
    return progress;
  }

  return filterRecordKeys(progress, parserConfig.allowedProgressKeys) as FormedibleProgressConfig;
}

function applyParserAllowlists(options: UseFormedibleOptions<FormedibleFormValues>, parserConfig?: AiParserConfig): UseFormedibleOptions<FormedibleFormValues> {
  const formOptions = filterRecordKeys(options.formOptions, parserConfig?.allowedFormOptionsKeys) as UseFormedibleOptions<FormedibleFormValues>['formOptions'];
  const output: Record<string, unknown> = {
    ...options,
    fields: options.fields.map((field) => filterField(field, parserConfig)),
    formOptions,
  };

  if (options.pages !== undefined) {
    output.pages = filterPages(options.pages, parserConfig);
  }

  if (options.progress !== undefined) {
    output.progress = filterProgress(options.progress, parserConfig);
  }

  if (parserConfig?.allowedKeys) {
    const allowedTopLevelKeys = new Set(parserConfig.allowedKeys);
    for (const key of Object.keys(output)) {
      if (key !== 'fields' && key !== 'formOptions' && !allowedTopLevelKeys.has(key)) {
        delete output[key];
      }
    }
  }

  return output as UseFormedibleOptions<FormedibleFormValues>;
}

function defaultValueForField(field: FormedibleFieldConfig<FormedibleFormValues>): unknown {
  if (field.type === 'checkbox' || field.type === 'switch') {
    return false;
  }

  if (field.type === 'number' || field.type === 'slider' || field.type === 'rating' || field.type === 'duration') {
    return 0;
  }

  if (field.type === 'multiSelect' || field.type === 'array') {
    return [];
  }

  if (field.type === 'object' || field.type === 'location') {
    return {};
  }

  return '';
}

function inferDefaultValues(options: UseFormedibleOptions<FormedibleFormValues>): UseFormedibleOptions<FormedibleFormValues> {
  const existingDefaults = options.formOptions.defaultValues;
  const defaultValues: FormedibleFormValues = { ...existingDefaults };

  for (const field of options.fields) {
    if (!Object.prototype.hasOwnProperty.call(defaultValues, field.name)) {
      defaultValues[field.name] = defaultValueForField(field);
    }
  }

  return {
    ...options,
    formOptions: {
      ...options.formOptions,
      defaultValues,
    },
  };
}

export function parseAiToFormedible(code: string, parserConfig?: AiParserConfig): AiFormParseResult {
  try {
    const parsed = FormedibleParser.parse(code, { strictValidation: parserConfig?.strictValidation ?? true });
    const allowedFormOptions = applyParserAllowlists(parsed, parserConfig);
    const formOptions = parserConfig?.inferDefaultValues === false ? allowedFormOptions : inferDefaultValues(allowedFormOptions);

    return {
      schema: formOptions.schema,
      formOptions,
      success: true,
    };
  } catch (error) {
    return {
      schema: undefined,
      formOptions: { fields: [], formOptions: { defaultValues: {} } },
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function extractFormCode(content: string): string | undefined {
  const formedibleBlock = content.match(/```(?:formedible|json|ts|tsx|typescript)?\s*([\s\S]*?fields\s*:[\s\S]*?)```/i);

  if (formedibleBlock?.[1]) {
    return formedibleBlock[1].trim();
  }

  const objectStart = content.indexOf('{');
  const fieldsIndex = content.indexOf('fields');
  const objectEnd = content.lastIndexOf('}');

  if (objectStart !== -1 && fieldsIndex > objectStart && objectEnd > fieldsIndex) {
    return content.slice(objectStart, objectEnd + 1).trim();
  }

  return undefined;
}
