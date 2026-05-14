import type { StandardSchemaV1Issue } from '@tanstack/react-form';

import { pathSegmentsToFieldPath } from '@formedible/ui/components/formedible/lib/field-path';
import type { FormediblePathSegment } from '@formedible/ui/components/formedible/lib/field-path';

export interface FormedibleFieldIssueMap {
  readonly fields?: Readonly<Record<string, readonly StandardSchemaV1Issue[]>>;
}

export function isStandardSchemaIssue(value: unknown): value is StandardSchemaV1Issue {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}

export function getIssueFieldName(issue: StandardSchemaV1Issue): string | undefined {
  const segments: FormediblePathSegment[] = [];

  for (const segment of issue.path ?? []) {
    if (typeof segment === 'string' || typeof segment === 'number') {
      segments.push(segment);
      continue;
    }

    if (typeof segment === 'symbol') {
      segments.push(String(segment));
      continue;
    }

    if (typeof segment === 'object' && segment !== null && 'key' in segment) {
      const key = segment.key;

      if (typeof key === 'string' || typeof key === 'number') {
        segments.push(key);
      } else if (typeof key === 'symbol') {
        segments.push(String(key));
      }
    }
  }

  return pathSegmentsToFieldPath(segments);
}

export function firstIssueMessage(issues: readonly StandardSchemaV1Issue[] | undefined): string | undefined {
  return issues?.at(0)?.message;
}

export function formatValidationError(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error;
  }

  if (isStandardSchemaIssue(error)) {
    return error.message;
  }

  if (Array.isArray(error)) {
    for (const item of error) {
      const message = formatValidationError(item);

      if (message) {
        return message;
      }
    }
  }

  return undefined;
}
