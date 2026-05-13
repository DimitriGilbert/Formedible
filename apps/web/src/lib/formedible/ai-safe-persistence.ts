import type {
  AIProvider,
  AiErrorInfo,
  AiFinishReason,
  AiGenerationMetadata,
  AiJsonValue,
  AiMessagePart,
  AiStreamEvent,
  AiToolChunk,
  AiUsageMetadata,
} from '@/lib/formedible/ai-types';

const supportedProviders = ['openai', 'anthropic', 'openrouter'] as const satisfies readonly AIProvider[];
const supportedFinishReasons = ['stop', 'length', 'tool-calls', 'content-filter', 'error', 'abort', 'unknown'] as const satisfies readonly AiFinishReason[];

export function parseSafeMessageParts(value: unknown): readonly AiMessagePart[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parts: AiMessagePart[] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.type !== 'string') {
      continue;
    }

    if ((entry.type === 'text' || entry.type === 'thinking') && typeof entry.text === 'string') {
      parts.push({ type: entry.type, text: redactSecretString(entry.text) });
      continue;
    }

    if (entry.type === 'tool') {
      const tool = parseSafeToolChunk(entry.tool);

      if (tool) {
        parts.push({ type: 'tool', tool });
      }

      continue;
    }

    if (entry.type === 'raw' && isSerializableUnknown(entry.value)) {
      parts.push({ type: 'raw', value: redactUnknown(entry.value) });
    }
  }

  return parts;
}

export function parseSafeStreamEvents(value: unknown): readonly AiStreamEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const event = parseSafeStreamEvent(entry);
    return event ? [event] : [];
  });
}

export function parseSafeGenerationMetadata(value: unknown): AiGenerationMetadata | undefined {
  if (!isRecord(value) || !isAIProvider(value.provider) || typeof value.model !== 'string') {
    return undefined;
  }

  const usage = parseSafeUsageMetadata(value.usage);
  const metadata = parseSafeJsonRecord(value.metadata);

  return {
    provider: value.provider,
    model: value.model,
    ...(isAiFinishReason(value.finishReason) ? { finishReason: value.finishReason } : {}),
    ...(usage ? { usage } : {}),
    ...(parseNumber(value.startedAt) === undefined ? {} : { startedAt: parseNumber(value.startedAt) }),
    ...(parseNumber(value.finishedAt) === undefined ? {} : { finishedAt: parseNumber(value.finishedAt) }),
    ...(typeof value.requestId === 'string' ? { requestId: value.requestId } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function redactUnknown(value: unknown): AiJsonValue {
  return parseSafeJsonValue(value) ?? null;
}

export function parseSafeJsonValue(value: unknown): AiJsonValue | undefined {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return redactSecretString(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    const entries: AiJsonValue[] = [];

    for (const entry of value) {
      const redactedEntry = parseSafeJsonValue(entry);

      if (redactedEntry !== undefined) {
        entries.push(redactedEntry);
      }
    }

    return entries;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    if (isSecretKey(key)) {
      entries.push([key, '[REDACTED]']);
      continue;
    }

    const redactedValue = parseSafeJsonValue(entryValue);

    if (redactedValue !== undefined) {
      entries.push([key, redactedValue]);
    }
  }

  return Object.fromEntries(entries);
}

export function parseSafeJsonRecord(value: unknown): Readonly<Record<string, AiJsonValue>> | undefined {
  const record = parseSafeJsonRecordAllowEmpty(value);

  if (!record || Object.keys(record).length === 0) {
    return undefined;
  }

  return record;
}

function parseSafeStreamEvent(value: unknown): AiStreamEvent | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return undefined;
  }

  const receivedAt = parseNumber(value.receivedAt) ?? Date.now();

  if ((value.type === 'text-delta' || value.type === 'thinking-delta') && typeof value.delta === 'string') {
    return {
      type: value.type,
      delta: redactSecretString(value.delta),
      ...(isSerializableUnknown(value.raw) ? { raw: redactUnknown(value.raw) } : {}),
      receivedAt,
    };
  }

  if (value.type === 'tool-call' || value.type === 'tool-result') {
    const tool = parseSafeToolChunk(value.tool);
    return tool ? { type: value.type, tool, receivedAt } : undefined;
  }

  if (value.type === 'error') {
    const error = parseSafeErrorInfo(value.error);
    return error ? { type: 'error', error, ...(isSerializableUnknown(value.raw) ? { raw: redactUnknown(value.raw) } : {}), receivedAt } : undefined;
  }

  if (value.type === 'finish' && isAiFinishReason(value.finishReason)) {
    const usage = parseSafeUsageMetadata(value.usage);
    return { type: 'finish', finishReason: value.finishReason, ...(usage ? { usage } : {}), ...(isSerializableUnknown(value.raw) ? { raw: redactUnknown(value.raw) } : {}), receivedAt };
  }

  if (value.type === 'raw' && isSerializableUnknown(value.event)) {
    return { type: 'raw', event: redactUnknown(value.event), receivedAt, ...(typeof value.source === 'string' ? { source: value.source } : {}) };
  }

  return undefined;
}

function parseSafeToolChunk(value: unknown): AiToolChunk | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...(typeof value.toolCallId === 'string' ? { toolCallId: value.toolCallId } : {}),
    ...(typeof value.toolName === 'string' ? { toolName: value.toolName } : {}),
    ...(isSerializableUnknown(value.input) ? { input: redactUnknown(value.input) } : {}),
    ...(isSerializableUnknown(value.output) ? { output: redactUnknown(value.output) } : {}),
    ...(isSerializableUnknown(value.raw) ? { raw: redactUnknown(value.raw) } : {}),
  };
}

function parseSafeErrorInfo(value: unknown): AiErrorInfo | undefined {
  if (!isRecord(value) || typeof value.message !== 'string') {
    return undefined;
  }

  return {
    message: redactSecretString(value.message),
    ...(typeof value.code === 'string' ? { code: redactSecretString(value.code) } : {}),
    ...(typeof value.recoverable === 'boolean' ? { recoverable: value.recoverable } : {}),
    ...(isSerializableUnknown(value.details) ? { details: redactUnknown(value.details) } : {}),
  };
}

function parseSafeUsageMetadata(value: unknown): AiUsageMetadata | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const usage: AiUsageMetadata = {
    ...(parseNumber(value.inputTokens) === undefined ? {} : { inputTokens: parseNumber(value.inputTokens) }),
    ...(parseNumber(value.outputTokens) === undefined ? {} : { outputTokens: parseNumber(value.outputTokens) }),
    ...(parseNumber(value.totalTokens) === undefined ? {} : { totalTokens: parseNumber(value.totalTokens) }),
    ...(parseNumber(value.cachedInputTokens) === undefined ? {} : { cachedInputTokens: parseNumber(value.cachedInputTokens) }),
    ...(parseNumber(value.reasoningTokens) === undefined ? {} : { reasoningTokens: parseNumber(value.reasoningTokens) }),
  };

  return Object.keys(usage).length > 0 ? usage : undefined;
}

export function parseSafeJsonRecordAllowEmpty(value: unknown): Readonly<Record<string, AiJsonValue>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    if (isSecretKey(key)) {
      entries.push([key, '[REDACTED]']);
      continue;
    }

    const redactedValue = parseSafeJsonValue(entryValue);

    if (redactedValue !== undefined) {
      entries.push([key, redactedValue]);
    }
  }

  return Object.fromEntries(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && supportedProviders.some((provider) => provider === value);
}

function isAiFinishReason(value: unknown): value is AiFinishReason {
  return typeof value === 'string' && supportedFinishReasons.some((finishReason) => finishReason === value);
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isSerializableUnknown(value: unknown): boolean {
  return value !== undefined && typeof value !== 'function' && typeof value !== 'symbol';
}

function isSecretKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();
  return normalizedKey === 'key'
    || normalizedKey.includes('apikey')
    || normalizedKey.includes('api_key')
    || normalizedKey.includes('secret')
    || normalizedKey.includes('token')
    || normalizedKey.includes('authorization')
    || normalizedKey.includes('password')
    || normalizedKey.includes('bearer')
    || normalizedKey.includes('credential');
}

export function redactSecretString(value: string): string {
  return value
    .replace(/\bsk-[A-Za-z0-9_-]+\b/g, '[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer [REDACTED]')
    .replace(/\b(api[\s_-]?key|secret|token)\s*[:=]\s*[^\s,;"'`)}\]]+/gi, '$1=[REDACTED]');
}
