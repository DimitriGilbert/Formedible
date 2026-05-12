import type { ReactNode } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import type { FormedibleFieldController, FormedibleFormValues, NormalizedFieldConfig } from '@/lib/formedible/types';

export interface FieldWrapperProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
  readonly children: ReactNode;
}

export function FieldWrapper<TFormValues extends FormedibleFormValues>({ fieldConfig, field, children }: FieldWrapperProps<TFormValues>) {
  return (
    <Field
      className={fieldConfig.className}
      data-disabled={fieldConfig.disabled ? 'true' : undefined}
      data-invalid={field.error ? 'true' : undefined}
      onFocusCapture={field.onFocus}
    >
      {fieldConfig.label ? (
        <FieldLabel htmlFor={field.id}>
          {fieldConfig.label}
          {fieldConfig.required ? <span aria-hidden="true"> *</span> : undefined}
        </FieldLabel>
      ) : undefined}
      {children}
      {fieldConfig.description ? <FieldDescription>{fieldConfig.description}</FieldDescription> : undefined}
      {field.error ? <FieldError>{field.error}</FieldError> : undefined}
    </Field>
  );
}
