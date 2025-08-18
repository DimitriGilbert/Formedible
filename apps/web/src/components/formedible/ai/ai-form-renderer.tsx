"use client";
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { z } from "zod";
import { useFormedible } from "@/hooks/use-formedible";
import type { FieldConfig, UseFormedibleOptions } from "@/lib/formedible/types";

export interface AiFormParseResult<TFormData = Record<string, unknown>> {
  schema: z.ZodSchema<TFormData>;
  formOptions: UseFormedibleOptions<TFormData>;
  success: boolean;
  error?: string;
}

export interface AiParserConfig {
  allowedFieldTypes?: string[];
  allowedKeys?: string[];
  allowedFieldKeys?: string[];
  allowedPageKeys?: string[];
  allowedProgressKeys?: string[];
  allowedFormOptionsKeys?: string[];
}

export interface AiFormRendererProps {
  code: string;
  isStreaming?: boolean;
  onParseComplete?: (result: AiFormParseResult) => void;
  onSubmit?: (formData: Record<string, unknown>) => void | Promise<void>;
  className?: string;
  parserConfig?: AiParserConfig;
  debug?: boolean;
}

const DEFAULT_FIELD_TYPES = [
  'text', 'email', 'password', 'url', 'tel', 'textarea', 'select', 
  'checkbox', 'switch', 'number', 'date', 'slider', 'file', 'rating',
  'phone', 'colorPicker', 'location', 'duration', 'multiSelect',
  'autocomplete', 'masked', 'object', 'array', 'radio'
];

const DEFAULT_KEYS = [
  'schema', 'fields', 'pages', 'progress', 'submitLabel', 'nextLabel', 
  'previousLabel', 'formClassName', 'fieldClassName', 'formOptions'
];

const DEFAULT_FIELD_KEYS = [
  'name', 'type', 'label', 'placeholder', 'description', 'options', 
  'min', 'max', 'step', 'accept', 'multiple', 'page', 'conditional',
  'section', 'ratingConfig', 'phoneConfig', 'colorConfig', 'locationConfig',
  'durationConfig', 'multiSelectConfig', 'sliderConfig', 'numberConfig',
  'dateConfig', 'fileConfig', 'textareaConfig', 'passwordConfig', 'emailConfig',
  'autocompleteConfig', 'maskedInputConfig', 'objectConfig', 'arrayConfig',
  'validation', 'group', 'tab', 'help', 'inlineValidation', 'datalist'
];

const DEFAULT_PAGE_KEYS = ['page', 'title', 'description'];

const DEFAULT_PROGRESS_KEYS = ['showSteps', 'showPercentage', 'className'];

const DEFAULT_FORM_OPTIONS_KEYS = [
  'defaultValues', 'asyncDebounceMs', 'canSubmitWhenInvalid', 'onSubmit', 'onSubmitInvalid'
];

class AiFormedibleParser {
  private config: Required<AiParserConfig>;

  constructor(config?: AiParserConfig) {
    this.config = {
      allowedFieldTypes: config?.allowedFieldTypes ?? DEFAULT_FIELD_TYPES,
      allowedKeys: config?.allowedKeys ?? DEFAULT_KEYS,
      allowedFieldKeys: config?.allowedFieldKeys ?? DEFAULT_FIELD_KEYS,
      allowedPageKeys: config?.allowedPageKeys ?? DEFAULT_PAGE_KEYS,
      allowedProgressKeys: config?.allowedProgressKeys ?? DEFAULT_PROGRESS_KEYS,
      allowedFormOptionsKeys: config?.allowedFormOptionsKeys ?? DEFAULT_FORM_OPTIONS_KEYS,
    };
  }

  parse(code: string): AiFormParseResult {
    try {
      const sanitizedCode = this.sanitizeCode(code);
      const parsed = this.parseObjectLiteral(sanitizedCode);
      const sanitized = this.validateAndSanitize(parsed);
      const { schema, formOptions } = this.createFormedibleConfig(sanitized);

      return {
        schema,
        formOptions,
        success: true,
      };
    } catch (error) {
      return {
        schema: z.object({}),
        formOptions: { fields: [], formOptions: { defaultValues: {} } },
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private sanitizeCode(code: string): string {
    let sanitized = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    sanitized = sanitized.replace(/\b(eval|Function|setTimeout|setInterval|require|import)\s*\(/g, '');
    sanitized = sanitized.replace(/=>\s*{[^}]*}/g, '""');
    sanitized = sanitized.replace(/function\s*\([^)]*\)\s*{[^}]*}/g, '""');
    return sanitized;
  }

  private parseObjectLiteral(code: string): unknown {
    try {
      return JSON.parse(code);
    } catch {
      try {
        let processedCode = code.trim();
        processedCode = this.replaceZodExpressions(processedCode);
        processedCode = processedCode.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        processedCode = processedCode.replace(/,(\s*[}\]])/g, '$1');
        processedCode = processedCode.replace(/'/g, '"');
        return JSON.parse(processedCode);
      } catch (conversionError) {
        throw new Error(`Invalid syntax: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
      }
    }
  }

  private replaceZodExpressions(code: string): string {
    let result = code;
    let changed = true;

    while (changed) {
      changed = false;
      const zodMatch = result.match(/z\.[a-zA-Z]+\(/);
      if (zodMatch) {
        const startIndex = zodMatch.index!;
        const openParenIndex = startIndex + zodMatch[0].length - 1;

        let depth = 1;
        let endIndex = openParenIndex + 1;

        while (endIndex < result.length && depth > 0) {
          if (result[endIndex] === '(') {
            depth++;
          } else if (result[endIndex] === ')') {
            depth--;
          }
          endIndex++;
        }

        if (depth === 0) {
          let chainEnd = endIndex;
          while (chainEnd < result.length) {
            const chainMatch = result.slice(chainEnd).match(/^\.[a-zA-Z]+\(/);
            if (chainMatch) {
              let chainDepth = 1;
              let chainParenIndex = chainEnd + chainMatch[0].length - 1;
              let chainEndIndex = chainParenIndex + 1;

              while (chainEndIndex < result.length && chainDepth > 0) {
                if (result[chainEndIndex] === '(') {
                  chainDepth++;
                } else if (result[chainEndIndex] === ')') {
                  chainDepth--;
                }
                chainEndIndex++;
              }

              if (chainDepth === 0) {
                chainEnd = chainEndIndex;
              } else {
                break;
              }
            } else {
              break;
            }
          }

          result = result.slice(0, startIndex) + '"__ZOD_SCHEMA__"' + result.slice(chainEnd);
          changed = true;
        } else {
          result = result.replace(/z\.[a-zA-Z]+/, '"__ZOD_SCHEMA__"');
          changed = true;
        }
      }
    }

    return result;
  }

  private validateAndSanitize(obj: unknown): Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('Definition must be an object');
    }

    const sanitized: Record<string, unknown> = {};
    const input = obj as Record<string, unknown>;

    for (const [key, value] of Object.entries(input)) {
      if (!this.config.allowedKeys.includes(key)) {
        continue;
      }

      switch (key) {
        case 'schema':
          break;
        case 'fields':
          sanitized[key] = this.validateFields(value);
          break;
        case 'pages':
          sanitized[key] = this.validatePages(value);
          break;
        case 'progress':
          sanitized[key] = this.validateProgress(value);
          break;
        case 'formOptions':
          sanitized[key] = this.validateFormOptions(value);
          break;
        case 'submitLabel':
        case 'nextLabel':
        case 'previousLabel':
        case 'formClassName':
        case 'fieldClassName':
          if (typeof value === 'string') {
            sanitized[key] = value;
          }
          break;
      }
    }

    return sanitized;
  }

  private validateFields(fields: unknown): FieldConfig[] {
    if (!Array.isArray(fields)) {
      throw new Error('Fields must be an array');
    }

    return fields.map((field, index) => {
      if (typeof field !== 'object' || field === null) {
        throw new Error(`Field at index ${index} must be an object`);
      }

      const sanitizedField: Record<string, unknown> = {};
      const fieldObj = field as Record<string, unknown>;

      for (const [key, value] of Object.entries(fieldObj)) {
        if (!this.config.allowedFieldKeys.includes(key)) {
          continue;
        }

        switch (key) {
          case 'name':
            if (typeof value === 'string' && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)) {
              sanitizedField[key] = value;
            }
            break;
          case 'type':
            if (typeof value === 'string' && this.config.allowedFieldTypes.includes(value)) {
              sanitizedField[key] = value;
            }
            break;
          case 'label':
          case 'placeholder':
          case 'description':
          case 'accept':
            if (typeof value === 'string') {
              sanitizedField[key] = value;
            }
            break;
          case 'options':
            if (Array.isArray(value)) {
              sanitizedField[key] = value.filter(opt => 
                typeof opt === 'string' || 
                (typeof opt === 'object' && opt !== null && 
                 typeof (opt as { value?: unknown }).value === 'string' && 
                 typeof (opt as { label?: unknown }).label === 'string')
              );
            }
            break;
          case 'min':
          case 'max':
          case 'step':
          case 'page':
            if (typeof value === 'number' && !isNaN(value)) {
              sanitizedField[key] = value;
            }
            break;
          case 'multiple':
          case 'conditional':
            if (typeof value === 'boolean') {
              sanitizedField[key] = value;
            }
            break;
          default:
            if (typeof value === 'object' && value !== null) {
              sanitizedField[key] = value;
            }
            break;
        }
      }

      if (!sanitizedField.name || !sanitizedField.type) {
        throw new Error(`Field at index ${index} must have 'name' and 'type' properties`);
      }

      return sanitizedField as unknown as FieldConfig;
    });
  }

  private validatePages(pages: unknown): Array<{ page: number; title?: string; description?: string }> {
    if (!Array.isArray(pages)) {
      return [];
    }

    return pages.map(page => {
      if (typeof page !== 'object' || page === null) {
        return null;
      }

      const sanitizedPage: Record<string, unknown> = {};
      const pageObj = page as Record<string, unknown>;

      for (const [key, value] of Object.entries(pageObj)) {
        if (!this.config.allowedPageKeys.includes(key)) {
          continue;
        }

        switch (key) {
          case 'page':
            if (typeof value === 'number' && !isNaN(value)) {
              sanitizedPage[key] = value;
            }
            break;
          case 'title':
          case 'description':
            if (typeof value === 'string') {
              sanitizedPage[key] = value;
            }
            break;
        }
      }

      return sanitizedPage.page ? sanitizedPage : null;
    }).filter(Boolean) as Array<{ page: number; title?: string; description?: string }>;
  }

  private validateProgress(progress: unknown): Record<string, unknown> {
    if (typeof progress !== 'object' || progress === null) {
      return {};
    }

    const sanitizedProgress: Record<string, unknown> = {};
    const progressObj = progress as Record<string, unknown>;

    for (const [key, value] of Object.entries(progressObj)) {
      if (!this.config.allowedProgressKeys.includes(key)) {
        continue;
      }

      switch (key) {
        case 'showSteps':
        case 'showPercentage':
          if (typeof value === 'boolean') {
            sanitizedProgress[key] = value;
          }
          break;
        case 'className':
          if (typeof value === 'string') {
            sanitizedProgress[key] = value;
          }
          break;
      }
    }

    return sanitizedProgress;
  }

  private validateFormOptions(formOptions: unknown): Record<string, unknown> {
    if (typeof formOptions !== 'object' || formOptions === null) {
      return {};
    }

    const sanitizedOptions: Record<string, unknown> = {};
    const optionsObj = formOptions as Record<string, unknown>;

    for (const [key, value] of Object.entries(optionsObj)) {
      if (!this.config.allowedFormOptionsKeys.includes(key)) {
        continue;
      }

      switch (key) {
        case 'defaultValues':
          if (typeof value === 'object' && value !== null) {
            sanitizedOptions[key] = value;
          }
          break;
        case 'asyncDebounceMs':
          if (typeof value === 'number' && !isNaN(value)) {
            sanitizedOptions[key] = value;
          }
          break;
        case 'canSubmitWhenInvalid':
          if (typeof value === 'boolean') {
            sanitizedOptions[key] = value;
          }
          break;
      }
    }

    return sanitizedOptions;
  }

  private createFormedibleConfig(sanitized: Record<string, unknown>): { 
    schema: z.ZodSchema<Record<string, unknown>>; 
    formOptions: UseFormedibleOptions<Record<string, unknown>>; 
  } {
    const fields = sanitized.fields as FieldConfig[] || [];
    const schema = this.createSchemaFromFields(fields);
    const defaultValues = this.createDefaultValues(fields);

    const formOptions: UseFormedibleOptions<Record<string, unknown>> = {
      fields,
      schema,
      pages: sanitized.pages as UseFormedibleOptions<Record<string, unknown>>['pages'],
      progress: sanitized.progress as UseFormedibleOptions<Record<string, unknown>>['progress'],
      submitLabel: sanitized.submitLabel as string,
      nextLabel: sanitized.nextLabel as string,
      previousLabel: sanitized.previousLabel as string,
      formClassName: sanitized.formClassName as string,
      fieldClassName: sanitized.fieldClassName as string,
      formOptions: {
        defaultValues,
        ...(sanitized.formOptions as Record<string, unknown>),
      },
    };

    return { schema, formOptions };
  }

  private createSchemaFromFields(fields: FieldConfig[]): z.ZodSchema<Record<string, unknown>> {
    const schemaObj: Record<string, z.ZodTypeAny> = {};

    fields.forEach(field => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'url':
        case 'tel':
        case 'textarea':
        case 'phone':
        case 'colorPicker':
        case 'autocomplete':
        case 'masked':
        case 'radio':
        case 'select':
          schemaObj[field.name] = z.string();
          break;
        case 'number':
        case 'slider':
        case 'rating':
          schemaObj[field.name] = z.number();
          break;
        case 'checkbox':
        case 'switch':
          schemaObj[field.name] = z.boolean();
          break;
        case 'date':
          schemaObj[field.name] = z.date();
          break;
        case 'file':
          schemaObj[field.name] = z.any();
          break;
        case 'location':
          schemaObj[field.name] = z.object({
            lat: z.number(),
            lng: z.number(),
            address: z.string().optional(),
            city: z.string().optional(),
            country: z.string().optional(),
          }).optional();
          break;
        case 'duration':
          schemaObj[field.name] = z.object({
            hours: z.number().min(0),
            minutes: z.number().min(0),
          }).optional();
          break;
        case 'multiSelect':
          schemaObj[field.name] = z.array(z.string());
          break;
        case 'object':
          schemaObj[field.name] = z.any();
          break;
        case 'array':
          schemaObj[field.name] = z.array(z.any());
          break;
        default:
          schemaObj[field.name] = z.string();
      }
    });

    return z.object(schemaObj);
  }

  private createDefaultValues(fields: FieldConfig[]): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};

    fields.forEach(field => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'url':
        case 'tel':
        case 'textarea':
        case 'phone':
        case 'autocomplete':
        case 'masked':
          defaults[field.name] = '';
          break;
        case 'number':
        case 'slider':
          defaults[field.name] = field.min || 0;
          break;
        case 'checkbox':
        case 'switch':
          defaults[field.name] = false;
          break;
        case 'date':
          defaults[field.name] = new Date().toISOString().split('T')[0];
          break;
        case 'select':
        case 'radio':
          if (field.options && Array.isArray(field.options) && field.options.length > 0) {
            const firstOption = field.options[0];
            defaults[field.name] = typeof firstOption === 'string' ? firstOption : (firstOption as { value: string }).value;
          } else {
            defaults[field.name] = '';
          }
          break;
        case 'file':
          defaults[field.name] = null;
          break;
        case 'rating':
          defaults[field.name] = 1;
          break;
        case 'colorPicker':
          defaults[field.name] = '#000000';
          break;
        case 'location':
          defaults[field.name] = undefined;
          break;
        case 'duration':
          defaults[field.name] = { hours: 0, minutes: 0 };
          break;
        case 'multiSelect':
          defaults[field.name] = [];
          break;
        case 'object':
          defaults[field.name] = {};
          break;
        case 'array':
          defaults[field.name] = [];
          break;
        default:
          defaults[field.name] = '';
      }
    });

    return defaults;
  }
}

export function parseAiToFormedible(
  code: string, 
  config?: AiParserConfig
): AiFormParseResult {
  const parser = new AiFormedibleParser(config);
  return parser.parse(code);
}

const AiFormRendererComponent: React.FC<AiFormRendererProps> = ({
  code,
  isStreaming = false,
  onParseComplete,
  onSubmit,
  className,
  parserConfig,
  debug = false,
}) => {
  const [parseResult, setParseResult] = useState<AiFormParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseFormDefinition = useCallback(async () => {
    if (!code.trim() || isStreaming) return;

    setIsLoading(true);

    try {
      const result = parseAiToFormedible(code, parserConfig);
      setParseResult(result);
      onParseComplete?.(result);

      if (debug && result.error) {
        console.error('AI Form Parser Error:', result.error);
      }
    } catch (err) {
      const errorResult: AiFormParseResult = {
        schema: z.object({}),
        formOptions: { fields: [], formOptions: { defaultValues: {} } },
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
      setParseResult(errorResult);
      onParseComplete?.(errorResult);

      if (debug) {
        console.error('AI Form Renderer Error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, isStreaming, onParseComplete, parserConfig, debug]);

  useEffect(() => {
    if (!isStreaming && code.trim()) {
      parseFormDefinition();
    }
  }, [code, isStreaming, parseFormDefinition]);

  const formConfig = useMemo(() => {
    if (!parseResult?.success || !parseResult.formOptions.fields?.length) {
      return null;
    }

    return {
      ...parseResult.formOptions,
      formOptions: {
        ...parseResult.formOptions.formOptions,
        onSubmit: async ({ value }: { value: Record<string, unknown> }) => {
          await onSubmit?.(value);
        },
      },
    };
  }, [parseResult, onSubmit]);

  const formedibleResult = useFormedible(formConfig || {
    fields: [],
    formOptions: { defaultValues: {} }
  });

  const renderedForm = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-sm text-muted-foreground">Parsing form...</div>
        </div>
      );
    }

    if (parseResult && !parseResult.success) {
      return (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-md">
          <div className="text-sm text-destructive">
            <div className="font-medium">Parse Error</div>
            <div className="text-xs mt-1 opacity-80">{parseResult.error}</div>
          </div>
        </div>
      );
    }

    if (!formConfig || !parseResult?.success) {
      return null;
    }

    return <formedibleResult.Form />;
  }, [isLoading, parseResult, formConfig, formedibleResult.Form]);

  return (
    <div className={className}>
      {renderedForm}
    </div>
  );
};

export const AiFormRenderer = memo(AiFormRendererComponent);