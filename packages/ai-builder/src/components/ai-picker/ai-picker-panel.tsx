'use client';

import type { ReactNode } from 'react';

import { ModelAutocompleteField } from '@/components/ai-picker/model-autocomplete-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { evaluatePickerConditional } from '@/lib/conditional-path';
import type { AIProvider, AiPickerProviderConfig, AiPickerSchema, AiPickerSchemaField, AiPickerValues, ProviderModelCatalog, ProviderSecretStorageMode } from '@/lib/ai-picker-types';
import { applyProviderSwitch } from '@/lib/ai-picker-utils';
import { defaultProviderConfigs } from '@/lib/default-picker-schema';
import { cn } from '@/lib/utils';

export interface AiPickerPanelProps {
  readonly schema: AiPickerSchema;
  readonly values: AiPickerValues;
  readonly onChange: (values: AiPickerValues) => void;
  readonly modelCatalog?: ProviderModelCatalog;
  readonly isRefreshingModels?: boolean;
  readonly onRefreshModels?: () => void;
  readonly providerConfigs?: readonly AiPickerProviderConfig[];
  readonly onClearStoredSecrets?: () => void;
  readonly className?: string;
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isAIProvider(value: string | null, providerConfigs: readonly AiPickerProviderConfig[]): value is AIProvider {
  if (value === null) {
    return false;
  }

  return providerConfigs.some((config) => config.value === value);
}

function isStorageMode(value: string | null): value is ProviderSecretStorageMode {
  return value === 'memory' || value === 'session' || value === 'local';
}

function customTextValue(values: AiPickerValues, field: AiPickerSchemaField): string {
  const raw = values[field.name];
  return typeof raw === 'string' ? raw : typeof raw === 'number' ? String(raw) : '';
}

function customNumberValue(values: AiPickerValues, field: AiPickerSchemaField): string {
  const raw = values[field.name];
  return typeof raw === 'number' ? String(raw) : typeof raw === 'string' ? raw : '';
}

function renderField(
  field: AiPickerSchemaField,
  values: AiPickerValues,
  onChange: (values: AiPickerValues) => void,
  modelCatalog: ProviderModelCatalog | undefined,
  isRefreshing: boolean,
  onRefresh: (() => void) | undefined,
  providerConfigs: readonly AiPickerProviderConfig[],
): ReactNode {
  const fieldType = field.type ?? 'text';

  if (field.name === 'model') {
    const catalogHelpText = values.provider === 'openai'
      ? 'OpenAI model list is filtered by release date; the endpoint does not expose text-only capability metadata.'
      : 'Model list is filtered to provider models released in the last six months.';

    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        <span className="flex items-center justify-between gap-2">
          {field.label ?? 'Model'}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!onRefresh || isRefreshing || values.apiKey.trim().length === 0}
            onClick={onRefresh}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh models'}
          </Button>
        </span>
        <ModelAutocompleteField
          value={values.model}
          models={modelCatalog?.models ?? []}
          onChange={(model) => onChange({ ...values, model })}
        />
        <span className="text-xs font-normal text-muted-foreground">
          {modelCatalog?.error ? modelCatalog.error : modelCatalog?.fetchedAt ? `Last refreshed ${new Date(modelCatalog.fetchedAt).toLocaleString()}. ${catalogHelpText}` : `Type a custom model string or refresh from the provider. ${catalogHelpText}`}
        </span>
      </label>
    );
  }

  if (field.name === 'provider') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? 'Provider'}
        <Select
          value={values.provider}
          onValueChange={(rawValue) => {
            if (!isAIProvider(rawValue, providerConfigs)) {
              return;
            }

            onChange(applyProviderSwitch(values, rawValue, providerConfigs));
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? providerConfigs.map((c) => ({ value: c.value, label: c.label }))).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }

  if (field.name === 'apiKey') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? 'API key'}
        <Input
          value={values.apiKey}
          type="password"
          autoComplete="new-password"
          placeholder={field.placeholder ?? 'Provider API key'}
          onChange={(event) => onChange({ ...values, apiKey: event.target.value })}
        />
      </label>
    );
  }

  if (field.name === 'storageMode') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? 'Key storage'}
        <Select
          value={values.storageMode}
          onValueChange={(rawValue) => {
            if (!isStorageMode(rawValue)) {
              return;
            }

            onChange({
              ...values,
              storageMode: rawValue,
              ...(rawValue === 'memory' ? { rememberKey: false } : {}),
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select storage mode" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? [
              { value: 'memory', label: 'Memory only' },
              { value: 'session', label: 'Session storage' },
              { value: 'local', label: 'Local storage' },
            ]).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }

  if (field.name === 'rememberKey') {
    return (
      <label key={field.name} className="flex items-start gap-2 rounded-md border p-2 text-sm font-medium">
        <input
          className="mt-1"
          type="checkbox"
          checked={values.rememberKey}
          disabled={values.storageMode === 'memory'}
          onChange={(event) => onChange({ ...values, rememberKey: event.target.checked })}
        />
        <span>
          {field.label ?? 'Remember API key'}
          <span className="block text-xs font-normal text-muted-foreground">Disabled for memory-only mode. Session storage forgets the key when the browser session ends.</span>
        </span>
      </label>
    );
  }

  if (field.name === 'temperature') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? 'Temperature'}
        <Input
          value={values.temperature ?? ''}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => onChange({ ...values, temperature: parseOptionalNumber(event.target.value) })}
        />
        {field.description ? <span className="text-xs font-normal text-muted-foreground">{field.description}</span> : null}
      </label>
    );
  }

  if (field.name === 'maxTokens') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? 'Max tokens'}
        <Input
          value={values.maxTokens ?? ''}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => onChange({ ...values, maxTokens: parseOptionalNumber(event.target.value) })}
        />
        {field.description ? <span className="text-xs font-normal text-muted-foreground">{field.description}</span> : null}
      </label>
    );
  }

  if (field.name === 'thinkingBudgetTokens') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? 'Thinking budget tokens'}
        <Input
          value={values.thinkingBudgetTokens ?? ''}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => onChange({ ...values, thinkingBudgetTokens: parseOptionalNumber(event.target.value) })}
        />
        {field.description ? <span className="text-xs font-normal text-muted-foreground">{field.description}</span> : null}
      </label>
    );
  }

  if (fieldType === 'checkbox') {
    return (
      <label key={field.name} className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={values[field.name] === true}
          disabled={field.disabled}
          onChange={(event) => {
            onChange({ ...values, [field.name]: event.target.checked });
          }}
        />
        {field.label ?? field.name}
      </label>
    );
  }

  if (fieldType === 'number') {
    return (
      <label key={field.name} className="grid gap-1 text-sm font-medium">
        {field.label ?? field.name}
        <Input
          value={customNumberValue(values, field)}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(event) => {
            onChange({ ...values, [field.name]: parseOptionalNumber(event.target.value) });
          }}
        />
        {field.description ? <span className="text-xs font-normal text-muted-foreground">{field.description}</span> : null}
      </label>
    );
  }

  return (
    <label key={field.name} className="grid gap-1 text-sm font-medium">
      {field.label ?? field.name}
      <Input
        value={customTextValue(values, field)}
        type={fieldType === 'password' ? 'password' : 'text'}
        placeholder={field.placeholder}
        disabled={field.disabled}
        onChange={(event) => {
          onChange({ ...values, [field.name]: event.target.value });
        }}
      />
      {field.description ? <span className="text-xs font-normal text-muted-foreground">{field.description}</span> : null}
    </label>
  );
}

export function AiPickerPanel({
  schema,
  values,
  onChange,
  modelCatalog,
  isRefreshingModels = false,
  onRefreshModels,
  providerConfigs,
  onClearStoredSecrets,
  className,
}: AiPickerPanelProps) {
  const effectiveProviderConfigs = providerConfigs ?? defaultProviderConfigs;

  return (
    <section className={cn('grid gap-3 rounded-lg border bg-background p-3', className)} aria-labelledby="ai-picker-panel-title">
      <div>
        <h2 id="ai-picker-panel-title" className="text-sm font-semibold">AI Provider Settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Configure your AI provider, model, and API key.</p>
      </div>
      {schema.map((field) => {
        if (!evaluatePickerConditional(field.conditional, values)) {
          return null;
        }

        return (
          <div key={field.name}>
            {renderField(field, values, onChange, modelCatalog, isRefreshingModels, onRefreshModels, effectiveProviderConfigs)}
          </div>
        );
      })}
      {onClearStoredSecrets ? (
        <Button type="button" variant="outline" size="sm" onClick={onClearStoredSecrets}>Clear stored keys</Button>
      ) : null}
      {values.storageMode === 'local' ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
          Local storage keeps the key on this device after the tab closes. Only use it on a trusted machine.
        </p>
      ) : null}
    </section>
  );
}
