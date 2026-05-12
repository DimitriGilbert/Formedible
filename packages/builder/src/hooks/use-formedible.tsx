import { useId } from 'react';
import { useForm } from '@tanstack/react-form';

import { FieldRenderer } from '@/components/formedible/field-renderer';
import { Form as FormRoot } from '@/components/formedible/form';
import type { FormProps } from '@/components/formedible/form';
import { normalizeOptions } from '@/lib/formedible/normalize-options';
import type { FormedibleFormValues, UseFormedibleOptions } from '@/lib/formedible/types';

export function useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(config: UseFormedibleOptions<TFormValues>) {
  const formId = useId();
  const normalizedOptions = normalizeOptions(config);
  const fields = normalizedOptions.fields;
  const form = useForm({
    defaultValues: config.formOptions.defaultValues,
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
          <form.Field key={fieldConfig.name} name={fieldConfig.name}>
            {(field) => {
              const value = typeof field.state.value === 'string' ? field.state.value : '';
              const error = field.state.meta.errors.map((item) => String(item)).at(0);
              type FieldValueUpdate = Parameters<typeof field.handleChange>[0];

              return (
                <FieldRenderer
                  fieldConfig={fieldConfig}
                  field={{
                    id: `${formId}-${fieldConfig.name}`,
                    name: fieldConfig.name,
                    value,
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
