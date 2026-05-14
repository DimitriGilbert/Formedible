import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Checkbox } from '@formedible/ui/components/checkbox';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

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
