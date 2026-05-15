'use client';

import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@formedible/ui/components/button';
import { parseAiToFormedible } from '@formedible/ui/components/formedible/lib/ai-parser';
import { parseSafeStreamEvents, redactUnknown } from '@formedible/ui/components/formedible/lib/ai-safe-persistence';
import type { AiFormParseResult, AiMessage, AiStreamEvent } from '@formedible/ui/components/formedible/lib/ai-types';
import { cn } from '@formedible/ui/lib/utils';

export interface RawOutputPanelProps {
  readonly message: AiMessage;
  readonly className?: string;
}

type ExtractionParseStatus = 'pending' | 'parsed' | 'failed' | 'no-form';

interface RawOutputViewModel {
  readonly rawText: string;
  readonly thinkingText: string | undefined;
  readonly formCode: string | undefined;
  readonly parseResult: AiFormParseResult | undefined;
  readonly status: ExtractionParseStatus;
  readonly statusLabel: string;
  readonly statusDescription: string;
  readonly safeEvents: readonly AiStreamEvent[];
  readonly metadata: unknown;
}

interface CopyButtonProps {
  readonly value: string;
  readonly label: string;
  readonly copiedLabel?: string;
  readonly disabled?: boolean;
}

function createViewModel(message: AiMessage): RawOutputViewModel {
  const isPending = message.status === 'streaming' || message.status === 'submitted';
  const rawText = message.rawContent ?? message.content;
  const formCode = message.formCode;
  const parseResult = !isPending && formCode ? parseAiToFormedible(formCode) : undefined;
  const safeEvents = parseSafeStreamEvents(message.events ?? []);
  const metadata = redactUnknown({
    id: message.id,
    role: message.role,
    status: message.status,
    provider: message.provider,
    model: message.model,
    timestamp: message.timestamp,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    generation: message.generation,
  });

  if (isPending) {
    return {
      rawText,
      thinkingText: message.thinking,
      formCode,
      parseResult,
      status: 'pending',
      statusLabel: 'Pending',
      statusDescription: 'Streaming is still in progress. Form extraction and parsing run after completion.',
      safeEvents,
      metadata,
    };
  }

  if (!formCode) {
    return {
      rawText,
      thinkingText: message.thinking,
      formCode,
      parseResult,
      status: 'no-form',
      statusLabel: 'No form block',
      statusDescription: 'No lowercase formedible fenced block was extracted from this assistant message.',
      safeEvents,
      metadata,
    };
  }

  if (!parseResult?.success) {
    return {
      rawText,
      thinkingText: message.thinking,
      formCode,
      parseResult,
      status: 'failed',
      statusLabel: 'Failed',
      statusDescription: 'A formedible block was extracted, but parsing failed.',
      safeEvents,
      metadata,
    };
  }

  return {
    rawText,
    thinkingText: message.thinking,
    formCode,
    parseResult,
    status: 'parsed',
    statusLabel: 'Parsed',
    statusDescription: 'A formedible block was extracted and parsed successfully.',
    safeEvents,
    metadata,
  };
}

function stringifyDebugValue(value: unknown): string {
  return JSON.stringify(redactUnknown(value), null, 2);
}

function statusClassName(status: ExtractionParseStatus): string {
  if (status === 'pending') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }

  if (status === 'parsed') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }

  if (status === 'failed') {
    return 'border-destructive/40 bg-destructive/10 text-destructive';
  }

  return 'border-muted-foreground/30 bg-muted text-muted-foreground';
}

function CopyButton({ value, label, copiedLabel = 'Copied', disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    if (disabled || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={copyValue} disabled={disabled} aria-label={label}>
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? copiedLabel : 'Copy'}
    </Button>
  );
}

function DebugBlock({ title, value, copyLabel }: { readonly title: string; readonly value: string; readonly copyLabel: string }) {
  return (
    <div className="overflow-hidden rounded-md border bg-muted/20">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h5>
        <CopyButton value={value} label={copyLabel} disabled={value.length === 0} />
      </div>
      <pre className="max-h-72 overflow-auto p-3 text-xs leading-relaxed">
        <code>{value || 'No data available.'}</code>
      </pre>
    </div>
  );
}

export function RawOutputPanel({ message, className }: RawOutputPanelProps) {
  const viewModel = useMemo(() => createViewModel(message), [message]);
  const parsedValue = viewModel.parseResult?.success ? stringifyDebugValue(viewModel.parseResult.formOptions) : '';
  const parseErrors = viewModel.parseResult?.success === false ? stringifyDebugValue(viewModel.parseResult.errors ?? [{ message: viewModel.parseResult.error ?? 'Parsing failed.' }]) : '';
  const eventValue = stringifyDebugValue(viewModel.safeEvents);
  const metadataValue = stringifyDebugValue(viewModel.metadata);

  return (
    <details className={cn('rounded-lg border bg-background/80', className)}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-medium">
        <span>Raw output and debug</span>
        <span className={cn('rounded-full border px-2 py-0.5 text-xs', statusClassName(viewModel.status))}>{viewModel.statusLabel}</span>
      </summary>
      <div className="space-y-3 border-t p-3">
        <p className="text-xs text-muted-foreground">{viewModel.statusDescription}</p>

        <DebugBlock title="Raw text output" value={viewModel.rawText} copyLabel="Copy raw text output" />

        <DebugBlock
          title="Thinking output"
          value={viewModel.thinkingText ?? 'This provider did not emit thinking or reasoning chunks for this message.'}
          copyLabel="Copy thinking output"
        />

        <DebugBlock title="Extracted formedible code" value={viewModel.formCode ?? ''} copyLabel="Copy extracted formedible code" />

        {viewModel.status === 'failed' ? (
          <DebugBlock title="Parse errors" value={parseErrors} copyLabel="Copy parse errors" />
        ) : (
          <DebugBlock title="Parsed form result" value={parsedValue} copyLabel="Copy parsed form result" />
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <DebugBlock title="Stream events" value={eventValue} copyLabel="Copy stream events" />
          <DebugBlock title="Metadata" value={metadataValue} copyLabel="Copy metadata" />
        </div>
      </div>
    </details>
  );
}
