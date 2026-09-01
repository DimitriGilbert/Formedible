import { hasDatalistOptions, renderDatalistOptions } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

export function NumberField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'number' || typeof field.value === 'string' ? field.value : '';
  const min = fieldConfig.min ?? fieldConfig.numberConfig?.min;
  const max = fieldConfig.max ?? fieldConfig.numberConfig?.max;
  const step = fieldConfig.step ?? fieldConfig.numberConfig?.step;
  const datalistId = `${field.id}-datalist`;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Input
        id={field.id}
        name={field.name}
        type="number"
        value={value}
        placeholder={fieldConfig.placeholder}
        list={hasDatalistOptions(fieldConfig.datalist) ? datalistId : undefined}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        min={min}
        max={max}
        step={step}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)}
      />
      {renderDatalistOptions(datalistId, fieldConfig.datalist)}
    </FieldWrapper>
  );
}
