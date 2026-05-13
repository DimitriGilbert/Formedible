import type {
  FormedibleFieldConfig,
  FormedibleFieldOption,
  FormedibleFormValues,
  FormedibleObjectConfig,
  FormediblePageConfig,
  FormedibleProgressConfig,
  UseFormedibleOptions,
} from '@/lib/formedible/types';

export type ParsedFieldConfig = FormedibleFieldConfig<FormedibleFormValues>;

export type ParsedFormConfig = UseFormedibleOptions<FormedibleFormValues> & {
  readonly title?: string;
  readonly description?: string;
};

export interface ParserOptions {
  readonly strictValidation?: boolean;
  readonly allowedKeys?: readonly string[];
  readonly allowedFieldTypes?: readonly string[];
  readonly allowedFieldKeys?: readonly string[];
  readonly allowedPageKeys?: readonly string[];
  readonly allowedProgressKeys?: readonly string[];
  readonly allowedFormOptionsKeys?: readonly string[];
}

export interface ParserError extends Error {
  readonly code?: string;
  readonly field?: string;
  readonly line?: number;
  readonly column?: number;
}

export interface EnhancedParserOptions extends ParserOptions {
  readonly baseSchema?: unknown;
  readonly mergeStrategy?: 'extend' | 'override' | 'intersect';
  readonly predefinedHandlers?: {
    readonly onSubmit?: (data: unknown) => void;
    readonly specificFields?: Readonly<Record<string, ParsedFieldConfig>>;
    readonly [key: string]: unknown;
  };
}

export interface EnhancedParserError {
  readonly type: 'syntax' | 'validation' | 'field_type' | 'schema';
  readonly message: string;
  readonly suggestion?: string;
  readonly location?: {
    readonly line?: number;
    readonly column?: number;
    readonly field?: string;
  };
  readonly examples?: readonly string[];
}

export interface SchemaInferenceOptions {
  readonly enabled?: boolean;
  readonly fieldTypeMapping?: Readonly<Record<string, unknown>>;
  readonly defaultValidation?: boolean;
  readonly inferFromValues?: boolean;
}

export interface SchemaInferenceResult {
  readonly config: ParsedFormConfig;
  readonly inferredSchema: unknown;
  readonly confidence: number;
}

export interface ValidationWithSuggestionsResult {
  readonly isValid: boolean;
  readonly errors: readonly EnhancedParserError[];
  readonly suggestions: readonly string[];
}

export interface FormedibleExtractionResult {
  readonly code?: string;
  readonly source: 'structured' | 'fenced' | 'none';
  readonly errors: readonly EnhancedParserError[];
}

export interface FormedibleParseResult {
  readonly success: boolean;
  readonly config?: ParsedFormConfig;
  readonly code?: string;
  readonly source: 'structured' | 'fenced' | 'direct' | 'none';
  readonly errors: readonly EnhancedParserError[];
}

export type FormedibleStructuredOutput =
  | ParsedFormConfig
  | {
      readonly formedible?: unknown;
      readonly formConfig?: unknown;
      readonly formOptions?: unknown;
      readonly config?: unknown;
      readonly output?: unknown;
    };

export type {
  FormedibleFieldConfig as FieldConfig,
  FormedibleFieldOption as FieldOption,
  FormedibleFieldOption as FieldOptions,
  FormedibleFormValues,
  FormedibleObjectConfig as ObjectConfig,
  FormediblePageConfig as PageConfig,
  FormedibleProgressConfig as ProgressConfig,
  UseFormedibleOptions,
};
