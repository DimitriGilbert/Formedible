"use client";

// Import and re-export types from formedible to stay DRY
import type { 
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig
} from "./types";

export type { 
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig
};

export interface ParsedFieldConfig {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  validation?: unknown;
  
  // Field-specific configurations
  arrayConfig?: {
    itemType: string;
    itemLabel?: string;
    itemPlaceholder?: string;
    itemValidation?: unknown;
    minItems?: number;
    maxItems?: number;
    addButtonLabel?: string;
    removeButtonLabel?: string;
    sortable?: boolean;
    defaultValue?: unknown;
    objectConfig?: ObjectConfig;
    [key: string]: unknown;
  };
  
  objectConfig?: ObjectConfig;
  
  multiSelectConfig?: {
    maxSelections?: number;
    searchable?: boolean;
    creatable?: boolean;
    placeholder?: string;
    noOptionsText?: string;
    loadingText?: string;
    [key: string]: unknown;
  };
  
  colorConfig?: {
    format?: 'hex' | 'rgb' | 'hsl';
    showPreview?: boolean;
    showAlpha?: boolean;
    presetColors?: string[];
    allowCustom?: boolean;
    [key: string]: unknown;
  };
  
  ratingConfig?: {
    max?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    icon?: 'star' | 'heart' | 'thumbs' | unknown;
    size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
    showValue?: boolean;
    [key: string]: unknown;
  };
  
  phoneConfig?: {
    defaultCountry?: string;
    preferredCountries?: string[];
    onlyCountries?: string[];
    excludeCountries?: string[];
    format?: 'national' | 'international';
    [key: string]: unknown;
  };
  
  datalist?: {
    options?: string[];
    asyncOptions?: unknown;
    debounceMs?: number;
    minChars?: number;
    maxResults?: number;
    [key: string]: unknown;
  };
  
  // Allow additional unknown configurations
  [key: string]: unknown;
}


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