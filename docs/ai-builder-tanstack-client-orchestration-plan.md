# AI Builder TanStack Client Rewrite Orchestration Plan

## Purpose

Rebuild `packages/ai-builder/src/components/formedible/ai` to be on par with the legacy implementation in `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai`, while correcting the rewrite mistakes.

This plan is designed for execution with the `subagent-orchestration` workflow: each phase has an implementer, a validator, and a fixer loop if validation fails.

## Hard Requirements

- Client-side only. Do not add server routes, backend endpoints, server functions, or `backend` mode behavior.
- Use TanStack AI, not Vercel AI SDK. No `ai`, `@ai-sdk/*`, or `@openrouter/ai-sdk-provider` dependencies.
- Required providers for the first complete rewrite are OpenAI, Anthropic, and OpenRouter using TanStack AI adapters.
- Provider settings may expose compatible base URLs where the selected TanStack adapter supports them; this is still client-side and must not become backend/custom endpoint mode.
- Preserve multi-message conversations with local conversation history.
- Stream assistant responses into the active conversation incrementally.
- Render streaming output through a frame-budgeted scheduler targeting 60fps with `requestAnimationFrame` or an equivalent browser scheduling primitive.
- Support aborting an in-flight generation.
- Show the complete raw AI output, not just parsed form code.
- Show reasoning/thinking chunks when the selected model/provider emits them.
- Render assistant content as Markdown.
- Render fenced code blocks with syntax highlighting using a maintained client-compatible library selected during implementation.
- Do not render raw HTML from assistant Markdown. Escape or ignore it; raw text remains available in the raw output view.
- Keep generated form preview and raw output visible side by side or through explicit tabs.
- Keep provider configuration, model settings, parser settings, conversation selection, deletion, export, and new conversation behavior.
- Use `packages/formedible-parser` as the parser shadcn component source of truth. Do not recreate parser logic in `packages/ai-builder`.
- Parser files are installed/synced shadcn registry files, not a runtime package dependency for AI Builder.
- AI Builder may import the synced parser files from its own `src/lib/formedible/*`, but those files must originate in `packages/formedible-parser` and be synced from there.
- Treat BYOK API keys as sensitive client-side data: default to session-only storage or memory, never export keys, and provide clear wipe controls.
- Local persistence of API keys is allowed only through an explicit opt-in warning/setting.
- Preserve existing parser compatibility where practical: `parseAiToFormedible`, `extractFormCode`, allowlist config keys, default value inference, and non-throwing parse failures.
- No `any`, `as any`, or `: any` anywhere.
- No placeholder code, `TODO`, or `FIXME`.
- No `alert` or `confirm`.
- No dynamic `await import()`.

## Legacy Reference Summary

Legacy files to read before implementation:

- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/chat-messages.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/conversation-history.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/sidebar-icons.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/sidebar-content.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/provider-selection.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/agent-settings.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/parser-settings.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/components/formedible/ai/form-preview.tsx`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/lib/formedible/parser-config-schema.ts`
- `old_version_for_knowledge_purpose/packages/ai-builder/src/lib/form-extraction-utils.ts`

Legacy behavior to recreate:

- Full AI builder shell with sidebar, chat, preview, provider settings, model settings, parser settings, and history.
- Conversation persistence in browser storage.
- Conversation selection, deletion, export, and creation.
- Streaming chat UX with stop button.
- Generated form extraction from assistant output.
- Multiple generated forms per conversation or an equivalent history of generated outputs.
- Parser settings with system prompt preview and copy action.
- Model settings with provider-specific defaults and OpenRouter model discovery where supported.

Legacy behavior not to copy:

- Vercel AI SDK usage.
- Backend mode.
- `any` and unsafe casts.
- Storing API keys in localStorage by default.
- Console logging as a UX substitute.
- Duplicate parser implementations.
- Hard-coded stale provider behavior when TanStack AI can own the provider integration.

## Current Rewrite Gap Summary

Current files reviewed:

- `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`
- `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`
- `packages/ai-builder/src/components/formedible/ai/provider-selection.tsx`
- `packages/ai-builder/src/components/formedible/ai/ai-form-renderer.tsx`
- `packages/ai-builder/src/lib/formedible/ai-parser.ts`
- `packages/ai-builder/src/lib/formedible/ai-types.ts`
- `packages/ai-builder/package.json`

Current problems:

- Generation is hand-written `fetch` logic in `chat-interface.tsx`, not TanStack AI.
- It is request/response oriented, not true streaming.
- It still has `backend` mode despite the client-only requirement.
- The UI lost most legacy surface area: no full sidebar, no parser settings UI, weak history UX, no raw output panel, no thinking panel, no export controls, no model discovery UI.
- It duplicates parser-facing logic in `packages/ai-builder/src/lib/formedible/ai-parser.ts` instead of using the synced shadcn parser component files from `packages/formedible-parser` as the canonical source.
- Raw provider wire format is tested directly, which will block an adapter-based rewrite.
- API keys are persisted in localStorage by default.
- AI generation result only stores `content` and `formCode`; it does not model stream events, thinking, usage, finish reason, provider metadata, or raw chunks.

## Target Architecture

Create a client-only AI builder with these layers:

- UI shell: `AIBuilder` owns layout and high-level state.
- Chat UI: `ChatInterface` renders messages, input, streaming state, abort button, and raw output toggles.
- Preview UI: form preview renders parsed/generated Formedible configs and exposes raw code/output.
- Sidebar UI: history, provider credentials, model settings, parser settings, and raw/debug controls.
- Generation layer: TanStack AI adapter selection, message normalization, streaming event loop, abort handling.
- Parser layer: `packages/formedible-parser` is canonical as a shadcn component registry source. AI Builder consumes the synced installed files for parsing, parser config, prompt generation, supported field metadata, and parser types.
- Storage layer: validated browser persistence with secret redaction and optional key persistence.

Parser component responsibilities:

- `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` remains the canonical parser implementation.
- `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts` remains the canonical parser settings and system prompt generator.
- `packages/formedible-parser/src/lib/formedible/parser-types.ts` remains the canonical parser type contract.
- Any AI-safe schema, structured object parsing, improved extraction, allowlist behavior, partial parse support, supported field metadata, or parser tests must be implemented in `packages/formedible-parser` first.
- `packages/formedible-parser/registry.json` must include every parser file needed by consumers.
- `packages/formedible-parser/sync.config.json` already syncs to `apps/web/src`, `packages/builder/src`, and `packages/ai-builder/src`; execution must use this route.
- `packages/ai-builder` should import from its installed/synced `@/lib/formedible/*` parser files, but edits to those parser files must be made in `packages/formedible-parser` first and then synced.
- Do not add `@formedible/formedible-parser` as a dependency of `@formedible/ai-builder` unless the packaging architecture is explicitly changed later.

Sync system facts that must drive implementation:

- `scripts/quick-sync.js` copies only files listed in the owner package `registry.json`; it does not automatically discover new source files.
- `packages/formedible-parser/registry.json` currently lists only `formedible-parser.ts`, `parser-types.ts`, and `parser-config-schema.ts`.
- `packages/ai-builder/registry.json` currently lists only the minimal AI builder files; any restored AI UI files must be added there or they will not install/sync to `apps/web`.
- If any new sync route, dependency ordering rule, stale-file cleanup, or registry validation is needed, update `scripts/quick-sync.js` and `tests/sync/*` as part of the plan, not as an afterthought.

Streaming render requirements:

- TanStack stream chunks may arrive faster than React should render.
- The generation layer may collect chunks immediately, but React message state must be flushed through a scheduler that coalesces updates per animation frame.
- The UI target is smooth 60fps streaming display, not one React state update per token or provider chunk.
- The scheduler must flush final content when the stream ends, errors, or aborts.
- Markdown rendering and syntax highlighting must not re-highlight the entire conversation on every chunk if avoidable; scope updates to the active streaming message.
- Validators must reject implementations that append chunks through unbounded `setState` calls inside every stream iteration.

Markdown/code rendering requirements:

- Assistant messages must support Markdown: paragraphs, headings, lists, links, blockquotes, inline code, fenced code blocks, and tables if the chosen renderer supports them safely.
- Fenced code blocks must have syntax highlighting and copy buttons.
- `formedible`, `json`, `ts`, `tsx`, `typescript`, `javascript`, and plain text code blocks must render legibly.
- Raw output view must remain available even when Markdown rendering fails.
- The chosen Markdown and syntax highlighting libraries must be client-compatible, tree-shakeable enough for this package, and added to `packages/ai-builder/registry.json` dependencies if needed for shadcn installation.
- No unsafe HTML rendering unless explicitly sanitized by the selected Markdown stack.

New files expected:

- `packages/ai-builder/src/lib/formedible/ai-adapters.ts`
- `packages/ai-builder/src/lib/formedible/ai-generation.ts`
- `packages/ai-builder/src/lib/formedible/ai-messages.ts`
- `packages/ai-builder/src/lib/formedible/ai-storage.ts`
- `packages/ai-builder/src/lib/formedible/ai-errors.ts`
- `packages/ai-builder/src/components/formedible/ai/chat-messages.tsx`
- `packages/ai-builder/src/components/formedible/ai/conversation-history.tsx`
- `packages/ai-builder/src/components/formedible/ai/sidebar-icons.tsx`
- `packages/ai-builder/src/components/formedible/ai/sidebar-content.tsx`
- `packages/ai-builder/src/components/formedible/ai/agent-settings.tsx`
- `packages/ai-builder/src/components/formedible/ai/parser-settings.tsx`
- `packages/ai-builder/src/components/formedible/ai/raw-output-panel.tsx`

Existing files expected to modify:

- `packages/ai-builder/package.json`
- `packages/ai-builder/src/lib/formedible/ai-types.ts`
- `packages/ai-builder/src/lib/formedible/ai-parser.ts`
- `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`
- `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`
- `packages/ai-builder/src/components/formedible/ai/provider-selection.tsx`
- `packages/ai-builder/src/components/formedible/ai/ai-form-renderer.tsx`
- `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts`
- `packages/ai-builder/src/index.ts`
- `packages/formedible-parser/package.json` only if parser component source needs a new dependency for its registry output.
- `packages/formedible-parser/src/index.ts` for new canonical parser exports.
- `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`
- `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts`
- `packages/formedible-parser/src/lib/formedible/parser-types.ts`
- `packages/formedible-parser/src/lib/formedible/formedible-parser.test.ts`
- `packages/formedible-parser/registry.json`
- `packages/ai-builder/registry.json`
- `scripts/quick-sync.js` if new sync behavior is required.
- `tests/sync/*` if `quick-sync.js` behavior changes.

## Data Model Requirements

Update `ai-types.ts` around explicit client-only concepts:

- `AIBuilderMode` should be removed or reduced to `'client'` only. Compatibility exports may remain only if they do not enable backend behavior.
- `ProviderSettings` should contain non-secret fields: provider, model, endpoint, temperature, max tokens, thinking budget, and optional provider-specific flags.
- `ProviderSecrets` should contain API key or token values separately.
- `ProviderConfig` may remain as a compatibility alias only if it does not force secret persistence.
- `AiMessage` should support `role`, `content`, `rawContent`, `thinking`, `parts`, `events`, `formCode`, `formConfig`, timestamps, provider/model metadata, and generation status.
- `AiStreamEvent` should model text chunks, thinking chunks, tool chunks if TanStack emits them, errors, finish metadata, and raw unknown events in a typed `unknown` envelope.
- `AiConversation` should contain messages, generated form snapshots, active generated form id, created/updated timestamps, and export-safe metadata.
- `AiGenerationResult` should include final text, raw output, thinking output, form code, parsed form config, usage metadata when available, provider, model, finish reason, and errors.

## Raw Output And Thinking Requirements

The UI must make raw AI output first-class:

- Every assistant message should have a normal rendered view and a raw view.
- Thinking/reasoning content should be shown in a dedicated collapsible section when emitted by TanStack AI stream chunks.
- The raw output panel should show accumulated raw text, extracted `formedible` code, parsed form result, parse errors, stream events, provider, model, and finish metadata.
- Conversation export should include raw output and thinking by default, but must exclude API keys and other secrets.
- If a provider does not emit thinking chunks, the UI should state that no thinking was emitted instead of inventing reasoning.

## Legacy Output Contract

The legacy AI Builder did not require every assistant response to be a form. Normal prose conversation was allowed: the assistant could answer questions, discuss form design, ask clarifying questions, and suggest improvements.

Generated forms were only expected when the user specifically asked to create, build, generate, or show a form. When a form was generated, the machine-readable payload had to be inside a lowercase `formedible` fenced code block:

````markdown
```formedible
{
  fields: [
    { name: "email", type: "email", label: "Email" }
  ],
  formOptions: {
    defaultValues: {
      email: ""
    }
  }
}
```
````

The generated form body was a Formedible configuration object, not executable application code. The legacy parser tolerated JSON and JavaScript object literal syntax, including unquoted object keys and Zod expressions, but the extraction step only recognized the `formedible` fence. Do not use `json`, `ts`, `typescript`, or an unfenced block for generated forms.

During streaming, the UI accumulated the full assistant message first. Form extraction happened only after the stream finished, by searching the completed assistant response for the first `formedible` code block.

The rewrite must preserve that preview timing: chat text, raw output, and thinking/reasoning stream live, but generated form extraction and parser preview run only after the assistant stream completes. Do not partially parse or partially preview generated forms while the stream is still active.

Conversation history could contain multiple generated forms. Each assistant message could contribute one extracted form block; historical extraction scanned assistant messages and created form records keyed by conversation id and message index. The preview UI treated generated forms as an ordered array with a current index and next/previous navigation.

Parser settings were merged from saved configuration and appended to the base system prompt. Those settings changed the prompt guidance for strict validation, field type validation, schema inference, merge strategy, max code length, max nesting depth, Zod parsing, detailed errors, custom instructions, selected field examples, and tab/page formatting examples.

## Dependency Requirements

Update `packages/ai-builder/package.json` after checking real package names and current TanStack AI APIs:

- Add `@tanstack/ai`.
- Add `@tanstack/ai-react` only if the final implementation uses React hooks from the package.
- Add provider adapters only for providers implemented in UI.
- Add `zod: catalog:` if structured output schemas are introduced and no local dependency already exists.
- Add a Markdown renderer and syntax highlighting dependency if not already present. Candidate choices must be evaluated during implementation for client compatibility and registry install behavior.
- If using `react-markdown`, consider `remark-gfm` for tables/lists and `rehype-sanitize` if raw HTML is enabled. Raw HTML should be disabled by default.
- Raw HTML from assistant Markdown must remain disabled for this rewrite.
- If using Shiki, lowlight, or highlight.js, ensure browser bundle size and async loading behavior are acceptable; no dynamic `await import()`.
- Do not add `ai` or `@ai-sdk/*`.
- Do not add server-only dependencies.

The implementer must verify the installed TanStack AI API against package types before writing final code. TanStack AI is alpha; do not blindly trust stale examples.

## Phase 0: Registry, Sync, API Spike, And Dependency Decision

Type: sequential.

Implementer inputs:

- `packages/ai-builder/package.json`
- `pnpm-workspace.yaml`
- `scripts/quick-sync.js`
- `packages/formedible-parser/registry.json`
- `packages/formedible-parser/sync.config.json`
- `packages/ai-builder/registry.json`
- `packages/ai-builder/sync.config.json`
- `tests/sync/*`
- Current TanStack AI package typings after dependency install.
- TanStack AI skill guidance.

Implementer tasks:

- Add the minimal TanStack AI dependencies required for a browser-only proof of generation.
- Audit the full sync chain: `packages/formedible-parser` registry -> `quick-sync.js` -> `packages/ai-builder/src` -> AI Builder registry -> `apps/web/src`.
- Update `packages/formedible-parser/registry.json` for every new canonical parser file.
- Update `packages/ai-builder/registry.json` for every restored AI Builder file: chat messages, raw output panel, sidebar, history, model settings, parser settings, generation libs, storage libs, adapter libs, message libs, error libs, and public index files.
- Update `scripts/quick-sync.js` if registry-only copy behavior cannot safely handle the new component graph, sync ordering, stale file cleanup, or validation needs.
- If `quick-sync.js` changes, update `tests/sync/*`.
- Verify sync order is explicit: Formedible source, then parser component, then builder, then AI Builder, then web app.
- Verify adapter import paths and streaming API with TypeScript.
- Verify TanStack AI adapter imports for OpenAI, Anthropic, and OpenRouter.
- Implement only OpenAI, Anthropic, and OpenRouter provider families in this rewrite.
- Remove Google, Mistral, generic backend, and generic custom endpoint mode from the rewrite scope unless they are explicitly reintroduced in a later plan.
- Support compatible base URL settings only through the selected provider adapter when the adapter supports it.
- Record unsupported provider decisions in comments only where needed or in tests, not as TODOs.
- Remove any Vercel AI SDK assumptions from tests or package metadata.

Outputs:

- Updated `packages/ai-builder/package.json`.
- Updated parser and AI Builder registries for planned files.
- Updated `scripts/quick-sync.js` and sync tests if required.
- Any minimal type-only spike files must be production code or omitted before phase completion.

Validation:

- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`
- `pnpm --filter @formedible/formedible-parser sync`
- `pnpm --filter @formedible/ai-builder sync`
- `pnpm run test:sync`
- Validator must confirm no `ai` or `@ai-sdk/*` dependency exists.
- Validator must confirm no backend/server mode was added.
- Validator must confirm all source files added in later phases have an explicit registry/sync path.

## Phase 1: Types, Messages, Storage, And Secret Handling

Type: multi-sub-phase.

Sub-phase 1A: AI types and message normalization.

Files:

- Modify `packages/ai-builder/src/lib/formedible/ai-types.ts`.
- Create `packages/ai-builder/src/lib/formedible/ai-messages.ts`.

Requirements:

- Model client-only provider settings separately from provider secrets.
- Add stream event, raw output, thinking output, generation metadata, and generated form snapshot types.
- Add conversion helpers between persisted app messages and TanStack AI message inputs.
- Preserve public compatibility types only where they do not reintroduce backend behavior.
- Provider types must cover OpenAI, Anthropic, and OpenRouter only for this rewrite, with adapter-supported compatible base URL options where applicable.

Sub-phase 1B: Storage.

Files:

- Create `packages/ai-builder/src/lib/formedible/ai-storage.ts`.
- Modify `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx` enough to consume storage helpers only after phase-wide validation.

Requirements:

- Move `STORAGE_KEYS`, `canUseStorage`, `readJson`, `writeJson`, and persisted-state helpers out of `ai-builder.tsx`.
- Add storage versioning and runtime validation with `unknown` parsing, not blind casts.
- Store conversations and UI state locally.
- Store API keys in memory/session by default; local persistence requires an explicit `rememberKey` setting.
- Exports must redact secrets.
- Add clear secrets and clear conversations helpers.
- Persist and export assistant message text, raw text, thinking chunks, stream metadata, extracted form code, parse result/errors, provider/model, timestamps, and status; never persist/export secrets unless the user explicitly opted into local key storage, and never include secrets in conversation export.

Validation:

- Per-sub-phase validators must read all changed files.
- Phase-wide validator must confirm type names and storage helpers integrate cleanly.
- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`

## Phase 2: TanStack AI Generation Layer

Type: sequential.

Files:

- Create `packages/ai-builder/src/lib/formedible/ai-adapters.ts`.
- Create `packages/ai-builder/src/lib/formedible/ai-generation.ts`.
- Create `packages/ai-builder/src/lib/formedible/ai-errors.ts`.
- Modify `packages/ai-builder/src/lib/formedible/ai-types.ts` as needed.

Requirements:

- Build TanStack AI adapters from provider settings and secrets.
- Build adapters only for OpenAI, Anthropic, and OpenRouter in this rewrite.
- Use adapter-supported base URL configuration for compatible endpoints; do not implement backend proxy mode or React-level provider fetch fallback.
- No provider API `fetch` logic inside React components.
- Implement `streamAiResponse` or equivalent async iterable wrapper that yields typed app events.
- Capture normal text chunks.
- Capture thinking/reasoning chunks when TanStack emits `thinking` events/chunks.
- Preserve unknown raw provider events as `unknown` metadata without unsafe casts.
- Support abort through `AbortController` or TanStack-supported cancellation.
- Normalize errors to user-safe messages while preserving debug detail in raw output metadata.
- Include temperature, max tokens, and thinking budget when supported.
- Implement feature gating for unsupported providers rather than pretending support exists.

Validation:

- Unit tests should mock the generation layer with async iterables.
- Tests must verify text chunks, thinking chunks, raw event retention, abort, and error normalization.
- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`

## Phase 3: Parser Component Source And Structured Form Output

Type: sequential.

Files:

- Modify `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`.
- Modify `packages/formedible-parser/src/lib/formedible/parser-types.ts`.
- Modify `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts`.
- Modify `packages/formedible-parser/src/lib/formedible/formedible-parser.test.ts`.
- Modify `packages/formedible-parser/src/index.ts` if new parser utilities or types need public registry exports.
- Modify `packages/formedible-parser/registry.json` if new parser files are added.
- Run parser sync so `packages/ai-builder/src/lib/formedible/*` receives the canonical parser files.
- Modify `packages/ai-builder/src/lib/formedible/ai-parser.ts` only as a thin compatibility wrapper around synced parser files, or delete its duplicated logic if no longer needed.
- Modify `packages/ai-builder/src/components/formedible/ai/ai-form-renderer.tsx`.

Requirements:

- Define AI-safe Formedible parsing in the parser component source, not in AI Builder.
- Reject executable callbacks, arbitrary components, and unsupported keys.
- Parse structured object output first.
- Fall back to legacy fenced/string extraction with `extractFormCode`.
- Preserve allowlist behavior currently tested.
- Keep default value inference.
- Return detailed parse errors to the raw output panel.
- Support partial parsing during streaming if TanStack partial JSON utilities are available and type-safe.
- AI Builder must not become the owner of parser config, prompt generation, supported field metadata, or parser tests.
- After parser changes, run `pnpm --filter @formedible/formedible-parser build` and `pnpm --filter @formedible/formedible-parser sync` before editing AI Builder integration.

Validation:

- Keep existing parser tests unless they conflict with explicit client-only decisions.
- Add structured object parse tests.
- Add tests for rejection of unsafe/executable-like config.
- Validator must confirm parser source changes are in `packages/formedible-parser`, not only in `packages/ai-builder`.
- Validator must confirm `packages/formedible-parser/registry.json` includes any new parser files.
- `pnpm --filter @formedible/formedible-parser check-types`
- `pnpm --filter @formedible/formedible-parser test`
- `pnpm --filter @formedible/formedible-parser build`
- `pnpm --filter @formedible/formedible-parser sync`
- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`

## Phase 4: Chat Streaming UI And Raw Output UI

Type: multi-sub-phase.

Sub-phase 4A: Chat state and streaming component.

Files:

- Modify `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`.
- Create `packages/ai-builder/src/components/formedible/ai/chat-messages.tsx`.
- Create `packages/ai-builder/src/components/formedible/ai/markdown-message.tsx` or equivalent.
- Create `packages/ai-builder/src/lib/formedible/ai-stream-scheduler.ts` or equivalent.

Requirements:

- Remove direct provider `fetch` from UI code.
- Use the TanStack generation layer from phase 2.
- Append user message immediately.
- Append assistant placeholder immediately.
- Stream text chunks into the assistant message.
- Stream thinking chunks into assistant message thinking state.
- Buffer incoming stream chunks and flush React updates through `requestAnimationFrame` or an equivalent scheduler, targeting smooth 60fps display.
- Do not call React state setters once per provider chunk/token in the hot stream loop.
- Flush pending chunks immediately when generation finishes, aborts, or errors.
- Do not extract or parse generated Formedible blocks until the assistant stream completes.
- Render assistant message content as Markdown.
- Render fenced code blocks with syntax highlighting.
- Include code block copy controls.
- Stop button aborts generation and marks message status as aborted.
- Existing multi-message conversation context is passed to generation.
- Enter submits, Shift+Enter inserts newline.
- Empty messages do not submit.

Sub-phase 4B: Raw output panel.

Files:

- Create `packages/ai-builder/src/components/formedible/ai/raw-output-panel.tsx`.
- Modify `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx` to render it.

Requirements:

- Show raw text output.
- Show thinking output.
- Show extracted form code.
- Show parsed form result or parse errors.
- Show extraction/parse status clearly: pending while streaming, parsed after completion, failed if parsing fails.
- Show stream events and metadata in a readable debug view.
- Provide copy buttons using clipboard APIs.
- Provide a clear state for providers that do not emit thinking.

Validation:

- Component tests or unit tests must verify streaming state transitions through mocked async iterables.
- Tests must verify the scheduler coalesces multiple chunks into frame-based updates.
- Tests must verify final flush on stream completion and abort.
- Tests must verify Markdown rendering and code block syntax highlighting are wired without raw unsafe HTML.
- Validator must manually inspect that thinking is not dropped.
- Validator must confirm raw output is accessible for every assistant message.
- Validator must reject unbounded per-chunk `setState` streaming updates.
- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`

## Phase 5: Restore Legacy-Level AI Builder Shell

Type: multi-sub-phase.

Sub-phase 5A: Sidebar and history.

Files:

- Modify `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`.
- Create `packages/ai-builder/src/components/formedible/ai/conversation-history.tsx`.
- Create `packages/ai-builder/src/components/formedible/ai/sidebar-icons.tsx`.
- Create `packages/ai-builder/src/components/formedible/ai/sidebar-content.tsx`.

Requirements:

- Restore history, provider, model settings, parser settings, and raw/debug sidebar sections.
- Implement new conversation, select conversation, delete conversation, and export conversation.
- Export must redact secrets and include messages, raw output, thinking, form snapshots, and parse errors.
- Avoid copying legacy `QueryClientProvider` unless model discovery actually needs TanStack Query and dependency is already available.

Sub-phase 5B: Provider and model settings.

Files:

- Modify `packages/ai-builder/src/components/formedible/ai/provider-selection.tsx`.
- Create `packages/ai-builder/src/components/formedible/ai/agent-settings.tsx`.

Requirements:

- Provider credentials UI must make client-side BYOK risks explicit.
- Support session-only or memory key storage by default.
- Support explicit local persistence only with a visible toggle.
- Support provider/model defaults for OpenAI, Anthropic, and OpenRouter based on their TanStack adapters.
- Support adapter-backed compatible base URL settings where applicable.
- Support temperature, max tokens, and thinking budget where applicable.
- Support OpenRouter model discovery only if implemented safely without unsafe casts.

Sub-phase 5C: Parser settings.

Files:

- Create or restore `packages/ai-builder/src/components/formedible/ai/parser-settings.tsx`.
- Modify `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts` for parser settings source changes, then sync into AI Builder.

Requirements:

- Restore parser config editing.
- Restore system prompt preview.
- Restore copy prompt action.
- Settings must use the synced parser component exports: `defaultParserConfig`, `generateSystemPrompt`, `mergeParserConfig`, `parserConfigFields`, and `validateParserConfig`.
- Settings must feed the generation system prompt and parser allowlists through those synced parser exports.
- Use existing Formedible components where appropriate.

Validation:

- Each sub-phase gets separate validation.
- Phase-wide validator must inspect the complete shell for integration coherence.
- Validator must confirm legacy-level features exist in the current UI.
- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`

## Phase 6: Tests, Public API, And Sync Readiness

Type: sequential.

Files:

- Modify `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts`.
- Modify `packages/ai-builder/src/index.ts`.
- Modify `packages/ai-builder/registry.json` for every public/installable AI Builder file.
- Modify `packages/formedible-parser/registry.json` for every public/installable parser file.
- Modify `scripts/quick-sync.js` if current behavior cannot enforce or validate the required sync graph.
- Modify `tests/sync/*` if `quick-sync.js` changes.

Requirements:
- Remove tests that assert raw provider HTTP wire formats.
- Remove or rewrite backend mode tests.
- Add tests for TanStack adapter selection/generation boundaries.
- Add tests for multi-message conversation streaming.
- Add tests for thinking chunk capture.
- Add tests for raw output persistence and export redaction.
- Add tests for secret storage behavior.
- Add tests for parser compatibility and structured parsing.
- Preserve public exports required by consumers.
- Add sync tests or registry assertions proving every new AI Builder and parser source file required by consumers is listed in the correct registry.
- Add sync tests if parser files must sync before AI Builder files for a clean `apps/web` install.

Validation:

- `pnpm --filter @formedible/ai-builder check-types`
- `pnpm --filter @formedible/ai-builder test`
- `pnpm --filter @formedible/formedible-parser sync`
- `pnpm --filter @formedible/ai-builder sync`
- `pnpm run test:sync`
- `pnpm run check-types`
- Validator must confirm no generated or synced package imports `@ai-sdk/*` or `ai`.
- Validator must confirm registry/sync coverage for every new parser and AI Builder file.

## Phase 7: Final Verification And Sync

Type: sequential.

Tasks:

- Run package build/check commands.
- Run `pnpm run check-types` from repo root.
- Run parser sync before AI Builder sync: `pnpm --filter @formedible/formedible-parser sync`.
- Run AI Builder sync after parser files are present in AI Builder: `pnpm --filter @formedible/ai-builder sync`.
- Re-run full type checks after sync.
- Inspect synced files in `packages/ai-builder/src` and `apps/web/src` for missing parser or AI Builder files.
- Ensure `scripts/quick-sync.js` and registries handle new files; do not manually copy around a broken registry.

Validation:

- `pnpm --filter @formedible/ai-builder build`
- `pnpm --filter @formedible/ai-builder test`
- `pnpm --filter @formedible/formedible-parser build`
- `pnpm --filter @formedible/formedible-parser test`
- `pnpm --filter @formedible/formedible-parser sync`
- `pnpm --filter @formedible/ai-builder sync`
- `pnpm run test:sync`
- `pnpm run check-types`
- No Vercel AI SDK packages in `packages/ai-builder/package.json`.
- No backend mode in public UI behavior.
- Provider UI and types are limited to OpenAI, Anthropic, and OpenRouter for this rewrite, with adapter-supported base URL options only.
- No `any`, `as any`, or `: any` in modified AI builder files.
- No `TODO` or `FIXME` in modified AI builder files.
- No direct provider `fetch` in React components.
- Raw output and thinking output are visible in UI and persisted/exported without secrets.
- Streaming display is frame-budgeted and does not perform unbounded per-token React updates.
- Assistant messages render Markdown and syntax-highlighted code blocks with copy controls.
- Raw HTML in assistant Markdown is not rendered.
- Generated form extraction and parser preview run only after stream completion.

## Orchestration Rules For Execution

Every implementer and fixer dispatch must include this NO-SLOP policy:

```text
NO-SLOP POLICY (MANDATORY):
- NO any, as any, or : any anywhere.
- NO placeholder code, TODO, or FIXME.
- NO unused imports or unused variables.
- NO alert or confirm.
- NO dynamic await import().
- Use import type for type-only imports.
- External imports first, blank line, then local imports.
- Do not start the dev server.
- Do not add backend/server behavior.
- Do not add Vercel AI SDK dependencies or imports.
```

Every validator dispatch must require actual code reading, not only commands:

```text
Validator requirements:
- Read every created or modified file in the phase.
- Verify every phase requirement manually.
- Enforce the NO-SLOP policy strictly.
- Run the required check-types/test commands.
- Report file paths and line numbers for every issue.
- Do not modify files.
```

Fix loop:

- If validation fails, dispatch one fixer with all validator findings at once.
- The fixer must run the phase gatekeeping commands before reporting done.
- Re-run the validator.
- Halt only after 3 failed validation attempts for the same phase.

## Acceptance Criteria

The rewrite is acceptable only when all of these are true:

- `packages/ai-builder` is client-only.
- TanStack AI is the generation abstraction.
- Vercel AI SDK is absent.
- Users can have multi-message conversations.
- Streaming visibly updates assistant messages.
- Streaming display targets smooth 60fps through requestAnimationFrame-style scheduling.
- Users can stop generation.
- Users can view raw output for every assistant message.
- Users can view thinking/reasoning output when provider/model emits it.
- Assistant messages support Markdown and syntax-highlighted fenced code blocks.
- Users can configure provider, model, temperature, max tokens, parser settings, and thinking budget where supported.
- Users can use OpenAI, Anthropic, and OpenRouter provider families through TanStack AI adapters.
- Users can create, select, delete, persist, and export conversations.
- Exports redact secrets.
- Generated forms are extracted from completed assistant messages using the legacy lowercase `formedible` fenced block contract.
- Parser compatibility is preserved or intentionally migrated with tests.
- Full package tests and root type checks pass.
