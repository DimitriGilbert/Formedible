'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AIProvider, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
import type { ProviderSecretPersistencePreference, ProviderSecretStorageMode } from '@/lib/formedible/ai-storage';
import { cn } from '@/lib/utils';

export const providerOptions = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-5.4-mini', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-4-6', requiresKey: true },
  { value: 'openrouter', label: 'OpenRouter', defaultModel: 'minimax/minimax-2.7', requiresKey: true },
] as const satisfies readonly { readonly value: AIProvider; readonly label: string; readonly defaultModel: string; readonly requiresKey: boolean }[];

export interface ProviderSelectionProps {
  readonly settings: ProviderSettings;
  readonly secrets: ProviderSecrets;
  readonly onChange: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly persistencePreference?: ProviderSecretPersistencePreference;
  readonly onPersistencePreferenceChange?: (preference: ProviderSecretPersistencePreference) => void;
  readonly onClearStoredSecrets?: () => void;
  readonly className?: string;
}

const defaultPersistencePreference: ProviderSecretPersistencePreference = {
  mode: 'memory',
  rememberKey: false,
};

export function createDefaultProviderSettings(provider: AIProvider = 'openai'): ProviderSettings {
  const option = providerOptions.find((entry) => entry.value === provider) ?? providerOptions[0];

  return {
    provider: option.value,
    model: option.defaultModel,
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

  const provider = providerOptions.find((entry) => entry.value === settings.provider);

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

function isAIProvider(value: string | null): value is AIProvider {
  if (value === null) {
    return false;
  }

  return providerOptions.some((provider) => provider.value === value);
}

function isProviderSecretStorageMode(value: string | null): value is ProviderSecretStorageMode {
  return value === 'memory' || value === 'session' || value === 'local';
}

export function ProviderSelection({ settings, secrets, onChange, persistencePreference = defaultPersistencePreference, onPersistencePreferenceChange, onClearStoredSecrets, className }: ProviderSelectionProps) {
  return (
    <section className={cn('grid gap-3 rounded-lg border bg-background p-3', className)} aria-labelledby="ai-builder-provider-settings-title">
      <div>
        <h2 id="ai-builder-provider-settings-title" className="text-sm font-semibold">Provider credentials</h2>
        <p className="mt-1 text-xs text-muted-foreground">Bring your own key. Keys stay in this browser, are never exported with conversations, and local storage requires an explicit opt-in.</p>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Provider
        <Select
          value={settings.provider}
          onValueChange={(providerValue) => {
            const provider = isAIProvider(providerValue) ? providerValue : providerOptions[0].value;
            const nextProvider = providerOptions.find((entry) => entry.value === provider) ?? providerOptions[0];
            onChange(createDefaultProviderSettings(nextProvider.value), { provider: nextProvider.value, apiKey: '' });
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
        API key
        <Input value={secrets.apiKey} type="password" autoComplete="off" placeholder={`${providerOptions.find((provider) => provider.value === settings.provider)?.label ?? 'Provider'} API key`} onChange={(event) => onChange(settings, { ...secrets, apiKey: event.target.value })} />
      </label>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Key storage
          <Select
            value={persistencePreference.mode}
            onValueChange={(modeValue) => {
              const mode = isProviderSecretStorageMode(modeValue) ? modeValue : 'memory';
              onPersistencePreferenceChange?.({
                mode,
                rememberKey: mode === 'memory' ? false : persistencePreference.rememberKey,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select storage mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="memory">Memory only</SelectItem>
              <SelectItem value="session">Session storage</SelectItem>
              <SelectItem value="local">Local storage</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {persistencePreference.mode === 'local' ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">Local storage keeps the key on this device after the tab closes. Only use it on a trusted machine.</p>
        ) : null}
        <label className="flex items-start gap-2 rounded-md border p-2 text-sm font-medium">
          <input
            className="mt-1"
            type="checkbox"
            checked={persistencePreference.rememberKey}
            disabled={persistencePreference.mode === 'memory'}
            onChange={(event) => onPersistencePreferenceChange?.({ ...persistencePreference, rememberKey: event.target.checked })}
          />
          <span>
            Remember API key
            <span className="block text-xs font-normal text-muted-foreground">Disabled for memory-only mode. Session storage forgets the key when the browser session ends.</span>
          </span>
        </label>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClearStoredSecrets}>Wipe stored key</Button>
    </section>
  );
}
