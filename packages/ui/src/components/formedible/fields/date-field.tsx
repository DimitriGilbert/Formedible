import { Input } from '@formedible/ui/components/input';
import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import type { FormedibleFormValues, FormedibleFieldRenderProps } from '@formedible/ui/components/formedible/lib/types';

function toDateInputValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function toDateBound(value: Date | string | undefined): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === 'string' ? value.slice(0, 10) : undefined;
}

export function DateField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = toDateInputValue(field.value);
  const dateConfig = fieldConfig.dateConfig;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Input
        id={field.id}
        name={field.name}
        type="date"
        value={value}
        min={toDateBound(dateConfig?.minDate)}
        max={toDateBound(dateConfig?.maxDate)}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => {
          const nextValue = event.target.value;
          const nextDate = new Date(`${nextValue}T00:00:00`);

          if (dateConfig?.disableDate?.(nextDate, (field.formValues ?? {}) as TFormValues)) {
            return;
          }

          field.onChange(nextValue);
        }}
      />
    </FieldWrapper>
  );
}
