"use client";

// Core types that replicate the essential parts of formedible types for standalone usage
export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export type FieldOptions = string[] | FieldOption[];

export interface ObjectConfig {
  title?: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    description?: string;
    options?: string[] | Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    [key: string]: unknown;
  }>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showCard?: boolean;
  layout?: "grid" | "vertical" | "horizontal" | (string & {});
  columns?: number;
  collapseLabel?: string;
  expandLabel?: string;
}

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

export interface PageConfig {
  page: number;
  title?: string;
  description?: string;
  component?: unknown;
  conditional?: unknown;
}

export interface ProgressConfig {
  component?: unknown;
  showSteps?: boolean;
  showPercentage?: boolean;
  className?: string;
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