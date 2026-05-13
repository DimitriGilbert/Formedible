'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AIProvider, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
import { cn } from '@/lib/utils';

export const providerOptions = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-4-5', requiresKey: true },
  { value: 'openrouter', label: 'OpenRouter', defaultModel: 'openai/gpt-4o-mini', requiresKey: true },
] as const satisfies readonly { readonly value: AIProvider; readonly label: string; readonly defaultModel: string; readonly requiresKey: boolean }[];

export interface ProviderSelectionProps {
  readonly settings: ProviderSettings;
  readonly secrets: ProviderSecrets;
  readonly onChange: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly className?: string;
}

export function createDefaultProviderSettings(provider: AIProvider = 'openai'): ProviderSettings {
  const option = providerOptions.find((entry) => entry.value === provider) ?? providerOptions[0];

  return {
    provider: option.value,
    model: option.defaultModel,
    temperature: 0.7,
    maxTokens: 4000,
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

  const provider = providerOptions.find((entry) => entry.value === settings.provider);

  if (!provider) {
    return 'Unsupported AI provider.';
  }

  if (settings.provider !== secrets.provider) {
    return 'Provider settings and secrets must target the same provider.';
  }

  if (provider.requiresKey && secrets.apiKey.trim().length === 0) {
    return `API key is required for ${provider.label}.`;
  }

  return undefined;
}

function isAIProvider(value: string | null): value is AIProvider {
  if (value === null) {
    return false;
  }

  return providerOptions.some((provider) => provider.value === value);
}

export function ProviderSelection({ settings, secrets, onChange, className }: ProviderSelectionProps) {
  return (
    <div className={cn('grid gap-3 rounded-lg border p-3', className)}>
      <label className="grid gap-1 text-sm font-medium">
        Provider
        <Select
          value={settings.provider}
          onValueChange={(providerValue) => {
            const provider = isAIProvider(providerValue) ? providerValue : providerOptions[0].value;
            const nextProvider = providerOptions.find((entry) => entry.value === provider) ?? providerOptions[0];
            onChange(createDefaultProviderSettings(nextProvider.value), { ...secrets, provider: nextProvider.value });
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
        <Input value={settings.model} onChange={(event) => onChange({ ...settings, model: event.target.value }, secrets)} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        API key
        <Input value={secrets.apiKey} type="password" onChange={(event) => onChange(settings, { ...secrets, apiKey: event.target.value })} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Temperature
          <Input value={settings.temperature ?? ''} type="number" step="0.1" onChange={(event) => onChange({ ...settings, temperature: Number(event.target.value) }, secrets)} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Max tokens
          <Input value={settings.maxTokens ?? ''} type="number" step="1" onChange={(event) => onChange({ ...settings, maxTokens: Number(event.target.value) }, secrets)} />
        </label>
      </div>
    </div>
  );
}
