import type { ReactNode } from 'react';

import type { FormedibleFieldRenderProps, FormedibleFormValues, NormalizedFieldType } from '@/lib/formedible/types';

import { CheckboxField } from './checkbox-field';
import { NumberField } from './number-field';
import { RadioField } from './radio-field';
import { SelectField } from './select-field';
import { SwitchField } from './switch-field';
import { TextareaField } from './textarea-field';
import { TextField } from './text-field';

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
