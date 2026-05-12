import { useId } from 'react';
import { useForm } from '@tanstack/react-form';
import type { DeepKeys } from '@tanstack/react-form';

import { FieldRenderer } from '@/components/formedible/field-renderer';
import { Form as FormRoot } from '@/components/formedible/form';
import type { FormProps } from '@/components/formedible/form';
import { normalizeOptions } from '@/lib/formedible/normalize-options';
import type { FormedibleFormValues, UseFormedibleOptions } from '@/lib/formedible/types';
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
        {fields.map((fieldConfig) => (
          <form.Field
            key={fieldConfig.name}
            name={fieldConfig.name as DeepKeys<TFormValues>}
            validators={buildFieldValidators<TFormValues, DeepKeys<TFormValues>>(fieldConfig, config.schema, config.crossFieldValidation, config.asyncValidation)}
          >
            {(field) => {
              const error = field.state.meta.errors.map(formatValidationError).find((message) => message !== undefined);
              type FieldValueUpdate = Parameters<typeof field.handleChange>[0];

              return (
                <FieldRenderer
                  fieldConfig={fieldConfig}
                  field={{
                    id: `${formId}-${fieldConfig.name}`,
                    name: fieldConfig.name,
                    value: field.state.value,
                    formValues: form.state.values,
                    error,
                    onBlur: field.handleBlur,
                    onChange: (nextValue) => field.handleChange(nextValue as FieldValueUpdate),
                  }}
                />
              );
            }}
          </form.Field>
        ))}
      </FormRoot>
    );
  }

  return { Form, form };
}
