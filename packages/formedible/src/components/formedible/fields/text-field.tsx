import { Input as TextInput } from '@/components/ui/input';
import type { FormedibleFieldRenderProps } from '@/lib/formedible/types';

import { FieldWrapper } from './field-wrapper';

export function TextField<TFormValues extends Record<string, string>>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <TextInput
        id={field.id}
        name={field.name}
        type={fieldConfig.type}
        value={field.value}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
      />
    </FieldWrapper>
  );
}
