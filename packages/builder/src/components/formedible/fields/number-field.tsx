import { Input } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

import { FieldWrapper } from './field-wrapper';

export function NumberField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'number' || typeof field.value === 'string' ? field.value : '';

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Input
        id={field.id}
        name={field.name}
        type="number"
        value={value}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        min={fieldConfig.min}
        max={fieldConfig.max}
        step={fieldConfig.step}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)}
      />
    </FieldWrapper>
  );
}
