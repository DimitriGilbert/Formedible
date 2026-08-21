# Verified Report 5 — Formedible Parser (`packages/formedible-parser/src`)

Verification method: full read of `formedible-parser.ts` (1155 lines), `parser-config-schema.ts`, `parser-types.ts`, `formedible-parser.test.ts`, plus `UseFormedibleOptions` in `packages/formedible/src/lib/formedible/types.ts`. Every finding was then **independently re-executed against the real parser source** from /tmp scratch (`node --import scripts/register-package-alias-loader.mjs --import tsx` importing `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` directly). No repo files were modified; scratch deleted after.

---

### Finding 1: `parseStructured` rejects every direct structured config — `formOptions` misinterpreted as an envelope key — CONFIRMED
**Original**: `pickStructuredCandidate` unwraps `formOptions` (a required member of `ParsedFormConfig`), so a direct valid config is unwrapped to its `formOptions` value and fails `INVALID_FIELDS`.
**Verification**: Source confirmed at formedible-parser.ts:415-429 — the envelope loop includes `'formOptions'` and `parser-types.ts:92-100` makes `ParsedFormConfig` the **first arm** of `FormedibleStructuredOutput`; `UseFormedibleOptions` (formedible types.ts:453-455) declares `formOptions` as required. Empirically reproduced:
- `FormedibleParser.parseStructured({ fields: [{name:'email',type:'email'}], formOptions: { defaultValues: { email: '' } }, submitLabel: 'Send' })` → throws `ParserError code=INVALID_FIELDS "Fields must be an array"`.
- `parseAiOutput(object)` → `{ success: false, source: 'structured', errors: [... "Fields must be an array"] }`.
- Round-trip: parser output fed back into `parseStructured` → same `INVALID_FIELDS`.
- Controls: envelope keys `formedible`/`config` parse fine; a direct config **without** `formOptions` also parses fine — isolating `formOptions` as the trigger.
Impact cross-checked: the system prompt (parser-config-schema.ts:216, 224, 236) demands the direct shape with mandatory `formOptions.defaultValues` ("Do not wrap it in { form: ... }", "Every field name must have a matching formOptions.defaultValues entry"), so a compliant structured LLM output always trips this. The one in-repo consumer (`packages/ai-builder/src/lib/formedible/ai-parser.ts:60`) uses the string path, which limits today's blast radius, but `parseStructured`/`parseAiOutput(object)` are public exported API documented in `apps/web/src/routes/docs/parser.tsx`. The test suite only covers the `formedible`-envelope path (test line 124-136) — no test documents this failure as intent. Real bug.

### Finding 2: Pre-parse transforms are not string-literal aware — benign words inside string values silently corrupted — CONFIRMED
**Original**: `sanitizeCode` nulls `document|window|globalThis|global|process|__proto__|constructor|prototype` inside string literals, silently corrupting labels/descriptions/names.
**Verification**: Regex confirmed at formedible-parser.ts:223, applied to raw code at line 999 before any `JSON.parse`. Empirically reproduced against the real parser:
- `label: "Close the window"` → parses OK, label becomes `"Close the null"`.
- `description: "The constructor of this process"` → `"The null of this null"`.
- Field named `__proto__` → parses OK as field named `"null"`.
- Same corruption for strictly valid JSON input (`{"fields":[{"...","label":"Close the window"}]}`), proving it fires before/independent of the JSON parse. No test asserts this corruption as intended behavior (the identifier-nulling tests use genuinely executable content like `process.exit(1)`). Real bug.

### Finding 3: `assertNoExecutableSyntax` rejects entire configs when `=>`, `<X`, or `eval(` appears inside string values — CONFIRMED
**Original**: Substring-based executable-syntax guard has no string-literal awareness; ordinary text content rejects the whole config.
**Verification**: Pattern confirmed at formedible-parser.ts:186, applied at line 998 (string path) and 1009 (structured-string path). Empirically reproduced — all three reporter cases throw `ParserError code=EXECUTABLE_INPUT`:
- `label: "key => value"` → EXECUTABLE_INPUT (also for strictly valid JSON, and via `parseStructured(string)`).
- `label: "VAT <Included> applies"` → EXECUTABLE_INPUT (matches `<\s*[A-Z]...`).
- `placeholder: "e.g. eval(x) pattern"` → EXECUTABLE_INPUT.
False-positive check: the tests document intentional rejection of genuinely executable syntax (`new Evil()`, `() => process.exit(1)`, `require('fs')`) — that intent is legitimate — but no test asserts rejection of arrow/JSX-like fragments inside innocent string content. The parse is pure `JSON.parse` (nothing executes), so these rejections protect nothing. Real bug (over-broad guard).

### Finding 4: Object-literal fallback fails on apostrophes in double-quoted strings, `//` inside strings, escaped quotes — CONFIRMED
**Original**: Three string-unaware transforms on the literal→JSON path (quote flip, comment strip, escape handling) break valid configs with SYNTAX_ERROR.
**Verification**: Transforms confirmed at formedible-parser.ts:326-329 (`(?<!\\)'` → `"` flip at 328; comment strip in `sanitizeCode` line 221). Empirically reproduced — all three reporter inputs throw `ParserError code=SYNTAX_ERROR "Invalid syntax. Use JSON or a JavaScript object literal."`:
- `{ fields: [{ name: "note", type: "text", label: "Don't stop" }] }` → SYNTAX_ERROR (apostrophe flipped inside a double-quoted string).
- `placeholder: "https://example.com/a//b"` in a literal-key config → SYNTAX_ERROR (`//` after `a` truncates the line; only `://` is exempt).
- `label: 'It\'s fine'` → SYNTAX_ERROR (`\'` survives as an illegal JSON escape after the flip).
Control: single-quoted strings without embedded quotes parse fine on the same fallback path, isolating the three defects. The system-prompt example format (unquoted keys + double-quoted values, parser-config-schema.ts:263-287) steers LLMs into exactly the failing shape. No test covers apostrophes; tests only use clean single-quoted strings. Real bug.

### Finding 5: Unbounded recursion overflows the stack, leaks raw `RangeError`; `maxNestingDepth` never enforced — CONFIRMED
**Original**: Recursive sanitizers have no depth limit; deep nesting escapes as an uncoded `RangeError`; the advertised `maxNestingDepth` (50) is dead config.
**Verification**: Empirically reproduced with string-built JSON (to avoid `JSON.stringify`'s own recursion limit):
- `JSON.parse` alone handles 50,000 depth fine (iterative) — matches the reporter's premise.
- `FormedibleParser.parse` throws `RangeError: Maximum call stack size exceeded` at ~2,000 depth (1,500 OK, 2,000 throws); stack head: `at sanitizeDefaultValue (formedible-parser.ts:365) ← line 379 (Array.map recursion)`. The error has **no `code` property** — outside the `ParserError` taxonomy — and escapes `parse`/`parseStructured` directly.
- `parseStructured` (structured-object path) also RangeErrors at ~5,000 depth inside `cloneJsonValue` (line 347).
- `parseAiOutput` and `validateConfig` catch it but emit the raw V8 message ("Maximum call stack size exceeded"), inconsistent with the coded taxonomy.
- Grep confirms `maxNestingDepth` appears **nowhere** in the parser outside `parser-config-schema.ts`; `generateSystemPrompt` advertises "Maximum nesting depth: 50 levels" (verified in generated prompt text) while a depth-1,000 config (20x the advertised cap) parses successfully. Confirmed as advertised-but-unenforced. Real bug. (Minor nuance: overflow threshold is ~2k depth for the string path, not 50k — the reporter's 50k repro also overflows, so substance unchanged.)

### Finding 6: Page numbering off-by-one between the two pages code paths — CONFIRMED
**Original**: `sanitizePages` numbers pages with raw `index` (0-based) while `normalizeAiGeneratedPage` uses `index + 1`, so with both `fields` and `pages` present, pages are 0-based and fields land on the wrong page.
**Verification**: Source confirmed verbatim — line 728 (`index + 1`) vs line 778 (`index`). Empirically reproduced (with valid field `type`s — note: the reporter's literal repro omitted `type` and actually throws `MISSING_REQUIRED_FIELD` before page numbering; the finding still holds once types are present, which any real config has):
- `{ fields: [{name:"a",type:"text",page:1},{name:"b",type:"text",page:2}], pages: [{title:"One"},{title:"Two"}] }` → `pages: [{"page":0,"title":"One"},{"page":1,"title":"Two"}]` — the field on `page:1` renders under "Two".
- Control: same pages payload without top-level `fields` (pages-only path) → 1-based `{"page":1},{"page":2"}` as expected.
- Control: pages with explicit `page` numbers pass through correctly.
No test asserts 0-based numbering as intent. Real bug (reporter's exact repro snippet was slightly malformed, but the code defect and impact are exactly as described).

### Finding 7: Four top-level class-name keys allowlisted but values always dropped — CONFIRMED
**Original**: `fieldClassName`, `labelClassName`, `buttonClassName`, `submitButtonClassName` pass strict key validation but no copy branch handles them; string values fall through to `sanitizePlainConfig` which returns `undefined` for non-records.
**Verification**: Allowlist entries at formedible-parser.ts:97-100; the string-copy branch at line 842 includes only `formClassName`. Empirically reproduced: input with all five class names produces output containing only `formClassName: 'fc'`; the other four are absent. (`layout` has the same fate.) No test covers these keys. Real bug — silent data loss on keys the parser itself certifies as valid.

### Finding 8: `EnhancedParserOptions.baseSchema` / `mergeStrategy` / `predefinedHandlers` accepted but never consumed — CONFIRMED
**Original**: The parse methods accept `EnhancedParserOptions` but `validateAndSanitize` only reads plain `ParserOptions` members; schema merging exists only as the separate `mergeSchemas` static.
**Verification**: Grep confirms `options.baseSchema` / `options.mergeStrategy` / `options.predefinedHandlers` are never read anywhere in the parser (the only `baseSchema` hits are the explicit parameter of the separate `mergeSchemas` static at lines 1093-1131). Empirically reproduced: `FormedibleParser.parse(cfg, { baseSchema: {...}, mergeStrategy: 'extend' })` returns a config with no `schema` key and no merged fields. Silent no-op API surface. Real bug (API-contract, low severity as reported).

### Finding 9: No field-name validation — empty-string names accepted; `__proto__` names silently become `"null"` — CONFIRMED
**Original**: `sanitizeField` only checks `typeof field.name === 'string'`; empty names pass, and `__proto__` names are mangled to `"null"` by the identifier nulling.
**Verification**: Check confirmed at formedible-parser.ts:572-574. Empirically reproduced: `{ fields: [{ name: "", type: "text" }, { name: "__proto__", type: "text" }] }` parses successfully with names `["", "null"]`. No test asserts acceptance of empty/mangled names as intent. Real bug (the `__proto__` → `"null"` half is the string-unawareness from Finding 2 applied to identifiers).

---

## Summary

**9 confirmed, 0 dismissed.** All nine findings independently reproduce against the real parser source. No finding was shielded by an intentional-design signal: the test suite (`formedible-parser.test.ts`) asserts rejection of genuinely executable syntax and the happy paths, but never asserts the string-content corruption, string-content false rejection, apostrophe/URL failures, 0-based page numbering, dropped class-name keys, or empty-name acceptance as intended behavior.

Verification caveats (do not change conclusions):
- Finding 1: the sole in-repo consumer (`ai-parser.ts`) uses the string path, so production impact today is limited to direct `parseStructured`/`parseAiOutput(object)` callers — but the structured object path is exported public API and the type union's first arm is the failing shape.
- Finding 5: overflow threshold measured at ~2,000 depth (string path) / ~5,000 (structured path), not 50,000 — 50,000 also overflows, so the reported behavior stands.
- Finding 6: the reporter's exact repro snippet omitted field `type` (throws a different error); with valid types the off-by-one reproduces exactly as claimed.
