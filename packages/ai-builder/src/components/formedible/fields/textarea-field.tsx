import { Textarea } from '@/components/ui/textarea';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

import { FieldWrapper } from './field-wrapper';

export function TextareaField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Textarea
        id={field.id}
        name={field.name}
        value={value}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        rows={fieldConfig.rows}
        maxLength={fieldConfig.maxLength}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
      />
    </FieldWrapper>
  );
}
