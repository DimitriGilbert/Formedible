import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

import { getFieldComponent } from './fields/field-registry';

export function FieldRenderer<TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) {
  const FieldComponent = getFieldComponent<TFormValues>(props.fieldConfig.type);

  return <FieldComponent fieldConfig={props.fieldConfig} field={props.field} />;
}
