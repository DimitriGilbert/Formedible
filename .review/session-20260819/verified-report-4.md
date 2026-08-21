# Verified Report — Cluster 4
Verification of `/home/didi/workspace/Formedible/.review/session-20260819/review-report-4.md`
Branch: `re-codex` | Verifier: independent re-verification (source reading + fresh jsdom empirical reproduction; scratch files deleted after).

**Verdict: 7 confirmed, 0 dismissed.**

All four wiring-level findings (1–3, incl. both halves of 2) were independently reproduced with jsdom + React 19 `createRoot`/`act` driving the real `useFormedible` from `packages/formedible/src` (tsx with `@/` path mapping; scratch in /tmp, deleted). The framework premise underlying findings 1–3 was verified directly against the installed library source.

## Framework premise (shared by Findings 1–3) — VERIFIED

Claim: TanStack Form v1 `useForm` does not re-render the host component on store updates.

Verified against installed source `node_modules/.pnpm/@tanstack+react-form@1.32.0_.../src/useForm.tsx`: `useForm` constructs `FormApi` via `useState`, memoizes the extended API, and mounts via layout effects. The only `useStore(form.store, selector)` call in the file is inside `LocalSubscribe` — i.e., the `form.Subscribe` component. The host never subscribes, so field value changes update the store (and re-render individual `Field`/`Subscribe` subtrees) without re-rendering the component that called `useForm`/`useFormedible`. Empirically: host render count stayed at 1 after `form.setFieldValue(...)`.

Corroborating: `use-form-analytics.ts` uses only refs (no `setState`), so nothing in the hook's own wiring re-renders the host on field change. Inside `Form`, fresh values come from `form.Subscribe` (use-formedible.tsx:608), which re-renders the *children* render-prop but does NOT re-invoke `useFormedible`/`useMultiPage` — so `visiblePages`, `goToNextPage`, and the persistence render-time snapshots all stay at the host's last render.

---

### Finding 1: `restoreOnMount` restore re-runs on every host re-render — reverts user input and undoes page navigation — CONFIRMED
**Original**: The restore effect depends on `loadFromStorage`, whose `useCallback` deps include the whole `config` object; with inline config (documented pattern) the effect re-runs on every host re-render, re-applying stale storage and snapping back the page.
**Verification**:
- Code chain exact: `packages/formedible/src/hooks/use-form-persistence.ts:115-139` (`loadFromStorage` deps `[config, form, setCurrentPage, totalPages]`) and `:149-153` (`useEffect(..., [config?.restoreOnMount, loadFromStorage])`). `use-formedible.tsx:167` passes `config.persistence` through unmodified — consumer object identity = effect re-run trigger.
- Documented pattern confirmed: `apps/web/src/components/docs/examples/persistence-form.tsx:169-262` — `PersistenceFormExample` (a 3-page form!) calls `useFormedible({ ... persistence: { key, storage: 'localStorage', debounceMs: 1500, exclude, restoreOnMount: true } })` fully inline in the component body. No consumer in the repo memoizes `persistence`.
- Independently reproduced (real `useFormedible`, inline config, pre-seeded `{name:'Old Name', currentPage:1}`, `debounceMs:100000`):
  ```
  after mount (restored):        {"name":"Old Name","email":""}
  after typing:                  {"name":"Fresh Typed Name","email":""}
  after navigating to page 2:    {"name":"Old Name","email":""}   <- typed value reverted
  currentPage after Next:        1                                 <- navigation undone
  ```
  Page navigation re-renders the host via `setCurrentPage` (useState in `useMultiPage`), producing a new inline `persistence` identity → restore effect re-runs → storage snapshot re-applied via `setFieldValue` + `setCurrentPage(storedPage)`. Matches the reporter's empirical output exactly. CRITICAL severity justified: the flagship 3-page demo is affected as shipped.

### Finding 2: Debounced saves are never triggered by value changes; the mount-scheduled save clobbers persisted data with stale/default values — CONFIRMED
**Original**: `latestValuesRef.current`/`persistedValuesSignature` update only at host render; since the host never re-renders on store changes, saves never fire on typing, and the mount-run save writes defaults over storage.
**Verification**:
- Code exact: `use-form-persistence.ts:100-102` (ref + signature assigned during render), `:155-167` (debounce effect deps `[config, persistedValuesSignature, saveToStorage]` — all render-time values), `saveToStorage` reads `latestValuesRef.current` at fire time (`:112`).
- Independely reproduced, run A (single-page, `debounceMs:50`, typed `'Ada'`):
  ```
  host renders after mount: 1
  storage after mount save: {"name":""}
  host renders after field change: 1                                  <- host does not re-render
  storage 400ms after typing (no host re-render): {"name":""}         <- stale; save never re-ran
  host renders after parent state bump: 2
  storage after genuine host re-render: {"name":"Ada"}                <- only saved on host re-render
  ```
  (Verifier note: an initial attempt showing no save after "re-render" was a harness bug — rendering with a changed `key` remounts; with a genuine parent-state re-render the save fires, exactly as the reporter described.)
- Run B (pre-seeded `{name:'Ada Lovelace'}`, `restoreOnMount:true`, `debounceMs:50`, no interaction):
  ```
  form values right after mount: {"name":"Ada Lovelace"}   <- restore worked
  storage after 400ms idle:      {"name":""}               <- mount-run save clobbered restored payload
  ```
  Mechanism confirmed: the restore effect's `setFieldValue` calls update the store but not the render-time ref (no host re-render), so the mount-scheduled save fires with pre-restore defaults.
- The advertised behavior is real in the shipped demo: persistence-form.tsx:161-164 toast says "Form data auto-saved throughout - try refreshing the page!" with `debounceMs: 1500`.

### Finding 3: Conditional page (and tab) visibility computed from a stale values snapshot — Next/Back navigate per an outdated page set — CONFIRMED
**Original**: `useMultiPage` receives `values: form.state.values` captured at host render; `visiblePages` memo and `goToNextPage` closures describe the page set as of the last host render, so conditional pages just shown/hidden are skipped or wrongly targeted. Same for `useFormTabs`.
**Verification**:
- Code exact: `use-formedible.tsx:160-165` (`values: form.state.values`), `use-multi-page.ts:63` (`visiblePages` memo on `[fields, pages, values]`), `:88-94` (`goToNextPage` uses `safeVisiblePages.at(currentIndex + 1)` from that memo). `FormNavigation`'s `onNext={multiPage.goToNextPage}` (use-formedible.tsx:646) is inside `form.Subscribe`'s render-prop, but the function value itself comes from the host's last render — Subscribe re-renders do not refresh it. `use-form-tabs.ts:32-35` has the identical `[fields, normalizedTabs, values]` memo pattern.
- Independently reproduced (pages 1/2/3, page 2 conditional on `applicationType === 'individual'`):
  ```
  visiblePages at mount (business): [1,3]
  visiblePages after switching to individual (no host re-render): [1,3]   <- stale
  currentPage after Next (expected 2): 3   <- BUG: skipped newly-visible page 2
  ```
  Matches the reporter's output and the flagship `conditional-pages-form` scenario. Note the conditional field rendering inside `form.Subscribe` does use fresh values — so the UI shows the newly relevant fields, while navigation/progress (`visiblePages`, `totalPages`, `progressValue`, `goToNextPage`/`goToPreviousPage`) lags — the inconsistency the reporter described.

### Finding 4: Location search results dropdown cannot be dismissed without selecting a result — CONFIRMED
**Original**: `showResults` is set true on focus/search-resolve but only ever set false inside `selectLocation`; no blur/Escape/outside-click dismissal.
**Verification**:
- `location-picker-field.tsx:18` `const [showResults, setShowResults] = useState(false)`; setter calls in the whole file: `setShowResults(true)` at `:39` (search resolved) and `:115` (focus), `setShowResults(false)` only at `:66` inside `selectLocation`. Input `onBlur={field.onBlur}` (`:114`) does not touch it; no `onKeyDown`, no outside-click/pointerdown handler anywhere in the component; the shared `Input` (`components/ui/input.tsx`) is a plain `<input>` with no wrapper logic. The popover (`:123-131`, `absolute z-50`) therefore stays open after blur/click-away; only selecting a result (or clearing the query below `minQueryLength`, which empties `results` and fails the `results.length > 0` gate) closes it. Standard combobox dismissal is genuinely missing — a real UX defect, MEDIUM is fair.

### Finding 5: File upload silently drops files violating `maxSize`/`maxFiles` — CONFIRMED
**Original**: `setFiles` slices/filters without any error, field error, or rejection callback; rejected files vanish silently.
**Verification**:
- `file-upload-field.tsx:15-22` matches the quote exactly: `slice(0, maxFiles)` then `filter(file.size <= maxSize)`, then `field.onChange(acceptedFiles[0] ?? null)` / `onFilesChange?.(acceptedFiles)`. The component defines no error state at all (contrast `location-picker-field.tsx` which has `error` + render path). Type surface confirms there is no rejection channel consumers could use: `FormedibleFileConfig` (`lib/formedible/types.ts:649-657`) exposes only `accept/multiple/maxSize/maxFiles/onFilesChange/onFileRemove` — no `onFilesRejected`. Single-file mode is worse: an oversized file yields `null` with zero feedback. Real defect.

### Finding 6: Persistence storage writes unguarded — `QuotaExceededError`/storage-access `SecurityError` escape uncaught — CONFIRMED
**Original**: `savePersistedFormPayload` calls `setItem` with no try/catch inside a `setTimeout`; `getConfiguredStorage`'s `window.localStorage` access can itself throw `SecurityError`.
**Verification**:
- `use-form-persistence.ts:81-83`: `storage.setItem(key, JSON.stringify(payload))` — no guard; invoked from `saveToStorage` (`:105-113`) which runs inside `window.setTimeout` (`:164`), so a quota exception surfaces as an uncaught error on window, not a React-catchable error. `:23-29` `getConfiguredStorage` dereferences `window.localStorage`/`sessionStorage` — property access throws `SecurityError` in storage-blocked contexts (third-party iframes / strict privacy modes), and this runs both inside the timeout and inside `loadFromStorage` (`:116`) invoked from the mount effect.
- Not intentional: the code already degrades gracefully elsewhere (`parsePersistedFormPayload` catches malformed JSON; `getConfiguredStorage` returns undefined under SSR — asserted in `tests/formedible/phase10-behavior.test.ts:126-149`), and all persistence tests use an in-memory storage that never throws; nothing asserts propagation is desired. Consistent defensive-design gap; MEDIUM fair.

### Finding 7: Duplicate React keys when two selected files share name and size — CONFIRMED (mechanism narrowed)
**Original**: File list keys by `${file.name}-${file.size}`; two File objects matching on name+size produce duplicate keys.
**Verification**:
- `file-upload-field.tsx:51` `key={`${file.name}-${file.size}`}` — no per-entry discriminator, so React keys are not guaranteed unique among siblings. Real (LOW) defect per React's unique-key contract.
- One narrowing correction to the reporter's mechanism: `setFiles` (`:19`) REPLACES the field value with each new selection rather than appending, so "selecting the same file twice" across two picker actions cannot accumulate duplicates. The collision requires a single multi-select containing two distinct files with identical name and size (e.g., `report.pdf` picked from two different folders in one dialog, or identical copies) — possible, but rarer than implied. Verdict unchanged: the key is genuinely non-unique-safe; severity LOW as reported.

---

## Additional verification notes
- The report's "Checked and intentionally NOT flagged" list was spot-checked and contains no missed defects relevant to the 7 findings (e.g., phase10-behavior.test.ts:126-149 does assert the sessionStorage default as intended).
- No guards elsewhere neutralize findings 1–3: no ref-based once-guard in the restore effect, no store subscription driving saves, and no live-state recomputation in `goToNextPage`/`goToPreviousPage`/`changePage`.
- Scratch verification files were created under /tmp only and deleted; no repo files were modified.

**Final: 7 confirmed, 0 dismissed.**
