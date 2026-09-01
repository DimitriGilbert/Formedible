import { hasDatalistOptions, renderDatalistOptions } from '@/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Input as TextInput } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

const textInputTypes = ['email', 'password', 'url', 'tel'] as const;

function getInputType(type: string) {
  return textInputTypes.some((inputType) => inputType === type) ? type : 'text';
}

export function TextField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';
  const datalistId = `${field.id}-datalist`;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <TextInput
        id={field.id}
        name={field.name}
        type={getInputType(fieldConfig.type)}
        value={value}
        placeholder={fieldConfig.placeholder}
        list={hasDatalistOptions(fieldConfig.datalist) ? datalistId : undefined}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
      />
      {renderDatalistOptions(datalistId, fieldConfig.datalist)}
    </FieldWrapper>
  );
}
