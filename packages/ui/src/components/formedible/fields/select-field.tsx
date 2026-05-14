import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { resolveFieldOptions } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@formedible/ui/components/select';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

export function SelectField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';
  const options = resolveFieldOptions(fieldConfig, field.formValues);

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Select value={value} disabled={fieldConfig.disabled} required={fieldConfig.required} onValueChange={field.onChange}>
        <SelectTrigger id={field.id} name={field.name} aria-invalid={field.error ? true : undefined} className={fieldConfig.inputClassName} onBlur={field.onBlur}>
          <SelectValue placeholder={fieldConfig.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
}
