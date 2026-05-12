import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormedibleFieldOption, FormedibleFieldRenderProps, FormedibleFormValues, FormedibleOptionConfig } from '@/lib/formedible/types';

function normalizeOption(option: FormedibleFieldOption): FormedibleOptionConfig {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function SelectField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';
  const options = Array.isArray(fieldConfig.options) ? fieldConfig.options.map(normalizeOption) : [];

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
