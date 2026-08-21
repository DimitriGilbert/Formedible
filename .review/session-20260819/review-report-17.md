# Review Report — Cluster 17: Docs shared components & layout

Reviewer scope: 13 files under `apps/web/src/components/docs/` and `apps/web/src/components/layout/`.
Repo: /home/didi/workspace/Formedible (branch `re-codex`).

Verification performed beyond reading the files:
- Cross-checked every `docsCodeExamples` / `docsCompatibilityExamples` lookup against the source data (all IDs exist; the record is a full `Record<DocsCodeExampleId, DocsCodeExample>` so lookups cannot be `undefined`).
- Searched the entire repo for importers of each assigned component.
- Scanned all guide routes (`src/routes/docs/*.tsx`) for duplicate React keys (section titles, API-table property names) — none found; the apparent duplicates were nested page/snippet titles that are never used as keys.
- Scanned all guide routes for sections lacking both `snippet` and `references`.
- Confirmed no highlight.js/shiki/prism usage exists anywhere in the app — code is intentionally rendered as plain text, so the "wrong language to highlighter" concern is moot. No observers, intervals, or highlighter instances exist in these files, so no leak surface beyond the one timer noted in Finding 3.

---

### [SEVERITY: MEDIUM] Finding 1: Dead fallback branch — `evidence ?? <div>` can never take the right-hand side
**File**: apps/web/src/components/docs/guide-page.tsx:201,220
**Problem**: The code builds `const evidence = <DocsGuideEvidence section={section} />;` (always a truthy ReactElement object) and then renders `{evidence ?? <div className="hidden bg-muted lg:block" />}`. Nullish coalescing only falls through for `null`/`undefined`, and a JSX element is never either, so the fallback div is unreachable dead code. The author's intent was clearly "if this section has no evidence, fill the right grid column with a muted block" — `DocsGuideEvidence` returns `null` precisely when a section has neither `snippet` nor `references` (guide-page.tsx:147-149), but that `null` is a render-time result inside the element, not the value held in `evidence`.
**Evidence**:
```tsx
const evidence = <DocsGuideEvidence section={section} />;   // line 201 — always an object
...
{evidence ?? <div className="hidden bg-muted lg:block" />}  // line 220 — right side unreachable
```
The parent `<section className="grid gap-px bg-border lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">` relies on a second child to paint the right column; with `DocsGuideEvidence` rendering null, the column shows the raw `bg-border` instead of the intended `bg-muted` filler.
**Impact**: Latent layout/logic bug. A scan of all current guide routes shows every section today has a `snippet` or `references`, so nothing visibly breaks yet — but the first content edit that adds an evidence-less section will render an empty border-colored column on `lg` screens, and the "fix" someone would reach for (the fallback div) silently does nothing. Also ships misleading dead code.
**Suggestion**: Move the condition out of JSX coercion, e.g. compute `const hasEvidence = Boolean(section.snippet || (section.references && section.references.length > 0));` and render `{hasEvidence ? <DocsGuideEvidence section={section} /> : <div className="hidden bg-muted lg:block" />}` — or simply have `DocsGuideEvidence` itself return the filler div instead of `null`.

---

### [SEVERITY: MEDIUM] Finding 2: Six of the thirteen assigned files are dead code — unreachable from any route, with parallel live implementations elsewhere
**File**: apps/web/src/components/docs/docs-home.tsx:3, apps/web/src/components/docs/docs-layout.tsx:9, apps/web/src/components/docs/docs-card.tsx:8, apps/web/src/components/docs/page-header.tsx:13, apps/web/src/components/docs/home-landing.tsx:93, apps/web/src/components/docs/rendered-example-showcase.tsx:66
**Problem**: A repo-wide search (all `.ts`/`.tsx`/`.json` under `apps/` and `packages/`, excluding the files themselves) finds zero importers for these modules. Each has a live counterpart actually wired into the router:
- `docs-home.tsx` (`DocsHome`) — unused. `/docs/` is served by `routes/docs/index.tsx` (`DocsIndexRoute`), which re-implements the hero, hub links, card grid, and code sections inline.
- `docs-layout.tsx` (`DocsLayout`) — only imported by the dead `docs-home.tsx`. The `/docs` path route (`routes/docs/route.tsx:12`) declares its own local `function DocsLayout() { return <Outlet />; }`.
- `docs-card.tsx` (`DocsCard`) — only imported by dead `docs-layout.tsx`. (`DocsCardGrid` in `routes/docs/index.tsx` is an unrelated local function, not this component.)
- `page-header.tsx` (`PageHeader`) — only imported by dead `docs-layout.tsx`.
- `home-landing.tsx` (`HomeLanding`) — unused. `/` is served by `routes/index.tsx` (`LandingPage`) with its own hero/bento/CTA and its own `InstallCommand` usage.
- `rendered-example-showcase.tsx` (`RenderedExampleShowcase`, `renderedExampleMappings`) — unused. `/docs/examples` uses `migratedDocsExamples` from `@/components/docs/examples` (`routes/docs/examples.tsx:7`).
**Evidence**: grep for `docs-home|home-landing|rendered-example-showcase|DocsLayout|DocsCard|PageHeader` across `apps/` and `packages/` returns only self-references plus the route-local namesakes listed above.
**Impact**: Two divergent copies of the docs chrome now exist. Anyone editing the "shared" components (per the component-directory convention) to change the docs hero, cards, code sections, or example showcase will see no effect on the site — the live duplicates in `routes/` are what render. This also drags dead weight: e.g. `home-landing.tsx` still mounts a full `useFormedible` mini-form, and `docs-layout.tsx` renders `dt`/`dd` elements outside any `<dl>` (invalid HTML) — harmless only because the file never renders. The showcase additionally pins a `renderedExampleMappings` table to `data/code-examples.ts` export keys that nothing consumes.
**Suggestion**: Either delete the six orphaned modules (plus their now-unused prop types) or rewire the routes to use them and delete the route-local duplicates — one canonical implementation. If keeping `rendered-example-showcase.tsx` for future use, note that its mapping keys were verified to match existing compatibility-example IDs, so it is safe to adopt as-is.

---

### [SEVERITY: MEDIUM] Finding 3: InstallCommand copy-state handling — stale "Copied" across package switches and uncleared reset timer
**File**: apps/web/src/components/layout/install-command.tsx:24-53
**Problem**: Two related state-handling defects in the copy widget:
1. Switching the package manager tab does not reset `copied`. After copying the pnpm command, selecting "yarn" keeps the green check and "Copied" label next to a command that was never copied — the user can reasonably believe the yarn command is on the clipboard when the pnpm one is (`setActivePkg` at lines 44-53 never touches `copied`).
2. The 2s reset `setTimeout` (line 33) is never cancelled — no cleanup on unmount and no prior-timer cancellation on re-click. Clicking Copy twice 1.5s apart makes the first timer fire at t=2.0s and clear "Copied" only 0.5s after the second click, cutting the feedback short; unmounting within the window leaves a pending timer calling `setState` on an unmounted component (a silent no-op in React 18/19, but still a leaked timer).
**Evidence**: `handleCopy` (lines 24-38) does `setCopied(true); setTimeout(() => setCopied(false), 2000);` with no ref/timeout tracking. Contrast the sibling `code-block.tsx:13-32`, which stores the timeout in a ref, clears the previous one before scheduling, and clears it on unmount — the correct pattern already exists in this cluster.
**Impact**: Misleading clipboard feedback in a widget that appears twice on the real landing page (`routes/index.tsx` hero and CTA sections). Functional impact is small (no crash, wrong-command copy only if the user is misled), hence MEDIUM not HIGH.
**Suggestion**: Reset `copied` when `activePkg` changes (or key the label off the pair); adopt the `code-block.tsx` timeout pattern: keep the timer id in a ref, clear it before re-scheduling and in an unmount `useEffect`.

---

## Files reviewed with no findings
- `apps/web/src/components/docs/api-property-table.tsx` — rendering verified against real guide data; `createApiPropertyTableRows` header-index lookup is guarded by `isApiPropertyTable`; no duplicate `row.name` keys exist in current content.
- `apps/web/src/components/docs/code-block.tsx` — copy logic is correct: feature-detects `navigator.clipboard`, handles rejection with a `failed` state, cancels/reschedules the reset timer, and cleans up on unmount.
- `apps/web/src/components/layout/page-container.tsx`, `section-divider.tsx`, `site-footer.tsx` — trivial, correct, and used by live routes.
- `guide-page.tsx` and `rendered-example-showcase.tsx` beyond the findings above: example lookups are compile-time-total (`Record<DocsCodeExampleId, ...>`), showcase mapping falls back safely for unknown keys, and tabpanel `hidden` toggling is sound.
- SSR/browser-API safety: no render-time access to `navigator`/`window` in any assigned file (`home-landing.tsx` guards its `sessionStorage` write), so no SSR crash surface regardless of SPA/SSR setup.

## Summary
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 3 (dead `??` fallback in guide-page; six orphaned docs components with duplicate live implementations; InstallCommand copy-state bugs)
