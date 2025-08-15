// Field components
export * from '@/components/formedible/fields/text-field';
export * from '@/components/formedible/fields/textarea-field';
export * from '@/components/formedible/fields/number-field';
export * from '@/components/formedible/fields/select-field';
export * from '@/components/formedible/fields/checkbox-field';
export * from '@/components/formedible/fields/switch-field';
export * from '@/components/formedible/fields/date-field';
export * from '@/components/formedible/fields/slider-field';
export * from '@/components/formedible/fields/file-upload-field';
export * from '@/components/formedible/fields/array-field';
export * from '@/components/formedible/fields/radio-field';
export * from '@/components/formedible/fields/multi-select-field';
export * from '@/components/formedible/fields/color-picker-field';
export * from '@/components/formedible/fields/rating-field';
export * from '@/components/formedible/fields/phone-field';
export * from '@/components/formedible/fields/location-picker-field';
export * from '@/components/formedible/fields/duration-picker-field';
export * from '@/components/formedible/fields/autocomplete-field';
export * from '@/components/formedible/fields/masked-input-field';

// Layout components
export * from '@/components/formedible/layout/form-grid';
export * from '@/components/formedible/layout/form-tabs';
export * from '@/components/formedible/layout/form-accordion';
export * from '@/components/formedible/layout/form-stepper';

// UI components
export * from '@/components/ui/accordion';

// Utility components
export * from '@/components/formedible/fields/inline-validation-wrapper';
export * from '@/components/formedible/fields/field-help';
export { SharedFieldRenderer, NestedFieldRenderer, FIELD_TYPE_COMPONENTS } from '@/components/formedible/fields/shared-field-renderer';

// Core types and hook
export type { 
  BaseFieldProps, 
  FieldConfig, 
  PageConfig, 
  ProgressConfig,
  FieldComponentProps,
  ObjectConfig,
} from '@/lib/formedible/types';
export { useFormedible } from '@/hooks/use-formedible';

// Testing utilities
export * from './testing';
