# @formedible/ai-builder

The AI builder package wraps core Formedible, the parser package, and TanStack AI adapters into an interactive form-generation workspace. It handles provider settings, API-key storage preferences, chat messages, streamed output, lowercase `formedible` fence extraction, parser settings, generated form preview, and conversation export.

Public install item:

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/ai-builder.json
```

The registry item is `ai-builder` in `packages/ai-builder/registry.json`. It depends on:

- `https://formedible.dev/r/formedible-core.json`
- `https://formedible.dev/r/formedible-parser.json`

## Public exports

`packages/ai-builder/src/index.ts` re-exports these names.

### Components

- `AIBuilder`
- `AgentSettings`
- `AiFormRenderer`
- `ChatInterface`
- `ConversationHistory`
- `ParserSettings`
- `ProviderSelection`
- `SidebarContent`
- `SidebarIcons`

### Parser and generation helpers

- `parseAiToFormedible`
- `generateAiFormCode`
- `extractFormCode`

### Provider helpers

- `createDefaultProviderSecrets`
- `createDefaultProviderSettings`
- `providerOptions`
- `validateProviderAccess`
- `createTanStackTextAdapter`
- `DEFAULT_TANSTACK_AI_MODELS`
- `SUPPORTED_TANSTACK_AI_PROVIDERS`

### Message and storage helpers

- `normalizePersistedAiMessage`
- `normalizePersistedAiMessages`
- `toPersistedAiMessage`
- `toTanStackMessageInput`
- `toTanStackMessageInputs`
- `toTanStackSystemPrompts`
- `canUseStorage`
- `clearConversations`
- `clearStoredProviderSecrets`
- `createConversation`
- `exportConversation`
- `getLastFormCode`
- `persistConversations`
- `persistProviderSecrets`
- `persistProviderSettings`
- `persistUiState`
- `readJson`
- `readPersistedAIBuilderState`
- `readStoredProviderSecrets`
- `STORAGE_KEYS`
- `upsertConversation`
- `writeJson`

### Types

Exports include provider types (`ProviderSettings`, `ProviderSecrets`, adapter model types), message/conversation types (`AiMessage`, `AiConversation`, `AiConversationExport`), parser/result types (`AiFormParseResult`, `AiParserConfig`, `AiParseError`), and storage types (`PersistedAIBuilderState`, `ProviderSecretStorageMode`, `StorageArea`, `StoredProviderSecrets`). See `src/index.ts` and `src/lib/formedible/ai-types.ts`.

## Use the full AI builder

```tsx
import { useState } from 'react';

import { AIBuilder, createDefaultProviderSettings } from '@/components/ui/formedible/ai';
import type { FormedibleFormValues } from '@/components/ui/formedible/lib/types';

async function submitGeneratedForm(formData: FormedibleFormValues) {
  await fetch('/api/generated-form-submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
}

export function AiBuilderPage() {
  const [generatedCode, setGeneratedCode] = useState('');

  return (
    <section>
      <AIBuilder
        providerSettings={createDefaultProviderSettings('openrouter')}
        onFormGenerated={(formCode) => {
          setGeneratedCode(formCode);
        }}
        onFormSubmit={async (formData) => {
          await submitGeneratedForm(formData);
        }}
      />
      {generatedCode ? <textarea readOnly value={generatedCode} /> : null}
    </section>
  );
}
```

`AIBuilderProps` is defined in `src/components/formedible/ai/ai-builder.tsx:22`. The current `AIBuilderMode` is `'client'` (`src/lib/formedible/ai-types.ts:6`). Provider validation requires matching provider settings and secrets; unsupported custom endpoints are rejected by `createTanStackTextAdapter` (`src/lib/formedible/ai-adapters.ts:83`).

## Render AI output without the full chat UI

```tsx
import { useState } from 'react';

import { AiFormRenderer } from '@/components/ui/formedible/ai';
import type { AiFormParseResult } from '@/components/ui/formedible/ai';

const generatedCode = `{
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'subscribe', type: 'checkbox', label: 'Subscribe' }
  ],
  submitLabel: 'Join',
  formOptions: { defaultValues: { email: '' } }
}`;

export function GeneratedPreview() {
  const [parseResult, setParseResult] = useState<AiFormParseResult | null>(null);

  return (
    <section data-parse-state={parseResult?.success ? 'ready' : 'pending'}>
      <AiFormRenderer
        code={generatedCode}
        onParseComplete={(result) => {
          setParseResult(result);
        }}
        onSubmit={async (formData) => {
          await submitGeneratedForm(formData);
        }}
      />
    </section>
  );
}
```

`AiFormRenderer` parses code with `parseAiToFormedible`, builds `UseFormedibleOptions<FormedibleFormValues>`, and renders the core `useFormedible` form (`src/components/formedible/ai/ai-form-renderer.tsx:29`).

## Provider adapters

```ts
import {
  DEFAULT_TANSTACK_AI_MODELS,
  SUPPORTED_TANSTACK_AI_PROVIDERS,
  createTanStackTextAdapter,
} from '@/components/ui/formedible/ai';

const settings = {
  provider: 'openrouter',
  model: DEFAULT_TANSTACK_AI_MODELS.openrouter,
  temperature: 0.2,
  maxTokens: 1000,
} as const;

export function createOpenRouterFormAdapter(apiKey: string) {
  return createTanStackTextAdapter(settings, {
    provider: 'openrouter',
    apiKey,
  });
}

export const supportedProviderNames = [...SUPPORTED_TANSTACK_AI_PROVIDERS];
```

Supported providers are `openai`, `anthropic`, and `openrouter` (`src/lib/formedible/ai-adapters.ts:15`). Default models are `gpt-4o-mini`, `claude-sonnet-4-5`, and `openai/gpt-4o-mini` (`src/lib/formedible/ai-adapters.ts:17`).

## Parser contract

AI form extraction requires a lowercase fenced block:

````md
```formedible
{ fields: [{ name: 'email', type: 'email', label: 'Email' }] }
```
````

`packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts` checks that `json`, `ts`, and unfenced object output are not treated as generated form code. This package delegates the final parse contract to `@formedible/formedible-parser`.

## Storage contract

Storage helpers persist provider settings, optional provider secrets, UI state, and conversations. Conversation export sanitizes generated form configs by dropping executable callbacks and converting serializable values, as covered by `src/lib/formedible/ai-storage.test.ts`.

## Package scripts

Exact scripts from `packages/ai-builder/package.json`:

```bash
pnpm --filter @formedible/ai-builder run check-types
pnpm --filter @formedible/ai-builder run test
pnpm --filter @formedible/ai-builder run build
pnpm --filter @formedible/ai-builder run build:registry
pnpm --filter @formedible/ai-builder run sync
```

Root equivalents used most often:

```bash
pnpm run build:ai-builder
pnpm run check-types:ai-builder
pnpm run check-types
```

## Source-backed docs and tests

- Docs route: `/docs/ai-builder`.
- Interactive route: `/ai-builder`.
- Source entrypoint: `packages/ai-builder/src/index.ts`.
- Main component: `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`.
- Parser renderer: `packages/ai-builder/src/components/formedible/ai/ai-form-renderer.tsx`.
- Provider adapters: `packages/ai-builder/src/lib/formedible/ai-adapters.ts`.
- Tests: `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts`, `packages/ai-builder/src/lib/formedible/ai-storage.test.ts`.
