# Verified Report — Cluster 9 (AI provider/model picker, `packages/ai-picker`)

Verification agent: re-read every referenced source location in `packages/ai-picker/src`, the synced copy in `packages/ui/src/components/formedible/ai-picker/` (content-identical; only import paths differ), the host usage in `packages/ai-builder`, the core `packages/formedible` conditional convention, and the installed `react-dom@19.2.5` DOM-update source. Repo files were not modified.

**Verdict summary: 7 confirmed, 1 dismissed.**

---

### Finding 1: Provider switch does not invalidate provider-scoped state (stale catalog) — CONFIRMED
**Original**: `effectiveCatalog` falls back to `fetchedCatalog` without checking `fetchedCatalog.provider`; nothing resets it on provider switch, so a catalog fetched for one provider renders as another provider's model suggestions; the old API key is also kept and re-labeled under the new provider. (HIGH)
**Verification**: Code matches the report exactly.
- `ai-picker.tsx:113-116` — `modelCatalogProp ?? modelCatalogs?.[currentSettings.provider] ?? fetchedCatalog`; no `fetchedCatalog.provider === currentSettings.provider` check.
- `setFetchedCatalog` appears only at `ai-picker.tsx:93,144,145` (init, success, catch). The file imports no `useEffect`; there is no provider-change effect that clears or re-keys it. `ProviderModelCatalog` carries a first-class `provider` field (ai-picker-types.ts:56) that the code could check but never does.
- Panel provider `onValueChange` (ai-picker-panel.tsx:110-121) sets `provider` + default model and clears `thinkingBudgetTokens` for non-Anthropic, but does NOT touch `apiKey` or the catalog. `valuesToSecrets` (ai-picker.tsx:37-42) re-derives `provider` from `values.provider`, so the previous provider's key really is re-labeled under the new provider's secrets — exactly as reported.
- Impact chain verified: the stale catalog feeds `ModelAutocompleteField` suggestions (panel:94 → model-autocomplete-field.tsx:21-57, clickable options), stale `fetchedAt`/`error` text renders at panel:98 regardless of provider match, and `validateProviderAccess` (ai-picker-utils.ts:45-77) never validates the model id against the provider — so a stale `gpt-5.4-mini` selection under Anthropic passes validation.
- Scope note (calibration, not dismissal): the only in-repo host (`ai-builder.tsx:276`) passes a provider-keyed `modelCatalog` and does not use `onFetchModels`, so the shipped app doesn't hit this path today. The bug hits the component's own flagship `onFetchModels` flow (registry consumers / any host without `modelCatalogs`), which is what the report claimed. HIGH is defensible as the package's primary flow silently produces wrong-provider configs.

### Finding 2: Custom schema-field branches hardcode `value=""` / `checked={false}` — CONFIRMED
**Original**: Fallback branches for fields outside the hardcoded names render controlled inputs hardcoded to empty/false, so any custom field added via the `schema` prop never displays its state. (MEDIUM)
**Verification**: Verified at ai-picker-panel.tsx:264 (`checked={false}`), :281 (`value=""`, number), :300 (`value=""`, text/password). Any field whose `name` is not one of the eight hardcoded names reaches these branches (`mergePickerSchema` explicitly supports appending new fields, tested in ai-picker.test.ts:236-254, and a test renders a custom field at :507-518 — but only asserts static markup, never interactivity, so the tests don't contradict the finding).
- It is actually worse than reported: in uncontrolled mode `handleValuesChange` (ai-picker.tsx:120-133) round-trips through `valuesToSettings`/`valuesToSecrets`, which extract only the eight known keys — a custom field's value is dropped from internal state on every change, and in controlled mode it never even reaches the host's `onChange`. So custom fields are broken at both the render layer and the state layer.
- Not intentional design: the fallback branches exist precisely to render custom fields, and the field type carries `[customProp: string]: unknown` — the intent to support them is clear; the implementation just doesn't read `values[field.name]` back.

### Finding 3: `evaluateConditional` compiles schema strings with `new Function` — CONFIRMED (severity recalibrated)
**Original**: Field visibility is evaluated via `new Function('values', 'return (conditional)(values)')`, executing arbitrary JS with the full `AiPickerValues` (including `apiKey`) in scope; diverges from the core package's safe field-path semantics. (MEDIUM)
**Verification**: Code verified at ai-picker-panel.tsx:45-56; it runs for every field on every render (panel:330) and receives the full values object including the API key. The default conditional strings (default-picker-schema.ts:54,72) are developer-authored arrow-function literals. The core-package divergence claim is accurate: `packages/formedible/src/hooks/use-formedible.tsx:217-227` treats `conditional` as `((values) => boolean) | string` where a string is resolved as a **field path** via `getValueAtFieldPath` — no eval.
- Honest severity assessment (as instructed): the input is **not attacker-controlled today**. Within this repo the only evaluated strings are the developer-authored defaults; no host passes `schema` to `AiPicker` (grep of all call sites — `ai-builder.tsx:276` passes none), and the package itself never deserializes a schema from storage or the network. So this is not an exploitable vulnerability in the current codebase.
- Why still confirmed: (a) `new Function` is a genuine code-execution gadget that runs with the API key in scope, in a package published as a shadcn registry block (registry.json) for arbitrary third-party hosts — and this product family is built on schema-driven UI where the natural evolution is schemas from config/LLM output (the sibling ai-builder literally generates schemas from LLM output; the core package handles that safely by design, this one would not); (b) the silent `catch → false` hides malformed conditionals with no diagnostic; (c) it contradicts the core package's established, safe convention for the identical concept. Treat as a real design/robustness defect (keep MEDIUM as code quality), not as an active security hole.

### Finding 4: `providerConfigs` and `onClearStoredSecrets` declared but never read — CONFIRMED
**Original**: Both props are in the exported `AiPickerProps` but never destructured/used; hosts relying on them get nothing. (MEDIUM)
**Verification**: `AiPicker` destructures neither (ai-picker.tsx:73-87). Repo-wide grep (including the synced copy in `packages/ui/src/components/formedible/ai-picker/`, which is content-identical modulo import paths):
- `providerConfigs`: appears ONLY in the type declarations (ai-picker/src/lib/ai-picker-types.ts:114 and the ui copy). No usage anywhere. Panel hardcodes `defaultProviderConfigs` (panel:38,59,127).
- `onClearStoredSecrets`: also unused inside the package — but the impact is not hypothetical: the real host **already passes it** at `packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:276` (`onClearStoredSecrets={clearProviderSecrets}`), and the prop is silently dropped. The only working "wipe key" button lives in the separate hand-rolled `ProviderSelection` component (ai-builder/src/components/formedible/ai/provider-selection.tsx:168), used for the expanded sidebar; the collapsed view's `AiPicker` has no such affordance despite the wiring. Stronger than the report stated — a shipped caller is already depending on the dead API.

### Finding 5: Controlled mode latched on first render, requires BOTH props — CONFIRMED
**Original**: `isControlled = useRef(settingsProp !== undefined && secretsProp !== undefined)` — passing one prop alone loses control of both; late-arriving props are ignored forever. (MEDIUM)
**Verification**: Verified verbatim at ai-picker.tsx:88 and :96-97. The ref is initialized once and never updated; `currentSettings`/`currentSecrets` consult only `isControlled.current`, so undefined→defined transitions after mount are permanently ignored. The type makes each prop independently optional (ai-picker-types.ts:105-106), so the settings-without-secrets trap is type-legal. Additional evidence it is not a deliberate uniform design: `persistencePreference` on the very next line (:98) is NOT latched — it is re-derived every render via `??`, so the component already mixes both patterns inconsistently.
- Calibration note: the in-repo host does not trip this — `ai-builder.tsx:96-97` resolves `providerSettings ?? internal defaults` before rendering, so `AiPicker` always receives defined props. The bug bites the natural async restore flow (load persisted settings/secrets, then render/pass them) and third-party registry consumers. Real API-contract defect; MEDIUM is fair for a published component.

### Finding 6: API key input uses `autoComplete="off"` on a password field — CONFIRMED (severity: LOW, not MEDIUM)
**Original**: `type="password"` + `autoComplete="off"`; browsers widely ignore `off` on password fields, so the key can be saved to the password manager / autofilled despite the memory-only default. Suggests `autoComplete="new-password"`. (MEDIUM)
**Verification**: Verified at ai-picker-panel.tsx:142-148 — `type="password"`, `autoComplete="off"` (the `@formedible/ui` Input spreads props, so both reach the DOM). Current best practice confirmed: MDN documents that browsers ignore `autocomplete="off"` on password/login fields (password managers are treated as a user-side security feature) and recommends `autocomplete="new-password"` to suppress save/autofill offers ([MDN: Turning off form autocompletion](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion), [MDN: autocomplete attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)). The factual basis is real, not a myth, and the one-line fix is standard guidance for non-login secret fields. Honest judgment: this is a legitimate hygiene issue that mildly undermines the component's own opt-in persistence design (storageMode defaults to `'memory'`), but the practical risk is small (a hint browsers may still not honor; no attacker involvement) — LOW severity, not MEDIUM. It is more than a pure nitpick because the component explicitly promises memory-only by default.

### Finding 7: `handleRefreshModels` swallows fetch errors and wipes the previous catalog — CONFIRMED
**Original**: `.catch(() => setFetchedCatalog(undefined))` discards the error and any previously successful catalog even though `ProviderModelCatalog` has a first-class `error` field that the panel renders. (MEDIUM)
**Verification**: Verified verbatim at ai-picker.tsx:135-147. The panel's error slot exists and renders `modelCatalog?.error` ahead of the "Last refreshed" text (ai-picker-panel.tsx:98), and the type carries `error?: string` (ai-picker-types.ts:59) — so the data model was built to surface failures and this code path starves it. On a rejected `onFetchModels` the user gets zero feedback (spinner just stops) and a valid previously-fetched catalog plus its `fetchedAt` metadata is erased. Real. (Note: if a host resolves with an error-bearing catalog the slot works; only rejections are swallowed — which is what the report said.)

### Finding 8: Number inputs clobber intermediate decimal input — DISMISSED
**Original**: Controlling `temperature`/`maxTokens`/`thinkingBudgetTokens` with the parsed value means typing `"0."` sanitizes to `""`, state becomes `undefined`, and "the `0` is wiped when `.` is entered" — typing `0.5` in natural order loses characters. (MEDIUM)
**Reason**: The quoted code is accurate (panel:24-31, 208-257) and the spec premise is true — for `<input type="number">`, `"0."` is not a valid floating-point number, so `event.target.value` returns `""` mid-typing. But the claimed user-visible clobbering does not occur under the React actually installed in this repo (react-dom 19.2.5), because React's controlled-input updater skips the DOM write exactly in this situation. From `node_modules/.pnpm/react-dom@19.2.5_react@19.2.5/.../react-dom-client.development.js:1661-1667` (`updateInput`):

```js
if (null != value)
  if ("number" === type) {
    if ((0 === value && "" === element.value) || element.value != value)
      element.value = "" + getToStringValue(value);
  }
```

Trace for typing `0.5` with this component (`value={values.temperature ?? ''}`):
1. Type `0` → DOM value `"0"` → state `0` → rendered `0` → `"0" != 0` is false (loose equality) → no write. OK.
2. Type `.` → visible text `"0."`, DOM value getter `""` → `parseOptionalNumber('')` → `undefined` → rendered `''` → `'' != ''` is false → **React does not assign**, so the browser's internal editing state `"0."` stays on screen. The `0` is NOT wiped.
3. Type `5` → DOM value `"0.5"` → state `0.5` → `"0.5" == 0.5` → no write. Works.

The loose (`!=`) comparison also preserves representations that differ textually from the state's serialization: `"0.50" == 0.5`, `"1e3" == 1000`, `"007" == 7` — all skip the write, so trailing zeros and exponent forms survive too. Under a hypothetical browser that returned `"0."` unsanitized, step 2 would parse `Number("0.") === 0` → `"0." == 0` → still no write. Either browser regime, natural-order decimal typing works.
- Residual truth in the finding is real but far narrower than claimed and does not match the reported severity/impact: (a) raw input whose `Number()` is non-finite (e.g. `1e999` → `Infinity` → `parseOptionalNumber` → `undefined` → `''` vs DOM `"1e999"` → React writes `''`) gets wiped; (b) leaving an incomplete `"0."` and blurring silently maps to `undefined` while the screen shows `0.` (state/UI desync, no clobber-typing). Neither is "typing 0.5 loses characters". The suggested draft-string pattern is still the cleaner design, but the headline defect as written is a false positive for this implementation on React 19.

---

## Dismissed-false-positive checks performed (no report finding dismissed on these grounds)
- Intentional design: none of the confirmed findings had a comment/test/doc indicating intent; tests only assert static rendering (they never exercise custom-field input or catalog switching).
- Guards elsewhere: `isAIProvider`/`isStorageMode` guard Select values, but nothing anywhere guards `fetchedCatalog` provider mismatch (F1) or wires `providerConfigs`/`onClearStoredSecrets` (F4).

## Final tally
**7 confirmed, 1 dismissed.**
Confirmed: F1 provider-switch stale catalog (HIGH), F2 hardcoded `value=""`/`checked={false}` custom fields (MEDIUM), F3 `new Function` conditional eval (MEDIUM as design defect; latent, not exploitable today), F4 dead `providerConfigs`/`onClearStoredSecrets` props (MEDIUM, already bitten by in-repo host), F5 controlled-mode latch (MEDIUM), F6 `autoComplete="off"` on password field (recalibrated LOW), F7 swallowed fetch error + catalog wipe (MEDIUM).
