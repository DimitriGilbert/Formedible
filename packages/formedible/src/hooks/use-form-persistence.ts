import { useCallback, useEffect, useRef } from 'react';
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

export interface FormPersistenceRuntimeOptions<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly currentPage?: number;
  readonly totalPages?: number;
  readonly setCurrentPage?: (page: number) => void;
  /**
   * Live form-values snapshot (store-subscribed by the host) driving autosave
   * scheduling. Falls back to reading `form.state.values` at render time when
   * the caller does not subscribe.
   */
  readonly values?: TFormValues;
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

function buildPersistedValuesSignature<TFormValues extends FormedibleFormValues>(values: TFormValues, exclude: readonly string[] | undefined) {
  return JSON.stringify(withoutPersistedFields(values, exclude));
}

/**
 * Substantive identity of a persistence config: object identity churns on every
 * host render for inline configs, so guards key on these fields instead.
 */
function buildPersistenceConfigKey<TFormValues extends FormedibleFormValues>(config: FormediblePersistenceConfig<TFormValues> | undefined) {
  if (!config) {
    return '';
  }

  return JSON.stringify({
    key: config.key,
    storage: config.storage ?? 'sessionStorage',
    restoreOnMount: config.restoreOnMount ?? false,
    exclude: config.exclude ?? [],
  });
}

export function useFormPersistence<TFormValues extends FormedibleFormValues>(
  form: FormPersistenceApi<TFormValues>,
  config: FormediblePersistenceConfig<TFormValues> | undefined,
  options: FormPersistenceRuntimeOptions<TFormValues> = {},
) {
  const { currentPage, setCurrentPage, totalPages, values: subscribedValues } = options;
  const liveValues = subscribedValues ?? form.state.values;
  const persistedValuesSignature = config ? buildPersistedValuesSignature(liveValues, config.exclude) : '';
  const persistenceConfigKey = buildPersistenceConfigKey(config);
  const latestConfigRef = useRef(config);
  latestConfigRef.current = config;
  const latestCurrentPageRef = useRef(currentPage);
  latestCurrentPageRef.current = currentPage;

  /**
   * Signature of the last values state acknowledged by the save pipeline
   * (either persisted to storage or adopted as the no-save baseline). While the
   * live values match it, no save is scheduled, so the debounced save scheduled
   * at mount cannot clobber values restored by the restore effect — it adopts
   * the post-restore snapshot instead and the first real save waits for an
   * actual user edit. `clearStorage` also acknowledges the live snapshot so a
   * post-submit reset cannot resurrect a phantom draft.
   */
  const acknowledgedSignatureRef = useRef<string | undefined>(undefined);

  const saveToStorage = useCallback(() => {
    const currentConfig = latestConfigRef.current;
    const storage = getConfiguredStorage(currentConfig);

    if (!storage || !currentConfig) {
      return;
    }

    savePersistedFormPayload(storage, currentConfig.key, createPersistedFormPayload(form.state.values, latestCurrentPageRef.current, currentConfig.exclude));
  }, [form]);

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

    if (parsedValue.currentPage !== undefined && parsedValue.currentPage <= (totalPages ?? parsedValue.currentPage)) {
      setCurrentPage?.(parsedValue.currentPage);
    }

    return parsedValue;
  }, [config, form, setCurrentPage, totalPages]);

  const clearStorage = useCallback(() => {
    const storage = getConfiguredStorage(config);

    if (storage && config) {
      clearPersistedFormPayload(storage, config.key);
      // Acknowledge the live snapshot as the no-save baseline: after a
      // successful submit the host clears the draft and resets to defaults.
      // Without this the reset re-triggers the autosave effect below and a
      // debounced save of the reset (default) values regains a phantom draft
      // right after the key was removed. A later real user edit still differs
      // from this signature and saves normally.
      acknowledgedSignatureRef.current = buildPersistedValuesSignature(form.state.values, config.exclude);
    }
  }, [config, form]);

  /**
   * Restore exactly once per substantive persistence config. Without the guard
   * this effect re-ran on every host re-render (inline `config` objects churn),
   * reverting freshly typed values and snapping the page back to the stored
   * snapshot.
   */
  const restoredConfigKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!config?.restoreOnMount) {
      return;
    }

    if (restoredConfigKeyRef.current === persistenceConfigKey) {
      return;
    }

    restoredConfigKeyRef.current = persistenceConfigKey;
    loadFromStorage();
  }, [config?.restoreOnMount, persistenceConfigKey, loadFromStorage]);

  useEffect(() => {
    const currentConfig = latestConfigRef.current;

    if (!currentConfig || typeof window === 'undefined') {
      return;
    }

    const liveSignature = buildPersistedValuesSignature(form.state.values, currentConfig.exclude);

    if (acknowledgedSignatureRef.current === undefined) {
      acknowledgedSignatureRef.current = liveSignature;
      return;
    }

    if (liveSignature === acknowledgedSignatureRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const latestSignature = buildPersistedValuesSignature(form.state.values, currentConfig.exclude);

      // A clearStorage() call while this save was pending acknowledged the
      // live snapshot as the no-save baseline; the stale timer must not
      // resurrect the just-removed draft.
      if (latestSignature === acknowledgedSignatureRef.current) {
        return;
      }

      acknowledgedSignatureRef.current = latestSignature;
      saveToStorage();
    }, currentConfig.debounceMs ?? 500);

    return () => window.clearTimeout(timeout);
  }, [persistedValuesSignature, form, saveToStorage]);

  return { saveToStorage, loadFromStorage, clearStorage };
}
