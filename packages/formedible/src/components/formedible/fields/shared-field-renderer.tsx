'use client';
import React from 'react';
import type { FieldComponentProps, FieldConfig } from '@/lib/formedible/types';
import { TextField } from './text-field';
import { TextareaField } from './textarea-field';
import { SelectField } from './select-field';
import { CheckboxField } from './checkbox-field';
import { SwitchField } from './switch-field';
import { NumberField } from './number-field';
import { DateField } from './date-field';
import { SliderField } from './slider-field';
import { FileUploadField } from './file-upload-field';
import { RadioField } from './radio-field';
import { MultiSelectField } from './multi-select-field';
import { ColorPickerField } from './color-picker-field';
import { RatingField } from './rating-field';
import { PhoneField } from './phone-field';
import { LocationPickerField } from './location-picker-field';
import { DurationPickerField } from './duration-picker-field';
import { AutocompleteField } from './autocomplete-field';
import { MaskedInputField } from './masked-input-field';

// Single source of truth for field type mapping - used everywhere!
// NOTE: ArrayField and ObjectField are not included here to avoid circular dependencies
// They handle their own nested field rendering using this shared renderer
export const FIELD_TYPE_COMPONENTS: Record<string, React.ComponentType<any>> = {
  text: TextField,
  email: TextField,
  password: TextField,
  url: TextField,
  tel: TextField,
  textarea: TextareaField,
  select: SelectField,
  checkbox: CheckboxField,
  switch: SwitchField,
  number: NumberField,
  date: DateField,
  slider: SliderField,
  file: FileUploadField,
  radio: RadioField,
  multiSelect: MultiSelectField,
  colorPicker: ColorPickerField,
  rating: RatingField,
  phone: PhoneField,
  location: LocationPickerField,
  duration: DurationPickerField,
  autocomplete: AutocompleteField,
  masked: MaskedInputField,
};

/**
 * Nested Field Renderer - for use inside array and object fields
 * This properly respects TanStack Form's architecture by using form.Subscribe
 * for conditional logic instead of breaking the reactivity system
 */
export const NestedFieldRenderer: React.FC<SharedFieldRendererProps> = ({
  fieldConfig,
  fieldApi,
  form,
  currentValues = {},
  resolveOptions,
}) => {
  const {
    name,
    type,
    label,
    placeholder,
    description,
    options,
    min,
    max,
    step,
    accept,
    multiple,
    component: CustomComponent,
    conditional,
    arrayConfig,
    datalist,
    ratingConfig,
    phoneConfig,
    colorConfig,
    multiSelectConfig,
    locationConfig,
    durationConfig,
    autocompleteConfig,
    maskedInputConfig,
    objectConfig,
    sliderConfig,
    numberConfig,
    dateConfig,
    fileConfig,
    textareaConfig,
    passwordConfig,
    emailConfig,
  } = fieldConfig;

  // If there's conditional logic and we have form access, use TanStack Form's subscription pattern
  if (conditional && form) {
    return (
      <form.Subscribe selector={(state: any) => state.values}>
        {(formValues: any) => {
          // For nested fields (array items or object fields), we need to determine the correct context
          let contextValues = formValues;
          
          if (fieldApi.name.includes('[') && fieldApi.name.includes(']')) {
            // This is an array field - get the parent array item values
            const parentPath = fieldApi.name.split('.')[0]; // e.g., "roomDetails[0]"
            const pathParts = parentPath.match(/(.+)\[(\d+)\]/);
            if (pathParts) {
              const [, arrayName, index] = pathParts;
              const arrayValue = formValues[arrayName];
              if (arrayValue && arrayValue[parseInt(index)]) {
                contextValues = arrayValue[parseInt(index)];
              }
            }
          } else if (fieldApi.name.includes('.')) {
            // This is a nested object field - get the parent object values
            const parentPath = fieldApi.name.split('.').slice(0, -1).join('.');
            const parentValue = parentPath.split('.').reduce((obj: Record<string, unknown> | null | undefined, key: string) => obj?.[key] as Record<string, unknown> | null | undefined, formValues as Record<string, unknown>);
            if (parentValue && typeof parentValue === 'object') {
              contextValues = parentValue;
            }
          }
            
          const shouldRender = conditional(contextValues);
          if (!shouldRender) {
            return null;
          }
          
          // Render the actual field
          return renderActualField();
        }}
      </form.Subscribe>
    );
  }

  // No conditional logic - render directly
  return renderActualField();

  function renderActualField() {
    // For nested rendering, we need to handle array and object types recursively
    // Import them dynamically to avoid circular dependencies
    if (type === 'array') {
      // Import ArrayField dynamically
      const ArrayField = require('./array-field').ArrayField;
      return (
        <ArrayField
          fieldApi={fieldApi}
          label={label}
          description={description}
          placeholder={placeholder}
          arrayConfig={arrayConfig}
        />
      );
    }

    if (type === 'object') {
      // Import ObjectField dynamically
      const ObjectField = require('./object-field').ObjectField;
      return (
        <ObjectField
          fieldApi={fieldApi}
          objectConfig={objectConfig}
          form={form}
          label={label}
          description={description}
          placeholder={placeholder}
        />
      );
    }

    // Select the component to use
    const FieldComponent =
      CustomComponent ||
      FIELD_TYPE_COMPONENTS[type] ||
      TextField;

    // Resolve options (static or dynamic)
    const resolvedOptions = options && resolveOptions 
      ? resolveOptions(options, currentValues)
      : Array.isArray(options) 
        ? options.map((opt: any) =>
            typeof opt === 'string'
              ? { value: opt, label: opt }
              : opt
          )
        : [];

    // Build base props
    const baseProps: FieldComponentProps = {
      fieldApi,
      label,
      placeholder,
      description,
      min,
      max,
      step,
      accept,
      multiple,
    };

    // Add type-specific props
    let props: FieldComponentProps = { ...baseProps };

    if (type === 'select' || type === 'radio' || type === 'multiSelect') {
      props.options = resolvedOptions;
    }

    if (['text', 'email', 'password', 'url', 'tel'].includes(type)) {
      props.type = type as any;
      props.datalist = datalist?.options;
    }

    // Add all the config objects
    if (type === 'rating') props.ratingConfig = ratingConfig;
    if (type === 'phone') props.phoneConfig = phoneConfig;
    if (type === 'colorPicker') props.colorConfig = colorConfig;
    if (type === 'multiSelect') props.multiSelectConfig = multiSelectConfig;
    if (type === 'location') props.locationConfig = locationConfig;
    if (type === 'duration') props.durationConfig = durationConfig;
    if (type === 'autocomplete') {
      props.autocompleteConfig = autocompleteConfig && resolveOptions 
        ? {
            ...autocompleteConfig,
            options: resolveOptions(autocompleteConfig.options, currentValues),
          }
        : autocompleteConfig;
    }
    if (type === 'masked') props.maskedInputConfig = maskedInputConfig;
    if (type === 'slider') props.sliderConfig = sliderConfig;
    if (type === 'number') props.numberConfig = numberConfig;
    if (type === 'date') props.dateConfig = dateConfig;
    if (type === 'file') props.fileConfig = fileConfig;
    if (type === 'textarea') props.textareaConfig = textareaConfig;
    if (type === 'password') props.passwordConfig = passwordConfig;
    if (type === 'email') props.emailConfig = emailConfig;

    return <FieldComponent {...props} />;
  }
};

export interface SharedFieldRendererProps {
  fieldConfig: FieldConfig;
  fieldApi: any;
  form?: any;
  currentValues?: Record<string, unknown>;
  resolveOptions?: (
    options: FieldConfig['options'],
    currentValues: Record<string, unknown>
  ) => { value: string; label: string }[];
}

/**
 * Shared field renderer - THE SINGLE SOURCE OF TRUTH
 * This is used by use-formedible, array-field, and object-field
 * NO MORE DUPLICATION!
 */
export const SharedFieldRenderer: React.FC<SharedFieldRendererProps> = ({
  fieldConfig,
  fieldApi,
  form,
  currentValues = {},
  resolveOptions,
}) => {
  const {
    name,
    type,
    label,
    placeholder,
    description,
    options,
    min,
    max,
    step,
    accept,
    multiple,
    component: CustomComponent,
    conditional,
    arrayConfig,
    datalist,
    ratingConfig,
    phoneConfig,
    colorConfig,
    multiSelectConfig,
    locationConfig,
    durationConfig,
    autocompleteConfig,
    maskedInputConfig,
    objectConfig,
    sliderConfig,
    numberConfig,
    dateConfig,
    fileConfig,
    textareaConfig,
    passwordConfig,
    emailConfig,
  } = fieldConfig;

  // Check conditional logic first - if field should not render, return null
  if (conditional && form?.state?.values) {
    const shouldRender = conditional(form.state.values);
    if (!shouldRender) {
      return null;
    }
  }

  // Handle special cases - array and object fields are NOT rendered by this component
  // They have their own components to avoid circular dependencies
  if (type === 'array' || type === 'object') {
    console.warn(`SharedFieldRenderer: ${type} fields should handle their own rendering to avoid circular dependencies`);
    return null;
  }

  // Select the component to use
  const FieldComponent =
    CustomComponent ||
    FIELD_TYPE_COMPONENTS[type] ||
    TextField;

  // Resolve options (static or dynamic)
  const resolvedOptions = options && resolveOptions 
    ? resolveOptions(options, currentValues)
    : Array.isArray(options) 
      ? options.map((opt: any) =>
          typeof opt === 'string'
            ? { value: opt, label: opt }
            : opt
        )
      : [];

  // Build base props
  const baseProps: FieldComponentProps = {
    fieldApi,
    label,
    placeholder,
    description,
    min,
    max,
    step,
    accept,
    multiple,
  };

  // Add type-specific props
  let props: FieldComponentProps = { ...baseProps };

  if (type === 'select' || type === 'radio' || type === 'multiSelect') {
    props.options = resolvedOptions;
  }

  if (type === 'array' && arrayConfig) {
    props.arrayConfig = arrayConfig;
  }

  if (['text', 'email', 'password', 'url', 'tel'].includes(type)) {
    props.type = type as any;
    props.datalist = datalist?.options;
  }

  // Add all the config objects
  if (type === 'rating') props.ratingConfig = ratingConfig;
  if (type === 'phone') props.phoneConfig = phoneConfig;
  if (type === 'colorPicker') props.colorConfig = colorConfig;
  if (type === 'multiSelect') props.multiSelectConfig = multiSelectConfig;
  if (type === 'location') props.locationConfig = locationConfig;
  if (type === 'duration') props.durationConfig = durationConfig;
  if (type === 'autocomplete') {
    props.autocompleteConfig = autocompleteConfig && resolveOptions 
      ? {
          ...autocompleteConfig,
          options: resolveOptions(autocompleteConfig.options, currentValues),
        }
      : autocompleteConfig;
  }
  if (type === 'masked') props.maskedInputConfig = maskedInputConfig;
  if (type === 'object') {
    props.objectConfig = objectConfig;
    props.form = form; // Pass form for conditional logic!
  }
  if (type === 'slider') props.sliderConfig = sliderConfig;
  if (type === 'number') props.numberConfig = numberConfig;
  if (type === 'date') props.dateConfig = dateConfig;
  if (type === 'file') props.fileConfig = fileConfig;
  if (type === 'textarea') props.textareaConfig = textareaConfig;
  if (type === 'password') props.passwordConfig = passwordConfig;
  if (type === 'email') props.emailConfig = emailConfig;

  return <FieldComponent {...props} />;
};