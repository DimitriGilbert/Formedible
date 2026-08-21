import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import type { FormedibleFormValues, FormedibleFieldRenderProps } from '@/lib/formedible/types';

function toLocalDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toDateInputValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toLocalDateKey(value);
  }

  return typeof value === 'string' ? value.slice(0, 10) : '';
}

function toDateBound(value: Date | string | undefined): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toLocalDateKey(value);
  }

  return typeof value === 'string' ? value.slice(0, 10) : undefined;
}

function toTodayDateKey(): string {
  return toLocalDateKey(new Date());
}

function laterDateKey(left: string | undefined, right: string): string {
  return left !== undefined && left > right ? left : right;
}

function earlierDateKey(left: string | undefined, right: string): string {
  return left !== undefined && left < right ? left : right;
}

export function DateField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = toDateInputValue(field.value);
  const dateConfig = fieldConfig.dateConfig;
  const minBound = dateConfig?.disablePastDates
    ? laterDateKey(toDateBound(dateConfig.minDate), toTodayDateKey())
    : toDateBound(dateConfig?.minDate);
  const maxBound = dateConfig?.disableFutureDates
    ? earlierDateKey(toDateBound(dateConfig.maxDate), toTodayDateKey())
    : toDateBound(dateConfig?.maxDate);

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Input
        id={field.id}
        name={field.name}
        type="date"
        value={value}
        min={minBound}
        max={maxBound}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => {
          const nextValue = event.target.value;
          const nextDate = new Date(`${nextValue}T00:00:00`);

          if (!Number.isNaN(nextDate.getTime()) && dateConfig?.disableDate?.(nextDate, (field.formValues ?? {}) as TFormValues)) {
            return;
          }

          field.onChange(nextValue ? nextDate : undefined);
        }}
      />
    </FieldWrapper>
  );
}
