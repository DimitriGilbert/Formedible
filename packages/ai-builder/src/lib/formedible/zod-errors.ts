import type { StandardSchemaV1Issue } from '@tanstack/react-form';

export interface FormedibleFieldIssueMap {
  readonly fields?: Readonly<Record<string, readonly StandardSchemaV1Issue[]>>;
}

export function isStandardSchemaIssue(value: unknown): value is StandardSchemaV1Issue {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}

export function getIssueFieldName(issue: StandardSchemaV1Issue): string | undefined {
  const firstSegment = issue.path?.at(0);

  if (typeof firstSegment === 'string' || typeof firstSegment === 'number' || typeof firstSegment === 'symbol') {
    return String(firstSegment);
  }

  if (typeof firstSegment === 'object' && firstSegment !== null && 'key' in firstSegment) {
    const key = firstSegment.key;

    if (typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol') {
      return String(key);
    }
  }

  return undefined;
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
