'use client';

import type { AIProvider, ProviderModelCatalog, ProviderModelCatalogEntry } from '@/lib/formedible/ai-types';

export const MODEL_CATALOG_MAX_AGE_MONTHS = 6;

const anthropicModelMaxPages = 20;

interface FetchProviderModelsInput {
  readonly provider: AIProvider;
  readonly apiKey: string;
  readonly now?: number;
  readonly fetcher?: typeof fetch;
}

interface OpenRouterModelResponse {
  readonly data: readonly OpenRouterModel[];
}

interface OpenRouterModel {
  readonly id: string;
  readonly name?: string;
  readonly created?: number;
  readonly architecture?: {
    readonly output_modalities?: readonly string[];
  };
  readonly context_length?: number | null;
  readonly pricing?: {
    readonly prompt?: string;
    readonly completion?: string;
  };
}

interface OpenAIModelResponse {
  readonly data: readonly OpenAIModel[];
}

interface OpenAIModel {
  readonly id: string;
  readonly created?: number;
  readonly owned_by?: string;
}

interface AnthropicModelResponse {
  readonly data: readonly AnthropicModel[];
  readonly has_more?: boolean;
  readonly last_id?: string;
}

interface AnthropicModel {
  readonly id: string;
  readonly display_name?: string;
  readonly created_at?: string;
  readonly max_input_tokens?: number;
  readonly max_tokens?: number;
}

export async function fetchProviderModels({ provider, apiKey, now = Date.now(), fetcher = fetch }: FetchProviderModelsInput): Promise<ProviderModelCatalog> {
  const trimmedApiKey = apiKey.trim();

  if (!trimmedApiKey) {
    return createErrorCatalog(provider, now, 'API key is required to refresh models.');
  }

  try {
    if (provider === 'openrouter') {
      return createCatalog(provider, await fetchOpenRouterModels(trimmedApiKey, now, fetcher), now);
    }

    if (provider === 'anthropic') {
      return createCatalog(provider, await fetchAnthropicModels(trimmedApiKey, now, fetcher), now);
    }

    return createCatalog(provider, await fetchOpenAIModels(trimmedApiKey, now, fetcher), now);
  } catch (error: unknown) {
    return createErrorCatalog(provider, now, error instanceof Error ? error.message : 'Unable to refresh models.');
  }
}

export function getRecentModelCutoff(now: number): number {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - MODEL_CATALOG_MAX_AGE_MONTHS);

  return cutoff.getTime();
}

export function isRecentUnixTimestamp(created: number | undefined, now: number): boolean {
  return typeof created === 'number' && Number.isFinite(created) && created * 1000 >= getRecentModelCutoff(now);
}

export function isRecentIsoTimestamp(createdAt: string | undefined, now: number): boolean {
  if (!createdAt) {
    return false;
  }

  const parsedTimestamp = Date.parse(createdAt);
  return Number.isFinite(parsedTimestamp) && parsedTimestamp >= getRecentModelCutoff(now);
}

function createCatalog(provider: AIProvider, models: readonly ProviderModelCatalogEntry[], now: number): ProviderModelCatalog {
  return {
    provider,
    models: Array.from(dedupeModelEntries(models)).sort(sortModelsByCreatedAtDesc),
    fetchedAt: now,
  };
}

function createErrorCatalog(provider: AIProvider, now: number, error: string): ProviderModelCatalog {
  return {
    provider,
    models: [],
    fetchedAt: now,
    error,
  };
}

async function fetchOpenRouterModels(apiKey: string, now: number, fetcher: typeof fetch): Promise<readonly ProviderModelCatalogEntry[]> {
  const response = await fetcher('https://openrouter.ai/api/v1/models?output_modalities=text', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await readJsonResponse<OpenRouterModelResponse>(response);

  return data.data
    .filter((model) => isRecentUnixTimestamp(model.created, now))
    .filter((model) => model.architecture?.output_modalities?.includes('text') ?? true)
    .map((model) => ({
      id: model.id,
      ...(model.name ? { label: model.name } : {}),
      ...(model.created ? { createdAt: new Date(model.created * 1000).toISOString() } : {}),
      ...(typeof model.context_length === 'number' ? { contextLength: model.context_length } : {}),
      ...(model.pricing?.prompt ? { inputPricePerMillionTokens: model.pricing.prompt } : {}),
      ...(model.pricing?.completion ? { outputPricePerMillionTokens: model.pricing.completion } : {}),
    }));
}

async function fetchOpenAIModels(apiKey: string, now: number, fetcher: typeof fetch): Promise<readonly ProviderModelCatalogEntry[]> {
  const response = await fetcher('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await readJsonResponse<OpenAIModelResponse>(response);

  return data.data
    .filter((model) => isRecentUnixTimestamp(model.created, now))
    .map((model) => ({
      id: model.id,
      ...(model.owned_by ? { label: model.owned_by } : {}),
      ...(model.created ? { createdAt: new Date(model.created * 1000).toISOString() } : {}),
    }));
}

async function fetchAnthropicModels(apiKey: string, now: number, fetcher: typeof fetch): Promise<readonly ProviderModelCatalogEntry[]> {
  const models: AnthropicModel[] = [];
  let afterId: string | undefined;
  let pageCount = 0;

  do {
    pageCount += 1;
    const url = new URL('https://api.anthropic.com/v1/models');
    url.searchParams.set('limit', '1000');

    if (afterId) {
      url.searchParams.set('after_id', afterId);
    }

    const response = await fetcher(url.toString(), {
      headers: {
        // Required for the browser preflight to pass; without it Anthropic responds
        // with HTTP 400 "Disallowed CORS origin" on the OPTIONS request.
        'anthropic-dangerous-direct-browser-access': 'true',
        'anthropic-version': '2023-06-01',
        'X-Api-Key': apiKey,
      },
    });
    const data = await readJsonResponse<AnthropicModelResponse>(response);

    models.push(...data.data);
    const nextAfterId = data.has_more ? data.last_id : undefined;

    if (nextAfterId === undefined || nextAfterId === afterId || pageCount >= anthropicModelMaxPages) {
      afterId = undefined;
    } else {
      afterId = nextAfterId;
    }
  } while (afterId);

  return models
    .filter((model) => isRecentIsoTimestamp(model.created_at, now))
    .map((model) => ({
      id: model.id,
      ...(model.display_name ? { label: model.display_name } : {}),
      ...(model.created_at ? { createdAt: model.created_at } : {}),
      ...(typeof model.max_input_tokens === 'number' ? { contextLength: model.max_input_tokens } : {}),
    }));
}

async function readJsonResponse<TValue>(response: Response): Promise<TValue> {
  if (!response.ok) {
    throw new Error(`Model refresh failed with HTTP ${response.status}.`);
  }

  return await response.json() as TValue;
}

function dedupeModelEntries(models: readonly ProviderModelCatalogEntry[]): readonly ProviderModelCatalogEntry[] {
  const entries = new Map<string, ProviderModelCatalogEntry>();

  for (const model of models) {
    if (!entries.has(model.id)) {
      entries.set(model.id, model);
    }
  }

  return Array.from(entries.values());
}

function sortModelsByCreatedAtDesc(left: ProviderModelCatalogEntry, right: ProviderModelCatalogEntry): number {
  return parseModelDate(right.createdAt) - parseModelDate(left.createdAt);
}

function parseModelDate(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsedValue = Date.parse(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
