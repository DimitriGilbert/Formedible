import type { ReactNode } from 'react';

import type { FormedibleFieldRenderProps, FormedibleFormValues, NormalizedFieldType } from '@/lib/formedible/types';

import { TextField } from './text-field';

const fieldRegistry: Partial<Record<NormalizedFieldType, typeof TextField>> = {
  text: TextField,
};

export function getFieldComponent<TFormValues extends FormedibleFormValues>(
  type: NormalizedFieldType,
): (props: FormedibleFieldRenderProps<TFormValues>) => ReactNode {
  return fieldRegistry[type] ?? TextField;
}
