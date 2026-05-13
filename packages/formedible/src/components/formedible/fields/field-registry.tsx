import type { ReactNode } from 'react';

import { CheckboxField } from '@/components/formedible/fields/checkbox-field';
import { ArrayField } from '@/components/formedible/fields/array-field';
import { ColorPickerField } from '@/components/formedible/fields/color-picker-field';
import { ComboboxField } from '@/components/formedible/fields/combobox-field';
import { DateField } from '@/components/formedible/fields/date-field';
import { DurationPickerField } from '@/components/formedible/fields/duration-picker-field';
import { FileUploadField } from '@/components/formedible/fields/file-upload-field';
import { LocationPickerField } from '@/components/formedible/fields/location-picker-field';
import { MultiComboboxField } from '@/components/formedible/fields/multi-combobox-field';
import { MultiSelectField } from '@/components/formedible/fields/multi-select-field';
import { NumberField } from '@/components/formedible/fields/number-field';
import { ObjectField } from '@/components/formedible/fields/object-field';
import { PasswordField } from '@/components/formedible/fields/password-field';
import { PhoneField } from '@/components/formedible/fields/phone-field';
import { RadioField } from '@/components/formedible/fields/radio-field';
import { RatingField } from '@/components/formedible/fields/rating-field';
import { SelectField } from '@/components/formedible/fields/select-field';
import { SliderField } from '@/components/formedible/fields/slider-field';
import { SwitchField } from '@/components/formedible/fields/switch-field';
import { TextareaField } from '@/components/formedible/fields/textarea-field';
import { TextField } from '@/components/formedible/fields/text-field';
import type { FormedibleFieldRenderProps, FormedibleFormValues, NormalizedFieldType } from '@/lib/formedible/types';

type FieldComponent = <TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) => ReactNode;

const fieldRegistry: Partial<Record<NormalizedFieldType, FieldComponent>> = {
  array: ArrayField,
  checkbox: CheckboxField,
  color: ColorPickerField,
  combobox: ComboboxField,
  date: DateField,
  duration: DurationPickerField,
  email: TextField,
  file: FileUploadField,
  location: LocationPickerField,
  masked: TextField,
  multiCombobox: MultiComboboxField,
  multiSelect: MultiSelectField,
  number: NumberField,
  object: ObjectField,
  password: PasswordField,
  phone: PhoneField,
  radio: RadioField,
  rating: RatingField,
  select: SelectField,
  slider: SliderField,
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
