import type {
  AIProvider,
  AiPickerProviderConfig,
  AiPickerSchema,
  AiPickerSchemaField,
  AiPickerValues,
  ProviderModelCatalog,
  ProviderModelCatalogEntry,
  ProviderModelCatalogs,
  ProviderSecrets,
  ProviderSettings,
} from '@/lib/ai-picker-types';

import { defaultProviderConfigs } from '@/lib/default-picker-schema';

export function createDefaultPickerValues(provider: AIProvider = 'openai'): AiPickerValues {
  const config = resolveProviderConfig(provider);

  return {
    provider: config.value,
    apiKey: '',
    model: config.defaultModel,
    temperature: 0.7,
    maxTokens: 16000,
    storageMode: 'memory',
    rememberKey: false,
  };
}

export function createDefaultProviderSettings(provider: AIProvider = 'openai'): ProviderSettings {
  const config = resolveProviderConfig(provider);

  return {
    provider: config.value,
    model: config.defaultModel,
    temperature: 0.7,
    maxTokens: 16000,
  };
}

export function createDefaultProviderSecrets(provider: AIProvider = 'openai'): ProviderSecrets {
  return {
    provider,
    apiKey: '',
  };
}

export function validateProviderAccess(settings: ProviderSettings | null, secrets: ProviderSecrets | null): string | undefined {
  if (!settings) {
    return 'Provider settings are required.';
  }

  if (!secrets) {
    return 'Provider secrets are required.';
  }

  const provider = defaultProviderConfigs.find((entry) => entry.value === settings.provider);

  if (!provider) {
    return 'Unsupported AI provider.';
  }

  if (settings.provider !== secrets.provider) {
    return 'Provider settings and secrets must target the same provider.';
  }

  if ('endpoint' in settings || 'baseURL' in settings) {
    return 'Custom provider endpoints are not supported. Select OpenAI, Anthropic, or OpenRouter without endpoint/baseURL overrides.';
  }

  if (settings.provider !== 'anthropic' && 'thinkingBudgetTokens' in settings) {
    return 'Thinking budget tokens are only supported for Anthropic.';
  }

  if (provider.requiresKey && secrets.apiKey.trim().length === 0) {
    return `API key is required for ${provider.label}.`;
  }

  return undefined;
}

export function getFilteredModelOptions(
  models: readonly ProviderModelCatalogEntry[],
  query: string,
  selectedModel: string,
): readonly ProviderModelCatalogEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredModels = normalizedQuery.length === 0
    ? models
    : models.filter((model) => `${model.id} ${model.label ?? ''}`.toLowerCase().includes(normalizedQuery));
  const selectedExists = filteredModels.some((model) => model.id === selectedModel) || selectedModel.trim().length === 0;

  return [
    ...(selectedExists ? [] : [{ id: selectedModel, label: 'Current custom model' }]),
    ...filteredModels,
  ].slice(0, 20);
}

export function mergePickerSchema(baseSchema: AiPickerSchema, overrideSchema?: AiPickerSchema): AiPickerSchema {
  if (!overrideSchema) {
    return baseSchema;
  }

  const baseMap = new Map<string, AiPickerSchemaField>();

  for (const field of baseSchema) {
    baseMap.set(field.name, { ...field });
  }

  const result: AiPickerSchemaField[] = [];

  for (const overrideField of overrideSchema) {
    const baseField = baseMap.get(overrideField.name);

    if (baseField) {
      const merged: AiPickerSchemaField = { ...baseField, ...overrideField };
      result.push(merged);
      baseMap.delete(overrideField.name);
    } else {
      result.push({ ...overrideField });
    }
  }

  for (const field of baseMap.values()) {
    result.push(field);
  }

  return result;
}

function resolveProviderConfig(provider: AIProvider) {
  const found = defaultProviderConfigs.find((entry) => entry.value === provider);
  if (found) {
    return found;
  }
  return defaultProviderConfigs[0]!;
}

const typedValueKeys: ReadonlySet<string> = new Set([
  'provider',
  'apiKey',
  'model',
  'temperature',
  'maxTokens',
  'thinkingBudgetTokens',
  'storageMode',
  'rememberKey',
]);

export interface SplitPickerValues {
  readonly typed: AiPickerValues;
  readonly customValues: Record<string, unknown>;
}

/**
 * Splits picker values into the typed settings/secrets keys and the custom
 * schema keys so custom fields survive the values round-trip instead of being
 * dropped by `valuesToSettings`/`valuesToSecrets`.
 */
export function splitPickerValues(values: AiPickerValues): SplitPickerValues {
  const customValues: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (!typedValueKeys.has(key)) {
      customValues[key] = value;
    }
  }

  return {
    typed: {
      provider: values.provider,
      apiKey: values.apiKey,
      model: values.model,
      temperature: values.temperature,
      maxTokens: values.maxTokens,
      thinkingBudgetTokens: values.thinkingBudgetTokens,
      storageMode: values.storageMode,
      rememberKey: values.rememberKey,
    },
    customValues,
  };
}

/**
 * Resolves the effective model catalog for a provider. Every source (explicit
 * prop, per-provider map, fetched catalog) is only honored when its `provider`
 * matches, so switching providers never surfaces another provider's catalog,
 * `fetchedAt`, or error text.
 */
export function resolveEffectiveCatalog(
  provider: AIProvider,
  modelCatalogProp: ProviderModelCatalog | undefined,
  modelCatalogs: ProviderModelCatalogs | undefined,
  fetchedCatalogs: ProviderModelCatalogs,
): ProviderModelCatalog | undefined {
  const candidates = [modelCatalogProp, modelCatalogs?.[provider], fetchedCatalogs[provider]];

  return candidates.find((catalog) => catalog !== undefined && catalog.provider === provider);
}

/**
 * Builds the error-bearing catalog stored when a model refresh rejects,
 * preserving the previous models and `fetchedAt` when available so a failed
 * refresh does not wipe a valid catalog.
 */
export function createErrorCatalog(
  provider: AIProvider,
  previousCatalog: ProviderModelCatalog | undefined,
  error: unknown,
): ProviderModelCatalog {
  const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown error';

  return {
    provider,
    models: previousCatalog?.models ?? [],
    fetchedAt: previousCatalog?.fetchedAt ?? Date.now(),
    error: `Failed to refresh ${provider} models: ${detail}`,
  };
}

/**
 * Applies a provider switch to the picker values: the previous provider's API
 * key is discarded (never re-labeled under the new provider), the model resets
 * to the provider default, and Anthropic-only thinking budget tokens are
 * cleared when leaving Anthropic.
 */
export function applyProviderSwitch(
  values: AiPickerValues,
  nextProvider: AIProvider,
  providerConfigs: readonly AiPickerProviderConfig[],
): AiPickerValues {
  const config = providerConfigs.find((entry) => entry.value === nextProvider) ?? resolveProviderConfig(nextProvider);

  return {
    ...values,
    provider: config.value,
    apiKey: '',
    model: config.defaultModel,
    ...(config.value !== 'anthropic' ? { thinkingBudgetTokens: undefined } : {}),
  };
}
