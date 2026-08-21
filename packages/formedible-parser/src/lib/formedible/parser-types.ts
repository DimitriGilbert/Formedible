import type {
  FormedibleFieldConfig,
  FormedibleFieldOption,
  FormedibleFormValues,
  FormedibleObjectConfig,
  FormediblePageConfig,
  FormedibleProgressConfig,
  UseFormedibleOptions,
} from '@/components/formedible/lib/types';

export type ParsedFieldConfig = FormedibleFieldConfig<FormedibleFormValues>;

export type FieldOptions = readonly FormedibleFieldOption[];

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
  /**
   * Maximum object/array nesting depth accepted in parsed values. Defaults to
   * `defaultParserConfig.maxNestingDepth` (50). Deeper structures fail with the
   * coded `EXCEEDS_MAX_NESTING_DEPTH` ParserError instead of a stack overflow.
   */
  readonly maxNestingDepth?: number;
}

export interface ParserError extends Error {
  readonly code?: string;
  readonly field?: string;
  readonly line?: number;
  readonly column?: number;
}

export interface EnhancedParserOptions extends ParserOptions {
  /**
   * Base schema shape merged into the parsed config during validation,
   * according to `mergeStrategy`. Non-record values are ignored. Consumed by
   * `FormedibleParser.parse`/`parseStructured`/`parseAiOutput` via the same
   * logic as the `mergeSchemas` static.
   */
  readonly baseSchema?: unknown;
  /** Strategy applied when merging `baseSchema` into the parsed config; defaults to 'extend'. */
  readonly mergeStrategy?: 'extend' | 'override' | 'intersect';
  /**
   * Reserved for future use. Accepted for API compatibility only: the parser
   * never executes handlers from AI-generated configs, so any handlers
   * supplied here are a documented no-op.
   */
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

// Structured model output: either a direct ParsedFormConfig (formOptions is
// config content there, never an envelope key) or a single-payload envelope
// wrapper. Mirrors the unwrap keys in pickStructuredCandidate.
export type FormedibleStructuredOutput =
  | ParsedFormConfig
  | {
      readonly formedible?: unknown;
      readonly formConfig?: unknown;
      readonly config?: unknown;
      readonly output?: unknown;
    };

export type {
  FormedibleFieldConfig as FieldConfig,
  FormedibleFieldOption as FieldOption,
  FormedibleFormValues,
  FormedibleObjectConfig as ObjectConfig,
  FormediblePageConfig as PageConfig,
  FormedibleProgressConfig as ProgressConfig,
  UseFormedibleOptions,
};
