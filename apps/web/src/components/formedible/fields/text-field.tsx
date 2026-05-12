import { Input as TextInput } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

import { FieldWrapper } from './field-wrapper';

const textInputTypes = ['email', 'password', 'url', 'tel'] as const;

function getInputType(type: string) {
  return textInputTypes.some((inputType) => inputType === type) ? type : 'text';
}

export function TextField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <TextInput
        id={field.id}
        name={field.name}
        type={getInputType(fieldConfig.type)}
        value={value}
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
