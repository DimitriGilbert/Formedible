import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AI_BUILDER_DEFAULT_MODE, AIBuilder, resolveInitialProviderAccess } from '@/components/formedible/ai/ai-builder';
import { AiFormRenderer, parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';
import { generateAiFormCode, resolveMessageStatus } from '@/components/formedible/ai/chat-interface';
import { MarkdownMessage } from '@/components/formedible/ai/markdown-message';
import { createDefaultProviderSecrets, createDefaultProviderSettings, providerOptions, validateProviderAccess } from '@/components/formedible/ai/provider-selection';
import { RawOutputPanel } from '@/components/formedible/ai/raw-output-panel';
import { createTanStackModelOptions, createTanStackTextAdapter, DEFAULT_TANSTACK_AI_MODELS, SUPPORTED_TANSTACK_AI_PROVIDERS } from '@/lib/formedible/ai-adapters';
import { collectAiGenerationResult, streamAiResponse } from '@/lib/formedible/ai-generation';
import { extractFormCode, parseAiToFormedible as parseAiCode } from '@/lib/formedible/ai-parser';
import { createAiStreamScheduler } from '@/lib/formedible/ai-stream-scheduler';
import { canUseStorage, clearConversations, clearStoredProviderSecrets, exportConversation, persistConversations, persistProviderSecrets, persistProviderSettings, persistUiState, readPersistedAIBuilderState, readStoredProviderSecrets, STORAGE_KEYS, upsertConversation, writeJson } from '@/lib/formedible/ai-storage';
import type { AiConversation, AiMessage, AiStreamEvent, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';

const sampleFormCode = `{
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'subscribe', type: 'checkbox', label: 'Subscribe' }
  ],
  submitLabel: 'Join',
  formOptions: { defaultValues: { email: 'test@example.com' } }
}`;

const generationProviderSettings: ProviderSettings = {
  provider: 'openrouter',
  model: 'openai/gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 1000,
};

const generationProviderSecrets: ProviderSecrets = {
  provider: 'openrouter',
  apiKey: 'openrouter-key',
};

const generationUserMessage: AiMessage = {
  id: 'user-generation',
  role: 'user',
  content: 'Create a form',
};

function createGenerationRequest() {
  return {
    prompt: generationUserMessage.content,
    providerSettings: generationProviderSettings,
    providerSecrets: generationProviderSecrets,
    messages: [generationUserMessage],
    systemPrompt: 'Return formedible code when needed.',
    userMessage: generationUserMessage,
    conversationId: 'conversation-generation',
  };
}

async function collectStreamEvents(stream: AsyncIterable<unknown>) {
  const events: unknown[] = [];

  for await (const event of stream) {
    events.push(event);
  }

  return events;
}

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function installWindowStorage(storage: Storage): () => void {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage },
  });

  return () => {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
      return;
    }

    Reflect.deleteProperty(globalThis, 'window');
  };
}

test('public AI builder exports are real components and functions', () => {
  assert.equal(typeof AIBuilder, 'function');
  assert.equal(typeof AiFormRenderer, 'function');
  assert.equal(typeof MarkdownMessage, 'function');
  assert.equal(typeof parseAiToFormedible, 'function');
  assert.equal(AI_BUILDER_DEFAULT_MODE, 'client');
});

test('parseAiToFormedible parses AI-produced schema and infers missing defaults', () => {
  const result = parseAiToFormedible(sampleFormCode);

  assert.equal(result.success, true);
  assert.equal(result.formOptions.fields.length, 2);
  assert.equal(result.formOptions.submitLabel, 'Join');
  assert.deepEqual(result.formOptions.formOptions.defaultValues, {
    email: 'test@example.com',
    subscribe: false,
  });
});

test('parser preserves schema result and old allowlist config keys', () => {
  const result = parseAiCode(`{
    schema: { type: 'object', properties: { email: { type: 'string' } } },
    fields: [
      { name: 'email', type: 'email', label: 'Email', description: 'Work email' },
      { name: 'subscribe', type: 'checkbox', label: 'Subscribe' }
    ],
    pages: [{ page: 0, title: 'Contact', description: 'Ignored' }],
    progress: { showSteps: true, showPercentage: true, className: 'ignored' },
    submitLabel: 'Join',
    formClassName: 'ignored',
    formOptions: { defaultValues: { email: 'test@example.com' }, canSubmitWhenInvalid: true }
  }`, {
    allowedFieldTypes: ['email', 'checkbox'],
    allowedKeys: ['fields', 'pages', 'progress', 'schema', 'submitLabel', 'formOptions'],
    allowedFieldKeys: ['name', 'type', 'label'],
    allowedPageKeys: ['page', 'title'],
    allowedProgressKeys: ['showSteps'],
    allowedFormOptionsKeys: ['defaultValues'],
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.schema, { type: 'object', properties: { email: { type: 'string' } } });
  assert.equal(result.formOptions.submitLabel, 'Join');
  assert.equal(result.formOptions.formClassName, undefined);
  assert.deepEqual(result.formOptions.fields[0], { name: 'email', type: 'email', label: 'Email' });
  assert.deepEqual(result.formOptions.pages, [{ page: 0, title: 'Contact' }]);
  assert.deepEqual(result.formOptions.progress, { showSteps: true });
  assert.deepEqual(result.formOptions.formOptions, { defaultValues: { email: 'test@example.com', subscribe: false } });
});

test('parser rejects field types excluded by old allowlist config', () => {
  const result = parseAiCode(sampleFormCode, { allowedFieldTypes: ['email'] });

  assert.equal(result.success, false);
  assert.match(result.error ?? '', /not allowed/i);
});

test('parser integration reports invalid generated schema without throwing', () => {
  const result = parseAiToFormedible('{ fields: [{ name: 1, type: "unknown" }] }');

  assert.equal(result.success, false);
  assert.equal(result.formOptions.fields.length, 0);
  assert.match(result.error ?? '', /name|type|field/i);
  assert.equal(result.errors?.length, 1);
});

test('AI builder extraction delegates to lowercase formedible parser contract', () => {
  assert.match(extractFormCode('```formedible\n{ fields: [{ name: "email", type: "email" }] }\n```') ?? '', /fields/);
  assert.equal(extractFormCode('```json\n{ "fields": [] }\n```'), undefined);
  assert.equal(extractFormCode('```ts\n{ fields: [{ name: "email", type: "email" }] }\n```'), undefined);
  assert.equal(extractFormCode('{ fields: [{ name: "email", type: "email" }] }'), undefined);
});

test('generation form extraction requires lowercase formedible fences', async () => {
  async function* lowerCaseFormedibleStream() {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: '```formedible\n{ fields: [{ name: "email", type: "email" }] }\n```' };
  }

  async function* unfencedObjectStream() {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: '{ fields: [{ name: "email", type: "email" }] }' };
  }

  async function* jsonFenceStream() {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: '```json\n{ "fields": [{ "name": "email", "type": "email" }] }\n```' };
  }

  async function* tsFenceStream() {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: '```ts\n{ fields: [{ name: "email", type: "email" }] }\n```' };
  }

  const fencedResult = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => lowerCaseFormedibleStream(),
  });
  const unfencedResult = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => unfencedObjectStream(),
  });
  const jsonFenceResult = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => jsonFenceStream(),
  });
  const tsFenceResult = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => tsFenceStream(),
  });

  assert.match(fencedResult.formCode ?? '', /fields/);
  assert.equal(unfencedResult.formCode, undefined);
  assert.equal(jsonFenceResult.formCode, undefined);
  assert.equal(tsFenceResult.formCode, undefined);
});

test('provider selection preserves provider-specific default models', () => {
  assert.deepEqual(providerOptions.map((provider) => provider.value), ['openai', 'anthropic', 'openrouter']);
  assert.deepEqual(createDefaultProviderSettings('openrouter'), {
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4000,
  });
});

test('provider validation requires keys for supported providers', () => {
  assert.match(validateProviderAccess(createDefaultProviderSettings('openai'), createDefaultProviderSecrets('openai')) ?? '', /API key/i);

  const openRouterSettings: ProviderSettings = createDefaultProviderSettings('openrouter');
  const openRouterSecrets: ProviderSecrets = { provider: 'openrouter', apiKey: 'openrouter-key' };

  assert.equal(validateProviderAccess(openRouterSettings, openRouterSecrets), undefined);
});

test('TanStack AI adapter boundary builds supported provider adapters', () => {
  assert.deepEqual(SUPPORTED_TANSTACK_AI_PROVIDERS, ['openai', 'anthropic', 'openrouter']);
  assert.equal(createTanStackTextAdapter({ provider: 'openai', model: DEFAULT_TANSTACK_AI_MODELS.openai }, { provider: 'openai', apiKey: 'openai-key' }).name, 'openai');
  assert.equal(createTanStackTextAdapter({ provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic }, { provider: 'anthropic', apiKey: 'anthropic-key' }).name, 'anthropic');
  assert.equal(createTanStackTextAdapter({ provider: 'openrouter', model: DEFAULT_TANSTACK_AI_MODELS.openrouter }, { provider: 'openrouter', apiKey: 'openrouter-key' }).name, 'openrouter');
});

test('provider-specific options only emit Anthropic thinking configuration', () => {
  assert.equal(createTanStackModelOptions({ provider: 'openai', model: DEFAULT_TANSTACK_AI_MODELS.openai }), undefined);
  assert.equal(createTanStackModelOptions({ provider: 'openrouter', model: DEFAULT_TANSTACK_AI_MODELS.openrouter }), undefined);
  assert.deepEqual(createTanStackModelOptions({ provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic, thinkingBudgetTokens: 512 }), {
    thinking: {
      type: 'enabled',
      budget_tokens: 512,
    },
  });
});

test('AI builder persists provider settings without API keys, plus UI state and conversation history', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const providerSettings: ProviderSettings = { ...createDefaultProviderSettings('openrouter'), model: 'anthropic/claude-3.5-sonnet', temperature: 0.3, maxTokens: 2222 };
  const conversations: readonly AiConversation[] = [
    {
      id: 'conversation-1',
      title: 'Signup form',
      messages: [{ id: 'message-1', role: 'user', content: 'Create a signup form' }],
      createdAt: 1,
      updatedAt: 1,
    },
    {
      id: 'conversation-2',
      title: 'Survey form',
      messages: [
        { id: 'message-2', role: 'user', content: 'Create a survey form' },
        { id: 'message-3', role: 'assistant', content: sampleFormCode, formCode: sampleFormCode },
      ],
      formCode: sampleFormCode,
      createdAt: 2,
      updatedAt: 3,
    },
  ];

  try {
    persistProviderSettings(providerSettings);
    persistConversations(conversations);
    persistUiState({ currentConversationId: 'conversation-2' });

    const persistedState = readPersistedAIBuilderState(createDefaultProviderSettings());

    assert.equal(canUseStorage(), true);
    assert.deepEqual(persistedState.providerSettings, providerSettings);
    assert.deepEqual(persistedState.conversations, conversations);
    assert.equal(persistedState.currentConversationId, 'conversation-2');

    const nextProviderSettings: ProviderSettings = createDefaultProviderSettings('openai');
    persistProviderSettings(nextProviderSettings);
    persistUiState({ currentConversationId: 'conversation-1' });

    assert.deepEqual(readPersistedAIBuilderState(createDefaultProviderSettings()).providerSettings, nextProviderSettings);
    assert.equal(readPersistedAIBuilderState(createDefaultProviderSettings()).currentConversationId, 'conversation-1');
  } finally {
    restoreWindow();
  }
});

test('AI builder rejects legacy provider settings with unsupported endpoints or thinking budgets', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const fallbackProviderSettings = createDefaultProviderSettings('openai');

  try {
    writeJson(STORAGE_KEYS.providerSettings, {
      version: 1,
      data: {
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
        endpoint: 'https://example.test/v1',
      },
    });

    assert.deepEqual(readPersistedAIBuilderState(fallbackProviderSettings).providerSettings, fallbackProviderSettings);

    writeJson(STORAGE_KEYS.providerSettings, {
      version: 1,
      data: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        thinkingBudgetTokens: 512,
      },
    });

    assert.deepEqual(readPersistedAIBuilderState(fallbackProviderSettings).providerSettings, fallbackProviderSettings);
  } finally {
    restoreWindow();
  }
});

test('AI builder initializes uncontrolled secrets from persisted provider settings without persisting keys', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const providerSettings: ProviderSettings = { ...createDefaultProviderSettings('anthropic'), model: 'claude-sonnet-4-5', temperature: 0.2 };

  try {
    persistProviderSettings(providerSettings);

    const initialAccess = resolveInitialProviderAccess();
    const storedProviderSettings = storage.getItem(STORAGE_KEYS.providerSettings) ?? '';

    assert.deepEqual(initialAccess.settings, providerSettings);
    assert.deepEqual(initialAccess.secrets, { provider: 'anthropic', apiKey: '' });
    assert.doesNotMatch(storedProviderSettings, /apiKey|claude-api-key|sk-/i);
  } finally {
    restoreWindow();
  }
});

test('AI builder storage helpers fall back safely when storage is unavailable for SSR', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'window');

  try {
    const fallbackProviderSettings = createDefaultProviderSettings('anthropic');
    const persistedState = readPersistedAIBuilderState(fallbackProviderSettings);

    assert.equal(canUseStorage(), false);
    assert.deepEqual(readPersistedAIBuilderState(fallbackProviderSettings).conversations, []);
    assert.doesNotThrow(() => writeJson(STORAGE_KEYS.uiState, { currentConversationId: 'conversation-1' }));
    assert.deepEqual(persistedState.providerSettings, fallbackProviderSettings);
    assert.deepEqual(persistedState.conversations, []);
    assert.equal(persistedState.currentConversationId, undefined);

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      get() {
        return {
          get localStorage(): Storage {
            throw new Error('Storage unavailable');
          },
        };
      },
    });

    assert.equal(canUseStorage(), false);
    assert.deepEqual(readPersistedAIBuilderState(createDefaultProviderSettings()).providerSettings, createDefaultProviderSettings());
    assert.doesNotThrow(() => writeJson(STORAGE_KEYS.providerSettings, fallbackProviderSettings));
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
      return;
    }

    Reflect.deleteProperty(globalThis, 'window');
  }
});

test('AI builder storage validates unknown JSON and redacts secrets from exports', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const conversation: AiConversation = {
    id: 'conversation-raw',
    title: 'Raw output',
    messages: [
      {
        id: 'assistant-raw',
        role: 'assistant',
        content: 'Here is the form',
        rawContent: 'raw text',
        thinking: 'reasoning text',
        events: [
          { type: 'text-delta', delta: 'raw text', raw: { apiKey: 'secret-key', safe: 'value' }, receivedAt: 10 },
          { type: 'finish', finishReason: 'stop', usage: { outputTokens: 12 }, receivedAt: 11 },
        ],
        formCode: sampleFormCode,
        parseErrors: [{ message: 'Parse warning', details: { token: 'secret-token', line: 1 } }],
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
        timestamp: 12,
        status: 'completed',
      },
    ],
    generatedForms: [
      {
        id: 'form-1',
        conversationId: 'conversation-raw',
        messageId: 'assistant-raw',
        formCode: sampleFormCode,
        status: 'extracted',
        createdAt: 12,
        provider: 'openrouter',
        model: 'openai/gpt-4o-mini',
      },
    ],
    createdAt: 1,
    updatedAt: 12,
  };

  try {
    storage.setItem(STORAGE_KEYS.conversations, JSON.stringify({ version: 1, data: [{ id: 1, messages: 'bad' }, conversation] }));

    const persistedState = readPersistedAIBuilderState(createDefaultProviderSettings());
    assert.equal(persistedState.conversations.length, 1);
    assert.equal(persistedState.conversations[0]?.messages[0]?.rawContent, 'raw text');
    assert.equal(persistedState.conversations[0]?.messages[0]?.thinking, 'reasoning text');
    assert.equal(persistedState.conversations[0]?.messages[0]?.status, 'completed');

    const exportedConversation = exportConversation(conversation);
    const exportedJson = JSON.stringify(exportedConversation);

    assert.match(exportedJson, /\[REDACTED\]/);
    assert.doesNotMatch(exportedJson, /secret-key|secret-token/);
  } finally {
    restoreWindow();
  }
});

test('AI builder secret storage keeps keys session-only unless local remember is explicit', () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage, sessionStorage },
  });

  try {
    const secrets: ProviderSecrets = { provider: 'openai', apiKey: 'session-key' };

    persistProviderSecrets(secrets, { mode: 'session', rememberKey: true });
    assert.equal(readStoredProviderSecrets('session')?.secrets?.apiKey, 'session-key');
    assert.equal(readStoredProviderSecrets('local'), undefined);

    persistProviderSecrets({ provider: 'openai', apiKey: 'local-key' }, { mode: 'local', rememberKey: false });
    assert.equal(readStoredProviderSecrets('local')?.secrets, undefined);

    persistProviderSecrets({ provider: 'openai', apiKey: 'local-key' }, { mode: 'local', rememberKey: true });
    assert.equal(readStoredProviderSecrets('local')?.secrets?.apiKey, 'local-key');

    clearStoredProviderSecrets();
    assert.equal(readStoredProviderSecrets('session'), undefined);
    assert.equal(readStoredProviderSecrets('local'), undefined);

    persistConversations([{ id: 'c1', title: 'Stored', messages: [], createdAt: 1, updatedAt: 1 }]);
    persistUiState({ currentConversationId: 'c1' });
    clearConversations();
    assert.deepEqual(readPersistedAIBuilderState(createDefaultProviderSettings()).conversations, []);
    assert.equal(readPersistedAIBuilderState(createDefaultProviderSettings()).currentConversationId, undefined);
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
      return;
    }

    Reflect.deleteProperty(globalThis, 'window');
  }
});

test('chat generation validates provider configuration before adapter dispatch', async () => {
  const userMessage: AiMessage = { id: 'm1', role: 'user', content: 'Create a signup form' };
  const messages: readonly AiMessage[] = [userMessage];

  await assert.rejects(
    () => generateAiFormCode(
      { prompt: 'Create a signup form', providerSettings: null, providerSecrets: null, messages, systemPrompt: 'System prompt', userMessage },
      'client',
    ),
    /Provider settings are required/i,
  );
});

test('adapter configuration remains scoped to supported providers without custom generation callbacks', () => {
  const adapterProviders = new Set(SUPPORTED_TANSTACK_AI_PROVIDERS);

  assert.deepEqual(providerOptions.map((provider) => provider.value), [...adapterProviders]);
  assert.deepEqual(providerOptions.map((provider) => Object.keys(provider).sort()), providerOptions.map(() => ['defaultModel', 'label', 'requiresKey', 'value']));
  assert.equal(createTanStackTextAdapter({ provider: 'openai', model: DEFAULT_TANSTACK_AI_MODELS.openai }, { provider: 'openai', apiKey: 'openai-key' }).name, 'openai');
  assert.equal(createTanStackTextAdapter({ provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic }, { provider: 'anthropic', apiKey: 'anthropic-key' }).name, 'anthropic');
  assert.equal(createTanStackTextAdapter({ provider: 'openrouter', model: DEFAULT_TANSTACK_AI_MODELS.openrouter }, { provider: 'openrouter', apiKey: 'openrouter-key' }).name, 'openrouter');
});

test('generation layer streams text chunks from mocked async iterables', async () => {
  async function* mockStream() {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'Hello ' };
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'builder' };
    yield { type: 'RUN_FINISHED', finishReason: 'stop', usage: { promptTokens: 4, completionTokens: 2, totalTokens: 6 } };
  }

  const result = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => mockStream(),
  });

  assert.equal(result.content, 'Hello builder');
  assert.deepEqual(result.rawOutput?.chunks, ['Hello ', 'builder']);
  assert.equal(result.finishReason, 'stop');
  assert.deepEqual(result.usage, { inputTokens: 4, outputTokens: 2, totalTokens: 6, cachedInputTokens: undefined, reasoningTokens: undefined });
});

test('generation layer streams thinking chunks when TanStack emits reasoning events', async () => {
  async function* mockStream() {
    yield { type: 'REASONING_MESSAGE_CONTENT', delta: 'Plan. ' };
    yield { type: 'STEP_FINISHED', delta: 'Check fields. ' };
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'Done' };
  }

  const result = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => mockStream(),
  });

  assert.equal(result.content, 'Done');
  assert.equal(result.thinkingOutput?.text, 'Plan. Check fields. ');
  assert.deepEqual(result.thinkingOutput?.chunks, ['Plan. ', 'Check fields. ']);
});

test('generation layer preserves unknown raw provider events as unknown metadata', async () => {
  const rawProviderEvent = { type: 'PROVIDER_VENDOR_EVENT', payload: { traceId: 'trace-1' } };

  const events = await collectStreamEvents(streamAiResponse(createGenerationRequest(), {
    streamFactory: async function* streamFactory() {
      yield rawProviderEvent;
    },
  }));

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { type: 'raw', event: rawProviderEvent, receivedAt: events[0] && typeof events[0] === 'object' && 'receivedAt' in events[0] ? events[0].receivedAt : undefined, source: 'PROVIDER_VENDOR_EVENT' });
});

test('generation layer supports abort through AbortController', async () => {
  const abortController = new AbortController();

  async function* mockStream(_request: unknown, controller: AbortController) {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'Partial' };
    controller.abort('User stopped generation');
  }

  const events = await collectStreamEvents(streamAiResponse(createGenerationRequest(), {
    abortController,
    streamFactory: mockStream,
  }));

  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { type: 'text-delta', delta: 'Partial', raw: { type: 'TEXT_MESSAGE_CONTENT', delta: 'Partial' }, receivedAt: events[0] && typeof events[0] === 'object' && 'receivedAt' in events[0] ? events[0].receivedAt : undefined });
  assert.equal(events[1] && typeof events[1] === 'object' && 'type' in events[1] ? events[1].type : undefined, 'finish');
  assert.equal(events[1] && typeof events[1] === 'object' && 'finishReason' in events[1] ? events[1].finishReason : undefined, 'abort');
  assert.equal(abortController.signal.aborted, true);
});

test('generation layer treats provider throws after abort as abort finish events', async () => {
  const abortController = new AbortController();

  async function* mockStream(_request: unknown, controller: AbortController) {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'Partial' };
    controller.abort('User stopped generation');
    throw new Error('Provider stream closed after abort');
  }

  const result = await collectAiGenerationResult(createGenerationRequest(), {
    abortController,
    streamFactory: mockStream,
  });

  assert.equal(result.content, 'Partial');
  assert.equal(result.finishReason, 'abort');
  assert.equal(result.errors?.length, 0);
  const finalEvent = result.events?.at(-1);

  assert.equal(finalEvent?.type, 'finish');
  assert.equal(finalEvent?.type === 'finish' ? finalEvent.finishReason : undefined, 'abort');
  assert.equal(resolveMessageStatus(result.finishReason, result.events ?? []), 'aborted');
});

test('stream scheduler coalesces multiple stream chunks into one frame update', () => {
  const frameCallbacks: Array<() => void> = [];
  const flushes: Array<{ readonly textDelta: string; readonly thinkingDelta: string; readonly events: readonly AiStreamEvent[] }> = [];
  const scheduler = createAiStreamScheduler((flush) => flushes.push(flush), {
    scheduleFrame: (callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
    cancelFrame: () => undefined,
  });

  scheduler.enqueue({ type: 'text-delta', delta: 'Hel', receivedAt: 1 });
  scheduler.enqueue({ type: 'text-delta', delta: 'lo', receivedAt: 2 });
  scheduler.enqueue({ type: 'thinking-delta', delta: 'Plan', receivedAt: 3 });

  assert.equal(flushes.length, 0);
  assert.equal(frameCallbacks.length, 1);
  frameCallbacks[0]?.();
  assert.equal(flushes.length, 1);
  assert.equal(flushes[0]?.textDelta, 'Hello');
  assert.equal(flushes[0]?.thinkingDelta, 'Plan');
  assert.equal(flushes[0]?.events.length, 3);
});

test('stream scheduler flushes pending chunks immediately on completion and abort', () => {
  const frameCallbacks: Array<() => void> = [];
  const flushes: Array<{ readonly textDelta: string; readonly thinkingDelta: string; readonly events: readonly AiStreamEvent[] }> = [];
  const scheduler = createAiStreamScheduler((flush) => flushes.push(flush), {
    scheduleFrame: (callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
    cancelFrame: () => undefined,
  });

  scheduler.enqueue({ type: 'text-delta', delta: 'Complete', receivedAt: 1 });
  scheduler.flushNow();
  scheduler.enqueue({ type: 'text-delta', delta: 'Abort', receivedAt: 2 });
  scheduler.enqueue({ type: 'finish', finishReason: 'abort', receivedAt: 3 });
  scheduler.flushNow();

  assert.deepEqual(flushes.map((flush) => flush.textDelta), ['Complete', 'Abort']);
  assert.equal(flushes[1]?.events.at(-1)?.type, 'finish');
});

test('streaming state transitions preserve placeholder, chunks, thinking, and completion', async () => {
  async function* mockStream() {
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'First ' };
    yield { type: 'TEXT_MESSAGE_CONTENT', delta: 'second' };
    yield { type: 'REASONING_MESSAGE_CONTENT', delta: 'Thinking' };
    yield { type: 'RUN_FINISHED', finishReason: 'stop' };
  }

  const userMessage: AiMessage = { id: 'user-stream', role: 'user', content: 'Create a form', status: 'submitted' };
  let assistantMessage: AiMessage = { id: 'assistant-stream', role: 'assistant', content: '', status: 'streaming' };
  const updates: AiMessage[] = [assistantMessage];
  const frameCallbacks: Array<() => void> = [];
  const scheduler = createAiStreamScheduler((flush) => {
    assistantMessage = {
      ...assistantMessage,
      content: `${assistantMessage.content}${flush.textDelta}`,
      thinking: `${assistantMessage.thinking ?? ''}${flush.thinkingDelta}`,
      events: [...(assistantMessage.events ?? []), ...flush.events],
      status: 'streaming',
    };
    updates.push(assistantMessage);
  }, {
    scheduleFrame: (callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
    cancelFrame: () => undefined,
  });

  for await (const event of streamAiResponse({ ...createGenerationRequest(), messages: [userMessage], userMessage }, { streamFactory: () => mockStream() })) {
    scheduler.enqueue(event);
    frameCallbacks.shift()?.();
  }

  scheduler.flushNow();
  assistantMessage = { ...assistantMessage, status: 'completed' };
  updates.push(assistantMessage);

  assert.equal(updates[0]?.status, 'streaming');
  assert.equal(updates.at(-1)?.status, 'completed');
  assert.equal(updates.at(-1)?.content, 'First second');
  assert.equal(updates.at(-1)?.thinking, 'Thinking');
});

test('Markdown renderer wires safe Markdown, code highlighting, and copy controls without raw HTML', () => {
  const markdownSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/markdown-message.tsx'), 'utf8');

  assert.match(markdownSource, /ReactMarkdown/);
  assert.match(markdownSource, /rehypeHighlight/);
  assert.match(markdownSource, /Copy code block/);
  assert.match(markdownSource, /skipHtml/);
  assert.doesNotMatch(markdownSource, /rehypeRaw|dangerouslySetInnerHTML/);
});

test('Markdown renderer preserves highlighted fenced code markup while copying raw text', () => {
  const html = renderToStaticMarkup(
    createElement(MarkdownMessage, { content: '```ts\nconst answer = 42;\n```' }),
  );

  assert.match(html, /Copy code block/);
  assert.match(html, /class="[^"]*language-ts[^"]*"/);
  assert.match(html, /class="[^"]*hljs-keyword[^"]*"/);
  assert.match(html, /const/);
  assert.doesNotMatch(html, /dangerouslySetInnerHTML|<script/i);
});

test('raw output panel shows raw text, thinking, parsed forms, events, metadata, and copy controls', () => {
  const message: AiMessage = {
    id: 'assistant-debug',
    role: 'assistant',
    content: `Here is the form.\n\n\`\`\`formedible\n${sampleFormCode}\n\`\`\``,
    rawContent: `raw provider text\n\`\`\`formedible\n${sampleFormCode}\n\`\`\``,
    thinking: 'I should create an email signup form.',
    events: [
      { type: 'text-delta', delta: 'raw provider text', raw: { apiKey: 'secret-key', traceId: 'trace-1' }, receivedAt: 1 },
      { type: 'finish', finishReason: 'stop', usage: { outputTokens: 12 }, receivedAt: 2 },
    ],
    formCode: sampleFormCode,
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    status: 'completed',
  };
  const html = renderToStaticMarkup(createElement(RawOutputPanel, { message }));

  assert.match(html, /Raw output and debug/);
  assert.match(html, /Raw text output/);
  assert.match(html, /Thinking output/);
  assert.match(html, /Extracted formedible code/);
  assert.match(html, /Parsed form result/);
  assert.match(html, /Stream events/);
  assert.match(html, /Metadata/);
  assert.match(html, /Parsed/);
  assert.match(html, /Copy raw text output/);
  assert.match(html, /\[REDACTED\]/);
  assert.doesNotMatch(html, /secret-key|dangerouslySetInnerHTML/i);
});

test('raw output panel communicates pending, failed, and no-thinking states', () => {
  const pendingHtml = renderToStaticMarkup(createElement(RawOutputPanel, {
    message: { id: 'assistant-pending', role: 'assistant', content: 'partial', rawContent: 'partial', status: 'streaming' },
  }));
  const failedHtml = renderToStaticMarkup(createElement(RawOutputPanel, {
    message: { id: 'assistant-failed', role: 'assistant', content: 'bad form', formCode: '{ fields: [{ name: 1, type: "unknown" }] }', status: 'completed' },
  }));

  assert.match(pendingHtml, /Pending/);
  assert.match(pendingHtml, /This provider did not emit thinking or reasoning chunks/);
  assert.match(failedHtml, /Failed/);
  assert.match(failedHtml, /Parse errors/);
});

test('chat streaming loop is scheduler-buffered instead of using per-chunk state setters', () => {
  const chatSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/chat-interface.tsx'), 'utf8');
  const streamLoopMatch = /for await \(const event of streamAiResponse[\s\S]*?\n      }/.exec(chatSource);

  assert.ok(streamLoopMatch);
  assert.match(streamLoopMatch[0], /streamScheduler\.enqueue\(event\)/);
  assert.doesNotMatch(streamLoopMatch[0], /setIsGenerating|setAbortController|onMessagesChange|updateAssistantMessage/);
});

test('generation layer normalizes errors while retaining raw debug metadata', async () => {
  async function* mockStream() {
    throw new Error('401 invalid API key sk-secret');
  }

  const result = await collectAiGenerationResult(createGenerationRequest(), {
    streamFactory: () => mockStream(),
  });

  assert.equal(result.errors?.length, 1);
  assert.match(result.errors?.[0]?.message ?? '', /provider rejected/i);
  assert.doesNotMatch(result.errors?.[0]?.message ?? '', /sk-secret/);
  assert.equal(result.events?.[0]?.type, 'error');
  assert.match(String(result.events?.[0]?.raw), /401 invalid API key sk-secret/);
});

test('conversation updates reuse the synchronously created conversation for one prompt', () => {
  const userMessage: AiMessage = { id: 'user-1', role: 'user', content: 'Create a signup form' };
  const assistantMessage: AiMessage = { id: 'assistant-1', role: 'assistant', content: sampleFormCode, formCode: sampleFormCode };

  const firstUpdate = upsertConversation([], undefined, [userMessage]);
  const secondUpdate = upsertConversation(firstUpdate.conversations, firstUpdate.conversationId, [userMessage, assistantMessage]);

  assert.equal(secondUpdate.conversations.length, 1);
  assert.equal(secondUpdate.conversationId, firstUpdate.conversationId);
  assert.deepEqual(secondUpdate.conversations[0]?.messages, [userMessage, assistantMessage]);
  assert.equal(secondUpdate.conversations[0]?.formCode, sampleFormCode);
});

test('conversation history selection updates existing conversation and new conversation starts separately', () => {
  const firstUserMessage: AiMessage = { id: 'user-1', role: 'user', content: 'Create a signup form' };
  const secondUserMessage: AiMessage = { id: 'user-2', role: 'user', content: 'Create a survey form' };
  const updatedFirstMessage: AiMessage = { id: 'user-3', role: 'user', content: 'Add phone number' };

  const firstConversation = upsertConversation([], undefined, [firstUserMessage]);
  const secondConversation = upsertConversation(firstConversation.conversations, undefined, [secondUserMessage]);
  const selectedFirstConversation = upsertConversation(secondConversation.conversations, firstConversation.conversationId, [firstUserMessage, updatedFirstMessage]);

  assert.equal(secondConversation.conversations.length, 2);
  assert.equal(selectedFirstConversation.conversations.length, 2);
  assert.equal(selectedFirstConversation.conversationId, firstConversation.conversationId);

  const updatedConversation = selectedFirstConversation.conversations.find((conversation: AiConversation) => conversation.id === firstConversation.conversationId);
  const untouchedConversation = selectedFirstConversation.conversations.find((conversation: AiConversation) => conversation.id === secondConversation.conversationId);

  assert.deepEqual(updatedConversation?.messages, [firstUserMessage, updatedFirstMessage]);
  assert.deepEqual(untouchedConversation?.messages, [secondUserMessage]);
});

test('AI builder install source uses lower-level installed aliases', () => {
  const packageRoot = resolve(process.cwd());
  const sourceFiles = [
    'src/index.ts',
    'src/components/formedible/ai/ai-builder.tsx',
    'src/components/formedible/ai/ai-form-renderer.tsx',
    'src/components/formedible/ai/chat-interface.tsx',
    'src/components/formedible/ai/chat-messages.tsx',
    'src/components/formedible/ai/markdown-message.tsx',
    'src/components/formedible/ai/provider-selection.tsx',
    'src/components/formedible/ai/raw-output-panel.tsx',
    'src/lib/formedible/ai-adapters.ts',
    'src/lib/formedible/ai-errors.ts',
    'src/lib/formedible/ai-generation.ts',
    'src/lib/formedible/ai-messages.ts',
    'src/lib/formedible/ai-parser.ts',
    'src/lib/formedible/ai-safe-persistence.ts',
    'src/lib/formedible/ai-storage.ts',
    'src/lib/formedible/ai-types.ts',
  ];

  for (const sourceFile of sourceFiles) {
    const content = readFileSync(resolve(packageRoot, sourceFile), 'utf8');
    assert.doesNotMatch(content, /from ['"]\.\.?\//, `${sourceFile} uses relative internal imports`);
    assert.doesNotMatch(content, /from ['"][^'"]+\.(?:js|mjs)['"]/, `${sourceFile} uses JS import suffixes`);
  }
});
