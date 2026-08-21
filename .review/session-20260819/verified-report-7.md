# Verified Report 7 — AI builder UI (shell/chat + settings/sidebar)

Verification of `.review/session-20260819/review-report-7.md` against actual source on branch `re-codex`.
Every finding was checked against the owning source in `packages/ai-builder/src` (plus the resolved `parser-config-schema` in `packages/ui`/`packages/formedible-parser` and the installed `react-markdown@10.1.0`). An empirical trace of the Finding 1 routing logic was run in `/tmp` scratch (repo untouched).

Result: **7 confirmed, 0 dismissed.**

---

### Finding 1: Streaming message updates are routed to whichever conversation is currently selected — cross-conversation data corruption — CONFIRMED

**Original**: Stream flushes call `onMessagesChange(displayedMessages)` without a conversation id; the parent's `updateMessages` writes them into whatever `currentConversationIdRef.current` points at *at flush time*, corrupting the newly-selected conversation or snapping the selection back.

**Verification**: Full trace of the actual code confirms the routing hole, and the reviewer's suggested false-positive escape hatch (conversation id captured in a closure) does not exist:

- `chat-interface.tsx` — `conversationId` (destructured at line 89) is used **exactly once**, at line 149, inside the `AiGenerationRequest` object sent to `streamAiResponse`. It is never referenced by `updateAssistantMessage` (lines 120-123), the scheduler `onFlush` (lines 131-141), or any other flush path. So the id is pinned for the *API request* but not for *message routing*.
- `chat-interface.tsx:120-123` — `displayedMessages` is a closure-local array built from the `messages` prop at submit time (line 114: `[...nextMessages, assistantMessage]` where `nextMessages = [...messages, userMessage]`, line 107). Every flush maps over this stale-by-design array and calls `onMessagesChange(displayedMessages)` with no owning-conversation identifier.
- `ai-builder.tsx:181-193` — `updateMessages` routes via `upsertConversation(previousConversations, currentConversationIdRef.current, nextMessages)`. `currentConversationIdRef` is mutated by `selectConversation` (line 207), `startNewConversation` (line 202), and `deleteConversation` (line 217), all of which remain fully interactive during generation: `grep -n "disabled|isGenerating"` over `conversation-history.tsx` and `sidebar-content.tsx` returns nothing, and the "New conversation" button (ai-builder.tsx:280) has no `disabled` prop. `ChatInterface` (ai-builder.tsx:282-293) has no `key` and is never unmounted on selection change, so the submit-time closure keeps flushing across switches.
- `ai-storage.ts:235-256` — `upsertConversation` finds by exact id first (`c.id === activeConversationId`), falls back to `c.messages[0]?.id === firstMessageId`, then `createConversation(nextMessages, ..., existingConversation)` reuses the matched conversation's id/title and **replaces `messages` wholesale** (ai-storage.ts:225).
- Scheduler cadence: `ai-stream-scheduler.ts:18-19` defaults to `setTimeout(callback, 16)`, so the mis-routed flush lands within ~16 ms of the user's click.

Empirical trace (verbatim port of `upsertConversation`/`createConversation`/`updateMessages` run in `/tmp/verify-f1/trace.mjs`):
- **Failure mode 1** (select B while A streams): after the next flush, conversation B keeps its id and title but its `messages` become `a1(user), a2(user), a3(assistant)` — B's original message `b1` is gone from state. While streaming the conversations effect (ai-builder.tsx:136-142) skips persist due to `hasStreamingMessage`, but the final flush sets `status: 'completed'`, after which the effect (and `shouldPersistMessages` at ai-builder.tsx:187) persists the corrupted state. `updateFormCode` (ai-builder.tsx:195-199) additionally writes A's generated `formCode` onto B. Permanent data loss, exactly as reported.
- **Failure mode 2** (click "New conversation" while A streams): ref becomes `undefined`; the flush falls back to matching by `messages[0].id`, finds A, and `updateMessages` sets `currentConversationIdRef.current`/`setCurrentConversationId` back to A's id — the user's action is silently undone. Confirmed by trace output (`currentConversationId after flush: conv-A`).
- Deleting the streaming conversation also reproduces (resurrection into whichever conversation became current, or as a brand-new conversation when none is current).

Line references in the report are accurate. Severity HIGH is justified: reachable in normal use, permanent cross-conversation data corruption.

---

### Finding 2: No abort or cleanup when ChatInterface unmounts mid-generation — CONFIRMED

**Original**: The component has no `useEffect`; the per-submission `AbortController` is stored in state and only aborted via the Stop button. Unmounting mid-stream leaves the LLM stream running to completion.

**Verification**:
- `chat-interface.tsx:3` imports only `useState` from React — the file (all 264 lines read) contains no `useEffect`, no ref, and no unmount cleanup of any kind.
- The `AbortController` (created at lines 129-130) is referenced in exactly one place besides creation: the Stop button at line 255 (`abortController?.abort('User stopped generation')`).
- `streamAiResponse` (`ai-generation.ts:293-330`) only terminates early on abort via the passed controller's signal; nothing ties that signal to component lifecycle. The parent `AIBuilder` also holds no AbortController (verified by full read of `ai-builder.tsx`).
- The scenario is real, not hypothetical: `AIBuilder` is a public export (`packages/ai-builder/src/index.ts:1`) rendered on a route (`apps/web/src/routes/docs/ai-builder.tsx`), so navigating away unmounts it mid-generation. The `for await` loop then keeps consuming the provider stream (wasted tokens/credits) and the scheduler's 16 ms timer keeps firing; `setIsGenerating(false)`/`setAbortController(undefined)` in the `finally` (lines 224-227) are post-unmount no-ops.
- The report's remark that `streamAiResponse` converts aborts into a `finish: 'abort'` event is accurate (`ai-generation.ts:96-97, 308-328`), so the suggested fix (abort from an unmount effect) integrates cleanly.

Severity MEDIUM is appropriate (resource waste, no data corruption).

---

### Finding 3: Custom instructions textarea trims on every keystroke — spaces cannot be typed — CONFIRMED

**Original**: The textarea is fully controlled from `config.customInstructions` and its `onChange` trims immediately, so trailing spaces are eaten and multi-word instructions cannot be typed.

**Verification**:
- `parser-settings.tsx:99` matches the quoted evidence verbatim: `<Textarea value={config.customInstructions ?? ''} onChange={(event) => updateConfig(config, { customInstructions: event.target.value.trim() || undefined }, onChange)} ... />`.
- The commit path is unguarded against trimming: `validateParserConfig` (parser-config-schema.ts:187) accepts `customInstructions` as any string, and `mergeParserConfig` (line 200-205) only spreads defaults — so `"hello "` → commits `"hello"` → controlled value snaps back to `"hello"` and the space never renders. The next `w` keystroke produces `"hellow"`.
- This is the classic controlled-input trim bug — the React claim is correct (state-driven value overrides the DOM's interim value on every change).
- The report's impact claim is also verified: `generateSystemPrompt` (parser-config-schema.ts:296-297) pushes `config.customInstructions` verbatim into the system prompt, so the trim-on-use alternative suggested by the reviewer is viable.

No intentional-design signal found (no comment, no test asserting trim-on-keystroke). CONFIRMED.

---

### Finding 4: Unstable `parserConfig` prop forces a full form re-parse on every parent render (~60 fps during streaming) — CONFIRMED

**Original**: `aiParserConfig = toAiParserConfig(parserConfig)` is recomputed per render with no memoization; `AiFormRenderer`'s effect has identity-sensitive deps including `parserConfig`, so every parent render re-runs a full `FormedibleParser.parse`.

**Verification**:
- `ai-builder.tsx:103` — `const aiParserConfig = toAiParserConfig(parserConfig);` sits in the component body, no `useMemo` anywhere in the file. It is passed to `ChatInterface` (line 291) and `AiFormRenderer` (line 297), producing a fresh object identity on every render.
- `ai-form-renderer.tsx:34-42` — the effect deps are `[code, isStreaming, onParseComplete, parserConfig]`, and the body runs `parseAiToFormedible(code, parserConfig)` plus `setParseResult(nextResult)` whenever any identity changes.
- The re-render trigger chain is real: each scheduler flush (16 ms default) → `onMessagesChange` → `updateMessages` → `setConversations` → full `AIBuilder` re-render → new `aiParserConfig` → `AiFormRenderer` effect re-runs. `AIBuilder` never passes `isStreaming` to `AiFormRenderer` (line 297 passes only `code, parserConfig, onSubmit, className`), so the effect's `if (isStreaming) return` guard is dead in this composition and the full parse runs during streaming too, on unchanged `code`.
- Secondary claim verified: `onParseComplete` is not passed by the in-repo consumer (`grep onParseComplete` finds only the definition and a docs string in `apps/web/src/routes/docs/ai-builder.tsx:206`), so the update-loop hazard is latent-but-public-API, as the report states.
- Note: `systemPrompt = generateSystemPrompt(parserConfig)` (line 102) is likewise recomputed per render, but as a string its identity is value-stable; the CPU cost is minor. The core finding (object identity → per-flush full re-parse) stands.

---

### Finding 5: Controlled numeric inputs normalize every keystroke — decimal temperature entry breaks; `parseNumber` fallback is dead code — CONFIRMED

**Original**: The temperature input re-derives its controlled value through `parseOptionalNumber` per keystroke; partial decimals report `''` in Chromium-family browsers, wiping typed digits. `parseNumber(value, fallback)` returns `0` for empty input because `Number('') === 0`, so the fallback is unreachable and `0` passes validation.

**Verification**:
- `agent-settings.tsx:149` matches the quoted evidence: `<Input value={settings.temperature ?? ''} type="number" min="0" max="2" step="0.1" onChange={(event) => onChange(updateTemperature(settings, parseOptionalNumber(event.target.value)), secrets)} />`.
- `parseOptionalNumber` (agent-settings.tsx:27-34) returns `undefined` for `''`; `updateTemperature(settings, undefined)` (lines 49-56) *removes* the field, so the controlled value snaps from `"0"` to `""`. The browser-behavior claim is correct per the WHATWG spec: `input.value` for `type=number` is the empty string whenever the entered text is not a valid floating-point number — `"0."` is not valid, so typing `0` then `.` fires a change with `value === ''`, wiping the `0`. Same pattern applies to max tokens (line 153) and thinking budget (line 159).
- Dead fallback verified both by reading (`parser-settings.tsx:19-22`: `Number('')` → `0`, `Number.isFinite(0)` → `true`, so fallback unreachable for empty input) and empirically (`parseNumber('', 1000000) === 0`).
- `validateParserConfig` (parser-config-schema.ts:188-189) only checks `typeof candidate.maxCodeLength === 'number'` — no min clamp — so `0` is committed and surfaced into the system prompt ("Maximum code length: 0 characters", line 293). No code-level enforcement of the HTML `min` attribute exists.

LOW severity is fair (edit friction + semantically wrong prompt text, no crash). CONFIRMED.

---

### Finding 6: Side effects inside `setConversations` state updaters (impure updaters) — CONFIRMED

**Original**: `setConversations` updaters call `setCurrentConversationId`, mutate `currentConversationIdRef`, and write `localStorage` inside the updater body, violating React's purity contract.

**Verification**:
- `ai-builder.tsx:181-193` (`updateMessages`) and `ai-builder.tsx:211-223` (`deleteConversation`) match the quoted evidence exactly: `setCurrentConversationId(...)` and `currentConversationIdRef.current = ...` inside the updater; `persistConversations(result.conversations)` (a synchronous `localStorage.setItem` path, ai-storage.ts) inside the `updateMessages` updater gated by `shouldPersistMessages`.
- The React claim is accurate: state updater functions must be pure; React StrictMode double-invokes them in development (documented behavior), and React may discard a render mid-flight under concurrent rendering, in which case side effects executed during the abandoned updater (ref write, selection setState, persistence of a never-committed snapshot) have already happened. The report's own assessment — no user-visible corruption today because the effects are idempotent and the conversations effect re-persists — is honest and correct, as is the note that this entangles with Finding 1's routing.
- Not intentional design: no comments or tests assert this pattern; it reads as an organic accretion.

CONFIRMED at LOW.

---

### Finding 7: Message list is not memoized — every prior message's markdown is re-parsed on every stream flush — CONFIRMED

**Original**: `ChatMessages`/`MarkdownMessage` are plain function components with no memoization; `ReactMarkdown` re-parses its content on every render, so during streaming all historical messages are re-parsed at up to ~60 Hz.

**Verification**:
- `chat-messages.tsx:39-73` — `ChatMessages` is a plain function component; `messages.map(...)` renders `<MarkdownMessage content={message.content} />` (line 66) with no `React.memo`/`useMemo` boundary.
- `markdown-message.tsx:120-128` — `MarkdownMessage` is a plain function calling `<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} ...>{content}</ReactMarkdown>` directly.
- The critical claim — that react-markdown re-parses per render — was verified against the **installed** `react-markdown@10.1.0` source (`node_modules/.pnpm/react-markdown@10.1.0_.../lib/index.js:175-178`): the default export `Markdown(options)` contains no `useMemo`/`useDeferredValue`; it synchronously runs `processor.runSync(processor.parse(file), file)` on every render. (Only `MarkdownHooks` uses state; it is not the default export used here.) So every re-render of an unchanged historical message redoes remark parse + GFM + rehype-highlight.
- Trigger chain is real: every flush produces a new `messages` array → `ChatInterface` re-renders → `ChatMessages` re-renders → all `MarkdownMessage` children re-render (no memo, so unchanged `content` prop identity is irrelevant). Correctness is unaffected (stable `key={message.id}`, line 52), matching the report's "pure performance" framing.

CONFIRMED at LOW.

---

## Summary

All 7 findings from review-report-7 are real; none were false positives. The HIGH finding (cross-conversation streaming corruption) was verified by full closure/routing trace plus an empirical simulation reproducing both failure modes (wholesale message replacement of the newly-selected conversation with permanent persistence; selection snapping back after "New conversation"). The specific false-positive hypotheses were each ruled out: the stream does NOT capture the conversation id for routing (it is used only in the API request), the sidebar does NOT disable switching during generation, and react-markdown v10 does NOT internally memoize parsing.

**7 confirmed, 0 dismissed.**

Confirmed titles:
1. Streaming message updates are routed to whichever conversation is currently selected — cross-conversation data corruption (HIGH)
2. No abort or cleanup when ChatInterface unmounts mid-generation (MEDIUM)
3. Custom instructions textarea trims on every keystroke — spaces cannot be typed (MEDIUM)
4. Unstable `parserConfig` prop forces a full form re-parse on every parent render (MEDIUM)
5. Controlled numeric inputs normalize every keystroke; `parseNumber` fallback is dead code (LOW)
6. Side effects inside `setConversations` state updaters (LOW)
7. Message list is not memoized — markdown re-parsed on every stream flush (LOW)
