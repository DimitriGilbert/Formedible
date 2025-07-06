import React from 'react';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { FormApi } from '@tanstack/form-core';

// Type alias for our FormApi - use the core FormApi type which is what useForm actually returns
export type FormedibleFormApi<TFormData = Record<string, unknown>> = FormApi<
  TFormData,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
>;

// Props that all basic field components rendered by FormedibleRoot will receive
export interface BaseFieldProps {
  fieldApi: AnyFieldApi;
  label?: string;
  description?: string; // Added description
  placeholder?: string;
  inputClassName?: string;   // For the <Input /> component itself
  labelClassName?: string;   // For the <Label /> component
  wrapperClassName?: string; // For the div wrapping label and input
}

// Union type for all possible field component props
export type FieldComponentProps = BaseFieldProps & {
  // Optional props that specific field types might need
  options?: Array<{ value: string; label: string }>;
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    itemValidation?: unknown;
    itemComponent?: React.ComponentType<BaseFieldProps>;
    addButtonText?: string;
    removeButtonText?: string;
    defaultValue?: unknown;
  };
  [key: string]: unknown; // Allow additional props
};

// Cross-field validation configuration
export interface CrossFieldValidation<TFormValues = Record<string, unknown>> {
  fields: (keyof TFormValues)[];
  validator: (values: Partial<TFormValues>) => string | null;
  message: string;
}

// Async validation configuration
export interface AsyncValidation {
  validator: (value: unknown) => Promise<string | null>;
  debounceMs?: number;
  loadingMessage?: string;
}

// Form analytics and tracking configuration
export interface FormAnalytics {
  onFieldFocus?: (fieldName: string, timestamp: number) => void;
  onFieldBlur?: (fieldName: string, timeSpent: number) => void;
  onFormAbandon?: (completionPercentage: number) => void;
  onPageChange?: (fromPage: number, toPage: number, timeSpent: number) => void;
  onFieldChange?: (fieldName: string, value: unknown, timestamp: number) => void;
  onFormComplete?: (timeSpent: number, formData: unknown) => void;
}

// Layout configuration for forms
export interface LayoutConfig {
  type: 'grid' | 'flex' | 'tabs' | 'accordion' | 'stepper';
  columns?: number;
  gap?: string;
  responsive?: boolean;
  className?: string;
}

// Conditional sections configuration
export interface ConditionalSection<TFormValues = Record<string, unknown>> {
  condition: (values: TFormValues) => boolean;
  fields: string[];
  layout?: LayoutConfig;
}

// Location picker configuration
export interface LocationConfig {
  apiKey?: string;
  defaultLocation?: { lat: number; lng: number };
  zoom?: number;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableGeolocation?: boolean;
  mapProvider?: 'google' | 'openstreetmap';
}

// Duration picker configuration
export interface DurationConfig {
  format?: 'hms' | 'hm' | 'ms' | 'hours' | 'minutes' | 'seconds';
  maxHours?: number;
  maxMinutes?: number;
  maxSeconds?: number;
  showLabels?: boolean;
  allowNegative?: boolean;
}

// Autocomplete configuration
export interface AutocompleteConfig {
  options?: string[] | { value: string; label: string }[];
  asyncOptions?: (query: string) => Promise<string[] | { value: string; label: string }[]>;
  debounceMs?: number;
  minChars?: number;
  maxResults?: number;
  allowCustom?: boolean;
  placeholder?: string;
  noOptionsText?: string;
  loadingText?: string;
}

// Masked input configuration
export interface MaskedInputConfig {
  mask: string | ((value: string) => string);
  placeholder?: string;
  showMask?: boolean;
  guide?: boolean;
  keepCharPositions?: boolean;
  pipe?: (conformedValue: string, config: unknown) => false | string | { value: string; indexesOfPipedChars: number[] };
} 