import type { ReactNode } from 'react';

import { CheckboxField } from '@/components/formedible/fields/checkbox-field';
import { NumberField } from '@/components/formedible/fields/number-field';
import { RadioField } from '@/components/formedible/fields/radio-field';
import { SelectField } from '@/components/formedible/fields/select-field';
import { SwitchField } from '@/components/formedible/fields/switch-field';
import { TextareaField } from '@/components/formedible/fields/textarea-field';
import { TextField } from '@/components/formedible/fields/text-field';
import type { FormedibleFieldRenderProps, FormedibleFormValues, NormalizedFieldType } from '@/lib/formedible/types';

type FieldComponent = <TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) => ReactNode;

const fieldRegistry: Partial<Record<NormalizedFieldType, FieldComponent>> = {
  checkbox: CheckboxField,
  email: TextField,
  masked: TextField,
  number: NumberField,
  password: TextField,
  radio: RadioField,
  select: SelectField,
  switch: SwitchField,
  tel: TextField,
  text: TextField,
  textarea: TextareaField,
  url: TextField,
};

export function getFieldComponent<TFormValues extends FormedibleFormValues>(
  type: NormalizedFieldType,
): (props: FormedibleFieldRenderProps<TFormValues>) => ReactNode {
  return fieldRegistry[type] ?? TextField;
}
