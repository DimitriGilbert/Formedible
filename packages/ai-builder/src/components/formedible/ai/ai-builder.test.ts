import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AI_BUILDER_DEFAULT_MODE, AIBuilder, applyFormCodeToConversation, applyMessagesToConversation, removeConversationFromList, resolveInitialProviderAccess } from '@/components/formedible/ai/ai-builder';
import { AgentSettings, evaluateNumberDraft, getFilteredModelOptions } from '@/components/formedible/ai/agent-settings';
import { AiFormRenderer, parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';
import { createGenerationUnmountCleanup, generateAiFormCode, resolveMessageStatus } from '@/components/formedible/ai/chat-interface';
import type { ActiveGenerationRef } from '@/components/formedible/ai/chat-interface';
import { ChatMessages } from '@/components/formedible/ai/chat-messages';
import { ConversationHistory } from '@/components/formedible/ai/conversation-history';
import { MarkdownMessage } from '@/components/formedible/ai/markdown-message';
import { normalizeCustomInstructions, ParserSettings } from '@/components/formedible/ai/parser-settings';
import { createDefaultProviderSecrets, createDefaultProviderSettings, providerOptions, ProviderSelection, validateProviderAccess } from '@/components/formedible/ai/provider-selection';
import { RawOutputPanel } from '@/components/formedible/ai/raw-output-panel';
import { SidebarContent } from '@/components/formedible/ai/sidebar-content';
import { SidebarIcons } from '@/components/formedible/ai/sidebar-icons';
import { createTanStackModelOptions, createTanStackTextAdapter, DEFAULT_TANSTACK_AI_MODELS, SUPPORTED_TANSTACK_AI_PROVIDERS } from '@/lib/formedible/ai-adapters';
import { collectAiGenerationResult, createTanStackChatParameters, streamAiResponse } from '@/lib/formedible/ai-generation';
import { fetchProviderModels } from '@/lib/formedible/ai-model-catalog';
import { extractFormCode, parseAiToFormedible as parseAiCode } from '@/lib/formedible/ai-parser';
import { createAiStreamScheduler } from '@/lib/formedible/ai-stream-scheduler';
import { canUseStorage, clearConversations, clearStoredProviderSecrets, createConversationId, exportConversation, persistConversations, persistProviderSecrets, persistProviderSettings, persistUiState, readPersistedAIBuilderState, readStoredProviderSecrets, STORAGE_KEYS, upsertConversation, writeJson } from '@/lib/formedible/ai-storage';
import type { AiConversation, AiMessage, AiStreamEvent, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
import { defaultParserConfig, generateSystemPrompt } from '@/components/formedible/lib/parser-config-schema';

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
  model: 'minimax/minimax-2.7',
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

interface BrowserGuardedSdkClientView {
  readonly client: {
    readonly _options: {
      readonly dangerouslyAllowBrowser?: boolean | null;
    };
  };
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

class QuotaExceededStorage implements Storage {
  get length(): number {
    return 0;
  }

  clear(): void {
    return;
  }

  getItem(_key: string): string | null {
    return null;
  }

  key(_index: number): string | null {
    return null;
  }

  removeItem(_key: string): void {
    return;
  }

  setItem(_key: string, _value: string): void {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
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
  assert.equal(typeof AgentSettings, 'function');
  assert.equal(typeof AiFormRenderer, 'function');
  assert.equal(typeof ConversationHistory, 'function');
  assert.ok(['function', 'object'].includes(typeof MarkdownMessage));
  assert.equal(typeof ParserSettings, 'function');
  assert.equal(typeof SidebarContent, 'function');
  assert.equal(typeof SidebarIcons, 'function');
  assert.equal(typeof parseAiToFormedible, 'function');
  assert.equal(AI_BUILDER_DEFAULT_MODE, 'client');
});

test('parseAiToFormedible parses AI-produced schema and infers missing defaults', () => {
  const result = parseAiToFormedible(sampleFormCode);

  assert.equal(result.success, true);
  assert.equal(result.formOptions.fields?.length, 2);
  assert.equal(result.formOptions.submitLabel, 'Join');
  assert.deepEqual(result.formOptions.formOptions?.defaultValues, {
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
  assert.deepEqual(result.formOptions.fields?.[0], { name: 'email', type: 'email', label: 'Email' });
  assert.deepEqual(result.formOptions.pages, [{ page: 0, title: 'Contact' }]);
  assert.deepEqual(result.formOptions.progress, { showSteps: true });
  assert.deepEqual(result.formOptions.formOptions, { defaultValues: { email: 'test@example.com', subscribe: false } });
});

test('parser rejects field types excluded by old allowlist config', () => {
  const result = parseAiCode(sampleFormCode, { allowedFieldTypes: ['email'] });

  assert.equal(result.success, false);
  assert.match(result.error ?? '', /not allowed/i);
});

test('parser normalizes common UI field type aliases before validation', () => {
  const result = parseAiCode(`{
    fields: [
      { name: 'visitType', type: 'radio-group', label: 'Visit type', options: [{ value: 'dine_in', label: 'Dine in' }, { value: 'takeout', label: 'Takeout' }] },
      { name: 'features', type: 'multi-select', label: 'Features', options: [{ value: 'speed', label: 'Speed' }] },
      { name: 'favoriteColor', type: 'color-picker', label: 'Favorite color' }
    ],
    formOptions: { defaultValues: { visitType: 'dine_in', features: [], favoriteColor: '#f59e0b' } }
  }`);

  assert.equal(result.success, true);
  assert.equal(result.formOptions.fields?.[0]?.type, 'radio');
  assert.equal(result.formOptions.fields?.[1]?.type, 'multiSelect');
  assert.equal(result.formOptions.fields?.[2]?.type, 'colorPicker');
});

test('parser normalizes common enveloped page-field AI output', () => {
  const result = parseAiCode(`{
    form: {
      title: 'Restaurant Customer Feedback Survey',
      description: 'Share feedback.',
      pages: [
        {
          id: 'food_quality',
          title: 'Food Quality',
          description: 'Tell us about the food.',
          fields: [
            { id: 'overall_food_rating', type: 'rating', label: 'Food quality?', required: true, maxRating: 5, icons: 'star', helperText: '1 low, 5 high' },
            { id: 'best_dish', type: 'text', label: 'Best dish?', required: false }
          ]
        }
      ],
      settings: { submitButtonText: 'Submit Feedback' }
    }
  }`);

  assert.equal(result.success, true);
  assert.equal(result.formOptions.title, 'Restaurant Customer Feedback Survey');
  assert.equal(result.formOptions.submitLabel, 'Submit Feedback');
  assert.deepEqual(result.formOptions.pages, [{ page: 1, title: 'Food Quality', description: 'Tell us about the food.' }]);
  assert.deepEqual(result.formOptions.fields?.[0], {
    name: 'overall_food_rating',
    type: 'rating',
    label: 'Food quality?',
    description: '1 low, 5 high',
    page: 1,
    required: true,
    ratingConfig: { max: 5, icon: 'star' },
  });
});

test('parser integration reports invalid generated schema without throwing', () => {
  const result = parseAiToFormedible('{ fields: [{ name: 1, type: "unknown" }] }');

  assert.equal(result.success, false);
  assert.equal(result.formOptions.fields?.length, 0);
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
  assert.equal(createDefaultProviderSettings('openai').model, 'gpt-5.4-mini');
  assert.equal(createDefaultProviderSettings('anthropic').model, 'claude-sonnet-4-6');
  assert.deepEqual(createDefaultProviderSettings('openrouter'), {
    provider: 'openrouter',
    model: 'minimax/minimax-2.7',
    temperature: 0.7,
    maxTokens: 16000,
  });
});

test('parser system prompt states the exact top-level Formedible contract', () => {
  const prompt = generateSystemPrompt(defaultParserConfig);

  assert.match(prompt, /Do not wrap it in \{ form: \.\.\. \}/);
  assert.match(prompt, /top-level fields array is mandatory/);
  assert.match(prompt, /Every field must use name, not id/);
  assert.match(prompt, /Do not put fields inside page objects/);
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

test('TanStack AI adapter boundary preserves custom model strings', () => {
  assert.equal(createTanStackTextAdapter({ provider: 'openai', model: 'custom-openai-model' }, { provider: 'openai', apiKey: 'openai-key' }).model, 'custom-openai-model');
  assert.equal(createTanStackTextAdapter({ provider: 'anthropic', model: 'custom-anthropic-model' }, { provider: 'anthropic', apiKey: 'anthropic-key' }).model, 'custom-anthropic-model');
  assert.equal(createTanStackTextAdapter({ provider: 'openrouter', model: 'custom/provider-model' }, { provider: 'openrouter', apiKey: 'openrouter-key' }).model, 'custom/provider-model');
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

test('OpenAI and Anthropic adapters construct their SDK clients with direct browser access enabled', () => {
  const openaiAdapter = createTanStackTextAdapter({ provider: 'openai', model: DEFAULT_TANSTACK_AI_MODELS.openai }, { provider: 'openai', apiKey: 'openai-key' }) as unknown as BrowserGuardedSdkClientView;
  const anthropicAdapter = createTanStackTextAdapter({ provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic }, { provider: 'anthropic', apiKey: 'anthropic-key' }) as unknown as BrowserGuardedSdkClientView;

  assert.equal(openaiAdapter.client._options.dangerouslyAllowBrowser, true);
  assert.equal(anthropicAdapter.client._options.dangerouslyAllowBrowser, true);

  const adapterSource = readFileSync(resolve(process.cwd(), 'src/lib/formedible/ai-adapters.ts'), 'utf8');
  assert.doesNotMatch(adapterSource, /createOpenRouterText\([^;]*dangerouslyAllowBrowser/);
});

test('chat request parameters omit temperature while Anthropic extended thinking is enabled', () => {
  const thinkingParameters = createTanStackChatParameters({ provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic, temperature: 0.7, maxTokens: 4000, thinkingBudgetTokens: 2048 });
  const standardAnthropicParameters = createTanStackChatParameters({ provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic, temperature: 0.7 });
  const openaiParameters = createTanStackChatParameters({ provider: 'openai', model: DEFAULT_TANSTACK_AI_MODELS.openai, temperature: 0.4 });

  assert.equal('temperature' in thinkingParameters, false);
  assert.deepEqual(thinkingParameters.modelOptions, { thinking: { type: 'enabled', budget_tokens: 2048 } });
  assert.equal(thinkingParameters.maxTokens, 4000);

  assert.equal(standardAnthropicParameters.temperature, 0.7);
  assert.equal(standardAnthropicParameters.modelOptions, undefined);
  assert.equal(openaiParameters.temperature, 0.4);

  const generationSource = readFileSync(resolve(process.cwd(), 'src/lib/formedible/ai-generation.ts'), 'utf8');
  assert.match(generationSource, /\.\.\.createTanStackChatParameters\(providerSettings\),/);
  assert.doesNotMatch(generationSource, /temperature: providerSettings\.temperature/);
});

test('Anthropic model catalog refresh sends the direct browser access CORS header', async () => {
  const catalogNow = Date.parse('2026-08-19T00:00:00.000Z');
  const capturedHeaders: Headers[] = [];
  const fetcher: typeof fetch = async (_input, init) => {
    capturedHeaders.push(new Headers(init?.headers));

    return new Response(JSON.stringify({
      data: [{ id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6', created_at: '2026-08-01T00:00:00.000Z' }],
      has_more: false,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const catalog = await fetchProviderModels({ provider: 'anthropic', apiKey: 'anthropic-key', now: catalogNow, fetcher });

  assert.equal(catalog.error, undefined);
  assert.deepEqual(catalog.models.map((model) => model.id), ['claude-sonnet-4-6']);
  assert.equal(capturedHeaders.length, 1);
  assert.equal(capturedHeaders[0]?.get('anthropic-dangerous-direct-browser-access'), 'true');
  assert.equal(capturedHeaders[0]?.get('anthropic-version'), '2023-06-01');
  assert.equal(capturedHeaders[0]?.get('X-Api-Key'), 'anthropic-key');
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
        model: 'minimax/minimax-2.7',
        endpoint: 'https://example.test/v1',
      },
    });

    assert.deepEqual(readPersistedAIBuilderState(fallbackProviderSettings).providerSettings, fallbackProviderSettings);

    writeJson(STORAGE_KEYS.providerSettings, {
      version: 1,
      data: {
        provider: 'openai',
        model: 'gpt-5.4-mini',
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
  const providerSettings: ProviderSettings = { ...createDefaultProviderSettings('anthropic'), model: 'claude-sonnet-4-6', temperature: 0.2 };

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
    title: 'Raw output sk-title-secret',
    messages: [
      {
        id: 'assistant-raw',
        role: 'assistant',
        content: 'Here is the form with API key sk-secret',
        rawContent: 'raw text token=secret-token',
        thinking: 'reasoning text Bearer secret-token',
        parts: [{ type: 'thinking', text: 'thinking with secret=secret-string' }],
        events: [
          { type: 'text-delta', delta: 'raw text api_key=secret-key', raw: { apiKey: 'secret-key', safe: 'value' }, receivedAt: 10 },
          { type: 'finish', finishReason: 'stop', usage: { outputTokens: 12 }, receivedAt: 11 },
        ],
        formCode: sampleFormCode,
        parseErrors: [{ message: 'Parse warning', details: { token: 'secret-token', line: 1 } }],
        provider: 'openrouter',
        model: 'minimax/minimax-2.7',
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
        model: 'minimax/minimax-2.7',
      },
    ],
    createdAt: 1,
    updatedAt: 12,
  };

  try {
    storage.setItem(STORAGE_KEYS.conversations, JSON.stringify({ version: 1, data: [{ id: 1, messages: 'bad' }, conversation] }));

    const persistedState = readPersistedAIBuilderState(createDefaultProviderSettings());
    assert.equal(persistedState.conversations.length, 1);
    assert.equal(persistedState.conversations[0]?.messages[0]?.rawContent, 'raw text token=[REDACTED]');
    assert.equal(persistedState.conversations[0]?.messages[0]?.thinking, 'reasoning text Bearer [REDACTED]');
    assert.equal(persistedState.conversations[0]?.messages[0]?.status, 'completed');

    const exportedConversation = exportConversation(conversation);
    const exportedJson = JSON.stringify(exportedConversation);

    assert.match(exportedJson, /\[REDACTED\]/);
    assert.match(exportedJson, /raw text/);
    assert.match(exportedJson, /reasoning text/);
    assert.match(exportedJson, /form-1/);
    assert.match(exportedJson, /Parse warning/);
    assert.doesNotMatch(exportedJson, /sk-secret|secret-key|secret-token|secret-string|sk-title-secret/);
  } finally {
    restoreWindow();
  }
});

test('AI builder persistence keeps formConfig integrity for restored forms while redacting message secrets', () => {
  const restoreWindow = installWindowStorage(new MemoryStorage());
  const formConfig: AiMessage['formConfig'] = {
    fields: [
      { name: 'token', type: 'password' },
      { name: 'email', type: 'email' },
    ],
    formOptions: { defaultValues: { token: 'tok_123456', password: 'hunter2', email: 'user@example.com' } },
    persistence: { key: 'signup-form-state', storage: 'localStorage' },
    schema: 'z.object({ token: z.string() })',
  };
  const conversation: AiConversation = {
    id: 'conversation-integrity',
    title: 'Intact form config',
    messages: [
      { id: 'assistant-integrity', role: 'assistant', content: 'Generated with api key sk-live-secret', formConfig },
    ],
    createdAt: 1,
    updatedAt: 2,
  };

  try {
    persistConversations([conversation]);

    const persisted = readPersistedAIBuilderState(createDefaultProviderSettings());
    const restoredFormConfig = persisted.conversations[0]?.messages[0]?.formConfig;

    assert.equal(restoredFormConfig?.persistence?.key, 'signup-form-state');
    assert.equal(restoredFormConfig?.persistence?.storage, 'localStorage');
    assert.deepEqual(restoredFormConfig?.formOptions?.defaultValues, { token: 'tok_123456', password: 'hunter2', email: 'user@example.com' });
    assert.equal(restoredFormConfig?.schema, 'z.object({ token: z.string() })');
    assert.equal(persisted.conversations[0]?.messages[0]?.content, 'Generated with api key [REDACTED]');
  } finally {
    restoreWindow();
  }
});

test('AI builder conversation export redacts formConfig fields that persistence keeps verbatim', () => {
  const conversation: AiConversation = {
    id: 'conversation-export-redaction',
    title: 'Exported form config',
    messages: [
      {
        id: 'assistant-export-redaction',
        role: 'assistant',
        content: 'Generated form',
        formConfig: {
          fields: [{ name: 'token', type: 'password' }],
          formOptions: { defaultValues: { token: 'tok_123456', email: 'user@example.com' } },
          persistence: { key: 'signup-form-state' },
          schema: 'z.object({ token: z.string() })',
        },
      },
    ],
    createdAt: 1,
    updatedAt: 2,
  };

  const exportedFormConfig = exportConversation(conversation).conversation.messages[0]?.formConfig;

  assert.equal(exportedFormConfig?.persistence?.key, '[REDACTED]');
  assert.deepEqual(exportedFormConfig?.formOptions?.defaultValues, { token: '[REDACTED]', email: 'user@example.com' });
  assert.notEqual(exportedFormConfig?.schema, 'z.object({ token: z.string() })');
  assert.match(String(exportedFormConfig?.schema), /\[REDACTED\]/);
});

test('AI builder storage reports quota failures once per key without breaking persistence calls', () => {
  const restoreWindow = installWindowStorage(new QuotaExceededStorage());
  const originalError = console.error;
  const failures: string[] = [];

  console.error = (...args: unknown[]) => {
    failures.push(args.map((arg) => String(arg)).join(' '));
  };

  try {
    const conversation: AiConversation = { id: 'conversation-quota', title: 'Quota form', messages: [], createdAt: 1, updatedAt: 1 };

    assert.equal(writeJson(STORAGE_KEYS.conversations, { version: 1, data: [] }), false);
    assert.doesNotThrow(() => persistConversations([conversation]));
    assert.doesNotThrow(() => persistConversations([conversation]));

    assert.equal(failures.length, 1);
    assert.match(failures[0] ?? '', new RegExp(STORAGE_KEYS.conversations));
    assert.match(failures[0] ?? '', /QuotaExceededError/);
    assert.match(failures[0] ?? '', /quota/i);
  } finally {
    console.error = originalError;
    restoreWindow();
  }
});

test('AI builder persisted messages store final content with compact event summaries instead of per-token events', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const streamedEvents: readonly AiStreamEvent[] = [
    { type: 'text-delta', delta: 'Here ', raw: { apiKey: 'secret-key' }, receivedAt: 1 },
    { type: 'text-delta', delta: 'it is.', raw: { apiKey: 'secret-key' }, receivedAt: 2 },
    { type: 'finish', finishReason: 'stop', usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10 }, raw: {}, receivedAt: 3 },
  ];
  const conversation: AiConversation = {
    id: 'conversation-summary',
    title: 'Summarized stream',
    messages: [
      { id: 'user-summary', role: 'user', content: 'Create a form' },
      { id: 'assistant-summary', role: 'assistant', content: 'Here it is.', events: streamedEvents, status: 'completed' },
    ],
    createdAt: 1,
    updatedAt: 3,
  };

  try {
    persistConversations([conversation]);

    const storedConversations = storage.getItem(STORAGE_KEYS.conversations) ?? '';

    assert.doesNotMatch(storedConversations, /"events"/);
    assert.doesNotMatch(storedConversations, /secret-key/);

    const persisted = readPersistedAIBuilderState(createDefaultProviderSettings());
    const assistantMessage = persisted.conversations[0]?.messages[1];

    assert.equal(assistantMessage?.content, 'Here it is.');
    assert.equal(assistantMessage?.events, undefined);
    assert.deepEqual(assistantMessage?.eventSummary, {
      totalEvents: 3,
      countsByType: { 'text-delta': 2, finish: 1 },
      usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10 },
    });

    storage.setItem(STORAGE_KEYS.conversations, JSON.stringify({ version: 1, data: [{ ...conversation, id: 'conversation-legacy' }] }));

    const legacyMessage = readPersistedAIBuilderState(createDefaultProviderSettings()).conversations[0]?.messages[1];

    assert.equal(legacyMessage?.events, undefined);
    assert.deepEqual(legacyMessage?.eventSummary, {
      totalEvents: 3,
      countsByType: { 'text-delta': 2, finish: 1 },
      usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10 },
    });
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

test('Markdown message is memoized on its content prop so unchanged content skips markdown re-parsing', () => {
  assert.equal(MarkdownMessage.$$typeof, Symbol.for('react.memo'));
  assert.equal(typeof MarkdownMessage.type, 'function');

  const html = renderToStaticMarkup(createElement(MarkdownMessage, { content: 'Unchanged **streamed** content' }));

  assert.match(html, /<strong>streamed<\/strong>/);
});

test('chat message list renders through memoized per-message rows keyed by message identity', () => {
  const chatSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/chat-messages.tsx'), 'utf8');

  assert.match(chatSource, /const MessageRow = memo\(function MessageRow/);
  assert.match(chatSource, /<MessageRow key=\{message\.id\} message=\{message\} \/>/);

  const messages: readonly AiMessage[] = [
    { id: 'chat-user', role: 'user', content: 'Create a signup form' },
    { id: 'chat-assistant', role: 'assistant', content: 'Here is the **signup** form', status: 'completed' },
  ];
  const html = renderToStaticMarkup(createElement(ChatMessages, { messages }));

  assert.match(html, /Create a signup form/);
  assert.match(html, /<strong>signup<\/strong>/);
  assert.match(html, /capitalize/);
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
    model: 'minimax/minimax-2.7',
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

test('chat streaming renders do not attach debug events or duplicate raw content', () => {
  const chatSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/chat-interface.tsx'), 'utf8');
  const schedulerCallbackMatch = /createAiStreamScheduler\(\(flush\) => \{[\s\S]*?\n    \}\);/.exec(chatSource);

  assert.ok(schedulerCallbackMatch);
  assert.doesNotMatch(schedulerCallbackMatch[0], /events:\s*streamedEvents/);
  assert.doesNotMatch(schedulerCallbackMatch[0], /rawContent:\s*streamedContent/);
});

test('AI builder skips streaming persistence but writes terminal message updates immediately', () => {
  const builderSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/ai-builder.tsx'), 'utf8');
  const updateMessagesMatch = /function updateMessages[\s\S]*?\n  }/.exec(builderSource);

  assert.match(builderSource, /hasStreamingMessage\(conversations\)/);
  assert.ok(updateMessagesMatch);
  assert.match(updateMessagesMatch[0], /shouldPersistMessages\(nextMessages\)/);
  assert.match(updateMessagesMatch[0], /persistConversations\(result\.conversations\)/);
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
  assert.equal(secondUpdate.conversations[0]?.generatedForms?.[0]?.formCode, sampleFormCode);
  assert.equal(secondUpdate.conversations[0]?.generatedForms?.[0]?.messageId, assistantMessage.id);
});

test('conversation updates dedupe rapid first-message updates before active id commits', () => {
  const userMessage: AiMessage = { id: 'user-rapid', role: 'user', content: 'Create a signup form' };
  const assistantMessage: AiMessage = { id: 'assistant-rapid', role: 'assistant', content: 'Streaming' };
  const firstUpdate = upsertConversation([], undefined, [userMessage, assistantMessage]);
  const secondUpdate = upsertConversation(firstUpdate.conversations, undefined, [userMessage, { ...assistantMessage, content: 'Streaming more' }]);

  assert.equal(secondUpdate.conversations.length, 1);
  assert.equal(secondUpdate.conversationId, firstUpdate.conversationId);
  assert.equal(secondUpdate.conversations[0]?.messages[1]?.content, 'Streaming more');
});

test('upsertConversation creates new conversations with the reserved draft id when provided', () => {
  const userMessage: AiMessage = { id: 'user-draft', role: 'user', content: 'Create a signup form' };
  const update = upsertConversation([], 'conversation-reserved', [userMessage]);

  assert.equal(update.conversationId, 'conversation-reserved');
  assert.equal(update.conversations[0]?.id, 'conversation-reserved');
  assert.equal(update.conversations[0]?.title, 'Create a signup form');
  assert.match(createConversationId(), /^conversation_\d+_/);
});

test('streaming flushes stay routed to the submission conversation when the user selects another conversation mid-stream', () => {
  const conversationA: AiConversation = {
    id: 'conv-A',
    title: 'Signup form',
    messages: [{ id: 'a1', role: 'user', content: 'Create a signup form' }],
    createdAt: 1,
    updatedAt: 1,
  };
  const conversationB: AiConversation = {
    id: 'conv-B',
    title: 'Survey form',
    messages: [{ id: 'b1', role: 'user', content: 'Create a survey form' }],
    createdAt: 2,
    updatedAt: 2,
  };
  const flushedMessages: readonly AiMessage[] = [
    { id: 'a1', role: 'user', content: 'Create a signup form' },
    { id: 'a2', role: 'user', content: 'Add a phone field' },
    { id: 'a3', role: 'assistant', content: '', status: 'streaming' },
  ];

  const update = applyMessagesToConversation([conversationA, conversationB], 'conv-A', flushedMessages, {
    draftConversationId: 'conversation-reserved',
    currentConversationId: 'conv-B',
  });

  assert.ok(update);
  assert.equal(update.conversationId, 'conv-A');
  assert.equal(update.selectedConversationId, undefined);
  assert.equal(update.conversations.length, 2);

  const updatedConversationA = update.conversations.find((conversation: AiConversation) => conversation.id === 'conv-A');
  const untouchedConversationB = update.conversations.find((conversation: AiConversation) => conversation.id === 'conv-B');

  assert.equal(updatedConversationA?.title, 'Signup form');
  assert.deepEqual(updatedConversationA?.messages, flushedMessages);
  assert.deepEqual(untouchedConversationB, conversationB);
});

test('starting a new conversation while streaming keeps the new-conversation selection', () => {
  const conversationA: AiConversation = {
    id: 'conv-A',
    title: 'Signup form',
    messages: [{ id: 'a1', role: 'user', content: 'Create a signup form' }],
    createdAt: 1,
    updatedAt: 1,
  };
  const flushedMessages: readonly AiMessage[] = [
    { id: 'a1', role: 'user', content: 'Create a signup form' },
    { id: 'a2', role: 'assistant', content: 'Streaming', status: 'streaming' },
  ];

  const update = applyMessagesToConversation([conversationA], 'conv-A', flushedMessages, {
    draftConversationId: 'conversation-reserved',
    currentConversationId: undefined,
  });

  assert.ok(update);
  assert.equal(update.selectedConversationId, undefined);
  assert.equal(update.conversationId, 'conv-A');
  assert.deepEqual(update.conversations[0]?.messages, flushedMessages);
});

test('flushes targeting a deleted conversation are dropped instead of corrupting the current selection', () => {
  const conversationB: AiConversation = {
    id: 'conv-B',
    title: 'Survey form',
    messages: [{ id: 'b1', role: 'user', content: 'Create a survey form' }],
    createdAt: 2,
    updatedAt: 2,
  };
  const flushedMessages: readonly AiMessage[] = [
    { id: 'a1', role: 'user', content: 'Create a signup form' },
    { id: 'a2', role: 'assistant', content: 'Streaming', status: 'streaming' },
  ];

  const update = applyMessagesToConversation([conversationB], 'conv-A', flushedMessages, {
    draftConversationId: 'conversation-reserved',
    currentConversationId: 'conv-B',
  });

  assert.equal(update, undefined);
});

test('first flush of a new-conversation submission creates and selects the reserved conversation exactly once', () => {
  const userMessage: AiMessage = { id: 'user-fresh', role: 'user', content: 'Create a contact form' };
  const streamingMessages: readonly AiMessage[] = [userMessage, { id: 'assistant-fresh', role: 'assistant', content: '', status: 'streaming' }];

  const firstUpdate = applyMessagesToConversation([], 'conversation-reserved', streamingMessages, {
    draftConversationId: 'conversation-reserved',
    currentConversationId: undefined,
  });

  assert.ok(firstUpdate);
  assert.equal(firstUpdate.conversationId, 'conversation-reserved');
  assert.equal(firstUpdate.selectedConversationId, 'conversation-reserved');
  assert.deepEqual(firstUpdate.conversations[0]?.messages, streamingMessages);

  const switchedBeforeFirstFlush = applyMessagesToConversation([], 'conversation-reserved', streamingMessages, {
    draftConversationId: 'conversation-reserved',
    currentConversationId: 'conv-B',
  });

  assert.ok(switchedBeforeFirstFlush);
  assert.equal(switchedBeforeFirstFlush.selectedConversationId, undefined);

  const completedMessages: readonly AiMessage[] = [userMessage, { id: 'assistant-fresh', role: 'assistant', content: 'Done', status: 'completed' }];
  const laterUpdate = applyMessagesToConversation(firstUpdate.conversations, 'conversation-reserved', completedMessages, {
    draftConversationId: 'conversation-rotated',
    currentConversationId: 'conv-B',
  });

  assert.ok(laterUpdate);
  assert.equal(laterUpdate.conversationId, 'conversation-reserved');
  assert.equal(laterUpdate.selectedConversationId, undefined);
  assert.deepEqual(laterUpdate.conversations[0]?.messages, completedMessages);

  const afterDelete = applyMessagesToConversation(
    laterUpdate.conversations.filter((conversation: AiConversation) => conversation.id !== 'conversation-reserved'),
    'conversation-reserved',
    completedMessages,
    { draftConversationId: 'conversation-rotated', currentConversationId: undefined },
  );

  assert.equal(afterDelete, undefined);
});

test('generated form code attaches to the submission conversation instead of overwriting the current selection', () => {
  const conversationA: AiConversation = {
    id: 'conv-A',
    title: 'Signup form',
    messages: [{ id: 'a1', role: 'user', content: 'Create a signup form' }],
    createdAt: 1,
    updatedAt: 1,
  };
  const conversationB: AiConversation = {
    id: 'conv-B',
    title: 'Survey form',
    formCode: 'const surveyForm = 1;',
    messages: [{ id: 'b1', role: 'user', content: 'Create a survey form' }],
    createdAt: 2,
    updatedAt: 2,
  };

  const nextConversations = applyFormCodeToConversation([conversationA, conversationB], 'conv-A', 'const signupForm = 1;', 99);

  assert.ok(nextConversations);
  assert.equal(nextConversations.find((conversation: AiConversation) => conversation.id === 'conv-A')?.formCode, 'const signupForm = 1;');
  assert.equal(nextConversations.find((conversation: AiConversation) => conversation.id === 'conv-A')?.updatedAt, 99);
  assert.deepEqual(nextConversations.find((conversation: AiConversation) => conversation.id === 'conv-B'), conversationB);
  assert.equal(applyFormCodeToConversation([conversationB], 'conv-A', 'const signupForm = 1;', 99), undefined);
});

test('conversation deletion derives the next selection purely from the previous state', () => {
  const conversationA: AiConversation = { id: 'conv-A', title: 'A', messages: [], createdAt: 1, updatedAt: 1 };
  const conversationB: AiConversation = { id: 'conv-B', title: 'B', messages: [], createdAt: 2, updatedAt: 2 };

  const deletingCurrent = removeConversationFromList([conversationA, conversationB], 'conv-B', 'conv-B');
  assert.deepEqual(deletingCurrent, { conversations: [conversationA], currentConversationId: 'conv-A' });

  const deletingLastRemaining = removeConversationFromList([conversationA], 'conv-A', 'conv-A');
  assert.deepEqual(deletingLastRemaining, { conversations: [], currentConversationId: undefined });

  const deletingOther = removeConversationFromList([conversationA, conversationB], 'conv-A', 'conv-B');
  assert.deepEqual(deletingOther, { conversations: [conversationB], currentConversationId: 'conv-B' });
});

test('conversation routing helpers stay pure and never write storage during state commits', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const storageWrites: string[] = [];
  const originalSetItem = storage.setItem.bind(storage);

  storage.setItem = (key: string, value: string) => {
    storageWrites.push(key);
    originalSetItem(key, value);
  };

  try {
    const conversationA: AiConversation = { id: 'conv-A', title: 'A', messages: [{ id: 'a1', role: 'user', content: 'Hi' }], createdAt: 1, updatedAt: 1 };
    const flushedMessages: readonly AiMessage[] = [
      { id: 'a1', role: 'user', content: 'Hi' },
      { id: 'a2', role: 'assistant', content: 'Done', status: 'completed' },
    ];

    const messageUpdate = applyMessagesToConversation([conversationA], 'conv-A', flushedMessages, {
      draftConversationId: 'conversation-reserved',
      currentConversationId: 'conv-B',
    });
    const deletionUpdate = removeConversationFromList([conversationA], 'conv-A', 'conv-A');
    const formCodeUpdate = applyFormCodeToConversation([conversationA], 'conv-A', 'const form = 1;', 5);

    assert.ok(messageUpdate);
    assert.ok(deletionUpdate);
    assert.ok(formCodeUpdate);
    assert.deepEqual(storageWrites, []);
  } finally {
    restoreWindow();
  }
});

test('AI builder commits conversation state through handlers without side effects inside setState updaters', () => {
  const builderSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/ai-builder.tsx'), 'utf8');
  const updateMessagesMatch = /function updateMessages[\s\S]*?\n  }/.exec(builderSource);
  const deleteConversationMatch = /function deleteConversation[\s\S]*?\n  }/.exec(builderSource);

  assert.ok(updateMessagesMatch);
  assert.ok(deleteConversationMatch);
  assert.doesNotMatch(builderSource, /setConversations\(\(/);
  assert.doesNotMatch(builderSource, /setCurrentConversationId\(\(/);
  assert.doesNotMatch(updateMessagesMatch[0], /localStorage/);
  assert.doesNotMatch(deleteConversationMatch[0], /localStorage/);
});

test('AI builder memoizes the parser config and system prompt derived from parserConfig', () => {
  const builderSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/ai-builder.tsx'), 'utf8');

  assert.match(builderSource, /useMemo\(\(\) => generateSystemPrompt\(parserConfig\), \[parserConfig\]\)/);
  assert.match(builderSource, /useMemo\(\(\) => toAiParserConfig\(parserConfig\), \[parserConfig\]\)/);
});

test('stream scheduler cancel drops pending buffered chunks without flushing them', () => {
  const frameCallbacks: Array<() => void> = [];
  const cancelledFrameIds: number[] = [];
  const flushes: Array<{ readonly textDelta: string; readonly thinkingDelta: string; readonly events: readonly AiStreamEvent[] }> = [];
  const scheduler = createAiStreamScheduler((flush) => flushes.push(flush), {
    scheduleFrame: (callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
    cancelFrame: (frameId) => {
      cancelledFrameIds.push(frameId);
    },
  });

  scheduler.enqueue({ type: 'text-delta', delta: 'Pending', receivedAt: 1 });
  scheduler.enqueue({ type: 'thinking-delta', delta: 'Plan', receivedAt: 2 });
  assert.equal(frameCallbacks.length, 1);

  scheduler.cancel();
  scheduler.flushNow();

  assert.deepEqual(cancelledFrameIds, [1]);
  assert.equal(flushes.length, 0);
});

test('chat interface unmount cleanup aborts the active generation and cancels pending flushes', () => {
  const frameCallbacks: Array<() => void> = [];
  const cancelledFrameIds: number[] = [];
  const flushes: Array<{ readonly textDelta: string; readonly thinkingDelta: string; readonly events: readonly AiStreamEvent[] }> = [];
  const scheduler = createAiStreamScheduler((flush) => flushes.push(flush), {
    scheduleFrame: (callback) => {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
    cancelFrame: (frameId) => {
      cancelledFrameIds.push(frameId);
    },
  });
  const abortController = new AbortController();
  const activeGenerationRef: ActiveGenerationRef = { current: { abortController, scheduler } };
  const cleanup = createGenerationUnmountCleanup(activeGenerationRef);

  scheduler.enqueue({ type: 'text-delta', delta: 'Partial', receivedAt: 1 });
  cleanup();

  assert.equal(abortController.signal.aborted, true);
  assert.equal(abortController.signal.reason, 'component unmounted');
  assert.equal(activeGenerationRef.current, undefined);
  assert.deepEqual(cancelledFrameIds, [1]);
  assert.equal(flushes.length, 0);

  scheduler.flushNow();
  assert.equal(flushes.length, 0);

  const idleCleanup = createGenerationUnmountCleanup({ current: undefined });
  assert.doesNotThrow(() => idleCleanup());
});

test('chat interface routes every message flush through the conversation captured at submit time', () => {
  const chatSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/chat-interface.tsx'), 'utf8');
  const routedCalls = chatSource.match(/onMessagesChange\(submissionConversationId, displayedMessages\)/g);

  assert.equal(routedCalls?.length, 2);
  assert.doesNotMatch(chatSource, /onMessagesChange\(displayedMessages\)/);
  assert.match(chatSource, /onFormGenerated\?\.\(submissionConversationId, formCode\)/);
  assert.match(chatSource, /useEffect\(\(\) => createGenerationUnmountCleanup\(activeGenerationRef\), \[\]\)/);
});

test('sidebar history and settings render without backend or settings UI bypasses', () => {
  const providerSettings = createDefaultProviderSettings('openrouter');
  const providerSecrets: ProviderSecrets = { provider: 'openrouter', apiKey: '' };
  const conversation: AiConversation = {
    id: 'conversation-sidebar',
    title: 'Sidebar conversation',
    messages: [{ id: 'assistant-sidebar', role: 'assistant', content: 'Raw response', rawContent: 'Raw response', status: 'completed' }],
    createdAt: 1,
    updatedAt: 2,
  };

  const historyMarkup = renderToStaticMarkup(createElement(ConversationHistory, {
    conversations: [conversation],
    currentConversationId: conversation.id,
    onSelectConversation: () => undefined,
    onDeleteConversation: () => undefined,
    onNewConversation: () => undefined,
    onExportConversation: () => undefined,
  }));
  const modelMarkup = renderToStaticMarkup(createElement(SidebarContent, {
    activeView: 'model',
    isCollapsed: false,
    conversations: [conversation],
    currentConversation: conversation,
    currentConversationId: conversation.id,
    providerSettings,
    providerSecrets,
    providerSecretPersistence: { mode: 'local', rememberKey: true },
    modelCatalogs: {},
    parserConfig: defaultParserConfig,
    onProviderAccessChange: () => undefined,
    onProviderSecretPersistenceChange: () => undefined,
    onClearProviderSecrets: () => undefined,
    onRefreshProviderModels: () => undefined,
    onParserConfigChange: () => undefined,
    onSelectConversation: () => undefined,
    onDeleteConversation: () => undefined,
    onNewConversation: () => undefined,
    onExportConversation: () => undefined,
  }));
  const iconsMarkup = renderToStaticMarkup(createElement(SidebarIcons, {
    isCollapsed: false,
    activeView: 'history',
    onToggleCollapse: () => undefined,
    onViewChange: () => undefined,
  }));

  assert.match(historyMarkup, /Sidebar conversation/);
  assert.match(modelMarkup, /Model settings/);
  assert.match(modelMarkup, /minimax\/minimax-2.7/);
  assert.match(iconsMarkup, /AI builder sidebar/);
});

test('model autocomplete filters catalog entries and preserves custom selected model', () => {
  const options = getFilteredModelOptions([
    { id: 'openai/gpt-5.4-mini', label: 'GPT 5.4 mini' },
    { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  ], 'sonnet', 'custom/model');

  assert.deepEqual(options.map((option) => option.id), ['custom/model', 'anthropic/claude-sonnet-4-6']);
});

test('numeric settings drafts commit clamped values and never commit empty input as zero', () => {
  assert.deepEqual(evaluateNumberDraft('0.', { min: 0, max: 2, allowClear: false }), { kind: 'commit', value: 0 });
  assert.deepEqual(evaluateNumberDraft('0.5', { min: 0, max: 2, allowClear: false }), { kind: 'commit', value: 0.5 });
  assert.deepEqual(evaluateNumberDraft('-1', { min: 0, max: 2, allowClear: false }), { kind: 'commit', value: 0 });
  assert.deepEqual(evaluateNumberDraft('3', { min: 0, max: 2, allowClear: false }), { kind: 'commit', value: 2 });
  assert.deepEqual(evaluateNumberDraft('1e3', { min: 1, allowClear: false }), { kind: 'commit', value: 1000 });
  assert.deepEqual(evaluateNumberDraft('not-a-number', { min: 0, max: 2, allowClear: false }), { kind: 'keep' });
  assert.deepEqual(evaluateNumberDraft('', { min: 0, max: 2, allowClear: false }), { kind: 'keep' });
  assert.deepEqual(evaluateNumberDraft('', { min: 0, max: 2, allowClear: true }), { kind: 'clear' });
  assert.deepEqual(evaluateNumberDraft('0', { min: 1000, max: 10000000, allowClear: false }), { kind: 'commit', value: 1000 });
  assert.deepEqual(evaluateNumberDraft('500', { min: 1000, max: 10000000, allowClear: false }), { kind: 'commit', value: 1000 });
  assert.deepEqual(evaluateNumberDraft('99999999', { min: 1000, max: 10000000, allowClear: false }), { kind: 'commit', value: 10000000 });
});

test('numeric settings inputs keep raw keystroke drafts and normalize the display on blur', () => {
  const agentSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/agent-settings.tsx'), 'utf8');
  const parserSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/parser-settings.tsx'), 'utf8');

  assert.match(agentSource, /const \[draft, setDraft\] = useState<string \| null>\(null\)/);
  assert.match(agentSource, /setDraft\(rawValue\);/);
  assert.match(agentSource, /onBlur=\{\(\) => setDraft\(null\)\}/);
  assert.match(agentSource, /inputMode="decimal"/);
  assert.doesNotMatch(agentSource, /parseOptionalNumber/);
  assert.doesNotMatch(agentSource, /type="number"/);
  assert.doesNotMatch(parserSource, /parseNumber/);
  assert.doesNotMatch(parserSource, /type="number"/);

  const modelMarkup = renderToStaticMarkup(createElement(AgentSettings, {
    settings: { provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic, temperature: 0.5, maxTokens: 2000, thinkingBudgetTokens: 512 },
    secrets: { provider: 'anthropic', apiKey: '' },
    onChange: () => undefined,
  }));
  const parserMarkup = renderToStaticMarkup(createElement(ParserSettings, {
    config: { ...defaultParserConfig, maxCodeLength: 250000, maxNestingDepth: 12 },
    onChange: () => undefined,
  }));

  assert.match(modelMarkup, /value="0\.5"/);
  assert.match(modelMarkup, /value="2000"/);
  assert.match(modelMarkup, /value="512"/);
  assert.match(parserMarkup, /value="250000"/);
  assert.match(parserMarkup, /value="12"/);
});

test('provider settings explain BYOK persistence and model settings keep Anthropic thinking scoped', () => {
  const anthropicSettings = { provider: 'anthropic', model: DEFAULT_TANSTACK_AI_MODELS.anthropic, temperature: 0.5, maxTokens: 2000, thinkingBudgetTokens: 512 } satisfies ProviderSettings;
  const providerSecrets: ProviderSecrets = { provider: 'anthropic', apiKey: '' };
  const providerMarkup = renderToStaticMarkup(createElement(ProviderSelection, {
    settings: anthropicSettings,
    secrets: providerSecrets,
    persistencePreference: { mode: 'local', rememberKey: true },
    onChange: () => undefined,
    onPersistencePreferenceChange: () => undefined,
    onClearStoredSecrets: () => undefined,
  }));
  const modelMarkup = renderToStaticMarkup(createElement(AgentSettings, {
    settings: anthropicSettings,
    secrets: providerSecrets,
    onChange: () => undefined,
  }));
  const openAiModelMarkup = renderToStaticMarkup(createElement(AgentSettings, {
    settings: createDefaultProviderSettings('openai'),
    secrets: { provider: 'openai', apiKey: '' },
    onChange: () => undefined,
  }));

  assert.match(providerMarkup, /Bring your own key/);
  assert.match(providerMarkup, /Local storage keeps the key/);
  assert.match(providerMarkup, /Wipe stored key/);
  assert.match(modelMarkup, /Thinking budget tokens/);
  assert.match(openAiModelMarkup, /Thinking budget controls are only available for Anthropic/);
});

test('parser settings render synced parser config and system prompt preview', () => {
  const config = { ...defaultParserConfig, customInstructions: 'Use concise labels.' };
  const parserMarkup = renderToStaticMarkup(createElement(ParserSettings, {
    config,
    onChange: () => undefined,
  }));
  const prompt = generateSystemPrompt(config);

  assert.match(parserMarkup, /Parser settings/);
  assert.match(parserMarkup, /System prompt preview/);
  assert.match(parserMarkup, /Copy prompt/);
  assert.match(parserMarkup, /Strict Validation/);
  assert.match(prompt, /lowercase ```formedible fenced block/);
  assert.match(prompt, /Use concise labels/);
});

test('custom instructions keep typed spaces while editing and commit trimmed values on blur', () => {
  assert.equal(normalizeCustomInstructions('  Use concise labels.  '), 'Use concise labels.');
  assert.equal(normalizeCustomInstructions('Use  double  spaces'), 'Use  double  spaces');
  assert.equal(normalizeCustomInstructions('Add a phone field '), 'Add a phone field');
  assert.equal(normalizeCustomInstructions('   '), undefined);
  assert.equal(normalizeCustomInstructions(''), undefined);

  const parserMarkup = renderToStaticMarkup(createElement(ParserSettings, {
    config: { ...defaultParserConfig, customInstructions: 'Add a phone field ' },
    onChange: () => undefined,
  }));
  const parserSource = readFileSync(resolve(process.cwd(), 'src/components/formedible/ai/parser-settings.tsx'), 'utf8');

  assert.match(parserMarkup, /Add a phone field\s/);
  assert.match(parserSource, /customInstructions: event\.target\.value\.length > 0 \? event\.target\.value : undefined/);
  assert.match(parserSource, /onBlur=\{\(event\) => \{\s*const customInstructions = normalizeCustomInstructions\(event\.target\.value\);/);
  assert.doesNotMatch(parserSource, /\.trim\(\) \|\| undefined/);
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
    'src/components/formedible/ai/agent-settings.tsx',
    'src/components/formedible/ai/ai-form-renderer.tsx',
    'src/components/formedible/ai/chat-interface.tsx',
    'src/components/formedible/ai/chat-messages.tsx',
    'src/components/formedible/ai/conversation-history.tsx',
    'src/components/formedible/ai/markdown-message.tsx',
    'src/components/formedible/ai/parser-settings.tsx',
    'src/components/formedible/ai/provider-selection.tsx',
    'src/components/formedible/ai/raw-output-panel.tsx',
    'src/components/formedible/ai/sidebar-content.tsx',
    'src/components/formedible/ai/sidebar-icons.tsx',
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
