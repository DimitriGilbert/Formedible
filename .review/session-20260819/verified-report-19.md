# Verified Report 19 — Compatibility contract fixtures (`tests/compatibility-examples/`)

Verification of `/home/didi/workspace/Formedible/.review/session-20260819/review-report-19.md` against the working tree of branch `re-codex`. Every grep re-run repo-wide (excluding `node_modules` and `.review/`); main-branch claims independently re-checked via `git show main:`.

Result: **5 confirmed, 0 dismissed.**

---

### Finding 1: `form-options-analytics-contract.ts` is entirely dead — CONFIRMED
**Original**: None of the file's three exports is imported by any test, package, or script; it is only type-checked, and compilation is not enforcement.
**Verification**:
- Repo-wide grep for `form-options-analytics-contract`, `formOptionsAnalyticsContract`, `restoredFormOptionsAnalytics`, `intentionallyRemovedFormOptionsAnalytics` (all `*.ts/tsx/js/json/md`): matches ONLY inside the defining file (`tests/compatibility-examples/form-options-analytics-contract.ts:13,65,69`). Zero importers anywhere in `tests/`, `apps/`, `packages/`, `scripts/`, or docs.
- Check-types wiring: root `package.json:20` runs `tsc -p tests/compatibility-examples/tsconfig.json`, whose `include: ["./*.ts"]` pulls this file in with `noEmit: true`. So the file IS compiled on every `pnpm check-types` — but the honest distinction the mission asked for lands on the reviewer's side: the file contains **no imports and no type references to the package** (read in full). Its `option` values are plain string literals, not `keyof UseFormedibleOptions` or similar. Type-checking it can only catch typos *within the file* (e.g. an invalid disposition string via the `satisfies` clause); it cannot detect drift between any row and the actual package types or runtime. Type-only compilation here is not even typo-catching against the package — it is syntax/shape checking of an isolated data file.
- Cross-check that the "restored" rows are accurate-but-unguarded: `formOptions.onChange/onBlur/onFocus/onReset` are indeed wired today (`packages/formedible/src/hooks/use-formedible.tsx:409,415,425,589`, re-verified), and `basic-fields.test.tsx:423+` exercises restored analytics firing — but through its own fixtures, never through this contract file. The file contributes zero executable or type-level enforcement of its ~49 dispositions. Real problem: it presents itself as the disposition contract ("restored" / "removed-replace" / "superseded") while any row can drift silently.

### Finding 2: `example-manifest.ts` wiring is never executed; `arrayFields` and `advancedFieldTypes` fixtures are dead — CONFIRMED
**Original**: The manifest and its two exclusively-manifest-reachable fixtures are never loaded by any test runner; their `assertionsRequired` are unenforced prose.
**Verification**:
- `compatibilityExamplesManifest` / `compatibilityExampleIds` appear ONLY at `tests/compatibility-examples/example-manifest.ts:75,92` (definition). Zero importers repo-wide.
- The only import of `example-manifest` outside the fixture directory is `import type { FieldDescriptor }` at `tests/formedible/basic-fields.test.tsx:25` — type-only, erased at runtime. The other fixture files import only the `CompatibilityExample` *type* from it.
- Fixture consumption map (verified from every test's import block):
  - `basic-fields.test.tsx:21-24` imports checkout/contact/jobApplication/registration from core-examples — NOT `advancedFieldTypesCompatibilityExample`.
  - `nested-fields.test.tsx:11` imports only `nestedConditionalObjectArrayCompatibilityExample` — NOT `arrayFieldsCompatibilityExample`.
  - `advanced-fields.test.tsx:20` imports only `vacationFlowCompatibilityExample`.
  - `phase10-behavior.test.ts:22-27` imports 5 behavior fixtures + return contract.
  - Therefore `arrayFieldsCompatibilityExample` (`nested-examples.ts:8`) and `advancedFieldTypesCompatibilityExample` (`core-examples.ts:251`) are referenced only by the never-imported manifest → never loaded at runtime.
- Prose-assertion claim verified: the advanced fixture's `assertionsRequired` literally includes "location search results are expected to map to id, lat, lng, address, city, state, country, postalCode, and relevance fields" (`core-examples.ts` assertions block). `FormedibleLocationValue` (`packages/formedible/src/lib/formedible/types.ts:617-624`) names only lat/lng/address/city/state/country; `id`/`postalCode`/`relevance` are accepted solely via the `[customProp: string]: unknown` escape hatch — exactly the silent-shrinkage case nothing would catch.
- Docs cross-reference verified: `docs/formedible-test-expansion-plan.md:241-247` says "Use the compatibility manifest/tests as the coverage checklist" and lists `example-manifest.ts` plus the fixture files — the checklist is not wired to execution. Partial indirect coverage does exist elsewhere (`tests/consumer-smoke/fixtures/old-array-fields-app.tsx` is a separate verbatim copy; the advanced example lives as an `apps/web` component), but neither consumes these fixtures, so fixture drift is invisible. Manifest integrity (14 entries, unique ids) is also unchecked at runtime. Real problem.

### Finding 3: Contract dispositions mislabel main-fired regressions as 'superseded' / "debug helper" — CONFIRMED
**Original**: `analytics.onTabChange/onTabFirstVisit/onSubmissionPerformance` are marked 'superseded' although main fired them; `formOptions.onSubmitInvalid` is described as a removed "debug helper" although it was a standard forwarded TanStack callback; `resetOnSubmitSuccess`/`autoScroll` get a factually inapplicable generic reason.
**Verification**:
- Fixture text confirmed at `tests/compatibility-examples/form-options-analytics-contract.ts`: line 41 `onTabChange` → 'superseded' ("No current package runtime event truthfully emits tab analytics."), line 45 `onTabFirstVisit` → 'superseded', line 51 `onSubmissionPerformance` → 'superseded', line 58 `formOptions.onSubmitInvalid` → 'removed-replace' with `removedDebugReason` = "Removed debug/validation helper; do not restore without an explicit product decision.", lines 52-53 `resetOnSubmitSuccess`/`autoScroll` → 'superseded' with the generic "Superseded by current TanStack Form validation state…" reason.
- Main-branch evidence independently re-verified via `git show main:packages/formedible/src/hooks/use-formedible.tsx`: live call sites `analytics?.onTabChange?.(fromTab, toTab, timeSpent, {...})`, `analytics?.onTabFirstVisit?.(toTab, timestamp)`, and `analytics.onSubmissionPerformance?.(...)` all exist and fired. The rewrite types all three as `never` (`packages/formedible/src/lib/formedible/types.ts:429,437,449`), which compat-report §3/F5 classifies as BREAKING — working main behavior removed. The fixture's 'superseded' disposition and current-runtime-only reason texts hide exactly that: a reader of the "authoritative disposition contract" would conclude no working behavior was lost.
- `onSubmitInvalid`: main built `const formConfig = { ...formOptions, ... }` (verified via git show) — i.e. it was spread into TanStack `useForm` and functioned as a standard submit-invalid callback, not a debug helper. Now `onSubmitInvalid?: never` (`types.ts:369`, compat-report F4).
- `resetOnSubmitSuccess`/`autoScroll`: the "TanStack Form validation state" reason is factually wrong for reset-after-submit and scroll-to-top behavior (compat-report §3 marks both DEGRADED: main implemented an autoScroll gate and always reset after submit; the rewrite does neither).
- Judgment: this is not acceptable "documentation-only intent" — even as documentation the file *actively misclassifies* regressions that the repo's own audit calls BREAKING/DEGRADED, in a file whose stated purpose is the authoritative disposition record. Real problem (compounding Finding 1: nothing would flag these rows either).

### Finding 4: Return contract's "keep" side is never verified against the actual hook — CONFIRMED
**Original**: `keptUseFormedibleReturnFields` is only deepEqual'd against a hand-copied literal; the real-hook probe asserts only the 4 REMOVED keys are absent; nothing asserts the 14 keep keys are present.
**Verification**:
- `tests/formedible/phase10-behavior.test.ts:198-213`: `assert.deepEqual(keptUseFormedibleReturnFields, [ ...14 literals... ])` — pins fixture text to test text; says nothing about `useFormedible`.
- `tests/formedible/validation/validation-pipeline.test.tsx:257-281` (`ContractProbe`): calls the real `useFormedible`, but loops only `for (const removedField of removedUseFormedibleReturnFields) assert.equal(Object.hasOwn(formedible, removedField), false)` plus a source-regex check for removed names. No keep-side presence assertion exists.
- Grep for keep keys (`progressValue`, `visiblePages`, `goToPreviousPage`, `isFirstPage`, `loadFromStorage`, `clearStorage`, etc.) across `tests/formedible/**`: matches ONLY the phase10 literal list (lines 201-212). Every other `useFormedible` call site in the suite destructures exactly `{ Form }` (basic-fields 12 call sites, nested-fields, advanced-fields, section-rendering) — none touches the pagination/storage helpers, so dropping e.g. `progressValue` or `visiblePages` from the hook return would fail zero tests.
- `tests/formedible/types/*.test-d.ts` read in full: `options.test-d.ts` covers options shape, `field-config.test-d.ts` covers field configs; neither references `ReturnType<typeof useFormedible>` or any return key. No `.test-d.ts` ties the hook return to the contract.
- Hook return today is exactly the 14 keep keys (`packages/formedible/src/hooks/use-formedible.tsx:664-679`, re-verified) — so the gap is enforcement asymmetry, not active drift, exactly as the review states. Real problem (a one-line loop in ContractProbe would close it).

### Finding 5: `vacationFlow` fixture is only decoratively consumed — CONFIRMED
**Original**: The sole consumer hand-copies the fixture's data and tests the copies with a local regex interpolator; the fixture itself gets only two self-referential assertions.
**Verification**:
- `tests/formedible/advanced-fields.test.tsx`: line 20 imports the fixture; lines 173-186 define test-local `vacationFlowFields`/`vacationFlowPages` by hand (note: the test's `carType` uses a *function* conditional while the fixture encodes a *string* conditional `'destination is beach, mountains, or city'` — the copies are not even structurally identical); lines 194-196 define a local regex `interpolateDynamicText` instead of the package's `resolveDynamicText`.
- The entire "vacation flow advanced compatibility behavior executes" test (lines 221-246) evaluates `vacationFlowFields.find(...)`, `vacationFlowPages.find(...)`, the local interpolator, the local conditional closure, and validators built from the test-local field — i.e. all three `assertionsRequired` of the fixture (token interpolation, carType visibility, passengers min) are enforced against test-local clones.
- The fixture object is touched at exactly two lines — 233: `assert.ok(vacationFlowCompatibilityExample.fields.some((field) => field.type === 'date'))` and 234: the same for `'multiSelect'` (grep confirms lines 233-234 are the only usages besides the import). Both assertions check the fixture's own static data and can only fail if someone edits the fixture — permanently vacuous.
- The real `resolveDynamicText` is properly tested, but in `phase10-behavior.test.ts:182` with its own template (`'Hello {{firstName}}, enjoy {{destination}}!'`), not via this fixture — confirmed.
- Consequence verified: the fixture (`tests/compatibility-examples/advanced-field-examples.ts:6-52`) can drift arbitrarily from what is tested with no failure. Real problem (decorative consumption defeats the fixture's purpose as compatibility source of truth).

---

## Verdict summary

- 5 confirmed, 0 dismissed.
- All five findings describe the same underlying pattern from different angles: fixture/contract files in `tests/compatibility-examples/` that present themselves as the enforced compatibility surface while being either never executed (Findings 1, 2), misclassifying regressions (Finding 3), or enforcing only one side of their contract (Findings 4, 5). None is acceptable as "documentation-only": Finding 3 actively contradicts the repo's own compat audit, and Findings 1/2/4/5 advertise gates that do not exist.
- No false positives were found; every file path, line reference, grep claim, and main-branch citation in the original report reproduced on re-verification.
