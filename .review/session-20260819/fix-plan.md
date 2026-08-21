# Formedible `re-codex` Review Fix Plan

## Overview

Fix plan generated from 20 verified review reports, the compatibility audit (F1–F8 BREAKING + DEGRADED), and the currently-failing repo gates. Goal: unblock all gates, restore backward compatibility per the user mandate ("EXISTING SCHEMAS MUST KEEP WORKING"), fix confirmed CRITICAL/HIGH runtime bugs, then MEDIUM bugs, then docs/dead-code/test-quality cleanup.

Branch: `re-codex`. Repo: `/home/didi/workspace/Formedible` (pnpm + turbo monorepo).

The 4 intentional removals documented in `FROM-SCRATCH-2.md` §"useFormedible Return Contract" (`crossFieldErrors`, `asyncValidationStates`, `validateCrossFields`, `validateFieldAsync`) **stay removed** — no phase re-adds them.

## Prerequisites

- pnpm 10.10.0, Node 20+, workspace installed (`pnpm install`).
- All file paths below are relative to repo root unless prefixed `main:` (main-branch reference).
- **Formedible workflow (MANDATORY for every phase touching `packages/formedible/src`)**: fix in `packages/formedible/src/` → `pnpm run build:pkg` → `node scripts/quick-sync.js` → fix package-specific errors → verify with full `pnpm run check-types`. Owner packages `packages/builder`, `packages/ai-builder`, `packages/formedible-parser`, `packages/ai-picker` are synced to `packages/ui` by the same script — after editing their `src`, re-run `node scripts/quick-sync.js` before `pnpm run check-types`.
- Phases 3–11 and 22.1 all modify `packages/formedible/src` and share the build/sync pipeline — they MUST run sequentially (never concurrently) even where marked Sequential individually.
- NO-SLOP policy applies to every implementer/fixer dispatch (no `any`, no TODO/FIXME, no unused imports/vars, no placeholders, `import type` for type-only imports, no `confirm()`/`alert()`, no `await import()`, do not start the dev server).
- Known gate scripts: `pnpm run check-types`, `pnpm run build`, `pnpm run test:sync`, `pnpm run test:architecture`, `pnpm run test:consumer-smoke`, `pnpm run test:consumer-smoke:vite-base`, `pnpm run test:formedible:{normalization,validation,basic-fields,section-rendering,advanced-fields,advanced-fields:ssr,nested-fields,phase10,types}`, per-package tests via `pnpm --filter @formedible/{formedible-parser,builder,ai-builder,ai-picker} run test`.

---

## Phase 1: Unblock check-types/build — packages/ui dependencies + exports map
**Type**: Sequential

**Requirements**:
- Add missing runtime dependencies to `packages/ui/package.json` `dependencies` (verified-report-12 Finding 1; versions must match `packages/ai-builder/package.json:15-25`, none exist in the pnpm-workspace catalog): `@tanstack/ai: ^0.16.0`, `@tanstack/ai-anthropic: ^0.8.6`, `@tanstack/ai-openai: ^0.8.5`, `@tanstack/ai-openrouter: ^0.8.5`, `react-markdown: ^10.1.0`, `rehype-highlight: ^7.0.2`, `remark-gfm: ^4.0.1`. The TS7031 implicit-`any` errors in `packages/ui/src/components/formedible/ai/markdown-message.tsx` (children/className params) are cascades of the missing `react-markdown` types and must resolve once deps install — if any remain, fix them with explicit types (no `any`).
- Fix the exports map in `packages/ui/package.json` (verified-report-12 Finding 2). The catch-all `"./components/formedible/*": "./src/components/formedible/*.tsx"` maps `.ts` files to non-existent `.tsx`. Add exact entries BEFORE the pattern entries:
  - `"./components/formedible/builder/field-store": "./src/components/formedible/builder/field-store.ts"` (file on disk is `field-store.ts`),
  - `"./components/formedible/ai": "./src/components/formedible/ai/index.ts"`,
  - `"./components/formedible/builder": "./src/components/formedible/builder/index.ts"`.
- Audit `packages/ui/src/components/formedible/` for any other `.ts` files (or `index.ts` barrels) reachable only through the `*.tsx` catch-alls and add exact entries for them using the same approach.

**Inputs**:
- Read: `packages/ui/package.json`, `packages/ai-builder/package.json`, `pnpm-workspace.yaml` (catalog check)
- Reference: `packages/ui/src/components/formedible/ai/markdown-message.tsx`, `packages/ui/src/components/formedible/builder/`

**Outputs**:
- Modify: `packages/ui/package.json`

**Validation Criteria**:
- `pnpm install` succeeds at repo root.
- `pnpm --filter @formedible/ui run check-types` → zero errors (currently exits 2 with exactly 7 unresolved modules: `react-markdown`, `rehype-highlight`, `remark-gfm`, `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openai`, `@tanstack/ai-openrouter`).
- Node resolution check from `packages/ui`: `import('@formedible/ui/components/formedible/builder/field-store')`, `.../formedible/ai`, `.../formedible/builder` resolve to existing files (resolution-level; execution may fail on TS extensions which is fine).
- `pnpm run check-types` → PASS (all packages). `pnpm run build` → PASS.

**Dependencies**: None (first phase)

---

## Phase 2: Unblock remaining gates — sync boundary, architecture scan, consumer smoke
**Type**: Parallel

### 2.1: ai-picker authored-source portability + ai-builder sync-boundary violation
**Requirements**:
- **Step 1 — make ai-picker authored source portable** (verified-report-10 Finding 2): the four ai-picker component files hard-code destination aliases in owning source, violating the portable-`@/`-alias ownership model:
  - `packages/ai-picker/src/components/ai-picker/ai-picker-popover.tsx:3-5`
  - `packages/ai-picker/src/components/ai-picker/ai-picker-panel.tsx:5-8`
  - `packages/ai-picker/src/components/ai-picker/ai-picker.tsx:5`
  - `packages/ai-picker/src/components/ai-picker/model-autocomplete-field.tsx:5-7`
  Vendor the shadcn primitives into `packages/ai-picker/src/components/ui/` (copy `button.tsx`, `input.tsx`, `popover.tsx`, `select.tsx` from `packages/formedible/src/components/ui/`, adapted to ai-picker's declared deps; add `lib/utils.ts` with `cn` if not present) and rewrite the 12 hard-coded import lines to `@/components/ui/button|input|popover|select` and `@/lib/utils` — matching every sibling owner package's convention. Remove `"@formedible/ui": "workspace:*"` from `packages/ai-picker/package.json` dependencies.
- **Step 2 — fix the sync-boundary violation** `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:5` imports `@formedible/ui/components/formedible/ai-picker`, rejected by `scripts/validate-sync-boundaries.js` (`validatePackageWorkspaceImport`: "Package/plugin shadcn internals must keep local source copies"). **[DECISION D1 — approach]**:
  - **Option A (RECOMMENDED)**: vendor ai-picker into ai-builder via a new sync route. Add to `defaultRoutes` in `scripts/quick-sync.js` (after the existing ai-picker→ui route): `{ ownerRoot: 'packages/ai-picker', destinationRoots: ['packages/ai-builder/src/components'], useRegistryTargets: false }` so `src/components/ai-picker/*` → `packages/ai-builder/src/components/ai-picker/*` and `src/lib/ai-picker-*.ts`/`default-picker-schema.ts` → `packages/ai-builder/src/lib/`. Then change `ai-builder.tsx:5` to `import { AiPicker } from '@/components/ai-picker';` (ai-builder has its own `@/components/ui/` primitives and its `@/*` maps to `./src/*`). Extend `rewriteAliasSpecifier` in `quick-sync.js` so the exact specifier `'@/components/ai-picker'` (index, no trailing slash) also rewrites to `${uiAlias}/formedible/ai-picker` for the `packages/ui` destination (the existing rule only handles the trailing-slash prefix). Run `node scripts/quick-sync.js` to materialize the vendored copy.
  - Option B: drop the `AiPicker` dependency in ai-builder and render the package's own `ProviderSelection` (`packages/ai-builder/src/components/formedible/ai/provider-selection.tsx`) in the collapsed sidebar view instead (feature regression, zero cross-package surface).
  - Option C: add a documented exception to `validatePackageWorkspaceImport` in `scripts/validate-sync-boundaries.js` (perpetuates the violation; not recommended).
- Default if no veto: Option A.

**Outputs**:
- Create: `packages/ai-picker/src/components/ui/{button,input,popover,select}.tsx`, `packages/ai-picker/src/lib/utils.ts`, vendored `packages/ai-builder/src/components/ai-picker/*` + `packages/ai-builder/src/lib/ai-picker-*.ts` (via sync)
- Modify: the 4 ai-picker component files, `packages/ai-picker/package.json`, `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx`, `scripts/quick-sync.js`

**Validation**:
- `pnpm run test:sync` → PASS (4/4 sync tests + `validate-sync-boundaries.js` exits 0 — currently fails on `ai-builder.tsx:5`).
- `node scripts/quick-sync.js` idempotent (second run produces no diff).
- `pnpm run check-types` → PASS. `pnpm --filter @formedible/ai-picker run test` → PASS.

### 2.2: Architecture scan boundary — stop reading non-docs trees as public docs
**Requirements** (verified-report-20 Finding 1; this is the live `pnpm run test:architecture` failure, 26/27):
- `tests/architecture/public-doc-imports.test.ts:5`: replace `documentationPathPattern` `/(\^|\/)(docs|app\/docs|src\/app\/docs|README\.(?:md|mdx)$|.*\.(?:md|mdx)$)/` with a pattern that (a) drops the `.*\.(?:md|mdx)$` catch-all (it subsumes every Markdown file in the tree, e.g. `.review/session-20260819/*.md`), (b) right-anchors directory alternatives to path segments: `(^|\/)(docs|app\/docs|src\/app\/docs)(\/|$)` plus `(^|\/)README\.(md|mdx)$`. Internal root-level notes (e.g. `FROM-SCRATCH-2.md`) must no longer be classified as public docs.
- `tests/architecture/utils.ts:14-26`: harden the walk — skip ALL dot-directories (any `entry.name.startsWith('.')`) in addition to the existing `ignoredDirectoryNames` list, so `.review/` and future tooling dirs can never trip docs/registry scans.

**Outputs**:
- Modify: `tests/architecture/public-doc-imports.test.ts`, `tests/architecture/utils.ts`

**Validation**:
- `pnpm run test:architecture` → 27/27 PASS (currently 26/27 failing on `.review/session-20260819/review-report-10.md` / `verified-report-10.md`).
- Sanity: a fixture under `docs/` containing a forbidden specifier still fails (add such a case to the test if none exists), and `apps/web/src/routes/docs/**.tsx` files are still scanned as docs.

### 2.3: Consumer smoke — better-t-stack requires pnpm >= 10.26.0 (local 10.10.0)
**Requirements** (environmental gate failure, 6/7 passing):
- **[DECISION D2 — strategy]**:
  - **Option A (RECOMMENDED)**: pin the scaffold command to a deterministic better-t-stack version whose `engines.pnpm` accepts 10.10.0. Change `"reproducibleCommand"` in `bts.jsonc:16` from `pnpm create better-t-stack@latest formedible ...` to `better-t-stack@<pinned-version>` (implementer determines the newest compatible version via `pnpm view better-t-stack@* engines` and records it). Update `expectedPrefix` in `tests/consumer-smoke/utils/better-t-stack.ts:100` (`['pnpm', 'create', 'better-t-stack@<pinned>']`) and the regex at `tests/consumer-smoke/harness.test.ts:114`.
  - Option B: keep `@latest` and add a graceful pre-check in `createBetterTStackBootstrapPlan` that compares `pnpm --version` against the CLI's declared engines and `t.skip`s the scaffold test with a descriptive diagnostic when incompatible.
- Default if no veto: Option A.

**Outputs**:
- Modify: `bts.jsonc`, `tests/consumer-smoke/utils/better-t-stack.ts`, `tests/consumer-smoke/harness.test.ts`

**Validation**:
- `pnpm run test:consumer-smoke` → 7/7 PASS (network required; if sandbox blocks, `pnpm run test:consumer-smoke:vite-base` must pass and the scaffold test must be left in a state that passes on the maintainer's machine with pnpm 10.10.0).

**Phase-level Validation**:
- `pnpm run check-types` → PASS; `pnpm run test:sync` → PASS; `pnpm run test:architecture` → 27/27; `pnpm run test:consumer-smoke` → 7/7.
- Phase-wide validator checks the three sub-phases did not conflict (all touch disjoint files except none shared).

**Dependencies**: Phase 1 must complete successfully (stable gate baseline before measuring the rest).

---

## Phase 3: Compat F2 — date field submits `Date` again + date-field defects + `disablePastDates` regression
**Type**: Sequential (formedible chain, step 1 of 9)

**Requirements**:
- **F2 (compat-report, HIGH)**: `packages/formedible/src/components/formedible/fields/date-field.tsx:40-48` currently commits the raw `'YYYY-MM-DD'` string (`field.onChange(nextValue)`). Restore main's contract (`main:packages/formedible/src/components/formedible/fields/date-field.tsx:75-79`): on change with a non-empty value, commit `new Date(\`${nextValue}T00:00:00\`)` (local midnight `Date`); on empty, commit `undefined`. Existing zod schemas (`z.date()`) and the 5 affected docs examples (`advanced-field-types-form.tsx:68/200/596`, `registration-form.tsx:11/54/108`, `job-application-form.tsx:13/77-82/120`, `conditional-pages-form.tsx:12/315-321/479`, `array-fields-form.tsx:17` — verified-report-18 Finding 4) must validate successfully after a user picks a date. No example edits in this phase.
- **Local-time conversion (verified-report-3 Finding 5)**: replace `toISOString().slice(0,10)` in `toDateInputValue`/`toDateBound` (`date-field.tsx:5-19`) with local-time formatting (`getFullYear`/`getMonth`/`getDate`, zero-padded) so a local-midnight `Date` east of UTC renders as the correct day, and `minDate`/`maxDate` `Date` bounds do not shift a day (verified under `TZ=Europe/Berlin`: `new Date(2026,0,15)` must render `2026-01-15`, not `2026-01-14`).
- **Guard `disableDate` against Invalid Date (verified-report-3 Finding 6)**: `date-field.tsx:40-48` builds `new Date(\`${nextValue}T00:00:00\`)` which is an Invalid Date while cleared/mid-edit; skip invoking `dateConfig?.disableDate` when `Number.isNaN(nextDate.getTime())`.
- **Restore `disablePastDates` (verified-report-14 Finding 2 — rewrite REGRESSION, was implemented on main)**: add `disablePastDates?: boolean` and `disableFutureDates?: boolean` to `FormedibleDateConfig` (`packages/formedible/src/lib/formedible/types.ts:519-525`; main declared it at `main:...types.ts:255` and implemented it in `main:.../lib/formedible/date.ts` `buildDisabledMatchers`). Implement in `date-field.tsx`: when `disablePastDates`, compute the effective `min` attribute as the later of `minDate` and today's local date (and symmetric `max` for `disableFutureDates`), so past pickup dates are unselectable in `apps/web/src/components/examples/rental-car-flow-form.tsx:157-159` (both live and exported-code copies pass the key today).

**Inputs**:
- Read: `packages/formedible/src/components/formedible/fields/date-field.tsx`, `packages/formedible/src/lib/formedible/types.ts:519-525`, `apps/web/src/components/docs/examples/advanced-field-types-form.tsx` (schema shape), `tests/formedible/advanced-fields.test.tsx`
- Reference: `main:packages/formedible/src/lib/formedible/date.ts` (`buildDisabledMatchers`), `main:packages/formedible/src/components/formedible/fields/date-field.tsx:75-79`

**Outputs**:
- Modify: `packages/formedible/src/components/formedible/fields/date-field.tsx`, `packages/formedible/src/lib/formedible/types.ts`, `tests/formedible/advanced-fields.test.tsx` (add assertions: value is `instanceof Date` after change; empty change yields `undefined`; local-midnight Date renders its own day; disablePastDates sets min to today)

**Validation Criteria**:
- Formedible workflow: `pnpm run build:pkg` → `node scripts/quick-sync.js` → `pnpm run check-types` PASS.
- `pnpm run test:formedible:advanced-fields` and `:advanced-fields:ssr` PASS; `pnpm run test:formedible:phase10` PASS; `pnpm run test:formedible:validation` PASS.
- Validator re-runs the verified-report-18 scenario shape: a `z.date().optional()` date field with `new Date()` default, pick `1990-05-05` → form value is a `Date`, no validation error, submit succeeds.

**Dependencies**: Phase 2 must complete successfully.

---

## Phase 4: Compat F1 — restore the custom `component`/`wrapper`/`defaultComponents` prop contract
**Type**: Sequential (formedible chain, step 2)

**Requirements**:
- **F1 (compat-report, HIGH)**: main passed flat props to custom field components (`main:packages/formedible/src/hooks/use-formedible.tsx:1699-1849`): `{ fieldApi, label, placeholder, description, wrapperClassName, labelClassName, className, min, max, step, rows, maxLength, accept, multiple, disabled, required, options, ...configs }`; `wrapper` received `{ children, field: FieldConfig }` (`main:.../lib/formedible/types.ts:1327-1330`); `defaultComponents` was `Record<string, ComponentType<FieldComponentProps>>` with arbitrary custom type keys merged into the registry. The rewrite replaced all three with a new render-props shape (`packages/formedible/src/components/formedible/field-renderer.tsx:8`, `types.ts:216-222,465,511-517`).
- **[DECISION D3 — contract shape]**:
  - **Option A (RECOMMENDED)**: dual-shape contract. Extend `FormedibleFieldRenderProps` so a custom `component` receives BOTH the legacy flat props AND the new props: `fieldApi` (alias of the TanStack field api), `field`, `fieldConfig`, `label`, `placeholder`, `description`, `disabled`, `required`, `options`, `min`, `max`, `step`, `rows`, `maxLength`, `accept`, `multiple`, `className`, `inputClassName`, `wrapperClassName`, `labelClassName`, plus each resolved config object (`sliderConfig`, `phoneConfig`, `fileConfig`, etc. when present), plus `renderField`, `defaultComponent`, `globalWrapper`. `wrapper`/`globalWrapper` receive `{ children, field, fieldConfig }`. `defaultComponents` widens to `Record<string, ComponentType<FormedibleFieldComponentProps>>`: keys are normalized via `normalizeFieldType` when they match known types, otherwise registered verbatim as custom type strings that resolve in the field registry (falling back to text when a type string has no registration). Legacy components compile and run unchanged; new-style components keep working.
  - Option B: keep the new shape and export a `createLegacyFieldComponent()` adapter utility (does NOT keep existing consumer code compiling — conflicts with the backward-compat mandate; not recommended).
- Default if no veto: Option A.

**Inputs**:
- Read: `packages/formedible/src/lib/formedible/types.ts` (lines 216-284, 453-487, 511-517), `packages/formedible/src/components/formedible/field-renderer.tsx`, `packages/formedible/src/components/formedible/fields/field-registry.tsx:26-53`, `packages/formedible/src/hooks/use-formedible.tsx`
- Reference: `main:packages/formedible/src/hooks/use-formedible.tsx:1699-1849` (flat-prop construction), `main:.../lib/formedible/types.ts:1307-1374`

**Outputs**:
- Modify: `packages/formedible/src/lib/formedible/types.ts`, `packages/formedible/src/components/formedible/field-renderer.tsx`, `packages/formedible/src/hooks/use-formedible.tsx` (registry merge for `defaultComponents` incl. custom keys)
- Modify: `tests/formedible/types/field-config.test-d.ts` (type-level assertions for both prop shapes), `tests/formedible/basic-fields.test.tsx` (runtime test: custom component receives `fieldApi`, `label`, resolved config objects)

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS.
- All `test:formedible:*` suites PASS.
- A test registering `defaultComponents: { myWidget: CustomComponent }` and a field `{ type: 'myWidget' }` renders the custom component with flat props (add to basic-fields).

**Dependencies**: Phase 3 must complete successfully.

---

## Phase 5: Compat F3 — visibility-aware schema validation, async-schema crash guard, parse perf, required edge cases
**Type**: Sequential (formedible chain, step 3)

**Requirements**:
- **CRITICAL — form-level zod validation must respect conditional visibility** (verified-report-18 Finding 1; dedups verified-report-1 validation notes): `buildFormValidators` (`packages/formedible/src/lib/formedible/validation.ts:372-416`) parses FULL values against the whole schema; conditionally hidden fields' `""` defaults fail `.min(N).optional()` and block submit with zero feedback (both `conditional-pages-form` and `conditional-in-obj` are unsubmitatable in their default states — empirically confirmed). Fix: before surfacing a schema issue, resolve whether the issue's field path belongs to a currently-visible field, using the same conditional semantics as rendering (`shouldRenderField`, `use-formedible.tsx:217-227`, incl. string conditionals via `getValueAtFieldPath` and item-local conditionals for nested object/array paths — `conditional-in-obj`'s `roomDetails[0].equipementListRoom` is hidden by `equipementRoom=false` evaluated against the item's own values). Skip issues on hidden paths at the form level AND in `schemaFieldMessage` field mapping. Extract the visibility resolution into a new shared helper `packages/formedible/src/lib/formedible/field-visibility.ts` used by both `use-formedible.tsx` and `validation.ts`.
- **[DECISION D4 — F3 strictness]**:
  - **Option A (RECOMMENDED)**: keep `schema` and `required` enforced (they are bug fixes vs main's dead options) but make enforcement visibility-aware per above, so previously-submitting forms keep submitting. Sub-point: keep `required` enforced (with the checkbox fix below); main never enforced it at runtime, but enforcement is the expected behavior and does not break valid schemas.
  - Option B: restore main's runtime no-op for the top-level `schema` (schema accepted for field mapping only, never gates submit) — maximum compat, loses real validation.
  - Default if no veto: Option A.
- **Async schema crash (verified-report-2 Finding 1, empirically reproduced)**: `schemaFieldMessage` (`validation.ts:247`) and the form-level `validate` (`validation.ts:384`) call `formApi.parseValuesWithSchema(schema)` without a promise guard; an async zod schema (async refine) throws `"async function passed to sync validator"` on every keystroke. Guard promise results in the sync slots (mirror `schemaValidationMessage`'s `isPromiseLike` guard at `validation.ts:135-143`) and route async-schema validation through the async validator slots (register `onChangeAsync`/`onSubmitAsync` when the form schema is async — TanStack form-core 1.32.0 supports async validator variants).
- **Async field-level schema never validates (verified-report-2 Finding 6)**: `field.validation` returning a promise is silently dropped (`validation.ts:135-143` returns `undefined`; `onChangeAsync` only runs `fieldAsyncValidation`/`inlineValidation`, `validation.ts:343-364`). Wire async field schemas into the async validator slot alongside field async validation.
- **Parse performance (verified-report-2 Finding 8 + verified-report-1 Finding 7, dedup)**: today one keystroke = 2 full-schema parses, one `form.Subscribe` render = N full parses (3 fields → 3 parses; O(N) per keystroke). Fix: parse the schema once per values snapshot (memoize the parsed issues map keyed by values object identity within a validation pass / `getInvalidFieldEntries` invocation), and gate the `getInvalidFieldEntries` work inside `form.Subscribe` (`use-formedible.tsx:608-613`) on `validationSummaryConfig.showBadges && hasInvalidSubmitAttempt` (its only consumers, lines 547/625) so valid/quiet forms do no schema work per keystroke.
- **`required` never fails for checkbox/switch `false` (verified-report-2 Finding 4)**: `isEmptyValue` (`validation.ts:163-173`) only treats `undefined/null/''/[]` as empty; checkbox stores strict `false` (`checkbox-field.tsx:19`) so unchecked required consent passes. Treat `false` as empty for `checkbox`/`switch` field types in `validateRequired`.
- **ReactNode label message (verified-report-2 Finding 5)**: `validation.ts:172` renders `"[object Object] is required"` for JSX labels. Fall back to `fieldConfig.name` when `label` is not a string.

**Inputs**:
- Read: `packages/formedible/src/lib/formedible/validation.ts` (lines 130-250, 290-420), `packages/formedible/src/hooks/use-formedible.tsx` (lines 217-260, 593-627), `packages/formedible/src/lib/formedible/field-path.ts`, `packages/formedible/src/components/formedible/fields/array-field.tsx:147-152` (item-local conditional semantics), `apps/web/src/components/docs/examples/conditional-pages-form.tsx`, `apps/web/src/components/docs/examples/conditional-in-obj-form.tsx`
- Reference: TanStack `standardSchemaValidator` throw semantics (installed `@tanstack/form-core@1.32.0`)

**Outputs**:
- Create: `packages/formedible/src/lib/formedible/field-visibility.ts`
- Modify: `packages/formedible/src/lib/formedible/validation.ts`, `packages/formedible/src/hooks/use-formedible.tsx`, `packages/formedible/src/lib/formedible/types.ts` (only if async-slot types need widening)
- Create: `tests/formedible/validation/conditional-schema.test.tsx` (scenarios: conditional-pages individual + business default states submit; conditional-in-obj default state submits; hidden-field issues skipped; async schema does not throw on keystroke and surfaces issues async; checkbox required false fails; JSX label message uses field name)

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS.
- `pnpm run test:formedible:validation` PASS (incl. new file — note the validation tsconfig glob covers `tests/formedible/validation/*.test.tsx`), plus full `test:formedible:*` battery.
- Validator re-runs the verified-report-18 empirical scenarios end-to-end (jsdom, real hook, verbatim example configs): both examples submit in default states with only visible fields filled.

**Dependencies**: Phase 4 must complete successfully.

---

## Phase 6: Compat F4/F5/F6/F7/F8 — type widenings + restore fired analytics callbacks
**Type**: Sequential (formedible chain, step 4)

**Requirements**:
- **F4**: `formOptions.onSubmitInvalid` is typed `never` (`packages/formedible/src/lib/formedible/types.ts:369`); main spread `formOptions` into TanStack `useForm` so it worked (`main:.../use-formedible.tsx:668-669`). Type it as the standard TanStack submit-invalid callback and forward it into the `useForm` config (explicitly or by controlled spread of the allowed formOptions subset).
- **F5**: `analytics.onTabChange`, `onTabFirstVisit`, `onSubmissionPerformance` were fired on main (`main:.../use-formedible.tsx:834,888,712`) and are now typed `never` (`types.ts:429-449`). Un-widen exactly these three (leave the never-fired-on-main ones as `never`), and fire them: `onTabChange(fromTab, toTab, timeSpentMs, meta)` and `onTabFirstVisit(tab, timestamp)` from `packages/formedible/src/hooks/use-form-tabs.ts` (tab switch + first-visit set), `onSubmissionPerformance(meta)` from the submit wrapper in `use-formedible.tsx` (duration measured around `form.handleSubmit()`).
- **F6**: `emailConfig?: never` (`types.ts:258,320`) is a compile error for existing configs; main forwarded it (`main:.../use-formedible.tsx:1844-1845`) though the TextField never consumed it. Restore an optional `emailConfig` type (accept & ignore at runtime, JSDoc `@deprecated` noting it was never implemented).
- **F7**: `section` object requires `title` (`types.ts:54-63`); main allowed all-optional keys (`main:.../types.ts:1012-1017`). Make `title` optional: `string | { title?: string; description?: string }` (ReactNode titles remain allowed per `types.ts:60`). Ensure section rendering handles a missing title (header suppression is acceptable; the header-dedup fix lands in Phase 8).
- **F8**: `fields` and `formOptions` are required, and `defaultValues` required inside `formOptions` (`types.ts:362,453-455`; hook reads `config.formOptions.defaultValues` unconditionally at `use-formedible.tsx:85`). Make `fields` optional (default `[]`), `formOptions` optional, `defaultValues` optional (hook guards with `config.formOptions?.defaultValues ?? {}`).
- **Update contract fixture dispositions** (verified-report-19 Finding 3, minimal correction here — enforcement wiring is Phase 24.1): in `tests/compatibility-examples/form-options-analytics-contract.ts`, change `onTabChange` (line 41), `onTabFirstVisit` (line 45), `onSubmissionPerformance` (line 51) → disposition `'restored'` with accurate reasons; `formOptions.onSubmitInvalid` (line 58) → `'restored'`; correct the factually wrong reasons on `resetOnSubmitSuccess`/`autoScroll` rows to reference the actual Phase 22.1 restoration / documented divergence.

**Inputs**:
- Read: `packages/formedible/src/lib/formedible/types.ts` (lines 360-470), `packages/formedible/src/hooks/use-formedible.tsx` (lines 75-100, 580-627), `packages/formedible/src/hooks/use-form-tabs.ts`, `packages/formedible/src/hooks/use-form-analytics.ts`
- Reference: `main:packages/formedible/src/hooks/use-formedible.tsx:660-890` (callback wiring), compat-report §3

**Outputs**:
- Modify: `packages/formedible/src/lib/formedible/types.ts`, `packages/formedible/src/hooks/use-formedible.tsx`, `packages/formedible/src/hooks/use-form-tabs.ts`, `packages/formedible/src/hooks/use-form-analytics.ts`, `tests/compatibility-examples/form-options-analytics-contract.ts`
- Modify: `tests/formedible/basic-fields.test.tsx` or `tests/formedible/phase10-behavior.test.ts` (assert tab analytics fire on tab switch; minimal `useFormedible({ fields: [] })` without `formOptions` compiles and renders)

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS.
- Full `test:formedible:*` battery PASS; `pnpm run test:formedible:types` PASS.

**Dependencies**: Phase 5 must complete successfully.

---

## Phase 7: Core CRITICALs — store reactivity (conditional pages/tabs, persistence autosave/restore, Form remount, isSubmitting)
**Type**: Sequential (formedible chain, step 5)

**Requirements** (dedup: verified-report-1 Findings 1/2/3/6 + verified-report-4 Findings 1/2/3 — same root cause, TanStack v1 `useForm` never re-renders the host):
- **Host values reactivity**: subscribe the `useFormedible` host to the form store values (e.g. `useStore(form.store, (state) => state.values)` from `@tanstack/react-store`, or an equivalent subscription) so `useMultiPage`/`useFormTabs` receive fresh `values` each render (`use-formedible.tsx:160-166`), making `visiblePages`/`visibleTabs`/`totalPages`/`progressValue` memos (`use-multi-page.ts:63`, `use-form-tabs.ts:32-35`) and the `goToNextPage`/`goToPreviousPage`/`changePage` closures (`use-multi-page.ts:88-102`) react to typing without needing a tab click / navigation / submit. Empirical expectations to satisfy: with page 2 conditional on `applicationType === 'individual'`, switching to individual makes page 2 visible and `Next` navigates 1→2 (currently skips to 3); the shipped `conditional-pages-form` example behaves correctly.
- **Persistence autosave on typing** (verified-report-4 Finding 2 / verified-report-1 Finding 2): the save effect (`use-form-persistence.ts:155-167`) depends only on render-time `[config, persistedValuesSignature, saveToStorage]`; typing changes none of them. Drive the signature/save scheduling from the live values subscription (Phase 7 host subscription or a dedicated store subscription inside `useFormPersistence`) so debounced saves fire while the user types (`debounceMs` honored).
- **Restore runs once** (verified-report-4 Finding 1): the restore effect (`use-form-persistence.ts:149-153`) re-runs on every host re-render because `loadFromStorage`'s deps include the whole inline `config` object (lines 115-139). Restore must happen exactly once per mount (ref guard keyed on the persistence config's substantive fields — key/storage/restoreOnMount/exclude — not object identity). Empirical expectations: typing then navigating pages must NOT revert values to the stored snapshot or snap the page back (flagship 3-page `persistence-form` demo currently reverts both).
- **Mount save must not clobber restored data** (verified-report-4 Finding 2 run B): the initial debounced save fires with pre-restore default values and overwrites storage (`storage after idle: {"name":""}` after restoring `Ada Lovelace`). Skip the save scheduled at mount until the first post-restore value change (dirty check vs the restored snapshot).
- **Stable `Form` identity** (verified-report-1 Finding 3, empirically reproduced): `function Form(...)` is redefined inside `useFormedible` (`use-formedible.tsx:552`), so every host re-render remounts the subtree and TanStack's `FieldApi` unmount cleanup wipes recorded field errors (errors vanish on first submit attempt / navigation). Hoist the Form component to module scope (stable identity) and pass per-render data through props/context (e.g. a context value held in a ref), preserving current DOM output.
- **Reactive `isSubmitting`** (verified-report-1 Finding 6): `Form` reads `form.state.isSubmitting` non-reactively (`use-formedible.tsx:553-554`); the fieldset (line 607) and submit buttons (lines 647-651) never disable during async submits and a double click spuriously fires invalid-submit UI. Subscribe the relevant scope (`form.Subscribe` selector including `isSubmitting`, or the host store subscription) so controls disable while submitting.

**Inputs**:
- Read: `packages/formedible/src/hooks/use-formedible.tsx` (lines 40-170, 395-430, 540-660), `packages/formedible/src/hooks/use-multi-page.ts`, `packages/formedible/src/hooks/use-form-tabs.ts`, `packages/formedible/src/hooks/use-form-persistence.ts`, installed `@tanstack/react-form@1.32.0` `useForm.js` + `@tanstack/react-store` `useStore`
- Reference: verified-report-1 (empirical renders counts), verified-report-4 (empirical storage traces)

**Outputs**:
- Modify: `packages/formedible/src/hooks/use-formedible.tsx`, `packages/formedible/src/hooks/use-multi-page.ts`, `packages/formedible/src/hooks/use-form-tabs.ts`, `packages/formedible/src/hooks/use-form-persistence.ts`
- Create: `tests/formedible/reactivity.test.tsx` (jsdom, real hook: (1) conditional page appears and Next targets it after typing, no nav needed; (2) typing schedules a debounced save (fake timers) and storage receives the typed value; (3) restore-once: type → navigate → values/page survive; (4) pre-seeded storage + restoreOnMount: mount save does not clobber; (5) invalid submit then host re-render keeps inline field errors visible; (6) submit button disabled while an async onSubmit is pending). Reuse an existing tsconfig pattern (e.g. `tsconfig.phase10.json`) — add a matching tsconfig + root script only if needed for the runner.

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS.
- FULL behavior battery: all `test:formedible:*` suites PASS (core wiring changed — no regressions in normalization 17, validation 8, basic-fields 34, section 5, advanced 14, ssr 1, nested 6, phase10 10).

**Dependencies**: Phase 6 must complete successfully.

---

## Phase 8: Submit lifecycle + hook misc
**Type**: Sequential (formedible chain, step 6)

**Requirements**:
- **No early return before `form.handleSubmit()`** (verified-report-1 Finding 4): the DOM `onSubmit` (`use-formedible.tsx:593-604`) manually checks `getInvalidFieldEntries` and returns, so TanStack's submit lifecycle (mark touched, `validateAllFields('submit')`, populate `fieldMeta`) never runs for the common invalid case and inline errors never appear. Always call `form.handleSubmit()`; move the summary computation + `autoNavigate` into the `onSubmitInvalid` path (lines 88-91) where `fieldMeta` is populated.
- **Handle `handleSubmit()` rejections** (verified-report-1 Finding 9): the three floating call sites (`use-formedible.tsx:130`, `:152`, `:604`) must attach `.catch` with a descriptive `console.error` (form-core re-throws consumer `onSubmit` errors — currently unhandled rejections).
- **`clearStorage` + analytics ordering** (verified-report-1 Finding 9): in the hook's `onSubmit` (lines 92-96), run the consumer's `onSubmit` first; only on success fire `analytics.trackFormComplete` and then `clearStorage()`; on failure keep the draft and do not report completion. (`clearStorage()` also stops being skipped when the consumer throws.)
- **`onReset` must reset values** (verified-report-1 Finding 11): the reset handler (`use-formedible.tsx:587-592`) fires callbacks/analytics but never calls `form.reset()`; add `form.reset()` before invoking consumer callbacks.
- **Clean `formOptions.onChange` values for nested paths** (verified-report-1 Finding 5): `getValuesWithFieldUpdate` (`use-formedible.tsx:134-136`, call site `:424-425`) spreads `{ ...values, 'contacts[0].email': value }` producing a bogus literal top-level key. Implement an immutable deep-set helper in `packages/formedible/src/lib/formedible/field-path.ts` (counterpart of `getValueAtFieldPath`) and use it so the delivered `value`/`formApi.state.values` objects have clean shapes for dotted/bracketed names.
- **Live abandon context** (verified-report-1 Finding 8): `abandonContextRef.current = getAbandonContext()` (`use-formedible.tsx:213-214`) freezes the completion snapshot at host render; store the function (as done one line above for `pageValidationStateRef`) so unmount-time `onFormAbandon` reads live state.
- **Section header dedup for non-string titles** (verified-report-1 Finding 10): `getSectionKey` (`use-formedible.tsx:363`) returns `undefined` for ReactNode titles so the header renders once per field (lines 463-467). Derive a stable key fallback (e.g. the section's ordinal position among sectioned fields) so exactly one header renders per section, including title-less sections enabled by F7 (Phase 6).

**Inputs**:
- Read: `packages/formedible/src/hooks/use-formedible.tsx` (lines 80-160, 200-260, 580-630), `packages/formedible/src/lib/formedible/field-path.ts`, `packages/formedible/src/hooks/use-form-persistence.ts` (clearStorage semantics)
- Reference: TanStack `FormApi._handleSubmit` semantics (verified-report-1 runtime facts)

**Outputs**:
- Modify: `packages/formedible/src/hooks/use-formedible.tsx`, `packages/formedible/src/lib/formedible/field-path.ts`
- Modify: `tests/formedible/validation/validation-pipeline.test.tsx` (inline errors appear after failed submit without editing; nested-path `onChange` payload has no literal bracket keys) and/or `tests/formedible/reactivity.test.tsx` from Phase 7

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS.
- Full `test:formedible:*` battery PASS.

**Dependencies**: Phase 7 must complete successfully.

---

## Phase 9: Field UX batch A — phone, autocomplete, rating
**Type**: Sequential (formedible chain, step 7)

**Requirements**:
- **Phone cleared-value garbage (verified-report-2 Finding 3, empirically confirmed both formats)**: clearing the input stores `'+1 ('` (international) or `'('` (national/default) because `formatPhone('', ...)` emits the leading literal (`phone-field.tsx:55-59, 118-136`); this non-empty garbage passes `required` and would be submitted. When the raw input contains no digits, commit `''` (and render empty), so `required` correctly fails on an effectively-empty field.
- **Phone country dropdown dismissal (verified-report-2 Finding 9)**: the country menu (`phone-field.tsx:40-99`) has no outside-click/Escape/blur dismissal — only the trigger toggle and item select close it. Add dismissal (pointerdown-outside + Escape), consistent with the shadcn `Popover` behavior used by `combobox-field.tsx`.
- **Autocomplete external-value sync (verified-report-3 Finding 8)**: `inputValue` is initialized once (`autocomplete-field.tsx:74`) and never re-synced with `field.value`, so resets/programmatic sets leave stale text. Sync from external `field.value` changes (effect keyed on `field.value`, guarded while the user is actively editing). Also fix `allowCustom: false` blur (`:170-176`): on blur with uncommitted custom text, revert the input to the selected option's label (or clear if none).
- **Rating half values (verified-report-3 Finding 9)**: with `allowHalf`, `x.5` renders byte-identical to `x+1` (`rating-field.tsx:30`) and `aria-checked={value === rating}` (`:39`) is never true for halves; half-hit-area buttons (`:49-59`) carry no radio semantics. Render a visually distinct half-fill for `.5` values (clip/gradient overlay) and give the half-step buttons proper `role="radio"` + `aria-checked` (e.g. full button checked when `value === rating`, half button checked when `Math.abs(value - halfRating) < epsilon`).

**Inputs**:
- Read: `packages/formedible/src/components/formedible/fields/phone-field.tsx`, `autocomplete-field.tsx`, `rating-field.tsx`, `combobox-field.tsx` (popover dismissal pattern)
- Reference: verified-report-2/3 empirical traces

**Outputs**:
- Modify: `packages/formedible/src/components/formedible/fields/phone-field.tsx`, `autocomplete-field.tsx`, `rating-field.tsx`
- Modify: `tests/formedible/advanced-fields.test.tsx` (cleared phone → `''`; half rating visual/aria assertions; autocomplete reset sync)

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS; `test:formedible:advanced-fields` + `:ssr` PASS; full battery PASS.

**Dependencies**: Phase 8 must complete successfully.

---

## Phase 10: Field UX batch B — duration, color, multi-select
**Type**: Sequential (formedible chain, step 8)

**Requirements**:
- **Duration text entry (verified-report-3 Finding 1)**: the text input's value is `formatDurationText(parseDuration(field.value))` recomputed per change (`duration-picker-field.tsx:19, 37-44`), so intermediate text (`"1"`) parses to `{0,0,0}` and is rewritten to `"0"` — typing is impossible. Introduce local draft state: while focused/editing, display the raw draft; commit `parseDurationText` to `field.onChange` only when the draft parses to a changed valid duration (or on blur); revert invalid drafts on blur.
- **Duration unit mismatch for `hours`/`minutes` formats (verified-report-3 Finding 2)**: `parseDuration` (`:80-81`) treats every bare number as total seconds, but `formatDurationOutput` (`:127-133`) emits hours/minutes for those formats — selects snap back and follow-up edits corrupt the stored value. Make parsing unit-aware: for `format: 'hours'` a bare number is hours; `'minutes'` → minutes; `'seconds'`/object formats unchanged (main parity: `main:.../duration-picker-field.tsx:42-56`).
- **Duration stray Seconds select (verified-report-3 Finding 3)**: unit gating uses `format.includes('h'/'m'/'s')` (`:33-35, 111-119`), so `'hours'`/`'minutes'` (containing `'s'`) render a stray Seconds select and an `Ns` text segment. Gate on explicit unit sets: `hours→{h}`, `minutes→{m}`, `hms→{h,m,s}`, `hm→{h,m}`, `ms→{m,s}`, `seconds→{s}` (also in `formatDurationText`).
- **Color picker text input (verified-report-3 Finding 4)**: the controlled value is `formatColor(normalizeHex(field.value))` (fallback `#000000`) while `onChange` commits raw text (`color-picker-field.tsx:13-15, 41-50`) — typing is destroyed (`'#'` → re-renders `'#000000'`) and stored values can diverge from display (`'zzz'` stored while UI shows `#000000`). Use draft state while editing; commit normalized color on valid input/blur; reject/flag invalid values instead of silently storing them.
- **Multi-select nested buttons (verified-report-3 Finding 7)**: badge remove actions are real `<button>`s inside the trigger `<button>` (`multi-select-field.tsx:65-100`) — invalid HTML causing hydration failures for SSR consumers. Replace the inner remove buttons with non-interactive-element triggers carrying `role="button"`, `tabIndex={0}`, and keyboard handlers (stopPropagation on click), or restructure the trigger to a non-button element with combobox semantics.

**Inputs**:
- Read: `packages/formedible/src/components/formedible/fields/duration-picker-field.tsx`, `color-picker-field.tsx`, `multi-select-field.tsx`
- Reference: `main:packages/formedible/src/components/formedible/fields/duration-picker-field.tsx:42-56` (unit semantics), verified-report-3 empirical round-trip traces

**Outputs**:
- Modify: `packages/formedible/src/components/formedible/fields/duration-picker-field.tsx`, `color-picker-field.tsx`, `multi-select-field.tsx`
- Modify: `tests/formedible/advanced-fields.test.tsx` (duration typing "1h 30m" via per-keystroke events; hours-format select round-trip; no stray Seconds select for hours/minutes; color draft typing; multi-select SSR render — extend `advanced-fields-ssr-import.test.tsx` if needed)

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS; `test:formedible:advanced-fields` + `:ssr` PASS; full battery PASS.

**Dependencies**: Phase 9 must complete successfully.

---

## Phase 11: Field UX batch C — location, file upload + dynamic-text array paths
**Type**: Sequential (formedible chain, step 9)

**Requirements**:
- **Location results dismissal (verified-report-4 Finding 4)**: `showResults` is only ever set false inside `selectLocation` (`location-picker-field.tsx:18, 39, 66, 115, 123-131`); add blur/Escape/outside-pointerdown dismissal (mind the click-vs-blur race on result selection — prefer pointerdown-outside).
- **File rejection feedback (verified-report-4 Finding 5)**: `setFiles` silently slices `maxFiles` and filters `maxSize` (`file-upload-field.tsx:15-22`); rejected files vanish with zero feedback (single-file mode yields `null`). Add `onFilesRejected?: (rejections: { file: File; reason: 'maxSize' | 'maxFiles' }[]) => void` to `FormedibleFileConfig` (`types.ts:649-657`) AND render an inline error message in the component listing the rejected file names/reasons (no `alert`/`confirm`).
- **File list unique keys (verified-report-4 Finding 7)**: `key={\`${file.name}-${file.size}\`}` (`:51`) collides for same name+size; key by index within the accepted list (stable within a selection batch).
- **Dynamic text array-index paths (verified-report-2 Finding 10)**: the interpolation regex `/\{\{\s*([\w.]+)\s*\}\}/g` cannot capture brackets, so `{{items[0].name}}` renders verbatim (`packages/formedible/src/lib/formedible/dynamic-text.ts`). Extend the pattern to accept bracket segments (e.g. `[\w.$[\]]+` normalized) and resolve via the existing `getValueAtFieldPath`, which already supports `items[0].name`.

**Inputs**:
- Read: `packages/formedible/src/components/formedible/fields/location-picker-field.tsx`, `file-upload-field.tsx`, `packages/formedible/src/lib/formedible/dynamic-text.ts`, `packages/formedible/src/lib/formedible/field-path.ts:19-58`, `packages/formedible/src/lib/formedible/types.ts:649-657`
- Reference: verified-report-2/4 empirical checks

**Outputs**:
- Modify: `packages/formedible/src/components/formedible/fields/location-picker-field.tsx`, `file-upload-field.tsx`, `packages/formedible/src/lib/formedible/dynamic-text.ts`, `packages/formedible/src/lib/formedible/types.ts`
- Modify: `tests/formedible/advanced-fields.test.tsx` (rejection feedback, keys) and `tests/formedible/phase10-behavior.test.ts` (dynamic-text bracket interpolation via real `resolveDynamicText`)

**Validation Criteria**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS; full `test:formedible:*` battery PASS.

**Dependencies**: Phase 10 must complete successfully.

---

## Phase 12: Parser A — string-literal-aware sanitization
**Type**: Sequential

**Requirements** (all in `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`; every finding empirically reproduced in verified-report-5):
- **Identifier nulling corrupts string content (Finding 2)**: `sanitizeCode` (line 223, applied at line 999) nulls `document|window|globalThis|global|process|__proto__|constructor|prototype` inside string literals (`"Close the window"` → `"Close the null"`). Make the transform string-literal aware: tokenize single/double/template-quoted regions and skip identifier nulling inside them.
- **Executable-syntax guard false positives (Finding 3)**: `assertNoExecutableSyntax` (line 186, applied at 998/1009) rejects `label: "key => value"`, `"VAT <Included> applies"`, `"e.g. eval(x) pattern"`. Same literal-awareness: only scan code outside string literals. Genuine executable content outside strings (`new Evil()`, `() => process.exit(1)`, `require('fs')`) must still be rejected (existing tests pin these).
- **Object-literal fallback (Finding 4)**: three string-unaware transforms break valid configs with `SYNTAX_ERROR`: quote flip `(?<!\\)'` → `"` (line 328) corrupts `"Don't stop"`; `//` comment stripping (in `sanitizeCode`, line 221) truncates `"https://example.com/a//b"`; `\'` survives as an illegal JSON escape after the flip (`'It\'s fine'`). Perform all three only outside string literals.
- **Field-name validation (Finding 9)**: `sanitizeField` (lines 572-574) accepts empty-string names and `__proto__` names became `"null"` via Finding 2. Reject empty/whitespace-only names with a coded `ParserError` (e.g. `MISSING_REQUIRED_FIELD` or a new `INVALID_FIELD_NAME` code consistent with the existing taxonomy); with literal-aware sanitization, `__proto__` as a field name must be either preserved verbatim or rejected with a clear code — recommend rejection (prototype-pollution hazard as an object key).

**Inputs**:
- Read: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` (lines 180-430, 990-1010), `packages/formedible-parser/src/lib/formedible/formedible-parser.test.ts`
- Reference: verified-report-5 empirical repro commands

**Outputs**:
- Modify: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`, `formedible-parser.test.ts` (new cases: strings containing sensitive identifiers, arrows/JSX-like/eval text, apostrophes/URLs/escaped quotes, empty + `__proto__` names; genuine executable content still rejected)

**Validation Criteria**:
- `pnpm --filter @formedible/formedible-parser run test` PASS; `pnpm --filter @formedible/formedible-parser run check-types` PASS; `node scripts/quick-sync.js`; `pnpm run check-types` PASS.

**Dependencies**: Phase 2 must complete successfully (independent of the formedible chain).

---

## Phase 13: Parser B — structural fixes
**Type**: Sequential

**Requirements** (same file; verified-report-5):
- **`parseStructured` rejects direct structured configs (Finding 1)**: `pickStructuredCandidate` (lines 415-429) unwraps `formOptions` — a required member of `ParsedFormConfig` — so a compliant direct config fails `INVALID_FIELDS`. Remove `formOptions` from the envelope keys (keep `formedible`/`config` unwrapping). A parser round-trip (`parseStructured(parse(cfg))`) must succeed.
- **Unbounded recursion + dead `maxNestingDepth` (Finding 5)**: recursive sanitizers overflow the stack (~2,000 depth string path, ~5,000 structured) leaking an uncoded `RangeError`, and the advertised `maxNestingDepth: 50` (`parser-config-schema.ts`) is enforced nowhere. Enforce the configured depth in the recursive walks (sanitizeDefaultValue/cloneJsonValue et al.) throwing a coded `ParserError`; map residual `RangeError` to the same coded error in `parse`/`parseStructured`; `parseAiOutput`/`validateConfig` surface the coded message.
- **Page numbering off-by-one (Finding 6)**: `sanitizePages` uses raw `index` (line 778) while `normalizeAiGeneratedPage` uses `index + 1` (line 728), so `fields`+`pages` together produce 0-based pages and fields land on the wrong page. Make both 1-based.
- **Allowlisted class-name keys dropped (Finding 7)**: `fieldClassName`/`labelClassName`/`buttonClassName`/`submitButtonClassName` pass strict key validation (lines 97-100) but no copy branch handles them (line 842 copies only `formClassName`). Add them to the string-copy branch (these options are restored on the formedible side in Phase 22.1; parser must pass them through).
- **[DECISION D5 — dead `EnhancedParserOptions` (Finding 8)]**: `baseSchema`/`mergeStrategy`/`predefinedHandlers` are accepted but never consumed. **Recommended**: consume `baseSchema` + `mergeStrategy` in `validateAndSanitize` by invoking the existing `mergeSchemas` static (lines 1093-1131) when `baseSchema` is provided; keep `predefinedHandlers` as a documented reserved no-op (JSDoc) OR remove it from the public type — recommend document-as-reserved to avoid another breaking type change.

**Inputs**:
- Read: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts` (lines 340-430, 560-580, 720-790, 830-850, 990-1131), `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts`
- Reference: verified-report-5 empirical repro outputs

**Outputs**:
- Modify: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`, `formedible-parser.test.ts` (round-trip direct config; depth-limit error code; 1-based pages with both `fields`+`pages`; class-name passthrough; baseSchema merge)

**Validation Criteria**:
- `pnpm --filter @formedible/formedible-parser run test` PASS; check-types (parser + full) PASS after quick-sync.

**Dependencies**: Phase 12 must complete successfully (same file).

---

## Phase 14: Builder libs — store integrity + code generation
**Type**: Parallel

### 14.1: FieldStore + FormBuilder effects
**Requirements** (verified-report-6):
- **Colliding field names (Finding 1)**: `addField` derives names from `fieldOrder.length + 1` (`packages/builder/src/lib/formedible/field-store.ts:22`) — delete-then-add produces duplicates (`[field_1, field_3, field_3]`); `duplicateField` suffixes `_copy` without uniquing (`:95`); `updateField` accepts colliding renames (`:38-52`). Fix: derive new names from the set of names in use (first unused `field_N`); dedupe `_copy` suffixes (`_copy_2`, …); on rename collision, throw a descriptive `Error` (no silent corruption — duplicates break preview values and emit uncompilable code, TS1117).
- **initialFields re-import effect (Finding 2)**: `form-builder.tsx:50-52` re-runs `importFields(importedInitialFields)` on every array-identity change; `importFields` destructively resets and always notifies (`field-store.ts:143-157`). Add a deep-equality guard (structural compare against the current snapshot) and skip re-import when unchanged, so inline arrays don't wipe user edits.
- **onChange effect deps (Finding 3)**: `useEffect(() => onChange?.(metadata, fields), [fields, metadata, onChange])` (`form-builder.tsx:54-56`) re-fires per parent render with inline callbacks (the README's own documented pattern, `packages/builder/README.md:82`) and can loop with unconditional `setState`. Use a latest-callback ref; deps become `[fields, metadata]`.
- **Shared global store (Finding 4)**: `globalFieldStore` is a module singleton (`field-store.ts:250`) and every `FormBuilder` mount re-imports its `initialFields ?? []`, so a second instance wipes the first. **[DECISION D6]**: **Recommended**: `FormBuilder` creates a per-instance store (`useRef`) by default; keep `globalFieldStore` exported and add an opt-in (prop or exported hook) for the global instance; document in `packages/builder/README.md`. Alternative: keep singleton + document single-instance limitation (not recommended — silent data loss). Default if no veto: per-instance default.

**Outputs**:
- Modify: `packages/builder/src/lib/formedible/field-store.ts`, `packages/builder/src/components/formedible/builder/form-builder.tsx`, `packages/builder/README.md`
- Create/modify: `packages/builder/src/lib/formedible/field-store.test.ts` (add/delete/add uniqueness; duplicate uniquing; rename collision throws; deep-equal re-import no-op)

**Validation**:
- `pnpm --filter @formedible/builder run test` PASS; check-types PASS; quick-sync; `pnpm run check-types` PASS.

### 14.2: Code generation + config transforms
**Requirements** (verified-report-6):
- **Raw `field.name` interpolation (Finding 5)**: `packages/builder/src/lib/formedible/code-generation.ts:217` interpolates names unescaped into the `z.object({...})` literal — `First Name`/`first-name` produce invalid TS and crafted names inject schema source (verified: `a: z.string(), backdoor: z.any(), b` yields valid injected TS). Always emit keys via `JSON.stringify(field.name)` (quoted-key form is valid TS for any string) or quote only when the name is not a valid identifier; reject names containing line breaks. The Name input itself may additionally validate to identifier-ish characters, but the generator must be safe regardless (defense in depth).
- **Array schema ignores `itemType` (Finding 6)**: `code-generation.ts:84-86` always emits `z.array(z.string())` while the builder serializes `arrayConfig.itemType` (`builder-config-registry.ts:414-424`) and the runtime renders number/checkbox/object item inputs (`array-field.tsx:27-43`). Map: `string|text|email → z.string()` (email may use `z.email()` per zod 4), `number → z.number()`, `checkbox|switch → z.boolean()`, `object → z.record(z.string(), z.unknown())`.
- **Object-field edits strip nested configs (Finding 7)**: `nestedFieldsValue` (`builder-config-registry.ts:642-655`) maps nested fields to exactly `{name, type, label, placeholder}`, dropping `options`, `required`, `disabled`, `description`, nested `arrayConfig`/`objectConfig` on every unrelated keystroke (`:426-436` → `field-configuration-form.tsx:27-29`). Preserve the existing nested field config objects and override only the edited keys (spread-merge against the current stored nested field).

**Outputs**:
- Modify: `packages/builder/src/lib/formedible/code-generation.ts`, `packages/builder/src/lib/formedible/builder-config-registry.ts`
- Modify/Create: `packages/builder/src/lib/formedible/code-generation.test.ts` (quoted keys for spaced/hyphenated names; injection payload yields quoted inert key; itemType mappings; nested-config preservation)

**Validation**:
- `pnpm --filter @formedible/builder run test` PASS; check-types PASS.

**Phase-level Validation**:
- Both sub-phases pass individually; phase-wide validator confirms no interface drift between `field-store.ts`, `form-builder.tsx`, and `code-generation.ts`; `node scripts/quick-sync.js` + `pnpm run check-types` PASS; `pnpm run build` PASS.

**Dependencies**: Phase 2 must complete successfully.

---

## Phase 15: AI builder UI — conversation routing, lifecycle, memoization
**Type**: Parallel

### 15.1: ChatInterface + AIBuilder state integrity
**Requirements** (verified-report-7):
- **Cross-conversation streaming corruption (Finding 1, HIGH)**: stream flushes call `onMessagesChange(displayedMessages)` with no conversation id (`chat-interface.tsx:120-141`) and `updateMessages` routes via `currentConversationIdRef.current` at flush time (`ai-builder.tsx:181-193`), so switching/creating/deleting conversations mid-stream corrupts the target conversation (wholesale message replacement, persisted) or silently undoes the user's selection. Route flushes to the conversation the submission belongs to: capture `conversationId` at submit (it is already destructured at `chat-interface.tsx:89` and used only for the API request at `:149`) and pass it through every `onMessagesChange` call (change the callback signature to `(conversationId: string, messages: AiChatMessage[])` and update `updateMessages`/`upsertConversation` routing to target that id; if the target was deleted, drop the flush). Add a regression test mirroring verified-report-7's empirical trace (select B while A streams → B unchanged; New conversation while streaming → selection stays).
- **No abort on unmount (Finding 2)**: `chat-interface.tsx` has no `useEffect`; the per-submission `AbortController` (lines 129-130) is only aborted via the Stop button (`:255`). Add an unmount effect aborting the active controller (`abort('component unmounted')` — `streamAiResponse` converts aborts into a `finish: 'abort'` event, `ai-generation.ts:96-97,308-328`) and cancelling pending scheduler flushes.
- **Unstable `parserConfig` prop (Finding 4)**: `aiParserConfig = toAiParserConfig(parserConfig)` is recomputed every render (`ai-builder.tsx:103`) and `AiFormRenderer`'s effect deps are identity-sensitive (`ai-form-renderer.tsx:34-42`), forcing a full `FormedibleParser.parse` per stream flush. Memoize `aiParserConfig` (and `systemPrompt`) with `useMemo` keyed on `parserConfig`.
- **Impure state updaters (Finding 6)**: `setConversations` updaters call `setCurrentConversationId`, mutate `currentConversationIdRef`, and `persistConversations` (localStorage write) inside the updater body (`ai-builder.tsx:181-193, 211-223`). Make updaters pure: compute the next state purely; perform selection/ref/persistence side effects after commit (in the enclosing handler once the new value is computed).

**Outputs**:
- Modify: `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`, `ai-builder.tsx`, `ai-form-renderer.tsx` (only if props change)
- Modify: `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts` (routing regression), `ai-storage.ts` only if `upsertConversation` needs an explicit-id path

**Validation**:
- `pnpm --filter @formedible/ai-builder run test` PASS; check-types PASS.

### 15.2: Settings inputs + render memoization
**Requirements** (verified-report-7):
- **Custom-instructions trim (Finding 3)**: `parser-settings.tsx:99` trims on every keystroke (`event.target.value.trim()`), making spaces untypable. Keep the textarea value untrimmed while editing; trim at consumption (`generateSystemPrompt` already pushes it verbatim — trim there or on blur-commit; `validateParserConfig`/`mergeParserConfig` accept any string).
- **Numeric input normalization (Finding 5)**: `agent-settings.tsx:149,153,159` re-derives controlled values through `parseOptionalNumber` per keystroke — typing `0.` reports `''` (WHATWG number-input sanitization) and wipes the `0`; `parseNumber`'s fallback is dead code (`Number('') === 0`, `parser-settings.tsx:19-22`) so empty commits `0` and "Maximum code length: 0 characters" reaches the system prompt. Use draft-string local state committing parsed numbers only on valid input; on blur normalize; clamp to the documented min (`temperature >= 0`, `maxCodeLength >= 1`) at commit so `0`/out-of-range values cannot be committed.
- **Markdown re-parse per flush (Finding 7)**: `ChatMessages`/`MarkdownMessage` are unmemoized (`chat-messages.tsx:39-73`, `markdown-message.tsx:120-128`) and installed `react-markdown@10.1.0` re-parses synchronously on every render — during streaming all history re-parses at ~60Hz. Wrap `MarkdownMessage` in `React.memo` (stable `content` string prop) and memoize the message list rendering.

**Outputs**:
- Modify: `packages/ai-builder/src/components/formedible/ai/parser-settings.tsx`, `agent-settings.tsx`, `chat-messages.tsx`, `markdown-message.tsx`
- Modify: `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts` (settings commit behavior)

**Validation**:
- `pnpm --filter @formedible/ai-builder run test` PASS; check-types PASS.

**Phase-level Validation**:
- `node scripts/quick-sync.js` + `pnpm run check-types` PASS; `pnpm run build` PASS; phase-wide validator reads all five files together (callback signature changes consistent across chat-interface ↔ ai-builder ↔ tests).

**Dependencies**: Phase 2 must complete successfully (2.1 edits `ai-builder.tsx` imports first).

---

## Phase 16: AI libs — Anthropic browser access, request validity, persistence integrity
**Type**: Parallel

### 16.1: Adapters + model catalog
**Requirements** (verified-report-8):
- **Anthropic unusable in browsers (Finding 1, HIGH)**: `createAnthropicChat(model, apiKey)` is called without config (`packages/ai-builder/src/lib/formedible/ai-adapters.ts:75-77`); the SDK constructor throws in browser environments without `dangerouslyAllowBrowser` (verified against installed `@anthropic-ai/sdk@0.71.2`), and the error is masked by `normalizeAiError` as an auth-flavored message. Pass `{ dangerouslyAllowBrowser: true }` as the third argument (`createAnthropicChat(model, apiKey, config)` — `AnthropicTextConfig extends ClientOptions` declares the flag; it also enables the required CORS header).
- **temperature + extended thinking → API 400 (Finding 3)**: `ai-generation.ts:285` sends `temperature: providerSettings.temperature` (default `0.7`, `provider-selection.tsx:37`) unconditionally while thinking is enabled whenever `thinkingBudgetTokens > 0` (`ai-adapters.ts:85-94`); Anthropic rejects any temperature ≠ 1 with thinking. Omit `temperature` from the request options when thinking is enabled (adapter does not guard this — verified in installed `@tanstack/ai-anthropic` source).
- **Model-catalog preflight CORS (Finding 4)**: `fetchAnthropicModels` sends only `anthropic-version` + `X-Api-Key` (`ai-model-catalog.ts:165-170`); the preflight is rejected (live-verified HTTP 400 `Disallowed CORS origin`). Add the `'anthropic-dangerous-direct-browser-access': 'true'` header to the Anthropic fetch (live-verified: with the header the preflight returns 200 + `access-control-allow-origin: *`).

**Outputs**:
- Modify: `packages/ai-builder/src/lib/formedible/ai-adapters.ts`, `ai-generation.ts`, `ai-model-catalog.ts`
- Modify: `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts` (adapter constructed with the browser flag; temperature omitted when thinking on; catalog headers)

**Validation**:
- `pnpm --filter @formedible/ai-builder run test` PASS; check-types PASS.

### 16.2: Storage redaction, stream-event bloat, quota signal
**Requirements** (verified-report-8):
- **Redaction corrupts formConfig (Finding 2, HIGH)**: `parsePersistence` unconditionally replaces `persistence.key` with `'[REDACTED]'` (`ai-storage.ts:1290`), secret-named `defaultValues` keys are overwritten (`ai-safe-persistence.ts:226-247, 269-280`), and schema strings are mangled by `redactSecretString` (`ai-safe-persistence.ts:282-287`; round-trip: `'z.object({ token: z.string() })'` → `'z.object({ token=[REDACTED]]) })'`). `sanitizeConversationForPersistence` and `sanitizeConversationForExport` are byte-identical wrappers (lines 1345-1351) — the split was never implemented. **[DECISION D7]**: **Recommended**: implement the split — the PERSISTENCE path (self-hosted localStorage) preserves `formConfig` integrity (verbatim `persistence.key`, `defaultValues`, `schema` — restored forms must keep working; keep redaction for message `content`/`rawContent`/`thinking` secrets); the EXPORT path keeps full redaction including formConfig. Alternative: redact both + allowlist `persistence.key` only (still breaks restored `defaultValues.password` defaults — not recommended).
- **Per-token event bloat + silent quota failure (Finding 5)**: every normalized stream event incl. accumulated `raw` chunks is persisted under one shared key (`chat-interface.tsx:174`, `ai-storage.ts:533,545`, `ai-safe-persistence.ts:152-158`) — a 4KB generation measured 2.95MB persisted (~60% of the 5MB quota; quadratic bloat), and `writeJson` swallows `QuotaExceededError` (`ai-storage.ts:136-146`). **[D7 sub-point]**: **Recommended**: stop persisting per-token events — persist only final message content + a compact summary (event counts/usage); strip `raw` from any retained events. Make `writeJson` return success and log a descriptive `console.error` (once per key) on quota failure so persistence failure is observable. Alternatives: cap retained events (still grows) — not recommended.
- Default if no veto: recommended options.

**Outputs**:
- Modify: `packages/ai-builder/src/lib/formedible/ai-storage.ts`, `ai-safe-persistence.ts`, `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx` (only if the events payload shape changes at the producer — coordinate with Phase 15.1's rewrite of the same file: this sub-phase must not run until 15.1 is merged if both touch `chat-interface.tsx`; the phase-wide validator checks consistency)
- Modify: `packages/ai-builder/src/lib/formedible/ai-storage.test.ts`, `ai-builder.test.ts` (round-trip: persistence.key/defaultValues/schema intact after persist+read; export still redacts; quota failure logged and non-fatal; events not persisted)

**Validation**:
- `pnpm --filter @formedible/ai-builder run test` PASS; check-types PASS.

**Phase-level Validation**:
- `node scripts/quick-sync.js` + `pnpm run check-types` PASS; `pnpm run build` PASS; phase-wide validator reads 16.1 + 16.2 together (no conflicting edits to shared files; `chat-interface.tsx` conflicts resolved sequentially: 15.1 → 16.2).

**Dependencies**: Phase 15 must complete successfully (shared `chat-interface.tsx`).

---

## Phase 17: ai-picker behavior fixes
**Type**: Sequential

**Requirements** (verified-report-9; after Phase 2.1's portability rewrite of the same files):
- **Provider-switch stale catalog (Finding 1)**: `effectiveCatalog` falls back to `fetchedCatalog` without checking `fetchedCatalog.provider` (`ai-picker.tsx:113-116`); nothing resets it on provider switch, and the previous provider's API key is re-labeled under the new provider (`valuesToSecrets`, `:37-42`). Key fetched catalogs by provider (`Record<AIProvider, ProviderModelCatalog>`) or clear on switch; `effectiveCatalog` only uses a catalog whose `provider` matches. Clear/mask stale `fetchedAt`/`error` text for mismatched providers.
- **Dead props (Finding 4)**: `providerConfigs` and `onClearStoredSecrets` are declared in `AiPickerProps` but never destructured (`ai-picker.tsx:73-87`); the real host already passes `onClearStoredSecrets` (`packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:276`) and it is silently dropped. Wire both: panel uses `providerConfigs ?? defaultProviderConfigs`; add a "clear stored secrets" affordance calling `onClearStoredSecrets`.
- **Controlled-mode latch (Finding 5)**: `isControlled = useRef(settingsProp !== undefined && secretsProp !== undefined)` (`:88, 96-97`) requires BOTH props and ignores late-arriving props forever. Re-derive per render; support partially-controlled usage (settings-controlled when `settingsProp` defined, secrets-controlled when `secretsProp` defined — matching the independently-optional prop types).
- **Refresh error swallowed + catalog wipe (Finding 7)**: `.catch(() => setFetchedCatalog(undefined))` (`:135-147`) discards the error and a valid previous catalog although `ProviderModelCatalog` has a first-class `error` field the panel renders (`ai-picker-panel.tsx:98`, type `:59`). On rejection, set an error-bearing catalog for the current provider (preserve the previous models/`fetchedAt` when available).
- **Custom schema fields hardcoded empty (Finding 2)**: fallback branches render `value=""`/`checked={false}` (`ai-picker-panel.tsx:264, 281, 300`) so custom fields never display state, and `valuesToSettings`/`valuesToSecrets` drop custom keys (`ai-picker.tsx:120-133`). Bind fallback inputs to `values[field.name]` and preserve custom keys through the values round-trip (carry a `customValues` record alongside the typed settings).
- **`new Function` conditional eval (Finding 3)**: `evaluateConditional` compiles schema strings via `new Function('values', ...)` with the full values object (incl. `apiKey`) in scope (`ai-picker-panel.tsx:45-56`), diverging from the core package's safe field-path semantics. Replace with a field-path evaluator (port the `getValueAtFieldPath` truthiness semantics from `packages/formedible/src/lib/formedible/field-path.ts` into `packages/ai-picker/src/lib/` — no cross-package import); malformed conditionals log a descriptive `console.error` instead of silent `catch → false`.
- **`autoComplete` (Finding 6)**: change the API-key input's `autoComplete="off"` to `autoComplete="new-password"` (`ai-picker-panel.tsx:142-148`).

**Inputs**:
- Read: `packages/ai-picker/src/components/ai-picker/ai-picker.tsx`, `ai-picker-panel.tsx`, `model-autocomplete-field.tsx`, `packages/ai-picker/src/lib/ai-picker-types.ts`, `packages/ai-picker/src/lib/ai-picker-utils.ts`, `packages/ai-picker/src/lib/ai-picker.test.ts` (test location per package test glob)
- Reference: `packages/formedible/src/lib/formedible/field-path.ts` (safe path evaluation)

**Outputs**:
- Modify: `packages/ai-picker/src/components/ai-picker/ai-picker.tsx`, `ai-picker-panel.tsx`, `packages/ai-picker/src/lib/ai-picker-types.ts` (customValues typing if needed)
- Create: `packages/ai-picker/src/lib/conditional-path.ts` (field-path evaluator)
- Modify: ai-picker tests (provider-switch catalog invalidation; custom field interactivity; refresh rejection surfaces error; controlled partial props)

**Validation Criteria**:
- `pnpm --filter @formedible/ai-picker run test` PASS; `pnpm --filter @formedible/ai-builder run test` PASS (host wiring); `node scripts/quick-sync.js` + `pnpm run check-types` PASS.

**Dependencies**: Phase 2.1 must complete successfully (same files rewritten there). Recommended after Phase 15/16 to avoid sync churn.

---

## Phase 18: Sync engine hardening
**Type**: Sequential

**Requirements** (verified-report-10):
- **Alias rewrite corrupts non-import content (Finding 1, HIGH)**: `rewriteModuleSpecifiers` (`scripts/quick-sync.js:219`, regex at `:139-222`) rewrites any `from '@/...'` in raw text including template literals/strings/comments — live instance: `packages/builder/src/lib/formedible/code-generation.ts:265` embeds a sample import in a template literal that becomes `'@formedible/ui/components/formedible/hooks/use-formedible'` in `packages/ui/src/components/formedible/lib/code-generation.ts:265`, so the hosted builder emits code importing an unpublished private path (verified end-to-end via `apps/web` → `CodeGenerator`). Replace the regex transform with an AST-scoped one (parse with the `typescript` API exactly as `scripts/validate-sync-boundaries.js:60-91` does; rewrite only `ImportDeclaration`/`ExportDeclaration` module specifiers and `import()` call expressions). After the fix + re-sync, `packages/ui/src/components/formedible/lib/code-generation.ts:265` must contain the original `'@/components/formedible/hooks/use-formedible'` (matching `packages/builder/public/r/form-builder.json`).
- **Containment check (Finding 5)**: `resolveSyncTargetPath` (`quick-sync.js:105-119`) returns targets verbatim and `join` normalizes `..` — a manifest target `@ui/../../../victim/escaped.ts` writes outside `packages/ui/src/components` (live-proven with the real script). Assert `resolve(targetPath).startsWith(resolve(destinationRoot) + sep)` for both branches before writing; throw a descriptive error otherwise.
- **build-registries Windows spawn (Finding 4)**: `spawn('pnpm', [...], { shell: false })` (`scripts/build-registries.js:42-46`) cannot launch `pnpm.cmd` on Windows and stale `public/r/*.json` are deleted before the doomed build (`:67-70`). Use `shell: process.platform === 'win32'`.
- **Close the contract-test gap (Finding 3)**: add a fixture to `tests/sync/copy-only-sync.test.ts` with `from '@/...'` embedded in a template literal, a plain string, and a comment, asserting they are NOT rewritten (the current suite only covers real import statements, which is why Finding 1 shipped green).

**Inputs**:
- Read: `scripts/quick-sync.js` (lines 100-320), `scripts/validate-sync-boundaries.js:60-91` (AST pattern), `scripts/build-registries.js:42-70`, `tests/sync/copy-only-sync.test.ts`, `packages/builder/src/lib/formedible/code-generation.ts:265`
- Reference: `tests/architecture/copy-only-sync-contract.test.ts:109-140` (sanctioned specifier-only rewrite)

**Outputs**:
- Modify: `scripts/quick-sync.js`, `scripts/build-registries.js`, `tests/sync/copy-only-sync.test.ts`
- Regenerate: `packages/ui/src/components/formedible/**` via `node scripts/quick-sync.js`

**Validation Criteria**:
- `pnpm run test:sync` PASS (incl. new fixture).
- `node scripts/quick-sync.js` twice → idempotent; `git diff` shows only specifier-import lines changed vs pre-AST state; the template-literal sample at `packages/ui/.../lib/code-generation.ts:265` retains `@/components/...`.
- `pnpm run check-types` + `pnpm run build` PASS.

**Dependencies**: Phase 2 must complete successfully. Run after Phases 14–17 to minimize re-sync churn.

---

## Phase 19: Release + alias-loader scripts
**Type**: Sequential

**Requirements** (verified-report-11):
- **Release rerun trap (Finding 1)**: `updateRootVersion` requires strictly-greater semver (`scripts/build-release.js:348-350`), the bump persists in `--no-publish` mode and after mid-flow failures (only `writeFile` of `package.json` is at `:352-353`), the dirty-file guard explicitly tolerates a dirty bumped `package.json` (`:426-452`) — and then the version check rejects exactly that state, so the documented "rerun the full command" recovery can never succeed for the same version. **[Minor DECISION]**: **Recommended**: make the same-version rerun idempotent — when the current root version already equals `--release` and the only dirty deploy-affecting file is `package.json` at the target version, skip the bump and proceed instead of throwing; keep strictly-greater for all other cases. Update the failure message accordingly. (Alternative: keep strictness, fix only the message — not recommended.)
- **Alias-loader order dependence (Finding 2)**: `packageRoots.find((root) => parentPath.startsWith(root))` (`scripts/package-alias-loader.mjs:33`) matches `packages/formedible` as a prefix of `packages/formedible-parser`; only undocumented array order prevents silent cross-tree misresolution (empirically demonstrated: reordered array resolves parser `@/lib/utils` to the formedible tree with `shortCircuit: true`). Use segment-aware matching: `parentPath === root || parentPath.startsWith(root + sep)`.

**Inputs**:
- Read: `scripts/build-release.js` (lines 130-145, 172-242, 340-360, 420-470, 540-670), `scripts/package-alias-loader.mjs`, `docs/shadcn-build-release-plan.md` (design intent)
- Reference: verified-report-11 empirical reorder proof

**Outputs**:
- Modify: `scripts/build-release.js`, `scripts/package-alias-loader.mjs`
- Modify/Create: a small node:test for the loader resolution if a scripts test location exists; otherwise validate empirically (below)

**Validation Criteria**:
- `node -e` resolution probes through `register-package-alias-loader.mjs` resolve parser-parent `@/lib/utils` to `packages/formedible-parser/src/lib/utils.ts` with BOTH array orders (temporarily reorder in a scratch copy).
- `node scripts/build-release.js --no-publish --release <current-version>` no longer throws for the already-bumped state (dry inspection; do not publish, do not push).

**Dependencies**: Phase 2 must complete successfully (independent; low priority — schedule late).

---

## Phase 20: Web app — navigation shell + SEO head integrity
**Type**: Parallel

### 20.1: Shell links + clipboard feedback
**Requirements**:
- **Raw `<a>` nav (verified-report-13 Finding 1)**: `apps/web/src/components/header.tsx:42-55` (desktop) and `:63-77` (mobile) render `<a href={item.href}>` for all six internal routes, causing full page reloads; `Link` is already imported (used for the logo). Replace both loops with `<Link to={item.href}>` (drop-in; keep active-state styling). Also convert the raw anchors noted in `home-landing.tsx:136-220`, `docs-card.tsx:10-11`, `guide-page.tsx:130,244` IF those files remain live after Phase 23 (coordinate: Phase 23 may delete some — apply only to surviving files).
- **InstallCommand copy state (verified-report-17 Finding 3)**: `apps/web/src/components/layout/install-command.tsx:24-53` — switching the package-manager tab does not reset `copied` (misleading "Copied" next to a never-copied command), and the 2s reset `setTimeout` is never cancelled (rapid re-clicks truncate feedback; unmount leaks the timer). Reset `copied` in the tab handler; track/clear the timeout with a ref + unmount cleanup (pattern already exists in `code-block.tsx:13-32`).
- **Swallowed clipboard failures (verified-report-14 Finding 5)**: `[, setCopyError]` state is written but never read in `installation-prompt-generator.tsx:36,154-165` and `system-prompt-generator.tsx:88,654-665`; `demo-card.tsx:25-39` silently no-ops without `navigator.clipboard` and `.catch(() => setCopied(false))` discards rejections. Surface failures via the existing `sonner` toast (descriptive message) and remove the dead unread state or render it.

**Outputs**:
- Modify: `apps/web/src/components/header.tsx`, `apps/web/src/components/layout/install-command.tsx`, `apps/web/src/components/examples/installation-prompt-generator.tsx`, `apps/web/src/components/examples/system-prompt-generator.tsx`, `apps/web/src/components/demo/demo-card.tsx`

**Validation**:
- `pnpm run check-types:web` PASS; `pnpm run build:web` PASS; grep: no `<a href="/` remains in header.tsx.

### 20.2: SEO canonical/JSON-LD dedup + og image
**Requirements** (verified-report-16, live-SSR-proven):
- **Conflicting canonicals + duplicate JSON-LD (Finding 1, HIGH)**: `createSeoHead()` emits a canonical + 2 JSON-LD scripts per call (`apps/web/src/features/docs/seo.ts:171-234`) and is invoked at every matched route level (`__root.tsx:15-29`, `routes/docs/route.tsx:5-8`, every leaf) — TanStack Router concatenates them, so `/docs/getting-started` ships 3 conflicting canonicals + 6 JSON-LD blocks. Restructure: only the LEAF route emits the canonical URL, the page-entity JSON-LD, and the page breadcrumb; the root emits only `Organization` + `WebSite` entities (no canonical); the `/docs` layout emits nothing page-specific (or only what leaves cannot). Post-condition: exactly one `<link rel="canonical">` and no duplicate JSON-LD entity types per rendered page (verify `/`, `/docs`, `/docs/getting-started`, `/builder`).
- **og:image is an SVG (Finding 2)**: `site-meta.ts:13` `ogImagePath: '/og.svg'` — major social crawlers cannot render SVG, so link shares are imageless. **[DECISION D8]**: **Recommended**: produce a raster `apps/web/public/og.png` (1200×630) rendered from `og.svg` (implementer may add a one-off dev script using an available rasterizer — check the catalog/existing deps before adding any; committing the generated PNG is acceptable) and point `ogImagePath` to it. Alternative: keep SVG + document the limitation (not recommended — the finding is confirmed dead previews on all routes).

**Outputs**:
- Modify: `apps/web/src/features/docs/seo.ts`, `apps/web/src/features/docs/site-meta.ts`, route head factories as needed (`__root.tsx`, `routes/docs/route.tsx`)
- Create: `apps/web/public/og.png`

**Validation**:
- `pnpm run build:web` PASS; inspect prerendered HTML under `apps/web/dist/` — each page has exactly 1 canonical; `/docs/getting-started` has no duplicate `TechArticle`/`BreadcrumbList`/`Organization`/`WebSite` entities; `og:image` points to `/og.png`.

**Phase-level Validation**:
- `pnpm run check-types` + `pnpm run build` PASS; phase-wide validator confirms the SEO restructure did not alter 20.1's files.

**Dependencies**: Phase 1 must complete successfully (web build unblocked). 20.1's home-landing/docs-card/guide-page edits coordinate with Phase 23 ordering (run 20.1 BEFORE Phase 23 deletions, applying only to files Phase 23 keeps — or re-verify after).

---

## Phase 21: Docs content + example correctness
**Type**: Parallel

### 21.1: Docs pages — links, storage keys, options table
**Requirements** (verified-report-15):
- **blob/main links 404 (Finding 1)**: `getting-started.tsx:7`, `validation.tsx:8` (`githubRoot`), `fields.tsx:16`, `api.tsx:9` (`sourceBase`) build source links against `blob/main` while the rewrite exists only on `re-codex` (16/17 sampled linked files are absent on main; live-verified 404). Switch all four to `blob/re-codex` (matching the four sibling pages already using it). Fix stale anchors: `api.tsx:413` hook-return anchor → `use-formedible.tsx#L664-L679` (actual return location); `dynamic-text.tsx` "withDynamicText" reference → lines 323-342. Verify remaining anchors against current line positions.
- **STORAGE_KEYS count (Finding 2)**: `apps/web/src/routes/docs/ai-builder.tsx` "Storage and export" section says four entries and shows a 4-key excerpt while `ai-storage.ts:26-32` defines five (`modelCatalogs` missing). Update prose, bullet, and snippet to all five keys (or mark the excerpt abridged).
- **`validationSummary` missing from options table (Finding 3)**: `apps/web/src/routes/docs/api.tsx:179-231` documents every `UseFormedibleOptions` property except `validationSummary` (`packages/formedible/src/lib/formedible/types.ts:462`, default-enabled via `getValidationSummaryConfig`, config shape `types.ts:395-398`). Add the row (document `boolean | { autoNavigate, showBadges }`, defaults all true).

**Outputs**:
- Modify: `apps/web/src/routes/docs/getting-started.tsx`, `validation.tsx`, `fields.tsx`, `api.tsx`, `dynamic-text.tsx`, `ai-builder.tsx`

**Validation**:
- `pnpm run check-types:web` PASS; spot-check sampled links resolve on `blob/re-codex` (file existence via `git cat-file -e re-codex:<path>`).

### 21.2: Example forms correctness
**Requirements** (verified-report-14 + verified-report-18, dedup):
- **Contact combobox/enum mismatch (report-14 F1 = report-18 F3)**: both copies offer 5 subjects while the schema enum allows 3 (`apps/web/src/components/examples/contact-form.tsx:9,26,60-64,143-147` and `apps/web/src/components/docs/examples/contact-form.tsx:11,61-67,144-150`) — "billing"/"feature" are permanently un-submittable. **[DECISION D9]**: **Recommended**: widen `z.enum` to all five values in both runtime configs AND exported code strings. Alternative: drop the two options (narrower product surface). Default: widen.
- **array-fields-form nested types (report-18 Finding 2)**: `apps/web/src/components/docs/examples/array-fields-form.tsx` — `skills` is a text input vs `z.array(z.string())` (lines 16, 325-330), `startDate` text vs `z.date()` (17, 331-336), `isPrimary` text vs `z.boolean()` (30, 402-406); using the fields as their placeholders instruct breaks submission (empirically confirmed). Fix the FIELD types to match the schema (recommended: `skills` → `type: 'array'` with `arrayConfig: { itemType: 'string' }`; `startDate` → `type: 'date'` (submits `Date` after Phase 3); `isPrimary` → `type: 'checkbox'`).
- **Rental-car UTC/local mixing (report-14 Finding 3)**: `apps/web/src/components/examples/rental-car-flow-form.tsx:174-178` (and code-string copy at 783-793) compares UTC-midnight `new Date(pickupDate)` against local-midnight candidates, allowing same-day returns everywhere west of UTC. Parse both sides consistently (local midnight: `new Date(\`${formValues.pickupDate}T00:00:00\`)`, or compare the `'YYYY-MM-DD'` strings lexicographically).
- **Module-scope `useFormedible` in exported samples (report-14 Finding 4)**: the `*Code` strings in `contact-form.tsx:23-120`, `registration-form.tsx:26-121`, `survey-form.tsx:25-171` call the hook at module top level with no component wrapper — copy-paste crashes ("Invalid hook call"). Wrap in `export function XExample() { const form = useFormedible({...}); return <form.Form/>; }` (pattern already used by `RentalCarFlowCode`).
- **Shared persistence key (report-18 Finding 5)**: `demo-project-inquiry-form` is used by two live forms (`docs/examples/persistence-form.tsx:257` and `features/docs/compatibility-examples.tsx:265`), leaking drafts between demos and clearing each other on submit. Give the compatibility demo its own key (e.g. `...-compat`).
- **workDuration default (report-18 Finding 6)**: `advanced-field-types-form.tsx:942` (runtime) and `:590` (display string) default `{ hours: 8, minutes: 0 }` without `seconds`, which `isDurationValue` rejects → renders as 0. Add `seconds: 0` (display-only mismatch).
- Apply the same fixes to the mirrored copies under `apps/web/src/components/docs/examples/` where both exist (contact, rental-car, advanced-field-types, persistence code strings).

**Outputs**:
- Modify: `apps/web/src/components/examples/contact-form.tsx`, `rental-car-flow-form.tsx`, `apps/web/src/components/docs/examples/contact-form.tsx`, `array-fields-form.tsx`, `advanced-field-types-form.tsx`, `persistence-form.tsx`, `apps/web/src/features/docs/compatibility-examples.tsx`, plus the registration/survey code strings in `apps/web/src/components/docs/examples/registration-form.tsx`, `survey-form.tsx`

**Validation**:
- `pnpm run check-types` PASS; `pnpm run build:web` PASS; grep assertions: no module-scope `useFormedible` in exported strings; enum values match options; unique persistence keys.

**Phase-level Validation**:
- `pnpm run check-types` + `pnpm run build` PASS; phase-wide validator reads both sub-phases' route/component edits together.

**Dependencies**: 21.2 depends on Phase 3 (date submits `Date` — `startDate: type 'date'` + `z.date()` only valid after F2). 21.1 depends on Phase 1 only.

---

## Phase 22: Cheap DEGRADED compat restorations
**Type**: Parallel

### 22.1: Formedible core DEGRADED items (end of formedible chain)
**Requirements** (compat-report D2–D5, D8-styling, D9, D10, D15):
- **D3 slider gradient**: add `gradientColors?: readonly string[]` to `FormedibleSliderConfig` and implement the gradient track in `slider-field.tsx` (main: `main:.../slider-field.tsx:44,89-95`); aligns with fixture `tests/compatibility-examples/advanced-field-examples.ts` which still advertises it.
- **D9 top-level file props**: add `accept?: string` and `multiple?: boolean` to the field-level config (`types.ts`), mapped into `fileConfig` behavior in `file-upload-field.tsx` (main forwarded them at `main:use-formedible.tsx:1611-1612,1709-1710`).
- **D10 formOptions forwarding**: forward `formOptions.asyncDebounceMs` and `canSubmitWhenInvalid` into the TanStack `useForm` config (`use-formedible.tsx`).
- **D15 submit semantics [DECISION D10]**: **Recommended**: restore main-compatible behavior — disable the submit button via reactive `canSubmit` (possible after Phase 7's reactivity), and reset the form after a successful submit by default, honoring `resetOnSubmitSuccess?: boolean` (main always reset, `main:use-formedible.tsx:727-730`; `resetOnSubmitSuccess` was destructured-but-unused on main — treat `false` as opt-out). Alternative: keep no-reset (behavior change vs main — not recommended). Default: restore.
- **D8 styling subset**: accept and apply top-level `fieldClassName`, `labelClassName`, `buttonClassName`, `submitButtonClassName` options (`types.ts` + `use-formedible.tsx` rendering; main consumed them at `main:use-formedible.tsx:401-404,1704,2158,2196-2211`).
- **D2/D4 collapsibility**: implement `objectConfig.collapsible/defaultExpanded/showCard` in `object-field.tsx` (main: `main:.../object-field.tsx:16-17,104,153`) and accept `layout: 'vertical'|'horizontal'` as aliases of `'stack'` (`types.ts:75-79`); implement `section.collapsible/defaultExpanded` with `collapseLabel`/`expandLabel` wiring in `use-formedible.tsx` section rendering (options already typed-but-unused).
- **D5 help richness**: extend `help` to support `{ text?, tooltip?, position?, link? }` with a tooltip popover in `field-wrapper.tsx` (pattern from main `main:.../field-help.tsx:10-63`; use the existing popover primitive) and interpolate `{{token}}` dynamic values in help text via `resolveDynamicText`.

**Inputs**:
- Read: `packages/formedible/src/lib/formedible/types.ts`, `use-formedible.tsx`, `slider-field.tsx`, `object-field.tsx`, `field-wrapper.tsx`, `file-upload-field.tsx`; main references listed above
- Reference: compat-report §2/§3 DEGRADED rows

**Outputs**:
- Modify: `packages/formedible/src/lib/formedible/types.ts`, `packages/formedible/src/hooks/use-formedible.tsx`, `packages/formedible/src/components/formedible/fields/slider-field.tsx`, `object-field.tsx`, `file-upload-field.tsx`, `packages/formedible/src/components/formedible/fields/field-wrapper.tsx`
- Modify: `tests/formedible/basic-fields.test.tsx` / `section-rendering.test.tsx` (collapsible section/object, help tooltip, gradient class/style, classNames applied, reset-after-submit)

**Validation**:
- Formedible workflow (build:pkg → quick-sync → check-types) PASS; full `test:formedible:*` battery PASS.

### 22.2: Export-surface restorations (D13/D14)
**Requirements**:
- **D13**: re-export `version` (`export const version = '0.1.0'`) from `packages/formedible-parser/src/index.ts`; export `cn` from `packages/builder/src/index.ts`.
- **D14**: `packages/ai-builder/src/index.ts` re-exports `FormBuilder`, `FieldConfigurator`, `FormPreview`, `defaultTabs` from `@formedible/builder` (or local copies per the ownership model — follow however Phase 2.1 established cross-package consumption; if import from the builder package violates boundaries, vendor/re-export via the local synced copies) and index-exports the types `AIBuilderProps`, `AiFormRendererProps`, `ProviderSelectionProps`, `ProviderConfig`, `AIProvider` (from `ai-types.ts`), plus restore the `BackendConfig` type in `ai-types.ts` and export it.

**Outputs**:
- Modify: `packages/formedible-parser/src/index.ts`, `packages/builder/src/index.ts`, `packages/ai-builder/src/index.ts`, `packages/ai-builder/src/lib/formedible/ai-types.ts`

**Validation**:
- `node scripts/quick-sync.js` + `pnpm run check-types` PASS.

**Phase-level Validation**:
- `pnpm run check-types` + `pnpm run build` PASS; full behavior battery PASS; phase-wide validator checks the export surface against compat-report §6.

**Dependencies**: 22.1 depends on Phase 11 (end of formedible chain). 22.2 depends on Phase 2.

---

## Phase 23: Dead code cleanup
**Type**: Sequential

**Requirements**:
- **Dead docs components (verified-report-17 Finding 2)**: delete, after the implementer re-verifies zero importers via repo-wide grep (paths and exported names): `apps/web/src/components/docs/docs-home.tsx`, `docs-layout.tsx`, `docs-card.tsx`, `page-header.tsx`, `home-landing.tsx`, `rendered-example-showcase.tsx`. NOTE the conflict in the reports: verified-report-18 Finding 5 claims `docs-layout.tsx:89` renders the compatibility demos — verified-report-17's exhaustive import analysis found `docs-layout` imported only by the dead `docs-home`. If the re-verification confirms the compatibility demos are NOT rendered via `docs-layout` (dead), confirm where `docsCompatibilityExamples` actually renders (if nowhere live, leave the data file — it is consumed by fixtures — but note it in the phase report).
- **Dead data file (verified-report-16 Finding 4)**: delete `apps/web/src/data/code-examples.ts` (785 lines, zero importers; only mention is a caption inside the also-deleted `rendered-example-showcase.tsx:229`).
- **Dead fallback branch (verified-report-17 Finding 1)**: `apps/web/src/components/docs/guide-page.tsx:201,220` — `{evidence ?? <div .../>}` never falls through (a JSX element is never nullish). Compute `hasEvidence = Boolean(section.snippet || section.references?.length)` and conditionally render the evidence element or the fallback div.
- **@formedible/env (verified-report-12 Finding 3) [DECISION D11]**: the package validates zero variables and has zero importers; only dead dependency edges exist (`package.json:45` root, `apps/web/package.json:15`). **Recommended**: delete `packages/env/` and both dependency edges. Alternative: remove only the dep edges and leave the package. Default: delete.
- Run `pnpm install` after dependency edits.

**Inputs**:
- Read: the files listed above; root + apps/web `package.json`
- Reference: verified-report-17 import analysis, verified-report-16 Finding 4

**Outputs**:
- Delete: the 6 dead component files + `apps/web/src/data/code-examples.ts` (+ `packages/env/` if D11 approved)
- Modify: `apps/web/src/components/docs/guide-page.tsx`, root `package.json`, `apps/web/package.json`, `pnpm-workspace.yaml` only if it references packages/env
- Modify: any caption/string references to deleted paths (grep for `data/code-examples`, `rendered-example-showcase`, etc.)

**Validation Criteria**:
- Zero repo references to deleted paths (grep excluding `node_modules`, `.review/`).
- `pnpm install` clean; `pnpm run check-types` PASS; `pnpm run build` PASS (web build especially — prerender crawl must not hit dead links).

**Dependencies**: Phase 20 and Phase 21 must complete successfully (20.1 touches adjacent files; examples moves land first).

---

## Phase 24: Test/fixture/scan quality
**Type**: Parallel

### 24.1: Compatibility fixture enforcement (verified-report-19)
**Requirements**:
- **Wire the manifest (Finding 2)**: `tests/compatibility-examples/example-manifest.ts` (definitions at `:75,92`) is imported by nothing; `arrayFieldsCompatibilityExample` (`nested-examples.ts:8`) and `advancedFieldTypesCompatibilityExample` (`core-examples.ts:251`) are reachable only via the manifest and never executed. Import the manifest in a test (e.g. extend `tests/formedible/phase10-behavior.test.ts` or add `tests/formedible/compatibility-manifest.test.ts` following the existing runner pattern): assert 14 entries with unique ids; drive real assertions from `arrayFieldsCompatibilityExample` in `tests/formedible/nested-fields.test.tsx` and `advancedFieldTypesCompatibilityExample` in `tests/formedible/advanced-fields.test.tsx` (fixture data, not hand copies).
- **Keep-side return contract (Finding 4)**: `ContractProbe` (`tests/formedible/validation/validation-pipeline.test.tsx:257-281`) asserts only the 4 REMOVED keys are absent. Add the keep-side loop: all 14 kept keys present on the real hook's return (fixture `keptUseFormedibleReturnFields` drives the assertion).
- **Vacation fixture consumption (Finding 5)**: `tests/formedible/advanced-fields.test.tsx:173-196,221-246` hand-copies the fixture's data and tests the copies with a local regex interpolator. Consume `vacationFlowCompatibilityExample.fields/pages` directly and evaluate string conditionals via the package's real resolution (`resolveDynamicText` / the conditional path logic) instead of local clones.
- **Contract dispositions enforced (Finding 1 + residual Finding 3)**: `form-options-analytics-contract.ts` is compiled but never imported and its rows are plain strings with no tie to package types. Add a type-level tie (`satisfies` against a mapped type keyed by `keyof UseFormedibleOptions` / `keyof FormedibleFormOptions` / analytics callback names) and import the file from a compiled test so drift breaks CI. Verify every disposition row matches current reality (Phase 6 already corrected the restored rows).
- **Fixture/implementation inconsistencies**: update `tests/compatibility-examples/advanced-field-examples.ts` `gradientColors` evidence row (now implemented, Phase 22.1) and the location map/`showMap` rows per the D6 decision (24.3).

### 24.2: Architecture scan hardening (verified-report-20 Findings 2–6)
**Requirements**:
- **writeFile evasion (Finding 2)**: make the mutation extractor in `tests/architecture/copy-only-sync-contract.test.ts:6-84` string-literal aware (track parens/quotes while scanning arguments; handle concatenation with tracked variables on either side) and fix the forbidden-writeFile regexes' `[^,]+,` first-argument patterns (commas inside `join(root, name)`).
- **Vacuous entrypoint scans (Finding 3) [DECISION D12]**: `package-root-real-exports.test.ts:14-16` passes empty/comments-only entrypoints and never examines `config`, `env`, `formedible`, `ui` (no `src/index.ts`). **Recommended**: require at least one export statement in any existing entrypoint (comments-only = violation) AND create `packages/formedible/src/index.ts` re-exporting the public API (hook + types + registry) so the core package gains entrypoint coverage; scope the scan to packages that have or declare entrypoints. Alternative: non-vacuous check only, no new entrypoints. Default: recommended.
- **Allowlist pinning (Finding 4)**: `ignoredGeneratedFileNames` (`tests/architecture/utils.ts:28`, applied `:67-70`) exempts `routeTree.gen.ts` by bare filename at every directory level, and `generated-output-allowlist.test.ts:7-9` is tautological. Scope the ignore to exact paths (`apps/web/src/routeTree.gen.ts`) and rewrite the test to enumerate the pinned path set against the repository (fail if an unpinned file is being ignored or a pinned path disappears).
- **ESM-only import scan (Finding 5)**: add `require(...)` and `import(...)` patterns to `extractImportSpecifiers` (`tests/architecture/utils.ts:129-146`) mirroring `no-fake-formedible-import-surface.test.ts:13-19`.
- **Filename-keyed sync scans (Finding 6)**: `copy-only-sync-contract.test.ts:5` and `no-source-rewrite-sync.test.ts:5` gate on `/^scripts\/.*sync.*\.(cjs|js|mjs|ts)$/`. Extend coverage to any `scripts/**` file whose content writes files (e.g. contains `writeFile(`/`copyFile(`) so renamed/new writer scripts cannot escape (currently `build-release.js`, `prepare-web-deploy.js`, `prepare-registry-host.js` are unscanned).

**Outputs**:
- Modify: `tests/architecture/copy-only-sync-contract.test.ts`, `no-source-rewrite-sync.test.ts`, `package-root-real-exports.test.ts`, `no-placeholder-public-exports.test.ts` (shares the pattern), `generated-output-allowlist.test.ts`, `utils.ts`
- Create (if D12 approved): `packages/formedible/src/index.ts`

**Validation**:
- `pnpm run test:architecture` → all PASS (count may grow past 27 with new cases); `pnpm run test:sync` PASS; `pnpm run check-types` PASS.

### 24.3: Document deferred DEGRADED divergences [DECISION D13]
**Requirements**:
- **[DECISION D13]**: The large DEGRADED items — D6 (location map rendering: mapProvider/Leaflet/tile providers), D7 (custom `progress.component`/`page.component`/`submitButton` components), D8 core (top-level `layout` grid/flex, `conditionalSections`, `group`, grid-span props), D11 (`currentPage` visible-index semantics), D12 (page-validation-gated navigation) — are substantial UI features. **Recommended**: document them as intentional divergences from main in `FROM-SCRATCH-2.md` (new "Intentional divergences (post-review)" section with per-item rationale + the rewrite's replacement where applicable), and annotate the corresponding compat-fixture rows so the contract stops implying they exist. **Alternative**: implement them (est. 3+ additional phases — veto here to request implementation phases). Default: document.
- If documenting: update `tests/compatibility-examples/` rows referencing map rendering (`advanced-field-examples.ts` location map evidence) to mark divergence.

**Outputs**:
- Modify: `FROM-SCRATCH-2.md`, `tests/compatibility-examples/advanced-field-examples.ts` (annotations)

**Validation**:
- `pnpm run check-types` PASS (fixtures compile); disposition text reviewed by validator against compat-report §2/§3.

**Phase-level Validation**:
- `pnpm run check-types` PASS; `pnpm run test:architecture` PASS; `pnpm run test:sync` PASS; full `test:formedible:*` battery PASS; phase-wide validator confirms 24.1's fixture changes and 24.3's annotations are mutually consistent.

**Dependencies**: 24.1 depends on Phases 6 and 22 (dispositions/restorations final). 24.2 depends on Phase 2. 24.3 depends on Phase 22.

---

## Phase 25: Final full-gate verification
**Type**: Sequential

**Requirements**:
- Run the complete gate matrix and fix (via fixer dispatches) any residual failures:
  1. `node scripts/quick-sync.js` (then verify second run is a no-op)
  2. `pnpm install` (lockfile consistency after dependency edits)
  3. `pnpm run check-types`
  4. `pnpm run build`
  5. `pnpm run lint`
  6. All `pnpm run test:formedible:*` suites (normalization, validation, basic-fields, section-rendering, advanced-fields, advanced-fields:ssr, nested-fields, phase10, types)
  7. `pnpm run test:sync`, `pnpm run test:architecture`, `pnpm run test:consumer-smoke`, `pnpm run test:consumer-smoke:vite-base`
  8. `pnpm --filter @formedible/formedible-parser run test`, `pnpm --filter @formedible/builder run test`, `pnpm --filter @formedible/ai-builder run test`, `pnpm --filter @formedible/ai-picker run test`
- Produce the final gate status report (pass/fail per command with counts).

**Inputs**: Read: none (execution + verification only)

**Outputs**: Modify: only files needing residual fixes (via fixer dispatch)

**Validation Criteria**: Every command above exits 0. The consumer-smoke scaffold test passes with pnpm 10.10.0 (or is skipped-with-diagnostic per D2 Option B if that was chosen).

**Dependencies**: All previous phases must complete successfully.

---

## Success Criteria

- All 5 originally-failing gates green: `pnpm run check-types`, `pnpm run build`, `pnpm run test:sync`, `pnpm run test:architecture` (27+ / 27), `pnpm run test:consumer-smoke` (7/7 or documented-skip per D2).
- All 8 compat BREAKING findings (F1–F8) resolved with backward compatibility restored (dual-shape contract per D3; visibility-aware enforcement per D4); the 4 documented return-key removals stay removed; existing schemas (incl. `z.date()`, conditional forms, async schemas) keep working.
- All confirmed CRITICAL/HIGH findings from the verified reports fixed and covered by regression tests; all confirmed MEDIUM findings fixed; docs/dead-code/test-quality cleanup executed.
- Zero behavior-suite regressions vs the current baseline (normalization 17, validation 8+, basic-fields 34, section 5, advanced 14, ssr 1, nested 6, phase10 10, sync 4/4, consumer-smoke 6+/7).

## [DECISION] points requiring human input (defaults applied if no veto)

| ID | Phase | Decision | Recommended default |
|----|-------|----------|---------------------|
| D1 | 2.1 | ai-builder ↔ ai-picker boundary fix: A) vendor via new sync route, B) replace AiPicker with ProviderSelection, C) validator exception | A |
| D2 | 2.3 | better-t-stack pnpm gate: A) pin compatible version, B) graceful version-gated skip | A |
| D3 | 4 | F1 contract: A) dual-shape flat+render props (legacy compiles unchanged), B) new shape + migration adapter | A |
| D4 | 5 | F3 strictness: A) keep enforcement, visibility-aware (+ keep `required` enforced with checkbox fix), B) restore main's runtime no-op for top-level schema | A |
| D5 | 13 | Dead `EnhancedParserOptions`: consume `baseSchema`/`mergeStrategy` via `mergeSchemas`, `predefinedHandlers` documented reserved vs removed | Consume + document-as-reserved |
| D6 | 14.1 | FieldStore instance model: per-instance store default with global opt-in vs documented singleton | Per-instance default |
| D7 | 16.2 | Persistence vs export redaction split (persistence preserves formConfig; export redacts) AND drop per-token stream events from persistence vs cap | Split + drop events |
| D8 | 20.2 | og image: convert to PNG vs keep SVG documented | Convert to PNG |
| D9 | 21.2 | Contact-form enum mismatch: widen z.enum to 5 vs drop 2 options | Widen |
| D10 | 22.1 | D15 semantics: restore main's always-reset-after-submit (honoring `resetOnSubmitSuccess: false`) + reactive `canSubmit` disable vs keep no-reset | Restore |
| D11 | 23 | `@formedible/env`: delete package + dep edges vs remove edges only | Delete |
| D12 | 24.2 | Entrypoint scans: non-vacuous + create `packages/formedible/src/index.ts` vs non-vacuous only | Create entrypoint |
| D13 | 24.3 | Large DEGRADED items (D6 map, D7 custom components, D8 layout/conditionalSections/group, D11, D12): document as intentional divergences vs implement | Document (veto to request implementation phases) |
