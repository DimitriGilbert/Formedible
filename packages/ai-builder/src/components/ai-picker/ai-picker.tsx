'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { AiPickerPanel } from '@/components/ai-picker/ai-picker-panel';
import { AiPickerPopover } from '@/components/ai-picker/ai-picker-popover';
import type {
  AIProvider,
  AiPickerProps,
  AiPickerValues,
  ProviderModelCatalog,
  ProviderSecretPersistencePreference,
  ProviderSecrets,
  ProviderSettings,
} from '@/lib/ai-picker-types';
import {
  createDefaultProviderSecrets,
  createDefaultProviderSettings,
  createErrorCatalog,
  mergePickerSchema,
  resolveEffectiveCatalog,
  splitPickerValues,
} from '@/lib/ai-picker-utils';
import { defaultPickerSchema } from '@/lib/default-picker-schema';
import { cn } from '@/lib/utils';

export function valuesToSettings(values: AiPickerValues): ProviderSettings {
  const base = {
    model: values.model,
    temperature: values.temperature,
    maxTokens: values.maxTokens,
  };

  switch (values.provider) {
    case 'openai':
      return { ...base, provider: 'openai' };
    case 'anthropic':
      return { ...base, provider: 'anthropic', thinkingBudgetTokens: values.thinkingBudgetTokens };
    case 'openrouter':
      return { ...base, provider: 'openrouter' };
  }
}

export function valuesToSecrets(values: AiPickerValues): ProviderSecrets {
  return {
    provider: values.provider,
    apiKey: values.apiKey,
  };
}

export function settingsToValues(
  settings: ProviderSettings,
  secrets: ProviderSecrets,
  preference: ProviderSecretPersistencePreference,
): AiPickerValues {
  return {
    provider: settings.provider,
    apiKey: secrets.apiKey,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    thinkingBudgetTokens: settings.provider === 'anthropic' ? settings.thinkingBudgetTokens : undefined,
    storageMode: preference.mode,
    rememberKey: preference.rememberKey,
  };
}

function valuesToPreference(values: AiPickerValues): ProviderSecretPersistencePreference {
  return {
    mode: values.storageMode,
    rememberKey: values.rememberKey,
  };
}

const defaultPersistence: ProviderSecretPersistencePreference = {
  mode: 'memory',
  rememberKey: false,
};

export function AiPicker({
  variant = 'panel',
  settings: settingsProp,
  secrets: secretsProp,
  onChange,
  schema: schemaOverride,
  modelCatalog: modelCatalogProp,
  modelCatalogs,
  isRefreshingModels: isRefreshingModelsProp,
  onRefreshModels: onRefreshModelsProp,
  onFetchModels,
  providerConfigs,
  persistencePreference: persistencePreferenceProp,
  onPersistencePreferenceChange,
  onClearStoredSecrets,
  className,
}: AiPickerProps) {
  // Controlled state is re-derived per render so partially-controlled usage
  // works: settings follow `settingsProp` when provided, secrets follow
  // `secretsProp` when provided, and late-arriving props take effect at once.
  const isSettingsControlled = settingsProp !== undefined;
  const isSecretsControlled = secretsProp !== undefined;

  const [internalSettings, setInternalSettings] = useState<ProviderSettings>(createDefaultProviderSettings());
  const [internalSecrets, setInternalSecrets] = useState<ProviderSecrets>(createDefaultProviderSecrets());
  const [internalPersistence, setInternalPersistence] = useState<ProviderSecretPersistencePreference>(defaultPersistence);
  // Custom schema fields have no typed prop, so their values always live here
  // and ride along the values round-trip instead of being dropped.
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});
  // Fetched catalogs are keyed by provider so switching providers can never
  // surface the previous provider's models, fetchedAt, or error text.
  const [fetchedCatalogs, setFetchedCatalogs] = useState<Readonly<Partial<Record<AIProvider, ProviderModelCatalog>>>>({});
  const [isFetching, setIsFetching] = useState(false);

  const currentSettings = settingsProp ?? internalSettings;
  const currentSecrets = secretsProp ?? internalSecrets;
  const currentPersistence = persistencePreferenceProp ?? internalPersistence;

  const values = useMemo<AiPickerValues>(
    () => ({ ...settingsToValues(currentSettings, currentSecrets, currentPersistence), ...customValues }),
    [currentSettings, currentSecrets, currentPersistence, customValues],
  );

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const mergedSchema = useMemo(
    () => mergePickerSchema(defaultPickerSchema, schemaOverride),
    [schemaOverride],
  );

  const effectiveCatalog = useMemo(
    () => resolveEffectiveCatalog(currentSettings.provider, modelCatalogProp, modelCatalogs, fetchedCatalogs),
    [modelCatalogProp, modelCatalogs, currentSettings.provider, fetchedCatalogs],
  );

  const effectiveIsRefreshing = isRefreshingModelsProp ?? isFetching;

  const handleValuesChange = useCallback((newValues: AiPickerValues) => {
    const { typed, customValues: nextCustomValues } = splitPickerValues(newValues);
    const newSettings = valuesToSettings(typed);
    const newSecrets = valuesToSecrets(typed);
    const newPreference = valuesToPreference(typed);

    setCustomValues(nextCustomValues);

    if (!isSettingsControlled) {
      setInternalSettings(newSettings);
    }

    if (!isSecretsControlled) {
      setInternalSecrets(newSecrets);
    }

    if (persistencePreferenceProp === undefined) {
      setInternalPersistence(newPreference);
    }

    onChange?.(newSettings, newSecrets);
    onPersistencePreferenceChange?.(newPreference);
  }, [isSettingsControlled, isSecretsControlled, persistencePreferenceProp, onChange, onPersistencePreferenceChange]);

  const handleRefreshModels = useCallback(() => {
    if (!onFetchModels) {
      onRefreshModelsProp?.();
      return;
    }

    const current = valuesRef.current;
    const provider = current.provider;
    setIsFetching(true);
    onFetchModels(provider, current.apiKey)
      .then((catalog) => {
        setFetchedCatalogs((previous) => ({ ...previous, [catalog.provider]: catalog }));
      })
      .catch((error: unknown) => {
        console.error(`Failed to refresh ${provider} models:`, error);
        setFetchedCatalogs((previous) => ({
          ...previous,
          [provider]: createErrorCatalog(provider, previous[provider], error),
        }));
      })
      .finally(() => setIsFetching(false));
  }, [onFetchModels, onRefreshModelsProp]);

  const panelProps = useMemo(() => ({
    schema: mergedSchema,
    values,
    onChange: handleValuesChange,
    modelCatalog: effectiveCatalog,
    isRefreshingModels: effectiveIsRefreshing,
    onRefreshModels: onFetchModels ? handleRefreshModels : onRefreshModelsProp,
    providerConfigs,
    onClearStoredSecrets,
    className: cn(className),
  }), [mergedSchema, values, handleValuesChange, effectiveCatalog, effectiveIsRefreshing, onFetchModels, handleRefreshModels, onRefreshModelsProp, providerConfigs, onClearStoredSecrets, className]);

  if (variant === 'popover') {
    return <AiPickerPopover {...panelProps} />;
  }

  return <AiPickerPanel {...panelProps} />;
}
