import { createElement } from 'react';
import type { ReactNode } from 'react';

import type { FormedibleFieldOption, FormedibleFormValues, FormedibleOptionConfig, NormalizedFieldConfig } from '@/lib/formedible/types';

export function normalizeOption(option: FormedibleFieldOption): FormedibleOptionConfig {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function labelToText(label: ReactNode): string {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
}

export function hasDatalistOptions(options: readonly FormedibleFieldOption[] | undefined): options is readonly FormedibleFieldOption[] {
  return Array.isArray(options) && options.length > 0;
}

// Element-builder twin of the JSX used elsewhere; createElement is required
// here because this shared module stays extension-agnostic (.ts) for its other
// pure helpers. The produced elements are identical to the JSX form.
export function renderDatalistOptions(id: string, options: readonly FormedibleFieldOption[] | undefined) {
  if (!hasDatalistOptions(options)) {
    return undefined;
  }

  return createElement(
    'datalist',
    { id },
    options.map((option) => {
      if (typeof option === 'string') {
        return createElement('option', { key: option, value: option });
      }

      return createElement('option', { key: option.value, value: option.value, disabled: option.disabled }, option.label);
    }),
  );
}

export function resolveFieldOptions<TFormValues extends FormedibleFormValues>(
  fieldConfig: NormalizedFieldConfig<TFormValues>,
  formValues: FormedibleFormValues | undefined,
): readonly FormedibleOptionConfig[] {
  const options = typeof fieldConfig.options === 'function' ? fieldConfig.options((formValues ?? {}) as TFormValues) : fieldConfig.options;

  return Array.isArray(options) ? options.map(normalizeOption) : [];
}

export function getStringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

export function getNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
