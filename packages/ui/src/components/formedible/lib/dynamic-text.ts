import type { ReactNode } from 'react';

import { getValueAtFieldPath, parseFieldPath, pathSegmentsToFieldPath } from '@formedible/ui/components/formedible/lib/field-path';
import type { FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

export function resolveDynamicText(text: ReactNode, values: FormedibleFormValues): ReactNode {
  if (typeof text !== 'string') {
    return text;
  }

  // The token class accepts dotted and bracketed path segments (`items[0].name`);
  // tokens only resolve when they normalize back to themselves through the
  // shared field-path parser, so malformed paths stay verbatim.
  return text.replaceAll(/\{\{\s*([\w.$[\]]+)\s*\}\}/g, (token, fieldName: string) => {
    if (pathSegmentsToFieldPath(parseFieldPath(fieldName)) !== fieldName) {
      return token;
    }

    const value = getValueAtFieldPath(values, fieldName);

    return value === undefined || value === null ? '' : String(value);
  });
}
