# Verified Report — Cluster 13 (Web docs app shell/routing/theming)

Verification of `/home/didi/workspace/Formedible/.review/session-20260819/review-report-13.md` against actual source on branch `re-codex`. No repo files were modified.

---

### Finding 1: Primary navigation uses raw `<a>` anchors, causing full page reloads instead of client-side routing — CONFIRMED

**Original**: header.tsx renders plain `<a href={item.href}>` for all six internal nav routes in both desktop (lines 42-55) and mobile (lines 63-77) navs, despite `Link` being imported and used for the logo. Every nav click triggers a full document reload instead of a TanStack Router client-side transition; route-chunk preloading and scroll restoration are bypassed. MEDIUM severity.

**Verification**: Every claim in the finding checks out against source:

1. **Raw anchors exist exactly as cited.** `/home/didi/workspace/Formedible/apps/web/src/components/header.tsx` line 1 imports `Link` from `@tanstack/react-router`; lines 23-35 use `<Link to="/">` for the logo; lines 42-55 (desktop) and 63-77 (mobile) render `<a key={item.id} href={item.href} ...>` for `siteNavigation` items.

2. **All six hrefs are internal SPA routes, so full reloads actually happen.** `apps/web/src/features/docs/navigation.ts` defines hrefs `/`, `/docs`, `/docs/examples`, `/docs/fields`, `/builder`, `/ai-builder` — all plain paths, no hashes, no externals. Each resolves to an existing route file: `routes/index.tsx`, `routes/docs/index.tsx`, `routes/docs/examples.tsx`, `routes/docs/fields.tsx`, `routes/builder.tsx`, `routes/ai-builder.tsx`. Since these are SPA routes, a raw anchor performs a full document navigation.

3. **No guard converts anchor clicks to SPA navigation.** Grep for `addEventListener.*click` / `onClickCapture` across `apps/web/src` returns nothing; TanStack Router does not intercept plain `<a>` elements. The only other raw anchor in the shell is the `#main-content` skip link in `__root.tsx:43-48`, which is a legitimate same-page hash target, not navigation.

4. **Rest of the app does use TanStack `Link` for the same destinations.** `routes/index.tsx:1`, `routes/docs/index.tsx:1`, `routes/builder.tsx:1`, `routes/ai-builder.tsx:1`, and `components/docs/home-landing.tsx:1` all import `Link` from `@tanstack/react-router` and use it for internal navigation (e.g. home-landing.tsx:129 `<Link to="/docs/getting-started">`). Minor overstatement in the original evidence — a few non-header surfaces also mix in raw anchors (`home-landing.tsx:136-141, 173-180, 200-206, 214-220`; `components/docs/docs-card.tsx:10-11`; `components/docs/guide-page.tsx:130, 244`). This broadens the issue rather than refuting it; the header finding stands on its own.

5. **Regression vs. `main`, not intentional.** `git show main:apps/web/src/components/header.tsx` shows the pre-rewrite header used `import Link from "next/link"` and rendered `<Link href={to}>` for the same nav items (Home, Documentation, Form Builder, AI Builder) with `usePathname`-based active state. Framework client-side links were the established pattern; the rewrite downgraded to raw anchors.

6. **Not an SEO/design justification.** TanStack `<Link>` renders a real `<a href>` in the prerendered HTML, so crawlability is identical; vite.config.ts prerender uses `crawlLinks: true` which follows hrefs either way. Nothing in the code or commit trail suggests the raw anchors are deliberate.

7. **Supporting details verified.**
   - Router config bypassed by the anchors: `router.tsx:11-12` sets `scrollRestoration: true` and `defaultPreloadStaleTime: 0` — both moot for header-nav clicks doing full reloads.
   - The 909 kB chunk claim is exact: `apps/web/dist/client/assets/index-CHQ27MYQ.js` is 909,042 bytes.
   - Functional correctness preserved (hence MEDIUM, not HIGH): `vite.config.ts:17-21` enables prerendering (`enabled: true, crawlLinks: true, failOnError: true`) plus the `/404` page entry, so all nav URLs resolve as prerendered pages.

**Suggested fix stands**: replace both `<a href={item.href}>` loops in header.tsx with `<Link to={item.href}>` — the hrefs are plain paths so it is a drop-in replacement; `useLocation`-based active state can remain or switch to `activeOptions`.

---

## Notes on the "verified non-issues" section

The reviewer's non-issue list contains no findings to verify; spot-checks of its falsifiable claims pass: installed versions match (`vite@8.0.10`, `next-themes@0.4.6`, `react@19.2.5` in `node_modules/.pnpm`), and `resolve: { tsconfigPaths: true }` / prerender-pages schema claims are consistent with those versions. Nothing in the non-issue list contradicts Finding 1.

## Summary

- Findings verified: 1 of 1 CONFIRMED, 0 DISMISSED.
- Severity assessment (MEDIUM) is appropriate: degraded UX/performance on the primary nav, but pages are prerendered so correctness is intact.
