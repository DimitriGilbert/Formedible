import type { FormedibleFieldRenderProps } from '@/lib/formedible/types';

import { getFieldComponent } from './fields/field-registry';

export function FieldRenderer<TFormValues extends Record<string, string>>(props: FormedibleFieldRenderProps<TFormValues>) {
  const FieldComponent = getFieldComponent<TFormValues>(props.fieldConfig.type);

  return <FieldComponent fieldConfig={props.fieldConfig} field={props.field} />;
}
