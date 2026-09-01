import type {
  AIProvider,
  AiErrorInfo,
  AiFinishReason,
  AiGenerationMetadata,
  AiJsonValue,
  AiMessagePart,
  AiStreamEvent,
  AiStreamEventSummary,
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

export function createStreamEventSummary(events: readonly AiStreamEvent[]): AiStreamEventSummary | undefined {
  if (events.length === 0) {
    return undefined;
  }

  const countsByType: Record<string, number> = {};
  let usage: AiUsageMetadata | undefined;

  for (const event of events) {
    countsByType[event.type] = (countsByType[event.type] ?? 0) + 1;

    if (event.type === 'finish' && event.usage) {
      usage = event.usage;
    }
  }

  return {
    totalEvents: events.length,
    countsByType,
    ...(usage ? { usage } : {}),
  };
}

/**
 * The `.type` a raw entry would be parsed as by `parseSafeStreamEvent`, or
 * `undefined` when the entry would be dropped. Only the acceptance guards run
 * — no redacted copies are built.
 */
function countedStreamEventType(entry: unknown): string | undefined {
  if (!isRecord(entry) || typeof entry.type !== 'string') {
    return undefined;
  }

  switch (entry.type) {
    case 'text-delta':
    case 'thinking-delta':
      return typeof entry.delta === 'string' ? entry.type : undefined;
    case 'tool-call':
    case 'tool-result':
      return isRecord(entry.tool) ? entry.type : undefined;
    case 'error':
      return isRecord(entry.error) && typeof entry.error.message === 'string' ? entry.type : undefined;
    case 'finish':
      return isAiFinishReason(entry.finishReason) ? entry.type : undefined;
    case 'raw':
      return isSerializableUnknown(entry.event) ? entry.type : undefined;
    default:
      return undefined;
  }
}

/**
 * Counting twin of `createStreamEventSummary(parseSafeStreamEvents(value))`
 * over the RAW persisted array: acceptance mirrors `parseSafeStreamEvent`
 * entry-for-entry, finish usage is parsed with the same
 * `parseSafeUsageMetadata`, and no redacted per-event copies are materialized —
 * the summary is the only survivor of the walk.
 */
export function summarizeRawStreamEvents(value: unknown): AiStreamEventSummary | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const countsByType: Record<string, number> = {};
  let totalEvents = 0;
  let usage: AiUsageMetadata | undefined;

  for (const entry of value) {
    const eventType = countedStreamEventType(entry);

    if (eventType === undefined) {
      continue;
    }

    countsByType[eventType] = (countsByType[eventType] ?? 0) + 1;
    totalEvents += 1;

    if (eventType === 'finish' && isRecord(entry)) {
      const parsedUsage = parseSafeUsageMetadata(entry.usage);

      if (parsedUsage) {
        usage = parsedUsage;
      }
    }
  }

  if (totalEvents === 0) {
    return undefined;
  }

  return {
    totalEvents,
    countsByType,
    ...(usage ? { usage } : {}),
  };
}

export function parseStreamEventSummary(value: unknown): AiStreamEventSummary | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const totalEvents = parseNumber(value.totalEvents);

  if (totalEvents === undefined || !isRecord(value.countsByType)) {
    return undefined;
  }

  const countsByType: Record<string, number> = {};

  for (const [eventType, count] of Object.entries(value.countsByType)) {
    const parsedCount = parseNumber(count);

    if (parsedCount !== undefined) {
      countsByType[eventType] = parsedCount;
    }
  }

  const usage = parseSafeUsageMetadata(value.usage);

  return {
    totalEvents,
    countsByType,
    ...(usage ? { usage } : {}),
  };
}

export function parseSafeGenerationMetadata(value: unknown): AiGenerationMetadata | undefined {
  if (!isRecord(value) || !isAIProvider(value.provider) || typeof value.model !== 'string') {
    return undefined;
  }

  const usage = parseSafeUsageMetadata(value.usage);
  const metadata = parseSafeJsonRecord(value.metadata);
  const startedAt = parseNumber(value.startedAt);
  const finishedAt = parseNumber(value.finishedAt);

  return {
    provider: value.provider,
    model: value.model,
    ...(isAiFinishReason(value.finishReason) ? { finishReason: value.finishReason } : {}),
    ...(usage ? { usage } : {}),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(finishedAt === undefined ? {} : { finishedAt }),
    ...(typeof value.requestId === 'string' ? { requestId: value.requestId } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

/**
 * Shared core behind every JSON-value walker in this package (safe, strict,
 * plain) and in ai-storage: strings/secret keys are redacted only when
 * `redactSecrets` is set, invalid entries (functions, symbols, non-finite
 * numbers, undefined) are either dropped (`dropInvalidEntries`) or invalidate
 * the whole enclosing value (strict semantics), and `plainPrototypesOnly`
 * restricts records to plain prototypes. Verified byte-identical against the
 * previous per-mode walkers by differential probe.
 */
interface JsonValueWalkOptions {
  readonly redactSecrets: boolean;
  readonly dropInvalidEntries: boolean;
  readonly plainPrototypesOnly: boolean;
}

const strictPersistenceWalkOptions: JsonValueWalkOptions = { redactSecrets: false, dropInvalidEntries: false, plainPrototypesOnly: true };
const strictExportWalkOptions: JsonValueWalkOptions = { redactSecrets: true, dropInvalidEntries: false, plainPrototypesOnly: true };
const plainWalkOptions: JsonValueWalkOptions = { redactSecrets: false, dropInvalidEntries: true, plainPrototypesOnly: false };
const safeWalkOptions: JsonValueWalkOptions = { redactSecrets: true, dropInvalidEntries: true, plainPrototypesOnly: false };

function isWalkableRecord(value: unknown, options: JsonValueWalkOptions): value is Record<string, unknown> {
  if (!options.plainPrototypesOnly) {
    return isRecord(value);
  }

  if (!isRecord(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function walkJsonValue(value: unknown, options: JsonValueWalkOptions): AiJsonValue | undefined {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return options.redactSecrets ? redactSecretString(value) : value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    const entries: AiJsonValue[] = [];

    for (const entry of value) {
      const parsedEntry = walkJsonValue(entry, options);

      if (parsedEntry === undefined) {
        if (!options.dropInvalidEntries) {
          return undefined;
        }
        continue;
      }

      entries.push(parsedEntry);
    }

    return entries;
  }

  if (!isWalkableRecord(value, options)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    if (options.redactSecrets && isSecretKey(key)) {
      entries.push([key, '[REDACTED]']);
      continue;
    }

    const parsedEntry = walkJsonValue(entryValue, options);

    if (parsedEntry === undefined) {
      if (!options.dropInvalidEntries) {
        return undefined;
      }
      continue;
    }

    entries.push([key, parsedEntry]);
  }

  return Object.fromEntries(entries);
}

function walkJsonRecordEntries(value: unknown, options: JsonValueWalkOptions): Readonly<Record<string, AiJsonValue>> | undefined {
  if (!isWalkableRecord(value, options)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    if (options.redactSecrets && isSecretKey(key)) {
      entries.push([key, '[REDACTED]']);
      continue;
    }

    const parsedEntry = walkJsonValue(entryValue, options);

    if (parsedEntry !== undefined) {
      entries.push([key, parsedEntry]);
    }
  }

  return Object.fromEntries(entries);
}

export function redactUnknown(value: unknown): AiJsonValue {
  return parseSafeJsonValue(value) ?? null;
}

export function parseSafeJsonValue(value: unknown): AiJsonValue | undefined {
  return walkJsonValue(value, safeWalkOptions);
}

/**
 * Strict walker for schema-shaped config: records must have plain prototypes
 * and the first invalid entry invalidates the whole enclosing value. Redaction
 * (strings and secret-keyed entries) applies only when `redact` is set, which
 * ai-storage derives from its conversation sanitize mode (export redacts,
 * persistence round-trips verbatim).
 */
export function parseStrictJsonValue(value: unknown, redact: boolean): AiJsonValue | undefined {
  return walkJsonValue(value, redact ? strictExportWalkOptions : strictPersistenceWalkOptions);
}

/** Lenient, never-redacting walker used by the persistence round-trip path. */
export function parsePlainJsonValue(value: unknown): AiJsonValue | undefined {
  return walkJsonValue(value, plainWalkOptions);
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

  const inputTokens = parseNumber(value.inputTokens);
  const outputTokens = parseNumber(value.outputTokens);
  const totalTokens = parseNumber(value.totalTokens);
  const cachedInputTokens = parseNumber(value.cachedInputTokens);
  const reasoningTokens = parseNumber(value.reasoningTokens);
  const usage: AiUsageMetadata = {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
    ...(cachedInputTokens === undefined ? {} : { cachedInputTokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
  };

  return Object.keys(usage).length > 0 ? usage : undefined;
}

export function parseSafeJsonRecordAllowEmpty(value: unknown): Readonly<Record<string, AiJsonValue>> | undefined {
  return walkJsonRecordEntries(value, safeWalkOptions);
}

/** Record-level twin of {@link parsePlainJsonValue}: drops invalid entries, never redacts. */
export function parsePlainJsonRecordAllowEmpty(value: unknown): Readonly<Record<string, AiJsonValue>> | undefined {
  return walkJsonRecordEntries(value, plainWalkOptions);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && supportedProviders.some((provider) => provider === value);
}

function isAiFinishReason(value: unknown): value is AiFinishReason {
  return typeof value === 'string' && supportedFinishReasons.some((finishReason) => finishReason === value);
}

export function parseNumber(value: unknown): number | undefined {
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
