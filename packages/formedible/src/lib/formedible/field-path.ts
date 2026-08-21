export type FormediblePathSegment = string | number;

export function joinFieldPath(parentPath: string, childPath: string): string {
  if (!parentPath) {
    return childPath;
  }

  if (!childPath) {
    return parentPath;
  }

  return `${parentPath}.${childPath}`;
}

export function arrayItemFieldPath(arrayPath: string, index: number): string {
  return `${arrayPath}[${index}]`;
}

export function parseFieldPath(path: string): readonly FormediblePathSegment[] {
  const segments: FormediblePathSegment[] = [];
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

export function getValueAtFieldPath(value: unknown, path: string): unknown {
  let current = value;

  for (const segment of parseFieldPath(path)) {
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
 * Immutable deep-set counterpart of `getValueAtFieldPath`: returns a new value
 * tree with `path` set to `nextValue`. Only the containers along the path are
 * recreated (array copies / object spreads), so siblings are preserved and the
 * input tree is never mutated. Missing containers are created on demand —
 * numeric segments address array items, string segments record keys.
 */
export function setValueAtFieldPath<TValue = unknown>(value: TValue, path: string, nextValue: unknown): TValue {
  const segments = parseFieldPath(path);

  if (segments.length === 0) {
    return nextValue as TValue;
  }

  function setAt(current: unknown, index: number): unknown {
    const segment = segments[index];

    if (segment === undefined) {
      return nextValue;
    }

    if (typeof segment === 'number') {
      const items: unknown[] = Array.isArray(current) ? [...current] : [];
      items[segment] = setAt(items[segment], index + 1);
      return items;
    }

    const record: Record<string, unknown> =
      typeof current === 'object' && current !== null && !Array.isArray(current) ? { ...(current as Record<string, unknown>) } : {};
    record[segment] = setAt(record[segment], index + 1);
    return record;
  }

  return setAt(value, 0) as TValue;
}

export function pathSegmentsToFieldPath(segments: readonly FormediblePathSegment[]): string | undefined {
  let path = '';

  for (const segment of segments) {
    if (typeof segment === 'number') {
      path += `[${segment}]`;
      continue;
    }

    path = path ? `${path}.${segment}` : segment;
  }

  return path || undefined;
}
