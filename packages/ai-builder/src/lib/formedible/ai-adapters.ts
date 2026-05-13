import type { AnyTextAdapter } from '@tanstack/ai';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import type { AnthropicTextProviderOptions } from '@tanstack/ai-anthropic';
import { createOpenaiChat } from '@tanstack/ai-openai';
import type { OpenAITextProviderOptions } from '@tanstack/ai-openai';
import { createOpenRouterText } from '@tanstack/ai-openrouter';
import type { OpenRouterTextModelOptions } from '@tanstack/ai-openrouter';

import type { AIProvider, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';

export type OpenAIAdapterModel = Parameters<typeof createOpenaiChat>[0];
export type AnthropicAdapterModel = Parameters<typeof createAnthropicChat>[0];
export type OpenRouterAdapterModel = Parameters<typeof createOpenRouterText>[0];

export const SUPPORTED_TANSTACK_AI_PROVIDERS = ['openai', 'anthropic', 'openrouter'] as const satisfies readonly AIProvider[];

export const DEFAULT_TANSTACK_AI_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-5',
  openrouter: 'openai/gpt-4o-mini',
} as const satisfies {
  readonly openai: OpenAIAdapterModel;
  readonly anthropic: AnthropicAdapterModel;
  readonly openrouter: OpenRouterAdapterModel;
};

const SUPPORTED_OPENAI_MODELS = [
  DEFAULT_TANSTACK_AI_MODELS.openai,
  'gpt-4o',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'o3-mini',
] as const satisfies readonly OpenAIAdapterModel[];

const SUPPORTED_ANTHROPIC_MODELS = [
  DEFAULT_TANSTACK_AI_MODELS.anthropic,
  'claude-opus-4-6',
  'claude-opus-4-5',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'claude-opus-4-1',
  'claude-sonnet-4',
  'claude-3-7-sonnet',
  'claude-opus-4',
  'claude-3-5-haiku',
  'claude-3-haiku',
  'claude-opus-4.6-fast',
  'claude-opus-4.7',
] as const satisfies readonly AnthropicAdapterModel[];

const SUPPORTED_OPENROUTER_MODELS = [
  DEFAULT_TANSTACK_AI_MODELS.openrouter,
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.7-sonnet',
  'meta-llama/llama-3.3-70b-instruct',
] as const satisfies readonly OpenRouterAdapterModel[];

export interface AiProviderFeatureSupport {
  readonly temperature: boolean;
  readonly maxTokens: boolean;
  readonly thinkingBudgetTokens: boolean;
}

export const AI_PROVIDER_FEATURE_SUPPORT = {
  openai: {
    temperature: true,
    maxTokens: true,
    thinkingBudgetTokens: false,
  },
  anthropic: {
    temperature: true,
    maxTokens: true,
    thinkingBudgetTokens: true,
  },
  openrouter: {
    temperature: true,
    maxTokens: true,
    thinkingBudgetTokens: false,
  },
} as const satisfies Record<AIProvider, AiProviderFeatureSupport>;

function assertMatchingSecrets(settings: ProviderSettings, secrets: ProviderSecrets): void {
  if (settings.provider !== secrets.provider) {
    throw new Error('Provider settings and secrets must target the same provider.');
  }
}

function assertNoUnsupportedRuntimeOptions(settings: ProviderSettings): void {
  if ('endpoint' in settings || 'baseURL' in settings) {
    throw new Error('Custom provider endpoints are not supported by the AI builder. Select OpenAI, Anthropic, or OpenRouter without endpoint/baseURL overrides.');
  }

  if (settings.provider !== 'anthropic' && 'thinkingBudgetTokens' in settings) {
    throw new Error('Thinking budget tokens are only supported for Anthropic provider settings.');
  }
}

export function createTanStackTextAdapter(settings: ProviderSettings, secrets: ProviderSecrets): AnyTextAdapter {
  assertMatchingSecrets(settings, secrets);
  assertNoUnsupportedRuntimeOptions(settings);

  if (settings.provider === 'openai') {
    return createOpenaiChat(resolveSupportedModel(settings.model, SUPPORTED_OPENAI_MODELS, DEFAULT_TANSTACK_AI_MODELS.openai), secrets.apiKey);
  }

  if (settings.provider === 'anthropic') {
    return createAnthropicChat(resolveSupportedModel(settings.model, SUPPORTED_ANTHROPIC_MODELS, DEFAULT_TANSTACK_AI_MODELS.anthropic), secrets.apiKey);
  }

  return createOpenRouterText(resolveSupportedModel(settings.model, SUPPORTED_OPENROUTER_MODELS, DEFAULT_TANSTACK_AI_MODELS.openrouter), secrets.apiKey);
}

export function createTanStackModelOptions(settings: ProviderSettings): OpenAITextProviderOptions | AnthropicTextProviderOptions | OpenRouterTextModelOptions | undefined {
  assertNoUnsupportedRuntimeOptions(settings);

  if (settings.provider !== 'anthropic' || !settings.thinkingBudgetTokens || settings.thinkingBudgetTokens <= 0) {
    return undefined;
  }

  return {
    thinking: {
      type: 'enabled',
      budget_tokens: settings.thinkingBudgetTokens,
    },
  } satisfies AnthropicTextProviderOptions;
}

function resolveSupportedModel<TModel extends string>(model: string, supportedModels: readonly TModel[], fallbackModel: TModel): TModel {
  return supportedModels.find((supportedModel) => supportedModel === model) ?? fallbackModel;
}
