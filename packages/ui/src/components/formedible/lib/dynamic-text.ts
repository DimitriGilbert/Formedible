import type { ReactNode } from 'react';

import { getValueAtFieldPath } from '@formedible/ui/components/formedible/lib/field-path';
import type { FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

export function resolveDynamicText(text: ReactNode, values: FormedibleFormValues): ReactNode {
  if (typeof text !== 'string') {
    return text;
  }

  return text.replaceAll(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, fieldName: string) => {
    const value = getValueAtFieldPath(values, fieldName);

    return value === undefined || value === null ? '' : String(value);
  });
}
