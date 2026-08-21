# Verified Report 15 — Docs routes + docs data/SEO layer

Verifier scope: `apps/web/src/routes/docs/*`, `apps/web/src/features/docs/navigation.ts`, cross-checked against `packages/formedible/src`, `packages/ai-builder/src`, and git history (`main` @ 89d5d8d, `re-codex` @ 9701dbd; local branches match their `origin/*` counterparts, so local tree checks reflect what GitHub serves).

Result: 3 confirmed, 0 dismissed.

---

### Finding 1: blob/main source links 404 / point at pre-rewrite code — CONFIRMED
**Original**: Four docs pages (getting-started.tsx:7, fields.tsx:16, validation.tsx:8, api.tsx:9) build source links against `blob/main`, but the rewrite exists only on `re-codex`; most links 404, the rest land on stale pre-rewrite code with wrong line anchors.

**Verification**:
- Link construction confirmed by grep: `getting-started.tsx:7` and `validation.tsx:8` define `githubRoot = 'https://github.com/DimitriGilbert/Formedible/blob/main'`; `fields.tsx:16` and `api.tsx:9` define `sourceBase = '.../blob/main'`. The four other content pages (dynamic-text.tsx:9, persistence.tsx:9, analytics.tsx:10, advanced-features.tsx:9) all use `blob/re-codex`.
- Branch state: `main` = 89d5d8d ("release 0.4.1", 2026-04-14, pre-rewrite) = `origin/main`; `re-codex` = 9701dbd (2026-05-25) = `origin/re-codex` (pushed, so `blob/re-codex` links resolve).
- Sampled linked files checked with `git cat-file -e` against both branches — 16/17 exist on `re-codex` and are absent on `main` (→ GitHub 404): `packages/formedible/public/r/formedible-core.json`, `src/lib/formedible/validation.ts`, `src/components/formedible/field-renderer.tsx`, `src/lib/formedible/normalize-field-config.ts`, `fields/password-field.tsx`, `fields/advanced-field-utils.ts`, `use-form-persistence.ts`, `use-form-analytics.ts`, `use-multi-page.ts`, `use-form-tabs.ts`, `components/formedible/form.tsx`, `tests/consumer-smoke/utils/generated-form-route.ts`, `tests/formedible/validation/validation-pipeline.test.tsx`, `apps/web/src/components/docs/examples/contact-form.tsx`, `apps/web/src/features/docs/code-examples.ts`. Stronger than the report stated: `apps/web/src/components/docs/` and `apps/web/src/features/docs/` do not exist on `main` at all (`git ls-tree` empty), so every example/docs-infrastructure link on those pages 404s.
- Live HTTP sample checks: `https://github.com/DimitriGilbert/Formedible/blob/main/packages/formedible/public/r/formedible-core.json` → HTTP 404; the same path on `blob/re-codex` → 200 (and the fetched file content matches the rewrite — its embedded hook includes validation summaries).
- Stale-anchor sample: api.tsx:413 references `use-formedible.tsx#L428-L443` for "Hook return object". On `re-codex` the actual return is lines 664-679 (read directly); on `main` the return is at line 2265 of 2286, and lines 428-443 are options destructuring — so the anchor is wrong on both branches. Secondary sample confirmed: dynamic-text.tsx's reference claims "Source: withDynamicText" at `use-formedible.tsx#L155-L174`, but `withDynamicText` is defined at lines 323-342 (155-174 contain page-change/persistence wiring) — stale anchor even on a correct-branch page.
- Files existing on both branches are pre-rewrite on `main`: main's `use-formedible.tsx` has zero occurrences of `validationSummary`/`getValidationSummaryConfig` (rewrite-only feature), so those links describe new code but display old code.
- Intentional-design check (dismissed as a defense): if `blob/main` were a deliberate "will be correct after merge" choice, all eight pages would use it; instead four siblings already use `blob/re-codex`, showing the codebase's own convention is branch-accurate links. Also, the stale `#L` anchors are wrong against the current `re-codex` layout too, so they stay broken even after a merge. Finding stands as-is; severity HIGH is appropriate given every Source/Test reference on 4 of 8 guide pages is dead or misleading.
- Minor correction to the original report: the claim that "the 428-443 range matches the old main hook" is inaccurate (main's return is at 2265). This strengthens, not weakens, the finding — the anchor matches neither branch.

---

### Finding 2: STORAGE_KEYS count mismatch in AI Builder docs — CONFIRMED
**Original**: ai-builder.tsx "Storage and export" section says `STORAGE_KEYS` names four entries and shows a 4-key "source excerpt", omitting the real fifth key `modelCatalogs`.

**Verification**:
- Actual source `packages/ai-builder/src/lib/formedible/ai-storage.ts:26-32` defines exactly five keys: `providerSettings`, `providerSecrets`, `modelCatalogs` (`'formedible-ai-builder-model-catalogs'`), `conversations`, `uiState`. Matches the report's excerpt verbatim.
- Docs at `apps/web/src/routes/docs/ai-builder.tsx` (lines ~236-265, "Storage and export" section): body says "separate browser keys for provider settings, provider secrets, conversations, and UI state"; bullet says "STORAGE_KEYS names four independent storage entries."; snippet titled `packages/ai-builder/src/lib/formedible/ai-storage.ts` lists only the four keys — presented as a source excerpt with no abridged marker.
- `modelCatalogs` is actively used in the same file: `persistProviderModelCatalog` (line 152) and `readProviderModelCatalogs` (line 157) read/write `STORAGE_KEYS.modelCatalogs`, backing the model-catalog fetching that the same docs page's "Provider and model lists" section (lines 92-93) describes. Omission has real auditing impact as claimed.

---

### Finding 3: `validationSummary` omitted from the "complete" UseFormedibleOptions list — CONFIRMED
**Original**: api.tsx's UseFormedibleOptions section documents every option except the real, default-enabled `validationSummary`, while referencing types.ts as the "Complete property list".

**Verification**:
- Option exists: `packages/formedible/src/lib/formedible/types.ts:462` — `readonly validationSummary?: boolean | FormedibleValidationSummaryConfig;` inside `UseFormedibleOptions` (interface begins at line 455), with `FormedibleValidationSummaryConfig = { autoNavigate?: boolean; showBadges?: boolean }` at types.ts:395-398.
- Default-enabled and hook-consumed: `getValidationSummaryConfig()` at `use-formedible.tsx:110-124` returns `{ enabled: true, autoNavigate: true, showBadges: true }` when unset. It drives the validation-summary alert (`renderValidationSummary`, line 503+, guarded by `validationSummaryConfig.enabled`), per-page/per-tab error badges (lines 547 and 625), and invalid-submit auto-navigation (`handleInvalidSubmitEntries`, line ~310, guarded by `autoNavigate`). All line claims in the original report check out within a line or two.
- Docs omission: api.tsx lines 179-231 — the options table (rows at lines 189-219) lists every other interface property, including the inert compatibility keys `collapseLabel`/`expandLabel` (lines 217-218), but has no `validationSummary` row. The section's reference at line 224 labels `types.ts#L448-L480` as "Complete property list" — that range does contain `validationSummary` (line 462). `grep -rn validationSummary apps/web/src/routes/docs/ apps/web/src/components/docs/ apps/web/src/features/docs/` → zero matches, so it is documented nowhere on the docs site.
- It is a rewrite-era feature (zero mentions in main's `use-formedible.tsx`), so it cannot be dismissed as legacy/dead code.

---

## Summary
All three findings are real and verified against source, git history, and live HTTP checks. None dismissed. One minor factual correction noted inside Finding 1 (the 428-443 anchor does not match main's old hook return either — it matches neither branch, which strengthens the finding).
