import { useId } from 'react';
import { useForm } from '@tanstack/react-form';
import type { DeepKeys } from '@tanstack/react-form';

import { FieldRenderer } from '@/components/formedible/field-renderer';
import { Form as FormRoot } from '@/components/formedible/form';
import type { FormProps } from '@/components/formedible/form';
import { getValueAtFieldPath } from '@/lib/formedible/field-path';
import { normalizeFieldConfig } from '@/lib/formedible/normalize-field-config';
import { normalizeOptions } from '@/lib/formedible/normalize-options';
import type { FormedibleFormValues, UseFormedibleOptions } from '@/lib/formedible/types';
import type { NormalizedFieldConfig } from '@/lib/formedible/types';
import { buildFieldValidators, buildFormValidators } from '@/lib/formedible/validation';
import { formatValidationError } from '@/lib/formedible/zod-errors';

export function useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(config: UseFormedibleOptions<TFormValues>) {
  const formId = useId();
  const normalizedOptions = normalizeOptions(config);
  const fields = normalizedOptions.fields;
  const form = useForm({
    defaultValues: config.formOptions.defaultValues,
    validators: buildFormValidators(config.schema, config.crossFieldValidation),
    onSubmit: async ({ value }) => {
      await config.formOptions.onSubmit?.({ value });
    },
  });

  function shouldRenderField(fieldConfig: NormalizedFieldConfig<TFormValues>, localValues: FormedibleFormValues | undefined) {
    if (!fieldConfig.conditional) {
      return true;
    }

    const conditionalValues = localValues ?? form.state.values;

    if (typeof fieldConfig.conditional === 'string') {
      return Boolean(getValueAtFieldPath(conditionalValues, fieldConfig.conditional));
    }

    return fieldConfig.conditional(conditionalValues as TFormValues);
  }

  function renderField(fieldConfig: NormalizedFieldConfig<TFormValues>, options?: { readonly name?: string; readonly key?: string; readonly localValues?: FormedibleFormValues }) {
    const fieldName = options?.name ?? fieldConfig.name;
    const renderConfig = fieldName === fieldConfig.name ? fieldConfig : normalizeFieldConfig<TFormValues>({ ...fieldConfig, name: fieldName });
    const localValues = options?.localValues;

    if (!shouldRenderField(fieldConfig, localValues)) {
      return null;
    }

    return (
      <form.Field
        key={options?.key ?? fieldName}
        name={fieldName as DeepKeys<TFormValues>}
        validators={buildFieldValidators<TFormValues, DeepKeys<TFormValues>>(renderConfig, config.schema, config.crossFieldValidation, config.asyncValidation)}
      >
        {(field) => {
          const error = field.state.meta.errors.map(formatValidationError).find((message) => message !== undefined);
          type FieldValueUpdate = Parameters<typeof field.handleChange>[0];

          return (
            <FieldRenderer
              fieldConfig={renderConfig}
              field={{
                id: `${formId}-${fieldName}`,
                name: fieldName,
                value: field.state.value,
                formValues: localValues ?? form.state.values,
                error,
                onBlur: field.handleBlur,
                onChange: (nextValue) => field.handleChange(nextValue as FieldValueUpdate),
              }}
              renderField={renderField}
            />
          );
        }}
      </form.Field>
    );
  }

  function Form({ className, ...props }: FormProps) {
    return (
      <FormRoot
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        {...props}
      >
        {fields.map((fieldConfig) => renderField(fieldConfig))}
      </FormRoot>
    );
  }

  return { Form, form };
}
