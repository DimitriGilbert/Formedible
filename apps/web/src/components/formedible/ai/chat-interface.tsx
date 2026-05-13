'use client';

import { chat } from '@tanstack/ai';
import type { ModelMessage, StreamChunk } from '@tanstack/ai';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validateProviderAccess } from '@/components/formedible/ai/provider-selection';
import { createTanStackTextAdapter } from '@/lib/formedible/ai-adapters';
import { extractFormCode } from '@/lib/formedible/ai-parser';
import type {
  AiGenerationRequest,
  AiGenerationResult,
  AiMessage,
  AIBuilderMode,
  ProviderSecrets,
  ProviderSettings,
} from '@/lib/formedible/ai-types';
import { cn } from '@/lib/utils';

export interface ChatInterfaceProps {
  readonly providerSettings: ProviderSettings | null;
  readonly providerSecrets: ProviderSecrets | null;
  readonly mode: AIBuilderMode;
  readonly messages: readonly AiMessage[];
  readonly onMessagesChange: (messages: readonly AiMessage[]) => void;
  readonly onFormGenerated?: (formCode: string) => void;
  readonly conversationId?: string;
  readonly systemPrompt?: string;
  readonly className?: string;
}

export const DEFAULT_AI_SYSTEM_PROMPT = 'You are Formedible AI Builder. Return a valid Formedible form configuration in a fenced formedible code block when generating or changing a form.';

function createMessage(role: AiMessage['role'], content: string, formCode?: string): AiMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    formCode,
    timestamp: Date.now(),
  };
}

function toModelMessages(messages: readonly AiMessage[]): ModelMessage<string>[] {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content }));
}

function readTextChunk(chunk: StreamChunk): string {
  return 'delta' in chunk && typeof chunk.delta === 'string' ? chunk.delta : '';
}

async function requestAdapterGeneration(request: AiGenerationRequest): Promise<AiGenerationResult> {
  const validationError = validateProviderAccess(request.providerSettings, request.providerSecrets);

  if (validationError) {
    throw new Error(validationError);
  }

  const providerSettings = request.providerSettings;
  const providerSecrets = request.providerSecrets;

  if (!providerSettings || !providerSecrets) {
    throw new Error('Provider settings and secrets are required.');
  }

  const adapter = createTanStackTextAdapter(providerSettings, providerSecrets);
  let content = '';

  for await (const chunk of chat({
    adapter,
    messages: toModelMessages(request.messages),
    systemPrompts: [request.systemPrompt],
    temperature: providerSettings.temperature,
    maxTokens: providerSettings.maxTokens,
    conversationId: request.conversationId,
  })) {
    content += readTextChunk(chunk);
  }

  return { content, formCode: extractFormCode(content) };
}

export async function generateAiFormCode(
  request: AiGenerationRequest,
  mode: AIBuilderMode,
): Promise<AiGenerationResult> {
  if (mode === 'client') {
    return requestAdapterGeneration(request);
  }

  throw new Error('AI Builder requires client mode to generate a form.');
}

export function ChatInterface({
  providerSettings,
  providerSecrets,
  mode,
  messages,
  onMessagesChange,
  onFormGenerated,
  conversationId,
  systemPrompt = DEFAULT_AI_SYSTEM_PROMPT,
  className,
}: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);

  async function submitPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isGenerating) {
      return;
    }

    const userMessage = createMessage('user', trimmedPrompt);
    const nextMessages = [...messages, userMessage];
    onMessagesChange(nextMessages);
    setPrompt('');
    setError(undefined);
    setIsGenerating(true);

    try {
      const result = await generateAiFormCode(
        { prompt: trimmedPrompt, providerSettings, providerSecrets, messages: nextMessages, systemPrompt, userMessage, conversationId },
        mode,
      );
      const assistantMessage = createMessage('assistant', result.content, result.formCode);
      onMessagesChange([...nextMessages, assistantMessage]);

      if (result.formCode) {
        onFormGenerated?.(result.formCode);
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : String(generationError));
      onMessagesChange(nextMessages);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className={cn('flex h-full flex-col gap-3', className)}>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-lg border p-3">
        {messages.length === 0 ? <p className="text-sm text-muted-foreground">Describe the form you want to build.</p> : null}
        {messages.map((message) => (
          <article key={message.id} className={cn('rounded-md p-3 text-sm', message.role === 'user' ? 'bg-muted' : 'border')}>
            <p className="mb-1 font-medium capitalize">{message.role}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </article>
        ))}
      </div>
      {error ? <p className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-2">
        <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Create a multi-step onboarding form..." />
        <Button type="button" disabled={isGenerating || prompt.trim().length === 0} onClick={submitPrompt}>
          {isGenerating ? 'Generating...' : 'Generate form'}
        </Button>
      </div>
    </div>
  );
}

export type { AiGenerationRequest, AiGenerationResult, AiMessage } from '@/lib/formedible/ai-types';
