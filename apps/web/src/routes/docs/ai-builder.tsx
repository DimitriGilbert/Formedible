import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/ai-builder');

const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'Builder', description: 'Use the visual builder when authors want fields, tabs, and preview controls instead of chat.', href: '/docs/builder' },
  { title: 'Parser', description: 'See how generated text becomes a checked Formedible form config.', href: '/docs/parser' },
  { title: 'Getting started', description: 'Install the copied files and render your first form.', href: '/docs/getting-started' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Public exports',
    body: 'Import AI builder pieces from the package root. It exports AIBuilder, parser pieces, provider helpers, TanStack AI adapters, storage helpers, and public types.',
    bullets: [
      'AIBuilder, ProviderSelection, ParserSettings, ChatInterface, and AiFormRenderer are root exports.',
      'createDefaultProviderSettings, createDefaultProviderSecrets, providerOptions, and validateProviderAccess are exported from provider-selection.',
      'createTanStackTextAdapter, DEFAULT_TANSTACK_AI_MODELS, and SUPPORTED_TANSTACK_AI_PROVIDERS are exported from ai-adapters.',
      'Storage exports include readPersistedAIBuilderState, persistProviderSettings, persistProviderSecrets, persistConversations, exportConversation, and STORAGE_KEYS.',
    ],
    snippet: {
      title: 'packages/ai-builder/src/index.ts',
      language: 'ts',
      code: `export { AIBuilder } from '@/components/ui/formedible/ai/ai-builder';
export { AiFormRenderer, parseAiToFormedible } from '@/components/ui/formedible/ai/ai-form-renderer';
export { ChatInterface, generateAiFormCode } from '@/components/ui/formedible/ai/chat-interface';
export { ParserSettings } from '@/components/ui/formedible/ai/parser-settings';
export { createDefaultProviderSecrets, createDefaultProviderSettings, providerOptions, ProviderSelection, validateProviderAccess } from '@/components/ui/formedible/ai/provider-selection';
export { createTanStackTextAdapter, DEFAULT_TANSTACK_AI_MODELS, SUPPORTED_TANSTACK_AI_PROVIDERS } from '@/components/ui/formedible/lib/ai-adapters';
export { canUseStorage, exportConversation, persistConversations, persistProviderSecrets, persistProviderSettings, readPersistedAIBuilderState, STORAGE_KEYS } from '@/components/ui/formedible/lib/ai-storage';`,
    },
  },
  {
    title: 'AIBuilder provider setup',
    body: 'AIBuilder can own provider state or accept controlled providerSettings and providerSecrets. It passes provider access, system prompt, parser config, messages, and form callbacks into ChatInterface.',
    bullets: [
      'mode defaults to client.',
      'resolveInitialProviderAccess reads persisted settings, then chooses controlled secrets, stored secrets, or an empty key for the active provider.',
      'Provider settings are persisted only when providerSettings is not controlled.',
      'Provider secrets are persisted only when providerSecrets is not controlled.',
      'The preview side renders AiFormRenderer only after formCode exists.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('mode', 'AIBuilderMode', "'client'", 'Only client mode is defined by AIBuilderMode.'),
        createPropertyRow('providerSettings', 'ProviderSettings', 'Persisted/default', 'Optional controlled provider, model, temperature, maxTokens, and Anthropic thinking budget.'),
        createPropertyRow('providerSecrets', 'ProviderSecrets', 'Stored/empty', 'Optional controlled provider key object paired with the selected provider.'),
        createPropertyRow('onFormGenerated', '(formCode: string) => void', 'undefined', 'Called when AIBuilder stores the latest generated form code.'),
        createPropertyRow('onFormSubmit', '(formData: FormedibleFormValues) => void | Promise<void>', 'undefined', 'Passed through to AiFormRenderer submit handling.'),
      ],
    },
    snippet: {
      title: 'packages/ai-builder/src/components/formedible/ai/ai-builder.tsx',
      language: 'tsx',
      code: `export interface AIBuilderProps {
  readonly className?: string;
  readonly mode?: AIBuilderMode;
  readonly providerSettings?: ProviderSettings;
  readonly providerSecrets?: ProviderSecrets;
  readonly onProviderSettingsChange?: (providerSettings: ProviderSettings) => void;
  readonly onProviderSecretsChange?: (providerSecrets: ProviderSecrets) => void;
  readonly onFormGenerated?: (formCode: string) => void;
  readonly onFormSubmit?: (formData: FormedibleFormValues) => void | Promise<void>;
}

<ChatInterface
  providerSettings={providerSettings}
  providerSecrets={providerSecrets}
  mode={mode}
  messages={messages}
  onMessagesChange={updateMessages}
  onFormGenerated={updateFormCode}
  systemPrompt={systemPrompt}
  parserConfig={aiParserConfig}
/>

{formCode ? <AiFormRenderer code={formCode} parserConfig={aiParserConfig} onSubmit={onFormSubmit} /> : null}`,
    },
  },
  {
    title: 'Provider and model lists',
    body: 'Provider support lives in providerOptions, ai-adapters, and the provider model catalog fetcher.',
    bullets: [
      'providerOptions contains openai, anthropic, and openrouter, all requiring keys.',
      'DEFAULT_TANSTACK_AI_MODELS sets openai to gpt-5.4-mini, anthropic to claude-sonnet-4-6, and openrouter to minimax/minimax-2.7.',
      'createTanStackTextAdapter preserves custom model strings instead of falling back silently.',
      'Model catalogs are fetched from provider APIs, cached locally, and refreshed on demand.',
      'createTanStackModelOptions only returns Anthropic thinking options when thinkingBudgetTokens is positive.',
    ],
    table: {
      headers: ['Provider', 'Default model', 'Model catalog source'],
      rows: [
        { cells: ['openai', 'gpt-5.4-mini', 'GET https://api.openai.com/v1/models'] },
        { cells: ['anthropic', 'claude-sonnet-4-6', 'GET https://api.anthropic.com/v1/models'] },
        { cells: ['openrouter', 'minimax/minimax-2.7', 'GET https://openrouter.ai/api/v1/models?output_modalities=text'] },
      ],
    },
    snippet: {
      title: 'packages/ai-builder/src/lib/formedible/ai-adapters.ts',
      language: 'ts',
      code: `export const SUPPORTED_TANSTACK_AI_PROVIDERS = ['openai', 'anthropic', 'openrouter'] as const satisfies readonly AIProvider[];

export const DEFAULT_TANSTACK_AI_MODELS = {
  openai: 'gpt-5.4-mini',
  anthropic: 'claude-sonnet-4-6',
  openrouter: 'minimax/minimax-2.7',
} as const;

export function createTanStackTextAdapter(settings: ProviderSettings, secrets: ProviderSecrets): AnyTextAdapter {
  assertMatchingSecrets(settings, secrets);
  assertNoUnsupportedRuntimeOptions(settings);

  if (settings.provider === 'openai') {
    return createOpenaiChat(settings.model as unknown as OpenAIAdapterModel, secrets.apiKey);
  }

  if (settings.provider === 'anthropic') {
    return createAnthropicChat(settings.model as unknown as AnthropicAdapterModel, secrets.apiKey);
  }

  return createOpenRouterText(settings.model as unknown as OpenRouterAdapterModel, secrets.apiKey);
}`,
    },
  },
  {
    title: 'Provider validation and model options',
    body: 'Provider selection rejects mismatched secrets, unsupported providers, custom endpoints, non-Anthropic thinking budgets, and missing API keys.',
    bullets: [
      'createDefaultProviderSettings picks the selected provider option and copies its defaultModel.',
      'validateProviderAccess requires settings and secrets to target the same provider.',
      'endpoint and baseURL keys are rejected by both validateProviderAccess and assertNoUnsupportedRuntimeOptions.',
      'thinkingBudgetTokens is accepted only for Anthropic provider settings.',
    ],
    snippet: {
      title: 'packages/ai-builder/src/components/formedible/ai/provider-selection.tsx',
      language: 'ts',
      code: `export const providerOptions = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-5.4-mini', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-4-6', requiresKey: true },
  { value: 'openrouter', label: 'OpenRouter', defaultModel: 'minimax/minimax-2.7', requiresKey: true },
] as const;

export function validateProviderAccess(settings: ProviderSettings | null, secrets: ProviderSecrets | null): string | undefined {
  if (!settings) return 'Provider settings are required.';
  if (!secrets) return 'Provider secrets are required.';

  const provider = providerOptions.find((entry) => entry.value === settings.provider);

  if (!provider) return 'Unsupported AI provider.';
  if (settings.provider !== secrets.provider) return 'Provider settings and secrets must target the same provider.';
  if ('endpoint' in settings || 'baseURL' in settings) return 'Custom provider endpoints are not supported. Select OpenAI, Anthropic, or OpenRouter without endpoint/baseURL overrides.';
  if (settings.provider !== 'anthropic' && 'thinkingBudgetTokens' in settings) return 'Thinking budget tokens are only supported for Anthropic.';
  if (provider.requiresKey && secrets.apiKey.trim().length === 0) return \`API key is required for \${provider.label}.\`;
  return undefined;
}`,
    },
  },
  {
    title: 'Chat streaming and parser handoff',
    body: 'ChatInterface streams events into one assistant message. When the stream completes, it extracts a Formedible fence, parses it, stores parse errors on the message, and calls onFormGenerated.',
    bullets: [
      'Enter submits the prompt and Shift+Enter keeps the newline because the handler only submits when event.key is Enter and shiftKey is false.',
      'streamAiResponse events are scheduled through createAiStreamScheduler before the assistant message is updated.',
      'extractFormCode runs only when the final status is completed.',
      'parseAiToFormedible writes formConfig on success and parseErrors on failure.',
    ],
    snippet: {
      title: 'packages/ai-builder/src/components/formedible/ai/chat-interface.tsx',
      language: 'tsx',
      code: `for await (const event of streamAiResponse(request, { abortController: nextAbortController })) {
  if (event.type === 'finish') finishReason = event.finishReason;
  if (event.type === 'error') finishReason = 'error';
  streamScheduler.enqueue(event);
}

const finalStatus = resolveMessageStatus(finishReason, streamedEvents);
const formCode = finalStatus === 'completed' ? extractFormCode(streamedContent) : undefined;
const parseResult = formCode ? parseAiToFormedible(formCode, parserConfig) : undefined;

const finalAssistantMessage: AiMessage = {
  ...assistantMessage,
  formCode,
  formConfig: parseResult?.success ? parseResult.formOptions : undefined,
  parseErrors: parseResult?.success === false ? parseResult.errors : undefined,
  status: finalStatus,
};`,
    },
  },
  {
    title: 'Parser integration and preview',
    body: 'AI Builder does not render generated text directly. parseAiToFormedible calls FormedibleParser.parseAiOutput, and AiFormRenderer passes parsed options into useFormedible.',
    bullets: [
      'parseAiToFormedible forwards strictValidation and allowed key/type lists into FormedibleParser.parseAiOutput.',
      'inferDefaultValues fills booleans with false, number-like fields with 0, multiSelect/array with [], object/location with {}, and other fields with an empty string.',
      'AiFormRenderer calls onParseComplete after reparsing non-streaming code.',
      'Preview submits through the parsed onSubmit handler first, then through AIBuilder onFormSubmit.',
    ],
    snippet: {
      title: 'packages/ai-builder/src/lib/formedible/ai-parser.ts and ai-form-renderer.tsx',
      language: 'tsx',
      code: `export function parseAiToFormedible(code: string, parserConfig?: AiParserConfig): AiFormParseResult {
  const result = FormedibleParser.parseAiOutput(code, {
    strictValidation: parserConfig?.strictValidation ?? true,
    allowedFieldTypes: parserConfig?.allowedFieldTypes,
    allowedKeys: parserConfig?.allowedKeys,
    allowedFieldKeys: parserConfig?.allowedFieldKeys,
  });

  if (!result.success || result.config === undefined) {
    return { schema: undefined, formOptions: { fields: [], formOptions: { defaultValues: {} } }, success: false, errors: result.errors.map(toAiParseError) };
  }

  const formOptions = parserConfig?.inferDefaultValues === false ? result.config : inferDefaultValues(result.config);
  return { schema: formOptions.schema, formOptions, success: true, errors: result.errors.map(toAiParseError) };
}

function ParsedForm({ options }: { readonly options: UseFormedibleOptions<FormedibleFormValues> }) {
  const { Form } = useFormedible(options);
  return <Form />;
}`,
    },
  },
  {
    title: 'Storage and export',
    body: 'AI Builder uses separate browser keys for provider settings, provider secrets, model catalogs, conversations, and UI state. Secret persistence can be memory, session, or local.',
    bullets: [
      'STORAGE_KEYS names five independent storage entries, including the cached provider model catalogs.',
      'persistProviderSecrets clears both storage areas first; memory mode stores nothing.',
      'rememberKey false stores the preference but not the secret value.',
      'persistConversations writes sanitized conversations, and exportConversation returns a sanitized export envelope.',
    ],
    snippet: {
      title: 'packages/ai-builder/src/lib/formedible/ai-storage.ts',
      language: 'ts',
      code: `export const STORAGE_KEYS = {
  providerSettings: 'formedible-ai-builder-provider-settings',
  providerSecrets: 'formedible-ai-builder-provider-secrets',
  modelCatalogs: 'formedible-ai-builder-model-catalogs',
  conversations: 'formedible-ai-builder-conversations',
  uiState: 'formedible-ai-builder-ui-state',
} as const;

export function persistProviderSecrets(secrets: ProviderSecrets, preference: ProviderSecretPersistencePreference): void {
  clearStoredProviderSecrets();

  if (preference.mode === 'memory') {
    return;
  }

  const storedSecrets: StoredProviderSecrets = preference.rememberKey
    ? { version: AI_STORAGE_VERSION, preference, secrets }
    : { version: AI_STORAGE_VERSION, preference };

  writeJson(STORAGE_KEYS.providerSecrets, storedSecrets, preference.mode);
}`,
    },
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/ai-builder')({
  head: () => routeHead,
  component: AiBuilderRoute,
});

function AiBuilderRoute() {
  return (
    <DocsGuidePage
      eyebrow="AI Builder"
      title="Generate forms from chat, then review the live result."
      description="AI Builder turns a prompt into Formedible code, parses it locally, and shows the form beside the chat so teams can review it before shipping."
      codeExampleIds={['ai-builder-imports']}
      related={relatedLinks}
      sections={sections}
    />
  );
}
