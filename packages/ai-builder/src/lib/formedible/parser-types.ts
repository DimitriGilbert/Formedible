"use client";

// Import ALL types from main formedible package to eliminate duplicates
import type { 
  FieldConfig,
  DynamicText,
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig,
  UseFormedibleOptions,
  LayoutConfig,
  ConditionalSection,
  FormAnalytics,
  CrossFieldValidation,
  AsyncValidation,
  // Field-specific configs
  TextareaConfig,
  PasswordConfig,
  EmailConfig,
  NumberConfig,
  MultiSelectConfig,
  DateFieldProps,
  SliderFieldProps,
  FileUploadFieldProps,
  LocationConfig,
  DurationConfig,
  AutocompleteConfig,
  MaskedInputConfig,
  ColorPickerFieldProps,
  RatingFieldProps,
  PhoneFieldProps,
  ArrayFieldProps
} from "./types";

export type { 
  FieldConfig,
  DynamicText,
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig,
  UseFormedibleOptions,
  LayoutConfig,
  ConditionalSection,
  FormAnalytics,
  CrossFieldValidation,
  AsyncValidation,
  // Field-specific configs
  TextareaConfig,
  PasswordConfig,
  EmailConfig,
  NumberConfig,
  MultiSelectConfig,
  DateFieldProps,
  SliderFieldProps,
  FileUploadFieldProps,
  LocationConfig,
  DurationConfig,
  AutocompleteConfig,
  MaskedInputConfig,
  ColorPickerFieldProps,
  RatingFieldProps,
  PhoneFieldProps,
  ArrayFieldProps
};

// Use real FieldConfig from main formedible package - no duplicates!
export type ParsedFieldConfig = FieldConfig;


// Parser config - picks only the serializable parts of UseFormedibleOptions
// Excludes functions and React components that can't be parsed from text
export type ParsedFormConfig = Pick<UseFormedibleOptions<Record<string, unknown>>, 
  | 'fields'
  | 'schema' 
  | 'pages'
  | 'tabs'
  | 'layout'
  | 'progress'
  | 'submitLabel'
  | 'nextLabel' 
  | 'previousLabel'
  | 'collapseLabel'
  | 'expandLabel'
  | 'formClassName'
  | 'fieldClassName'
  | 'labelClassName'
  | 'buttonClassName'
  | 'submitButtonClassName'
  | 'autoScroll'
  | 'autoSubmitOnChange'
  | 'autoSubmitDebounceMs'
  | 'disabled'
  | 'loading'
  | 'resetOnSubmitSuccess'
  | 'showSubmitButton'
  | 'crossFieldValidation'
  | 'asyncValidation'
  | 'analytics'
  | 'conditionalSections'
  | 'persistence'
  | 'formOptions'
>;

export interface ParserOptions {
  strictValidation?: boolean;
}

export interface ParserError extends Error {
  code?: string;
  field?: string;
  line?: number;
  column?: number;
}

// Phase 2: Enhanced Parser Types

/**
 * Enhanced parser options for Phase 2 features
 */
export interface EnhancedParserOptions extends ParserOptions {
  baseSchema?: unknown; // z.ZodSchema in actual usage
  mergeStrategy?: 'extend' | 'override' | 'intersect';
  predefinedHandlers?: {
    onSubmit?: (data: unknown) => void;
    specificFields?: Record<string, ParsedFieldConfig>;
    [key: string]: unknown;
  };
}

/**
 * Enhanced error type with AI-friendly suggestions
 */
export interface EnhancedParserError {
  type: 'syntax' | 'validation' | 'field_type' | 'schema';
  message: string;
  suggestion?: string;
  location?: {
    line?: number;
    column?: number;
    field?: string;
  };
  examples?: string[];
}

/**
 * Schema inference configuration options
 */
export interface SchemaInferenceOptions {
  enabled?: boolean;
  fieldTypeMapping?: Record<string, unknown>; // z.ZodType in actual usage
  defaultValidation?: boolean;
  inferFromValues?: boolean;
}

/**
 * Result of schema inference parsing
 */
export interface SchemaInferenceResult {
  config: ParsedFormConfig;
  inferredSchema: unknown; // z.ZodSchema in actual usage
  confidence: number;
}

/**
 * Result of validation with suggestions
 */
export interface ValidationWithSuggestionsResult {
  isValid: boolean;
  errors: EnhancedParserError[];
  suggestions: string[];
}