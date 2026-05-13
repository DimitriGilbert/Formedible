'use client';

import { useState } from 'react';

import { ChatMessages } from '@/components/formedible/ai/chat-messages';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { collectAiGenerationResult, streamAiResponse } from '@/lib/formedible/ai-generation';
import { extractFormCode, parseAiToFormedible } from '@/lib/formedible/ai-parser';
import { createAiStreamScheduler } from '@/lib/formedible/ai-stream-scheduler';
import type {
  AiGenerationRequest,
  AiGenerationResult,
  AiFinishReason,
  AiMessage,
  AiParserConfig,
  AIBuilderMode,
  AiStreamEvent,
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
  readonly parserConfig?: AiParserConfig;
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

export async function generateAiFormCode(
  request: AiGenerationRequest,
  mode: AIBuilderMode,
  abortController?: AbortController,
): Promise<AiGenerationResult> {
  if (mode === 'client') {
    if (!request.providerSettings) {
      throw new Error('Provider settings are required.');
    }

    if (!request.providerSecrets) {
      throw new Error('Provider secrets are required.');
    }

    return collectAiGenerationResult(request, { abortController });
  }

  throw new Error('AI Builder requires client mode to generate a form.');
}

export function resolveMessageStatus(finishReason: AiFinishReason | undefined, errors: readonly AiStreamEvent[]): AiMessage['status'] {
  if (finishReason === 'abort') {
    return 'aborted';
  }

  if (finishReason === 'error' || errors.some((event) => event.type === 'error')) {
    return 'error';
  }

  return 'completed';
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
  parserConfig,
  className,
}: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController>();

  async function submitPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isGenerating) {
      return;
    }

    const userMessage = createMessage('user', trimmedPrompt);
    const nextMessages = [...messages, userMessage];
    const assistantMessage: AiMessage = {
      ...createMessage('assistant', ''),
      status: 'streaming',
      provider: providerSettings?.provider,
      model: providerSettings?.model,
    };
    let displayedMessages: readonly AiMessage[] = [...nextMessages, assistantMessage];
    let streamedContent = '';
    let streamedThinking = '';
    let streamedEvents: AiStreamEvent[] = [];
    let finishReason: AiFinishReason | undefined;

    function updateAssistantMessage(message: AiMessage): void {
      displayedMessages = displayedMessages.map((existingMessage) => (existingMessage.id === assistantMessage.id ? message : existingMessage));
      onMessagesChange(displayedMessages);
    }

    onMessagesChange(displayedMessages);
    setPrompt('');
    setError(undefined);
    setIsGenerating(true);
    const nextAbortController = new AbortController();
    setAbortController(nextAbortController);
    const streamScheduler = createAiStreamScheduler((flush) => {
      streamedContent += flush.textDelta;
      streamedThinking += flush.thinkingDelta;
      streamedEvents = [...streamedEvents, ...flush.events];
      updateAssistantMessage({
        ...assistantMessage,
        content: streamedContent,
        rawContent: streamedContent,
        thinking: streamedThinking.length > 0 ? streamedThinking : undefined,
        events: streamedEvents,
        status: 'streaming',
      });
    });

    try {
      if (mode !== 'client') {
        throw new Error('AI Builder requires client mode to generate a form.');
      }

      const startedAt = Date.now();
      const request: AiGenerationRequest = { prompt: trimmedPrompt, providerSettings, providerSecrets, messages: nextMessages, systemPrompt, userMessage, conversationId };

      for await (const event of streamAiResponse(request, { abortController: nextAbortController })) {
        if (event.type === 'finish') {
          finishReason = event.finishReason;
        }

        if (event.type === 'error') {
          finishReason = 'error';
          setError(event.error.message);
        }

        streamScheduler.enqueue(event);
      }

      streamScheduler.flushNow();
      const finalStatus = resolveMessageStatus(finishReason, streamedEvents);
      const formCode = finalStatus === 'completed' ? extractFormCode(streamedContent) : undefined;
      const parseResult = formCode ? parseAiToFormedible(formCode, parserConfig) : undefined;
      const finishedAt = Date.now();
      const finalAssistantMessage: AiMessage = {
        ...assistantMessage,
        content: streamedContent,
        rawContent: streamedContent,
        thinking: streamedThinking.length > 0 ? streamedThinking : undefined,
        events: streamedEvents,
        formCode,
        formConfig: parseResult?.success ? parseResult.formOptions : undefined,
        parseErrors: parseResult?.success === false ? parseResult.errors : undefined,
        provider: providerSettings?.provider,
        model: providerSettings?.model,
        generation: providerSettings
          ? {
              provider: providerSettings.provider,
              model: providerSettings.model,
              finishReason,
              startedAt,
              finishedAt,
            }
          : undefined,
        status: finalStatus,
      };

      updateAssistantMessage(finalAssistantMessage);

      if (formCode) {
        onFormGenerated?.(formCode);
      }
    } catch (generationError) {
      streamScheduler.flushNow();
      const wasAborted = nextAbortController.signal.aborted;

      if (!wasAborted) {
        setError(generationError instanceof Error ? generationError.message : String(generationError));
      }

      updateAssistantMessage({
        ...assistantMessage,
        content: streamedContent,
        rawContent: streamedContent,
        thinking: streamedThinking.length > 0 ? streamedThinking : undefined,
        events: streamedEvents,
        provider: providerSettings?.provider,
        model: providerSettings?.model,
        generation: providerSettings
          ? {
              provider: providerSettings.provider,
              model: providerSettings.model,
              finishReason: wasAborted ? 'abort' : 'error',
              finishedAt: Date.now(),
            }
          : undefined,
        status: wasAborted ? 'aborted' : 'error',
      });
    } finally {
      streamScheduler.flushNow();
      setIsGenerating(false);
      setAbortController(undefined);
    }
  }

  return (
    <div className={cn('flex h-full flex-col gap-3', className)}>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-lg border p-3">
        <ChatMessages messages={messages} />
      </div>
      {error ? <p className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-2">
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submitPrompt();
            }
          }}
          placeholder="Create a multi-step onboarding form..."
        />
        <div className="flex gap-2">
          <Button type="button" disabled={isGenerating || prompt.trim().length === 0} onClick={submitPrompt}>
            {isGenerating ? 'Generating...' : 'Generate form'}
          </Button>
          {isGenerating ? (
            <Button type="button" variant="outline" onClick={() => abortController?.abort('User stopped generation')}>
              Stop
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export type { AiGenerationRequest, AiGenerationResult, AiMessage } from '@/lib/formedible/ai-types';
