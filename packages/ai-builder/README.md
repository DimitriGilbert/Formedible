# @formedible/ai-builder

`@formedible/ai-builder` is the AI-assisted Formedible builder package. It gives users a chat panel for describing a form, sends that prompt to a configured AI provider, extracts a Formedible config from the response, and renders the result as a live form preview.

The package is built as a client-side React component set. It ships the `AIBuilder` shell, provider controls, model settings, parser settings, conversation history, raw output inspection, and the parser/renderer boundary used to turn model output into Formedible form options.

## Getting started

Import `AIBuilder` from the package entrypoint and render it in a client component.

```tsx
'use client';

import { AIBuilder } from '@formedible/ai-builder';

export function FormStudio() {
  return (
    <AIBuilder
      onFormGenerated={(formCode) => {
        // Save or inspect the generated Formedible block.
      }}
      onFormSubmit={async (formData) => {
        // Handle submissions from the live preview.
      }}
    />
  );
}
```

`AIBuilder` runs in `client` mode. Provider settings and credentials can be left uncontrolled, in which case the builder manages them in browser state and storage. They can also be controlled by the host app:

```tsx
'use client';

import { AIBuilder, createDefaultProviderSecrets, createDefaultProviderSettings } from '@formedible/ai-builder';
import { useState } from 'react';

export function ControlledFormStudio() {
  const [providerSettings, setProviderSettings] = useState(() => createDefaultProviderSettings('openrouter'));
  const [providerSecrets, setProviderSecrets] = useState(() => createDefaultProviderSecrets('openrouter'));

  return (
    <AIBuilder
      providerSettings={providerSettings}
      providerSecrets={providerSecrets}
      onProviderSettingsChange={setProviderSettings}
      onProviderSecretsChange={setProviderSecrets}
    />
  );
}
```

The user still needs to provide a provider API key before generation works. The built-in provider panel validates that settings and secrets target the same provider and rejects empty keys.

## Providers and models

The adapter layer uses TanStack AI packages and supports three providers: OpenAI, Anthropic, and OpenRouter (`src/lib/formedible/ai-adapters.ts:15`). Custom `endpoint` and `baseURL` overrides are rejected by validation (`src/components/formedible/ai/provider-selection.tsx:68`).

| Provider | Default model | Supported models in source | Extra model options |
| --- | --- | --- | --- |
| OpenAI | `gpt-4o-mini` | `gpt-4o-mini`, `gpt-4o`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano`, `o3-mini` | `temperature`, `maxTokens` |
| Anthropic | `claude-sonnet-4-5` | `claude-sonnet-4-5`, `claude-opus-4-6`, `claude-opus-4-5`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-1`, `claude-sonnet-4`, `claude-3-7-sonnet`, `claude-opus-4`, `claude-3-5-haiku`, `claude-3-haiku`, `claude-opus-4.6-fast`, `claude-opus-4.7` | `temperature`, `maxTokens`, `thinkingBudgetTokens` |
| OpenRouter | `openai/gpt-4o-mini` | `openai/gpt-4o-mini`, `anthropic/claude-sonnet-4`, `anthropic/claude-3.7-sonnet`, `meta-llama/llama-3.3-70b-instruct` | `temperature`, `maxTokens` |

If a caller passes a model outside the source allowlist, the adapter falls back to that provider's default model (`src/lib/formedible/ai-adapters.ts:129`). Anthropic is the only provider with thinking budget support (`src/lib/formedible/ai-adapters.ts:65`).

## Features

### Streaming generation

Generation uses `chat` from `@tanstack/ai`. Stream chunks are normalized into text, thinking, tool, error, finish, or raw events before the UI consumes them (`src/lib/formedible/ai-generation.ts:209`). The collected result keeps final text, chunk history, usage metadata, finish reason, provider, model, errors, and the extracted Formedible block (`src/lib/formedible/ai-generation.ts:344`).

### Live preview

The right side of `AIBuilder` renders the latest generated form code through `AiFormRenderer` (`src/components/formedible/ai/ai-builder.tsx:247`). The renderer parses AI output and passes the parsed options into `useFormedible`, so the preview behaves like a real Formedible form (`src/components/formedible/ai/ai-form-renderer.tsx:23`).

### Parser integration

The parser accepts model output, extracts a Formedible code block, validates it through `FormedibleParser`, and can infer default values for fields that do not have defaults (`src/lib/formedible/ai-parser.ts:59`). Parser settings feed both the system prompt and the parser runtime. That keeps the prompt contract and the validation contract in sync.

### Conversation history

Conversations are stored in browser storage under versioned keys. The package keeps provider settings, conversations, UI state, and optional provider secrets separately (`src/lib/formedible/ai-storage.ts:20`). Users can create, select, delete, and export conversations from the builder shell (`src/components/formedible/ai/ai-builder.tsx:156`).

### Raw output panel

Assistant messages keep raw content, thinking output, stream events, and generation metadata. The raw output panel shows parse status and sanitized event data, which helps debug bad model output without exporting stored API keys.

## Architecture

```text
AIBuilder
├─ SidebarIcons / SidebarContent
│  ├─ ConversationHistory
│  ├─ ProviderSelection
│  ├─ AgentSettings
│  ├─ ParserSettings
│  └─ RawOutputPanel
├─ ChatInterface
│  └─ generateAiFormCode
│     └─ collectAiGenerationResult
│        └─ streamAiResponse
│           └─ TanStack AI provider adapter
└─ AiFormRenderer
   └─ parseAiToFormedible
      └─ FormedibleParser
```

The boundary is intentionally narrow:

- `AIBuilder` owns layout, selected conversation, provider access, parser config, and persistence hooks.
- `ChatInterface` owns prompt submission, streaming state, abort handling, and message updates.
- `ai-generation` owns the TanStack AI call and stream normalization.
- `ai-adapters` maps provider settings plus secrets into a TanStack text adapter.
- `ai-parser` owns extraction and validation of Formedible output.
- `AiFormRenderer` owns the live preview and delegates form behavior to `useFormedible`.

This split keeps provider code out of the renderer and keeps parser rules out of the chat UI.

## Security

This package uses bring-your-own-key provider access. The API key is typed into the browser UI, not bundled into the package.

Key handling rules in the source:

- Memory-only storage is the default for provider secrets (`src/components/formedible/ai/provider-selection.tsx:26`).
- Session and local storage are explicit choices. Local storage shows a warning because it survives tab close (`src/components/formedible/ai/provider-selection.tsx:151`).
- Stored provider secrets can be wiped from the UI (`src/components/formedible/ai/provider-selection.tsx:168`).
- Conversations export without stored provider secrets.
- Provider settings and secrets must name the same provider before generation starts (`src/lib/formedible/ai-generation.ts:265`).
- Custom provider endpoints are rejected, so the builder only talks to the supported provider adapters.

Do not pass server-side secrets into `providerSecrets` for this client component. If a host app needs server-held keys, add a server-side proxy outside this package and keep that key off the client.
