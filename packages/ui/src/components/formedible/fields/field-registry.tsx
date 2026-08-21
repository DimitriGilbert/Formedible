import type { ReactNode } from 'react';

import { AutocompleteField } from '@formedible/ui/components/formedible/fields/autocomplete-field';
import { CheckboxField } from '@formedible/ui/components/formedible/fields/checkbox-field';
import { ArrayField } from '@formedible/ui/components/formedible/fields/array-field';
import { ColorPickerField } from '@formedible/ui/components/formedible/fields/color-picker-field';
import { ComboboxField } from '@formedible/ui/components/formedible/fields/combobox-field';
import { DateField } from '@formedible/ui/components/formedible/fields/date-field';
import { DurationPickerField } from '@formedible/ui/components/formedible/fields/duration-picker-field';
import { FileUploadField } from '@formedible/ui/components/formedible/fields/file-upload-field';
import { LocationPickerField } from '@formedible/ui/components/formedible/fields/location-picker-field';
import { MaskedField } from '@formedible/ui/components/formedible/fields/masked-field';
import { MultiComboboxField } from '@formedible/ui/components/formedible/fields/multi-combobox-field';
import { MultiSelectField } from '@formedible/ui/components/formedible/fields/multi-select-field';
import { NumberField } from '@formedible/ui/components/formedible/fields/number-field';
import { ObjectField } from '@formedible/ui/components/formedible/fields/object-field';
import { PasswordField } from '@formedible/ui/components/formedible/fields/password-field';
import { PhoneField } from '@formedible/ui/components/formedible/fields/phone-field';
import { RadioField } from '@formedible/ui/components/formedible/fields/radio-field';
import { RatingField } from '@formedible/ui/components/formedible/fields/rating-field';
import { SelectField } from '@formedible/ui/components/formedible/fields/select-field';
import { SliderField } from '@formedible/ui/components/formedible/fields/slider-field';
import { SwitchField } from '@formedible/ui/components/formedible/fields/switch-field';
import { TextareaField } from '@formedible/ui/components/formedible/fields/textarea-field';
import { TextField } from '@formedible/ui/components/formedible/fields/text-field';
import type { FormedibleFieldRenderProps, FormedibleFormValues, NormalizedFieldType } from '@formedible/ui/components/formedible/lib/types';

type FieldComponent = <TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) => ReactNode;

const fieldRegistry: Partial<Record<NormalizedFieldType, FieldComponent>> = {
  array: ArrayField,
  autocomplete: AutocompleteField,
  checkbox: CheckboxField,
  color: ColorPickerField,
  combobox: ComboboxField,
  date: DateField,
  duration: DurationPickerField,
  email: TextField,
  file: FileUploadField,
  location: LocationPickerField,
  masked: MaskedField,
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
  type: NormalizedFieldType | (string & {}),
): (props: FormedibleFieldRenderProps<TFormValues>) => ReactNode {
  return fieldRegistry[type as NormalizedFieldType] ?? TextField;
}
