/**
 * The built-in strings for the engine's injectable message surface (the
 * interface lives in `@/lib/formedible/types` as `FormedibleFormMessages`).
 *
 * The engine issues a small set of English strings of its own: built-in
 * validation messages ("X is required", email/url format, min/max/maxLength),
 * fallback messages for configured validators ("Invalid value", "Invalid
 * field combination"), the validation summary sentence, the "Step N" page
 * title fallback, and the Collapse/Expand section toggle fallbacks. Consumers
 * localizing respondent-facing surfaces override any subset through
 * `useFormedible({ messages })` — unoverridden keys keep the built-in
 * English strings, so existing behavior is unchanged unless an override is
 * supplied.
 */

import type { FormedibleFormMessages, FormedibleValidationMessages } from '@/lib/formedible/types';

export const defaultFormedibleValidationMessages: FormedibleValidationMessages = {
  requiredField: ({ fieldLabel }) => `${fieldLabel} is required`,
  invalidEmail: () => 'Please enter a valid email address',
  invalidUrl: () => 'Please enter a valid URL',
  maxLength: ({ maxLength }) => `Must be at most ${maxLength} characters`,
  numberMin: ({ min }) => `Must be at least ${min}`,
  numberMax: ({ max }) => `Must be at most ${max}`,
  invalidValue: () => 'Invalid value',
  invalidFieldCombination: () => 'Invalid field combination',
};

export const defaultFormedibleFormMessages: FormedibleFormMessages = {
  ...defaultFormedibleValidationMessages,
  validationSummary: ({ count }) => `Please fix ${count} invalid ${count === 1 ? 'field' : 'fields'}.`,
  pageFallbackTitle: ({ pageNumber }) => `Step ${pageNumber}`,
  collapseSection: () => 'Collapse',
  expandSection: () => 'Expand',
};

/** Merges a partial override over the built-in validation messages. */
export function resolveFormedibleValidationMessages(override?: Partial<FormedibleValidationMessages>): FormedibleValidationMessages {
  return override === undefined ? defaultFormedibleValidationMessages : { ...defaultFormedibleValidationMessages, ...override };
}

/** Merges a partial override over the built-in form messages. */
export function resolveFormedibleFormMessages(override?: Partial<FormedibleFormMessages>): FormedibleFormMessages {
  return override === undefined ? defaultFormedibleFormMessages : { ...defaultFormedibleFormMessages, ...override };
}
