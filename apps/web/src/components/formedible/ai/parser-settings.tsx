'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { defaultParserConfig, generateSystemPrompt, mergeParserConfig, parserConfigFields, validateParserConfig } from '@/lib/formedible/parser-config-schema';
import type { ParserConfig } from '@/lib/formedible/parser-config-schema';
import { cn } from '@/lib/utils';

export interface ParserSettingsProps {
  readonly config: ParserConfig;
  readonly onChange: (config: ParserConfig) => void;
  readonly className?: string;
}

function parseNumber(value: string, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function configLabel(name: string): string {
  const field = parserConfigFields.find((entry) => entry.name === name);
  return typeof field?.label === 'string' ? field.label : name;
}

function updateConfig(config: ParserConfig, patch: Partial<ParserConfig>, onChange: (config: ParserConfig) => void): void {
  const nextConfig = mergeParserConfig({ ...config, ...patch });

  if (validateParserConfig(nextConfig)) {
    onChange(nextConfig);
  }
}

function toggleField(config: ParserConfig, field: string): ParserConfig {
  const selectedFields = config.systemPromptFields.includes(field)
    ? config.systemPromptFields.filter((entry) => entry !== field)
    : [...config.systemPromptFields, field];

  return mergeParserConfig({ ...config, systemPromptFields: selectedFields });
}

export function ParserSettings({ config, onChange, className }: ParserSettingsProps) {
  const [copied, setCopied] = useState(false);
  const systemPrompt = generateSystemPrompt(config);
  const fieldOptions = defaultParserConfig.systemPromptFields;

  async function copySystemPrompt(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section className={cn('grid gap-4 rounded-lg border bg-background p-3', className)} aria-labelledby="ai-builder-parser-settings-title">
      <div>
        <h2 id="ai-builder-parser-settings-title" className="text-sm font-semibold">Parser settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Control the synced Formedible parser contract and preview the system prompt sent to the model.</p>
      </div>
      <div className="grid gap-2">
        {(['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'enableZodParsing', 'showDetailedErrors', 'selectFields', 'includeTabFormatting', 'includePageFormatting'] as const).map((key) => (
          <label key={key} className="flex items-start gap-2 rounded-md border p-2 text-sm font-medium">
            <input className="mt-1" type="checkbox" checked={Boolean(config[key])} onChange={(event) => updateConfig(config, { [key]: event.target.checked }, onChange)} />
            <span>{configLabel(key)}</span>
          </label>
        ))}
      </div>
      <label className="grid gap-1 text-sm font-medium">
        {configLabel('mergeStrategy')}
        <Select value={config.mergeStrategy} onValueChange={(value) => updateConfig(config, { mergeStrategy: value === 'override' || value === 'intersect' ? value : 'extend' }, onChange)}>
          <SelectTrigger>
            <SelectValue placeholder="Merge strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="extend">Extend</SelectItem>
            <SelectItem value="override">Override</SelectItem>
            <SelectItem value="intersect">Intersect</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          {configLabel('maxCodeLength')}
          <Input type="number" min="1000" max="10000000" step="1000" value={config.maxCodeLength} onChange={(event) => updateConfig(config, { maxCodeLength: parseNumber(event.target.value, defaultParserConfig.maxCodeLength) }, onChange)} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {configLabel('maxNestingDepth')}
          <Input type="number" min="5" max="200" step="1" value={config.maxNestingDepth} onChange={(event) => updateConfig(config, { maxNestingDepth: parseNumber(event.target.value, defaultParserConfig.maxNestingDepth) }, onChange)} />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        {configLabel('customInstructions')}
        <Textarea value={config.customInstructions ?? ''} onChange={(event) => updateConfig(config, { customInstructions: event.target.value.trim() || undefined }, onChange)} placeholder="Add constraints for generated forms..." />
      </label>
      <div className="grid gap-2">
        <p className="text-sm font-medium">{configLabel('systemPromptFields')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {fieldOptions.map((field) => (
            <label key={field} className="flex items-center gap-2 rounded-md border p-2 text-xs">
              <input type="checkbox" checked={config.systemPromptFields.includes(field)} onChange={() => onChange(toggleField(config, field))} />
              {field}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">System prompt preview</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void copySystemPrompt()}>{copied ? 'Copied' : 'Copy prompt'}</Button>
        </div>
        <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap">{systemPrompt}</pre>
      </div>
    </section>
  );
}
