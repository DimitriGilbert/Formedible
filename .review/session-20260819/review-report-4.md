# Review Report — Cluster 4
Structural fields (object/array/file/location) + form chrome (layout/navigation/progress/tabs) + cross-cutting hooks (multi-page, tabs, persistence, analytics)

Repo: /home/didi/workspace/Formedible (branch `re-codex`)
Scope: `packages/formedible/src/...` (authoritative source; synced copies ignored)

Method note: the four wiring-level findings (1–4) were verified empirically with throwaway jsdom + React 19 + `createRoot`/`act` tests driving the real `useFormedible` (scratch files deleted after verification). All quoted outputs below are from those runs.

---

### [SEVERITY: CRITICAL] Finding 1: `restoreOnMount` restore re-runs on every host re-render — reverts user input and undoes page navigation

**File**: packages/formedible/src/hooks/use-form-persistence.ts:149-153 (with loadFromStorage at 115-139)

**Problem**: The restore effect depends on `loadFromStorage`, whose `useCallback` deps include the whole `config` object identity. `useFormedible` passes the consumer's `config.persistence` straight through, and the documented/only usage pattern (`apps/web/src/components/docs/examples/persistence-form.tsx:256-262` and every docs example) inlines the options object in the component body, so its identity changes on every host render. The effect therefore re-runs on every host re-render (page navigation, submit attempt, parent re-render) — not just on mount — re-applying the storage snapshot via `form.setFieldValue` and re-calling `setCurrentPage(parsedValue.currentPage)`.

**Evidence**:
```ts
const loadFromStorage = useCallback(() => {
  ...
  for (const [fieldName, fieldValue] of Object.entries(parsedValue.values)) {
    form.setFieldValue(typedFieldName, fieldValue as Updater<...>);
  }
  if (parsedValue.currentPage !== undefined && ...) {
    setCurrentPage?.(parsedValue.currentPage);
  }
}, [config, form, setCurrentPage, totalPages]);   // <- config identity

useEffect(() => {
  if (config?.restoreOnMount) {
    loadFromStorage();
  }
}, [config?.restoreOnMount, loadFromStorage]);    // <- re-runs whenever config identity changes
```
Empirical run (paged form, pre-seeded storage `{name:'Old Name'}`, `restoreOnMount: true`, inline config, `debounceMs: 5000`):
```
after mount (restored): {"name":"Old Name","email":""}
after typing:           {"name":"Fresh Typed Name","email":""}
after navigating to page 2: {"name":"Old Name","email":""}   <- typed value reverted
currentPage: 1                                                 <- navigation undone
```

**Impact**: With the documented usage pattern, combining `persistence.restoreOnMount` with a multi-page form means every "Next" click (1) silently destroys values typed since the last save and (2) snaps the user back to the persisted page — pagination is effectively bricked and user data is lost. Because saves are debounced (500ms+), the stored snapshot is almost always older than what the user just typed.

**Suggestion**: Restore exactly once per mount. Guard with a ref (`const restoredRef = useRef(false)`; skip if already restored for this `config.key`), or key the effect on stable primitives (`config.key`, `config.storage`) instead of the `config` object identity / the derived `loadFromStorage` callback.

---

### [SEVERITY: HIGH] Finding 2: Debounced saves are never triggered by value changes, and the mount-scheduled save clobbers persisted data with stale/default values

**File**: packages/formedible/src/hooks/use-form-persistence.ts:100-102, 105-113, 155-167

**Problem**: `latestValuesRef.current` and `persistedValuesSignature` are only updated during host renders. TanStack Form v1's `useForm` does not re-render the host component on store updates (verified: host render count stayed 1 after a field change), so field edits never change the effect deps and never schedule a save. Worse, the save effect's mount run fires after `debounceMs` and writes the stale ref (the pre-restore defaults), destroying whatever was in storage — including a payload that `restoreOnMount` just loaded.

**Evidence**:
```ts
const latestValuesRef = useRef(form.state.values);
latestValuesRef.current = form.state.values;                       // only updated at host render
const persistedValuesSignature = config ? JSON.stringify(...) : ''; // only recomputed at host render
...
useEffect(() => {
  ...
  const timeout = window.setTimeout(saveToStorage, config.debounceMs ?? 500);
  return () => window.clearTimeout(timeout);
}, [config, persistedValuesSignature, saveToStorage]);              // deps unchanged when host never re-renders
```
Empirical runs:
1. Typed/set `name: 'Ada'` (`debounceMs: 50`, waited 400ms, no host re-render):
```
storage after typing (no host re-render): {"values":{"name":""},...}   <- old value, save never re-ran
storage after host re-render:             {"values":{"name":"Ada"},..}  <- only saved once host re-rendered
```
2. Pre-seeded storage `{name:'Ada Lovelace'}`, `restoreOnMount: true`, no interaction for 400ms:
```
store right after mount:   {"name":"Ada Lovelace"}   <- restore worked
store after 400ms idle:    {"name":"Ada Lovelace"}
storage after 400ms idle:  {"values":{"name":""},...}  <- persisted payload overwritten with defaults
```

**Impact**: The advertised "auto-saved throughout — try refreshing the page" behavior (persistence-form example toast) only holds when the host happens to re-render (page navigation, submit attempt). On a single-page form, values are never saved as the user types; a refresh loses everything entered since the last host re-render. With `restoreOnMount`, the mount-run save additionally wipes the restored payload from storage, so a second refresh before any host re-render restores an empty form. Without `restoreOnMount`, merely mounting overwrites previously saved data with defaults after `debounceMs`.

**Suggestion**: React to actual store changes instead of render-time snapshots: subscribe to the form store (e.g. `useStore(form.store, s => s.values)` or TanStack's `form.useStore`) to drive the debounced-save effect, and make `saveToStorage` read live state (`form.state.values` via the api passed in) at fire time rather than a ref assigned during render. Also skip the mount-run save until the first real change (or until after restore completes).

---

### [SEVERITY: HIGH] Finding 3: Conditional page (and tab) visibility is computed from a stale values snapshot — Next/Back navigate per an outdated page set

**File**: packages/formedible/src/hooks/use-multi-page.ts:60-69, 88-102 (tabs variant: packages/formedible/src/hooks/use-form-tabs.ts:31-42)

**Problem**: `useFormedible` passes `values: form.state.values` — a snapshot captured at host render time. Field edits update the store but do not re-render the host (verified), so `visiblePages` (memoized on `[fields, pages, values]`) and the `goToNextPage`/`goToPreviousPage` closures (`safeVisiblePages`, `currentIndex`) still describe the page set as of the last host render. When the user changes a value that drives page conditionals and then clicks Next, navigation uses the stale set. `useFormTabs` has the identical problem for conditional tabs (`visibleTabs` memo).

**Evidence**:
```ts
const visiblePages = useMemo(() => getVisiblePageNumbers(fields, pages, values), [fields, pages, values]); // stale values
...
function goToNextPage() {
  const nextPage = safeVisiblePages.at(currentIndex + 1); // safeVisiblePages/currentIndex from stale closure
  ...
}
```
Empirical run (pages 1/2/3, page 2 visible only when `applicationType === 'individual'`; user toggles business → individual, then clicks Next):
```
currentPage after clicking Next (individual selected, expected 2): 3   <- skipped newly-visible page 2
```
This is exactly the flagship `conditional-pages-form.tsx` scenario (page 2/3 gated by `applicationType` on page 1, page 5 gated by `needsPremium` on page 4).

**Impact**: Users skip pages that just became visible (their required fields are never validated/shown — but they are still submitted if schema-required via `getInvalidFieldEntries`... actually hidden fields are skipped in validation, so required data is silently missing at submit) or get navigated toward pages that no longer exist. Progress (`progressValue`, `totalPages`) and tab visibility also lag behind until an unrelated host re-render.

**Suggestion**: Compute visibility from live state at decision time: inside `goToNextPage`/`goToPreviousPage`/`changePage`, call `getVisiblePageNumbers(fields, pages, form.state.values)` (or subscribe to the store inside the hook and derive `visiblePages` from subscribed values, like TanStack's `form.useStore(selector)`), so the click handler always uses the current page set.

---

### [SEVERITY: MEDIUM] Finding 4: Location search results dropdown cannot be dismissed without selecting a result

**File**: packages/formedible/src/components/formedible/fields/location-picker-field.tsx:17-18, 115, 123-131

**Problem**: `showResults` is set to `true` on focus (when results exist) and when a debounced search resolves, but the only code that ever sets it back to `false` is `selectLocation`. There is no blur handler, outside-click handler, or Escape handling that closes the dropdown; the input's `onBlur` only calls `field.onBlur`.

**Evidence**:
```tsx
const [showResults, setShowResults] = useState(false);
...
onFocus={() => setShowResults(results.length > 0)}
onBlur={field.onBlur}                        // does not touch showResults
...
{showResults && results.length > 0 && (
  <div className="absolute z-50 mt-1 max-h-60 w-full ..."> ... </div>
)}
```
grep of the file: `setShowResults(false)` occurs exactly once, inside `selectLocation` (line 66).

**Impact**: After typing a query, the absolutely-positioned `z-50` results popover stays open indefinitely, overlaying the fields below it. The user's only escape is to pick a result (committing a location they may not want) or navigate away. Standard combobox dismissal (blur, outside pointerdown, Escape) is missing.

**Suggestion**: Close on input blur (with a small delay or `onMouseDown`-based selection like the current one, which already fires before blur), close on Escape via `onKeyDown`, and/or clear `showResults` when the query changes below `minQueryLength`.

---

### [SEVERITY: MEDIUM] Finding 5: File upload silently drops files that violate `maxSize`/`maxFiles` — no error or user feedback

**File**: packages/formedible/src/components/formedible/fields/file-upload-field.tsx:15-22

**Problem**: `setFiles` slices to `maxFiles` and filters out files larger than `maxSize` with no message, no `field` error, and no callback informing the consumer which files were rejected. The rejected files simply never appear in the list.

**Evidence**:
```ts
function setFiles(nextFiles: readonly File[]) {
  const limitedFiles = config?.maxFiles === undefined ? nextFiles : nextFiles.slice(0, config.maxFiles);
  const maxSize = config?.maxSize;
  const acceptedFiles = maxSize === undefined ? limitedFiles : limitedFiles.filter((file) => file.size <= maxSize);
  field.onChange(config?.multiple ? acceptedFiles : acceptedFiles[0] ?? null);
  config?.onFilesChange?.(acceptedFiles);   // only accepted files reported
  field.onBlur();
}
```

**Impact**: A user who selects an oversized file (or one file too many) sees the picker close and nothing happen. There is no way to discover why; the form looks broken. Validation hooks (`fileConfig.maxSize`) are advertised as config surface but produce zero UX when violated.

**Suggestion**: Surface rejections: set a local error string (rendered like the location field's `{error && ...}`) and/or expose the rejected files to the consumer (e.g. extend `onFilesChange` context or add an `onFilesRejected` callback), and show which constraint failed.

---

### [SEVERITY: MEDIUM] Finding 6: Persistence storage writes are unguarded — `QuotaExceededError` (and storage-access `SecurityError`) escape as uncaught exceptions

**File**: packages/formedible/src/hooks/use-form-persistence.ts:23-29, 81-83, 105-113

**Problem**: `savePersistedFormPayload` calls `storage.setItem` with no try/catch. It runs inside a `setTimeout` callback (`saveToStorage` scheduled by the debounced effect), so a `QuotaExceededError` (quota exhausted — a real risk since every change saves the whole values payload) surfaces as an uncaught exception on `window`, not a catchable React error. Similarly, `getConfiguredStorage` dereferences `window.localStorage`, whose property access itself throws `SecurityError` in environments with cookies/storage blocked (embedded iframes, some privacy modes); that call happens inside the same timeout and inside `loadFromStorage` (invoked from an effect). `JSON.parse` failures are already handled (parsePersistedFormPayload), but write/access failures are not.

**Evidence**:
```ts
export function savePersistedFormPayload<...>(storage: Storage, key: string, payload: PersistedFormPayload<TFormValues>) {
  storage.setItem(key, JSON.stringify(payload));   // throws QuotaExceededError uncaught inside setTimeout
}

export function getConfiguredStorage(config: FormediblePersistenceConfig | undefined) {
  if (!config || typeof window === 'undefined') {
    return undefined;
  }
  return config.storage === 'localStorage' ? window.localStorage : window.sessionStorage; // access can throw SecurityError
}
```

**Impact**: When the storage quota is full, every debounced save throws an uncaught exception (error-reporting noise, potential crash of hosting error boundaries unrelated to the form); in storage-blocked contexts the persistence hook crashes effects/timeers instead of degrading to "no persistence".

**Suggestion**: Wrap storage access and writes in try/catch — e.g. have `savePersistedFormPayload`/`getConfiguredStorage` swallow (or return a failure the consumer can observe via optional callback) on `QuotaExceededError`/`SecurityError`, mirroring the existing defensive handling of malformed JSON on load.

---

### [SEVERITY: LOW] Finding 7: Duplicate React keys when two selected files share name and size

**File**: packages/formedible/src/components/formedible/fields/file-upload-field.tsx:50-51

**Problem**: The file list keys entries by `` `${file.name}-${file.size}` ``. In `multiple` mode, selecting the same file twice (or two distinct files that happen to match on name+size, e.g. re-selected copies) produces two distinct `File` objects with identical keys.

**Evidence**:
```tsx
{files.map((file) => (
  <div key={`${file.name}-${file.size}`} ...>
```

**Impact**: React duplicate-key warnings and unpredictable reconciliation of the two rows (removal by identity in `removeFile` is correct, but the rendered rows can mismatch). Minor because the picker UI usually hides the trigger once files exist.

**Suggestion**: Include the index in the key (`` `${file.name}-${file.size}-${index}` ``) or another per-entry discriminator.

---

## Checked and intentionally NOT flagged

- `getConfiguredStorage` defaulting to `sessionStorage` when `storage` is omitted — explicitly asserted as intended behavior by `tests/formedible/phase10-behavior.test.ts:126-149`.
- Array field index-path React keys (`array[0]`, `array[1]`) causing row remounts on add/remove/move — values live in TanStack state and reorder correctly (`reorderArrayItems` is a pure swap; `updateItems` always writes a fresh array), satisfying the "sorting preserves submitted values" contract from FROM-SCRATCH-2.md.
- Object/array nested rendering with real TanStack paths (`object.child`, `array[0].child`) and item-local conditionals via `localValues` — matches the nested-field requirements and `conditional-in-obj` evidence.
- `form-navigation.tsx` next-button `disabled={disabled || isLastPage}` — redundant (button only rendered when `!isLastPage`) but harmless.
- `form-tabs.tsx` `{tab.errorCount && tab.errorCount > 0 ? ... : undefined}` — ternary, so the falsy `0` branch yields `undefined` (no accidental `0` rendering).
- `use-multi-page.ts` resetting to the first visible page (rather than nearest) when the current page becomes hidden — design choice, not a defect.
- Analytics contract: `onFormStart`/`onFormAbandon` fire from a mount/unmount effect with refs (once per mount, abandon suppressed after `trackFormComplete`); page-change analytics fire once per actual `changePage`; ref-based `analyticsRef`/`optionsRef` avoid re-subscribing. StrictMode double-invocation of mount effects is framework-common and not flagged.
- SSR: `getFiles` guards `typeof File`; persistence/storage and location search guard `window`/`navigator`; no render-time browser-API access crashes found.
- Location `updateDraft` replacing a selected location with a draft when the search text is edited — acceptable "re-search resets selection" semantics.
- `advanced-field-utils.ts`, `form-layout.tsx`, `form-progress.tsx` — no real issues found.
