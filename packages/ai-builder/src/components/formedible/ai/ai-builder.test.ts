import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { AI_BUILDER_DEFAULT_MODE, AIBuilder, resolveInitialProviderAccess } from '@/components/formedible/ai/ai-builder';
import { AiFormRenderer, parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';
import { generateAiFormCode } from '@/components/formedible/ai/chat-interface';
import { createDefaultProviderSecrets, createDefaultProviderSettings, providerOptions, validateProviderAccess } from '@/components/formedible/ai/provider-selection';
import { createTanStackTextAdapter, DEFAULT_TANSTACK_AI_MODELS, SUPPORTED_TANSTACK_AI_PROVIDERS } from '@/lib/formedible/ai-adapters';
import { parseAiToFormedible as parseAiCode } from '@/lib/formedible/ai-parser';
import { canUseStorage, clearConversations, clearStoredProviderSecrets, exportConversation, persistConversations, persistProviderSecrets, persistProviderSettings, persistUiState, readPersistedAIBuilderState, readStoredProviderSecrets, STORAGE_KEYS, upsertConversation, writeJson } from '@/lib/formedible/ai-storage';
import type { AiConversation, AiMessage, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';

const sampleFormCode = `{
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'subscribe', type: 'checkbox', label: 'Subscribe' }
  ],
  submitLabel: 'Join',
  formOptions: { defaultValues: { email: 'test@example.com' } }
}`;

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
    'src/components/formedible/ai/provider-selection.tsx',
    'src/lib/formedible/ai-adapters.ts',
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
