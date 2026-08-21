# Verified Report — Report 17 (Cluster 17: Docs shared components & layout)

Verification method: read every referenced file at the cited lines; repo-wide greps (`.ts`/`.tsx`/`.js`/`.jsx`/`.json` across `apps/` and `packages/`, plus path-string search over the whole repo excluding `node_modules`); checked barrel/re-export chains and lazy-import patterns; inspected git history to test the "intentionally kept for future redesign" hypothesis.

Result: **3 confirmed, 0 dismissed.**

---

### Finding 1: Dead fallback branch — `evidence ?? <div>` can never take the right-hand side — CONFIRMED
**Original**: `guide-page.tsx:201,220` builds `const evidence = <DocsGuideEvidence section={section} />;` (always a truthy ReactElement object) and renders `{evidence ?? <div className="hidden bg-muted lg:block" />}`. Since `??` only falls through for `null`/`undefined`, the fallback div is unreachable; the author's intent (fill the right grid column with `bg-muted` when a section has no evidence) never fires because `DocsGuideEvidence` returning `null` (lines 147-149) is a render-time result *inside* the element, not the value held in `evidence`.

**Verification**: Real. Confirmed by reading `/home/didi/workspace/Formedible/apps/web/src/components/docs/guide-page.tsx`:
- Line 201: `const evidence = <DocsGuideEvidence section={section} />;` — a JSX element evaluates to a `ReactElement` object at assignment time; it is never `null` or `undefined`.
- Line 220: `{evidence ?? <div className="hidden bg-muted lg:block" />}` — the right-hand side is unreachable dead code, exactly as claimed.
- `DocsGuideEvidence` (lines 144-149) returns `null` only when `!section.snippet && !hasReferences`; that `null` materializes during render of the element tree and cannot influence the `??`.
- Parent `<section ... lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]>` at line 204 uses `gap-px bg-border`, so an evidence-less section would show a raw border-colored right column on `lg` — the fallback that was supposed to prevent this silently does nothing.
- Impact framing checked: every current guide route that uses `DocsGuidePage` supplies `snippet`/`references` for its sections (per-route snippet counts: advanced-features 6, ai-builder 7, analytics 5, api 9, builder 5, dynamic-text 4, fields 7, getting-started 4, parser 6, persistence 5, validation 7), so the bug is latent, not currently visible — matching the report's MEDIUM severity.

---

### Finding 2: Six of the thirteen assigned files are dead code with parallel live implementations — CONFIRMED
**Original**: `docs-home.tsx`, `docs-layout.tsx`, `docs-card.tsx`, `page-header.tsx`, `home-landing.tsx`, `rendered-example-showcase.tsx` have zero importers; the live routes re-implement the same UI inline.

**Verification**: Real. Exhaustive import analysis:

Repo-wide grep for module paths (`docs-home|home-landing|rendered-example-showcase|docs-card|page-header|docs-layout`) and exported names (`DocsHome|DocsLayout|DocsCard|PageHeader|HomeLanding|RenderedExampleShowcase|renderedExampleMappings`) over `apps/` + `packages/` returns **only** these references:
- `docs-home.tsx:1` imports `docs-layout` (docs-home itself imported by nothing)
- `docs-layout.tsx:5-6` imports `docs-card` and `page-header` (docs-layout imported only by dead docs-home)
- `home-landing.tsx` and `rendered-example-showcase.tsx`: self-references only
- Name-collision hits are route-local definitions, not imports: `routes/docs/route.tsx:12` declares its own `function DocsLayout() { return <Outlet />; }`; `routes/docs/index.tsx:125` declares a local `DocsCardGrid`; `renderPageHeader` in `packages/formedible/src/hooks/use-formedible.tsx:530` is an unrelated internal function. `routes/docs/advanced-features.tsx:108` and `dynamic-text.tsx:48` hits are prose strings inside source-reference bullets, not code.

Parallel live implementations confirmed:
- `/docs` path layout: `routes/docs/route.tsx:12-14` uses the route-local `DocsLayout` (bare `<Outlet />`), not `components/docs/docs-layout.tsx`.
- `/docs/` index: `routes/docs/index.tsx` (`DocsIndexRoute`) re-implements hero (`DocsHero`), hub links, card grid (`DocsCardGrid`, a local function unrelated to the `DocsCard` component), and code sections inline (lines 45-191).
- `/`: `routes/index.tsx` (`LandingPage`) has its own hero/bento/CTA and its own `InstallCommand` usages (lines 58, 216); `HomeLanding` is never mounted.
- `/docs/examples`: `routes/docs/examples.tsx:7` imports `migratedDocsExamples` from `@/components/docs/examples`; `RenderedExampleShowcase` is never used.

Re-export chains ruled out: the only barrel in scope, `components/docs/examples/index.tsx`, re-exports none of the six. No `lazy(`/`lazyRouteComponent` usage exists in `routes/` or `main.tsx`. A repo-wide path-string grep (including `scripts/`, excluding `node_modules`) finds no references. `data/code-examples.ts` exists (the showcase's mapping keys target its exports), so the file content is coherent — just unreachable.

False-positive signal (intentional future use) checked and rejected: git history shows the routes *did* import these components at commit `a944a84 "build docs route architecture"`, and the imports were removed during the redesign (`81123f1 "redesign done + ai builder refacatoring"`, `234ea8e`, `be35a6e "redesign in progress"`). These are redesign leftovers, not deliberately curated future assets. All six named files are genuinely dead as claimed; none of the 6 is actually imported anywhere, so no adjustment to the finding is needed.

Supporting detail also verified: `docs-layout.tsx:22-28` renders `dt`/`dd` inside a plain `<div>` (no `<dl>` ancestor) — invalid HTML, harmless only because the file never renders; `home-landing.tsx:70-91` mounts a full `useFormedible` mini-form (`MiniLeadForm`) that ships as dead weight.

---

### Finding 3: InstallCommand copy-state — stale "Copied" across package switches and uncleared reset timer — CONFIRMED
**Original**: `install-command.tsx:24-53` — (1) switching the package-manager tab does not reset `copied`, leaving a misleading check/"Copied" label next to a command that was never copied; (2) the 2s reset `setTimeout` is never cancelled (no prior-timer cancellation, no unmount cleanup), so rapid re-clicks cut feedback short and unmount leaks a pending timer.

**Verification**: Real. Both sub-bugs confirmed in `/home/didi/workspace/Formedible/apps/web/src/components/layout/install-command.tsx`:
1. State: lines 21-22 (`activePkg`, `copied`). Tab buttons (lines 44-53) call only `setActivePkg(pm)` — `copied` is never reset. After copying the pnpm command and switching to yarn, the button still shows `Check`/`Copied` (lines 60-61) beside the yarn command while the pnpm command is what's on the clipboard. Confirmed.
2. `handleCopy` (lines 24-38) does `setCopied(true); setTimeout(() => setCopied(false), 2000);` (timer at line 33) with no ref/timeout tracking, no `clearTimeout` before re-scheduling, and no unmount `useEffect`. Two clicks 1.5s apart → first timer fires at t=2.0s and clears the second click's feedback after only 0.5s; unmount within the window leaves a pending timer. Confirmed.
3. Contrast claim verified: the sibling `code-block.tsx:13-32` implements the correct pattern (`resetTimeoutRef`, `clearTimeout` on re-schedule in `scheduleCopyStateReset`, cleanup on unmount in `useEffect`), so the fix pattern already exists in this cluster.
4. Impact claim verified: `InstallCommand` is rendered twice on the live landing page (`routes/index.tsx:58` hero and `:216` CTA).

---

## False-positive signals checked
- **Intentional dead files for future redesign**: rejected — git history shows the routes stopped importing these components during the "redesign done" commits; they are stale duplicates, and the live copies in `routes/` have since diverged (different markup, different data flow), which is exactly the maintenance hazard the report describes.
- **Re-export chains / barrels**: the only barrel (`components/docs/examples/index.tsx`) does not re-export any of the six.
- **Lazy/dynamic imports**: no `lazy(` or `lazyRouteComponent` usage anywhere in `routes/` or `main.tsx`.
- **String-path references** (configs, scripts): repo-wide path-string grep returns nothing.

## Summary
3 confirmed, 0 dismissed.
