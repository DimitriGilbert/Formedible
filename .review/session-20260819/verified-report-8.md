# Verified Report — Cluster 8 (AI libs: generation/streaming/adapters + storage/persistence/errors)

Verification of `review-report-8.md` against actual source (repo branch `re-codex`), installed dependencies (`@anthropic-ai/sdk@0.71.2`, `@tanstack/ai@0.16.0`, `@tanstack/ai-anthropic@0.8.6`), live network tests, and empirical round-trip scripts in `/tmp` (no repo files modified).

**Result: 5 confirmed, 0 dismissed.** Two findings carry factual corrections that change details (not validity): Finding 1's masked-error message is the auth-flavored one (not the fully generic one), and Finding 5's size estimate is far too conservative (real bloat is quadratic, ~745x for a 4KB generation, not ~10-15x).

---

### Finding 1: Anthropic adapter constructed without `dangerouslyAllowBrowser` — SDK throws in every browser — CONFIRMED

**Original**: `createAnthropicChat(settings.model, secrets.apiKey)` is called with no config; the Anthropic SDK constructor throws in browser environments, making Anthropic unusable in the client-only product, and the error is masked by `normalizeAiError`.

**Verification**:
- App code confirmed: `packages/ai-builder/src/lib/formedible/ai-adapters.ts:75-77` calls `createAnthropicChat(model, apiKey)` with no third argument.
- Adapter chain confirmed in installed `@tanstack/ai-anthropic@0.8.6` `dist/esm/adapters/text.js:704-706`: `createAnthropicChat(model, apiKey, config)` → `new AnthropicTextAdapter({ apiKey, ...config }, model)` → `dist/esm/utils/client.js`: `createAnthropicClient(config)` → `new Anthropic_SDK({ ...config, apiKey })`. Nothing in the chain ever adds `dangerouslyAllowBrowser`.
- Guard confirmed in installed `@anthropic-ai/sdk@0.71.2` `client.mjs:55-56`: `if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) { throw new Errors.AnthropicError(...) }`; `internal/detect-platform.mjs` `isRunningInBrowser()` = `typeof window !== 'undefined' && window.document && navigator`.
- **Empirical**: ran the SDK under Node with browser-like globals (`window = { document: {} }`, `navigator`): `new Anthropic_SDK({ apiKey })` → `THREW: AnthropicError - It looks like you're running in a browser-like environment...`; with `dangerouslyAllowBrowser: true` → constructs fine.
- Browser context confirmed: `ai-types.ts:6` `export type AIBuilderMode = 'client'` (only mode); `apps/web/src/routes/ai-builder.tsx:47` renders `<AIBuilder />` (a `'use client'` component); `chat-interface.tsx:151` calls `streamAiResponse` directly in the browser. No server proxy exists.
- Third-param acceptance confirmed: `text.d.ts` `createAnthropicChat(model, apiKey, config?: Omit<AnthropicTextConfig, 'apiKey'>)`; `AnthropicTextConfig extends AnthropicClientConfig` (`utils/client.d.ts:2`) `extends ClientOptions`, which declares `dangerouslyAllowBrowser`.
- The double-break claim is also confirmed: `client.mjs:462-464` only adds the `anthropic-dangerous-direct-browser-access: true` header when `this._options.dangerouslyAllowBrowser` is set — the same flag gates both the constructor throw and the CORS header.
- Test-gap claim confirmed: `ai-builder.test.ts:321` constructs the Anthropic adapter in Node (no `window`), so `isRunningInBrowser()` is false and the suite cannot catch this.
- **Correction (minor)**: the surfaced message differs from the report. The SDK throw text includes `new Anthropic({ apiKey, dangerouslyAllowBrowser: true })`, and "apiKey" matches `isAuthLikeMessage`'s `/api\s*key/i` (`ai-errors.ts:34`), so users see the auth-flavored message "The selected provider rejected the request. Check the API key and provider settings." rather than the fully generic provider message. Equally misleading (the key is fine); the core failure and impact are unchanged.

---

### Finding 2: Secret redaction corrupts persisted/exported `formConfig` (persistence.key, defaultValues, schema) — CONFIRMED

**Original**: The persistence round-trip runs formConfig through over-broad redaction: `persistence.key` is unconditionally replaced with `'[REDACTED]'`, `defaultValues`/schema keys named `password`/`token`/etc. are overwritten, and schema strings are mangled by the key/value regex.

**Verification** (all source points confirmed, plus an empirical round-trip):
- `ai-storage.ts:1290`: `key: '[REDACTED]'` unconditionally in `parsePersistence` — the real key is used only for the type guard and discarded.
- `ai-storage.ts:1205` → `ai-safe-persistence.ts:226-247` (`parseSafeJsonRecordAllowEmpty`) → `isSecretKey` (`ai-safe-persistence.ts:269-280`) substring-matches `password`, `token`, `secret`, `credential`, etc. → value replaced with `'[REDACTED]'`.
- `ai-storage.ts:1388-1439` (`parseStrictSafeJsonValue`) routes schema strings through `redactSecretString` (`ai-safe-persistence.ts:282-287`); the third regex's char class `[^\s,;"'`)}\]]+` consumes `z.string(` up to `)`.
- `ai-storage.ts:1345-1351`: `sanitizeConversationForPersistence` and `sanitizeConversationForExport` are both thin wrappers over the identical `sanitizeConversation` — confirmed byte-identical behavior; the intended separation was never implemented.
- Round-trip confirmed: `persistConversations` (line 161-163) sanitizes on write; `readPersistedAIBuilderState` → `readConversations` → `parseConversations` re-parses on load — both directions corrupt.
- Supporting claims confirmed: `ai-parser.ts:26-43` `inferDefaultValues` gives every field a default (`''` for password/text), so `defaultValues.password` always exists in a parsed formConfig; `packages/formedible/src/hooks/use-form-persistence.ts` uses `config.key` directly as the storage key (lines 112/122/145), so a restored `key: '[REDACTED]'` means all such forms share one localStorage entry (cross-form draft bleed).
- **Empirical** (byte-identical module copies in `/tmp`, mock `window.localStorage`): persisted then re-read a conversation whose formConfig had `persistence.key: 'formedible-draft-login-form'`, `defaultValues.password: 'hunter2'`, `schema: 'z.object({ token: z.string() })'`. Restored result:
  - `persistence.key` → `"[REDACTED]"`
  - `defaultValues.password` → `"[REDACTED]"`
  - `schema` → `"z.object({ token=[REDACTED]]) })"` (mangled; the export path single-pass yields `token=[REDACTED])`, the persistence round-trip double-pass corrupts further)
  - `exportConversation` produces the same corruption.
- Not intentional: tests pin message `content`/`rawContent`/`thinking` redaction (`ai-builder.test.ts:527-528`) and schema round-tripping only for an `email` field with no secret-named keys (`ai-storage.test.ts:394-424`); no test pins the formConfig corruption, and no code path preserves the user's own persistence key. This is collateral damage from sharing the export-redaction path with self-persistence.

---

### Finding 3: `temperature` sent alongside Anthropic extended thinking → API 400; `budget_tokens` minimum unvalidated — CONFIRMED (with a correction on the budget_tokens sub-claim)

**Original**: With default settings (`temperature: 0.7`) plus any thinking budget, every Anthropic request fails; the adapter forwards temperature unchanged; `budget_tokens >= 1024` is unvalidated client-side.

**Verification**:
- `ai-generation.ts:285`: `temperature: providerSettings.temperature` passed unconditionally to `chat()`; `ai-adapters.ts:85-94`: thinking enabled whenever `thinkingBudgetTokens > 0`.
- Default temperature confirmed: `provider-selection.tsx:37` `temperature: 0.7`.
- Adapter forwarding confirmed in installed `@tanstack/ai-anthropic` `text.js:131-179` (`mapCommonOptionsToAnthropic`): `temperature: options.temperature` (line 168) sent unconditionally; it special-cases `max_tokens` vs the thinking budget (lines 162-164) but does nothing for temperature. The adapter's `validateTextProviderOptions` checks top_p-vs-temperature, budget minimum, and budget<max_tokens — but NOT temperature-vs-thinking.
- External claim verified against primary docs (platform.claude.com): the API primer states verbatim "Temperature must be set to 1 (or left unset) whenever thinking is enabled, on all models." The default model `claude-sonnet-4-6` (`ai-adapters.ts:19`) is in the constrained generation. So temp 0.7 + any thinking budget → rejected request, surfacing as a masked generic provider error. Confirmed.
- **Correction (sub-claim)**: "`budget_tokens` minimum is also unvalidated ... no client-side validation explains why" is inaccurate at the adapter layer. The installed adapter's `validateTextProviderOptions` (`text/text-provider-options.js`) throws a clear client-side error `"thinking.budget_tokens must be at least 1024."` (and `"must be less than max_tokens"`) before any network call, which surfaces as a RUN_ERROR event with that descriptive message. The app layer indeed lacks validation (`ai-adapters.ts:85` accepts any positive value; `agent-settings.tsx:159` input only has HTML `min="1"`), but the user gets an explicit message for this case, not a confusing 400. The temperature+thinking core of the finding stands as reported.

---

### Finding 4: Anthropic model-catalog fetch omits `anthropic-dangerous-direct-browser-access` header — preflight is CORS-rejected in every browser — CONFIRMED

**Original**: `fetchAnthropicModels` sends only `anthropic-version` and `X-Api-Key`; both are non-simple headers triggering a preflight that Anthropic rejects unless the browser-access header is present, so "Refresh models" for Anthropic can never succeed from a browser.

**Verification**:
- Source confirmed: `ai-model-catalog.ts:165-170` — headers are exactly `{ 'anthropic-version': '2023-06-01', 'X-Api-Key': apiKey }`; no browser-access header anywhere in the module. Module is `'use client'` (line 1) and called from `AIBuilder.refreshProviderModels` (`ai-builder.tsx:164`, wired at lines 267/276).
- **Live re-verification** (curl preflights against `https://api.anthropic.com/v1/models?limit=1000`):
  - `Access-Control-Request-Headers: x-api-key,anthropic-version` (exactly what the app's fetch triggers) → **HTTP 400**, body `Disallowed CORS origin`, **no** `access-control-allow-origin` → browser blocks the request before it is sent.
  - `Access-Control-Request-Headers: x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access` → **HTTP 200** with `access-control-allow-origin: *` and the header echoed in `access-control-allow-headers` → browser proceeds.
  - Identical to the reporter's live-test claims.
- Side-claims verified live: `api.openai.com` preflight → 200 with `access-control-allow-origin: *`; `openrouter.ai` → 204 with `access-control-allow-origin: *` (both unconditional) — only the Anthropic branch is broken.
- Error-masking confirmed: `ai-model-catalog.ts:76` wraps any failure in `createErrorCatalog(provider, now, error.message ?? 'Unable to refresh models.')`; a blocked preflight surfaces in the browser as a `TypeError: Failed to fetch`, i.e. an entry that looks like a network problem.

---

### Finding 5: Per-token stream events persisted for every message + quota failures swallowed silently — CONFIRMED (size impact significantly understated by the reporter)

**Original**: Every normalized stream event (including duplicated raw provider payloads) is persisted on each assistant message under one shared localStorage key; `writeJson` swallows QuotaExceededError, so persistence silently stops working once the quota is hit.

**Verification**:
- Producer confirmed: `chat-interface.tsx:174` `events: streamedEvents` stores every normalized event on the final assistant message; `ai-builder.tsx:188` persists conversations after every exchange; all conversations share `STORAGE_KEYS.conversations` = `'formedible-ai-builder-conversations'` (`ai-storage.ts:30`, one key for the whole array).
- Persistence keeps them: `ai-storage.ts:533` `parseSafeStreamEvents(value.events)` and line 545 include them in the persisted shape; `ai-safe-persistence.ts:152-158` retains both `delta` and the full `raw` chunk for every `text-delta`/`thinking-delta` event.
- Quota swallow confirmed: `ai-storage.ts:136-146` `writeJson` — `try { setItem } catch { return; }`; returns `void`, no caller can observe failure. **Empirically**: made `setItem` throw `QuotaExceededError` and called `persistConversations` — no exception, no signal.
- **Empirical size measurement** (replicating the exact pipeline: `@tanstack/ai-anthropic` `TEXT_MESSAGE_CONTENT` chunks carry `delta` AND `content: accumulatedContent` (installed `text.js:476-482`); `toTextEvent` (`ai-generation.ts:107-122`) stores `{ type: 'text-delta', delta, raw, receivedAt }`): a single ~4KB form generation streamed in ~1,354 3-char events persisted as a **2.95 MB** blob (~745x the content size) — one such message uses ~60% of the default ~5MB localStorage quota, and two would exceed it.
- **Correction (reporter's estimate too low)**: the report estimated "each token serialized ~2-4x ... roughly 40-60KB per 4KB generation". In reality each persisted event's `raw.content` is the *accumulated* text so far (not just the duplicated delta), making total event storage quadratic in message length. The problem is substantially worse than reported: the quota is exhausted after roughly 1-2 typical generations, not "a modest conversation history". The finding's substance (bloat + silent total persistence failure) is fully confirmed; only the magnitude was understated.

---

## False-positive signals checked

- **Finding 1**: No server-side proxy or non-browser execution path exists (`AIBuilderMode = 'client'` only); no wrapper anywhere in the chain sets the flag; the Node-only test suite is the only reason this passes CI.
- **Finding 2**: No intentional-design signal — the persistence/export sanitize split exists in name only (identical bodies), and no test pins `persistence.key` or `defaultValues` redaction (tests pin only message-content redaction and a secret-free schema).
- **Finding 3**: The adapter does not save the request from the temperature conflict (verified in source); only the budget_tokens sub-claim was softened (adapter-side validation exists with a clear message).
- **Finding 4/5**: No alternate fetch path, no event pruning, no quota handling anywhere in the module; live network behavior reproduced independently.

## Dismissed findings

None — all 5 findings are real.
