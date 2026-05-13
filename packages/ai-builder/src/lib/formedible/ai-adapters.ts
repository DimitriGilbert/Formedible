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

function assertMatchingSecrets(settings: ProviderSettings, secrets: ProviderSecrets): void {
  if (settings.provider !== secrets.provider) {
    throw new Error('Provider settings and secrets must target the same provider.');
  }
}

export function createTanStackTextAdapter(settings: ProviderSettings, secrets: ProviderSecrets): AnyTextAdapter {
  assertMatchingSecrets(settings, secrets);

  if (settings.provider === 'openai') {
    return createOpenaiChat((settings.model || DEFAULT_TANSTACK_AI_MODELS.openai) as OpenAIAdapterModel, secrets.apiKey);
  }

  if (settings.provider === 'anthropic') {
    return createAnthropicChat((settings.model || DEFAULT_TANSTACK_AI_MODELS.anthropic) as AnthropicAdapterModel, secrets.apiKey);
  }

  return createOpenRouterText((settings.model || DEFAULT_TANSTACK_AI_MODELS.openrouter) as OpenRouterAdapterModel, secrets.apiKey);
}
