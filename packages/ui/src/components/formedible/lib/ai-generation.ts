import { chat } from '@tanstack/ai';
import type { StreamChunk } from '@tanstack/ai';

import { createTanStackModelOptions, createTanStackTextAdapter } from '@formedible/ui/components/formedible/lib/ai-adapters';
import { normalizeAiError } from '@formedible/ui/components/formedible/lib/ai-errors';
import { toTanStackMessageInputs, toTanStackSystemPrompts } from '@formedible/ui/components/formedible/lib/ai-messages';
import { extractFormCode } from '@formedible/ui/components/formedible/lib/ai-parser';
import type { AiErrorInfo, AiFinishReason, AiGenerationMetadata, AiGenerationRequest, AiGenerationResult, AiStreamEvent, AiUsageMetadata } from '@formedible/ui/components/formedible/lib/ai-types';

export interface AiStreamOptions {
  readonly abortController?: AbortController;
  readonly streamFactory?: (request: AiGenerationRequest, abortController: AbortController) => AsyncIterable<unknown>;
}

interface StreamAccumulator {
  text: string;
  thinking: string;
  textChunks: string[];
  thinkingChunks: string[];
  events: AiStreamEvent[];
  errors: AiErrorInfo[];
  finishReason?: AiFinishReason;
  usage?: AiUsageMetadata;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAiProviderErrorMessage(message: string | undefined): message is string {
  return typeof message === 'string' && message.trim().length > 0;
}

function readString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];

  return typeof property === 'string' ? property : undefined;
}

function readNumber(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];

  return typeof property === 'number' && Number.isFinite(property) ? property : undefined;
}

function readUsage(value: unknown): AiUsageMetadata | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const usage = isRecord(value.usage) ? value.usage : value;
  const inputTokens = readNumber(usage, 'inputTokens') ?? readNumber(usage, 'promptTokens');
  const outputTokens = readNumber(usage, 'outputTokens') ?? readNumber(usage, 'completionTokens');
  const totalTokens = readNumber(usage, 'totalTokens');
  const cachedInputTokens = readNumber(usage, 'cachedInputTokens');
  const reasoningTokens = readNumber(usage, 'reasoningTokens');

  if (inputTokens === undefined && outputTokens === undefined && totalTokens === undefined && cachedInputTokens === undefined && reasoningTokens === undefined) {
    return undefined;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedInputTokens,
    reasoningTokens,
  };
}

function normalizeFinishReason(reason: string | undefined): AiFinishReason {
  if (reason === 'stop') {
    return 'stop';
  }

  if (reason === 'length') {
    return 'length';
  }

  if (reason === 'tool_calls' || reason === 'tool-calls') {
    return 'tool-calls';
  }

  if (reason === 'content_filter' || reason === 'content-filter') {
    return 'content-filter';
  }

  if (reason === 'abort' || reason === 'aborted') {
    return 'abort';
  }

  if (reason === 'error') {
    return 'error';
  }

  return 'unknown';
}

function toTextEvent(raw: unknown, receivedAt: number): AiStreamEvent | undefined {
  const type = readString(raw, 'type');
  const delta = readString(raw, 'delta');

  if ((type === 'TEXT_MESSAGE_CONTENT' || type === 'text-delta' || type === 'text') && delta !== undefined) {
    return { type: 'text-delta', delta, raw, receivedAt };
  }

  const content = readString(raw, 'content');

  if (type === 'text' && content !== undefined) {
    return { type: 'text-delta', delta: content, raw, receivedAt };
  }

  return undefined;
}

function toThinkingEvent(raw: unknown, receivedAt: number): AiStreamEvent | undefined {
  const type = readString(raw, 'type');
  const delta = readString(raw, 'delta');

  if ((type === 'REASONING_MESSAGE_CONTENT' || type === 'thinking-delta' || type === 'reasoning-delta') && delta !== undefined) {
    return { type: 'thinking-delta', delta, raw, receivedAt };
  }

  if (type === 'STEP_FINISHED' && delta !== undefined) {
    return { type: 'thinking-delta', delta, raw, receivedAt };
  }

  return undefined;
}

function toToolEvent(raw: unknown, receivedAt: number): AiStreamEvent | undefined {
  const type = readString(raw, 'type');

  if (type === 'TOOL_CALL_START' || type === 'TOOL_CALL_ARGS' || type === 'TOOL_CALL_END') {
    return {
      type: 'tool-call',
      tool: {
        toolCallId: readString(raw, 'toolCallId'),
        toolName: readString(raw, 'toolCallName') ?? readString(raw, 'toolName'),
        input: isRecord(raw) ? raw.input ?? raw.args : undefined,
        output: isRecord(raw) ? raw.result : undefined,
        raw,
      },
      receivedAt,
    };
  }

  if (type === 'TOOL_CALL_RESULT') {
    return {
      type: 'tool-result',
      tool: {
        toolCallId: readString(raw, 'toolCallId'),
        output: isRecord(raw) ? raw.content : undefined,
        raw,
      },
      receivedAt,
    };
  }

  return undefined;
}

function toErrorEvent(raw: unknown, receivedAt: number): AiStreamEvent | undefined {
  const type = readString(raw, 'type');

  if (type !== 'RUN_ERROR' && type !== 'error') {
    return undefined;
  }

  const error = normalizeAiError(raw);

  return {
    type: 'error',
    error: {
      message: error.message,
      code: error.code,
      recoverable: error.recoverable,
      details: error.details,
    },
    raw,
    receivedAt,
  };
}

function toFinishEvent(raw: unknown, receivedAt: number): AiStreamEvent | undefined {
  const type = readString(raw, 'type');

  if (type !== 'RUN_FINISHED' && type !== 'finish') {
    return undefined;
  }

  return {
    type: 'finish',
    finishReason: normalizeFinishReason(readString(raw, 'finishReason')),
    usage: readUsage(raw),
    raw,
    receivedAt,
  };
}

export function normalizeTanStackStreamChunk(raw: unknown, receivedAt: number = Date.now()): AiStreamEvent {
  return toTextEvent(raw, receivedAt)
    ?? toThinkingEvent(raw, receivedAt)
    ?? toToolEvent(raw, receivedAt)
    ?? toErrorEvent(raw, receivedAt)
    ?? toFinishEvent(raw, receivedAt)
    ?? { type: 'raw', event: raw, receivedAt, source: readString(raw, 'type') };
}

function createInitialAccumulator(): StreamAccumulator {
  return {
    text: '',
    thinking: '',
    textChunks: [],
    thinkingChunks: [],
    events: [],
    errors: [],
  };
}

function accumulateEvent(accumulator: StreamAccumulator, event: AiStreamEvent): void {
  accumulator.events.push(event);

  if (event.type === 'text-delta') {
    accumulator.text += event.delta;
    accumulator.textChunks.push(event.delta);
    return;
  }

  if (event.type === 'thinking-delta') {
    accumulator.thinking += event.delta;
    accumulator.thinkingChunks.push(event.delta);
    return;
  }

  if (event.type === 'error') {
    accumulator.errors.push(event.error);
    accumulator.finishReason = 'error';
    return;
  }

  if (event.type === 'finish') {
    accumulator.finishReason = event.finishReason;
    accumulator.usage = event.usage;
  }
}

function assertValidGenerationRequest(request: AiGenerationRequest): asserts request is AiGenerationRequest & { readonly providerSettings: NonNullable<AiGenerationRequest['providerSettings']>; readonly providerSecrets: NonNullable<AiGenerationRequest['providerSecrets']> } {
  if (!request.providerSettings) {
    throw new Error('Provider settings are required.');
  }

  if (!request.providerSecrets) {
    throw new Error('Provider secrets are required.');
  }

  if (request.providerSettings.provider !== request.providerSecrets.provider) {
    throw new Error('Provider settings and secrets must target the same provider.');
  }

  if (request.providerSecrets.apiKey.trim().length === 0) {
    throw new Error('API key is required for the selected provider.');
  }
}

function createTanStackStream(request: AiGenerationRequest, abortController: AbortController): AsyncIterable<StreamChunk> {
  assertValidGenerationRequest(request);

  const providerSettings = request.providerSettings;
  const providerSecrets = request.providerSecrets;
  const adapter = createTanStackTextAdapter(providerSettings, providerSecrets);

  return chat({
    adapter,
    messages: toTanStackMessageInputs(request.messages),
    systemPrompts: toTanStackSystemPrompts(request.messages, request.systemPrompt),
    temperature: providerSettings.temperature,
    maxTokens: providerSettings.maxTokens,
    modelOptions: createTanStackModelOptions(providerSettings),
    conversationId: request.conversationId,
    abortController,
  });
}

export async function* streamAiResponse(request: AiGenerationRequest, options: AiStreamOptions = {}): AsyncIterable<AiStreamEvent> {
  const abortController = options.abortController ?? new AbortController();

  try {
    const stream = options.streamFactory ? options.streamFactory(request, abortController) : createTanStackStream(request, abortController);

    for await (const chunk of stream) {
      const event = normalizeTanStackStreamChunk(chunk);
      yield event;

      if (event.type === 'error') {
        return;
      }
    }

    if (abortController.signal.aborted) {
      yield {
        type: 'finish',
        finishReason: 'abort',
        raw: abortController.signal.reason,
        receivedAt: Date.now(),
      };
    }
  } catch (error) {
    if (abortController.signal.aborted) {
      yield {
        type: 'finish',
        finishReason: 'abort',
        raw: abortController.signal.reason ?? error,
        receivedAt: Date.now(),
      };

      return;
    }

    const normalizedError = normalizeAiError(abortController.signal.aborted ? abortController.signal.reason : error);

    yield {
      type: 'error',
      error: {
        message: normalizedError.message,
        code: normalizedError.code,
        recoverable: normalizedError.recoverable,
        details: normalizedError.details,
      },
      raw: normalizedError.raw,
      receivedAt: Date.now(),
    };
  }
}

export async function collectAiGenerationResult(request: AiGenerationRequest, options: AiStreamOptions = {}): Promise<AiGenerationResult> {
  const startedAt = Date.now();
  const accumulator = createInitialAccumulator();

  for await (const event of streamAiResponse(request, options)) {
    accumulateEvent(accumulator, event);
  }

  const finishedAt = Date.now();
  const provider = request.providerSettings?.provider;
  const model = request.providerSettings?.model;
  const metadata: AiGenerationMetadata | undefined = provider && model
    ? {
        provider,
        model,
        finishReason: accumulator.finishReason,
        usage: accumulator.usage,
        startedAt,
        finishedAt,
      }
    : undefined;

  return {
    content: accumulator.text,
    finalText: accumulator.text,
    rawOutput: {
      text: accumulator.text,
      chunks: accumulator.textChunks,
      events: accumulator.events,
    },
    thinkingOutput: {
      text: accumulator.thinking,
      chunks: accumulator.thinkingChunks,
    },
    formCode: extractFormCode(accumulator.text),
    usage: accumulator.usage,
    provider,
    model,
    finishReason: accumulator.finishReason,
    errors: accumulator.errors,
    events: accumulator.events,
    metadata,
  };
}

export function isProviderEventError(event: AiStreamEvent): boolean {
  return event.type === 'error' && isAiProviderErrorMessage(event.error.message);
}
