import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FormedibleFieldOption, FormedibleFieldRenderProps, FormedibleFormValues, FormedibleOptionConfig } from '@/lib/formedible/types';

import { FieldWrapper } from './field-wrapper';

function normalizeOption(option: FormedibleFieldOption): FormedibleOptionConfig {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function RadioField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';
  const options = Array.isArray(fieldConfig.options) ? fieldConfig.options.map(normalizeOption) : [];

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <RadioGroup
        id={field.id}
        name={field.name}
        value={value}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onValueChange={field.onChange}
      >
        {options.map((option) => {
          const optionId = `${field.id}-${option.value}`;

          return (
            <Field key={option.value} className="flex flex-row items-center gap-2">
              <RadioGroupItem id={optionId} value={option.value} disabled={option.disabled} />
              <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
            </Field>
          );
        })}
      </RadioGroup>
    </FieldWrapper>
  );
}
