import type { ReactNode } from 'react';

import type { FormedibleFieldRenderProps, FormedibleFieldType } from '@/lib/formedible/types';

import { TextField } from './text-field';

const fieldRegistry = {
  text: TextField,
} satisfies Record<FormedibleFieldType, typeof TextField>;

export function getFieldComponent<TFormValues extends Record<string, string>>(
  type: FormedibleFieldType,
): (props: FormedibleFieldRenderProps<TFormValues>) => ReactNode {
  return fieldRegistry[type];
}
