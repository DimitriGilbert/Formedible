import type { AnyFieldApi } from '@tanstack/react-form';

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

// Cross-field validation configuration
export interface CrossFieldValidation<TFormValues = any> {
  fields: (keyof TFormValues)[];
  validator: (values: Partial<TFormValues>) => string | null;
  message: string;
}

// Async validation configuration
export interface AsyncValidation {
  validator: (value: any) => Promise<string | null>;
  debounceMs?: number;
  loadingMessage?: string;
}

// Form analytics and tracking configuration
export interface FormAnalytics {
  onFieldFocus?: (fieldName: string, timestamp: number) => void;
  onFieldBlur?: (fieldName: string, timeSpent: number) => void;
  onFormAbandon?: (completionPercentage: number) => void;
  onPageChange?: (fromPage: number, toPage: number, timeSpent: number) => void;
  onFieldChange?: (fieldName: string, value: any, timestamp: number) => void;
  onFormStart?: (timestamp: number) => void;
  onFormComplete?: (timeSpent: number, formData: any) => void;
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
export interface ConditionalSection<TFormValues = any> {
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
  pipe?: (conformedValue: string, config: any) => false | string | { value: string; indexesOfPipedChars: number[] };
} 