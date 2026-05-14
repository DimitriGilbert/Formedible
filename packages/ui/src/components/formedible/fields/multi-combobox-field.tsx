import { MultiSelectField } from '@formedible/ui/components/formedible/fields/multi-select-field';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

export function MultiComboboxField<TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) {
  return <MultiSelectField {...props} fieldConfig={{ ...props.fieldConfig, multiSelectConfig: props.fieldConfig.multiComboboxConfig ?? props.fieldConfig.multiSelectConfig }} />;
}
