# Perf Benchmark Follow-Ups — Prioritized Improvement Plan

Phase 5 deliverable (branch `re-codex`, 2026-08-31). Source: every entry in `BENCH-FINDINGS.md` (prefixes `[P0.*]`, `[PS*]`, `[P-rev]`, `[P1*]`, `[P2*]`, `[P3.*]`, `[P4*]`), cross-checked against the current tree at commit `e1d5b46`. All file paths and line references below were re-verified against the working tree unless marked as a `main`-branch reference.

Effort scale: **S** ≤ half day, **M** 1–2 days, **L** 3+ days. Priority: **P1** do next, **P2** schedule, **P3** opportunistic.

## Executive summary — what the benchmark run proved

All numbers from the final artifacts (`tests/bench/results/runs/2026-09-01T00-04-31.991Z-current.json` vs `2026-08-31T23-45-03.810Z-main.json`, N=25, real Chromium via agent-browser; delta = current relative to main, negative = current faster):

| Signal | Result | Verdict |
| --- | --- | --- |
| Typing (`ms-per-keystroke`, 10/50/100 fields) | −32.2% / −40.8% / −42.1% | Current is 32–42% faster — real, size-scaled win |
| Submit (`submit-round-trip-ms`, 10/50/100) | −22.4% / −25.9% / −47.9% | Current is 22–48% faster |
| Parser (`ms-per-parse`, small/medium/large) | +739% / +768% / +817% (~8x) | Current is ~8x slower per parse — biggest actionable perf signal |
| Mount (`mount-ms`, 10/50/100) | +1.2% / +18.8% / +8.7% | mount-50 regression worth a profile; 10 and 100 near parity |
| pageswitch / tabswitch / array-50 | −0.3% / 0.0% / −1.3% | Parity (all ~16.6 ms/op, frame-settled loops) |
| Memory (`memory-500` heap) | informational | Parity in order of magnitude; sign flips are API-inherent ([P3.1-val] low), never gated |
| Bundle (`bundle-minimal`) | 541,538 bytes raw / 166,291 gzip | Baseline recorded, current-only |

The TanStack modernization (react-form 1.29 → 1.33.5, `@tanstack/ai` 0.16 → 0.52) paid for itself in the update path (typing/submit 22–48% faster). The costs are one concentrated hot-path regression (parser ~8x — still sub-millisecond absolute: 0.28 ms vs 0.032 ms per medium parse) and one mid-size mount regression. The dogfooding side-run (building the skill, the bench adapters, and the fixtures against the skill's docs) surfaced a second, non-perf class of issues: silently-dead config keys, docs pages contradicting source, and missing agent-facing contracts — those are cheaper to fix than the perf work and improve every future consumer and AI-agent interaction.

**Top 3 actions by impact:**

1. **A1 — Profile and fix the parser ~8x per-parse regression** (P1, M). The only large, actionable perf regression; concentrated in one file's sanitize/normalize path.
2. **A2 — Registry payload freshness guard + turbo wiring + version-bounded `@tanstack/ai*` deps** (P1, M). The only finding class that shipped broken code to real consumers (pre-migration code + unversioned deps resolving 0.52); a mechanical freshness test makes recurrence impossible.
3. **B1 — Publish the rendered-DOM contract as a skill reference and docs page** (P1, S). The single highest-leverage dogfooding harvest: every automation agent (bench, E2E, consumer agents) currently reverse-engineers selectors from source; this also anchors the docs-site/skill single-source-of-truth decision (B7).

---

## Section A — Lib fixes

Ordered by priority within each band.

### A1. Parser ~8x per-parse regression vs main — profile first, then fix — **P1, M (L if the sanitize path needs redesign)**

- **Problem**: `parser-small/medium/large` medians are +739%/+768%/+817% vs main (0.069/0.281/1.082 ms vs 0.008/0.032/0.118 ms per parse). Current's parser rejects-and-rebuilds; main's parser did a lighter regex scrub + per-key switch (`git show main:packages/formedible-parser/src/lib/formedible/formedible-parser.ts`, `sanitizeCode` at :444 replaces executable syntax with `""`, `validateFields` is a top-level switch). Finding refs: the compare table above; parser measurement caveats [P1-val] low, [P3.1] medium, [P3.1-val] low (order/load sensitivity — compare only order-stable full runs).
- **Proposed fix**:
  1. Profile before touching code: `pnpm run bench --only parser-medium` and `pnpm run bench:baseline --only parser-medium` (note: do not pass `--` to pnpm — [P3.2-val] low), plus a CPU profile of `FormedibleParser.parse` on the medium fixture (`node --cpu-prof` under tsx, or a small instrumented harness) to attribute cost across `parseObjectLiteral` → `normalizeAiGeneratedConfig` → `validateAndSanitize` → `sanitizeFields`/`sanitizeField` (recursive per-key rebuild with allowed-key-set membership, ~20 nested config sanitizers per field).
  2. Likely wins, validated by the profile, in order of safety: (a) fast-path pure-JSON input straight to `JSON.parse` when the text starts with `{` and contains no object-literal-only syntax (skipping the object-literal tokenizer); (b) single-pass sanitize — `sanitizeField` currently re-walks each field's keys for membership and then re-copies known keys; merge into one pass; (c) hoist per-call allocations (error-message closures, key arrays at `packages/formedible-parser/src/lib/formedible/formedible-parser.ts:817-826`) to module constants; (d) skip `enableZodParsing` work when no schema keys are present in the input.
  3. Do NOT weaken security: executable-syntax rejection (upfront throw, not main's replace-with-`""`), allowed-key/allowed-type enforcement, `__proto__` guards, nesting-depth caps must all keep their current behavior. The extra strictness is plausibly worth some of the 8x; the goal is to remove the *unattended* overhead, then document whatever gap remains as the price of the stricter parser.
- **Files**: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` (`normalizeAiGeneratedConfig` :968, `validateAndSanitize` :1016, `sanitizeField` :783, `sanitizeFields` :897, `parse` entry :1271+); bench harness `tests/bench/lib/scenarios/forms.ts` (parser generators) and `tests/bench/lib/run.ts` / `run-main.ts` for re-measurement.
- **Acceptance test**: existing parser test suite green (`packages/formedible-parser` tests — security/rejection cases unchanged); re-run `pnpm run bench:full` + `pnpm run bench:baseline` and `pnpm run bench:compare`: parser-medium delta shrinks to ≤2x main, or the residual gap is profiled and recorded in this file's successor log with the security rationale; `pnpm run check-types` 7/7.
- **Risk**: medium. Sanitization is the security surface; any fast-path must be proven equivalent on the rejection test corpus. Budget L if the profile says the object-literal tokenizer itself is the cost (a rewrite would need its own phase).

### A2. Registry payload freshness: wire `build:registry` + freshness test + version-bounded deps — **P1, M**

- **Problem**: `build:registry` (`shadcn build`) exists in `packages/ai-builder/package.json:10` and `packages/formedible-parser/package.json:10` but is absent from `turbo.json`'s task graph, so `pnpm run build` never regenerates `packages/*/public/r/*.json`. During Phase 0.3 the payload silently embedded pre-migration 0.16-era code while declaring unversioned `@tanstack/ai*` deps that resolve to 0.52 — a consumer installing from formedible.dev would have run the exact silently-dropped-`temperature` bug the migration existed to fix. It took two failed validations to catch ([P0.3-val2] FAIL, [P0.3-fix2] regen). Finding refs: [P0.3-val2], [P0.3-fix2] follow-ups, [P0.3-val3] endorsement.
- **Proposed fix** (all three parts):
  1. Add a `build:registry` turbo task for the five registry-owning packages (`packages/formedible`, `packages/formedible-parser`, `packages/ai-builder`, `packages/ai-picker`, `packages/builder` — each has a `registry.json`), with `outputs: ["public/r/**"]`, wired into the release path (`dependsOn` their `build`), so payloads regenerate with source.
  2. Add a registry-freshness test (offline, compare-only): for every `public/r/*.json`, parse `files[]` and assert each `content` equals the on-disk file at the recorded path byte-for-byte — the exact 23/23 SAME/DRIFT script proven in [P0.3-fix2]. It must NOT invoke `shadcn build` (which fetches `registryDependencies` over the network — [P0.3-val2] context).
  3. Version-bound the `@tanstack/ai*` entries in `packages/ai-builder/registry.json:13-16` (`@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openai`, `@tanstack/ai-openrouter`) to the validated majors (`^0.52` / per-provider `^0.18` / `^0.19` / `^0.22` as of the migration) so a published item can never resolve an untested major.
- **Files**: `turbo.json` (tasks block), `packages/ai-builder/registry.json`, plus a new test file in the package's existing test layout (e.g. `packages/ai-builder/src/registry-freshness.test.ts` following that package's test conventions; same for `packages/formedible-parser` if its payload is covered by the same script, run once over all five packages from a shared script under `tests/`).
- **Acceptance test**: freshness test fails when any embedded `files[].content` diverges from disk (prove by temporarily editing a src file in a scratch run); `pnpm run build` regenerates payloads; `pnpm run check-types` 7/7; `pnpm run build:registry` for ai-builder leaves the tree clean (23/23 SAME).
- **Risk**: low. Regeneration changes `public/r/*.json` diffs (5 JSON lines in the 0.3 incident) — expected tool output. Ensure CI has network for the regen path but the freshness test alone gates PRs.

### A3. Type the runtime-read config keys; resolve the dead ones (`showTooltip`, `defaultCollapsed`, array `objectConfig`) — **P1, S/M**

- **Problem**: (a) `array-field.tsx` reads `arrayConfig.itemLabel` (:67), `.addButtonLabel` (:68), `.removeButtonLabel` (:69), `.itemPlaceholder` (:45) but `FormedibleArrayConfig` (`packages/formedible/src/lib/formedible/types.ts:100-108`) does not declare them — they type-check only through the `[customProp: string]: unknown` index signature, so a typo (`addItemLabel`) fails silently. (b) `sliderConfig.showTooltip` is set by examples (`apps/web/src/features/docs/compatibility-examples.tsx:504`, `tests/compatibility-examples/core-examples.ts:300`) but neither typed in `FormedibleSliderConfig` nor read by `slider-field.tsx` — dead key in shipped examples. (c) `FormedibleArrayObjectConfig.defaultCollapsed` (types.ts:74) is read nowhere, while the runtime keys the array renderer actually consumes are only `objectConfig.fields/layout/columns` (`array-field.tsx:108-110`); `collapsible`/`showCard` are consumed only by `object-field.tsx`. Finding refs: [PS] medium (slider), [PS] medium (array keys), [PS-val] medium (array objectConfig), [PS-fix] (3).
- **Proposed fix**:
  1. Add `itemLabel?`, `addButtonLabel?`, `removeButtonLabel?`, `itemPlaceholder?` to `FormedibleArrayConfig` (string, optional — runtime defaults already exist at the read sites).
  2. `showTooltip`: either implement (render a value tooltip on the shadcn Slider thumb — check `packages/ui` slider surface first) or remove from both examples. Default to removing unless a trivial implementation exists; an unconsumed key in official examples is the trap, not the missing feature.
  3. `defaultCollapsed`: either wire it (initial expanded state in `object-field.tsx`, one `useState` initializer) or delete it from `FormedibleArrayObjectConfig`/`FormedibleObjectConfig`. Prefer wiring in `object-field.tsx` (it already implements `collapsible` + `defaultExpanded`), and document that arrays ignore it.
  4. Follow the formedible workflow exactly: fix in `packages/formedible/src/` → `pnpm run build:pkg` → `node scripts/quick-sync.js` → `pnpm run check-types` (all packages).
- **Files**: `packages/formedible/src/lib/formedible/types.ts`, `packages/formedible/src/components/formedible/fields/array-field.tsx` (only if read sites need the typed imports), `packages/formedible/src/components/formedible/fields/slider-field.tsx` (only if implementing), `packages/formedible/src/components/formedible/fields/object-field.tsx` (if wiring `defaultCollapsed`), `apps/web/src/features/docs/compatibility-examples.tsx`, `tests/compatibility-examples/core-examples.ts`.
- **Acceptance test**: every option key used by `compatibility-examples.tsx` and the skill examples resolves to a named key on its nested config type; a jsdom test asserting the four array labels reach the rendered DOM (`aria-label="Remove 1"`, add-button text) exists or already covers it; `pnpm run check-types` green after quick-sync.
- **Risk**: low. Typing the keys is additive; deleting `defaultCollapsed` is technically breaking only for consumers who set it (it never did anything — safe to remove with a release note).

### A4. mount-50 regression (+18.8%) — profile the mount path — **P2, M**

- **Problem**: `mount-50` current 9.805 ms vs main 8.25 ms (+18.8%); mount-10 parity (+1.2%), mount-100 +8.7%. The regression scales with field count but not linearly, and typing on the same forms is 32–42% *faster* — so the cost is mount-path-specific (initial field normalization/adoption), not per-keystroke state handling. Finding refs: compare table; harness context [P-rev] (browser medium), [P2] high (main-side submit lifecycle divergence — also read the main `submit-*` artifact divergence notes before profiling so main-side workarounds are not mistaken for lib behavior).
- **Proposed fix**: profile first with the existing tooling — `react renders start/stop --json` (mount counts) and `profiler start/stop` on the mount-50 fixture page (`tests/bench/fixtures/current-consumer/`, `?scenario=mount-50`, served via the bench driver). Candidate hot spots in `packages/formedible/src/hooks/use-formedible.tsx`: initial field normalization pass, defaultValues adoption gate, dynamic-text/`resolveFieldHelp` resolution during first render, section/tab/page grouping in `renderFields` (:738+). Then apply the cheapest measured win; if no single cause emerges and the residual is ≤10%, record it as accepted cost with the profile attached.
- **Files**: `packages/formedible/src/hooks/use-formedible.tsx` (render/normalize path), `packages/formedible/src/components/formedible/fields/field-wrapper.tsx` (per-field mount work), bench fixture `tests/bench/fixtures/current-consumer/main.tsx` (mount scenario only if instrumentation needs a hook).
- **Acceptance test**: re-run `pnpm run bench:full` + `pnpm run bench:compare`: `mount-50/mount-ms` delta ≤10% vs main, or a documented accepted-cost note; typing-50 and submit-50 deltas do not regress (the existing wins must survive — `pnpm run bench:regress` exit 0 against the updated reference).
- **Risk**: medium — the mount path is shared with the typing path; guard every change with the full compare run, not just mount rows.

### A5. Anthropic adapter double-emits thinking deltas — **P2, S**

- **Problem**: `@tanstack/ai-anthropic` 0.18.3 (and 0.8.8 before it) yields TWO chunks per `thinking_delta`: a `REASONING_MESSAGE_CONTENT` with the delta, then a `STEP_FINISHED` carrying the SAME delta. `toThinkingEvent` (`packages/ai-builder/src/lib/formedible/ai-generation.ts:135-148`) maps both to `thinking-delta`, so `accumulateEvent` (:249-252) appends every thinking token twice on real Anthropic streams. Behavior tests never caught it because their fakes use distinct content for the two chunk types. UNRESOLVED through the migration. Finding ref: [P0.3] low (explicitly deferred as a behavior change).
- **Proposed fix**: in the accumulator (or the normalizer, but the accumulator is where stream state lives): drop `STEP_FINISHED`-sourced thinking deltas whenever a `REASONING_MESSAGE_CONTENT` (or `THINKING_TEXT_MESSAGE_CONTENT`) chunk has been seen for the current run; keep the `STEP_FINISHED` branch as the fallback source when no reasoning-content chunks preceded it (a provider that only emits STEP_FINISHED still works). Update the fake stream in `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts` (~:865-866) to use IDENTICAL delta strings for the two chunk types — that is the regression test.
- **Files**: `packages/ai-builder/src/lib/formedible/ai-generation.ts` (`toThinkingEvent` :135-148, `accumulateEvent` :240-265), `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts` (fake stream + new assertion); then `node scripts/quick-sync.js` for the `packages/ui` copy.
- **Acceptance test**: new test — a stream emitting N reasoning chunks each followed by a STEP_FINISHED with the same delta accumulates exactly N deltas (`thinkingOutput.text` has no doubling); existing ai-builder suite green (91 tests at last run); `pnpm run check-types` 7/7.
- **Risk**: low-medium — depends on adapter emission order; the "reasoning-stream-active" guard must reset per run, not per message, or multi-message streams could lose late thinking.

### A6. tabs+pages mixed config renders dead page navigation — **P2, S**

- **Problem**: When both tabs and pages are configured, field rendering filters by tab only (`use-formedible.tsx:738-743`) but `FormNavigation` renders whenever `hasConfiguredPages` (:1036, derived at :350-351), so the user sees the tab bar AND Previous/Next/Submit; page clicks change `currentPage` without changing the visible fields. The skill documents this as a "configure one, not both" gotcha (SKILL.md:91) — but the lib silently producing a broken UI is the real bug. Finding refs: [PS-val] high, [PS-fix] (1).
- **Proposed fix** (two-tier): (a) dev-mode `console.warn` once per hook instance when `hasConfiguredTabs && hasConfiguredPages` ("tab filtering wins; page navigation is inert — configure one"), matching the repo's console-logging error convention; (b) optionally stop rendering `FormNavigation` when `hasConfiguredTabs` is true (behavior change — hide the inert nav). Ship (a) now; treat (b) as a opt-in behavior change pending the versioning story (A10/B7).
- **Files**: `packages/formedible/src/hooks/use-formedible.tsx` (:350-351 flags, ~:1036 render site); tests under `tests/formedible/` (jsdom suites there already cover hook behavior).
- **Acceptance test**: jsdom test — a mixed config logs the warning (spy on console.warn) and still renders fields by tab; a tabs-only config renders no `FormNavigation`; `pnpm run build:pkg` + quick-sync + `pnpm run check-types`.
- **Risk**: low for (a); (b) changes rendering for existing mixed configs — needs a release note and skill update (SKILL.md:91 gotcha would flip to "page navigation is hidden when tabs are configured").

### A7. Deprecated `z.string().email()` in docs examples (zod v4) — **P2, S**

- **Problem**: The repo pins zod 4.3.6, where the string-method form is deprecated in favor of top-level `z.email()`. Four live example sites still use it. Finding ref: [P1] low.
- **Proposed fix**: replace `z.string().email('...')` with `z.email('...')` at `skills/formedible/SKILL.md:42`, `skills/formedible/references/validation.md:48` (skill side tracked in B3), `apps/web/src/routes/docs/validation.tsx:163`, `apps/web/src/routes/docs/getting-started.tsx:51`. Sweep for any other `.email(` in `apps/web/src` examples in the same pass.
- **Files**: as listed.
- **Acceptance test**: `grep -rn "\.email(" apps/web/src skills/formedible` returns only `z.email(` forms; docs still build (`pnpm run build:web`).
- **Risk**: none — both forms work; the v4 form removes deprecation warnings from copied code.

### A8. Parser/runtime field-type alignment — **P3, S**

- **Problem**: The parser's `supportedFieldTypes` lacks `combobox` and `multiCombobox` (no alias maps to them), and aliases `multicombobox`/`maskedInput` are rejected with `UNSUPPORTED_FIELD_TYPE` even though the runtime normalizes them; color canonicalization is inverted (parser canonical type `colorPicker` vs runtime `color`). Generated configs using runtime types are rejected. Finding refs: [PS-val] medium, [PS-fix] (2).
- **Proposed fix**: add `combobox`/`multiCombobox` to `supportedFieldTypes` + the `multicombobox`/`maskedInput` aliases to `fieldTypeAliases` (`packages/formedible-parser/src/lib/formedible/formedible-parser.ts:124-137` alias map, supported set nearby), pick one color canonical (align parser to runtime `color`, keeping `colorPicker`/`color-picker` as aliases) and re-run the alias/sanitization tests. Update `references/parser-and-ai.md:55-56` to match.
- **Files**: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`, parser tests, `skills/formedible/references/parser-and-ai.md`.
- **Acceptance test**: parser accepts and normalizes every type the skill's field-type list (SKILL.md:85) names; rejection tests updated to the remaining truly-unsupported strings; `pnpm run check-types` green.
- **Risk**: low — additive accepted types; changing the color canonical touches generated-output shape (verify `sanitizeField` output type renders through `field-registry.tsx`).

### A9. Parser config semantics + wrong zod hint for `date` — **P3, S**

- **Problem**: Two adjacent source observations logged in [PS-fix] and confirmed by [PS-val2]: (a) `ParserConfig.fieldTypeValidation` only changes `generateSystemPrompt` wording — `sanitizeField`'s type rejection (:808-810) is unconditional, so the config option is misleading; (b) `supportedFieldTypeInfo` suggests `z.string().datetime()` for `date` fields while the runtime stores a `Date` object (`date-field.tsx:66-75`), so following the hint produces schemas that break the moment a user picks a date.
- **Proposed fix**: (a) either make `fieldTypeValidation: false` actually allow unvalidated types (store them and let the runtime's type fallback handle unknowns) or remove the option and keep the unconditional check — prefer honoring the flag, it is documented in the skill (parser-and-ai.md:60); (b) change the `date` schema hint to `z.date()` / `z.coerce.date()` to match the documented value contract (fields.md date row).
- **Files**: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` (`supportedFieldTypeInfo` ~:73, `sanitizeField` :808), `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts` (`generateSystemPrompt`).
- **Acceptance test**: parser tests covering `fieldTypeValidation` both ways; the system prompt and hints snapshot updated; skill `parser-and-ai.md` line about `fieldTypeValidation` verified against the new behavior.
- **Risk**: low; (a) honoring the flag relaxes validation when explicitly disabled — document it as trust-the-input mode.

### A10. Narrow the `[customProp: string]` passthrough — **P3, M**

- **Problem**: `FormedibleFieldConfig`, every nested config object, `UseFormedibleOptions`, and the analytics/persistence configs end with `[customProp: string]: unknown`, so misspelled or unsupported keys compile silently and no-op. Root cause of A3's findings and the class the skill's verification bar works around. Finding ref: [PS] low.
- **Proposed fix**: staged narrowing — (1) remove the index signature from the nested config types where nothing reads custom props (`FormedibleArrayConfig`, `FormedibleSliderConfig`, `FormedibleArrayObjectConfig`, textareaConfig, etc. — audit each renderer for `[key]` passthrough first, e.g. field-level spread into field components); (2) keep it on `FormedibleFieldConfig` itself, where `customProp` is a documented escape hatch for custom components (fields.md custom rendering). This makes excess keys on nested configs a compile error while preserving the component-passthrough story.
- **Files**: `packages/formedible/src/lib/formedible/types.ts` (index signatures at :48, :79, :97, :107, :168, :341, :408, :453, :461, :469, :475, :489, :542, :599 and the rest — each removal individually audited).
- **Acceptance test**: `pnpm run check-types` catches a deliberately misspelled nested key in a fixture config (add a negative test); all existing configs across `apps/web`, `tests/`, and examples compile (they are the real corpus); build:pkg + quick-sync + check-types.
- **Risk**: medium-high for consumers who (silently) relied on passthrough into renderers — which is exactly why it is P3 and should land behind the version-signal work (B7) with a release note. Sequence after A3.

---

## Section B — Skill & agent-docs updates (the dogfooding harvest)

### B1. Rendered-DOM contract + DOM-drivers reference — **P1, S**

- **Problem**: The skill covers configuration only; anything driving the rendered form (bench adapters, E2E, automation agents) needs the DOM hooks, which are discoverable only by reading layout/field source. The bench adapter had to reverse-engineer: `data-tabs-trigger="true"` (`packages/formedible/src/components/formedible/layout/form-tabs.tsx:33`), `data-formedible-array-field="<name>"` (`fields/array-field.tsx:104`), `data-formedible-array-item="<path>"` (:113), `data-formedible-section`, selects rendering a `button[name=...]` trigger instead of a native `<select>` (`fields/select-field.tsx:13`), radio groups sharing one `name` across inputs (`fields/radio-field.tsx:15`), remove/move buttons addressed by `aria-label` (`Remove N` / `Move Item N up|down`, array-field.tsx:119-127), and submit via `form.requestSubmit()`. Finding refs: [P1] medium (skill gap), [P2] low (main's selectors differ — plain radix triggers, `title=`-matched remove buttons), [P3.2] low (CDP `keyboard type` dispatches beforeinput/textInput/input, not keydown/keyup).
- **Proposed fix**: new reference `skills/formedible/references/dom-contract.md` (preferred over growing fields.md — it is a distinct concern with a distinct audience) with two sections: (1) **DOM contract** — the data-* attributes, name-carrying elements per field type (which types render a named control and which do not), aria-label conventions, form element and submit interception; (2) **Driving the rendered form** — counting fields by distinct `[name]` inside the form, clicking tabs by configured order via `[data-tabs-trigger]`, array add/remove by text/aria-label, submit with `requestSubmit()`, and a note that synthetic `input` events work for typing while real-keyboard automation may dispatch a different event mix. Add a branch pointer in `SKILL.md`'s "Branch references" list. Version-stamp the contract against the same commit convention as SKILL.md:10.
- **Files**: new `skills/formedible/references/dom-contract.md`, `skills/formedible/SKILL.md` (branch list).
- **Acceptance test**: every selector stated in the reference greps to its source line in `packages/formedible/src/components/formedible/`; the bench adapter (`tests/bench/lib/harness-protocol.ts` driver docs) and `tests/e2e/` helpers are cross-checked so the three agree; a validator sweep confirms no invented attributes (same bar as [PS-fix]).
- **Risk**: none — documentation. The one trap is drift; the acceptance grep keeps it honest, and B7's single-source plan should route the docs-site copy through this file.

### B2. Docs-site accuracy fixes (three verified false claims) — **P1, S**

- **Problem**: (a) `apps/web/src/routes/docs/api.tsx:184,218-219` claims `collapseLabel`/`expandLabel` are never read by the hook — they are (collapsible-section toggle labels, `use-formedible.tsx` CollapsibleSection). (b) `apps/web/src/routes/docs/api.tsx:343` says `onFormComplete` "Runs before formOptions.onSubmit" — source order is consumer `onSubmit` awaited first, then completion/performance analytics (consumer errors skip completion tracking). (c) `packages/formedible/README.md:84` says `fields` and `formOptions.defaultValues` are "required by the type" — both are optional (`types.ts` `fields?`, `defaultValues?`). Finding refs: [PS] high ×2, [PS] low.
- **Proposed fix**: correct the three sites; align the analytics snippet in `apps/web/src/routes/docs/analytics.tsx` (page/submit tracking example) with the real order; state the real optionality in the README.
- **Files**: `apps/web/src/routes/docs/api.tsx`, `apps/web/src/routes/docs/analytics.tsx`, `packages/formedible/README.md`.
- **Acceptance test**: claims re-verified against `use-formedible.tsx` and `types.ts`; `pnpm run build:web` green.
- **Risk**: none.

### B3. zod v4 examples in the skill — **P1, S**

- **Problem**: `skills/formedible/SKILL.md:42` and `references/validation.md:48` use the deprecated `z.string().email()`; consumers copying the skill inherit deprecation warnings under zod 4.3.6. Finding ref: [P1] low.
- **Proposed fix**: switch both to `z.email()`; sweep the other references for deprecated zod v3 forms in the same pass.
- **Files**: `skills/formedible/SKILL.md`, `skills/formedible/references/validation.md`.
- **Acceptance test**: `grep -rn "\.email(" skills/formedible` clean; examples still typecheck conceptually against zod 4.3.6.
- **Risk**: none.

### B4. Import map: monorepo / direct-source consumers — **P2, S**

- **Problem**: The skill's import map documents only the installed-consumer layout (`@/components/ui/formedible/...`). Inside this repo (and any monorepo consuming the source), the established convention imports the hook directly from `packages/formedible/src/hooks/use-formedible` with a per-suite tsconfig mapping — plus, for parser/ai-builder trees, a dual `@/*` path mapping and the ambient `registry-dependencies.d.ts` include. An agent following only the skill would not know direct-source usage is supported. Finding refs: [P1] low, [P1] medium, [P3.2] medium.
- **Proposed fix**: add a "Monorepo / direct-source usage" subsection to SKILL.md's import-map section: the per-suite tsconfig pattern (`paths: { "@/*": ["packages/formedible/src/*", "packages/formedible-parser/src/*"] }` — first match wins, no collisions), the `registry-dependencies.d.ts` include requirement for parser/ai-builder type imports, and `resolve.tsconfigPaths` (not string aliases) for any vite/rolldown build consuming those trees.
- **Files**: `skills/formedible/SKILL.md` (import map section).
- **Acceptance test**: the documented tsconfig pattern matches a committed one (`tests/formedible/tsconfig.basic-fields.json`, `tests/bench/tsconfig.json`) verbatim in spirit; a validator can copy the block into a scratch suite and typecheck.
- **Risk**: none.

### B5. `conversationId` vs `threadId` guidance — **P2, S**

- **Problem**: After the 0.52 migration the two ids coexist legitimately and confusably: `AiGenerationRequest.threadId` is the chat() AG-UI threadId (`ai-types.ts:260-261`), the UI `conversationId` prop is the app's persisted domain id forwarded as `threadId` at request construction, and persisted snapshots (`GeneratedFormSnapshot.conversationId`, `ai-storage.ts`) keep the domain name forever. A grep for `conversationId` looks like incomplete migration when it is not. Finding refs: [P0.3] low, plus the [PS-val2] wording nit on `parser-and-ai.md:56` (ambiguous antecedent).
- **Proposed fix**: one short paragraph in `skills/formedible/references/parser-and-ai.md` (AI Builder section) distinguishing the three roles and stating the grep-gate reading rule (domain occurrences in `ai-types.ts`/`ai-storage.ts` are expected; only chat()-option usage was migrated). Fix the :56 antecedent while in the file.
- **Files**: `skills/formedible/references/parser-and-ai.md`.
- **Acceptance test**: paragraph claims re-verified against `ai-generation.ts:306` (`threadId: request.threadId`) and `ai-types.ts`; no other skill file contradicts it.
- **Risk**: none.

### B6. DOM-drivers guidance inside ai-builder/parser docs — folded into B1

The "what an automation agent needs" content (event mix for synthetic typing, requestSubmit, name-counting) is part of B1's section (2). Listed separately here only for finding traceability ([P1] medium follow-up "agent-docs update"); no separate artifact.

### B7. llms.txt / docs-site / skill single source of truth + version signal — **P2, M**

- **Problem**: The skill lives only at `skills/formedible/` in the repo; the docs site (`apps/web/public/llms.txt` → 16 canonical pages) and the skill tell overlapping but independent stories, and there is no version signal to pin either against (`@formedible/formedible` is 0.0.0/private; the parser exports `version = '0.1.0'`; the registry item carries no version — the skill self-stamps branch+date at SKILL.md:10). Drift between the three surfaces is what [PS]/[PS-val] kept finding. Finding refs: [PS] low (version signal), [P1] medium (DOM contract, docs-side), [PS] high ×2 (docs claims — root-caused by no single source).
- **Proposed fix**:
  1. Declare `skills/formedible/` the canonical agent-facing reference (it is the only surface validated claim-by-claim against source — [PS-fix]/[PS-val2]).
  2. Expose it on the docs site: a `/docs/agents` route rendering SKILL.md + the references (source-owned copy generated at build, not hand-maintained), linked from `apps/web/public/llms.txt` under Machine-Readable Resources. Update llms.txt's Key Topics to mention the agent reference.
  3. Reject (for now) shipping the skill as a shadcn registry item — skills are not shadcn components; the registry items already carry source. Revisit only if a skill-distribution format standardizes.
  4. Version signal: give `@formedible/formedible` a real version (even `0.1.0`) and have SKILL.md's provenance line cite it instead of branch+date, so downstream agents can version-detect behavior changes (this is also the prerequisite for A10's breaking-change release note).
- **Files**: `apps/web/public/llms.txt`, new `apps/web/src/routes/docs/agents.tsx` (or equivalent route in `apps/web/src/routes/docs/`), `skills/formedible/SKILL.md:10`, `packages/formedible/package.json` (version).
- **Acceptance test**: the docs route renders the skill content from the repo files (no duplicated prose); llms.txt links resolve; the skill's provenance line names a version that exists in `package.json`; `pnpm run build:web` green.
- **Risk**: low; keep the generated route honest (render-from-file, not a copy, or it recreates the drift problem it exists to solve).

---

## Section C — Harness & plan corrections (bookkeeping)

### C1. `PERF-BENCHMARK-PLAN.md` correction pass — **P3, S**

- **Problem**: the executed tree and the plan text disagree in seven places. Finding refs and spots: Phase 1 Outputs "Modify `adapter-current.ts`" and Phase 2 requirement 4/Outputs "Modify `run-main.ts`/`adapter-main.ts`" name files that were deleted/recreated as the driver + fixtures ([P2-val] low and its sibling [P1-rework-val] low, whose plan-text half is exactly this item — its already-fixed header half is closed in the no-action table below; lines ~211/243/252 per those findings' greps); Appendix A still omits the `submit-50` row ([P1] medium) and lists `autosave-50` with one metric while the registry carries three ([P3.1-val] low); DECISION-7 classifies by scenario where the report needs metric-level keys ([P4] low); DECISION-6's alias mechanism overstates what must be aliased ([P2] medium); the Version Snapshot's pre-execution claims that proved wrong — top-level `temperature`/`maxTokens` surviving 0.52 ([P0.3] high) and dual react-store 0.9.3 being stale residue ([P0.1] medium).
- **Proposed fix**: one editing pass over `PERF-BENCHMARK-PLAN.md` with that checklist — mark each corrected spot with a short "corrected per BENCH-FINDINGS [ref]" note rather than silently rewriting, so the file stays an honest execution record.
- **Files**: `PERF-BENCHMARK-PLAN.md`.
- **Acceptance test**: every grep in the referenced findings (`adapter-current.ts`/`adapter-main.ts` hits at the stale lines; Appendix A submit-50; DECISION-7 wording) comes back clean or annotated.
- **Risk**: none (document).

### C2. `report.ts` cosmetics: dead `MISSING` verdict + delta rounding — **P3, S**

- **Problem**: (a) `verdictOf` never returns `'MISSING'` (rows with a missing side fall through to `'N/A'`), so the union member (`report.ts:50`), the legend, and the `countVerdict(rows, 'MISSING')` tally (:866, :877) are dead/misleading — the result line prints "0 missing" while MISSING cells exist. (b) `formatDelta` (:588-600) rounds to one decimal while verdicts branch on raw values, so `+0.0301%` displays as `0.0%` with verdict WORSE and boundary probes ±0.0001% around 10% both display `+10.0%`. Finding refs: [P4-val] low ×2.
- **Proposed fix**: return `'MISSING'` from `verdictOf` when either record is undefined (before the delta-undefined `N/A` branch); in `formatDelta`, print two decimals when one-decimal rounding lands exactly on `0.0`/`10.0`/`25.0` (or always two decimals — the gate provably uses raw values either way).
- **Files**: `tests/bench/lib/report.ts`.
- **Acceptance test**: a reference copy missing one record reports `1 missing` in the summary and verdict `MISSING` on the row; boundary probes at +9.9999/+10.0001 display distinctly; exit codes unchanged (validator probes from [P4-val] re-run).
- **Risk**: none — output-only; gates already use raw values.

### C3. Parser order-stability: per-parser isolated runs — **P3, M**

- **Problem**: parser medians swing when the parser is not the first scenario in the process (first-position ~45% slower on current [P1-val] low; >80% swings on main in multi-scenario runs [P3.1] medium). The report already downgrades non-full-registry parser rows to WARN (`report.ts:452-453`, :809-829), which protects gating but discards signal from `--only` parser runs.
- **Proposed fix**: run parser scenarios in an isolated child process (or a dedicated runner invocation) inside `bench`/`bench:baseline`/`bench:full` — e.g. `run.ts`/`run-main.ts` spawn `tsx tests/bench/lib/run.ts --only parser-small,parser-medium,parser-large` as a subprocess and merge its records. This makes parser numbers position-independent, unlocks trustworthy `--only parser-*` comparisons (which A1 will want), and lets the report gate parser rows unconditionally. Alternative (cheaper, weaker): keep the downgrade and document; decide after A1's profiling.
- **Files**: `tests/bench/lib/run.ts`, `tests/bench/lib/run-main.ts`, `tests/bench/lib/run-common.ts` (shared spawn/merge glue), `tests/bench/lib/report.ts` (drop the coverage downgrade if isolated runs land).
- **Acceptance test**: `--only parser-medium` medians match full-run parser-medium medians within the existing variance policy (<10%); report classification update validated by `assertClassificationKeysRegistered`.
- **Risk**: low; keep artifacts schema identical (`artifacts.ts` single writer) so `bench:compare`/reference snapshots remain valid.

### C4. Memory scenario: multi-run heap medians — **P3, M**

- **Problem**: `memory-500` runs once per session and `measureUserAgentSpecificMemory` may collect garbage before each read, so growth sign-flips between single sessions (−0.95 MB to +3.84 MB observed) — correctly classified informational, but the row carries almost no signal. Finding refs: [P3.1-val] low, [P3-wide] cross-run drift.
- **Proposed fix**: raise memory measurement to a median-of-k (k=3, chunked per the CDP-timeout pattern already used): repeat the 500-op workload + checkpoint reads in k separate page sessions and record the median growth plus a between-session spread note; keep `runs` honest (k) in the artifact; stay informational/ungated regardless.
- **Files**: `tests/bench/lib/run-common.ts` (`executeMemoryScenario` equivalent), both fixtures' `main.tsx` heap readers, `tests/bench/lib/scenarios/index.ts` (metric notes).
- **Acceptance test**: three consecutive full runs produce heap-growth medians within 2x of each other; sign flips become rare enough to note individually; artifacts keep the 16-field schema.
- **Risk**: low; wall-time cost (+~2 memory sessions per full run) acceptable for `fullOnly`-style placement.

### C5. `stream-100chunks` `fullOnly` decision — **P3, S**

- **Problem**: only three of the four §3.2 scenarios set `fullOnly: true` (`tests/bench/lib/scenarios/index.ts` — browser-typing-50 :196, browser-mount-100 :207, bundle-minimal :218), so the default `pnpm run bench` suite runs the stream scenario, contradicting Appendix B's "(Phases 1+3.1)" description and the dispatch claim "all four fullOnly". Deliberate per the implementer; the orchestrator decision was never recorded. Finding ref: [P3.2-val] low.
- **Proposed fix**: decide one way and record it. Recommendation: add `fullOnly: true` to the stream scenario (one registry line) so the default suite stays fast and Appendix B becomes exactly true; the stream row remains a `bench:full`/explicit-`--only` concern. If the opposite is preferred (keep default-suite streaming coverage), amend Appendix B instead — C1's pass can carry either wording.
- **Files**: `tests/bench/lib/scenarios/index.ts:178-186`, `PERF-BENCHMARK-PLAN.md` Appendix B (via C1).
- **Acceptance test**: `pnpm run bench` record count matches the documented default set; `bench:full` still includes all four ids.
- **Risk**: none.

### C6. agent-browser INP gap — file upstream issue — **P2, S**

- **Problem**: agent-browser 0.27.0's `vitals` CLI/help advertises INP but the binary contains no `eventTiming`/`interactionId` implementation — INP is never reported, and `--json` wraps a markdown report, not structured vitals. The bench already works around it with an in-page `PerformanceObserver` collector (`tests/bench/lib/browser-metrics.ts`). Finding ref: [P3.2] high.
- **Proposed fix**: file an upstream issue (agent-browser repo) with the evidence from [P3.2] (binary grep, fresh-load + interaction probes, markdown-wrapped `--json`); request both INP reporting and structured vitals JSON. Keep the in-page collector until the CLI ships INP; add a one-line comment in `browser-metrics.ts` pointing at the upstream issue URL once filed. Retire the collector when a released CLI covers it.
- **Files**: upstream issue; `tests/bench/lib/browser-metrics.ts` (comment only).
- **Acceptance test**: issue URL recorded in `browser-metrics.ts` and in a findings-log addendum when filed.
- **Risk**: none.

### C7. agent-browser eval-timeout on long loops — upstream feedback — **P2, S**

- **Problem**: `Runtime.evaluate` dies with `CDP command timed out` at ~25–30s; `AGENT_BROWSER_DEFAULT_TIMEOUT` cannot reach an already-running daemon (config read at startup), so the driver had to chunk every long loop (one measured run per eval; 100-op memory chunks). Finding ref: [P3.1] high.
- **Proposed fix**: file upstream feedback requesting (a) per-invocation timeout override (e.g. a CLI flag honored per call, not only daemon startup env), and (b) documented guidance for long-running evals. Record the issue URL next to the chunking rationale in `tests/bench/utils/agent-browser.ts` (`runSequenceLoopPerRun` context). Keep the chunking pattern regardless — it is more robust than any timeout raise.
- **Files**: upstream issue; `tests/bench/utils/agent-browser.ts` (comment only).
- **Acceptance test**: issue URL recorded; no behavioral change required in-repo.
- **Risk**: none.

---

## Section D — Process improvements for the subagent-orchestration workflow

### What worked — keep as-is

1. **Validator independence.** Independent validators caught the three highest-value defects of the run, none of which the implementers' own gates saw: the dead `minimax/minimax-2.7` model id surviving in every runtime default while only the test-facing constant was fixed ([P0.3-val] FAIL), the registry payload embedding pre-migration code for exactly the 4 migrated files ([P0.3-val2] FAIL), and the main-branch submit-lifecycle divergence that made back-to-back submits silently drop ([P2] high). Validators re-running gates and greps themselves — not reading the implementer's report — is what produced these.
2. **Plan snapshot vs execution-day re-verification.** Re-checking the plan's version snapshot against live `pnpm view` on execution day caught real drift (`temperature`/`maxTokens` removed in 0.52, [P0.3] high) and falsified a plan assumption cheaply (dual react-store is a live pin, [P0.1] medium).
3. **Fixer loops with mechanical acceptance criteria.** The attempt-2/3 registry fix converged fast because the validator's acceptance criterion was a mechanical 23/23 SAME/DRIFT comparison, not prose review.
4. **Mandatory dogfooding.** Forcing the bench/skill work to consume the lib through its own documented surfaces produced 10+ documented skill/doc gaps ([PS*], [PS-val], [PS-fix]) plus the DOM-contract gap ([P1] medium) — a class no code review would surface. Keep dogfooding mandates in every phase that adds agent- or consumer-facing surface.

### What to change next time

1. **Dispatch prompts must mandate generated-artifact regeneration checks.** Any phase that edits files embedded in generated output (registry payloads, route trees, snapshots) must include "regenerate and diff the generated artifacts" as an explicit requirement, not leave it to the fixer loop to discover. This single line would have prevented both Phase 0.3 validation failures.
2. **Formalize the mid-flight plan-revision micro-phase.** The jsdom rejection ([P-rev] high) arrived mid-Phase-1 and was handled by an ad-hoc plan rewrite plus a rework dispatch. It worked, but cost a full phase rework. Next time: a named micro-phase ("plan revision": rewrite affected decisions, re-dispatch in-flight phases, mark superseded artifacts medium-invalid in the findings log) with its own validator pass, so overrides have a paved path instead of an improvised one.
3. **Generated-file freshness tests ship with the pipeline, not after.** The [P0.3-fix2] recommendation (freshness test comparing embedded `files[].content` to disk) is now item A2; the general rule for future orchestrations: whenever a phase introduces or touches a codegen pipeline, the same phase adds the drift-detection test.
4. **Treat measurement order-stability as a first-class harness requirement.** Parser position sensitivity was independently found by validators twice ([P1-val] low, [P3.1] medium). Future harness designs should pin execution order (or isolate sensitive scenarios) in the design phase, not patch gating afterwards.
5. **Budget one retry for upstream-flake gates.** The consumer-smoke gate failed once on an npm publish race (`typescript-eslint@8.69.0` published 3 minutes before its own dependency, [P0-wide] medium). Standing policy: on `ERR_PNPM_NO_MATCHING_VERSION` for a package published <15 min ago, wait 1–5 min, retry once, then escalate — and record registry evidence in the findings log rather than opening a fixer loop.
6. **Dispatch wording must defer to the plan or name itself authoritative — never both.** The 3.2 dispatch contradicted the plan on which fixture builds `bundle-minimal` ([P3.2] medium). Dispatch template should carry an explicit "authoritative spec: <plan §X>" line whenever it summarizes one.
7. **User-facing medium decisions get a check-in gate.** The jsdom override invalidated an entire committed phase's artifacts. A lightweight "medium check-in" (one question at plan approval: "is in-process/jsdom timing acceptable as a benchmark medium for this work?") would have caught it before code existed.

---

## Findings closed with no action

Every findings entry not covered by A–D above, explicitly closed:

| Finding | Close reason |
| --- | --- |
| [P0.1] medium (dual react-store 0.9.3) | Resolved at execution per the plan's own fallback; both lockfile entries are live react-router requirements — no change possible short of upstream react-router dropping the hard pin. |
| [P0.1] low ×2 (`pnpm why` root empty; react-router chains via optional peer) | Reading guidance fully captured in the findings entries; no recurring doc surface warrants a change (optional one-liner in AGENTS.md if it recurs). |
| [P0.1-val], [P0.2-val], [P0.3-val3], [P3-wide], [PS-val2] | Validation-pass entries — nothing to act on. |
| [P0.2] low (routeTree.gen.ts permutation) | Genuine tooling output, regenerated via normal build, route-tree test guards it — no action. |
| [P0.3] medium ×2 (minimax drift; usage record) | Both fixed in Phase 0.3 and verified; residual model-catalog drift risk is covered by the re-verify practice (D, keep #2). |
| [P0.3] low (THINKING event family; openrouter postinstall) | Handled in 0.3; the postinstall ignore is a cosmetic pnpm warning for a `|| true` script. |
| [P0.3-val]/[P0.3-fix]/[P0.3-val2] | Superseded by [P0.3-fix2]/[P0.3-val3]; follow-ups extracted to A2. |
| [PS] low (version signal) root cause | Folded into B7 (4) — closed there, not separately. |
| [PS-val] high / [PS-val] medium / [PS-val] low (skill inaccuracies) | Fixed in [PS-fix] and verified by [PS-val2]; their lib-level residues are items A6, A8, A3. |
| [P1] medium (submit-50 registry gap) | Implemented in Phase 1; remaining plan-text residue is C1. |
| [P1-rework] high (uncommitted jsdom Phase 2 WIP deleted mid-rework) | Superseded mid-flight by the user's jsdom override ([P-rev] high): the uncommitted `adapter-main.ts`/`run-main.ts`/`perf-probe.ts` were built on the jsdom mount path the rework mandated deleting, leaving no tree state that is simultaneously jsdom-free under `tests/bench` and aggregate-typecheck-green while they exist. Disposal was the sanctioned move, the medium-independent assets (`baseline-worktree.ts`, `tsconfig.main.template.json`, `formedible-main-bridge.d.ts`, the `artifacts.ts` worktree additions) were preserved, and the coordinator was notified mid-run before deletion — disposal + preservation verified by the [P1-rework-val] pass (no FAIL; only the low-severity observations closed below). The process lesson (a paved path for mid-flight overrides) is D, change #2/#7. |
| [P1-rework] medium/low, [P1-rework-val] low (header half: the stale `adapter-types.ts`/`formedible-main-bridge.d.ts`/`report-table.ts` comment refs, repointed during Phase 3.1; its plan-text half is C1), [P2] low ×3 (the fourth [P2] low — main's differing DOM hooks — is a B1 finding ref), [P2-val] medium, [P2-val] low (adapter-types header) | All resolved by the Phase 2/3 implementations (fixtures, run-common dedup, `.bench-dist` convention, selector work, header repoint in [P3.1] low); committed tree verified current. |
| [P1-rework-val] low (submit-50 N=5 jitter), [P2-val] low (submit-settle asymmetry), [P3.1] medium (autosave noise floor) | Honored by Phase 4 as designed: informational classification, divergence notes printed (`report.ts` `INFORMATIONAL_METRIC_KEYS`, `DERIVED_SPREAD_METRIC_KEYS`, `printDivergenceNotes`) — nothing further owed. |
| [P1-rework-val] low (SIGKILL orphaned vite) | Informational; unreachable from runner-controlled paths; the detached-process-group option stays a note in the finding. |
| [P2] high (main submit lifecycle) | Main-branch behavior, correctly preserved and documented as artifact divergence notes — fixing main is out of scope by definition. |
| [P2] medium (main fixture needs two tsconfigs: committed typecheck program vs generated build program) | Deliberate design, kept as-is: the committed `tsconfig.check.json` + `tsconfig.template.json` pair is what lets `check-types` typecheck the fixture on machines without the worktree, while the generated `fixtures/main-consumer/tsconfig.json` (written by `baseline-worktree.ts` through the template placeholder, defensively re-generated by `run-main.ts` before every build) carries the env-resolved worktree paths that vite's nearest-tsconfig `tsconfigPaths` resolution requires — one file provably cannot do both, and [P1-rework] medium ruled out string aliases as a substitute under rolldown-vite 8. Chosen as no-action over a C documentation item because the rationale already lives at the code site (`tests/bench/lib/baseline-worktree.ts`: template generation + `assertBaselineReady`) and a README/plan copy would be a drift-prone second source; exercised by the passing Phase 2 validation. |
| [P3.1] high ×2 (setCurrentPage closure; CDP timeout) | Harness-side, resolved by per-op re-resolution and eval chunking; CDP-timeout upstream feedback is C7. |
| [P3.1] medium (performance.memory bucketing) | Resolved via COOP/COEP preview headers + `measureUserAgentSpecificMemory`; further memory work is C4. |
| [P3.1] low ×3 (memory typing targets; heap-reader traps; notes dedup + dead protocol pruning — the latter two concerns are one finding) | All fixed in Phase 3.1; verified current. |
| [P3.1-val] low (subtractStats min/max inversion) | Implemented by Phase 4 (`DERIVED_SPREAD_METRIC_KEYS` prints `-` spread cells). |
| [P3.2] medium ×3, [P3.2] low ×4 | All resolved within Phase 3.2 (dedicated minimal fixture, scheduler mapping, commit-counting hook, trace event mix, executor wiring, session ordering); residuals are C5/C6. |
| [P3.2-val] low (`--` separator rejection) | Documented invocations all work; the optional bare-`--` tolerance in `parseBenchArguments` is noted in the finding and deliberately not scheduled. |
| [P3.2-val] low (interaction-trace-ms collected in the devtools-instrumented session) | Resolved by Phase 4's per-row medium labeling, verified in `tests/bench/lib/report.ts`: the record carries the instrumented medium note (`run.ts` `INSTRUMENTED_MEDIUM_NOTE`, applied to the `browser-typing-50` session that owns `interaction-trace-ms`) and `mediumLabelOf` renders it as `chromium+devtools` on every compare row, so the instrumented context is disclosed at record level and the trace number can never be read as un-instrumented — the finding's "Phase 4 report labeling" follow-up is thereby satisfied. |
| [P4] low (exit-code split) | Deliberate design (report-specific parser) — no change wanted. |

---

*Provenance: plan produced by Phase 5 of the perf-benchmark orchestration; every claim about current source re-verified against `e1d5b46` on 2026-08-31; benchmark numbers read directly from the committed artifacts named in the executive summary.*
