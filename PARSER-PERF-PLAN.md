# Parser Performance Diagnosis — PARSER-PERF-PLAN

Phase PD deliverable (branch `parser-perf`, 2026-08-31). Diagnoses the ~8x per-parse regression of `packages/formedible-parser` vs `main` measured by the browser bench suite (item A1 of `PERF-BENCHMARK-FOLLOW-UPS.md`) and specifies the fix plan. No library code was changed in this phase; every number below was measured on this branch with the harness described in §2.5.

All `file:line` references without a branch prefix point at `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` on this branch (commit `d181806`). References into the baseline are written `main:…` and point at `git show main:packages/formedible-parser/src/lib/formedible/formedible-parser.ts`.

---

## 1. Executive summary

**The regression is not in field validation. 92% of current's large-config parse time is the pre-JSON text pipeline** — `assertNoExecutableSyntax` and `sanitizeCode` both run, unconditionally, before `JSON.parse` is ever attempted, and both are built on `scanCodeRegions`, a per-character JS scanner. For the bench configs (pure JSON, produced by `JSON.stringify` in `tests/bench/lib/scenarios/forms.ts:506`) that entire pipeline provably cannot change the input: `sanitizeCode(code) === code` was verified byte-for-byte for all three bench configs and a corpus of tricky JSON (§2.3). `JSON.parse` succeeding on the raw text is itself proof that no executable syntax exists outside string literals (the JSON grammar admits only structural tokens, numbers, and `true/false/null` outside strings), so the assert stage can never fire for it either.

**Top root causes by measured cost share** (stage timing, large config, current total 1,046 µs/parse):

| # | Root cause | Measured share (large) | Main's equivalent |
| --- | --- | --- | --- |
| 1 | Pre-JSON text pipeline runs on input that needs none of it: 2× `scanCodeRegions` (assert `:1286` + sanitize `:1287`) + 10-regex `neutralizeExecutableConstructs` per code region | **A+B = 951 µs = 91.9%** (assert 171.7 + sanitize 726.3) | main has one 12-regex `sanitizeCode` (`main:…formedible-parser.ts:444-478`) at 42.7 µs and no assert stage |
| 2 | `neutralizeExecutableConstructs` (`:392-404`) runs 10 regex passes whose patterns are 90% **dead by ordering**: 9 of 10 are subsumed by `executableSyntaxPattern` (`:189`), which `assertNoExecutableSyntax` (`:384-390`) already enforced on the same regions | **38.1% of CPU samples** (29.35% function self + 8.73% summed regex self). Bare-identifier-only variant costs 5.5 µs vs 301.3 µs full (−98%) | main's patterns are its only defense (no assert); in current they are unreachable post-assert |
| 3 | `scanCodeRegions` (`:206-311`) is a char-at-a-time loop building strings with `buffer += character` | 15.5% self + shares of the 7.35% closure samples; **146.4 µs per scan** of the 14,448-byte large config (10.1 ns/char), executed 2× per parse | main has no scanner (regex-only); the scanner buys real correctness (§3.2) — keep for the fallback path, never for JSON |
| 4 | Stage-D allocation churn: per-field 16-element array literal (`:869-886`), per-key 7-element `.includes` array in `sanitizePlainConfig` (`:726`), per-key 12/6-element arrays in `validateAndSanitize` (`:1070-1086`) | Stage D = 84.3 µs (**8.1%**); GC 2.13% of samples; 1,600 dead `sanitizePlainConfig` probes on the large config (0 nested configs present) | main's `validateFields` (`main:…:897-980`) does inline type checks, no per-call arrays: 20.8 µs |

**Headline fix**: try `JSON.parse` on the raw input first (`parse` `:1274`, `parseStructured` `:1303`); only on failure run the current assert → sanitize → object-literal pipeline. A prototype of exactly this (§2.4) measured, node-side, median µs/parse:

| config | current parse() | fast-path prototype | speedup | main | new ratio vs main |
| --- | --- | --- | --- | --- | --- |
| small (845 B) | 59.6 | **8.8** | 6.8x | 7.8 | 1.13x |
| medium (3,702 B) | 268.3 | **35.8** | 7.5x | 31.1 | 1.15x |
| large (14,448 B) | 1,028.0 | **139.0** | 7.4x | 118.4 | 1.17x |

Arithmetic for large: fast path = one `JSON.parse` (53.9 µs, the raw-JSON floor measured in §2.1) + stage D unchanged (84.3 µs) + <1 µs guard = ≈139 µs, matching the prototype. Item 4 (allocation hoisting) then targets stage D ≈ 60-70 µs, i.e. large ≈ 115-125 µs — main parity (118.4 µs).

**Target — what "WAY faster" means here** (bench conditions, N=25, order-stable parser-only runs per BENCH-FINDINGS [P3.1] medium):

- `parser-large/ms-per-parse` ≤ **0.150 ms** (vs 1.082 current; main 0.118) — ≤ ~1.3x main, comfortably inside A1's "≤2x main" acceptance.
- `parser-medium` ≤ 0.040 ms (main 0.032); `parser-small` ≤ 0.010 ms (main 0.008).
- Stretch (after item 4): all three ≤ 1.1x main.
- The fix must additionally not regress the object-literal fallback path; item 2 targets it (current 1,408 µs vs main 253 µs for a large object-literal config, §2.1 — currently 5.6x, unbenchmarked by the suite).

---

## 2. Evidence

### 2.1 End-to-end and stage timing (node, median of 7 batches × 1,000 parses, 300 warmup, Node v24.20.0)

End-to-end `parse()` medians (bench artifacts in parentheses — the harness reproduces the bench within ~10%):

| config | bytes | current µs/parse | main µs/parse | ratio | `JSON.parse` floor µs |
| --- | --- | --- | --- | --- | --- |
| small | 845 | 60.4 (bench 69) | 8.0 (bench 8) | 7.54x | 2.92 |
| medium | 3,702 | 268.4 (bench 281) | 31.5 (bench 32) | 8.53x | 13.22 |
| large | 14,448 | 1,046.1 (bench 1,082) | 119.1 (bench 118) | 8.78x | 53.86 |

Stage × config size, current (isolated stage loops; `parse()` full row shows the stages sum to it, ±GC):

| stage (function, line) | small µs | medium µs | large µs | share of large `parse()` |
| --- | --- | --- | --- | --- |
| A `assertNoExecutableSyntax` `:384` (scan #1 + assert regex per code region) | 11.0 | 47.0 | 171.7 | 16.6% |
| B `sanitizeCode` `:406` (scan #2 + `neutralizeExecutableConstructs` per code region + map/join) | 40.9 | 172.7 | 726.3 | 70.2% |
| C `parseObjectLiteral` `:506` (fast path = `JSON.parse`; the 3rd scan + zod rewrite only on fallback) | 3.0 | 13.0 | 53.4 | 5.2% |
| D `validateAndSanitize` `:1016` (total; normalize + sanitizeFields + top-level copy) | 5.8 | 22.3 | 84.3 | 8.1% |
| — D1 `normalizeAiGeneratedConfig` `:968` (isolated) | 0.8 | 3.9 | 15.0 | 1.4% |
| — D2 `sanitizeFields` `:897` (isolated) | 2.6 | 14.0 | 57.8 | 5.6% |
| **`parse()` full** | **59.9** | **265.7** | **1,034.9** | 100% |

Stage × config size, main (`main:…formedible-parser.ts`):

| stage | small µs | medium µs | large µs | share of large `parse()` |
| --- | --- | --- | --- | --- |
| B `sanitizeCode` `:444` (12 regex passes) | 2.9 | 11.4 | 42.7 | 36.0% |
| C `parseObjectLiteral` `:484` (`JSON.parse`) | 2.9 | 13.2 | 53.1 | 44.8% |
| D `validateAndSanitize` `:664` (top-level switch + `validateFields`) | 1.6 | 5.8 | 20.8 | 17.6% |
| **`parse()` full** | **7.8** | **31.1** | **118.4** | 100% |

Stage-list diff: current runs a stage main lacks entirely (A: the upfront executable-syntax assert) and runs its sanitize stage 17x slower than main's (726.3 vs 42.7 µs large) because it is scanner-based and runs twice. Current's D is 4x main's (84.3 vs 20.8 µs) but is only 8.1% of the problem.

Sub-probes (large config unless stated):

- `scanCodeRegions(code)` single call, isolated: **146.4 µs** (10.1 ns/char × 14,448). Runs 2× per JSON parse (assert + sanitize); a 3rd time only on the fallback (`:523`).
- `neutralizeExecutableConstructs(code)` on the whole input: **301.3 µs**. The single live pattern (bare identifiers `\b(document|window|globalThis|global|process|__proto__|constructor|prototype)\b`) alone on a 12,836-byte input: **5.5 µs** (−98.2%).
- `sanitizeCode` reassembly overhead (map + region objects + join), derived: 726.3 − 146.4 (scan) − code-region share of neutralize ≈ **280 µs** of allocation/closure cost — consistent with the 7.35% anonymous-closure samples + 2.13% GC in §2.2.
- `JSON.parse` throw on a 12,836-byte non-JSON string: **3.8 µs** — the fast-path guard adds ~0.3% to the fallback path.
- Object-literal rendering of the large config (unquoted keys, single quotes, trailing commas; 12,836 B — the format AI models emit when not JSON): current **1,407.8 µs** vs main **252.7 µs** (5.6x). Field counts verified 100/100. This path takes current's fallback (`replaceZodExpressions` `:469` + 3rd scan + `normalizeObjectLiteralSyntax` `:499` + 2nd `JSON.parse`).

### 2.2 CPU profile (current parser, large config)

`node --cpu-prof` via tsx, 2,800 parses over ~3 s (`/tmp/pd/profile-current.mts`). Top functions by self time, raw samples (3,881 ms total; the tsx loader contributes ~4.4% module-hook noise — `makeSyncRequest` 2.12%, `waitForWorker` 1.20%, `compileSourceTextModule` 0.49%). The cpuprofile reports `:1` for every parser frame because tsx does not apply source maps to profile line numbers — lines below are the true declaration lines, verified by name against the source:

| function (true file:line) | self share (raw) |
| --- | --- |
| `neutralizeExecutableConstructs` `:392` | 29.35% |
| `scanCodeRegions` `:206` | 15.51% |
| `sanitizeCode` body `:406` | 11.04% |
| region-walk closures (anon; `scanCodeRegions` `flush` `:211` / `sanitizeCode` map callback `:408`) | 7.35% |
| `assertNoExecutableSyntax` `:384` | 5.95% |
| `parseObjectLiteral` `:506` (essentially `JSON.parse`) | 5.60% |
| the 10 `neutralizeExecutableConstructs` regexes, own self time | 8.73% (sum) |
| `assertNoExecutableSyntax` regex `:189` | 0.87% |
| `sanitizeField` `:783` | 3.11% |
| (garbage collector) | 2.13% |
| `sanitizePlainConfig` `:716` | 1.26% |
| `normalizeAiGeneratedField` `:901` | 1.20% |
| `copyString`/`copyNumber`/`copyBoolean` `:698-714` | 1.20% (sum) |
| `sanitizeOptions` `:661` | 0.40% |
| `normalizeAiGeneratedConfig` `:968` | 0.17% |

Grouped: **A+B text pipeline 78.8% of raw samples** (neutralize+regexes 38.08%, scanner 15.51%, reassembly 18.39%, assert+regex 6.82%) — stage timing bounds it at 91.9% of steady-state parse time; stage D ≈ 7.0% of samples; `JSON.parse` 5.6%.

### 2.3 The pipeline is a no-op for valid JSON (basis of the fast path)

Mechanically verified (`/tmp/pd/identity.mts`): `sanitizeCode(code) === code` byte-for-byte for all three bench configs and for tricky-JSON probes containing `=>` in labels, `eval(x)` prose, `<Included>` markup, `https://…//`, apostrophes, backticks, `${…}`, `/* */` and `//` inside string values. Grammar argument: outside string literals, valid JSON admits only `{}`, `[]`, `,`, `:`, whitespace, numbers, and the literals `true/false/null`; none can match `executableSyntaxPattern` (`:189`, which needs `=>`, `function(`, `class X`, `new X(`, `eval(`/`Function(`/`setTimeout(`/`setInterval(`/`require(`/`import(`, or `<X`), nor any of the 10 neutralize patterns, nor can comments exist (JSON.parse would fail). Hence for any input where `JSON.parse(code)` succeeds: assert would pass, sanitize is identity, and `parseObjectLiteral(sanitizedCode)` returns exactly `JSON.parse(code)`. The pinned tests that look like counterexamples all pass through string regions the scanner already excludes (`formedible-parser.test.ts:123-166` — "key => value", "VAT <Included>", "e.g. eval(x)" labels preserved).

Subsumption proof for the 9 dead neutralize patterns (`:392-404` vs assert `:189`, both applied to scanner code regions, assert first at `:1286`/`:1309`): pattern 1 `(eval|Function|setTimeout|setInterval|require|import)\s*\(` ⊆ assert's explicit alternates; patterns 3, 4, 10 contain `new X(` ⊆ `\bnew\s+[A-Za-z_$][\w$]*\s*\(`; patterns 5-8 contain `=>`; pattern 9 is `\bfunction\s*\(`. Anything they could match, assert already rejected — the test at `formedible-parser.test.ts:96-105` ("rejects constructor calls instead of sanitizing them to null") pins exactly this throw-don't-neutralize contract. Only pattern 2 (bare global identifiers, `:395`) is not subsumed and remains live: it is what turns `defaultValue: document` into `defaultValue: null` before the fallback `JSON.parse`. Note assert also scans comment regions (its predicate at `:385` excludes only the three string kinds), so comment-hosted executable syntax throws too — unaffected by any plan item.

### 2.4 Fast-path prototype

`/tmp/pd/fallback.mts` re-runs the current pipeline vs `validateAndSanitize(JSON.parse(code))` (falling back to the current path on parse failure): outputs deep-equal on the large JSON config and on the object-literal config (where the fast path correctly declines — `JSON.parse` fails). Timings in §1. The prototype maps `RangeError` to the nesting error the same way `parseObjectLiteral` `:519-521` does today (the test at `formedible-parser.test.ts:364-385` pins stack-overflow inputs → `EXCEEDS_MAX_NESTING_DEPTH`).

### 2.5 Harness and reproduction

Scratch, never committed (verified: `git status` clean, §6): `/tmp/pd/` with `package.json` `{"type":"module"}` (without it tsx compiles the scratch `.ts` copies as CJS and exports collapse into `default`), containing instrumented copies `cur/` and `main/` of both parsers with the internal stage functions appended as exports, plus `harness.mts` (end-to-end), `stage.mts` (stage timing), `profile-current.mts` + `analyze-profile.mjs` (cpu-prof), `fallback.mts` (fallback path + prototype), `identity.mts` (§2.3), `details.mts` (micro-probes). Run pattern:

```sh
cd /tmp/pd
tsx harness.mts                 # end-to-end current vs main (repo's tsx: /home/didi/workspace/Formedible/node_modules/.bin/tsx)
tsx stage.mts                   # stage × config, both parsers
tsx --cpu-prof --cpu-prof-dir=/tmp/pd/prof profile-current.mts && node analyze-profile.mjs prof/current-large.cpuprofile 30
```

Current parser imported from source (`packages/formedible-parser/src/lib/formedible/formedible-parser.ts` — all `@/…` imports are type-only and erased); main imported from the baseline worktree (`../Formedible-main-baseline/…`, its `node_modules` supplies zod 4.3.6); bench configs generated by the repo's own `tests/bench/lib/scenarios/forms.ts` (`createSmallParserConfig`/`createMediumParserConfig`/`createLargeParserConfig`, pure `JSON.stringify` output at `:506`).

---

## 3. Root causes

### 3.1 RC1 — `parse` runs the assert+sanitize text pipeline unconditionally, before ever trying `JSON.parse` (`:1274-1301`)

`parse` executes `assertNoExecutableSyntax(code)` (`:1286`) → `sanitizeCode(code)` (`:1287`) → `parseObjectLiteral(sanitizedCode)` (`:1288`), and `parseObjectLiteral` itself tries `JSON.parse` first (`:508`). For pure-JSON input — every bench config and any structured-tool-output consumer — stages A+B cost 951 µs of the 1,046 µs large parse while provably transforming nothing (§2.3). The size-uniformity of the regression (+739/+768/+817%) is exactly what a per-byte constant factor over the same input produces: A+B scale linearly with input length at ~66 ns/byte combined (951 µs / 14,448 B), while main's whole parse runs at 8.2 ns/byte.

Does main share the stage? Main has a sanitize stage (single `sanitizeCode` of 12 chained regex passes, `main:…:444-478`, 42.7 µs large) but no assert stage. Current's assert is **necessary work for a guarantee main didn't have** — upfront `EXECUTABLE_INPUT` rejection instead of main's replace-with-`""` (pinned by `formedible-parser.test.ts:88-121`; main's version of the same inputs would silently neutralize). Keep the stage; the overhead is **accidental** in running it on input for which it provably cannot fire. Fix: gate it behind a failed raw `JSON.parse` (item 1).

### 3.2 RC2 — `scanCodeRegions` is a per-character JS scanner run twice per parse (`:206-311`)

The scanner walks every character (`:228-307`), classifying code/comment/single/double/template regions and building each region's text with `buffer += character` one char at a time; `sanitizeCode` then re-maps the region list and joins (`:406-416`). Cost: 146.4 µs per 14.4 KB scan (10.1 ns/char) + ~280 µs reassembly — together ~2.3x the cost of main's entire large parse. It runs twice per parse on the JSON path (assert + sanitize) and a third time on the fallback (`:523`).

Does main share the stage? No — main is regex-only. The scanner is **necessary work for correctness main didn't have**: escaped-quote/apostrophe-safe single-quote conversion (`convertSingleQuotedRegion` `:317`, pinned at `formedible-parser.test.ts:152-166` where main's blanket `(?<!\\)'`→`"` flip corrupts `"Don't"`/`'say "hi" loudly'` inputs), template-interpolation auditing (`:117-121`), and comment stripping that never touches prose inside strings (`:123-135`). Keep for the fallback path; never pay it for JSON (item 1), pay it once instead of twice on the fallback (item 2). Optional: rebuild regions with index slicing + `code.slice(start,end)` instead of char concatenation (item 5, est. 2-4x on the scan itself).

### 3.3 RC3 — 9 of 10 `neutralizeExecutableConstructs` patterns are dead by ordering (`:392-404`)

Every call site runs `assertNoExecutableSyntax` before `sanitizeCode` (`:1286-1287`, `:1309-1312`), and 9 of the 10 patterns are subsumed by the assert pattern on the same region kinds (proof in §2.3). Measured dead cost: full neutralize 301.3 µs vs 5.5 µs for the only live pattern — 98% of the function's work is unreachable-output regex passes (29.35% self + 8.73% regex samples of the whole profile). Main's near-identical pattern list (`main:…:451-476`) is its only defense and is therefore live there; in current these lines are **accidental overhead** — residue of main's design that survived the addition of the assert. Eliminate (item 3), keeping pattern 2 with a comment recording the subsumption invariant so reordering the stages can never silently resurrect the deadness assumption.

### 3.4 RC4 — stage-D per-call allocations (`:726`, `:869-886`, `:1070-1086`)

`sanitizePlainConfig` allocates a 7-element array per visited key for the `.includes` membership test (`:726`); `sanitizeField` allocates a 16-element array per field and probes all 16 nested-config slots even when absent (`:869-892` — on the large config: 100 array allocations, 1,600 probes finding 0 present configs); `validateAndSanitize` allocates 12- and 6-element arrays per top-level key (`:1070-1074`, `:1081`). With `formOptions.defaultValues` carrying 100 keys, that is ~300+ short-lived arrays per large parse on top of the region objects from RC2 — visible as 2.13% GC. Stage D total 84.3 µs vs main's 20.8 µs. The semantic work (allowed-key enforcement `:802-806`, type rejection `:808-810`, typed copies) is **necessary work main didn't do** (main copies `schema`/`formOptions`/config objects through un-sanitized, `main:…:690-695`, `:758-761`); only the allocation churn is accidental. Fix: item 4 (hoist to module-level constants, guard the 16-slot probe). Est. D → 60-70 µs.

### 3.5 A1 hypotheses checked against the profile

| A1 candidate (PERF-BENCHMARK-FOLLOW-UPS.md §A1.2) | Verdict |
| --- | --- |
| (a) fast-path pure JSON to `JSON.parse` | **Confirmed as the #1 fix** — 7.4x measured on large (§1) |
| (b) single-pass sanitize (`sanitizeField` re-walk) | Stage D exists but is only 8.1%; the real double-pass is the two `scanCodeRegions` walks (item 2) |
| (c) hoist per-call allocations (`:817-826` in A1's numbering ≈ `:812-827` here) | Real but minor (RC4, ~2-4% of parse) |
| (d) skip `enableZodParsing` work when no schema keys present | Not measurable on the parse path — `replaceZodExpressions` runs only inside the fallback (`:523`), never for JSON |
| Implicit "sanitize/validate field walk is the cost" framing | **Refuted** — `sanitizeFields`+`validateAndSanitize` ≈ 7.0% of samples; the tokenizer/scanner prelude is 78.8% |

Also refuted by inspection (no cost found, no change proposed): repeated zod schema compilation per parse (none — the parser never constructs zod schemas on these paths; `zodSentinel` is a string), double `JSON.parse` of the same payload (fallback parses two *different* strings), O(n²) `supportedFieldTypeInfo` lookups (linear `find` at `:1169` is on the `parseWithSchemaInference` path only, not `parse`).

---

## 4. Fix plan (ordered)

Scope guard for every item: edit only `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` (plus new tests in `formedible-parser.test.ts`), then sync per §5. No public signature, export, error code, or error message changes. The 29 existing tests in `formedible-parser.test.ts` must pass unmodified after every item (they are the behavior pin: UNSUPPORTED_FIELD_TYPE rejection + the 13-entry alias map at `:124-138`, fence rules at `:1145-1166`, `defaultParserConfig` semantics (maxNestingDepth 50, maxCodeLength 1e6), all statics' signatures and error shapes, nesting-depth errors, baseSchema merge semantics, structured-output round-trip, class-name options, page auto-numbering).

### Item 1 — Pure-JSON fast path in `parse` and `parseStructured` (P1, ~2-4 h)

- **Change**: at the top of the try-block in `parse` (`:1285`) and the string-candidate branch of `parseStructured` (`:1308-1312`), attempt `JSON.parse(code)` on the raw input inside its own try/catch. On success with a record result, go straight to `validateAndSanitize(parsed, options, maxNestingDepth)`; on `RangeError` map to `createMaxNestingDepthError(maxNestingDepth)` exactly as `parseObjectLiteral` does (`:519-521`); on `SyntaxError` (or a non-record success, which must fall through so `INVALID_DEFINITION` semantics stay identical) run the existing `assertNoExecutableSyntax` → `sanitizeCode` → `parseObjectLiteral` pipeline unchanged. Extract a shared `tryParseJsonFastPath(code, maxNestingDepth)` helper so both entry points and `parseStructured`'s string path share one implementation.
- **Why it is safe**: §2.3 — for input where `JSON.parse` succeeds, the skipped stages are provably identity/pass; outputs deep-equal (prototype, §2.4). Failed `JSON.parse` costs 3.8 µs on a 12.8 KB non-JSON string, i.e. +0.3% on the fallback path.
- **Files**: `formedible-parser.ts` (`:1274-1301`, `:1303-1322`, new helper near `:506`).
- **Risk**: low-medium (security ordering is the one thing to get right — see decision flag below).
- **Invariants preserved**: all rejection tests (executable syntax, fences, unsupported keys/types) unaffected — they fail `JSON.parse` and take the old path; `EXCEEDS_MAX_NESTING_DEPTH` for stack-overflow inputs (`test :364-385`) preserved by the RangeError mapping; `INVALID_DEFINITION` for non-object JSON (e.g. `"[1,2]"`) preserved by falling through; schema-inference byte-identity (inference consumes the parsed config, which is unchanged — `test :290-309`); `validateWithSuggestions`/`validateConfig` outputs unchanged (they delegate to `parse`/`validateAndSanitize`).
- **Acceptance test**: new differential test in `formedible-parser.test.ts` — for a corpus of valid-JSON configs (the three bench shapes plus tricky strings from §2.3: `=>`/`eval(`/`<X`/apostrophes/backticks/`${}`/comment-markers inside values, `__proto__` keys, deeply-nested-but-legal defaultValue), assert `parse(code)` deep-equals `validateAndSanitize(JSON.parse(code), undefined, 50)`; plus all 29 existing tests green; plus a property-style loop over ~200 generated configs (seeded) doing the same comparison.
- **Expected speedup**: measured prototype — large 1,028→139 µs (7.4x), medium 268→36 µs (7.5x), small 60→8.8 µs (6.8x). Bench projection: 1.082→~0.145 ms large (≤1.3x main).
- **DECISION FLAG (behavior-surface, recommend shipping)**: this reorders the parser so the native `JSON.parse` runs before the executable-syntax assert. For valid JSON the assert can never fire (§2.3 grammar proof), so no input that today throws `EXECUTABLE_INPUT` will stop throwing — the differential corpus plus the existing rejection tests are the mechanical backstop. Recommendation: ship, and record the ordering invariant as a comment at the helper ("assert runs on every input that fails raw JSON.parse; JSON grammar forecloses executable syntax outside strings").

### Item 2 — Scan once on the fallback path: merge assert + sanitize over one region walk (P2, ~2 h)

- **Change**: introduce `scanCodeRegions(code)` → regions (single call) in the fallback path, then (a) assert over the region list (current logic `:385`), (b) map the same list through the sanitize transform (`:406-416`). `assertNoExecutableSyntax` and `sanitizeCode` keep their exact signatures/logic but gain internal overloads taking pre-computed regions so `parseObjectLiteral`'s fallback (`:523`) can also reuse them where the same string is scanned. Public behavior identical: same throws, same output string.
- **Files**: `formedible-parser.ts` `:384-416`, `:1285-1288`, `:1308-1312`.
- **Risk**: low. **Invariants**: same region classification (untouched scanner), same assert predicate, same sanitize mapping — output string byte-identical by construction (pure refactor of who iterates the region array).
- **Acceptance test**: existing object-literal/zod-expression tests (`test :22-86`) green; new test asserting `parse` output on a mixed corpus (object literals with single quotes, trailing commas, `z.object()` values, comments, `defaultValue: document`) is byte-identical before/after the refactor (golden snapshots captured pre-change in the fix phase).
- **Expected speedup** (fallback path only — not bench-covered): one scan instead of two saves ~146 µs plus the assert's regex pass (~25 µs of its 171.7) per non-JSON parse; combined with item 3, estimated large object-literal 1,408 → ~810-950 µs (state as estimate; re-measure with the §2.5 harness in the fix phase).

### Item 3 — Delete the 9 dead patterns from `neutralizeExecutableConstructs` (P2, ~1 h)

- **Change**: reduce `:392-404` to the single live replacement (bare global identifiers `:395`) plus a comment stating the subsumption proof (§2.3) and the ordering precondition (assert always precedes sanitize on every call site). Optionally rename to reflect its now-narrow contract.
- **Files**: `formedible-parser.ts` `:392-404`.
- **Risk**: low — provable unreachable-output; the rejection corpus (`test :88-121`) still passes because those inputs throw in the assert before neutralize is reached.
- **Invariants**: rejection (not neutralization) of executable syntax — pinned by `test :96-105`; string-value preservation — pinned by `test :123-150`.
- **Acceptance test**: all 29 tests; plus a new test that `defaultValue: document` in an object literal still parses to `defaultValue: null` (the one behavior pattern 2 carries).
- **Expected speedup**: neutralize 301.3 → ~5.5 µs on large (−98%); folded into item 2's fallback estimate; on the JSON path it is moot after item 1.

### Item 4 — Hoist stage-D allocations and guard the 16-slot probe (P2, ~2 h)

- **Change**: hoist the three literal arrays to module-level constants — `EXECUTABLE_CONFIG_KEYS` (Set, from `:726`), `NESTED_CONFIG_KEYS` (frozen array, from `:869-886`), `STRING_TOP_LEVEL_KEYS` (`:1070-1074`) and `BOOLEAN_TOP_LEVEL_KEYS` (`:1081`); in `sanitizeField`, skip the 16-slot loop entirely when the field has no nested-config key present (single `Object.keys` pass already exists at `:802` — reuse its key list to drive both the allowed-key check and the nested-config dispatch). Mirror the `Set.has` membership style already used by `allowedFieldKeys`/`allowedTopLevelKeys` (`:143`, `:89`).
- **Files**: `formedible-parser.ts` `:716-744`, `:783-895`, `:1016-1129`.
- **Risk**: low. **Invariants**: key-rejection behavior identical (`UNSUPPORTED_CONFIG_KEY`/`UNSUPPORTED_FIELD_KEY`/`UNSUPPORTED_TOP_LEVEL_KEY` on exactly the same inputs — membership against the same sets, just allocated once); output objects identical.
- **Acceptance test**: all 29 tests (esp. `:197-202` unsupported keys, `:253-288` config preservation); no behavior-diff on the differential corpus from item 1.
- **Expected speedup**: est. stage D 84.3 → 60-70 µs (GC 2.13% shrinks); large total after items 1+4 ≈ 115-125 µs ≈ main parity. Re-measure; this is the stretch item and can be cut without endangering the primary target.

### Item 5 (optional, P3) — Slice-based region building in `scanCodeRegions`

Replace `buffer += character` with index tracking + `code.slice(start, end)` per region (`:206-311`). Only worth doing if, after items 1-3, the fallback path still matters (re-measure with §2.5); est. 2-4x on the scan itself. Same acceptance as item 2 (golden-snapshot byte-identity). Defer unless the fix-phase re-measure shows fallback ≥ 2x main after items 2+3.

### Non-items (explicitly not planned)

A8 parser/runtime type alignment, A9 `fieldTypeValidation` semantics + `date` zod hint: correctness/behavior items that touch the same file but change observable behavior — sequence them separately (they are A8/A9 in PERF-BENCHMARK-FOLLOW-UPS.md); nothing in items 1-5 conflicts with them (the alias map `:124-138`, the unconditional type check `:808-810`, and `supportedFieldTypeInfo` `:62-87` are untouched). C3 parser-run isolation is harness work, orthogonal.

---

## 5. Verification protocol for the fix phase

```sh
# 1. Parser behavior (29 tests + the new differential/golden tests added by items 1-4)
pnpm --filter formedible-parser run test

# 2. Types, all packages (7/7)
pnpm run check-types

# 3. Sync the one consumer of the parser source (route: packages/formedible-parser -> packages/ui/src/components via registry.json targets @ui/formedible/lib/*)
node scripts/quick-sync.js
git status --short        # expect exactly packages/ui/src/components/formedible/lib/{formedible-parser,parser-config-schema,parser-types}.ts
node scripts/quick-sync.js && git status --short   # idempotency: second run changes nothing

# 4. Registry payload regen + freshness (embedded files[].content must equal disk for the 3 registry files)
pnpm --filter formedible-parser run build:registry
# freshness check: for every public/r/formedible-parser.json files[] entry, files[].content === packages/formedible-parser/<path> (same 23/23-style script as BENCH-FINDINGS [P0.3-fix2]; offline, no shadcn invocation)

# 5. Bench, before/after — parser-only runs are the order-stable mode (BENCH-FINDINGS [P3.1] medium: parser-only reruns swing <5%; mixed subsets swing up to 83%); do NOT pass a bare `--` to pnpm ([P3.2-val] low)
pnpm run bench --only parser-small,parser-medium,parser-large --runs 5
pnpm run bench:baseline --only parser-small,parser-medium,parser-large --runs 5   # needs the main worktree; bench:baseline:setup if absent
pnpm run bench:compare       # parser rows must show current ≤1.3x main (primary target: large ≤0.150 ms)
pnpm run bench:regress       # gate against the reference snapshot must stay green

# 6. Fallback-path re-measure (not covered by the bench suite): re-run the /tmp/pd harness pattern from §2.5 against the fixed source — object-literal large config target ≤950 µs after item 2+3 (est), and fast-path differential corpus still deep-equal
```

Exit criteria: steps 1-2 green, sync idempotent (step 3), registry fresh (step 4), bench parser rows ≤1.3x main with no new regression elsewhere (step 5), fallback re-measure recorded (step 6). If the residual gap after item 1 is >1.3x main on any row, profile again before touching item 4 (per A1's profile-first rule).

---

## 6. Non-goals

- No public API changes: signatures, exports, error codes, error messages, and result shapes of every static (`parse`, `parseStructured`, `parseAiOutput`, `isValidFieldType`, `getSupportedFieldTypes`, `getSupportedFieldTypeInfo`, `validateConfig`, `parseWithSchemaInference`, `mergeSchemas`, `validateWithSuggestions`) are frozen.
- No security weakening: upfront executable-syntax rejection (never neutralize-then-parse), allowed-key/allowed-type enforcement, `__proto__` guards (`:798`, `:602`), nesting-depth caps, and `maxCodeLength` all keep their current behavior on every input class. The fast path skips work only where the JSON grammar makes violations impossible (§2.3).
- No test weakening: the 29 existing tests pass unmodified; new tests only add (differential equivalence, golden snapshots, `defaultValue: document`).
- No schema-inference output changes: inference results stay byte-identical for identical inputs (`test :290-309`).
- No behavior items bundled: A8 type alignment and A9 `fieldTypeValidation`/date-hint fixes are separate plan items; no zod version or dependency changes; no bench-harness changes (C3 is its own item).

---

*Provenance: phase PD of the parser-perf orchestration; every number measured 2026-08-31 on branch `parser-perf` (commit `d181806`) with Node v24.20.0 via the §2.5 harness; bench reference numbers from `tests/bench/results/runs/2026-08-31T23-45-03.810Z-main.json` / `2026-09-01T00-04-31.991Z-current.json` (N=25). Scratch artifacts live in /tmp/pd only; `git status` on the branch shows only this file and the BENCH-FINDINGS.md append as working-tree changes.*
