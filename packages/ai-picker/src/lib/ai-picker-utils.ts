import type {
  AIProvider,
  AiPickerSchema,
  AiPickerSchemaField,
  AiPickerValues,
  ProviderModelCatalogEntry,
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
