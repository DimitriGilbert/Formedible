import { getFieldComponent } from '@/components/formedible/fields/field-registry';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

export function FieldRenderer<TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) {
  const FieldComponent = getFieldComponent<TFormValues>(props.fieldConfig.type);

  return <FieldComponent fieldConfig={props.fieldConfig} field={props.field} renderField={props.renderField} />;
}
