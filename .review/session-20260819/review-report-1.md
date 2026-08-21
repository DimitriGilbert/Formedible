# Cluster 1 Review — Core form engine

Reviewer scope: `use-formedible.tsx`, `form.tsx`, `field-renderer.tsx`, `types.ts`, `normalize-field-config.ts`, `field-path.ts` (owning sources under `packages/formedible/src/`).

Key runtime facts verified against the resolved dependency (`@tanstack/react-form@1.32.0` / `@tanstack/form-core@1.32.0` in `node_modules/.pnpm`):

- `useForm` does **not** subscribe the calling component to the form store. Only `form.Field` and `form.Subscribe` re-render on state changes. Reads of `form.state` in event handlers are live (it is a getter over the store); reads during the hook host's render are frozen snapshots until the host re-renders for an unrelated reason.
- `FieldApi.mount()`'s cleanup resets `fieldMetaBase[name]` to `defaultFieldMeta` (errors cleared, only `isTouched`/`isBlurred`/`isDirty` preserved) whenever a field unmounts.
- `FormApi._handleSubmit` marks all fields touched, runs `validateAllFields('submit')`, then form validation, then calls `onSubmitInvalid` with populated `fieldMeta`. It re-throws errors raised by `options.onSubmit`.

---

### [SEVERITY: HIGH] Finding 1: Conditional pages/tabs never react to value changes — visibility is computed from a non-reactive snapshot
**File**: packages/formedible/src/hooks/use-formedible.tsx:160-166
**Problem**: `useMultiPage` and `useFormTabs` are fed `values: form.state.values` captured during the hook host's render. Because TanStack v1's `useForm` does not re-render the host on value changes, and nothing in `useFormedible` subscribes the host to the store, `visiblePages`, `visibleTabs`, `totalPages`, and `progressValue` only recompute when the host re-renders for an unrelated reason (tab click, page navigation, submit attempt).
**Evidence**:
```ts
const multiPage = useMultiPage({
  fields,
  pages: config.pages,
  values: form.state.values,   // render-time snapshot; host never re-renders on change
  onPageChange: handlePageChange,
});
const tabs = useFormTabs({ fields, tabs: config.tabs, values: form.state.values });
```
`useMultiPage` computes `getVisiblePageNumbers(fields, pages, values)` in a `useMemo` keyed on that stale `values` object (`use-multi-page.ts:63`), and `goToNextPage`/`goToPreviousPage` close over the stale `safeVisiblePages`.
**Impact**: Breaks the required compatibility behavior "conditional pages" (FROM-SCRATCH-2.md Input Compatibility #12; the shipped example `apps/web/src/components/docs/examples/conditional-pages-form.tsx` gates pages 2/3 on `values.applicationType` and page 5 on `values.needsPremium`). Concretely: user switches `applicationType` from individual to business on page 1 → `visiblePages` still `[1,2,4,6]` → clicking Next sets page 2 → host re-renders → fresh visible list `[1,3,4,6]` doesn't contain 2 → the effect in `use-multi-page.ts:71-75` bounces the user back to page 1. Navigation appears broken on first click; progress/step counts stay wrong until an unrelated re-render. Same staleness applies to conditional tabs.
**Suggestion**: Derive page/tab visibility from live values — either subscribe inside `useFormedible` (e.g. `useStore(form.store, s => s.values)` or a `form.Subscribe`-driven `useState` sync) and pass that as `values`, or move the `visiblePages`/`visibleTabs` computation inside the `form.Subscribe` render (the same pattern already used for `renderFields(formValues)`).

---

### [SEVERITY: HIGH] Finding 2: Persistence autosave never triggers while the user types
**File**: packages/formedible/src/hooks/use-formedible.tsx:167-171
**Problem**: `useFormPersistence` updates `latestValuesRef.current` and computes `persistedValuesSignature` only during the hook host's render (use-form-persistence.ts:100-102). Its debounced save effect (`use-form-persistence.ts:155-167`) only re-runs when that signature changes. Since value changes never re-render the host (see Finding 1), typing schedules no save; the effect's cleanup on unmount merely cancels a timeout that was never scheduled for recent edits.
**Evidence**:
```ts
const { saveToStorage, loadFromStorage, clearStorage } = useFormPersistence(form, config.persistence, {
  currentPage: multiPage.currentPage,
  ...
});
// use-form-persistence.ts:
latestValuesRef.current = form.state.values;  // host render only
const persistedValuesSignature = config ? JSON.stringify(withoutPersistedFields(latestValuesRef.current, config.exclude)) : '';
```
**Impact**: The `debounceMs` autosave promised by `FormediblePersistenceConfig` (and exercised by the persistence compatibility example, which sets `debounceMs: 1500` with no explicit save button) only fires on page/tab navigation or submit attempts. On a single-page persisted form nothing is ever saved until a submit attempt; values typed immediately before the tab is closed are silently lost. Violates the "persistence" required input behavior in FROM-SCRATCH-2.md.
**Suggestion**: Subscribe to value changes where the save is scheduled (e.g. drive the signature from a live subscription inside `useFormedible` and pass it down), or schedule the debounced save from the field `onChange` handler in `renderField` (which already runs on every change), and flush (not just cancel) on unmount.

---

### [SEVERITY: HIGH] Finding 3: `Form` is redefined on every hook render — every host re-render remounts the entire form and clears TanStack field errors
**File**: packages/formedible/src/hooks/use-formedible.tsx:552
**Problem**: `function Form({ className, ... }: FormProps)` is declared inside `useFormedible`, so each host render returns a new component type. Rendering `<Form />` with a changed function identity makes React unmount and remount the whole form subtree. Remount unmounts every `form.Field`, and TanStack's `FieldApi.mount()` cleanup resets `fieldMetaBase[name]` to `defaultFieldMeta` — wiping recorded errors (only touched/blurred/dirty flags survive).
**Evidence**:
```ts
function Form({ className, onBlur, ... , ...props }: FormProps) {   // new identity per render
```
Host re-renders are guaranteed in normal flows: `setHasInvalidSubmitAttempt(true)` fires on every invalid submit (lines 599, 89), `multiPage.setCurrentPage` on navigation, `tabs.setActiveTab` on tab clicks.
**Impact**: After an invalid submit (path via `onSubmitInvalid`, where `validateAllFields('submit')` has just populated `fieldMeta`), the `setHasInvalidSubmitAttempt` re-render immediately remounts the tree and erases those errors. `field.state.meta.errors` (used at line 395 for `error`, which drives `FieldError`, `aria-invalid`, `data-invalid` in `field-wrapper.tsx`) becomes empty, so inline errors that were visible while typing disappear the moment the user clicks Submit — only the manually recomputed summary remains. This contradicts the rewrite's own validation architecture rule ("All validation errors render in the normal field error area", FROM-SCRATCH-2.md). Additional fallout: field-local UI state (password visibility toggle, combobox open state, file pickers) resets on page/tab navigation, and any consumer whose parent re-renders per keystroke gets focus loss per keystroke.
**Suggestion**: Give `Form` a stable identity — hoist it out of the hook and pass state via a context provider, or at minimum `useMemo` it keyed on `[form]` and move all value-dependent logic inside `form.Subscribe` (which already re-renders correctly). See also Finding 4, which combines with this one.

---

### [SEVERITY: HIGH] Finding 4: Submit handler early-returns before `form.handleSubmit()` — submit-path errors are never persisted to field meta
**File**: packages/formedible/src/hooks/use-formedible.tsx:593-605
**Problem**: The DOM `onSubmit` handler re-implements validation: it computes entries manually and, if any are found, returns without invoking `form.handleSubmit()`. TanStack's submit machinery therefore never runs: fields are not marked `isTouched`, `validateAllFields('submit')` never executes, and no errors are written to `fieldMeta`.
**Evidence**:
```ts
const invalidEntries = getInvalidFieldEntries(form.state as FormedibleValidationFormState<TFormValues>);

if (invalidEntries.length > 0) {
  setHasInvalidSubmitAttempt(true);
  handleInvalidSubmitEntries(invalidEntries);
  return;              // form.handleSubmit() never called
}

form.handleSubmit();
```
On a pristine form, `fieldMeta` has no errors yet, so the manual check relies entirely on `getFieldErrorFromConfiguredValidation` re-running the built `onSubmit` validators synchronously.
**Impact**: After clicking Submit on untouched invalid fields, `field.state.meta.errors` stays empty — no inline `FieldError`, no `aria-invalid`/`data-invalid` styling; only the summary (which recomputes entries by re-running validators on every render) shows anything. Validation is also duplicated: the same validators run once manually and again on every subsequent change. Combined with Finding 3, inline errors are absent after submit in both code paths (early return, and `onSubmitInvalid` + remount).
**Suggestion**: Always call `form.handleSubmit()` and do navigation/focus work in `onSubmitInvalid` (which already exists and receives populated `fieldMeta`). The manual synchronous entry computation can remain for the summary, but it must not gate the TanStack submit lifecycle.

---

### [SEVERITY: HIGH] Finding 5: `getValuesWithFieldUpdate` corrupts values for nested field paths (`parent.child`, `items[0].name`)
**File**: packages/formedible/src/hooks/use-formedible.tsx:134-136, 424-425
**Problem**: The helper spreads the changed value in as a top-level key. Nested fields (object subfields via `object-field.tsx:30-36`, array items via `array-field.tsx:139-153`) route their `onChange` through this same closure with dotted/bracketed names, producing a values object with a bogus literal key and a stale nested object.
**Evidence**:
```ts
function getValuesWithFieldUpdate(fieldName: string, nextValue: unknown): TFormValues {
  return { ...form.state.values, [fieldName]: nextValue } as TFormValues;
}
// called as:
const nextValues = getValuesWithFieldUpdate(fieldName, nextValue);   // fieldName e.g. 'items[0].name'
config.formOptions.onChange?.({ value: nextValues, formApi: getFormApiContext(nextValues) });
```
For `fieldName = 'contacts[0].email'` the consumer's `onChange` receives `{ ...values, 'contacts[0].email': 'a@b.c' }` where `values.contacts[0].email` still holds the pre-change value.
**Impact**: `formOptions.onChange` (a documented public callback, `FormedibleFormOptions.onChange`) delivers corrupted data for any form using object/array fields — nested paths are a required behavior ("Nested Field Requirements" in FROM-SCRATCH-2.md: `object.child`, `array[0].child`). Consumers keying dynamic behavior off `value` get wrong results; the `formApi.state.values` in the same context is equally corrupted.
**Suggestion**: Write through the parsed path — implement a `setValueAtFieldPath` using the existing `parseFieldPath`/`pathSegmentsToFieldPath` helpers (immutable deep set), or read back from `form.state.values` after the change is committed rather than synthesizing the object.

---

### [SEVERITY: MEDIUM] Finding 6: `isSubmitting` is read non-reactively — controls never disable during an async submit
**File**: packages/formedible/src/hooks/use-formedible.tsx:553-554
**Problem**: `Form` reads `(form.state as { isSubmitting?: boolean }).isSubmitting` during the host render. `isSubmitting` only changes via store updates the host never subscribes to, so `controlsDisabled` cannot update between host renders. The `Submit` button therefore stays enabled while `onSubmit` is in flight.
**Evidence**:
```ts
const isSubmitting = Boolean((form.state as { readonly isSubmitting?: boolean }).isSubmitting);
const controlsDisabled = Boolean(config.disabled || config.loading || isSubmitting);
```
**Impact**: The guard is dead code — its intended effect (block double submissions, show busy state) never activates. A double click during an async `onSubmit` triggers a second `_handleSubmit`, which fails the `canSubmit` check and calls `onSubmitInvalid`, which in turn sets `hasInvalidSubmitAttempt(true)` (spurious invalid-state UI + remount per Finding 3) while the first submission is still running.
**Suggestion**: Subscribe to submission state where it is consumed (e.g. `form.Subscribe selector={(s) => s.isSubmitting}` for the disabled computation), or drop the local read and rely on TanStack's own double-submit protection.

---

### [SEVERITY: MEDIUM] Finding 7: Invalid-entry computation runs on every store update and re-parses the whole schema per field
**File**: packages/formedible/src/hooks/use-formedible.tsx:608-613 (with 234-246, 248-264)
**Problem**: Inside `form.Subscribe`, `getInvalidFieldEntries` runs unconditionally on every `values`/`fieldMeta` store change — even when the summary and badges are disabled or no submit has been attempted. For every field without a meta error, `getFieldErrorFromConfiguredValidation` re-runs the built `onSubmit` validator, whose `schemaFieldMessage` calls `formApi.parseValuesWithSchema(schema)` — a full form-values schema parse per field.
**Evidence**:
```ts
<form.Subscribe selector={(state) => ({ values: state.values, fieldMeta: state.fieldMeta })}>
  {(state) => {
    ...
    const invalidEntries = getInvalidFieldEntries({ values: formValues, fieldMeta: state.fieldMeta });  // unconditional
```
**Impact**: O(fields × full-schema-parse) work on every keystroke for schema-backed forms (e.g. a 20-field zod form parses the entire values object 20 times per keystroke). Purely wasted unless `validationSummaryConfig.enabled && hasInvalidSubmitAttempt` is true (the only consumers of `pageErrorCounts`/`tabErrorCounts` gate on exactly that at lines 547 and 625).
**Suggestion**: Gate the computation: `const invalidEntries = validationSummaryConfig.enabled && hasInvalidSubmitAttempt ? getInvalidFieldEntries(...) : [];` and compute page/tab counts only when `showBadges` is on. If the schema path is kept, parse once per render and share the result across fields.

---

### [SEVERITY: MEDIUM] Finding 8: Abandon analytics report a completion percentage frozen at the last host render
**File**: packages/formedible/src/hooks/use-formedible.tsx:214 (with 199-211)
**Problem**: `pageValidationStateRef` stores the *function* (so it reads live state when invoked), but `abandonContextRef` stores the *result* of `getAbandonContext()` evaluated during the host render. Since the host does not re-render on value changes (Finding 1), the snapshot's `completionPercentage` reflects the values as of the last unrelated re-render.
**Evidence**:
```ts
pageValidationStateRef.current = getPageValidationState;   // deferred — reads live state
abandonContextRef.current = getAbandonContext();           // eager — frozen snapshot
```
`useFormAnalytics`'s unmount cleanup then reports `abandonContextRef.current` via `onFormAbandon` (use-form-analytics.ts:70-87).
**Impact**: `analytics.onFormAbandon(completionPercentage, ...)` under-reports completion for anything typed since the last page/tab switch or submit attempt — silently wrong analytics data for the abandon funnel.
**Suggestion**: Store the function, not the value: `abandonContextRef.current = getAbandonContext;` and have the analytics option call it (`getAbandonContext: () => abandonContextRef.current()`), matching the `pageValidationStateRef` pattern one line above.

---

### [SEVERITY: MEDIUM] Finding 9: `form.handleSubmit()` rejections are unhandled; `clearStorage()` is skipped when the consumer's `onSubmit` throws
**File**: packages/formedible/src/hooks/use-formedible.tsx:92-96, 151-153, 604
**Problem**: `form.handleSubmit()` is invoked as a floating promise in three places (DOM submit handler, `scheduleAutoSubmit`, and the `handleSubmit` exposed via `getFormApiContext`). TanStack's `_handleSubmit` re-throws errors raised by `options.onSubmit` (verified in form-core `FormApi.js` catch block: `done(); throw err;`). Inside the hook's own `onSubmit`, `clearStorage()` runs after `await config.formOptions.onSubmit?.(...)`, so a rejection skips it.
**Evidence**:
```ts
onSubmit: async ({ value }) => {
  analytics.trackFormComplete(value as TFormValues);
  await config.formOptions.onSubmit?.({ value, formApi: getFormApiContext(value as TFormValues) });
  clearStorage();
},
...
form.handleSubmit();   // line 604 — no .catch
```
**Impact**: A failing consumer `onSubmit` (e.g. network error in the checkout example) surfaces as an unhandled promise rejection with no library-level error surface, and the persisted draft is neither cleared nor knowingly kept — behavior is accidental rather than designed. Note `trackFormComplete` also fires before success is known, so a failed submit is reported as complete.
**Suggestion**: Attach a `.catch` to `handleSubmit()` invocations (log with a descriptive message per repo conventions), and decide deliberately whether `clearStorage()` should run on failure (typically only after a successful submit — i.e. move it after the await, which it already is, but also verify `isSubmitSuccessful` or accept the throw path explicitly).

---

### [SEVERITY: MEDIUM] Finding 10: Duplicate section headers when a section title is a ReactNode
**File**: packages/formedible/src/hooks/use-formedible.tsx:352-364, 456-476
**Problem**: `getSectionKey` returns `undefined` whenever `section.title` is not a string. The header-dedup condition then short-circuits on `sectionKey === undefined`, so `shouldRenderHeader` is true for every field in such a section, rendering one header per field instead of one per section group.
**Evidence**:
```ts
return typeof section.title === 'string' ? `${section.title}\u0000${description}` : undefined;
...
const shouldRenderHeader = !previousFieldHadSection || sectionKey === undefined || sectionKey !== previousSectionKey;
if (dynamicConfig.section !== undefined && shouldRenderHeader) { renderedFields.push(renderSectionHeader(...)); }
```
Two consecutive fields both declaring `section: { title: <span>Premium</span> }` each render the "Premium" heading.
**Impact**: `FormedibleFieldSection.title` is typed `ReactNode`, so this is a supported configuration producing visibly duplicated headings. The sibling fields with string titles group correctly, making the inconsistency more jarring.
**Suggestion**: When the title is not a string, fall back to a structural key (e.g. reference identity of the section config via a `WeakMap` or the field-order index of the section's first field) instead of `undefined`, so consecutive fields sharing the same section config value still group.

---

### [SEVERITY: LOW] Finding 11: `onReset` fires callbacks and "form reset" analytics without resetting form values
**File**: packages/formedible/src/hooks/use-formedible.tsx:587-592
**Problem**: The reset handler invokes `config.formOptions.onReset`, `config.onFormReset`, and `analytics.trackFormReset('reset')` but never calls `form.reset()`. Values live in the TanStack store; a native form reset (from a consumer-supplied `<button type="reset">`, which can be passed through `Form`'s children) only mutates the DOM and fires no `input`/`change` events, so controlled inputs and the store diverge.
**Evidence**:
```ts
onReset={(event) => {
  onReset?.(event);
  config.formOptions.onReset?.({ value: form.state.values, formApi: getFormApiContext() });
  config.onFormReset?.(event, getFormApiContext());
  analytics.trackFormReset('reset');
}}
```
**Impact**: A consumer who adds a reset button gets reset callbacks and reset analytics while the actual values are not reset (and the DOM/store may visibly disagree until the next render). No built-in component currently renders a reset button, hence LOW.
**Suggestion**: Either call `form.reset()` in the handler before dispatching callbacks, or document that reset semantics are consumer-owned and do not emit `trackFormReset`.

---

## Files with no real issues found

- `components/formedible/form.tsx` — trivial passthrough, correct prop handling.
- `components/formedible/field-renderer.tsx` — component/wrapper resolution is correct; registry has a `TextField` fallback so unknown types cannot crash.
- `lib/formedible/types.ts` — no contract violations found; removed legacy callbacks (`onSubmitInvalid?: never`, `onPageComplete?: never`, etc.) are documented intentional decisions.
- `lib/formedible/normalize-field-config.ts` — alias mapping matches the documented compatibility list; no mutation of user input.
- `lib/formedible/field-path.ts` — parse/get/set-path helpers handle documented path shapes (`a.b`, `a[0].b`) correctly.

## SSR note

No SSR crashes found in the assigned files: `document` is only touched inside `focusInvalidField`'s timeout (client event driven), and storage access is guarded by `typeof window` in the persistence hook.
