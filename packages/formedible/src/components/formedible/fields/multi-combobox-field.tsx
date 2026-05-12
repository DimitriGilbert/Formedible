import { MultiSelectField } from '@/components/formedible/fields/multi-select-field';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

export function MultiComboboxField<TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) {
  return <MultiSelectField {...props} fieldConfig={{ ...props.fieldConfig, multiSelectConfig: props.fieldConfig.multiComboboxConfig ?? props.fieldConfig.multiSelectConfig }} />;
}
