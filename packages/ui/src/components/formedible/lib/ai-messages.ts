import type { ModelMessage } from '@tanstack/ai';

import type { AiGenerationMetadata, AiMessage, AiMessagePart, AiMessageRole, AiMessageStatus, AiStreamEventSummary } from '@formedible/ui/components/formedible/lib/ai-types';
import { createStreamEventSummary, parseSafeGenerationMetadata, parseSafeMessageParts, parseSafeStreamEvents, parseStreamEventSummary } from '@formedible/ui/components/formedible/lib/ai-safe-persistence';

export type TanStackAiMessageInput = ModelMessage<string>;

export interface PersistedAiMessage {
  readonly id: string;
  readonly role: AiMessageRole;
  readonly content: string;
  readonly rawContent?: string;
  readonly thinking?: string;
  readonly parts?: readonly AiMessagePart[];
  readonly formCode?: string;
  readonly timestamp?: number;
  readonly createdAt?: number;
  readonly updatedAt?: number;
  readonly provider?: AiMessage['provider'];
  readonly model?: string;
  readonly generation?: AiGenerationMetadata;
  readonly status?: AiMessageStatus;
  readonly eventSummary?: AiStreamEventSummary;
}

const AI_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const satisfies readonly AiMessageRole[];
const AI_MESSAGE_STATUSES = ['idle', 'submitted', 'streaming', 'completed', 'error', 'aborted'] as const satisfies readonly AiMessageStatus[];

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAiMessageRole(value: unknown): value is AiMessageRole {
  if (typeof value !== 'string') {
    return false;
  }

  return AI_MESSAGE_ROLES.some((role) => role === value);
}

function isAiMessageStatus(value: unknown): value is AiMessageStatus {
  if (typeof value !== 'string') {
    return false;
  }

  return AI_MESSAGE_STATUSES.some((status) => status === value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalStatus(value: unknown): AiMessageStatus | undefined {
  return isAiMessageStatus(value) ? value : undefined;
}

function toTanStackRole(role: AiMessageRole): 'user' | 'assistant' | undefined {
  if (role === 'system') {
    return undefined;
  }

  return role;
}

export function toTanStackMessageInput(message: Pick<AiMessage, 'role' | 'content'>): TanStackAiMessageInput | undefined {
  const role = toTanStackRole(message.role);

  if (!role) {
    return undefined;
  }

  return { role, content: message.content };
}

export function toTanStackMessageInputs(messages: readonly Pick<AiMessage, 'role' | 'content'>[]): TanStackAiMessageInput[] {
  return messages.flatMap((message) => {
    const input = toTanStackMessageInput(message);

    return input ? [input] : [];
  });
}

export function toTanStackSystemPrompts(messages: readonly Pick<AiMessage, 'role' | 'content'>[], explicitSystemPrompt?: string): string[] {
  const messagePrompts = messages
    .filter((message) => message.role === 'system' && message.content.trim().length > 0)
    .map((message) => message.content);

  if (explicitSystemPrompt === undefined || explicitSystemPrompt.trim().length === 0) {
    return messagePrompts;
  }

  return [explicitSystemPrompt, ...messagePrompts];
}

export function toPersistedAiMessage(message: AiMessage): PersistedAiMessage {
  const parts = parseSafeMessageParts(message.parts);
  const eventSummary = createStreamEventSummary(parseSafeStreamEvents(message.events));
  const generation = parseSafeGenerationMetadata(message.generation);

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    rawContent: message.rawContent,
    thinking: message.thinking,
    ...(parts.length === 0 ? {} : { parts }),
    formCode: message.formCode,
    timestamp: message.timestamp,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    provider: message.provider,
    model: message.model,
    ...(generation ? { generation } : {}),
    status: message.status,
    ...(eventSummary ? { eventSummary } : {}),
  };
}

export function normalizePersistedAiMessage(value: unknown): AiMessage | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || !isAiMessageRole(value.role) || typeof value.content !== 'string') {
    return undefined;
  }

  const parts = parseSafeMessageParts(value.parts);
  const eventSummary = parseStreamEventSummary(value.eventSummary) ?? createStreamEventSummary(parseSafeStreamEvents(value.events));
  const generation = parseSafeGenerationMetadata(value.generation);

  return {
    id: value.id,
    role: value.role,
    content: value.content,
    rawContent: optionalString(value.rawContent),
    thinking: optionalString(value.thinking),
    ...(parts.length === 0 ? {} : { parts }),
    formCode: optionalString(value.formCode),
    timestamp: optionalNumber(value.timestamp),
    createdAt: optionalNumber(value.createdAt),
    updatedAt: optionalNumber(value.updatedAt),
    provider: value.provider === 'openai' || value.provider === 'anthropic' || value.provider === 'openrouter' ? value.provider : undefined,
    model: optionalString(value.model),
    ...(generation ? { generation } : {}),
    status: optionalStatus(value.status),
    ...(eventSummary ? { eventSummary } : {}),
  };
}

export function normalizePersistedAiMessages(values: unknown): AiMessage[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.flatMap((value) => {
    const message = normalizePersistedAiMessage(value);

    return message ? [message] : [];
  });
}
