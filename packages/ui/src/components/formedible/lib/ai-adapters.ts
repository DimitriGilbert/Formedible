import type { AnyTextAdapter } from '@tanstack/ai';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import type { AnthropicTextProviderOptions } from '@tanstack/ai-anthropic';
import { createOpenaiChat } from '@tanstack/ai-openai';
import type { OpenAITextProviderOptions } from '@tanstack/ai-openai';
import { createOpenRouterText } from '@tanstack/ai-openrouter';
import type { OpenRouterTextModelOptions } from '@tanstack/ai-openrouter';

import type { AIProvider, AnthropicProviderSettings, ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';

export type OpenAIAdapterModel = Parameters<typeof createOpenaiChat>[0];
export type AnthropicAdapterModel = Parameters<typeof createAnthropicChat>[0];
export type OpenRouterAdapterModel = Parameters<typeof createOpenRouterText>[0];

export const SUPPORTED_TANSTACK_AI_PROVIDERS = ['openai', 'anthropic', 'openrouter'] as const satisfies readonly AIProvider[];

export const DEFAULT_TANSTACK_AI_MODELS = {
  openai: 'gpt-5.4-mini',
  anthropic: 'claude-sonnet-4-6',
  openrouter: 'minimax/minimax-m2.7',
} as const satisfies {
  readonly openai: string;
  readonly anthropic: string;
  readonly openrouter: string;
};

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
    return createOpenaiChat(settings.model as unknown as OpenAIAdapterModel, secrets.apiKey, { dangerouslyAllowBrowser: true });
  }

  if (settings.provider === 'anthropic') {
    return createAnthropicChat(settings.model as unknown as AnthropicAdapterModel, secrets.apiKey, { dangerouslyAllowBrowser: true });
  }

  return createOpenRouterText(settings.model as unknown as OpenRouterAdapterModel, secrets.apiKey);
}

export function isAnthropicThinkingEnabled(settings: ProviderSettings): settings is AnthropicProviderSettings & { readonly thinkingBudgetTokens: number } {
  return settings.provider === 'anthropic' && typeof settings.thinkingBudgetTokens === 'number' && settings.thinkingBudgetTokens > 0;
}

export function createTanStackModelOptions(settings: ProviderSettings): OpenAITextProviderOptions | AnthropicTextProviderOptions | OpenRouterTextModelOptions {
  assertNoUnsupportedRuntimeOptions(settings);

  if (settings.provider === 'openai') {
    return {
      ...(settings.temperature === undefined ? {} : { temperature: settings.temperature }),
      ...(settings.maxTokens === undefined ? {} : { max_output_tokens: settings.maxTokens }),
    } satisfies OpenAITextProviderOptions;
  }

  if (settings.provider === 'openrouter') {
    return {
      ...(settings.temperature === undefined ? {} : { temperature: settings.temperature }),
      ...(settings.maxTokens === undefined ? {} : { maxCompletionTokens: settings.maxTokens }),
    } satisfies OpenRouterTextModelOptions;
  }

  if (!isAnthropicThinkingEnabled(settings)) {
    return {
      ...(settings.temperature === undefined ? {} : { temperature: settings.temperature }),
      ...(settings.maxTokens === undefined ? {} : { max_tokens: settings.maxTokens }),
    } satisfies AnthropicTextProviderOptions;
  }

  return {
    // Anthropic rejects any temperature other than 1 while extended thinking is
    // enabled, so the parameter must be omitted from the request instead of
    // forced to a fixed value.
    ...(settings.maxTokens === undefined ? {} : { max_tokens: settings.maxTokens }),
    thinking: {
      type: 'enabled',
      budget_tokens: settings.thinkingBudgetTokens,
    },
  } satisfies AnthropicTextProviderOptions;
}
