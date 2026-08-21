# Review Report — Cluster 6: Builder UI + builder libs & code generation

Repo: /home/didi/workspace/Formedible (branch `re-codex`)
Scope: `packages/builder/src` builder components, field store, config registry/transforms, code generation, index exports.

Context verified before flagging:
- TanStack `useForm` (form-core 1.32.0) only applies new `defaultValues` when the form is untouched and deep-unequal, so the FieldConfigurationForm keystroke -> store -> new `defaultValues` loop does NOT reset the config form (no false positive there).
- `FieldConfigurationForm` is remounted via `key={field.id}` on field selection change, so stale-form concerns do not apply.
- `useSyncExternalStore` snapshots are cached in the store (stable identity between changes) — verified by `builder.test.tsx`.
- Preview dogfoods the real `useFormedible`, so preview fidelity is good; no findings against `form-preview.tsx`.
- Per FROM-SCRATCH-2.md, the global field store and code-generation shape are intentional; findings below are about behavior breaks, not the design.

---

### [SEVERITY: HIGH] Finding 1: addField/duplicateField generate colliding field names; duplicates silently corrupt preview values and make generated code uncompilable
**File**: packages/builder/src/components/formedible/builder/field-store.ts:22 (also :95, :38)
**Problem**: New field names are derived from the current field count (`field_${this.fieldOrder.length + 1}`), not from the set of names already in use, and nothing anywhere enforces name uniqueness (updateField renames are also unguarded).
**Evidence**:
```ts
// addField
name: `field_${this.fieldOrder.length + 1}`,
// duplicateField
name: `${field.name}_copy`,
```
Add 3 fields (names `field_1..field_3`), delete `field_2` (order length = 2), then add a field: it is named `field_3` — a duplicate of the surviving `field_3`. Duplicating the same source field twice likewise produces two `email_copy` fields.
**Impact**:
- Preview (`default-tabs.tsx:83` `Object.fromEntries(fields.map((field) => [field.name, ...))` collapses the duplicate key, and the two `form.Field` instances bind to the same TanStack value path — two visible inputs share/overwrite one value.
- Generated code (`code-generation.ts:217`) emits `field_3: z.string(),` twice inside the `z.object({...})` literal — TypeScript error TS1117 ("An object literal cannot have multiple properties with the same name"), so the copied consumer code does not compile.
- This is reachable through the most basic builder flow (add, add, add, delete middle, add).
**Suggestion**: In `addField`/`duplicateField`, compute a unique name by checking existing names (e.g. `field_N`, `field_N+1`, ... until unused; `email_copy`, `email_copy_2`, ...). Optionally have `updateField` warn or auto-suffix when a rename collides.

### [SEVERITY: HIGH] Finding 2: initialFields re-import effect keyed on array identity wipes user edits and can loop forever in controlled usage
**File**: packages/builder/src/components/formedible/builder/form-builder.tsx:43-52
**Problem**:
```ts
useEffect(() => {
  globalFieldStore.importFields(importedInitialFields);
}, [importedInitialFields]);
```
The effect re-runs whenever the `initialFields` prop reference changes, and `importFields` destructively resets the whole store (`this.fields = {}` …) and always rebuilds the snapshot with new object references.
**Impact**:
1. Inline array (the natural JSX usage `<FormBuilder initialFields={[...]} ... />`): any parent re-render — including re-renders triggered by the builder's own `onChange` — recreates the array identity and re-imports the stale initial data, silently reverting every edit the user made in the builder.
2. Controlled round-trip (`initialFields={saved}` + `onChange={(_, f) => setSaved(f)}`): import -> new snapshot reference -> `onChange` -> `setSaved(newSnapshot)` -> new prop identity -> import -> ... an endless effect/render ping-pong (the store hands out a fresh snapshot identity on every import, so it never settles).
**Suggestion**: Import once on mount only (empty deps with a ref guard), or gate the import on a serialized content signature of `initialFields` and make `importFields` a no-op (no notify) when the field data is deep-equal to what is already stored.

### [SEVERITY: MEDIUM] Finding 3: onChange effect includes the consumer's callback in its deps — inline callbacks fire every render and can cause an infinite update loop
**File**: packages/builder/src/components/formedible/builder/form-builder.tsx:54-56
**Problem**:
```ts
useEffect(() => {
  onChange?.(metadata, fields);
}, [fields, metadata, onChange]);
```
If the consumer passes an inline arrow (`onChange={(m, f) => setDraft({ m, f })}`, the canonical usage), the effect re-runs on every render because the callback identity changes, calling `onChange` with unchanged data. A consumer that setStates unconditionally (new object each time, so no React bailout) enters render -> effect -> setState -> render -> ... forever.
**Impact**: Repeated consumer callbacks with stale-equal data (spurious saves/network calls), and an infinite update loop for the common inline-callback + unconditional-setState pattern, even with no `initialFields` involved.
**Suggestion**: Store `onChange` in a ref (or omit it from deps deliberately) so the notification fires only when `fields` or `metadata` actually change.

### [SEVERITY: MEDIUM] Finding 4: global field store is shared by every FormBuilder instance; a second mount wipes the first builder's fields
**File**: packages/builder/src/components/formedible/builder/form-builder.tsx:44-52 (with field-store.ts:250)
**Problem**: `globalFieldStore` is a module singleton and each `FormBuilder` subscribes to it and re-imports its own `initialFields` (or `[]` when omitted) on mount. Mounting a second `<FormBuilder />` anywhere resets the store, destroying fields the user added in the first instance; both instances then render each other's data.
**Evidence**: mount effect calls `globalFieldStore.importFields(importedInitialFields)` where `importedInitialFields` defaults to `[]` (`emptyInitialFields`), clearing the shared store.
**Impact**: Two builders on one page (or on persisted-route setups where a second instance mounts while the first is alive) cross-contaminate and lose data. The single-instance assumption is neither documented nor enforced.
**Suggestion**: Default `FormBuilder` to an internal per-instance store (instantiate `new FieldStore()` per mount, keeping `globalFieldStore` only for consumers who explicitly opt in), or skip the mount import when the store already has fields not provided via `initialFields`.

### [SEVERITY: MEDIUM] Finding 5: generated schema interpolates field.name raw — free-form names produce broken or injected TypeScript
**File**: packages/builder/src/lib/formedible/code-generation.ts:217
**Problem**:
```ts
const schemaFields = options.fields.map((field) => `  ${field.name}: ${fieldSchemaCode(field)}`).join(',\n');
```
The builder's Name input accepts any string (`builder-config-transforms.ts` `baseFieldUpdate`: `name: stringValue(values, 'name')`, no identifier validation). A name like `First Name` or `first-name` renders as `  First Name: z.string()` — a syntax error in the generated `.tsx`. A crafted name (`a: z.never(), b`) injects arbitrary content into the generated schema source. The JSON config half is safe (quoted keys via JSON.stringify); only the schema half is unescaped.
**Impact**: Generated code fails to compile for perfectly ordinary names; the raw interpolation is also the only unescaped user-controlled path in the output.
**Suggestion**: Quote keys that are not valid identifiers (`${/^[$A-Z_][$\w]*$/i.test(name) ? name : JSON.stringify(name)}:`), and/or validate the Name input to identifier characters in the configurator.

### [SEVERITY: MEDIUM] Finding 6: array schema always emits z.array(z.string()), ignoring arrayConfig.itemType
**File**: packages/builder/src/lib/formedible/code-generation.ts:84-86
**Problem**:
```ts
if (field.type === 'multiSelect' || field.type === 'multiselect' || field.type === 'array') {
  schema = 'z.array(z.string())';
}
```
The builder's Array config form exposes `itemType` options including `number`, `checkbox`, `switch`, and `object` (`builder-config-registry.ts` `arrayItemTypeOptions`), and serializes `arrayConfig` into the generated config — but the generated Zod schema always validates string items.
**Impact**: For an array field with `itemType: 'number'` (or object), the generated form collects `[1, 2]` while `schema` requires strings, so every submission fails validation; the copied consumer code is internally inconsistent.
**Suggestion**: Derive the item schema from `arrayConfig.itemType` (`number` -> `z.number()`, `checkbox`/`switch` -> `z.boolean()`, `object` -> `z.object({}).passthrough()`, default `z.string()`).

### [SEVERITY: MEDIUM] Finding 7: editing any property of an object field strips nested field configs down to four keys
**File**: packages/builder/src/lib/formedible/builder-config-registry.ts:426-436 (with :642-655)
**Problem**: The object field's `toFieldUpdate` rebuilds `objectConfig.fields` on every config-form change, via:
```ts
fields: nestedFieldsValue(values.nestedFields),
```
where `nestedFieldsValue` re-maps each nested field to exactly `{ name, type, label, placeholder }`. Nested properties not exposed in the mini editor — `options`, `required`, `disabled`, `description`, nested `arrayConfig`/`objectConfig` — are dropped.
**Impact**: An object field imported via `initialFields` (e.g. a nested select with `options`, or nested required fields) silently loses that configuration on the first keystroke of an unrelated edit (renaming the object field's label, toggling Required, etc.). The generated code and preview then diverge from the designed form — data integrity loss.
**Suggestion**: Preserve unknown nested keys by merging: `nestedFieldsValue` output spread over the original item (`{ ...originalItem, ...picked }`), keyed by matching `name`/index, instead of reconstructing from only four properties.

---

## Verified non-issues (checked, not bugs)
- Config-form keystroke feedback loop (store -> new field -> new `defaultValues`): safe — TanStack only applies changed defaultValues while the form is untouched, and the formedible onChange wrapper marks fields touched on first change.
- XSS in the code panel: generated code is rendered via `<pre><code>{generatedCode}</code></pre>` (React-escaped); all user strings in the generated source go through `JSON.stringify` (`stringLiteral`), so backticks, `${}`, and `</script>` cannot escape string literals.
- `isValidRegexPattern` correctly guards `new RegExp(...)` injection from the pattern validation field.
- SSR: no store mutation during render (import happens in an effect); `getServerSnapshot` returns props — no hydration crash path.
- Field ID generation (`createNextFieldId` + `advanceNextIdFromFieldId`) is collision-safe.
- Snapshot identity stability for `useSyncExternalStore` is maintained (cached snapshot).

## Summary
- CRITICAL: 0
- HIGH: 2 (duplicate field-name generation; initialFields re-import effect)
- MEDIUM: 5 (onChange deps loop; shared global store across instances; raw name interpolation in schema; array itemType schema mismatch; nested field config stripping)
