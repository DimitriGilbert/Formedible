import type { ReactNode } from 'react';

import type { FormedibleFieldOption, FormedibleFormValues, FormedibleOptionConfig, NormalizedFieldConfig } from '@formedible/ui/components/formedible/lib/types';

export function normalizeOption(option: FormedibleFieldOption): FormedibleOptionConfig {
  return typeof option === 'string' ? { value: option, label: option } : option;
}

export function labelToText(label: ReactNode): string {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
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
