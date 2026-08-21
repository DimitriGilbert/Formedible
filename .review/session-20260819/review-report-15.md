# Cluster 15 Review — Docs routes + docs data/SEO layer

Reviewer scope: `apps/web/src/routes/docs/*` (14 route files) + `apps/web/src/features/docs/navigation.ts`.
Method: every file read in full; API claims cross-checked against `packages/formedible/src`, `packages/builder/src`, `packages/ai-builder/src`, `packages/formedible-parser/src`, tests, and the docs example registry. Web app type-check was run: no type errors in any assigned docs route/feature file (the only `check-types:web` failures are in `packages/ui` ai files, outside this cluster).

Overall the docs are unusually accurate against the rewrite: the API/validation/analytics/persistence/dynamic-text tables and snippets match the re-codex source almost line-for-line (verified: `buildFieldValidators` order, `onChangeListenTo` derivation, inline-vs-async precedence, `STORAGE_KEYS`-adjacent persistence payload shape, `onPageChange` positional args incl. `pageValidationState` for the page being left, abandon context, `progressValue` formula, tab/page precedence in `renderFields`, `normalizeFieldType` alias map, form event callback ordering, and the exact hook return object). All 14 `?example=` ids referenced across pages exist in `migratedDocsExamples`; all `PublicRoutePath` values used by `createRouteSeoHead` are covered by `publicRouteMeta`; `hubColClasses`/`cardColClasses` array lengths match their data arrays.

Real problems found: 3.

---

### [SEVERITY: HIGH] Finding 1: Four docs pages build GitHub source links against `blob/main`, but the rewrite files only exist on `re-codex` — most links 404, the rest point at the pre-rewrite code
**File**: apps/web/src/routes/docs/getting-started.tsx:[7], apps/web/src/routes/docs/fields.tsx:[16], apps/web/src/routes/docs/validation.tsx:[8], apps/web/src/routes/docs/api.tsx:[9]
**Problem**: These four pages define `githubRoot`/`sourceBase` as `https://github.com/DimitriGilbert/Formedible/blob/main`, while the other four content pages (dynamic-text.tsx:9, persistence.tsx:9, analytics.tsx:10, advanced-features.tsx:9) correctly use `blob/re-codex`. The from-scratch rewrite lives only on `re-codex` (current branch); `main` still holds the pre-rewrite codebase.
**Evidence**: Verified per path with `git cat-file -e main:<path>`. Missing on `main` (linked from these 4 pages → GitHub 404):
- getting-started.tsx: `packages/formedible/public/r/formedible-core.json` (the "Public registry item" reference), `tests/consumer-smoke/utils/generated-form-route.ts`, `packages/formedible/src/lib/formedible/validation.ts`, `apps/web/src/components/docs/examples/contact-form.tsx`, `packages/formedible/src/components/formedible/field-renderer.tsx`, `apps/web/src/features/docs/code-examples.ts`
- fields.tsx: `normalize-field-config.ts`, `password-field.tsx`, `advanced-field-utils.ts`, all `apps/web/src/components/docs/examples/*` references
- validation.tsx: `tests/formedible/validation/validation-pipeline.test.tsx`, `tests/formedible/basic-fields.test.tsx`, all example sources
- api.tsx: `use-form-persistence.ts`, `use-form-analytics.ts`, `use-multi-page.ts`, `use-form-tabs.ts`, `components/formedible/form.tsx`, `tests/formedible/phase10-behavior.test.ts`, `tests/formedible/types/options.test-d.ts`

Files that DO exist on `main` (`use-formedible.tsx`, `lib/formedible/types.ts`, `field-registry.tsx`, `text-field.tsx`, …) are the old pre-rewrite versions, so the deep line anchors describe the new code but land on unrelated old code — e.g. api.tsx:413 claims the hook return object is at `use-formedible.tsx#L428-L443` (actual re-codex location: lines 664-679; the 428-443 range matches the old main hook). The same stale-anchor pattern appears even on the correct branch (dynamic-text.tsx:74-76 claims `withDynamicText` at `#L155-L174`, actual lines 323-342; analytics.tsx:103 claims the field controller at `#L239-L255`, actual ~399-433), indicating the anchors were written against the pre-rewrite file layout.
**Impact**: Every "Source:" / "Test:" reference on the getting-started, fields, validation, and API pages is either a dead link or points readers at the superseded implementation, undermining the docs' core claim that each section "links to source or tests" that matches the described behavior. This is user-visible broken navigation in the docs data layer.
**Suggestion**: Use one shared constant for the source base (the branch the docs ship from — currently `re-codex`, switching to `main` only after the rewrite is merged) in a single module (e.g. `features/docs/source-links.ts`) consumed by all guide pages, and regenerate the `#L…` anchors from the current source (or drop line anchors in favor of symbol-level links).

---

### [SEVERITY: MEDIUM] Finding 2: AI Builder docs misstate the storage contract — `STORAGE_KEYS` has five keys, docs say four and show an edited "source excerpt" omitting `modelCatalogs`
**File**: apps/web/src/routes/docs/ai-builder.tsx:[236]-[265]
**Problem**: The "Storage and export" section states "STORAGE_KEYS names four independent storage entries" and "AI Builder uses separate browser keys for provider settings, provider secrets, conversations, and UI state", and renders a snippet titled `packages/ai-builder/src/lib/formedible/ai-storage.ts` whose `STORAGE_KEYS` object lists only four keys.
**Evidence**: Actual source (`packages/ai-builder/src/lib/formedible/ai-storage.ts:26-32`) defines five keys:
```ts
export const STORAGE_KEYS = {
  providerSettings: 'formedible-ai-builder-provider-settings',
  providerSecrets: 'formedible-ai-builder-provider-secrets',
  modelCatalogs: 'formedible-ai-builder-model-catalogs',
  conversations: 'formedible-ai-builder-conversations',
  uiState: 'formedible-ai-builder-ui-state',
} as const;
```
The omitted `modelCatalogs` key is actively used (`persistProviderModelCatalog` / `readProviderModelCatalogs`, which back the model-catalog fetching described in this same page's "Provider and model lists" section).
**Impact**: A developer auditing storage usage (e.g. for privacy/GDPR key enumeration or writing a storage-clearing routine) following this page would miss the `formedible-ai-builder-model-catalogs` localStorage entry. The snippet is presented as a source excerpt, so readers have no signal it is abridged.
**Suggestion**: Include `modelCatalogs` in the excerpt and change the bullet/body to five keys — or clearly mark abridged excerpts.

---

### [SEVERITY: MEDIUM] Finding 3: API reference omits the `validationSummary` option entirely while claiming a complete `UseFormedibleOptions` property list
**File**: apps/web/src/routes/docs/api.tsx:[179]-[231]
**Problem**: The `UseFormedibleOptions` section's table and bullets do not mention `validationSummary`, and the section's reference list describes `packages/formedible/src/lib/formedible/types.ts#L448-L480` as the "Complete property list". `validationSummary` is a real, hook-consumed public option driving visible behavior and is documented nowhere on the docs site (grep of `apps/web/src/routes/docs/` finds zero mentions).
**Evidence**: `packages/formedible/src/lib/formedible/types.ts:462` declares `readonly validationSummary?: boolean | FormedibleValidationSummaryConfig;` (with `FormedibleValidationSummaryConfig` = `{ autoNavigate?, showBadges? }` at lines 395-398). `packages/formedible/src/hooks/use-formedible.tsx:111-125` (`getValidationSummaryConfig`) reads it, defaulting to enabled/autoNavigate/showBadges `true`; it powers the rendered validation-summary alert (`renderValidationSummary`, lines 503-528), per-page/per-tab error badges (lines 547, 625), and invalid-submit auto-navigation (lines 301-321). The API page documents every other option in the interface (including inert compatibility keys `collapseLabel`/`expandLabel`), so the omission is inconsistent with its own completeness framing, and the default-on behavior (a summary alert + badges users cannot discover how to disable from the docs) is undocumented.
**Impact**: Consumers reading the API reference as the public contract have no way to learn about or configure a default-enabled runtime feature (turning off the validation summary or its auto-navigation). Not a fabrication, but a wrong-by-omission entry in the page whose purpose is the complete options map.
**Suggestion**: Add a `validationSummary` row (`boolean | { autoNavigate?: boolean; showBadges?: boolean }`, default enabled with both flags `true`) to the UseFormedibleOptions table, and cover the behavior (summary alert after invalid submit, error badges, auto-navigate to first invalid field) in the API or advanced-features page.

---

## Verified-accurate highlights (no action needed)
- All `?example=` deep links used across pages (`contact`, `registration`, `arrays`, `persistence`, `analytics`, `advanced-fields`, `conditional-pages`, `conditional-object-array`, `survey`, `job`, `tabbed`, `flow`, `rental-flow`) exist in `migratedDocsExamples` and survive `validateSearch`.
- `navigation.ts` hrefs (`/`, `/docs`, `/docs/examples`, `/docs/fields`, `/builder`, `/ai-builder`) all correspond to existing routes; every `createRouteSeoHead('/docs/...')` path is present in `PublicRoutePath`/`publicRouteMeta`.
- validation.tsx runtime-order snippet, cross-field `onChangeListenTo` derivation, inlineValidation precedence ("asyncValidation rule runs first and its debounceMs wins"), and fallback messages ("Invalid value" / "Invalid field combination") match `packages/formedible/src/lib/formedible/validation.ts` exactly.
- analytics.tsx callback table (names, positional args, `onPageChange` validation state for the page being left, abandon context assembly, `getFieldBlurTime` 0 fallback, standalone `createFormAnalyticsTracker` methods incl. injected clock) matches `use-form-analytics.ts` and `types.ts`.
- persistence.tsx contract (sessionStorage default, `Date.now` timestamp, exclude before write, clear after successful submit, `<= totalPages` page restore, malformed-payload `undefined`) matches `use-form-persistence.ts`.
- dynamic-text.tsx regex `/\{\{\s*([\w.]+)\s*\}\}/g`, token resolution locations (label/description/placeholder/section/page title+description/tab label+description), and nullish-to-empty-string behavior match `dynamic-text.ts` + `use-formedible.tsx`.
- fields.tsx config table matches `types.ts`/`normalize-field-config.ts`/`field-registry.tsx` (aliases, `emailConfig: never`, top-level rows/maxLength/min/max precedence, datalist consumers, help rendering in `field-wrapper.tsx`, component → defaultComponents → registry order in `field-renderer.tsx`).
- api.tsx return-value table matches the hook's actual return object field-for-field, including removed-helper notes; form-props event ordering matches the `Form` implementation.
- ai-builder.tsx and parser.tsx source excerpts (provider options, default models `gpt-5.4-mini`/`claude-sonnet-4-6`/`minimax/minimax-2.7`, `validateProviderAccess` rules, `parseAiToFormedible`/`inferDefaultValues` defaults, `extractFormedibleCode` fence rules, executable-syntax pattern, `defaultParserConfig`, `mergeSchemas` strategies) match the package sources; builder.tsx export/store/codegen claims match `packages/builder/src`.
- The known-compat removals/behavior changes listed in the review context (hook return removals, date-as-string, absent layout/help/progress customizations and tab/performance analytics) are consistently NOT documented as existing — no re-report.
