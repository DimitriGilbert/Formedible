import type { AnyTextAdapter } from '@tanstack/ai';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import { createOpenaiChat } from '@tanstack/ai-openai';
import { createOpenRouterText } from '@tanstack/ai-openrouter';

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
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'meta-llama/llama-3.3-70b-instruct',
] as const satisfies readonly OpenRouterAdapterModel[];

function assertMatchingSecrets(settings: ProviderSettings, secrets: ProviderSecrets): void {
  if (settings.provider !== secrets.provider) {
    throw new Error('Provider settings and secrets must target the same provider.');
  }
}

export function createTanStackTextAdapter(settings: ProviderSettings, secrets: ProviderSecrets): AnyTextAdapter {
  assertMatchingSecrets(settings, secrets);

  if (settings.provider === 'openai') {
    return createOpenaiChat(resolveSupportedModel(settings.model, SUPPORTED_OPENAI_MODELS, DEFAULT_TANSTACK_AI_MODELS.openai), secrets.apiKey);
  }

  if (settings.provider === 'anthropic') {
    return createAnthropicChat(resolveSupportedModel(settings.model, SUPPORTED_ANTHROPIC_MODELS, DEFAULT_TANSTACK_AI_MODELS.anthropic), secrets.apiKey);
  }

  return createOpenRouterText(resolveSupportedModel(settings.model, SUPPORTED_OPENROUTER_MODELS, DEFAULT_TANSTACK_AI_MODELS.openrouter), secrets.apiKey);
}

function resolveSupportedModel<TModel extends string>(model: string, supportedModels: readonly TModel[], fallbackModel: TModel): TModel {
  return supportedModels.find((supportedModel) => supportedModel === model) ?? fallbackModel;
}
