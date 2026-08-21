# Cluster 5 Review — Formedible Parser (`packages/formedible-parser/src`)

Reviewer scope: `formedible-parser.ts`, `parser-config-schema.ts`, `parser-types.ts`, `index.ts`, `registry-dependencies.d.ts`.

Method: full read of all files plus the formedible type definitions they compile against; every non-trivial finding below was **reproduced empirically** by executing the actual parser (`npx tsx` against the package source), not just by reading. Security surfaces checked explicitly: eval/Function sinks (none exist downstream — grep across `packages/formedible/src`, `apps/web/src`, `packages/ai-builder/src`, `packages/builder/src` found no `eval(`/`new Function`/`dangerouslySetInnerHTML` consumers of parser output), prototype pollution (JSON.parse, object spread, and `Object.fromEntries` all use define-own-property semantics; all assignment sinks with untrusted keys target freshly-created `{}` objects, so worst case is changing that one object's prototype, never `Object.prototype`), ReDoS (all regexes are linear — no nested overlapping quantifiers), Zod expression handling (expressions are replaced with an inert string sentinel and never evaluated anywhere — the sentinel can only surface as a literal string).

### [SEVERITY: HIGH] Finding 1: `parseStructured` rejects every direct structured config — `formOptions` is misinterpreted as an envelope key
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:415-429 (used at 1005-1013)
**Problem**: `pickStructuredCandidate` unwraps the input if any of `formedible`, `formConfig`, `config`, `output`, `formOptions` is present. But `formOptions` is a **required** member of `ParsedFormConfig` (the other arm of the exported `FormedibleStructuredOutput` union in parser-types.ts:92-100). So a direct, valid config object — including the parser's own output round-tripped back in — is unwrapped to its `formOptions` value, and validation then fails on the missing `fields` array.
**Evidence**:
```ts
for (const key of ['formedible', 'formConfig', 'config', 'output', 'formOptions']) {
  if (candidate[key] !== undefined) {
    return candidate[key];
  }
}
```
Reproduced: `FormedibleParser.parseStructured({ fields: [{ name: 'email', type: 'email' }], formOptions: { defaultValues: { email: '' } }, submitLabel: 'Send' })` throws `INVALID_FIELDS — Fields must be an array`. Same result via `parseAiOutput(object)`. All four other envelope keys (`formedible`, `formConfig`, `config`, `output`) work correctly; only the documented direct-config shape fails.
**Impact**: Total functional failure of the public `parseStructured` entry point for its primary documented input shape. Any consumer that passes a `ParsedFormConfig` (or an LLM structured output in canonical config shape, which the system prompt explicitly demands: "Do not wrap it in { form: ... }") always gets a spurious `INVALID_FIELDS` error. The existing test only covers the `formedible`-envelope path, so this is invisible to the suite.
**Suggestion**: Only unwrap an envelope key when the outer object does not itself look like a config, e.g. `if (!Array.isArray(candidate.fields))` before consulting the envelope list, and remove `formOptions` from the envelope candidate list (an LLM envelope `{ formOptions: { fields: ... } }` is not a real shape). At minimum, check `fields` presence first.

### [SEVERITY: MEDIUM] Finding 2: Pre-parse transforms are not string-literal aware — benign words inside string values are silently corrupted
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:218-232 (applied at 999-1000)
**Problem**: `sanitizeCode` runs over the raw source before `JSON.parse` and replaces the identifiers `document|window|globalThis|global|process|__proto__|constructor|prototype` (and `eval(...)`/`new X(...)` etc.) with `null` regardless of whether they appear inside string literals. String **data** — labels, descriptions, placeholders, default values — is silently rewritten.
**Evidence**:
```ts
.replace(/\b(document|window|globalThis|global|process|__proto__|constructor|prototype)\b/g, 'null')
```
Reproduced against the real parser:
- `label: "Close the window"` parses successfully with label **"Close the null"**.
- `description: "The constructor of this process"` becomes **"The null of this null"**.
- A field named `__proto__` silently becomes a field named `"null"` (see also Finding 9).
**Impact**: Silent data corruption of user-visible form content. Words like "window", "document", "process", "global" are ordinary English/technical vocabulary that plausibly appear in labels and descriptions of LLM-generated or user-pasted configs. The config parses "successfully", so the corruption is undetectable by the caller — the form just renders wrong text. This happens even for perfectly valid JSON input, since `sanitizeCode` runs before the first `JSON.parse` attempt.
**Suggestion**: Make the transforms string-aware: first mask string literal contents (the tokenizer logic in `findExpressionEnd` already knows how to skip `'`, `"`, `` ` `` — reuse it), apply replacements only outside strings, then unmask. Alternatively, since `JSON.parse` never executes anything, run `sanitizeCode` only on the non-JSON fallback path and restrict identifier nulling to contexts outside quotes.

### [SEVERITY: MEDIUM] Finding 3: `assertNoExecutableSyntax` rejects entire configs when `=>`, `<X`, or `eval(` appears inside string values
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:186, 212-216 (applied at 998 and 1009)
**Problem**: The executable-syntax guard is a substring test over the whole raw input with no string-literal awareness, so ordinary text content containing arrow-like or JSX-like fragments rejects the whole config.
**Evidence**:
```ts
const executableSyntaxPattern = /(?:=>|\bfunction\s*\(|...|\beval\s*\(|\bFunction\s*\(|...|<\s*[A-Z][A-Za-z0-9]*(?:\s|>|\/))/;
```
Reproduced: `label: "key => value"` → `EXECUTABLE_INPUT` rejection of the entire config. `label: "VAT <Included> applies"` → `EXECUTABLE_INPUT`. `placeholder: "e.g. eval(x) pattern"` → `EXECUTABLE_INPUT`.
**Impact**: Availability/false-rejection on legitimate content. Because the underlying parse is `JSON.parse` (nothing is ever executed), these rejections are purely defensive — but they deny valid configs containing plausible label/description text ("=>" in formula hints, "<X>" in comparison labels, "eval" in technical placeholders). The error message ("Executable callbacks... are not supported") actively misleads the user about what is wrong.
**Suggestion**: Apply the guard per-token outside string literals (same masking fix as Finding 2), or apply it only to the object-literal fallback path and to structural positions (after `:` / inside `{}` structure) rather than anywhere in the text.

### [SEVERITY: MEDIUM] Finding 4: Object-literal fallback path fails on legitimate inputs — apostrophes in double-quoted strings, `//` inside strings, escaped quotes
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:218-231, 326-329
**Problem**: Three independent string-unaware transforms on the literal-to-JSON conversion path break valid configs:
1. `.replace(/(?<!\\)'/g, '"')` flips single quotes to double quotes everywhere, so an apostrophe inside a double-quoted string produces invalid JSON. The system prompt's canonical output format (`generateSystemPrompt`, parser-config-schema.ts:263-287) uses **unquoted keys with double-quoted values** — exactly the shape where `"Don't stop"` breaks.
2. `.replace(/(^|[^:])\/\/.*$/gm, '$1')` strips line comments but only exempts `://`, so `//` anywhere else inside a string (e.g. a URL path `"https://example.com/a//b"`) truncates the rest of the line.
3. After the quote flip, an escaped single quote (`'It\'s fine'`) becomes `"It\'s fine"`, which is invalid JSON (`\'` is not a legal JSON escape).
**Evidence**: All three reproduced against the real parser, each surfacing as a confusing `SYNTAX_ERROR — Invalid syntax. Use JSON or a JavaScript object literal.`:
- `{ fields: [{ name: "note", type: "text", label: "Don't stop" }] }` → SYNTAX_ERROR.
- `placeholder: "https://example.com/a//b"` in a literal-key config → SYNTAX_ERROR.
- `label: 'It\'s fine'` → SYNTAX_ERROR.
**Impact**: Common, legitimate AI/human configs fail to parse with a misleading error. English apostrophes in labels ("Don't", "Can't", "Owner's") are a routine occurrence, and the system-prompt example format steers LLMs directly into the failing shape.
**Suggestion**: Do quote conversion with a real tokenizer pass (track the active string delimiter; only convert delimiters, never quotes inside a string; convert `\'` → `'` when the delimiter was single-quoted). Apply comment stripping only outside string literals.

### [SEVERITY: MEDIUM] Finding 5: Unbounded recursion overflows the stack and leaks a raw `RangeError`; advertised `maxNestingDepth` is never enforced
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:365-403 (`sanitizeDefaultValue`), 502-528 (`sanitizePlainConfig`), 345-363 (`cloneJsonValue`); packages/formedible-parser/src/lib/formedible/parser-config-schema.ts:54-59
**Problem**: The recursive sanitizers have no depth limit. V8's `JSON.parse` is iterative and happily parses 50,000+ levels of nesting, after which the parser's own recursion overflows. The resulting `RangeError` propagates out of `FormedibleParser.parse` as a plain error with no `code` property — outside the parser's documented error taxonomy.
**Evidence**: Reproduced — stack trace of the escaping error: `RangeError: Maximum call stack size exceeded at sanitizeDefaultValue (formedible-parser.ts:366:3)` for input `{"fields":[{"name":"a","type":"text","defaultValue": [[[...50,000 deep...]]] }]}`. Meanwhile `ParserConfig.maxNestingDepth` (default 50, min 5, max 200) is defined in parser-config-schema.ts and even advertised to the LLM in `generateSystemPrompt` ("Maximum nesting depth: 50 levels", parser-config-schema.ts:293), but no code in the parser ever reads or enforces it.
**Impact**: DoS/error-contract issue on the security-critical untrusted-input path. Callers keying off `error.code` (the taxonomy the parser itself establishes via `ParserError`) get an uncoded `RangeError` instead; `parseAiOutput` happens to catch it, but `parse`/`parseStructured`/`validateConfig` callers receive an inconsistent error shape. The config surface claims a depth control that does not exist, so the system prompt's promise to the LLM is unenforced.
**Suggestion**: Add a `depth` parameter (or module-level counter) to `sanitizeDefaultValue`/`sanitizePlainConfig`/`cloneJsonValue`/`sanitizeFields` and throw `createParserError('Nesting depth exceeds maximum allowed depth', 'NESTING_TOO_DEEP')` past a fixed limit (e.g. 100, or wired from `ParserConfig.maxNestingDepth`). Optionally pre-check depth during the `JSON.parse` reviver.

### [SEVERITY: MEDIUM] Finding 6: Page numbering is off-by-one between the two pages code paths — fields land on the wrong page
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:728 vs 778
**Problem**: When `fields` is absent and `pages[].fields` is used, `normalizeAiGeneratedPage` numbers pages `index + 1` (1-based). But when both `fields` and `pages` arrays are present (the canonical multi-step shape per the system prompt), `sanitizePages` numbers pages with the raw `index` (0-based).
**Evidence**:
```ts
// normalizeAiGeneratedPage (line 728)
const pageNumber = typeof page.page === 'number' ? page.page : index + 1;
// sanitizePages (line 778)
page: typeof page.page === 'number' ? page.page : index,
```
Reproduced: `{ fields: [{name:'a',page:1},{name:'b',page:2}], pages: [{title:'One'},{title:'Two'}] }` yields `pages: [{"page":0,"title":"One"},{"page":1,"title":"Two"}]` — so the field assigned to page 1 renders under page "Two". The same pages payload without a top-level `fields` array yields `1`/`2` as expected.
**Impact**: Wrong page assignment for any multi-step config where `pages` entries omit explicit `page` numbers — a shape the parser accepts and the AI plausibly emits. Fields silently render on the incorrect step.
**Suggestion**: Use the same 1-based fallback in `sanitizePages` (`index + 1`), or route all page numbering through the normalizer.

### [SEVERITY: LOW] Finding 7: Four top-level class-name keys are allowlisted but their values are always silently dropped
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:96-100 (allowlist) vs 842-884 (copy branches)
**Problem**: `fieldClassName`, `labelClassName`, `buttonClassName`, and `submitButtonClassName` are in `allowedTopLevelKeys`, so strict validation accepts them as valid keys — but no branch in the value-copying loop handles them, and a string value falls through to `sanitizePlainConfig`, which returns `undefined` for non-records, so the value is dropped. (`formClassName` works because it is in the string-copy branch at line 842. `layout` has the same fate.)
**Evidence**: Reproduced — input with `formClassName: 'fc', fieldClassName: 'fcc', labelClassName: 'lc', buttonClassName: 'bc', submitButtonClassName: 'sbc'` produces output containing only `formClassName: 'fc'`; the other four are `undefined`.
**Impact**: Silent data loss for explicitly permitted configuration. Strict validation implies these keys are supported, so callers cannot detect that their styling config was discarded.
**Suggestion**: Either add the four keys to the string-copy branch alongside `formClassName`, or remove them from `allowedTopLevelKeys` so strict validation rejects them honestly.

### [SEVERITY: LOW] Finding 8: `EnhancedParserOptions.baseSchema` / `mergeStrategy` / `predefinedHandlers` are accepted but never consumed
**File**: packages/formedible-parser/src/lib/formedible/parser-types.ts:37-45; packages/formedible-parser/src/lib/formedible/formedible-parser.ts:788-792
**Problem**: `parse`, `parseStructured`, and `parseAiOutput` all accept `ParserOptions | EnhancedParserOptions`, and `EnhancedParserOptions` declares `baseSchema`, `mergeStrategy`, and `predefinedHandlers` — but `validateAndSanitize` only ever reads the `ParserOptions` members (`strictValidation`, `allowedKeys`, `allowedFieldTypes`, `allowedFieldKeys`, `allowedPageKeys`, `allowedProgressKeys`, `allowedFormOptionsKeys`). Schema merging exists only as the separate `FormedibleParser.mergeSchemas` static.
**Evidence**: Reproduced — `FormedibleParser.parse(cfg, { baseSchema: {...}, mergeStrategy: 'extend' })` returns a config with no `schema` and no merged fields. No reference to `options.baseSchema`/`options.mergeStrategy`/`options.predefinedHandlers` exists anywhere in the parser.
**Impact**: Silent no-op API contract: callers reasonably expect `mergeStrategy`/`baseSchema` to behave as documented by the type (and mirroring `mergeSchemas`), and get an unmerged config with no error or warning.
**Suggestion**: Either apply them in `validateAndSanitize` (delegate to `mergeSchemas` post-sanitization) or narrow the accepted parameter type to `ParserOptions` and move `EnhancedParserOptions` to where it is actually used.

### [SEVERITY: LOW] Finding 9: No field-name validation — empty-string names accepted; `__proto__` names silently become `"null"`
**File**: packages/formedible-parser/src/lib/formedible/formedible-parser.ts:572-574
**Problem**: `sanitizeField` only checks `typeof field.name === 'string'`. An empty-string name passes validation and reaches the form runtime; a name of `__proto__` is silently rewritten to the literal string `"null"` by the `sanitizeCode` identifier nulling (Finding 2) and then passes. Names are also used verbatim as object keys downstream (`defaultValues[field.name]`, TanStack field registration), so pathological names have outsized effects relative to their validation.
**Evidence**: Reproduced — `{ fields: [{ name: '', type: 'text' }, { name: '__proto__', type: 'text' }] }` parses successfully with names `["", "null"]`.
**Impact**: Degenerate field names produce downstream breakage (field keying, default-value association) with no parse-time signal; the `__proto__` → `"null"` rename is outright data corruption of the identifier.
**Suggestion**: Validate `field.name` is a non-empty string (and consider rejecting `__proto__`/`constructor`/`prototype` names explicitly with `UNSUPPORTED_FIELD_NAME`), throwing `MISSING_REQUIRED_FIELD`/`INVALID_FIELD` otherwise. The `__proto__` mangling is fixed by Finding 2's string-aware transforms.

---

## Non-findings (checked, not problematic)

- **No code execution is possible through the parser**: output is derived exclusively from `JSON.parse` results over allowlisted keys; Zod expressions are replaced with an inert sentinel string and no downstream consumer evaluates them (no `eval`/`new Function`/`dangerouslySetInnerHTML` sinks exist in the formedible/ai-builder/builder/web packages).
- **No prototype pollution**: `JSON.parse`, object spread, and `Object.fromEntries` all use define-own-property semantics; the assignment sinks that use untrusted keys (`sanitizePlainConfig`, `sanitizeOptionSets`) target fresh `{}` objects, so an attacker-controlled `__proto__` key can only change that single object's prototype (and is then invisible to `Object.keys`), never `Object.prototype`. `sanitizeDefaultValue` additionally hard-blocks the three dangerous keys.
- **No ReDoS**: every regex is linear-time (no nested overlapping quantifiers); verified by inspection of all patterns including `executableSyntaxPattern` and the z-expression scanner.
- **No super-linear DoS in `replaceZodExpressions`**: suspected quadratic behavior from repeated `code.slice(index)` + rescan was benchmarked and is linear in practice (V8 slices are O(1); first-match scanning makes total scan cost O(n)) — 10,000 z-expressions/579 KB parse in ~34 ms.
- `registry-dependencies.d.ts` path mappings resolve correctly (`../../formedible/src/...` from `src/` reaches `packages/formedible/src/...`).
- Sentinel string leaking through unsanitized array entries (e.g. `tabs: [z.string()]` → literal `"__FORMEDIBLE_ZOD_EXPRESSION__"` tab label) is inert and cosmetic; not flagged.
