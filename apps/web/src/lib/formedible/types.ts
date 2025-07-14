import React from 'react';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { FormApi, ValidationError, FormState } from '@tanstack/form-core';

// Strict type definitions for better type safety
export interface StrictFieldApi<T = unknown> {
  name: string;
  value: T;
  errors: ValidationError[];
  touched: boolean;
  setValue: (value: T) => void;
  setTouched: (touched: boolean) => void;
  validate: () => Promise<ValidationError[]>;
}

export interface TypedFormState<TFormData = Record<string, unknown>> {
  values: TFormData;
  errors: Record<keyof TFormData, ValidationError[]>;
  touched: Record<keyof TFormData, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  canSubmit: boolean;
}

export interface TypedFormSubscriptionSelector<TFormData = Record<string, unknown>, TSelected = unknown> {
  (state: FormState<TFormData, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined>): TSelected;
}

// Validation error types based on TanStack Form
export type FormedibleValidationError = ValidationError;

// Validation error that can be a string, Error object, or custom validation result
export type FieldValidationError = string | Error | ValidationError;

// Array of validation errors for a field
export type FieldValidationErrors = FieldValidationError[];

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

// Option types for select, radio, and multi-select fields
export type FieldOption = {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
};

export type FieldOptions = string[] | FieldOption[];

// Normalize options to consistent format
export type NormalizedFieldOption = FieldOption;

// Enhanced field event types for better event access
export interface FieldEventHandlers {
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onChange?: (value: unknown, event?: React.ChangeEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
}

// Enhanced field API with event handlers
export type EnhancedFieldApi = AnyFieldApi & {
  eventHandlers: FieldEventHandlers;
};

// Props that all basic field components rendered by FormedibleRoot will receive
export interface BaseFieldProps {
  fieldApi: EnhancedFieldApi;
  label?: string;
  description?: string;
  placeholder?: string;
  inputClassName?: string;   // For the <Input /> component itself
  labelClassName?: string;   // For the <Label /> component
  wrapperClassName?: string; // For the div wrapping label and input
}

// Specific field component prop types
export interface SelectFieldProps extends BaseFieldProps {
  options: FieldOptions;
  placeholder?: string;
}

export interface RadioFieldProps extends BaseFieldProps {
  options: FieldOptions;
}

export interface MultiSelectFieldProps extends BaseFieldProps {
  options: FieldOptions;
  placeholder?: string;
  maxSelections?: number;
}

export interface ArrayFieldProps extends BaseFieldProps {
  arrayConfig: {
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
    itemComponent?: React.ComponentType<BaseFieldProps>;
    itemProps?: Record<string, unknown>;
  };
}

export interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
  datalist?: string[];
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
}

export interface NumberFieldProps extends BaseFieldProps {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

export interface DateFieldProps extends BaseFieldProps {
  dateConfig?: {
    format?: string;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: Date[];
    showTime?: boolean;
    timeFormat?: string;
  };
}

export interface SliderFieldProps extends BaseFieldProps {
  sliderConfig?: {
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
    showTicks?: boolean;
    orientation?: 'horizontal' | 'vertical';
  };
}

export interface FileUploadFieldProps extends BaseFieldProps {
  fileConfig?: {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    allowedTypes?: string[];
    uploadUrl?: string;
    onUpload?: (files: File[]) => Promise<string[]>;
  };
}

export interface LocationPickerFieldProps extends BaseFieldProps {
  locationConfig?: LocationConfig;
}

export interface DurationPickerFieldProps extends BaseFieldProps {
  durationConfig?: DurationConfig;
}

export interface AutocompleteFieldProps extends BaseFieldProps {
  autocompleteConfig?: AutocompleteConfig;
}

export interface MaskedInputFieldProps extends BaseFieldProps {
  maskedConfig?: MaskedInputConfig;
}

export interface ColorPickerFieldProps extends BaseFieldProps {
  colorConfig?: {
    format?: 'hex' | 'rgb' | 'hsl';
    showAlpha?: boolean;
    presetColors?: string[];
    allowCustom?: boolean;
  };
}

export interface RatingFieldProps extends BaseFieldProps {
  ratingConfig?: {
    max?: number;
    allowHalf?: boolean;
    allowClear?: boolean;
    icon?: 'star' | 'heart' | 'thumbs' | React.ComponentType;
    size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
    showValue?: boolean;
  };
}

export interface PhoneFieldProps extends BaseFieldProps {
  phoneConfig?: {
    defaultCountry?: string;
    preferredCountries?: string[];
    onlyCountries?: string[];
    excludeCountries?: string[];
    format?: 'national' | 'international';
  };
}

// Union type for all possible field component props - using intersection for flexibility
export type FieldComponentProps = BaseFieldProps & {
  // Optional props that specific field types might need
  options?: FieldOptions;
  arrayConfig?: ArrayFieldProps['arrayConfig'];
  type?: TextFieldProps['type'];
  datalist?: string[];
  dateConfig?: DateFieldProps['dateConfig'];
  sliderConfig?: SliderFieldProps['sliderConfig'];
  fileConfig?: FileUploadFieldProps['fileConfig'];
  locationConfig?: LocationPickerFieldProps['locationConfig'];
  durationConfig?: DurationPickerFieldProps['durationConfig'];
  autocompleteConfig?: AutocompleteFieldProps['autocompleteConfig'];
  maskedConfig?: MaskedInputFieldProps['maskedConfig'];
  colorConfig?: ColorPickerFieldProps['colorConfig'];
  ratingConfig?: RatingFieldProps['ratingConfig'];
  phoneConfig?: PhoneFieldProps['phoneConfig'];
  // Legacy support for existing configurations
  multiSelectConfig?: {
    maxSelections?: number;
    searchable?: boolean;
    creatable?: boolean;
    placeholder?: string;
    noOptionsText?: string;
    loadingText?: string;
  };
  maskedInputConfig?: MaskedInputConfig;
  // Allow additional props for extensibility
  [key: string]: unknown;
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