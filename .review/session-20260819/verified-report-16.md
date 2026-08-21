# Verified Report — Cluster 16 (Docs data/content/SEO layer)

Verifier: read every referenced source line, the installed `@tanstack/react-router` code, the field renderers in both `packages/ui` and canonical `packages/formedible/src`, and fetched live SSR HTML from a dev server (`vite` on port 3457) for `/`, `/docs/getting-started`, and `/builder`.

Result: **4 confirmed, 0 dismissed.**

---

### Finding 1: Every non-home page renders 2–3 conflicting canonical URLs and duplicate page/breadcrumb JSON-LD — CONFIRMED

**Original**: `createSeoHead()` emits a canonical + 2 JSON-LD scripts per call and is called at every matched route level (`__root`, `/docs` layout, leaf); TanStack Router concatenates links/scripts from all matched routes, producing conflicting canonical sets and duplicate JSON-LD on every non-home page.

**Verification**: Confirmed at three independent levels — source wiring, installed router internals, and live rendered HTML.

1. **Source wiring** (all as cited):
   - `apps/web/src/features/docs/seo.ts:171-234` — each `createSeoHead()` call returns `links: [{ rel: 'canonical', href: ... }, ...]` and two `application/ld+json` `scripts` (page entity + BreadcrumbList). `createRouteSeoHead(path)` (seo.ts:226-234) passes the per-route path, so every level emits a *different* canonical URL and *different* JSON-LD payloads.
   - `apps/web/src/routes/__root.tsx:15-29` — root head spreads `rootHead.links` (incl. canonical `https://formedible.dev/`) and `rootHead.scripts` for the entire tree.
   - `apps/web/src/routes/docs/route.tsx:5-8` — `/docs` layout emits canonical `https://formedible.dev/docs` + TechArticle + 2-item breadcrumb for all `/docs/*` matches.
   - Every leaf route has its own `createRouteSeoHead('<leaf>')` (grep confirmed: 12 docs leaves, `/builder`, `/ai-builder`), e.g. `apps/web/src/routes/docs/getting-started.tsx:6,120`.

2. **Installed router behavior** (exactly as the report described):
   - `@tanstack/react-router@1.168.25` is installed (`apps/web/package.json` `^1.168.22`); it symlinks `@tanstack/router-core@1.168.17`.
   - `node_modules/.pnpm/@tanstack+react-router@1.168.25.../dist/esm/headContentUtils.js` — both the SSR path (`buildTagsFromMatches`, line 53) and the client path (`useTags`, line 182) build links via `matches.map((match) => match.links).filter(Boolean).flat(1)` and scripts via `matches.map((match) => match.headScripts).flat(1).filter(Boolean)` (lines 106/240). Final dedup is `uniqBy(..., (d) => JSON.stringify(d))` — exact-object equality only, so three canonicals with different hrefs all survive, as do six distinct JSON-LD payloads. Only `meta` entries are deduped by `name`/`property` (deepest-match wins via reverse iteration) — which is why the *meta* layer looks correct while links/scripts stack.
   - `router-core/dist/esm/load-matches.js:325` — `headScripts: headFnContent?.scripts` confirms every matched route's `head().scripts` lands on the match and is accumulated.
   - The app is TanStack Start with `prerender: { enabled: true, crawlLinks: true }` (`apps/web/vite.config.ts`), so this accumulated head is what gets baked into served HTML.

3. **Live runtime evidence** (dev-server SSR fetch, strongest proof):
   - `/docs/getting-started` served HTML contains exactly 3 canonical tags: `https://formedible.dev/`, `https://formedible.dev/docs`, `https://formedible.dev/docs/getting-started`; and 6 `application/ld+json` blocks — entity census: 1 `SoftwareSourceCode` (the homepage-only entity), 2 `TechArticle`, 3 `BreadcrumbList` (1-, 2-, 3-item), 3 `Organization`, 3 `WebSite`, 6 `ListItem`.
   - `/builder` contains 2 canonicals (`/` and `/builder`) + 4 JSON-LD blocks.
   - `/` contains 1 canonical + 2 JSON-LD (correct — `routes/index.tsx` defines no head of its own). Note: `docs/index.tsx` also defines no own head, so the `/docs` URL itself renders 2 conflicting canonicals (root + layout), consistent with "every non-home page".

**Severity judgment**: HIGH stands. The false-positive hypothesis ("Google tolerates duplicate JSON-LD") does not rescue this: the canonical tags are not duplicates of one URL but *conflicting* — three different canonical targets on one page, which search engines cannot honor as a set; Google's documented behavior for ambiguous canonical signals is to ignore them and self-select (the classic "Duplicate, Google chose different canonical" Search Console report). Independently of crawler tolerance, shipping a homepage `SoftwareSourceCode` entity and a 1-item homepage breadcrumb inside every deep docs page is mechanically wrong structured data and a maintainability defect on all 15 non-home public routes.

---

### Finding 2: `og:image`/`twitter:image` point to an SVG file, which major social crawlers cannot render — CONFIRMED

**Original**: `og:image`/`twitter:image` resolve to `https://formedible.dev/og.svg` with hardcoded 1200x630 dimensions; major social platforms (Facebook, X/Twitter, LinkedIn, Slack, Discord) only support raster formats for card images, so link shares render imageless.

**Verification**:
- `apps/web/src/features/docs/site-meta.ts:13` — `ogImagePath: '/og.svg'`. Confirmed.
- `apps/web/src/features/docs/seo.ts:195-203` — `og:image`, `og:image:alt`, `og:image:width '1200'`, `og:image:height '630'`, `twitter:card 'summary_large_image'`, `twitter:image` all unconditionally derived from `siteMeta.ogImagePath` on every route. Confirmed in live HTML: `<meta property="og:image" content="https://formedible.dev/og.svg"/>` plus the 1200/630 metas.
- `apps/web/public/og.svg` exists and starts `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" ...>` — a genuine SVG, not a misnamed raster. Confirmed.
- Platform claim verified against current documentation/tooling: Facebook, X/Twitter, and LinkedIn card images require raster formats (PNG/JPG; WebP partially) — SVG is not supported by their crawlers, and every OG debugging guide prescribes converting SVG to PNG server-side. This is long-standing, well-documented platform behavior, not a transient quirk.

MEDIUM severity is appropriate (site functions fine; social preview images are dead on all routes).

---

### Finding 3: 'Advanced Field Types Form' example demonstrates three config options no renderer consumes — CONFIRMED

**Original**: The `advanced-field-types-form` compatibility example sets `locationConfig.showMap: true`, `durationConfig.showLabels: true`, `sliderConfig.showTooltip: true`; none is read by the corresponding field renderers, so the live-rendered showcase silently ignores them.

**Verification**:
- `apps/web/src/features/docs/compatibility-examples.tsx:501` (`locationConfig: { ..., showMap: true }`), `:502` (`durationConfig: { format: 'hm', maxHours: 24, showLabels: true }`), `:504` (`sliderConfig: { min: 1, max: 10, step: 1, showTooltip: true, showValue: true }`) — all three keys present exactly as cited. The example is rendered live: `DocsExampleForm` (compatibility-examples.tsx:54-58) uses `useFormedible` from `@formedible/ui/components/formedible/hooks/use-formedible`, and the examples page maps over `docsCompatibilityExamples`.
- Renderer audit (checked both the consumed `packages/ui/src/components/formedible/fields/` copies AND the canonical `packages/formedible/src/components/formedible/fields/` sources — identical verdicts):
  - `location-picker-field.tsx` reads `enableSearch`, `enableGeolocation`, `enableManualEntry`, `searchOptions`, `searchCallback`, `reverseGeocodeCallback`, `searchPlaceholder`; `showMap` appears 0 times.
  - `duration-picker-field.tsx` reads only `format`, `maxHours`, `maxMinutes`, `maxSeconds`; `showLabels` appears 0 times.
  - `slider-field.tsx` reads `min`, `max`, `step`, `visualizationComponent`, `showValue`, `valueLabelPrefix/Suffix`, `valueMapping`, `marks`; `showTooltip` appears 0 times anywhere in the formedible field components.
- The only consumers of `showMap`/`showLabels` are type declarations and the builder's config-persistence registry (`packages/builder/src/lib/formedible/builder-config-registry.ts:462,471,481`, `packages/ai-builder/src/lib/formedible/ai-storage.ts`), i.e. config-UI round-tripping, never rendering — exactly as the report stated.
- One minor inaccuracy in the report's mechanism, immaterial to the verdict: `showMap` and `showLabels` are *declared* members of `FormedibleLocationConfig`/`FormedibleDurationConfig` (`packages/ui/.../lib/types.ts:636/613`), not index-signature pass-throughs; only `showTooltip` is undeclared and passes via `[customProp: string]: unknown` (`types.ts:557`). If anything this strengthens the finding — the public types promise options that no renderer implements.

MEDIUM severity appropriate: a live, copy-me showcase advertising config that silently does nothing.

---

### Finding 4: `apps/web/src/data/code-examples.ts` (~786 lines) is imported by nothing — dead duplicate of example code that now lives in `components/docs/examples/*` — CONFIRMED

**Original**: No module imports `@/data/code-examples`; the live examples page consumes `migratedDocsExamples` from `components/docs/examples/*` which define their own same-named `*Code` exports; the only mention of the dead path is a static caption inside `rendered-example-showcase.tsx`, itself imported by nothing.

**Verification**:
- File exists at `apps/web/src/data/code-examples.ts`, 785 lines by `wc -l` (report said 786 — trivial newline-counting difference, non-material), exporting 13 template-literal code strings (`contactFormCode`, `profileFormCode`, `surveyFormCode`, `example*FormCode`, `analyticsTrackingFormCode`, `persistenceFormCode`, `arrayFieldsCode`, `advancedFieldTypesCode`).
- Repo-wide grep (ts/tsx/js/json/md, excluding node_modules) for `data/code-examples`: exactly two hits — the static caption `<p ...>apps/web/src/data/code-examples.ts</p>` at `apps/web/src/components/docs/rendered-example-showcase.tsx:229`, and a prose mention in `docs/formedible-test-expansion-plan.md` (a planning doc, not an import). Grep for any import specifier (`from '@/data/code-examples'` etc.) across the whole repo: zero results.
- The consuming path is elsewhere: `apps/web/src/routes/docs/examples.tsx:7` imports `migratedDocsExamples` from `@/components/docs/examples`, whose files define their own code strings (spot-verified `contactFormCode` at `components/docs/examples/contact-form.tsx:25` and `analyticsTrackingFormCode` at `components/docs/examples/analytics-tracking-form.tsx:51`).
- The caption never renders either: `RenderedExampleShowcase`, `renderedExampleMappings`, and `getRenderedExampleMapping` are referenced only inside `rendered-example-showcase.tsx` itself — zero external importers.
- Impact sub-claims spot-checked: `gtag('event', ...)` calls at data/code-examples.ts:489-498 with no `gtag` declared in the snippet, and `motion.div` (lines 33-41) / `toast.success` used in `profileFormCode` without imports — both present in the strings, supporting "snippets that would not compile if copied".

MEDIUM severity appropriate: a large dead file that has already diverged from the live versions it duplicates (drift trap), though it causes no runtime harm by itself.

---

## Summary

- HIGH: 1 — Confirmed (Finding 1, with live-runtime proof of 2-3 conflicting canonicals and 4-6 stacked JSON-LD blocks per non-home page).
- MEDIUM: 3 — All confirmed (Findings 2, 3, 4).
- DISMISSED: 0.

Corrections/nuances found during verification (none change a verdict):
- Finding 1: additionally, the `/docs` index URL itself renders 2 conflicting canonicals (root + layout), since `docs/index.tsx` has no own head; only `/` is clean.
- Finding 3: `showMap`/`showLabels` are declared in the config types (not index-signature-only as the report phrased it); `showTooltip` is index-signature-only. All three remain unconsumed by renderers.
- Finding 4: file is 785 lines by `wc -l` (report said 786) — immaterial.
