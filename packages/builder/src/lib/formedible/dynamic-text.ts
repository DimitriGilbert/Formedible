import type { ReactNode } from 'react';

import { getValueAtFieldPath } from '@/lib/formedible/field-path';
import type { FormedibleFormValues } from '@/lib/formedible/types';

export function resolveDynamicText(text: ReactNode, values: FormedibleFormValues): ReactNode {
  if (typeof text !== 'string') {
    return text;
  }

  return text.replaceAll(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, fieldName: string) => {
    const value = getValueAtFieldPath(values, fieldName);

    return value === undefined || value === null ? '' : String(value);
  });
}
