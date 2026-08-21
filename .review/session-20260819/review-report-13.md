# Review Report — Cluster 13 (Web docs app shell/routing/theming)

Reviewer scope: `apps/web/src/router.tsx`, `src/index.css`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/404.tsx`, `src/components/header.tsx`, `src/components/loader.tsx`, `src/components/theme-provider.tsx`, `src/components/theme-switcher.tsx`, `vite.config.ts`, `components.json`, `package.json`, `tsconfig.json`.

Known issue (excluded per instructions): web build fails on unresolved `@tanstack/ai*` imports originating in `packages/ui` (blocks `vite build` SSR stage, `check-types`, and `test:docs`). Not re-reported here.

---

### [SEVERITY: MEDIUM] Finding 1: Primary navigation uses raw `<a>` anchors, causing full page reloads instead of client-side routing

**File**: apps/web/src/components/header.tsx:42-55, 63-77
**Problem**: Both the desktop and mobile primary nav render plain `<a href={item.href}>` elements for all six internal routes (`/`, `/docs`, `/docs/examples`, `/docs/fields`, `/builder`, `/ai-builder`), even though `Link` is imported and used for the logo in the same file. Every nav click triggers a full document reload (re-parse/re-eval of the 909 kB `index-*.js` chunk, full re-hydration, loss of app state and scroll context) instead of a TanStack Router client-side transition. It also bypasses router route-chunk preloading (`defaultPreloadStaleTime` config in router.tsx becomes moot for the site's main nav) and the element-based scroll restoration.
**Evidence**: header.tsx line 23 uses `<Link to="/">` for the logo, while lines 42-55 and 63-77 render `<a key={item.id} href={item.href} ...>` for nav items. Every other navigational surface in the app uses TanStack `Link` (routes/index.tsx, routes/docs/index.tsx, routes/builder.tsx, routes/ai-builder.tsx, components/docs/home-landing.tsx). The pre-rewrite app on `main` also used framework links (`next/link` `<Link>`) for these same nav items — this is a regression in the rewrite, not an intentional choice.
**Impact**: Degraded UX and performance on the most-used interaction of the docs site (header nav): full page load on every click, no prefetch/preload benefit, no SPA transitions. Functional correctness is preserved (pages are prerendered), hence MEDIUM rather than HIGH.
**Suggestion**: Replace the two `<a href={item.href}>` loops with `<Link to={item.href}>` (the `siteNavigation` hrefs are plain paths with no hashes, so `Link` is a drop-in replacement; active-state logic via `useLocation` can stay, or switch to `Link`'s `activeOptions`).

---

## Verified non-issues (investigated, not flagged)

These were checked because they are classic failure modes for this stack, and confirmed to work correctly — recorded so other reviewers don't re-litigate them:

1. **`ThemeProvider` (next-themes) wrapping `<html>` in `__root.tsx`** — next-themes 0.4.6 renders its init `<script>` before its children, so the SSR tree is `[script, html]`. Empirically verified with the installed React 19.2.5 (`renderToString` + `hydrateRoot` over jsdom): React's Fizz document-mode hoists the script to the start of `<body>`, producing valid HTML; the script executes before body content is parsed (theme flash prevention intact); hydration succeeds with no mismatch. Only effect is a dev-only console warning ("Cannot render a sync or defer `<script>` outside the main document..."). Not a bug.
2. **Theme flash / hydration mismatch** — `packages/ui/src/styles/globals.css` defines `:root` with values identical to `defaultTheme="dark-saffron"`, so no-JS/first-paint is consistent with the default; the init script (body start) sets `data-theme` from `localStorage` before content paints. `theme-switcher.tsx` gates rendering on `mounted`, so no server/client output divergence. next-themes reads `localStorage` only on the client's initial render in a way that never affects rendered output. Clean.
3. **`vite.config.ts` `resolve: { tsconfigPaths: true }`** — valid option in the installed Vite 8.0.10 (`tsconfigPaths?: boolean` present in `vite/dist/node/index.d.ts:1928`). Client build resolves aliases fine.
4. **`tanstackStart({ pages: [{ path: '/404', prerender: { outputPath: '/404.html' } }] })`** — matches the installed `@tanstack/start-plugin-core` 1.169.6 zod schema (page items accept `path` + `prerender: { enabled, outputPath, ... }`). The gh-pages 404 fallback wiring is valid.
5. **`base: '/'` with gh-pages hosting** — correct: `scripts/prepare-web-deploy.js` writes a `CNAME` containing `formedible.dev` into `apps/web/dist/client` before `gh-pages` deploy, so the site is served from the domain root, not a `/Formedible/` sub-path. An absolute base would only be wrong for project-path hosting without a custom domain.
6. **Scroll restoration vs inner scroll container** — `body` is `overflow-hidden` and scrolling happens in `#main-content`, but TanStack Router's scroll restoration (router-core 1.168.17) tracks scroll events on any element via a capture-phase document listener and restores by CSS selector, so `scrollRestoration: true` works with this shell design.
7. **Route wiring** — `routeTree.gen.ts` includes `/404` and all routes; all landing-page imports (`hero-examples`, `install-command`, `site-footer`) and all `PublicRoutePath` links resolve to existing route files; `apps/web/src` itself type-checks clean (all `tsc` errors originate in `packages/ui`, i.e. the known issue).

## Summary

- CRITICAL: 0
- HIGH: 0
- MEDIUM: 1 (header raw-anchor navigation)
