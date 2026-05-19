'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '@formedible/ui/lib/utils';

import { AiPickerPanel } from '@formedible/ui/components/formedible/ai-picker/components/ai-picker-panel';
import { AiPickerPopover } from '@formedible/ui/components/formedible/ai-picker/components/ai-picker-popover';
import type {
  AiPickerProps,
  AiPickerValues,
  ProviderModelCatalog,
  ProviderSecretPersistencePreference,
  ProviderSecrets,
  ProviderSettings,
} from '@formedible/ui/components/formedible/ai-picker/lib/ai-picker-types';
import { createDefaultProviderSecrets, createDefaultProviderSettings, mergePickerSchema } from '@formedible/ui/components/formedible/ai-picker/lib/ai-picker-utils';
import { defaultPickerSchema } from '@formedible/ui/components/formedible/ai-picker/lib/default-picker-schema';

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
  persistencePreference: persistencePreferenceProp,
  onPersistencePreferenceChange,
  className,
}: AiPickerProps) {
  const isControlled = useRef(settingsProp !== undefined && secretsProp !== undefined);

  const [internalSettings, setInternalSettings] = useState<ProviderSettings>(createDefaultProviderSettings());
  const [internalSecrets, setInternalSecrets] = useState<ProviderSecrets>(createDefaultProviderSecrets());
  const [internalPersistence, setInternalPersistence] = useState<ProviderSecretPersistencePreference>(defaultPersistence);
  const [fetchedCatalog, setFetchedCatalog] = useState<ProviderModelCatalog | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);

  const currentSettings = isControlled.current ? settingsProp! : internalSettings;
  const currentSecrets = isControlled.current ? secretsProp! : internalSecrets;
  const currentPersistence = persistencePreferenceProp ?? internalPersistence;

  const values = useMemo(
    () => settingsToValues(currentSettings, currentSecrets, currentPersistence),
    [currentSettings, currentSecrets, currentPersistence],
  );

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const mergedSchema = useMemo(
    () => mergePickerSchema(defaultPickerSchema, schemaOverride),
    [schemaOverride],
  );

  const effectiveCatalog = useMemo(
    () => modelCatalogProp ?? modelCatalogs?.[currentSettings.provider] ?? fetchedCatalog,
    [modelCatalogProp, modelCatalogs, currentSettings.provider, fetchedCatalog],
  );

  const effectiveIsRefreshing = isRefreshingModelsProp ?? isFetching;

  const handleValuesChange = useCallback((newValues: AiPickerValues) => {
    const newSettings = valuesToSettings(newValues);
    const newSecrets = valuesToSecrets(newValues);
    const newPreference = valuesToPreference(newValues);

    if (!isControlled.current) {
      setInternalSettings(newSettings);
      setInternalSecrets(newSecrets);
      setInternalPersistence(newPreference);
    }

    onChange?.(newSettings, newSecrets);
    onPersistencePreferenceChange?.(newPreference);
  }, [onChange, onPersistencePreferenceChange]);

  const handleRefreshModels = useCallback(() => {
    if (!onFetchModels) {
      onRefreshModelsProp?.();
      return;
    }

    const current = valuesRef.current;
    setIsFetching(true);
    onFetchModels(current.provider, current.apiKey)
      .then((catalog) => setFetchedCatalog(catalog))
      .catch(() => setFetchedCatalog(undefined))
      .finally(() => setIsFetching(false));
  }, [onFetchModels, onRefreshModelsProp]);

  const panelProps = useMemo(() => ({
    schema: mergedSchema,
    values,
    onChange: handleValuesChange,
    modelCatalog: effectiveCatalog,
    isRefreshingModels: effectiveIsRefreshing,
    onRefreshModels: onFetchModels ? handleRefreshModels : onRefreshModelsProp,
    className: cn(className),
  }), [mergedSchema, values, handleValuesChange, effectiveCatalog, effectiveIsRefreshing, onFetchModels, handleRefreshModels, onRefreshModelsProp, className]);

  if (variant === 'popover') {
    return <AiPickerPopover {...panelProps} />;
  }

  return <AiPickerPanel {...panelProps} />;
}
