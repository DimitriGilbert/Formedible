import { getValueAtFieldPath, parseFieldPath } from '@/lib/formedible/field-path';
import type { FormediblePathSegment } from '@/lib/formedible/field-path';
import type {
  FormedibleConditional,
  FormedibleFieldConfig,
  FormedibleFormValues,
  FormediblePageConfig,
  FormedibleTabConfig,
  NormalizedFieldConfig,
} from '@/lib/formedible/types';

/**
 * Evaluates a field's `conditional` against the exact values scope the field
 * renders with, mirroring `useFormedible`'s render-time semantics: string
 * conditionals read a (possibly nested) value path from the scope, function
 * conditionals receive the scope values themselves.
 */
export function evaluateFieldConditional<TFormValues extends FormedibleFormValues>(
  conditional: FormedibleConditional<TFormValues> | undefined,
  values: FormedibleFormValues,
): boolean {
  if (!conditional) {
    return true;
  }

  if (typeof conditional === 'string') {
    return Boolean(getValueAtFieldPath(values, conditional));
  }

  return Boolean(conditional(values as TFormValues));
}

/**
 * Page and tab configurations (verbatim from `UseFormedibleOptions`) used to
 * resolve whether a field's location is currently reachable.
 */
export interface FormediblePageTabVisibility<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly pages?: readonly FormediblePageConfig<TFormValues>[];
  readonly tabs?: readonly (string | FormedibleTabConfig<TFormValues>)[];
}

/** Minimal tab shape shared by `NormalizedFormTab` and raw tab configs. */
export interface FormedibleTabVisibilityEntry<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly id: string;
  readonly conditional?: FormedibleConditional<TFormValues>;
}

/**
 * Resolves a tab's visibility with the exact semantics `useFormTabs` uses for
 * `visibleTabs`: the tab's own `conditional` must match AND at least one field
 * assigned to the tab must be field-visible.
 */
export function isTabVisible<TFormValues extends FormedibleFormValues>(
  tab: FormedibleTabVisibilityEntry<TFormValues>,
  fields: readonly FormedibleFieldConfig<TFormValues>[],
  values: TFormValues,
): boolean {
  if (!evaluateFieldConditional(tab.conditional, values)) {
    return false;
  }

  return fields.some((field) => field.tab === tab.id && evaluateFieldConditional(field.conditional, values));
}

/**
 * Resolves a page number's visibility with the exact semantics
 * `getVisiblePageNumbers` uses for `visiblePages`: the page config's
 * `conditional` must match AND at least one field on the page must be
 * field-visible.
 */
export function isPageNumberVisible<TFormValues extends FormedibleFormValues>(
  pageNumber: number,
  fields: readonly FormedibleFieldConfig<TFormValues>[],
  pages: readonly FormediblePageConfig<TFormValues>[] | undefined,
  values: TFormValues,
): boolean {
  const pageConfig = pages?.find((page) => page.page === pageNumber);

  if (!evaluateFieldConditional(pageConfig?.conditional, values)) {
    return false;
  }

  return fields.some((field) => (field.page ?? 1) === pageNumber && evaluateFieldConditional(field.conditional, values));
}

function tabVisibilityEntries<TFormValues extends FormedibleFormValues>(
  tabs: readonly (string | FormedibleTabConfig<TFormValues>)[] | undefined,
  fields: readonly FormedibleFieldConfig<TFormValues>[],
): readonly FormedibleTabVisibilityEntry<TFormValues>[] {
  if (tabs && tabs.length > 0) {
    return tabs.map((tab) => (typeof tab === 'string' ? { id: tab } : { id: tab.id, conditional: tab.conditional }));
  }

  return Array.from(new Set(fields.map((field) => field.tab).filter((tab): tab is string => tab !== undefined))).map((tab) => ({ id: tab }));
}

/**
 * Resolves whether a field's location (the page/tab its config assigns it to)
 * is currently reachable, mirroring `useFormedible`'s `renderFields`
 * precedence: while any tab is visible, tab membership decides rendering and
 * page conditionals are ignored (matching `hasConfiguredTabs`); otherwise, when
 * pages are configured, the field's page must be visible. Fields without any
 * page/tab configuration (or callers without a visibility context) resolve to
 * visible so schema enforcement stays in place for them.
 */
export function isFieldLocationVisible<TFormValues extends FormedibleFormValues>(
  field: FormedibleFieldConfig<TFormValues> | undefined,
  fields: readonly FormedibleFieldConfig<TFormValues>[],
  visibility: FormediblePageTabVisibility<TFormValues> | undefined,
  values: TFormValues,
): boolean {
  if (!field || !visibility) {
    return true;
  }

  const tabEntries = tabVisibilityEntries(visibility.tabs, fields);

  if (tabEntries.length > 0) {
    const visibleTabIds = tabEntries.filter((tab) => isTabVisible(tab, fields, values)).map((tab) => tab.id);

    if (visibleTabIds.length > 0) {
      return field.tab !== undefined && visibleTabIds.includes(field.tab);
    }
  }

  if (fields.some((fieldConfig) => fieldConfig.page !== undefined) || (visibility.pages?.length ?? 0) > 0) {
    return isPageNumberVisible(field.page ?? 1, fields, visibility.pages, values);
  }

  return true;
}

/**
 * Resolves whether an absolute field path (for example
 * `roomDetails[0].equipementListRoom`) belongs to a currently visible field,
 * using the same conditional semantics as rendering. Nested fields are matched
 * against their container's configs (`objectConfig.fields`/`nestedFields` for
 * object paths, `arrayConfig.objectConfig.fields` for array-item paths) and
 * their conditionals are evaluated against the containing object's or array
 * item's own values — exactly like `ObjectField` and `ArrayField` render them.
 *
 * When a `visibility` context is supplied, the ROOT field's page/tab location
 * must additionally be currently visible (same semantics as the renderer's
 * page/tab navigation) — a required field on a page/tab hidden solely through
 * `pages[].conditional`/`tabs[].conditional` has no reachable instance, so its
 * schema issues must not surface. Nested/item-local conditional resolution is
 * unchanged.
 *
 * Paths that cannot be mapped to a configured field resolve to `true` so schema
 * enforcement stays in place for them.
 */
export function isFieldPathVisible<TFormValues extends FormedibleFormValues>(
  fields: readonly NormalizedFieldConfig<TFormValues>[],
  fieldPath: string,
  values: TFormValues,
  visibility?: FormediblePageTabVisibility<TFormValues>,
): boolean {
  const segments = parseFieldPath(fieldPath);
  const [head] = segments;

  if (visibility && typeof head === 'string') {
    const field = fields.find((candidate) => candidate.name === head);

    if (field && !isFieldLocationVisible(field, fields, visibility, values)) {
      return false;
    }
  }

  return isSegmentPathVisible(fields, segments, values);
}

function objectScopeValues(value: unknown): FormedibleFormValues {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as FormedibleFormValues) : {};
}

function isSegmentPathVisible<TFormValues extends FormedibleFormValues>(
  fields: readonly FormedibleFieldConfig<TFormValues>[],
  segments: readonly FormediblePathSegment[],
  scopeValues: FormedibleFormValues,
): boolean {
  const [head, ...rest] = segments;

  if (typeof head !== 'string') {
    return true;
  }

  const field = fields.find((candidate) => candidate.name === head);

  if (!field) {
    return true;
  }

  if (!evaluateFieldConditional(field.conditional, scopeValues)) {
    return false;
  }

  const [next] = rest;

  if (next === undefined) {
    return true;
  }

  if (typeof next === 'number') {
    const itemFields = field.arrayConfig?.objectConfig?.fields ?? [];

    if (itemFields.length === 0) {
      return true;
    }

    const arrayValue = getValueAtFieldPath(scopeValues, field.name);
    const item = Array.isArray(arrayValue) ? arrayValue[next] : undefined;

    return isSegmentPathVisible(itemFields, rest.slice(1), objectScopeValues(item));
  }

  const objectFields = field.objectConfig?.fields ?? field.nestedFields ?? [];

  if (objectFields.length === 0) {
    return true;
  }

  return isSegmentPathVisible(objectFields, rest, objectScopeValues(getValueAtFieldPath(scopeValues, field.name)));
}
