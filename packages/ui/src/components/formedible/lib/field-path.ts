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
