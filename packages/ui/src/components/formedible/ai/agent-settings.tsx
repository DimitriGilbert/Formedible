'use client';

import { Input } from '@formedible/ui/components/input';
import type { ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';
import { cn } from '@formedible/ui/lib/utils';

export interface AgentSettingsProps {
  readonly settings: ProviderSettings;
  readonly secrets: ProviderSecrets;
  readonly onChange: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly className?: string;
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function updateThinkingBudget(settings: ProviderSettings, thinkingBudgetTokens: number | undefined): ProviderSettings {
  if (settings.provider !== 'anthropic') {
    return settings;
  }

  if (thinkingBudgetTokens === undefined) {
    const { thinkingBudgetTokens: _thinkingBudgetTokens, ...nextSettings } = settings;
    return nextSettings;
  }

  return { ...settings, thinkingBudgetTokens };
}

function updateTemperature(settings: ProviderSettings, temperature: number | undefined): ProviderSettings {
  if (temperature === undefined) {
    const { temperature: _temperature, ...nextSettings } = settings;
    return nextSettings;
  }

  return { ...settings, temperature };
}

function updateMaxTokens(settings: ProviderSettings, maxTokens: number | undefined): ProviderSettings {
  if (maxTokens === undefined) {
    const { maxTokens: _maxTokens, ...nextSettings } = settings;
    return nextSettings;
  }

  return { ...settings, maxTokens };
}

export function AgentSettings({ settings, secrets, onChange, className }: AgentSettingsProps) {
  return (
    <section className={cn('grid gap-3 rounded-lg border bg-background p-3', className)} aria-labelledby="ai-builder-agent-settings-title">
      <div>
        <h2 id="ai-builder-agent-settings-title" className="text-sm font-semibold">Model settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tune the active TanStack AI adapter without enabling custom endpoints.</p>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Model
        <Input value={settings.model} onChange={(event) => onChange({ ...settings, model: event.target.value }, secrets)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Temperature
          <Input value={settings.temperature ?? ''} type="number" min="0" max="2" step="0.1" onChange={(event) => onChange(updateTemperature(settings, parseOptionalNumber(event.target.value)), secrets)} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Max tokens
          <Input value={settings.maxTokens ?? ''} type="number" min="1" step="1" onChange={(event) => onChange(updateMaxTokens(settings, parseOptionalNumber(event.target.value)), secrets)} />
        </label>
      </div>
      {settings.provider === 'anthropic' ? (
        <label className="grid gap-1 text-sm font-medium">
          Thinking budget tokens
          <Input value={settings.thinkingBudgetTokens ?? ''} type="number" min="1" step="1" onChange={(event) => onChange(updateThinkingBudget(settings, parseOptionalNumber(event.target.value)), secrets)} />
          <span className="text-xs font-normal text-muted-foreground">Anthropic-only reasoning budget. Leave empty to omit the option.</span>
        </label>
      ) : (
        <p className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">Thinking budget controls are only available for Anthropic models.</p>
      )}
    </section>
  );
}
