# Verified Report — Cluster 6: Builder UI + builder libs & code generation

Verification of `/home/didi/workspace/Formedible/.review/session-20260819/review-report-6.md` against actual source on branch `re-codex`.

Method: read every referenced file:line; ran the REAL `code-generation.ts`, `FieldStore`, and `builder-config-registry.ts` from a /tmp scratch via `tsx` (repo untouched, scratch deleted); spot-checked `@tanstack/form-core@1.32.0` (installed version matches) — `FormApi.js:92` confirms `shouldUpdateValues = options.defaultValues && !evaluate(options.defaultValues, oldOptions.defaultValues) && !this.state.isTouched`, so the reporter's "verified non-issues" context is trustworthy.

Result: **7 confirmed, 0 dismissed.**

---

### Finding 1: addField/duplicateField generate colliding field names; duplicates silently corrupt preview values and make generated code uncompilable — CONFIRMED
**Original**: New field names derive from `fieldOrder.length + 1` (not the set of names in use); no uniqueness enforcement anywhere; renames unguarded. Delete-then-add or double-duplicate produces duplicate names → shared preview values + uncompilable generated code.
**Verification**:
- `packages/builder/src/components/formedible/builder/field-store.ts:22` — `name: \`field_${this.fieldOrder.length + 1}\``; `:95` — `name: \`${field.name}_copy\``; `:38-52` — `updateField` spreads `fieldUpdate` with no name-collision check. Grep across `packages/builder/src` for any uniqueness/dedup guard (unique, nameExists, isNameTaken, etc.): nothing — only unrelated UI strings.
- Ran the real `FieldStore` via tsx: add/add/add → `[field_1, field_2, field_3]`; delete `field_2` → `[field_1, field_3]`; add → **`[field_1, field_3, field_3]`** (2 fields named `field_3`). Double-duplicate of `email` → **`[email, email_copy, email_copy]`**. Renaming field_2 to `field_1` via `updateField` is accepted → `[field_1, field_1]`.
- Preview impact: `default-tabs.tsx:83` — `Object.fromEntries(fields.map((field) => [field.name, previewDefaultValue(field)]))` collapses duplicate keys; and `packages/formedible/src/hooks/use-formedible.tsx:389-391` renders `<form.Field name={fieldName}>`, so two fields with one name bind to the same TanStack value path (shared/overwriting inputs).
- Generated-code impact: ran the real `generateFormCode` with two fields named `field_3` → emits `field_3: z.string().optional(),` twice inside the `z.object({...})` literal → TS1117 (duplicate property) in copied consumer code.
- Reachability: add/add/add/delete-middle/add is the most basic builder flow (buttons in `default-tabs.tsx:29,47,50`). No false-positive signals.

### Finding 2: initialFields re-import effect keyed on array identity wipes user edits and can loop forever in controlled usage — CONFIRMED
**Original**: `useEffect(() => globalFieldStore.importFields(importedInitialFields), [importedInitialFields])` re-imports on every prop identity change; `importFields` destructively resets and always produces a new snapshot identity.
**Verification**:
- `form-builder.tsx:43` — `const importedInitialFields = initialFields ?? emptyInitialFields;`; `:50-52` — the effect keyed on `[importedInitialFields]`. An inline JSX array gets a new identity on every parent re-render.
- `field-store.ts:143-157` — `importFields` sets `this.fields = {}`, `fieldOrder = []`, then unconditionally `rebuildFieldSnapshot()` (new array identity) and `notifyStructureListeners()`. No deep-equality guard.
- Ran the real store via tsx: a deep-equal re-import (even re-importing the exact same array reference) still notifies listeners and changes the snapshot identity; a user edit (`name: 'user_edited'`) is destroyed by re-import (`user edit survived re-import: false`).
- Loop chain for controlled usage, each link verified in code: import → new snapshot identity → `useSyncExternalStore` re-render → `onChange` effect (`form-builder.tsx:54-56`, deps include `fields`) fires → consumer `setSaved(fields)` → parent re-render → new `initialFields` prop identity → import → … never settles because every import churns identity. The inline-array scenario (edits silently reverted on any parent re-render) follows from the same evidence. `apps/web/src/routes/docs/builder.tsx:46` even documents "initialFields is passed to globalFieldStore.importFields in an effect" — the behavior is as reported, not guarded.

### Finding 3: onChange effect includes the consumer's callback in its deps — inline callbacks fire every render and can cause an infinite update loop — CONFIRMED
**Original**: `useEffect(() => onChange?.(metadata, fields), [fields, metadata, onChange])` — with an inline arrow, the callback identity changes every parent render, so the effect re-fires with unchanged data; an unconditional `setState` in the callback loops forever.
**Verification**:
- `form-builder.tsx:54-56` matches the quote exactly. Inline callbacks are the documented canonical pattern: `packages/builder/README.md:82` — `onChange={(metadata, fields) => { builderDrafts.push(...) }}`.
- With an inline arrow, each parent re-render produces a new `onChange` identity → effect re-runs → `onChange` called with stale-equal data (the README's own example would push duplicate drafts on every parent re-render). If the callback does `setDraft({ m, f })` (new object every call → no React bailout), the cycle is: effect → setState → parent re-render → new callback identity → effect → … infinite ("Maximum update depth exceeded"). The store identity-churn test (Finding 2 evidence) additionally shows `fields` identity is not stable across imports, reinforcing the loop path when `initialFields` is involved.
- No ref-guard or eslint-disable intentional omission exists around this effect.

### Finding 4: global field store is shared by every FormBuilder instance; a second mount wipes the first builder's fields — CONFIRMED
**Original**: `globalFieldStore` is a module singleton; each FormBuilder re-imports its `initialFields` (or `[]`) on mount, so a second instance clears the store and both instances cross-contaminate.
**Verification**:
- `field-store.ts:250` — `export const globalFieldStore = new FieldStore()` (module singleton). `form-builder.tsx:44-48` — every instance subscribes to it via `useSyncExternalStore`; `:50-52` — mount effect calls `importFields(importedInitialFields)` where the default is `emptyInitialFields` (`[]`, line 13), and `importFields` with `[]` clears `fields`/`fieldOrder` and notifies.
- Concretely: instance A adds fields → mounting instance B (no `initialFields`) runs `importFields([])` → store emptied → A's fields destroyed; both instances render from the same store, so they show each other's data.
- No single-instance assumption is documented or enforced: README mentions `globalFieldStore` only as an export (`README.md:24`); `FROM-SCRATCH-2.md` contains no instance guidance (grep for global/singleton/instance: nothing). Note the report's design-intent acknowledgment: the global store itself is intentional per FROM-SCRATCH-2; the finding correctly targets the unguarded cross-instance wipe, which is a behavior break, not the design.

### Finding 5: generated schema interpolates field.name raw — free-form names produce broken or injected TypeScript — CONFIRMED
**Original**: `code-generation.ts:217` interpolates `field.name` unescaped into the `z.object({...})` literal; the Name input accepts any string, so ordinary names (`First Name`, `first-name`) break compilation and crafted names inject arbitrary schema source.
**Verification**:
- `code-generation.ts:217` — `` `  ${field.name}: ${fieldSchemaCode(field)}` `` — raw interpolation; the JSON config half goes through `JSON.stringify` (`:263`), so only the schema half is unescaped (matches report).
- Name input is unvalidated: `builder-config-registry.ts:43` — `{ name: 'name', type: 'text', label: 'Name', required: true, ... }` (required only, no pattern); `builder-config-transforms.ts:145` — `name: stringValue(values, 'name')`.
- Ran the real `generateFormCode` via tsx with crafted names:
  - `First Name` → `z.object({ First Name: z.string().optional() })` — invalid TS.
  - `first-name` → `z.object({ first-name: z.string().optional() })` — invalid TS.
  - Mission payload `x}; alert(1); const y = {` → emitted verbatim inside the schema source (`x}; alert(1); const y = {: z.string().optional()`).
  - Clean-injection payload `a: z.string(), backdoor: z.any(), b` → produces **valid** TypeScript `z.object({ a: z.string(), backdoor: z.any(), b: z.string().optional() })` — an injected extra schema property, proving arbitrary content injection into generated consumer code (the object-literal value position also permits arbitrary expressions).

### Finding 6: array schema always emits z.array(z.string()), ignoring arrayConfig.itemType — CONFIRMED
**Original**: The builder exposes `itemType` options (number, checkbox, switch, object) and serializes `arrayConfig` into the generated config, but the generated Zod schema always validates string items — internally inconsistent consumer code.
**Verification**:
- `code-generation.ts:84-86` — `if (field.type === 'multiSelect' || field.type === 'multiselect' || field.type === 'array') { schema = 'z.array(z.string())'; }` — `arrayConfig.itemType` is never consulted.
- `builder-config-registry.ts:25` — `arrayItemTypeOptions = ['string', 'text', 'email', 'number', 'checkbox', 'switch', 'object']`; `:397` — the Item type select; `:414-424` — `arrayConfig.itemType` serialized into updates. `code-generation.ts:177` — `arrayConfig` included in the serialized config.
- Ran the real `generateFormCode` with `itemType: 'number'`: output contains `"arrayConfig": { "itemType": "number", ... }` in the config AND `tags: z.array(z.string()).optional()` in the schema — same file, contradictory.
- Runtime side: `packages/formedible/src/components/formedible/fields/array-field.tsx:27-43` renders number inputs for `itemType === 'number'` (and boolean/object variants), so the form really collects numbers/booleans/objects that the generated schema rejects.

### Finding 7: editing any property of an object field strips nested field configs down to four keys — CONFIRMED
**Original**: The object field's `toFieldUpdate` rebuilds `objectConfig.fields` via `nestedFieldsValue`, which maps each nested field to exactly `{ name, type, label, placeholder }` — dropping `options`, `required`, `disabled`, `description`, nested `arrayConfig`/`objectConfig` on any unrelated edit.
**Verification**:
- `builder-config-registry.ts:426-436` — object definition's `toFieldUpdate` always sets `fields: nestedFieldsValue(values.nestedFields)`; `:642-655` — `nestedFieldsValue` maps to exactly the four keys.
- The update path fires on every config-form keystroke: `field-configuration-form.tsx:27-29` — `onChange: ({ value }) => { onFieldUpdate(definition.toFieldUpdate(value, field)); }` → `field-configurator.tsx:35` — `globalFieldStore.updateField(fieldId, fieldUpdate)`. There is no submit-only gate.
- Ran the real registry via tsx: object field with nested `country` (select, `required: true`, `options: [{label:'US',value:'us'}]`) and `city` (`description: 'Nested desc'`, placeholder); simulated a change that edits ONLY the object's `label`. Resulting `objectConfig.fields`: `country` reduced to `{name, type, label}` (lost `required` and `options`), `city` lost `description` (kept placeholder). Data-integrity loss confirmed end-to-end.

---

## Summary
- All 7 findings confirmed with source evidence plus live reproduction of the real `FieldStore`, `builder-config-registry` transforms, and `code-generation.ts` (tsx runs from /tmp scratch; scratch deleted; no repo files modified).
- Reporter's "verified non-issues" context spot-checked and found accurate: form-core 1.32.0 is the installed version, and `FormApi.js:92` guards defaultValues application on `!isTouched` + deep-inequality.
- No false positives identified. Severity assessment (2 HIGH, 5 MEDIUM) appears sound; if anything, Finding 5's injection half could argue HIGH given it produces syntactically valid attacker-controlled code in copied consumer files, but MEDIUM (broken output for ordinary names being the primary impact) is defensible.
