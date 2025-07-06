// Field components
export * from '@/components/fields/text-field';
export * from '@/components/fields/textarea-field';
export * from '@/components/fields/number-field';
export * from '@/components/fields/select-field';
export * from '@/components/fields/checkbox-field';
export * from '@/components/fields/switch-field';
export * from '@/components/fields/date-field';
export * from '@/components/fields/slider-field';
export * from '@/components/fields/file-upload-field';
export * from '@/components/fields/array-field';
export * from '@/components/fields/radio-field';
export * from '@/components/fields/multi-select-field';
export * from '@/components/fields/color-picker-field';
export * from '@/components/fields/rating-field';
export * from '@/components/fields/phone-field';
export * from '@/components/fields/location-picker-field';
export * from '@/components/fields/duration-picker-field';
export * from '@/components/fields/autocomplete-field';
export * from '@/components/fields/masked-input-field';

// Layout components
export * from '@/components/layout/form-grid';
export * from '@/components/layout/form-tabs';
export * from '@/components/layout/form-accordion';
export * from '@/components/layout/form-stepper';

// UI components
export * from '@/components/ui/accordion';

// Utility components
export * from '@/components/fields/inline-validation-wrapper';
export * from '@/components/fields/field-help';

// Core types and hook
export type { BaseFieldProps } from '@/lib/formedible/types';
export { useFormedible } from '@/hooks/use-formedible';

// Testing utilities
export * from './testing';
