# Verified Report — Cluster 2 (Validation libs + input field primitives)

Verification agent: re-checked every finding against the owning sources in `packages/formedible/src/`, the installed `@tanstack/form-core@1.32.0` and `react-dom@19.2.5` in `node_modules/.pnpm/`, and empirical runs (jsdom + React 19 render of the real components; tsx runs of the real `validation.ts`/`dynamic-text.ts` against a real `FormApi`/`FieldApi`). No repo files were modified; scratch tests ran in `/tmp` and were deleted.

**Verdict summary: 8 confirmed, 2 dismissed.**

- Finding 1 (async top-level schema throws on keystroke) — CONFIRMED (empirical crash)
- Finding 2 (masked/phone rejected chars stay visible) — DISMISSED (React 19 reverts the DOM)
- Finding 3 (phone stores country code when cleared) — CONFIRMED (with corrected details)
- Finding 4 (required never fails for checkbox/switch `false`) — CONFIRMED (empirical)
- Finding 5 ("[object Object] is required" for ReactNode label) — CONFIRMED (empirical)
- Finding 6 (async field-level schema silently never validates) — CONFIRMED (empirical)
- Finding 7 (number field wipes on `-`/`e` keystrokes) — DISMISSED (React 19 preserves the draft; no DOM writes)
- Finding 8 (whole-form schema re-parsed per field/event/render) — CONFIRMED (empirical counts)
- Finding 9 (phone country dropdown cannot be dismissed) — CONFIRMED (code)
- Finding 10 (interpolation fails for array-index paths) — CONFIRMED (empirical)

---

### Finding 1: Async top-level schema throws "async function passed to sync validator" on every keystroke — CONFIRMED
**Original**: Sync field validators and the form-level `validate` call `formApi.parseValuesWithSchema(schema)` unconditionally; TanStack throws on Promise results, uncaught, crashing typing/blur/submit.
**Verification**: All claims check out in source and in a live run.
- `packages/formedible/src/lib/formedible/validation.ts:247` (`schemaFieldMessage`) and `:384` (`buildFormValidators`' `validate`) call `formApi.parseValuesWithSchema(schema)` with no promise guard, while the field-schema path `schemaValidationMessage` (:135-143) does guard via `isPromiseLike` — the inconsistency is real.
- Installed `@tanstack/form-core@1.32.0` `standardSchemaValidator.js`: `validate(...)` throws `new Error("async function passed to sync validator")` when `schema["~standard"].validate(value) instanceof Promise`. `FormApi.js:859` (`parseValuesWithSchema`) calls it directly; `FormApi.runValidator` (:1049) and `FieldApi.runValidator` (:573) have no try/catch; `FieldApi.setValue` → `this.validate("change")` is fully synchronous.
- Empirical (tsx, real `validation.ts` + real `FormApi`/`FieldApi` + zod 4.3.6 async refine):
  - async zod schema `~standard.validate` returns a Promise: `true`
  - `form.parseValuesWithSchema(asyncSchema)` → **throws** `"async function passed to sync validator"`
  - End-to-end keystroke simulation (`field.setMeta(isTouched: true); field.handleChange('hello')`, mirroring `use-formedible.tsx:417-422`) → **throws** the same error
  - Control with a sync schema: no throw, errors map correctly (`["Too short"]`)
- Secondary claim verified in code: `onChangeAsync` (which alone uses `schemaFieldMessageAsync`) is only registered when the field has `asyncValidation` or `inlineValidation` (validation.ts:343-364), so async-schema issues never reach fields without those.

### Finding 2: Masked/phone inputs leave rejected characters visible — DISMISSED
**Original**: When sanitization leaves the stored value unchanged, React does not rewrite the input's DOM value, so rejected characters remain visible indefinitely.
**Reason**: The premise about React controlled-input semantics is false on the installed React 19.2.5. React does not rely on "prop changed between renders" to enforce controlled values on change events: every dispatched change event enqueues a state restore (`createAndAccumulateChangeEvent` → `restoreTarget`), and `batchedUpdates$1`'s finally block runs `flushSyncWork$1()` then `restoreStateOfTarget(target)` → `updateInput(...)`, which writes the DOM back to the value prop whenever `element.value !== value` (react-dom-client.development.js ~:3255-3273, :1644-1680).
- Empirical (jsdom + React 19.2.5, exact masked-field sanitize-on-change semantics):
  - Scenario A (stored `''`, type `a`, sanitizer yields `''`): after the change event the DOM shows `""` — the rejected char is wiped immediately (no re-render even occurred; the restore did it).
  - Scenario B (overflow: stored `(555) 123-4567`, DOM set to `(555) 123-45678`, re-mask yields the same string): after the change event the DOM shows `"(555) 123-4567"` — the phantom `8` is reverted immediately.
- Phone field (`formatPhone` strips letters) is the same class of controlled text input; the same restore applies. The claimed user-visible symptom ("an 11th digit appears entered but is silently dropped") does not occur — the overflow digit is rejected visually at once.

### Finding 3: PhoneField international format stores the bare country code when the input is cleared — CONFIRMED
**Original**: With `format === 'international'`, clearing produces `'+1'` instead of empty; `required` then passes; national format unaffected.
**Verification**: Confirmed by rendering the REAL `PhoneField` (jsdom + React 19) with a controlled harness; details corrected:
- Typed `5551234567` → stored `"+1 (555) 123-4567"`, DOM `"(555) 123-4567"`. Correct.
- Cleared (select-all + Backspace → `''`) → `onChange` stored **`"+1 ("`** — non-empty garbage. The report said `'+1'`; the actual value is `'+1 ('` because `formatPhone('', '(###) ###-####')` returns `'('` (the leading literal is appended before the first `#` breaks the loop, phone-field.tsx:118-136), then `` `${'+1'} ${'('}`.trim() `` → `'+1 ('` (phone-field.tsx:55-59).
- `isEmptyValue('+1 (')` → false → the built-in `required` check in validation.ts:163-173 passes while the visible field is effectively empty (it shows only a stray `(`).
- Correction to the report: national format is **also** affected — with `format: 'national'` or with no `phoneConfig` at all, clearing stores `'('` (empirical: `onChange calls = ["("]`), which likewise passes `required` and would be submitted as literal `'('`. The core data-integrity issue is real in both modes; the report's "national unaffected" detail is wrong.

### Finding 4: `required` never fails for checkbox/switch fields (unchecked = `false` passes) — CONFIRMED
**Original**: `isEmptyValue` only treats `undefined`/`null`/`''`/`[]` as empty; checkbox/switch store strict booleans, so unchecked required fields pass.
**Verification**: Code and empirical both confirm.
- `checkbox-field.tsx:19`: `onCheckedChange={(nextChecked) => field.onChange(nextChecked === true)}` — stores `false`. `switch-field.tsx:19` passes the boolean through.
- `validation.ts:163-173`: `isEmptyValue(false)` → `false` → `validateRequired` returns `undefined`. No checkbox/switch special-case exists anywhere in `src/lib/formedible/*.ts` (grep: only the type union mentions `'checkbox'`).
- Empirical through real `buildFieldValidators`: required checkbox, value `false` → `onChange`/`onSubmit` both return `undefined` (passes); value `undefined` → `"Accept terms is required"`. Matches the claim exactly; unchecked required consent/terms submits successfully.

### Finding 5: Required error message renders "[object Object] is required" when `label` is a ReactNode — CONFIRMED
**Original**: `String(field.label)` on a ReactNode label yields `"[object Object]"` in the user-facing required message.
**Verification**: Confirmed empirically.
- `types.ts:289` (`NormalizedFieldConfig.label?: ReactNode`) and `field-wrapper.tsx:38-42` renders labels as ReactNode — JSX labels are a supported input shape; `normalize-field-config.ts` passes `label` through untouched; `withDynamicText`/`resolveDynamicText` returns non-string labels unchanged (dynamic-text.ts:7-9).
- Empirical through real `buildFieldValidators` with `label: React.createElement('span', null, 'Custom label')` and empty value → required message: **`"[object Object] is required"`** (validation.ts:172).

### Finding 6: Async field-level schema (`validation` prop) silently never validates — CONFIRMED
**Original**: `schemaValidationMessage` returns `undefined` for promise-like results and no async path ever re-runs the field-level schema.
**Verification**: Confirmed in code and empirically.
- `validation.ts:135-143`: `isPromiseLike(result)` → `return undefined`. `types.ts:178` types `validate` as `unknown | Promise<unknown>`, so async field schemas are nominally supported.
- `onChangeAsync` is only registered when `fieldAsyncValidation || inlineValidation` (:343-364), and its body runs only `fieldAsyncValidation`, `inlineValidation`, and the form-level `schemaFieldMessageAsync` — never `runFieldValidation(field.validation, ...)`. There is no `onBlurAsync`/`onSubmitAsync` wiring.
- Empirical with a real async zod field schema (`z.string().refine(async v => v !== 'taken', 'Username is taken')`):
  - value `'taken'` → `onChange` returns `undefined`; `onSubmit` returns `undefined`
  - `onChangeAsync` not even registered for the field (`false`)
  - Even when `inlineValidation` is enabled (so `onChangeAsync` exists), value `'taken'` → `undefined` — the field schema's issue never surfaces.
  Validation is silently disabled, as claimed.

### Finding 7: NumberField wipes the input on leading `-`/`e` keystrokes — DISMISSED
**Original**: For `type="number"`, badInput (`-`, `1e`) makes `target.value === ''`, the handler maps it to `undefined`, the rendered value changes to `''`, and React rewrites the DOM, clearing the visible content; negatives silently become positive; `1e5` impossible.
**Reason**: React 19 never rewrites the DOM in this flow — the claim's mechanism ("the value prop changes, so React clears the entire input") does not hold for number inputs. In `react-dom@19.2.5` `updateInput`'s number branch writes only `if ((0 === value && "" === element.value) || element.value != value)` (loose comparison against the sanitized DOM value). During badInput the browser's `element.value` getter returns `''`, which equals the `''` prop NumberField renders for `undefined` (number-field.tsx:32), so no write occurs and the browser's raw editing draft (`-`, `1e`) survives untouched.
- Empirical (jsdom + React 19.2.5, exact NumberField `value`/`onChange` logic replicated, with a spy on programmatic `.value` writes):
  - Existing value `5`, select-all + `-` (badInput): **zero** React DOM writes; then completing with `5` → DOM `"-5"`, state `-5`. Negative works.
  - Value `1`, type `e` (badInput): zero writes; completing `1e5` → DOM `"1e5"` (jsdom, matching the browser's valid end state). Scientific entry works.
  - First `-` into an empty field doesn't even dispatch React's change event (tracker sees `''` → `''`), so nothing is cleared.
- The spy result `reactWrites: []` in every badInput step is the decisive evidence: no code path clobbers the browser's visible draft, so the input is never wiped and the sign is never silently lost. (Note: without the `'' → undefined` guard the handler would store `NaN`; the guard is doing its job.)

### Finding 8: Whole-form schema is re-parsed per field, per event, and per render — CONFIRMED
**Original**: `schemaFieldMessage` runs a full `parseValuesWithSchema` inside every field validator; `getInvalidFieldEntries` re-runs `validators.onSubmit` for every field inside the `form.Subscribe` render callback → O(N) full parses per keystroke.
**Verification**: Confirmed in code and by counting parses (real `validation.ts` + real `FormApi`/`FieldApi`, schema `~standard.validate` instrumented).
- One keystroke on one field (3-field form) → **2 full-schema validates** (form-level `validate` via `FormApi.validateSync` + the field's own `schemaFieldMessage` at validation.ts:247). With formedible's `formedibleValidationLogic` (change events also run onBlur validators, use-formedible.tsx:49-69) the real count is ≥ this.
- One `form.Subscribe` render (use-formedible.tsx:608-613 runs on every `values`/`fieldMeta` change, i.e. every keystroke) with all fields valid (no meta errors → `?? getFieldErrorFromConfiguredValidation` runs, :256, :234-246) → **3 full-schema validates** for 3 fields — N per render, exactly as claimed.
- Combined keystroke + re-render → 5 full parses for a 3-field form; scales O(N) per keystroke on schema-backed forms. (Minor nuance: `onSubmit` is skipped for fields that currently HAVE meta errors due to the `??` short-circuit, but the common case — valid/untouched fields — hits every field.) Performance-only issue; severity MEDIUM is appropriate.

### Finding 9: Phone country dropdown cannot be dismissed by clicking outside — CONFIRMED
**Original**: The country menu is plain `open` state with no outside-click, Escape, or blur dismissal.
**Verification**: Confirmed by exhaustive grep + read of `phone-field.tsx`: the only state mutators are the trigger button `onClick={() => setOpen(isTouched => !isTouched)}` (:66) and the country item `onClick` (:78-82). The only `useEffect` (:40-53) syncs the selected country; the only `onBlur` (:99) is on the phone input forwarding `field.onBlur`. No `document` listeners, `keydown`, Escape, or pointerdown handling anywhere in the file. Contrast with `combobox-field.tsx` in the same directory, which composes the shadcn `Popover` primitive (built-in outside-click/Escape dismissal) — the phone dropdown is an outlier, not a package-wide convention. The `z-50` absolutely-positioned menu blocks adjacent content until re-toggle or selection.

### Finding 10: Template interpolation silently fails for array-index paths (`{{items[0].name}}`) — CONFIRMED
**Original**: The regex `/\{\{\s*([\w.]+)\s*\}\}/g` cannot capture bracket paths, so templates with array indices render verbatim while `parseFieldPath`/`getValueAtFieldPath` (and string conditionals) fully support them.
**Verification**: Confirmed empirically through the real `resolveDynamicText`:
- `resolveDynamicText('Mail: {{user.email}}', values)` → `"Mail: a@b.c"` (works)
- `resolveDynamicText('Item: {{items[0].name}}', values)` → **`"Item: {{items[0].name}}"`** (rendered verbatim to the user)
- `getValueAtFieldPath(values, 'items[0].name')` → `'Widget'` — the path machinery (field-path.ts:19-58) supports it, and string `conditional`s resolve through the same function (use-formedible.tsx:224). Interpolated values flow only into React text/attribute positions, so the report's "XSS not a concern" note is also accurate.

---

## Notes on the "no findings" files
Spot-checked and agree: `zod-errors.ts` (message extraction matches TanStack's `{ fields: Record<path, issue[]> }` shape; `firstIssueMessage`/`formatValidationError` behave as observed in the empirical runs above), `normalize-options.ts`, `lib/utils.ts`, `field-wrapper.tsx` (labels rendered as ReactNode, help-config discrimination correct), and `text-field.tsx` / `textarea-field.tsx` / `password-field.tsx` (no issues seen; password toggle button is `type="button"` by default via ui/button).

## Empirical evidence summary (scratch, deleted after run)
- `verify-f1.ts`: async zod schema → Promise from `~standard.validate`; `parseValuesWithSchema` throws; `field.handleChange('hello')` throws end-to-end; sync control passes.
- `probe.js` (jsdom + React 19.2.5): controlled text input with sanitize-on-change — rejected `a` and overflow `8` are reverted to the prop value immediately.
- `probe-number-field.js` (jsdom + React 19.2.5 + DOM-write spy): zero React writes during badInput flows; `-5` and `1e5` reachable.
- `verify-f3.ts` (real `PhoneField` render): international clear → stored `'+1 ('`; national/default clear → stored `'('`; `isEmptyValue` false in both.
- `verify-f3f4f5f6.mts` (real `buildFieldValidators`): checkbox `false` passes required; JSX label → `"[object Object] is required"`; async field schema never produces an error.
- `verify-f8b.ts` (real validators + instrumented schema): 2 parses/keystroke, N parses/Subscribe-render.
