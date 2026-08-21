# Cluster 7 Review — AI builder UI (shell/chat + settings/sidebar)

Reviewer scope: `packages/ai-builder/src/components/formedible/ai/*` + `packages/ai-builder/src/index.ts`.
All findings reference the owning source in `packages/ai-builder` (synced copies under `packages/ui` ignored per instructions).

Summary: 1 HIGH, 3 MEDIUM, 3 LOW.

---

### [SEVERITY: HIGH] Finding 1: Streaming message updates are routed to whichever conversation is currently selected — cross-conversation data corruption

**File**: packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:181-193 (with packages/ai-builder/src/components/formedible/ai/chat-interface.tsx:120-125 and packages/ai-builder/src/lib/formedible/ai-storage.ts:235-256)

**Problem**: `ChatInterface.submitPrompt` builds `displayedMessages` from the conversation that was active when the prompt was submitted, but every stream flush calls `onMessagesChange(displayedMessages)` without identifying which conversation those messages belong to. The parent's `updateMessages` then writes them into whatever conversation `currentConversationIdRef.current` points at *at flush time*, and overwrites the user's selection with the result.

**Evidence**:
```ts
// chat-interface.tsx — closure captured at submit time, never re-pinned
function updateAssistantMessage(message: AiMessage): void {
  displayedMessages = displayedMessages.map((existingMessage) => (existingMessage.id === assistantMessage.id ? message : existingMessage));
  onMessagesChange(displayedMessages);   // no conversation id
}

// ai-builder.tsx — routes by *current* selection, not by owning conversation
function updateMessages(nextMessages: readonly AiMessage[]) {
  setConversations((previousConversations) => {
    const result = upsertConversation(previousConversations, currentConversationIdRef.current, nextMessages);
    currentConversationIdRef.current = result.conversationId;
    setCurrentConversationId(result.conversationId);
    ...
```
`upsertConversation` (ai-storage.ts:240-248) finds the conversation by exact id first and then does `createConversation(nextMessages, ..., existingConversation)` — i.e. it replaces the matched conversation's `messages` wholesale.

**Impact**: Two concrete failure modes, both reachable in normal use because the Stop button is optional and a stream runs for seconds:
1. User selects conversation B (or deletes one) while conversation A is streaming: the next flush (within ~16 ms) matches B by id and replaces B's `messages` with A's streaming messages under B's id/title. B's real messages are permanently lost (and get persisted by the `conversations` effect once the stream finishes). Same corruption if the user deletes the streaming conversation — the next flush resurrects its content inside whichever conversation became current.
2. User clicks "New conversation" while A is streaming: `upsertConversation` falls back to matching by `messages[0].id`, finds A, and `setCurrentConversationId(result.conversationId)` snaps the UI back to A, silently undoing the user's action.

**Suggestion**: Pin the target conversation at submit time. Either change `onMessagesChange` to `(conversationId, messages)` and have `ChatInterface` pass the `conversationId` prop it already receives (it is currently only forwarded into `AiGenerationRequest`, line 149), or keep a ref in `AIBuilder` holding the conversation id that each in-flight stream belongs to, and make `updateMessages` accept an explicit target id instead of reading `currentConversationIdRef.current`. `selectConversation`/`startNewConversation`/`deleteConversation` must stop in-flight streams' flushes from re-pointing `currentConversationId`.

---

### [SEVERITY: MEDIUM] Finding 2: No abort or cleanup when ChatInterface unmounts mid-generation

**File**: packages/ai-builder/src/components/formedible/ai/chat-interface.tsx:94-97, 129-130, 223-227

**Problem**: The component has no `useEffect` at all. The `AbortController` created per submission is stored in state and only aborted via the Stop button. If `ChatInterface` (or the whole `AIBuilder`) unmounts while `submitPrompt`'s `for await` loop is running, nothing aborts the request; the loop keeps consuming the provider stream and keeps calling `onMessagesChange` (a no-op state update on the unmounted parent).

**Evidence**:
```ts
const [abortController, setAbortController] = useState<AbortController>();
...
const nextAbortController = new AbortController();
setAbortController(nextAbortController);
...
} finally {
  streamScheduler.flushNow();
  setIsGenerating(false);          // setState after unmount, no-op
  setAbortController(undefined);
}
```

**Impact**: Navigating away mid-generation leaves the LLM stream running to completion in the background — wasted provider tokens/credits, and the scheduler's 16 ms timer keeps firing with React state updates going nowhere. This is exactly the "cleanup on unmount / AbortController" hazard the streaming design is supposed to cover.

**Suggestion**: Track the controller in a ref and add `useEffect(() => () => { abortControllerRef.current?.abort('Component unmounted'); }, [])`, and cancel any pending scheduler frame (or let `flushNow`'s cancel handle it once the loop throws on abort — `streamAiResponse` already converts aborts into a `finish: 'abort'` event).

---

### [SEVERITY: MEDIUM] Finding 3: Custom instructions textarea trims on every keystroke — spaces cannot be typed

**File**: packages/ai-builder/src/components/formedible/ai/parser-settings.tsx:99

**Problem**: The textarea's `onChange` immediately trims the value and coerces empty to `undefined`, and the input is fully controlled from `config.customInstructions`. Any space typed at the end of the text is eaten before the next keystroke.

**Evidence**:
```tsx
<Textarea value={config.customInstructions ?? ''} onChange={(event) => updateConfig(config, { customInstructions: event.target.value.trim() || undefined }, onChange)} ... />
```
Typing `hello world`: after `hello`, pressing space fires change with `"hello "`, which trims back to `"hello"`, so the controlled value snaps to `"hello"` and the space never appears; the following `w` produces `"hellow"`.

**Impact**: Multi-word custom parser instructions — the entire point of the field ("Add constraints for generated forms...") — cannot be entered by typing (only by pasting). The instructions are injected verbatim into the system prompt (`generateSystemPrompt`), so users cannot use the feature as designed.

**Suggestion**: Keep raw text in state while editing (local string state or an untrimmed config value) and trim only when producing the system prompt / persisting, e.g. trim inside `generateSystemPrompt` usage or on blur instead of in `onChange`.

---

### [SEVERITY: MEDIUM] Finding 4: Unstable `parserConfig` prop forces a full form re-parse on every parent render (~60 fps during streaming)

**File**: packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:103 (also 291, 297); packages/ai-builder/src/components/formedible/ai/ai-form-renderer.tsx:34-42

**Problem**: `AIBuilder` recomputes `const aiParserConfig = toAiParserConfig(parserConfig);` in the component body with no memoization, producing a new object identity on every render. `AiFormRenderer`'s effect lists `parserConfig` as a dependency, so the effect re-runs on every single parent render — including each stream flush, because every scheduler flush calls `updateMessages` → `setConversations` → full `AIBuilder` re-render.

**Evidence**:
```ts
// ai-builder.tsx — new object identity per render
const aiParserConfig = toAiParserConfig(parserConfig);

// ai-form-renderer.tsx — identity-sensitive deps
useEffect(() => {
  if (isStreaming) { return; }
  const nextResult = parseAiToFormedible(code, parserConfig);   // full FormedibleParser.parse
  setParseResult(nextResult);
  onParseComplete?.(nextResult);
}, [code, isStreaming, onParseComplete, parserConfig]);
```

**Impact**: While a response streams (scheduler flushes every ~16 ms), the previously generated form is re-parsed from scratch and `setParseResult` triggers an extra re-render of the whole form tree on every frame, even though neither `code` nor the parser settings changed. `FormedibleParser.parse` does extraction + sanitize + object-literal parse + validation per call — on non-trivial forms this is real per-frame CPU and visible jank. Secondary footgun: `onParseComplete` is also an identity-sensitive dep, so any consumer passing an inline callback that sets parent state creates an update loop (in-repo usage doesn't pass it, but the component is a public export).

**Suggestion**: Memoize `aiParserConfig` with `useMemo(..., [parserConfig])` in `AIBuilder` (and `systemPrompt` likewise), or make `AiFormRenderer` depend on primitive/stable values (e.g. serialize the relevant config fields, or parse in a `useMemo` keyed by `code` + config fields). Remove `onParseComplete` from the effect deps (call it from the memo computation's commit via a ref, or document it must be stable).

---

### [SEVERITY: LOW] Finding 5: Controlled numeric inputs normalize every keystroke — decimal temperature entry breaks; `parseNumber` fallback is dead code

**File**: packages/ai-builder/src/components/formedible/ai/agent-settings.tsx:149; packages/ai-builder/src/components/formedible/ai/parser-settings.tsx:19-22, 90

**Problem**: The temperature input is a controlled `type="number"` input whose value is re-derived through `parseOptionalNumber` on every change. In Chromium-family browsers a partial decimal (e.g. `0.` after typing `0`) reports `''` from `event.target.value`, so `parseOptionalNumber('')` returns `undefined`, `updateTemperature` *removes* the field, and the controlled value snaps from `"0"` to `""` — the typed digits are wiped mid-edit. Decimals can effectively only be entered by pasting. Additionally, in `parser-settings.ts`, `parseNumber(value, fallback)` uses `Number.isFinite(Number(value))`, and `Number('') === 0`, so clearing `maxCodeLength` yields `0`, never the fallback (and the HTML `min` is not enforced in code, so `0` is accepted by `validateParserConfig`).

**Evidence**:
```tsx
<Input value={settings.temperature ?? ''} type="number" min="0" max="2" step="0.1"
  onChange={(event) => onChange(updateTemperature(settings, parseOptionalNumber(event.target.value)), secrets)} />
```
```ts
function parseNumber(value: string, fallback: number): number {
  const parsedValue = Number(value);              // Number('') === 0
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
```

**Impact**: Annoying-but-real edit breakage of a core model setting (temperature), and semantically wrong `maxCodeLength: 0` / `maxNestingDepth: 0` values (only surfaced into the system prompt text today, hence LOW).

**Suggestion**: Keep the raw string in local state while the field is focused and commit the parsed number on blur (or use `defaultValue` + `key` on commit). Treat `''` as "use fallback" in `parseNumber`, and clamp to the declared min/max.

---

### [SEVERITY: LOW] Finding 6: Side effects inside `setConversations` state updaters (impure updaters)

**File**: packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:181-193, 211-223

**Problem**: The `setConversations` updater functions call `setCurrentConversationId` (another setState), mutate `currentConversationIdRef`, and write to `localStorage` (`persistConversations`) inside the updater body. React requires updater functions to be pure; they are double-invoked in dev StrictMode and can be re-run or have their render abandoned under concurrent rendering.

**Evidence**:
```ts
setConversations((previousConversations) => {
  const result = upsertConversation(previousConversations, currentConversationIdRef.current, nextMessages);
  currentConversationIdRef.current = result.conversationId;   // ref mutation
  setCurrentConversationId(result.conversationId);            // setState inside updater
  if (shouldPersistMessages(nextMessages)) {
    persistConversations(result.conversations);               // localStorage write inside updater
  }
  return result.conversations;
});
```

**Impact**: No user-visible corruption today (the side effects happen to be idempotent and the conversations effect re-persists anyway), but it violates React's purity contract: double persistence and double ref writes under StrictMode, and a persisted snapshot can be written for state that a discarded/interrupted render never commits. It also makes the real routing bug (Finding 1) harder to reason about.

**Suggestion**: Compute the next conversations purely (or via the reducer pattern: move the whole conversation-state transition into a `useReducer` where the reducer returns both conversations and the derived current id, or perform the ref/id/persist work in an effect keyed on the committed state).

---

### [SEVERITY: LOW] Finding 7: Message list is not memoized — every prior message's markdown is re-parsed on every stream flush

**File**: packages/ai-builder/src/components/formedible/ai/chat-messages.tsx:44-72; packages/ai-builder/src/components/formedible/ai/markdown-message.tsx:120-128

**Problem**: Each scheduler flush produces a new `messages` array (necessarily), and `ChatMessages`/`MarkdownMessage` are plain function components with no memoization. `ReactMarkdown` re-parses its `content` on every render, so during streaming every historical message in the conversation is re-parsed (markdown AST + GFM + rehype-highlight) at up to ~60 Hz, in addition to the active one.

**Evidence**:
```tsx
{messages.map((message) => { ... <MarkdownMessage content={message.content} /> ... })}
```
`MarkdownMessage` calls `<ReactMarkdown ...>{content}</ReactMarkdown>` directly with no `React.memo` boundary.

**Impact**: Pure performance: in long conversations the per-flush re-parse of N-1 unchanged messages can blow the frame budget and make the chat visibly janky while streaming. No correctness impact (message ids are stable keys).

**Suggestion**: Wrap `MarkdownMessage` in `React.memo` (its only prop is a string) or memoize per-message subtrees; combined with Finding 4's fix this removes nearly all per-flush work for unchanged content.

---

## Verified clean (review-focus areas with no findings)

- **XSS / markdown rendering**: `markdown-message.tsx` uses `react-markdown` with `skipHtml` and no `rehype-raw`; no `dangerouslySetInnerHTML` anywhere in the package (only test assertions referencing it). react-markdown v10's default `urlTransform` neutralizes `javascript:`-style hrefs, and the custom `a` renderer adds `target="_blank" rel="noreferrer"`. Thinking output and raw debug text are rendered as text nodes (`whitespace-pre-wrap` / inside `<pre>`), not HTML. No XSS sink found.
- **Secrets persistence**: `persistProviderSecrets` respects the memory/session/local preference and only writes the key when `rememberKey` is set; conversation export and debug panels run through `redactUnknown`/`redactSecretString`/`parseSafeStreamEvents`.
- **Provider catalog refresh**: `fetchProviderModels` never rejects (returns an error catalog), so the `void refreshProviderModels()` call sites cannot produce unhandled rejections; the auto-refresh effect is correctly guarded against loops.
- **Persistence guard**: streaming messages are correctly excluded from `persistConversations` via `shouldPersistMessages`/`hasStreamingMessage`, so a reload mid-stream cannot resurrect a `status: 'streaming'` message.
- **Keys/lists**: all mapped lists (`messages`, `conversations`, sidebar items, model options) use stable keys.
