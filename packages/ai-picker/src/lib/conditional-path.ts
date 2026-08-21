import type { AiPickerConditional, AiPickerValues } from '@/lib/ai-picker-types';

export type PickerPathSegment = string | number;

const wellFormedPathPattern = /^[A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+|\[\d+\])*$/;

/**
 * Parses a field path such as `nested.enable` or `tags[0].name` into segments.
 * Ported from the core package's `parseFieldPath` so the picker keeps the same
 * addressing semantics without a cross-package import.
 */
export function parsePickerFieldPath(path: string): readonly PickerPathSegment[] {
  const segments: PickerPathSegment[] = [];
  const pattern = /([^.[\]]+)|\[(\d+)\]/g;

  for (const match of path.matchAll(pattern)) {
    const property = match[1];
    const index = match[2];

    if (property !== undefined) {
      segments.push(property);
    } else if (index !== undefined) {
      segments.push(Number(index));
    }
  }

  return segments;
}

/**
 * Reads the value at a field path from the picker values. Ported from the core
 * package's `getValueAtFieldPath`: missing keys, non-object traversals, and
 * non-array indexing resolve to `undefined`.
 */
export function getValueAtPickerPath(values: AiPickerValues, path: string): unknown {
  let current: unknown = values;

  for (const segment of parsePickerFieldPath(path)) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) {
        return undefined;
      }

      current = current[segment];
      continue;
    }

    if (typeof current !== 'object' || current === null || !(segment in current)) {
      return undefined;
    }

    current = current[segment as keyof typeof current];
  }

  return current;
}

/**
 * Evaluates a schema conditional with the core package's safe semantics:
 * absent conditionals pass, string conditionals are field paths checked for
 * truthiness (never compiled with `new Function`), and function conditionals
 * receive the values directly. Malformed paths are reported to the console
 * instead of silently hiding the field.
 */
export function evaluatePickerConditional(
  conditional: AiPickerConditional | undefined,
  values: AiPickerValues,
): boolean {
  if (!conditional) {
    return true;
  }

  if (typeof conditional === 'function') {
    return Boolean(conditional(values));
  }

  if (!wellFormedPathPattern.test(conditional)) {
    console.error(
      `Invalid ai-picker conditional "${conditional}": expected a field path like "storageMode" or "nested[0].enable", or a (values) => boolean function.`,
    );
    return false;
  }

  return Boolean(getValueAtPickerPath(values, conditional));
}
