import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { AI_BUILDER_DEFAULT_MODE, AIBuilder, canUseStorage, readJson, readPersistedAIBuilderState, STORAGE_KEYS, upsertConversation, writeJson } from '@/components/formedible/ai/ai-builder';
import { AiFormRenderer, parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';
import { generateAiFormCode } from '@/components/formedible/ai/chat-interface';
import { createDefaultProviderConfig, providerOptions, validateProviderConfig } from '@/components/formedible/ai/provider-selection';
import { extractFormCode, parseAiToFormedible as parseAiCode } from '@/lib/formedible/ai-parser';
import type { AiConversation, AiMessage, AIProvider, ProviderConfig } from '@/lib/formedible/ai-types';

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
  assert.equal(AI_BUILDER_DEFAULT_MODE, 'direct');
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
  assert.ok(providerOptions.some((provider) => provider.value === 'openrouter'));
  assert.ok(providerOptions.some((provider) => provider.value === 'openai-compatible'));
  assert.deepEqual(createDefaultProviderConfig('openai-compatible'), {
    provider: 'openai-compatible',
    model: 'gpt-4o-mini',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 4000,
  });
});

test('provider validation requires keys and openai-compatible endpoints', () => {
  assert.match(validateProviderConfig(createDefaultProviderConfig('openai')) ?? '', /API key/i);
  assert.match(validateProviderConfig(createDefaultProviderConfig('openai-compatible')) ?? '', /endpoint/i);

  const compatibleConfig: ProviderConfig = {
    ...createDefaultProviderConfig('openai-compatible'),
    endpoint: 'https://example.test/v1',
  };

  assert.equal(validateProviderConfig(compatibleConfig), undefined);
});

test('AI builder reads and writes persisted provider config, UI state, and conversation history', () => {
  const storage = new MemoryStorage();
  const restoreWindow = installWindowStorage(storage);
  const providerConfig: ProviderConfig = { ...createDefaultProviderConfig('openrouter'), apiKey: 'persisted-key', model: 'anthropic/claude-3.5-sonnet', temperature: 0.3, maxTokens: 2222 };
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
    window.localStorage.setItem(STORAGE_KEYS.providerConfig, JSON.stringify(providerConfig));
    window.localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
    window.localStorage.setItem(STORAGE_KEYS.uiState, JSON.stringify({ currentConversationId: 'conversation-2' }));

    const persistedState = readPersistedAIBuilderState();

    assert.equal(canUseStorage(), true);
    assert.deepEqual(persistedState.providerConfig, providerConfig);
    assert.deepEqual(persistedState.conversations, conversations);
    assert.equal(persistedState.currentConversationId, 'conversation-2');

    const nextProviderConfig: ProviderConfig = { ...createDefaultProviderConfig('openai-compatible'), apiKey: 'local-key', endpoint: 'https://llm.test/v1' };
    writeJson(STORAGE_KEYS.providerConfig, nextProviderConfig);
    writeJson(STORAGE_KEYS.uiState, { currentConversationId: 'conversation-1' });

    assert.deepEqual(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.providerConfig) ?? '{}'), nextProviderConfig);
    assert.deepEqual(readJson(STORAGE_KEYS.uiState, {}), { currentConversationId: 'conversation-1' });
  } finally {
    restoreWindow();
  }
});

test('AI builder storage helpers fall back safely when storage is unavailable for SSR', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'window');

  try {
    const fallbackProviderConfig = createDefaultProviderConfig('anthropic');
    const persistedState = readPersistedAIBuilderState(fallbackProviderConfig);

    assert.equal(canUseStorage(), false);
    assert.deepEqual(readJson(STORAGE_KEYS.conversations, [] as readonly AiConversation[]), []);
    assert.doesNotThrow(() => writeJson(STORAGE_KEYS.uiState, { currentConversationId: 'conversation-1' }));
    assert.deepEqual(persistedState.providerConfig, fallbackProviderConfig);
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
    assert.deepEqual(readPersistedAIBuilderState().providerConfig, createDefaultProviderConfig());
    assert.doesNotThrow(() => writeJson(STORAGE_KEYS.providerConfig, fallbackProviderConfig));
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
      return;
    }

    Reflect.deleteProperty(globalThis, 'window');
  }
});

test('chat generation extracts conversation form schemas', async () => {
  const userMessage: AiMessage = { id: 'm1', role: 'user', content: 'Create a signup form' };
  const messages: readonly AiMessage[] = [userMessage];
  const result = await generateAiFormCode(
    { prompt: 'Create a signup form', providerConfig: { ...createDefaultProviderConfig(), apiKey: 'test-key' }, messages, systemPrompt: 'System prompt', userMessage },
    'direct',
    undefined,
    async () => ({ content: `Here is the form:\n\`\`\`formedible\n${sampleFormCode}\n\`\`\`` }),
  );

  assert.equal(result.formCode, sampleFormCode);
  assert.equal(extractFormCode(result.content), sampleFormCode);
});

interface CapturedDirectRequest {
  readonly url: string;
  readonly authorization: string;
  readonly anthropicApiKey: string;
  readonly body: unknown;
}

function responseForProvider(provider: AIProvider): Response {
  if (provider === 'anthropic') {
    return new Response(JSON.stringify({ content: [{ type: 'text', text: sampleFormCode }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (provider === 'google') {
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: sampleFormCode }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ choices: [{ message: { content: sampleFormCode } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function captureDirectProviderRequest(providerConfig: ProviderConfig): Promise<CapturedDirectRequest> {
  const previousFetch = globalThis.fetch;
  const userMessage: AiMessage = { id: 'm1', role: 'user', content: 'Create a contact form' };
  const messages: readonly AiMessage[] = [userMessage];
  let requestUrl = '';
  let requestAuthorization = '';
  let requestAnthropicApiKey = '';
  let requestBody: unknown;

  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    if (init?.headers instanceof Headers) {
      requestAuthorization = init.headers.get('Authorization') ?? '';
    } else if (typeof init?.headers === 'object' && init.headers !== null && !Array.isArray(init.headers)) {
      const headers = init.headers as Readonly<Record<string, string>>;
      requestAuthorization = headers.Authorization ?? '';
      requestAnthropicApiKey = headers['x-api-key'] ?? '';
    }
    requestBody = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;

    return responseForProvider(providerConfig.provider);
  };

  try {
    const result = await generateAiFormCode(
      { prompt: 'Create a contact form', providerConfig, messages, systemPrompt: 'System prompt', userMessage, conversationId: 'conversation-1' },
      'direct',
    );

    assert.equal(result.formCode, sampleFormCode);
    return { url: requestUrl, authorization: requestAuthorization, anthropicApiKey: requestAnthropicApiKey, body: requestBody };
  } finally {
    globalThis.fetch = previousFetch;
  }
}

test('direct generation uses selected provider config through production adapters', async () => {
  const openAiRequest = await captureDirectProviderRequest({ ...createDefaultProviderConfig('openai'), apiKey: 'openai-key', model: 'openai-model', temperature: 0.2, maxTokens: 1234 });
  assert.equal(openAiRequest.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(openAiRequest.authorization, 'Bearer openai-key');
  assert.deepEqual(openAiRequest.body, {
    model: 'openai-model',
    temperature: 0.2,
    max_tokens: 1234,
    stream: false,
    messages: [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Create a contact form' },
    ],
  });

  const anthropicRequest = await captureDirectProviderRequest({ ...createDefaultProviderConfig('anthropic'), apiKey: 'anthropic-key', model: 'anthropic-model', temperature: 0.3, maxTokens: 2345 });
  assert.equal(anthropicRequest.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(anthropicRequest.anthropicApiKey, 'anthropic-key');
  assert.deepEqual(anthropicRequest.body, {
    model: 'anthropic-model',
    system: 'System prompt',
    max_tokens: 2345,
    temperature: 0.3,
    messages: [{ role: 'user', content: 'Create a contact form' }],
  });

  const googleRequest = await captureDirectProviderRequest({ ...createDefaultProviderConfig('google'), apiKey: 'google-key', model: 'google-model', temperature: 0.4, maxTokens: 3456 });
  assert.equal(googleRequest.url, 'https://generativelanguage.googleapis.com/v1beta/models/google-model:generateContent?key=google-key');
  assert.deepEqual(googleRequest.body, {
    systemInstruction: { parts: [{ text: 'System prompt' }] },
    generationConfig: { temperature: 0.4, maxOutputTokens: 3456 },
    contents: [{ role: 'user', parts: [{ text: 'Create a contact form' }] }],
  });

  const mistralRequest = await captureDirectProviderRequest({ ...createDefaultProviderConfig('mistral'), apiKey: 'mistral-key', model: 'mistral-model', temperature: 0.5, maxTokens: 4567 });
  assert.equal(mistralRequest.url, 'https://api.mistral.ai/v1/chat/completions');
  assert.equal(mistralRequest.authorization, 'Bearer mistral-key');
  assert.deepEqual(mistralRequest.body, {
    model: 'mistral-model',
    temperature: 0.5,
    max_tokens: 4567,
    stream: false,
    messages: [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Create a contact form' },
    ],
  });

  const openRouterRequest = await captureDirectProviderRequest({ ...createDefaultProviderConfig('openrouter'), apiKey: 'openrouter-key', model: 'openrouter-model', temperature: 0.6, maxTokens: 5678 });
  assert.equal(openRouterRequest.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(openRouterRequest.authorization, 'Bearer openrouter-key');
  assert.deepEqual(openRouterRequest.body, {
    model: 'openrouter-model',
    temperature: 0.6,
    max_tokens: 5678,
    stream: false,
    messages: [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Create a contact form' },
    ],
  });

  const compatibleRequest = await captureDirectProviderRequest({ ...createDefaultProviderConfig('openai-compatible'), apiKey: 'local-key', endpoint: 'https://llm.test/v1', model: 'local-model', temperature: 0.7, maxTokens: 6789 });
  assert.equal(compatibleRequest.url, 'https://llm.test/v1/chat/completions');
  assert.equal(compatibleRequest.authorization, 'Bearer local-key');
  assert.deepEqual(compatibleRequest.body, {
    model: 'local-model',
    temperature: 0.7,
    max_tokens: 6789,
    stream: false,
    messages: [
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Create a contact form' },
    ],
  });
});

test('backend generation sends streaming conversation contract', async () => {
  const previousFetch = globalThis.fetch;
  const userMessage: AiMessage = { id: 'm1', role: 'user', content: 'Create a contact form' };
  const messages: readonly AiMessage[] = [userMessage];
  let requestBody: unknown;

  globalThis.fetch = async (_input, init) => {
    requestBody = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;

    return new Response(JSON.stringify({ content: sampleFormCode }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const result = await generateAiFormCode(
      { prompt: 'Create a contact form', providerConfig: { ...createDefaultProviderConfig('openai'), apiKey: 'test-key' }, messages, systemPrompt: 'System prompt', userMessage, conversationId: 'conversation-1' },
      'backend',
      { endpoint: 'https://example.test/ai' },
    );

    assert.equal(result.formCode, sampleFormCode);
    assert.deepEqual(requestBody, {
      messages,
      systemPrompt: 'System prompt',
      userMessage,
      providerConfig: { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'test-key', temperature: 0.7, maxTokens: 4000 },
      conversationId: 'conversation-1',
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('backend generation accepts event-stream response chunks', async () => {
  const previousFetch = globalThis.fetch;
  const userMessage: AiMessage = { id: 'm1', role: 'user', content: 'Create a signup form' };
  const messages: readonly AiMessage[] = [userMessage];

  globalThis.fetch = async () => new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: sampleFormCode } }] })}\n\ndata: [DONE]\n\n`, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });

  try {
    const result = await generateAiFormCode(
      { prompt: 'Create a signup form', providerConfig: { ...createDefaultProviderConfig(), apiKey: 'test-key' }, messages, systemPrompt: 'System prompt', userMessage },
      'backend',
      { endpoint: 'https://example.test/ai' },
    );

    assert.equal(result.formCode, sampleFormCode);
  } finally {
    globalThis.fetch = previousFetch;
  }
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
    'src/lib/formedible/ai-parser.ts',
    'src/lib/formedible/ai-types.ts',
  ];

  for (const sourceFile of sourceFiles) {
    const content = readFileSync(resolve(packageRoot, sourceFile), 'utf8');
    assert.doesNotMatch(content, /from ['"]\.\.?\//, `${sourceFile} uses relative internal imports`);
    assert.doesNotMatch(content, /from ['"][^'"]+\.(?:js|mjs)['"]/, `${sourceFile} uses JS import suffixes`);
  }
});
