# Cluster 8 Review — AI libs (generation/streaming/adapters + storage/persistence/errors)

Reviewer scope: `packages/ai-builder/src/lib/formedible/ai-{generation,stream-scheduler,messages,adapters,types,model-catalog,storage,safe-persistence,parser,errors}.ts`
Branch: `re-codex`. All claims verified against the actual installed deps (`@tanstack/ai@0.16.0`, `@tanstack/ai-anthropic@0.8.6` → `@anthropic-ai/sdk@0.71.2`, `@ag-ui/core@0.0.49`) and, where network behavior matters, verified empirically via live CORS preflight tests.

Findings: 2 HIGH, 3 MEDIUM.

---

### [SEVERITY: HIGH] Finding 1: Anthropic adapter is constructed without `dangerouslyAllowBrowser` — the SDK throws in every browser, making the Anthropic provider completely unusable in the product's client-only mode

**File**: packages/ai-builder/src/lib/formedible/ai-adapters.ts:75-77

**Problem**: `createTanStackTextAdapter` calls `createAnthropicChat(settings.model, secrets.apiKey)` with no config. The underlying chain is `createAnthropicChat(model, apiKey, config)` → `new AnthropicTextAdapter({ apiKey, ...config }, model)` → `createAnthropicClient` → `new Anthropic_SDK({ apiKey })`. The Anthropic SDK constructor throws synchronously in any browser environment unless `dangerouslyAllowBrowser: true` is passed (`@anthropic-ai/sdk` `client.mjs`):

```js
if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
    throw new Errors.AnthropicError("It looks like you're running in a browser-like environment. ...");
}
```

`isRunningInBrowser()` checks `typeof window !== 'undefined' && window.document && navigator` — true in every real browser. This codebase is a client-only product (`AIBuilderMode = 'client'` is the only implemented mode; `chat-interface.tsx` is `'use client'` and calls `streamAiResponse` directly from the browser), so the adapter is always constructed in a browser for end users.

**Evidence** (ai-adapters.ts):
```ts
if (settings.provider === 'anthropic') {
  return createAnthropicChat(settings.model as unknown as AnthropicAdapterModel, secrets.apiKey);
}
```
`AnthropicTextConfig extends AnthropicClientConfig` (per `@tanstack/ai-anthropic/dist/esm/adapters/text.d.ts:10`), so the third parameter accepts `{ dangerouslyAllowBrowser: true }` — it is simply never passed. The throw happens inside `createTanStackStream`, which is inside `streamAiResponse`'s try block, so it is swallowed by `normalizeAiError` (the SDK message matches none of the auth/rate-limit/network regexes) and surfaces as the misleading generic "The AI provider could not complete the request. Review debug output for provider details." with `recoverable: true`. The existing test (`ai-builder.test.ts:321`) passes only because Node tests make `isRunningInBrowser()` false.

**Impact**: Every Anthropic generation (the default catalog includes Anthropic as a first-class provider with model defaults, thinking-budget UI support, and catalog fetching) fails 100% of the time in production with an unrelated-looking error message. Additionally, even if the constructor didn't throw, browser CORS requires the `anthropic-dangerous-direct-browser-access: true` header, which the SDK only sends when this same flag is set — so the single missing option breaks Anthropic twice.

**Suggestion**: Pass the browser flag explicitly:
```ts
if (settings.provider === 'anthropic') {
  return createAnthropicChat(settings.model as unknown as AnthropicAdapterModel, secrets.apiKey, {
    dangerouslyAllowBrowser: true,
  });
}
```
(The product is BYOK client-side by design — provider-selection.ts manages user-supplied keys and the persistence preference UI — so enabling browser access is the intended deployment.) Add a browser-environment test (e.g. jsdom-based) so the Node-only test suite can't hide this class of failure again.

---

### [SEVERITY: HIGH] Finding 2: Secret-redaction applied to the app's own persistence round-trip silently corrupts persisted `formConfig` (persistence.key always becomes `'[REDACTED]'`, `defaultValues`/schema keys like `password`/`token` are overwritten)

**File**: packages/ai-builder/src/lib/formedible/ai-storage.ts:1283-1298 (also 1200-1211, 616, 1345-1362; helper in ai-safe-persistence.ts:269-287)

**Problem**: `persistConversations` runs every conversation through `sanitizeConversationForPersistence` → `parseConversation` → `parseMessage` → `parseParsedFormConfig`, and `readPersistedAIBuilderState` runs the same parse on load. Three over-broad redactions corrupt the data on this round trip:

1. `parsePersistence` unconditionally replaces the form's persistence key with a literal placeholder — not pattern-based, always:
```ts
const persistence = {
  key: '[REDACTED]',            // <- the real storage key is discarded
  ...(value.storage === 'localStorage' || ...),
```
2. `parseFormOptions` routes `defaultValues` through `parseSafeJsonRecordAllowEmpty`, which redacts by key name:
```ts
if (isSecretKey(key)) {
  entries.push([key, '[REDACTED]']);
```
`isSecretKey` (ai-safe-persistence.ts:269-280) uses substring matching and includes `password`, `token`, `secret`, `credential`. A form with a `password` field (extremely common in a form builder) gets `defaultValues.password` replaced by the string `'[REDACTED]'` — and `ai-parser.ts`'s `inferDefaultValues` guarantees every field has a default, so this hits every persisted conversation containing such a field. JSON-schema keys like `properties.token` are hit the same way via `parseStrictSafeJsonValue`.
3. `parseStrictSafeJsonValue(value.schema)` also runs every schema *string* through `redactSecretString`, whose key/value regex mangles zod code: `z.object({ token: z.string() })` → `z.object({ token=[REDACTED]) })` (the char class `[^\s,;"'`)}\]]+` happily consumes `z.string(` up to the `)`).

Note that `sanitizeConversationForPersistence` and `sanitizeConversationForExport` (ai-storage.ts:1345-1351) have byte-identical bodies — the separation exists but the different behavior was never implemented. The existing tests pin the intentional string redaction of message `content`/`rawContent`/`thinking` (ai-builder.test.ts:527-528) and pin schema round-tripping only for an `email` field (ai-storage.test.ts:395-424) — nothing pins the formConfig corruption, which is collateral damage.

**Impact**: After save + reload (or via `exportConversation`), `message.formConfig` and `generatedForms[].formConfig` no longer match what the model produced: draft-persistence keys are lost (and all such restored forms would share the single storage key `'[REDACTED]'`, which `use-form-persistence` uses directly as the localStorage key — cross-form draft bleed), and password/token-named defaults become the literal string `'[REDACTED]'` (which would prefill password inputs with that string in any consumer that renders `formConfig`). The persisted/exported data model — this module's core responsibility — is silently corrupted for common form shapes.

**Suggestion**: Distinguish the two sanitize paths: redact secrets only in `sanitizeConversationForExport`; for `sanitizeConversationForPersistence`, preserve `persistence.key` and `defaultValues` verbatim (they are the user's own data, already client-side). At minimum, remove the unconditional `key: '[REDACTED]'` rewrite in `parsePersistence` and exclude `defaultValues`/schema from key-name redaction. Add round-trip tests with `password`/`token` fields and a persistence config.

---

### [SEVERITY: MEDIUM] Finding 3: `temperature` is sent unconditionally alongside Anthropic extended thinking, which Anthropic rejects with 400 ("temperature may only be set to 1 when thinking is enabled"); `budget_tokens` minimum is also unvalidated

**File**: packages/ai-builder/src/lib/formedible/ai-generation.ts:285 (guard belongs in packages/ai-builder/src/lib/formedible/ai-adapters.ts:82-95)

**Problem**: `createTanStackStream` always passes `temperature: providerSettings.temperature`, and `createTanStackModelOptions` enables `thinking` whenever `thinkingBudgetTokens > 0`. Anthropic's contract (platform.claude.com API primer): "Temperature must be set to 1 (or left unset) whenever thinking is enabled, on all models." The app's default settings include `temperature: 0.7` (provider-selection.tsx:37), so enabling the thinking budget — a first-class Anthropic setting in the UI (`AI_PROVIDER_FEATURE_SUPPORT.anthropic.thinkingBudgetTokens: true`, agent-settings.tsx input) — makes every request fail. I verified the `@tanstack/ai-anthropic` adapter does not save you: `mapCommonOptionsToAnthropic` forwards `temperature: options.temperature` unchanged (it special-cases `max_tokens` vs the thinking budget but not temperature). Separately, `budget_tokens` must be ≥ 1024 per the same API, while `createTanStackModelOptions` accepts any positive value and the UI input only has an HTML `min="1"`.

**Evidence**:
```ts
// ai-generation.ts:281-290
return chat({
  adapter,
  ...
  temperature: providerSettings.temperature,
  ...
  modelOptions: createTanStackModelOptions(providerSettings),
```
```ts
// ai-adapters.ts:85-94
if (settings.provider !== 'anthropic' || !settings.thinkingBudgetTokens || settings.thinkingBudgetTokens <= 0) {
  return undefined;
}
return {
  thinking: { type: 'enabled', budget_tokens: settings.thinkingBudgetTokens },
```

**Impact**: With default settings (temp 0.7) plus any thinking budget, 100% of Anthropic requests fail with a 400 that surfaces as a generic provider error, and no client-side validation explains why. Users who discover the feature will conclude it is broken (it is).

**Suggestion**: In `createTanStackStream`/`createTanStackModelOptions`, drop (or force to 1) `temperature` when thinking is enabled for Anthropic, and validate `thinkingBudgetTokens >= 1024` (reject or clamp with a clear configuration error via `createAiConfigurationError`) — ideally also at the agent-settings input layer.

Sources: [Anthropic API primer](https://platform.claude.com/docs/en/claude_api_primer), [Extended thinking docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking), [AWS Bedrock extended-thinking constraints](https://docs.aws.amazon.com/bedrock/latest/userguide/claude-messages-extended-thinking.html)

---

### [SEVERITY: MEDIUM] Finding 4: Anthropic model-catalog fetch omits the `anthropic-dangerous-direct-browser-access` header, so the preflight is CORS-rejected in every browser — "Refresh models" for Anthropic can never succeed

**File**: packages/ai-builder/src/lib/formedible/ai-model-catalog.ts:165-170

**Problem**: `fetchAnthropicModels` performs a raw browser `fetch` (the module is `'use client'`, called from `AIBuilder.refreshProviderModels`) with only:
```ts
headers: {
  'anthropic-version': '2023-06-01',
  'X-Api-Key': apiKey,
},
```
`X-Api-Key` and `anthropic-version` are non-simple headers, so the browser sends a CORS preflight. Anthropic's API only allows browser origins when the request includes `anthropic-dangerous-direct-browser-access: true` (the same mechanism as Finding 1). I verified this live:

- Preflight for `x-api-key,anthropic-version` → `HTTP 400`, body `Disallowed CORS origin`, **no** `access-control-allow-origin` → browser blocks the request.
- Preflight including `anthropic-dangerous-direct-browser-access` → `HTTP 200` with `access-control-allow-origin: *`, and the actual GET then succeeds (401 with a proper JSON body for a bad key).

OpenAI (`api.openai.com`) and OpenRouter (`openrouter.ai`) both return `access-control-allow-origin: *` unconditionally (also verified), so only the Anthropic branch is broken.

**Impact**: The Anthropic model list can never be refreshed from the app; every attempt fails and is masked into `createErrorCatalog`'s generic message ("Unable to refresh models." / a TypeError message), making it look like a key/network problem. Users see an empty Anthropic model catalog with a confusing error.

**Suggestion**: Add `'anthropic-dangerous-direct-browser-access': 'true'` to the request headers in `fetchAnthropicModels` (harmless in non-browser contexts).

---

### [SEVERITY: MEDIUM] Finding 5: Every per-token stream event (including duplicated raw provider payloads) is persisted for every message, and quota failures are swallowed silently — a modest conversation history exhausts the ~5MB localStorage quota and persistence then fails with no signal

**File**: packages/ai-builder/src/lib/formedible/ai-storage.ts:136-146, 161-163, 533/545 (producer: chat-interface.tsx:174 `events: streamedEvents`)

**Problem**: `chat-interface` stores every normalized stream event on the final assistant message; `parseMessage` keeps them (`const events = parseSafeStreamEvents(value.events)`), and each `text-delta` event carries both `delta` and the full `raw` AG-UI chunk (which itself contains the delta again plus `messageId`/`timestamp`/`model`), so each token of output is serialized ~2-4x plus object overhead. A single 4KB form generation is roughly 40-60KB of stored JSON once events are included; all conversations share one localStorage key (`formedible-ai-builder-conversations`). When the quota is hit, `writeJson` discards the error:

```ts
try {
  getStorage(area).setItem(key, JSON.stringify(value));
} catch {
  return;            // QuotaExceededError swallowed, no signal to anyone
}
```

**Impact**: Once history grows past quota, `persistConversations` silently stops working — the user gets no error, but everything since the last successful write (messages, generated forms, conversation titles) is lost on reload. Because the events are the dominant size contributor, this arrives far sooner than the actual content would warrant, and the failure mode is total (the whole conversations blob fails to write, not just the newest message).

**Suggestion**: (a) Persist a bounded representation of stream events — e.g. strip `raw` from persisted `text-delta`/`thinking-delta` events (the deltas already reconstruct the text), or drop per-token events entirely and keep only tool/error/finish events for the debug panel; and/or (b) surface quota failures from `writeJson` (return a boolean / console.error) so callers can degrade visibly (e.g. prune oldest conversations) instead of silently losing all subsequent writes.

---

## Areas checked and found clean

- **Key handling/transmission**: keys are only ever paired with their own provider's endpoints (adapters use provider SDKs with default hosts; `assertNoUnsupportedRuntimeOptions` + `parseProviderSettings` both block `endpoint`/`baseURL` overrides, preventing key exfiltration via crafted settings); keys never enter prompts, messages, or console output; `messages`/`systemPrompts` assembly is key-free.
- **Async/streaming core** (`ai-generation.ts`, `ai-stream-scheduler.ts`): `streamAiResponse` correctly converts thrown stream/abort errors into terminal events (no unhandled rejections); consumer-driven early termination propagates `.return()` into the inner `chat()` iterator; scheduler batching has no lost/duplicated events (frame id is cleared before flush, re-entrant enqueue reschedules), and `flushNow` cancels pending timers on all exit paths.
- **AG-UI contract**: normalization matches the actual emitted shapes (`TEXT_MESSAGE_CONTENT.delta`, `REASONING_MESSAGE_CONTENT.delta`, `RUN_FINISHED.finishReason` + `usage.{promptTokens,completionTokens}` — verified against installed `@ag-ui/core@0.0.49` and the adapter sources).
- **Empty assistant placeholders** (created by the product on failed/aborted submits) are filtered by the `@tanstack/ai-anthropic` adapter itself (`mergeConsecutiveSameRoleMessages`), so they don't brick follow-up requests — no finding.
- **SSR safety**: all `window`/storage access is guarded by `canUseStorage`/`typeof window` checks; scheduler uses `globalThis`.
- **Parser robustness**: `extractFormCode` is only invoked on completed text (streaming renders via markdown, `AiFormRenderer` parses only when not streaming), so partial-JSON/fence issues don't arise; wrong-fence (`json`/`ts`) responses produce an actionable parse error.
- Anthropic pagination loop (max 20 pages, `last_id` staleness guard), catalog dedupe/sort, and error taxonomy classification are correct.
