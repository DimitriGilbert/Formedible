# Review Report — Cluster 16 (Docs data/content/SEO layer)

Reviewer scope: `apps/web/src/features/docs/{code-examples,compatibility-examples,content,seo,site-meta}.ts(x)` and `apps/web/src/data/code-examples.ts`.

Verified against: `packages/formedible/src/lib/formedible/types.ts`, `packages/ui/src/components/formedible/**` (the synced component source), shadcn registry payloads in `packages/*/public/r/*.json`, `apps/web/public/{sitemap.xml,robots.txt,og.svg,index.json}`, `apps/web/src/routes/**`, and `tests/compatibility-examples/*`.

What checked out clean (no findings): all 5 docs code-example snippets reference real export names and valid prop shapes (`useFormedible` signature and `{ Form }` return, `FormBuilder` all-optional props so `<FormBuilder />` compiles, `AIBuilder`/`ProviderSelection`/`createDefaultProviderSettings('openrouter')`/`createDefaultProviderSecrets` all exist with matching prop/callback signatures, `TextField`/`NumberField` exported from registry targets `@ui/formedible/fields/*` matching the `@/components/ui/formedible/...` import narrative); the `formedible-core.json` install URL is real and copied into the deploy output by `scripts/prepare-registry-host.js`; `content.ts` section ids match card anchors and all `codeExampleIds` resolve; sitemap.xml, `publicRouteMeta`, `PublicRoutePath`, and actual route files match 1:1 (16 routes, no orphans/missing, `/404` correctly excluded); the 14 `docsCompatibilityExamples` match the 14 fixtures in `tests/compatibility-examples/example-manifest.ts` 1:1 (spot-checked `vacationFlow`/flow-form in detail — identical); `preconnect https://chemin.dbuild.dev` corresponds to the real analytics script in `__root.tsx` (intentional); `{ title }` inside the `meta` array is a supported TanStack Router pattern.

---

### [SEVERITY: HIGH] Finding 1: Every non-home page renders 2–3 conflicting canonical URLs and duplicate page/breadcrumb JSON-LD (nested route heads accumulate)

**File**: apps/web/src/features/docs/seo.ts:171-234 (emitting layer), consumed by apps/web/src/routes/__root.tsx:15-29, apps/web/src/routes/docs/route.tsx:5-8, and every leaf route (e.g. apps/web/src/routes/docs/getting-started.tsx:6,120)

**Problem**: `createSeoHead()` emits a canonical link plus two JSON-LD scripts (page entity + BreadcrumbList) per call, and it is called once per matched route level: the root route calls `createRouteSeoHead('/')`, the `/docs` layout route calls `createRouteSeoHead('/docs')`, and each leaf route calls `createRouteSeoHead('<page>')`. TanStack Router concatenates `head().links` and `head().scripts` from ALL matched routes and only dedupes exact-JSON duplicates (verified in `@tanstack/react-router@1.168.25` `dist/esm/headContentUtils.js`: `matches.map((match) => match.links).flat(1)` / `matches.map((match) => match.headScripts).flat(1)`, deduped only by `JSON.stringify` equality; only `meta` entries are deduped by `name`/`property`).

**Evidence**: For URL `/docs/getting-started` the matched routes are `__root` (canonical `https://formedible.dev/` + SoftwareSourceCode JSON-LD + 1-item breadcrumb), `/docs` layout (canonical `https://formedible.dev/docs` + TechArticle JSON-LD + 2-item breadcrumb), and the leaf (canonical `https://formedible.dev/docs/getting-started` + TechArticle JSON-LD + 3-item breadcrumb). All three canonical hrefs differ, so all three `<link rel="canonical">` tags render, along with 6 `application/ld+json` scripts describing three different page entities. `/builder` and `/ai-builder` pages each get 2 canonicals + 4 JSON-LD blocks (root + route).

**Impact**: Multiple conflicting canonical signals — Google ignores ambiguous canonical sets and picks its own (typically reported in Search Console as "Duplicate, Google chose different canonical"), risking wrong-URL indexing for every docs page. The duplicated/contradictory `TechArticle`/`BreadcrumbList` entities (including a homepage-only breadcrumb on deep pages) degrade rich-result eligibility.

**Suggestion**: Emit canonical + JSON-LD only from the leaf route. Either drop the `links`/`scripts` (keep only shared `meta`) from the root `/docs` layout head and the `__root` head (root should keep only charset/viewport/theme/robots/preconnect + og-site defaults that leaf meta dedupes by `name`/`property`), or add an explicit discriminator (e.g. only include canonical/JSON-LD when `options.path` was explicitly passed and is the current leaf path). `__root.tsx` should not call `createRouteSeoHead('/')` for the whole tree; give `routes/index.tsx` its own head instead.

---

### [SEVERITY: MEDIUM] Finding 2: `og:image`/`twitter:image` point to an SVG file, which major social crawlers cannot render

**File**: apps/web/src/features/docs/seo.ts:195-203 (with apps/web/src/features/docs/site-meta.ts:13 `ogImagePath: '/og.svg'`)

**Problem**: `og:image` and `twitter:image` are set to `https://formedible.dev/og.svg` and accompanied by hardcoded raster dimensions (`og:image:width 1200`, `og:image:height 630`). `apps/web/public/og.svg` is indeed an SVG (1200x630 viewBox). Facebook, X/Twitter, LinkedIn, Slack, and Discord do not support SVG for OG/Twitter card images — only PNG/JPEG/GIF/WebP.

**Evidence**: `apps/web/public/og.svg` starts `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" ...>`; seo.ts unconditionally uses `siteMeta.ogImagePath` (`/og.svg`) for `og:image`, `og:image:width/height`, and `twitter:image` on every route.

**Impact**: Every link share of formedible.dev on major platforms renders without a preview image despite the site declaring `summary_large_image` cards — the large-card markup is effectively dead weight on all 16 routes.

**Suggestion**: Render a raster OG image (PNG 1200x630) at build time (e.g. `satori`/`resvg` or a static export) and point `ogImagePath` at it. Keeping the SVG for on-site use is fine.

---

### [SEVERITY: MEDIUM] Finding 3: 'Advanced Field Types Form' compatibility example demonstrates three config options that no renderer consumes (dead props in a live-rendered showcase)

**File**: apps/web/src/features/docs/compatibility-examples.tsx:501-504

**Problem**: The `advanced-field-types-form` example (rendered live on `/docs/examples`) sets `locationConfig.showMap: true`, `durationConfig.showLabels: true`, and `sliderConfig.showTooltip: true`. None of these keys is read by the corresponding field renderers:

- `location-picker-field.tsx` reads `enableSearch`, `enableGeolocation`, `enableManualEntry`, `searchPlaceholder`, `searchOptions`, `searchCallback`, `reverseGeocodeCallback` — never `showMap`.
- `duration-picker-field.tsx` reads only `format`, `maxHours`, `maxMinutes`, `maxSeconds` — never `showLabels`.
- `slider-field.tsx` reads `min/max/step/valueMapping/showValue/valueLabelPrefix/valueLabelSuffix/valueDisplayPrecision/showRawValue/marks/visualizationComponent` — never `showTooltip` (`showTooltip` appears nowhere in `packages/ui/src/components/formedible/`).

These keys typecheck only via the `[customProp: string]: unknown` index signature on the config types, so they silently do nothing at runtime. (The builder's config registry round-trips `showMap`/`showLabels` too, but the renderers still ignore them.)

**Evidence**: Grep over `packages/ui/src/components/formedible/fields/`: no occurrence of `showMap` in `location-picker-field.tsx`, `showLabels` in `duration-picker-field.tsx`, `showTooltip` anywhere; the only `showLabels`/`showMap` consumers are `lib/types.ts` (declarations) and `lib/builder-config-registry.ts` (config UI persistence, not rendering).

**Impact**: The example is captioned as coverage of "rating, phone, color, location, duration, sliders..." and users copying it will believe tooltips, per-unit labels, and a map toggle exist. They don't — the live form silently ignores them, and users inherit non-functional config in their own forms.

**Suggestion**: Remove the three dead keys from the example (or wire them up in the renderers if they are intended features — in that case the renderer gap is the bug to fix instead).

---

### [SEVERITY: MEDIUM] Finding 4: `apps/web/src/data/code-examples.ts` (786 lines) is imported by nothing — dead duplicate of example code that now lives in `components/docs/examples/*`

**File**: apps/web/src/data/code-examples.ts:1-786

**Problem**: No module in the app imports from `@/data/code-examples`. Every export name it declares (`contactFormCode`, `surveyFormCode`, `persistenceFormCode`, `analyticsTrackingFormCode`, `arrayFieldsCode`, `advancedFieldTypesCode`, `example*FormCode`, ...) is satisfied by same-named exports defined locally inside `apps/web/src/components/docs/examples/*` and `apps/web/src/components/examples/*`, which is what the examples page (`routes/docs/examples.tsx` via `migratedDocsExamples`) and `hero-examples.tsx` actually consume. The only mention of the path anywhere is a static caption string `<p>apps/web/src/data/code-examples.ts</p>` in `components/docs/rendered-example-showcase.tsx:229` — and that component is itself imported by nothing, so even the provenance label never renders.

**Evidence**: `grep -rn "data/code-examples" apps/web/src` matches only the caption text in `rendered-example-showcase.tsx`; `grep -rn "from '@/data/code-examples'"` returns zero results. `components/docs/examples/{contact-form,survey-form,persistence-form,analytics-tracking-form,...}.tsx` each define their own `*Code` template literals (verified).

**Impact**: A 786-line dead data file duplicating example snippets that have already diverged from the live versions (the live ones in `components/docs/examples/*` are the ones rendered). Editing it changes nothing on the site — a drift trap for anyone doing docs work, and it also contains snippets that would not compile if copied (`gtag(...)` calls with no `gtag` declared in `analyticsTrackingFormCode`, `motion.div`/`toast` imports omitted in `profileFormCode`).

**Suggestion**: Delete `apps/web/src/data/code-examples.ts` (and, separately worth noting to the owners, the unreferenced `rendered-example-showcase.tsx` that carries its caption and the `renderedExampleMappings` registry keyed by these dead export names).

---

## Summary

- HIGH: 1 — Duplicate canonicals + JSON-LD from accumulating nested route heads (seo.ts / route wiring).
- MEDIUM: 3 — SVG og:image; dead config props in the advanced-fields compatibility example; dead 786-line `data/code-examples.ts`.
- CRITICAL: 0.

Otherwise the docs data layer is consistent: registry install paths/exports, sitemap ↔ routes ↔ route meta, content.ts ids, and the compatibility example set all verify clean.
