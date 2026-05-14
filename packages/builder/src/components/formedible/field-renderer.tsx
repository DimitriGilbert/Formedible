import { getFieldComponent } from '@/components/formedible/fields/field-registry';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

export function FieldRenderer<TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) {
  const FieldComponent = props.fieldConfig.component ?? props.defaultComponent ?? getFieldComponent<TFormValues>(props.fieldConfig.type);
  const FieldWrapper = props.fieldConfig.wrapper;
  const GlobalWrapper = props.globalWrapper;
  const fieldElement = <FieldComponent fieldConfig={props.fieldConfig} field={props.field} renderField={props.renderField} />;
  const wrappedField = FieldWrapper ? (
    <FieldWrapper fieldConfig={props.fieldConfig} field={props.field}>
      {fieldElement}
    </FieldWrapper>
  ) : (
    fieldElement
  );

  return GlobalWrapper ? (
    <GlobalWrapper fieldConfig={props.fieldConfig} field={props.field}>
      {wrappedField}
    </GlobalWrapper>
  ) : (
    wrappedField
  );
}
