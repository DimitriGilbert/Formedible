import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Input as TextInput } from '@formedible/ui/components/input';
import type { FormedibleFieldOption, FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

const textInputTypes = ['email', 'password', 'url', 'tel'] as const;

function getInputType(type: string) {
  return textInputTypes.some((inputType) => inputType === type) ? type : 'text';
}

function hasDatalistOptions(options: readonly FormedibleFieldOption[] | undefined): options is readonly FormedibleFieldOption[] {
  return Array.isArray(options) && options.length > 0;
}

function renderDatalistOptions(id: string, options: readonly FormedibleFieldOption[] | undefined) {
  if (!hasDatalistOptions(options)) {
    return undefined;
  }

  return (
    <datalist id={id}>
      {options.map((option) => {
        if (typeof option === 'string') {
          return <option key={option} value={option} />;
        }

        return (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        );
      })}
    </datalist>
  );
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
