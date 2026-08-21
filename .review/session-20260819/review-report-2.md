# Review Report — Cluster 2 (Validation libs + input field primitives)

Reviewer scope: `packages/formedible/src/lib/formedible/{validation,zod-errors,normalize-options,dynamic-text}.ts`, `lib/utils.ts`, `components/formedible/fields/{field-wrapper,field-registry,text-field,textarea-field,number-field,password-field,masked-field,phone-field}.tsx`

Verified against TanStack form-core 1.32.0 source (installed at `node_modules/.pnpm/@tanstack+react-form@1.32.0.../@tanstack/form-core`), React 19 controlled-input semantics, and `FROM-SCRATCH-2.md` design intent.

---

### [SEVERITY: HIGH] Finding 1: Async top-level schema throws "async function passed to sync validator" on every keystroke
**File**: packages/formedible/src/lib/formedible/validation.ts:247 (also :261, :384)
**Problem**: The sync field validators (`onChange`/`onBlur`/`onSubmit`) and the form-level `validate` function call `formApi.parseValuesWithSchema(schema)` unconditionally whenever a standard schema is configured. TanStack's implementation of `parseValuesWithSchema` throws when the schema's `~standard.validate` returns a Promise (i.e. any async schema, e.g. a zod schema with an async `refine`/`superRefine`). TanStack's `runValidator` invokes validators without any try/catch, so the error propagates out of `validateSync` → `setValue` → `handleChange` → the React change event, crashing typing/blur/submit for the whole form.
**Evidence**:
```ts
// validation.ts:247 — sync field validator path
const fields = formApi.parseValuesWithSchema(schema)?.fields;
```
```js
// form-core/dist/esm/standardSchemaValidator.js (installed @tanstack/react-form 1.32.0)
validate({ value, validationSource }, schema) {
  const result = schema["~standard"].validate(value);
  if (result instanceof Promise) {
    throw new Error("async function passed to sync validator");
  }
  ...
}
// form-core/dist/esm/FieldApi.js
runValidator(props) {
  ...
  return props.validate(props.value);   // no try/catch
}
```
Note the inconsistency: the *field-level* schema path (`schemaValidationMessage`, validation.ts:135-143) already guards promise results via `isPromiseLike`, but the *form-level* paths (`schemaFieldMessage`, `schemaFieldMessageAsync` callers at :247/:261/:384) do not.
**Impact**: Any consumer passing an async schema (a common pattern for server-backed uniqueness checks) gets an uncaught exception on the first keystroke instead of async validation. Additionally, even if the throw were suppressed, async schemas would never produce errors here: the async schema parse (`schemaFieldMessageAsync`) is only wired into `onChangeAsync`, which is only registered when the field also has `asyncValidation` or `inlineValidation` (validation.ts:343-364) — so async-schema issues silently never surface for other fields.
**Suggestion**: In `schemaFieldMessage`, detect async schemas before calling the sync parse (e.g. run `schema['~standard'].validate(value)` and bail on `isPromiseLike`, mirroring `schemaValidationMessage`), or wrap in try/catch returning `undefined`. Register `schemaFieldMessageAsync` in `onChangeAsync` whenever the resolved form schema is async (not only when per-field async/inline validation exists), so async schema issues actually reach the field error UI.

---

### [SEVERITY: HIGH] Finding 2: Masked/phone inputs leave rejected characters visible — displayed value desyncs from form value
**File**: packages/formedible/src/components/formedible/fields/masked-field.tsx:35 (same class of issue in phone-field.tsx:55-59)
**Problem**: These inputs sanitize the change value (masking strips non-matching chars; phone formatting strips non-digits) and rely on a controlled re-render to clean the DOM. When the sanitized result is identical to the previously rendered `value` prop, React does not rewrite the input's DOM value (React only updates a controlled input's DOM when the prop value changes between renders), so the rejected characters remain visible indefinitely while the form state stays clean.
**Evidence**:
```tsx
// masked-field.tsx:35
onChange={(event) => field.onChange(mask ? applyInputMask(event.target.value, mask, maskedInputConfig, value) : event.target.value)}
```
Scenario A (rejected char): mask `(999) 999-9999`, stored value `''`. User types `a` → DOM `a` → `applyInputMask('a', …)` returns `''` → `field.onChange('')` — state unchanged, prop unchanged → DOM keeps showing `a`.
Scenario B (overflow): stored `(555) 123-4567` (mask full). User types `8` at the end → DOM `(555) 123-45678` → re-mask yields the same `(555) 123-4567` → no prop change → the `8` stays visible as if accepted, but it is not in the form value that will be submitted.
Same class in `phone-field.tsx` (`updateValue` → `formatPhone` strips letters): a typed letter lingers in the DOM until the next accepted keystroke.
**Impact**: Users see input content that the form will not submit — for masked fields the phantom character can persist indefinitely (e.g. an 11th digit of a phone number appears entered but is silently dropped). Data-integrity perception bug, no crash.
**Suggestion**: When the sanitized value equals the previous value, force the DOM reset in the change handler (e.g. `event.target.value = sanitized` directly, or track a "sanitization version" state that forces a re-render), which is the standard technique for rejecting input in controlled components.

---

### [SEVERITY: HIGH] Finding 3: PhoneField international format stores the bare country code when the input is cleared — required validation then passes
**File**: packages/formedible/src/components/formedible/fields/phone-field.tsx:58
**Problem**: With `phoneConfig.format === 'international'`, clearing the input produces `field.onChange('+1')` (or `+44`, `+49`, …) instead of an empty value, because the empty formatted string is trimmed away together with the space.
**Evidence**:
```ts
function updateValue(countryCode: CountryCode, nextValue: string) {
  const nextCountry = countries[countryCode];
  const formatted = formatPhone(nextValue, nextCountry.format);
  field.onChange(config?.format === 'international' ? `${nextCountry.code} ${formatted}`.trim() : formatted);
}
```
User clears the input (select-all + Backspace) → `formatted === ''` → `` `+1 `.trim() `` → `'+1'`. On the next render `stripCountryCode('+1', '+1')` → `''`, so the input *displays* empty while the stored value is `'+1'`. `isEmptyValue('+1')` is false, so the built-in required check in `validation.ts` passes; without a schema the submitted value is the literal string `'+1'`. The same happens when the user switches country while the field is empty (`updateValue(code, '')`).
**Impact**: A visually empty, "required" phone field submits the bare country code as a valid value — silent bad data. National format is unaffected (`''` is stored and correctly flagged as empty).
**Suggestion**: Only prefix the country code when `formatted !== ''`; otherwise call `field.onChange('')` (or `undefined`) so empty stays empty in both formats.

---

### [SEVERITY: MEDIUM] Finding 4: `required` never fails for checkbox/switch fields (unchecked = `false` passes)
**File**: packages/formedible/src/lib/formedible/validation.ts:163-173
**Problem**: `isEmptyValue` treats only `undefined`/`null`/`''`/`[]` as empty. Checkbox and switch fields store a strict boolean (`checkbox-field.tsx`: `onCheckedChange={(nextChecked) => field.onChange(nextChecked === true)}`; `switch-field.tsx` passes the boolean through), so an unchecked required checkbox has value `false`, which is "not empty", and `validateRequired` returns `undefined`.
**Evidence**:
```ts
function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function validateRequired(field, value) {
  if (!field.required || !isEmptyValue(value)) {
    return undefined;
  }
  ...
}
```
HTML semantics for a required checkbox are "must be checked"; every major form library enforces this. Here a consent/terms checkbox with `required: true` and `defaultValues.accept = false` submits successfully while unchecked.
**Impact**: Required-confirmation checkboxes/switches pass validation unchecked unless the developer also adds a schema or custom validator — a data-integrity gap for a documented built-in constraint.
**Suggestion**: In `validateRequired` (or `validateBuiltInConstraints`), special-case boolean-valued fields: when `field.required` and `field.type` is `checkbox`/`switch` and value is not `true`, emit the required error.

---

### [SEVERITY: MEDIUM] Finding 5: Required error message renders "[object Object] is required" when `label` is a ReactNode
**File**: packages/formedible/src/lib/formedible/validation.ts:172
**Problem**: `label` is typed `ReactNode` (types.ts:289) and is interpolated into the required message with `String(...)`. `String(<CustomLabel />)` (or any object/fragment label) yields `"[object Object]"`, producing the user-facing message `"[object Object] is required"`.
**Evidence**:
```ts
return `${String(field.label ?? field.name)} is required`;
```
**Impact**: Garbage validation copy shown under the field for any non-string label (JSX elements are a fully supported `label` type; the validation summary in use-formedible renders the same label directly).
**Suggestion**: Use the label only when it is a string: `const name = typeof field.label === 'string' && field.label ? field.label : field.name;`

---

### [SEVERITY: MEDIUM] Finding 6: Async field-level schema (`validation` prop) silently never validates
**File**: packages/formedible/src/lib/formedible/validation.ts:135-143, 343-364
**Problem**: `FormedibleStandardFieldSchema.validate` is typed to allow `Promise<unknown>` (types.ts:178), but `schemaValidationMessage` returns `undefined` when the validate result is promise-like, and no async code path ever re-runs the field-level schema: `onChangeAsync` only awaits `fieldAsyncValidation`, `inlineValidation`, and the *form-level* schema (`schemaFieldMessageAsync`), never `runFieldValidation`.
**Evidence**:
```ts
function schemaValidationMessage(schema: FormedibleStandardFieldSchema, value: unknown): string | undefined {
  const result = schema['~standard'].validate(value);
  if (isPromiseLike(result)) {
    return undefined;             // async field schema: silently passes
  }
  return formatValidationError(validationIssues(result));
}
```
```ts
onChangeAsync: fieldAsyncValidation || inlineValidation
  ? async ({ value, fieldApi, signal }) => {
      // runs fieldAsyncValidation / inlineValidation / form-schema only —
      // field.validation schema is never evaluated asynchronously
    }
  : undefined,
```
**Impact**: A field configured as `validation: z.string().refine(async …)` passes all validation events without error and without any warning — validation silently disabled, in contrast to the top-level schema case which at least crashes loudly (Finding 1).
**Suggestion**: In the `onChangeAsync` body (registered also when `field.validation` resolves to an async standard schema), call `field.validation['~standard'].validate(value)`, await it, and map issues via `formatValidationError`.

---

### [SEVERITY: MEDIUM] Finding 7: NumberField wipes the input on leading `-`/`e` keystrokes — negative numbers silently become positive
**File**: packages/formedible/src/components/formedible/fields/number-field.tsx:55
**Problem**: For `<input type="number">`, while the user has typed a partial value like `-` or `1e`, the browser reports `target.value === ''` (badInput sanitization). The handler maps that to `undefined`, changing the rendered value from the previous number to `''`, so React rewrites the DOM and the whole visible content is cleared.
**Evidence**:
```tsx
onChange={(event) => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)}
```
Typing `-` first: DOM `-` → value `''` → `onChange(undefined)` → rendered value `''` → the minus disappears immediately. The user then types `5` and gets positive `5` while intending `-5` (the sign is silently lost). Similarly `1` then `e` clears the `1`, making scientific entry (`1e5`) impossible. Note the contrast with Finding 2: here the value prop *changes*, so React clears the entire input rather than leaving the stray character.
**Impact**: Natural minus-first typing flow produces wrong-sign data without any error; a standard `min`-negative field (temperature, deltas, geo coordinates) is error-prone to fill.
**Suggestion**: Detect `event.target.validity.badInput` (or keep a local draft string state keyed to the input) and leave the stored value untouched while the input is in a transient badInput state, only committing on `event.target.value !== ''`.

---

### [SEVERITY: MEDIUM] Finding 8: Whole-form schema is re-parsed per field, per event, and per render
**File**: packages/formedible/src/lib/formedible/validation.ts:238-264, 382-407
**Problem**: `schemaFieldMessage` resolves a single field's schema error by running `formApi.parseValuesWithSchema(schema)` — a full parse of the entire form values. This runs inside every field's `onChange`/`onBlur`/`onSubmit` validators, in addition to the form-level validators built by `buildFormValidators` (another full parse per event). It is amplified by `useFormedible`: `getInvalidFieldEntries` (use-formedible.tsx:248-264) invokes `validators.onSubmit` for **every** field inside the `form.Subscribe` render callback, i.e. N additional full schema parses on every render/keystroke for an N-field form.
**Evidence**:
```ts
const fields = formApi.parseValuesWithSchema(schema)?.fields;   // per field validator call
...
const schemaFields = standardSchema ? formApi.parseValuesWithSchema(standardSchema)?.fields : undefined;  // per form validator call
```
**Impact**: O(N) `safeParse` runs of the whole schema per keystroke on schema-backed forms; noticeable jank on large multi-page forms (e.g. 40 fields × zod parse per render). Not a correctness bug — a data-volume/performance cliff that scales with field count.
**Suggestion**: Parse once per validation cycle and share the result (e.g. memoize `parseValuesWithSchema` per values snapshot, or resolve per-field errors from the form-level validator's already-mapped `fields` result instead of re-parsing inside each field validator); in `useFormedible`, read the already-computed `fieldMeta` errors instead of re-running `onSubmit` validators during render.

---

### [SEVERITY: MEDIUM] Finding 9: Phone country dropdown cannot be dismissed by clicking outside (no outside-click/escape handling)
**File**: packages/formedible/src/components/formedible/fields/phone-field.tsx:66-89
**Problem**: The country menu is plain `open` state toggled only by the trigger button; there is no outside-click listener, no Escape handling, and no `onBlur` closure. Once opened, the absolutely-positioned menu (z-50) stays open until the user clicks the trigger again or picks a country.
**Evidence**:
```tsx
const [open, setOpen] = useState(false);
...
<Button variant="outline" ... onClick={() => setOpen((isOpen) => !isOpen)}>
...
{open && (
  <div className="absolute z-50 mt-1 min-w-48 ...">
```
**Impact**: The overlaying menu blocks the phone input and adjacent content with no standard dismissal path — a functional interaction bug (native `select`/popover semantics expected by users), not just styling.
**Suggestion**: Close on outside pointerdown (document listener while `open`) and on Escape; or compose with the shadcn `Popover` primitive already used by other fields in this package.

---

### [SEVERITY: MEDIUM] Finding 10: Template interpolation silently fails for array-index paths (`{{items[0].name}}`)
**File**: packages/formedible/src/lib/formedible/dynamic-text.ts:11
**Problem**: The interpolation regex only accepts `[\w.]+` inside `{{ }}`, so any template containing an array index (brackets) does not match at all and is rendered verbatim to end users. This contradicts the rest of the path machinery in the same package: `parseFieldPath`/`getValueAtFieldPath` (field-path.ts:19-58) fully support `items[0].name`, and string `conditional`s resolve through that same function, so conditionals support index paths while text interpolation silently does not.
**Evidence**:
```ts
return text.replaceAll(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, fieldName: string) => {
  const value = getValueAtFieldPath(values, fieldName);   // supports 'items[0].name' ...
  ...
});
// ... but the regex never captures 'items[0].name', so the callback never runs for it
```
**Impact**: A dynamic label/description/placeholder like `Item {{items[0].name}}` renders the literal braces `{{items[0].name}}` in the UI with no warning — a silent, user-visible failure mode that is hard to diagnose. (XSS is not a concern: interpolated values only flow into React text nodes/attributes, which escape.)
**Suggestion**: Broaden the capture group to the bracket syntax understood by `parseFieldPath`, e.g. `/\{\{\s*([\w.[\]-]+)\s*\}\}/g` (or reuse a path-pattern constant), keeping missing-value fallback to `''`.

---

## Files reviewed with no findings

- `packages/formedible/src/lib/formedible/zod-errors.ts` — issue normalization and message extraction are correct for the shapes TanStack produces (`{ fields: Record<path, issue[]> }`); `getIssueFieldName` is currently unused but harmless.
- `packages/formedible/src/lib/formedible/normalize-options.ts` — shallow normalization is safe (no mutation of user objects); nested fields are re-normalized at their render sites (object-field/array-field call `normalizeFieldConfig`, use-formedible re-normalizes on name change).
- `packages/formedible/src/lib/utils.ts` — standard shadcn `cn`.
- `packages/formedible/src/components/formedible/fields/field-wrapper.tsx` — correct help config discrimination, error/invalid wiring; tooltip-as-description is documented intentional design.
- `packages/formedible/src/components/formedible/fields/field-registry.tsx` — all 26 normalized types mapped; alias resolution happens upstream; TextField fallback is reasonable.
- `packages/formedible/src/components/formedible/fields/text-field.tsx` — controlled binding and datalist wiring correct.
- `packages/formedible/src/components/formedible/fields/textarea-field.tsx` — word count and maxLength handling correct.
- `packages/formedible/src/components/formedible/fields/password-field.tsx` — toggle button defaults to `type="button"` (ui/button.tsx:22), strength meter is display-only per documented design.
