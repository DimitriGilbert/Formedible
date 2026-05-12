import type { ReactNode } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import type { FormedibleTextController, NormalizedFieldConfig } from '@/lib/formedible/types';

export interface FieldWrapperProps<TFormValues extends Record<string, string> = Record<string, string>> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleTextController;
  readonly children: ReactNode;
}

export function FieldWrapper<TFormValues extends Record<string, string>>({ fieldConfig, field, children }: FieldWrapperProps<TFormValues>) {
  return (
    <Field className={fieldConfig.className} data-disabled={fieldConfig.disabled ? 'true' : undefined}>
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
