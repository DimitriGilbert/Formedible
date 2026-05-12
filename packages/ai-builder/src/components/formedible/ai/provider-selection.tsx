'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AIProvider, ProviderConfig } from '@/lib/formedible/ai-types';
import { cn } from '@/lib/utils';

export const providerOptions = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-3-5-sonnet-latest', requiresKey: true },
  { value: 'google', label: 'Google Gemini', defaultModel: 'gemini-1.5-pro', requiresKey: true },
  { value: 'mistral', label: 'Mistral', defaultModel: 'mistral-large-latest', requiresKey: true },
  { value: 'openrouter', label: 'OpenRouter', defaultModel: 'openai/gpt-4o-mini', requiresKey: true },
  { value: 'openai-compatible', label: 'OpenAI Compatible', defaultModel: 'gpt-4o-mini', requiresKey: false },
] as const satisfies readonly { readonly value: AIProvider; readonly label: string; readonly defaultModel: string; readonly requiresKey: boolean }[];

export interface ProviderSelectionProps {
  readonly value: ProviderConfig;
  readonly onChange: (value: ProviderConfig) => void;
  readonly className?: string;
}

export function createDefaultProviderConfig(provider: AIProvider = 'openai'): ProviderConfig {
  const option = providerOptions.find((entry) => entry.value === provider) ?? providerOptions[0];

  return {
    provider: option.value,
    model: option.defaultModel,
    apiKey: '',
    temperature: 0.7,
    maxTokens: 4000,
  };
}

export function validateProviderConfig(config: ProviderConfig | null): string | undefined {
  if (!config) {
    return 'Provider configuration is required.';
  }

  const provider = providerOptions.find((entry) => entry.value === config.provider);

  if (!provider) {
    return 'Unsupported AI provider.';
  }

  if (provider.requiresKey && config.apiKey.trim().length === 0) {
    return `API key is required for ${provider.label}.`;
  }

  if (config.provider === 'openai-compatible' && (!config.endpoint || config.endpoint.trim().length === 0)) {
    return 'Endpoint is required for OpenAI-compatible provider.';
  }

  return undefined;
}

export function ProviderSelection({ value, onChange, className }: ProviderSelectionProps) {
  return (
    <div className={cn('grid gap-3 rounded-lg border p-3', className)}>
      <label className="grid gap-1 text-sm font-medium">
        Provider
        <Select
          value={value.provider}
          onValueChange={(providerValue) => {
            const provider = providerValue as AIProvider;
            onChange({ ...createDefaultProviderConfig(provider), apiKey: value.apiKey, endpoint: value.endpoint });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providerOptions.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Model
        <Input value={value.model} onChange={(event) => onChange({ ...value, model: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        API key
        <Input value={value.apiKey} type="password" onChange={(event) => onChange({ ...value, apiKey: event.target.value })} />
      </label>
      {value.provider === 'openai-compatible' ? (
        <label className="grid gap-1 text-sm font-medium">
          API endpoint
          <Input value={value.endpoint ?? ''} placeholder="https://api.example.com/v1" onChange={(event) => onChange({ ...value, endpoint: event.target.value })} />
        </label>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Temperature
          <Input value={value.temperature ?? ''} type="number" step="0.1" onChange={(event) => onChange({ ...value, temperature: Number(event.target.value) })} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Max tokens
          <Input value={value.maxTokens ?? ''} type="number" step="1" onChange={(event) => onChange({ ...value, maxTokens: Number(event.target.value) })} />
        </label>
      </div>
    </div>
  );
}
