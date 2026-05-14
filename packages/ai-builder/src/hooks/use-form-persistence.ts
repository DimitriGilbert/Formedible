import { useCallback, useEffect } from 'react';
import type { DeepKeys, DeepValue, Updater } from '@tanstack/react-form';

import type { FormedibleFormValues, FormediblePersistenceConfig } from '@/lib/formedible/types';

export interface FormPersistenceApi<TFormValues extends FormedibleFormValues> {
  readonly state: { readonly values: TFormValues };
  readonly setFieldValue: <TField extends DeepKeys<TFormValues>>(field: TField, value: Updater<DeepValue<TFormValues, TField>>) => void;
}

export interface PersistedFormPayload<TFormValues extends FormedibleFormValues> {
  readonly values: Partial<TFormValues>;
  readonly timestamp: number;
  readonly currentPage?: number;
}

export interface FormPersistenceRuntimeOptions {
  readonly currentPage?: number;
  readonly totalPages?: number;
  readonly setCurrentPage?: (page: number) => void;
}

export function getConfiguredStorage(config: FormediblePersistenceConfig | undefined) {
  if (!config || typeof window === 'undefined') {
    return undefined;
  }

  return config.storage === 'localStorage' ? window.localStorage : window.sessionStorage;
}

export function withoutPersistedFields<TFormValues extends FormedibleFormValues>(values: TFormValues, exclude: readonly string[] = []) {
  const excluded = new Set(exclude);

  return Object.fromEntries(Object.entries(values).filter(([key]) => !excluded.has(key))) as Partial<TFormValues>;
}

export function createPersistedFormPayload<TFormValues extends FormedibleFormValues>(
  values: TFormValues,
  currentPage: number | undefined,
  exclude: readonly string[] = [],
): PersistedFormPayload<TFormValues> {
  const payload: PersistedFormPayload<TFormValues> = {
    values: withoutPersistedFields(values, exclude),
    timestamp: Date.now(),
  };

  if (currentPage !== undefined) {
    return { ...payload, currentPage };
  }

  return payload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parsePersistedFormPayload<TFormValues extends FormedibleFormValues>(storedValue: string): PersistedFormPayload<TFormValues> | undefined {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isRecord(parsedValue) || !isRecord(parsedValue.values) || typeof parsedValue.timestamp !== 'number') {
      return undefined;
    }

    const payload: PersistedFormPayload<TFormValues> = {
      values: parsedValue.values as Partial<TFormValues>,
      timestamp: parsedValue.timestamp,
    };

    if (typeof parsedValue.currentPage === 'number') {
      return { ...payload, currentPage: parsedValue.currentPage };
    }

    return payload;
  } catch {
    return undefined;
  }
}

export function savePersistedFormPayload<TFormValues extends FormedibleFormValues>(storage: Storage, key: string, payload: PersistedFormPayload<TFormValues>) {
  storage.setItem(key, JSON.stringify(payload));
}

export function loadPersistedFormPayload<TFormValues extends FormedibleFormValues>(storage: Storage, key: string) {
  const storedValue = storage.getItem(key);

  return storedValue ? parsePersistedFormPayload<TFormValues>(storedValue) : undefined;
}

export function clearPersistedFormPayload(storage: Storage, key: string) {
  storage.removeItem(key);
}

export function useFormPersistence<TFormValues extends FormedibleFormValues>(
  form: FormPersistenceApi<TFormValues>,
  config: FormediblePersistenceConfig<TFormValues> | undefined,
  options: FormPersistenceRuntimeOptions = {},
) {
  const saveToStorage = useCallback(() => {
    const storage = getConfiguredStorage(config);

    if (!storage || !config) {
      return;
    }

    savePersistedFormPayload(storage, config.key, createPersistedFormPayload(form.state.values, options.currentPage, config.exclude));
  }, [config, form, options.currentPage]);

  const loadFromStorage = useCallback(() => {
    const storage = getConfiguredStorage(config);

    if (!storage || !config) {
      return undefined;
    }

    const parsedValue = loadPersistedFormPayload<TFormValues>(storage, config.key);

    if (!parsedValue) {
      return undefined;
    }

    for (const [fieldName, fieldValue] of Object.entries(parsedValue.values)) {
      const typedFieldName = fieldName as DeepKeys<TFormValues>;

      form.setFieldValue(typedFieldName, fieldValue as Updater<DeepValue<TFormValues, typeof typedFieldName>>);
    }

    if (parsedValue.currentPage !== undefined && parsedValue.currentPage <= (options.totalPages ?? parsedValue.currentPage)) {
      options.setCurrentPage?.(parsedValue.currentPage);
    }

    return parsedValue;
  }, [config, form, options]);

  const clearStorage = useCallback(() => {
    const storage = getConfiguredStorage(config);

    if (storage && config) {
      clearPersistedFormPayload(storage, config.key);
    }
  }, [config]);

  useEffect(() => {
    if (config?.restoreOnMount) {
      loadFromStorage();
    }
  }, [config?.restoreOnMount, loadFromStorage]);

  useEffect(() => {
    if (!config) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const timeout = window.setTimeout(saveToStorage, config.debounceMs ?? 500);

    return () => window.clearTimeout(timeout);
  }, [config, form.state.values, saveToStorage]);

  return { saveToStorage, loadFromStorage, clearStorage };
}
