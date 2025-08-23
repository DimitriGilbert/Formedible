"use client";

// Import and re-export types from formedible to stay DRY
import type { 
  FieldConfig,
  DynamicText,
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig
} from "./types";

export type { 
  FieldConfig,
  DynamicText,
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig
};

// Just use FieldConfig directly - no need to redefine!
export type ParsedFieldConfig = FieldConfig;


export interface ParsedFormConfig {
  schema?: unknown;
  fields: ParsedFieldConfig[];
  pages?: PageConfig[];
  title?: string;
  description?: string;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  formClassName?: string;
  fieldClassName?: string;
  progress?: ProgressConfig;
  formOptions?: {
    defaultValues?: Record<string, unknown>;
    onSubmit?: (data: { value: Record<string, unknown> }) => void | Promise<void>;
    [key: string]: unknown;
  };
}

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