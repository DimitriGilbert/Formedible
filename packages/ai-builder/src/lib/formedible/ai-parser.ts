import { extractFormedibleCode, FormedibleParser } from '@/components/formedible/lib/formedible-parser';
import type { AiFormParseResult, AiParseError, AiParserConfig } from '@/lib/formedible/ai-types';
import type { EnhancedParserError } from '@/components/formedible/lib/parser-types';
import type { FormedibleFieldConfig, FormedibleFormValues, UseFormedibleOptions } from '@/components/formedible/lib/types';

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

function toAiParseError(error: EnhancedParserError): AiParseError {
  return {
    message: error.message,
    field: error.location?.field,
    line: error.location?.line,
    column: error.location?.column,
    details: error,
  };
}

function errorMessage(errors: readonly EnhancedParserError[]): string | undefined {
  return errors.map((error) => error.message).join('\n') || undefined;
}

export function parseAiToFormedible(code: string, parserConfig?: AiParserConfig): AiFormParseResult {
  const result = FormedibleParser.parseAiOutput(code, {
    strictValidation: parserConfig?.strictValidation ?? true,
    allowedFieldTypes: parserConfig?.allowedFieldTypes,
    allowedKeys: parserConfig?.allowedKeys,
    allowedFieldKeys: parserConfig?.allowedFieldKeys,
    allowedPageKeys: parserConfig?.allowedPageKeys,
    allowedProgressKeys: parserConfig?.allowedProgressKeys,
    allowedFormOptionsKeys: parserConfig?.allowedFormOptionsKeys,
  });

  if (!result.success || result.config === undefined) {
    return {
      schema: undefined,
      formOptions: { fields: [], formOptions: { defaultValues: {} } },
      success: false,
      error: errorMessage(result.errors),
      errors: result.errors.map(toAiParseError),
    };
  }

  const formOptions = parserConfig?.inferDefaultValues === false ? result.config : inferDefaultValues(result.config);

  return {
    schema: formOptions.schema,
    formOptions,
    success: true,
    errors: result.errors.map(toAiParseError),
  };
}

export function extractFormCode(content: string): string | undefined {
  const extraction = extractFormedibleCode(content);

  if (extraction.code !== undefined) {
    return extraction.code;
  }

  return undefined;
}
