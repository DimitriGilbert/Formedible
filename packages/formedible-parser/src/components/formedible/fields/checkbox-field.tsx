import { Checkbox } from '@/components/ui/checkbox';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

import { FieldWrapper } from './field-wrapper';

export function CheckboxField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const checked = field.value === true;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Checkbox
        id={field.id}
        name={field.name}
        checked={checked}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onCheckedChange={(nextChecked) => field.onChange(nextChecked === true)}
      />
    </FieldWrapper>
  );
}
