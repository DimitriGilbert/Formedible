import type { ReactNode } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@formedible/ui/components/field';
import type { FormedibleFieldController, FormedibleFormValues, FormedibleHelpConfig, NormalizedFieldConfig } from '@formedible/ui/components/formedible/lib/types';

function isHelpConfig(help: ReactNode | FormedibleHelpConfig): help is FormedibleHelpConfig {
  return typeof help === 'object' && help !== null && ('tooltip' in help || 'text' in help);
}

function getHelpContent(help: NormalizedFieldConfig['help']): ReactNode {
  if (!help) {
    return undefined;
  }

  if (isHelpConfig(help)) {
    return help.tooltip ?? help.text;
  }

  return help;
}

export interface FieldWrapperProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
  readonly children: ReactNode;
}

export function FieldWrapper<TFormValues extends FormedibleFormValues>({ fieldConfig, field, children }: FieldWrapperProps<TFormValues>) {
  const helpContent = getHelpContent(fieldConfig.help);

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
      {helpContent ? <FieldDescription>{helpContent}</FieldDescription> : undefined}
      {field.error ? <FieldError>{field.error}</FieldError> : undefined}
    </Field>
  );
}
