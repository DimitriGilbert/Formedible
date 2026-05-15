'use client';

import { useMemo, useState } from 'react';

import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { ProviderModelCatalog, ProviderModelCatalogEntry, ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';
import { cn } from '@formedible/ui/lib/utils';

export interface AgentSettingsProps {
  readonly settings: ProviderSettings;
  readonly secrets: ProviderSecrets;
  readonly modelCatalog?: ProviderModelCatalog;
  readonly isRefreshingModels?: boolean;
  readonly onRefreshModels?: () => void;
  readonly onChange: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly className?: string;
}

interface ModelAutocompleteProps {
  readonly value: string;
  readonly models: readonly ProviderModelCatalogEntry[];
  readonly disabled?: boolean;
  readonly onChange: (model: string) => void;
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

export function getFilteredModelOptions(models: readonly ProviderModelCatalogEntry[], query: string, selectedModel: string): readonly ProviderModelCatalogEntry[] {
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

function ModelAutocomplete({ value, models, disabled, onChange }: ModelAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = useMemo(() => getFilteredModelOptions(models, value, value), [models, value]);
  const showDropdown = isOpen && filteredOptions.length > 0;

  return (
    <div className="relative">
      <Input
        value={value}
        autoComplete="off"
        disabled={disabled}
        placeholder="Type or search model id"
        className={cn(showDropdown && 'rounded-b-none')}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 max-h-72 overflow-y-auto rounded-b-md border border-t-0 bg-popover p-1 text-popover-foreground shadow-md">
          {filteredOptions.map((model) => (
            <Button
              key={model.id}
              type="button"
              variant="ghost"
              className="flex h-auto w-full flex-col items-start rounded-sm px-3 py-2 text-left text-sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
            >
              <span className="font-medium">{model.label ?? model.id}</span>
              {model.label && model.label !== model.id ? <span className="text-xs text-muted-foreground">{model.id}</span> : null}
              {model.createdAt ? <span className="text-xs text-muted-foreground">Released {model.createdAt.slice(0, 10)}</span> : null}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AgentSettings({ settings, secrets, modelCatalog, isRefreshingModels = false, onRefreshModels, onChange, className }: AgentSettingsProps) {
  const modelCatalogHelpText = settings.provider === 'openai'
    ? 'OpenAI model list is filtered by release date; the endpoint does not expose text-only capability metadata.'
    : 'Model list is filtered to provider models released in the last six months.';

  return (
    <section className={cn('grid gap-3 rounded-lg border bg-background p-3', className)} aria-labelledby="ai-builder-agent-settings-title">
      <div>
        <h2 id="ai-builder-agent-settings-title" className="text-sm font-semibold">Model settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Tune the active TanStack AI adapter without enabling custom endpoints.</p>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        <span className="flex items-center justify-between gap-2">
          Model
          <Button type="button" variant="outline" size="sm" disabled={!onRefreshModels || isRefreshingModels || secrets.apiKey.trim().length === 0} onClick={onRefreshModels}>{isRefreshingModels ? 'Refreshing...' : 'Refresh models'}</Button>
        </span>
        <ModelAutocomplete value={settings.model} models={modelCatalog?.models ?? []} disabled={false} onChange={(model) => onChange({ ...settings, model }, secrets)} />
        <span className="text-xs font-normal text-muted-foreground">
          {modelCatalog?.error ? modelCatalog.error : modelCatalog?.fetchedAt ? `Last refreshed ${new Date(modelCatalog.fetchedAt).toLocaleString()}. ${modelCatalogHelpText}` : `Type a custom model string or refresh from the provider. ${modelCatalogHelpText}`}
        </span>
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
