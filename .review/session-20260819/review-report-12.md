# Review Report — Cluster 12 (Workspace orchestration & env + consumer package surface)

Reviewer scope: root package.json, pnpm-workspace.yaml, turbo.json, packages/config/*, packages/env/*, packages/ui/*, packages/formedible/package.json, packages/formedible/components.json.

Verification performed: ran `tsc --noEmit` in packages/ui (fails), packages/ai-picker (passes), packages/ai-builder (passes), packages/env (passes), apps/web (fails); resolved every `@formedible/ui/*` import in apps/web, packages/ai-builder, packages/ai-picker, and all internal self-imports in packages/ui/src against the ui exports map; exercised the exports map with real Node `import()` calls; inspected node_modules layout and scripts (quick-sync.js, build-release.js, create-release-assets.js).

Known issue (not re-reported): packages/ui missing `@tanstack/ai*` deps for synced ai copies — already fails check-types and web build.

---

### [SEVERITY: HIGH] Finding 1: packages/ui is also missing `react-markdown`, `rehype-highlight`, and `remark-gfm` — fixing only the known @tanstack/ai* gap will not fix check-types or the web build
**File**: packages/ui/package.json:26-39 (dependencies block)
**Problem**: The synced ai-builder copy `packages/ui/src/components/formedible/ai/markdown-message.tsx` (lines 5-8) imports `react-markdown`, `rehype-highlight`, and `remark-gfm`. None of these are declared in packages/ui/package.json, and they are not resolvable from the ui package location: `packages/ui/node_modules` does not contain them, and the workspace root `node_modules` only contains the root package's own deps (`zod`, `dotenv`, `@formedible/env`) — `react-markdown`/`remark-gfm`/`rehype-highlight` exist only under `apps/web/node_modules` and `packages/ai-builder/node_modules`, which are not on the module-resolution path from `packages/ui/src/**`. This is a distinct dependency set from the known @tanstack/ai* issue; the ai-builder source package declares all of them (`packages/ai-builder/package.json` lines 19-26), but the sync destination never got the corresponding declarations.
**Evidence**:
- `cd packages/ui && tsc --noEmit` produces (independent of the @tanstack errors):
  ```
  src/components/formedible/ai/markdown-message.tsx(5,27): error TS2307: Cannot find module 'react-markdown' ...
  src/components/formedible/ai/markdown-message.tsx(6,29): error TS2307: Cannot find module 'rehype-highlight' ...
  src/components/formedible/ai/markdown-message.tsx(7,23): error TS2307: Cannot find module 'remark-gfm' ...
  ```
  plus cascading TS7031 implicit-any errors in the same file.
- `cd apps/web && tsc --noEmit` produces the same three TS2307 errors against `../../packages/ui/src/components/formedible/ai/markdown-message.tsx` — web has these packages in its own node_modules, but that does not help resolution of files living under packages/ui/src.
**Impact**: `pnpm run check-types` (turbo runs ui's `check-types`) and `pnpm run check-types:web` / `pnpm run build:web` fail even after the known @tanstack/ai* dependencies are added. Anyone fixing the documented known issue will believe they are done and still have a red matrix.
**Suggestion**: Add to packages/ui/package.json dependencies, matching the versions used by packages/ai-builder and apps/web: `react-markdown: ^10.1.0`, `rehype-highlight: ^7.0.2`, `remark-gfm: ^4.0.1` (plus the known `@tanstack/ai*` set). Longer term, quick-sync or validate-sync-boundaries.js should diff the external imports of synced files against the destination package's manifest so sync destinations cannot drift from their owner's dependency list.

---

### [SEVERITY: MEDIUM] Finding 2: `@formedible/ui` exports map cannot resolve `./components/formedible/builder/field-store` (pattern maps it to a non-existent `.tsx`), and the `ai`/`builder` index barrels are unresolvable
**File**: packages/ui/package.json:18
**Problem**: The catch-all `"./components/formedible/*": "./src/components/formedible/*.tsx"` is the only entry that matches subpaths under `formedible/builder/` and `formedible/ai/`, and it hardcodes a `.tsx` extension. Two real cases break:
1. quick-sync writes `packages/ui/src/components/formedible/builder/field-store.ts` (a `.ts` file, per `packages/builder/registry.json` target `@ui/formedible/builder/field-store.ts`), and four synced ui files import it through the package specifier `@formedible/ui/components/formedible/builder/field-store` (form-builder.tsx, field-configurator.tsx, default-tabs.tsx, builder/index.ts). The only matching export pattern substitutes to `field-store.tsx`, which does not exist.
2. The synced barrels `formedible/ai/index.ts` and `formedible/builder/index.ts` have no export entries (unlike `./components/formedible/ai-picker`, which got an exact entry), so `@formedible/ui/components/formedible/ai` and `.../builder` also substitute to non-existent `ai.tsx`/`builder.tsx`.

This is currently masked in-repo: packages/ui's own tsconfig (`paths: {"@formedible/ui/*": ["./src/*"]}`) and apps/web's tsconfig (same mapping, consumed by both tsc and Vite 8's `resolve.tsconfigPaths`) bypass the exports map entirely, and the only in-repo consumers that do resolve through the exports map (packages/ai-builder, packages/ai-picker — their tsconfigs have no `@formedible/ui` paths) happen to only touch the ai-picker surface, which has correct explicit entries.
**Evidence**:
- From any exports-resolving context (run inside packages/ui):
  ```
  await import('@formedible/ui/components/formedible/builder/field-store')
  → ERR_MODULE_NOT_FOUND: Cannot find module
    '.../packages/ui/src/components/formedible/builder/field-store.tsx'
  ```
  (the file on disk is `field-store.ts`; there is no `field-store.tsx`).
- Enumerated all 100+ internal `@formedible/ui/*` self-imports in packages/ui/src against the exports map: `./components/formedible/builder/field-store` is the only file import that maps to a missing target; the two barrel directories are the only unresolvable index imports.
**Impact**: The builder surface of `@formedible/ui` is exported-but-broken for any consumer that resolves the package normally (Node, Vite without tsconfig paths, an external/registry-host consumer). Concretely: importing `@formedible/ui/components/formedible/builder/form-builder` from packages/ai-builder or packages/ai-picker (the two in-repo packages that resolve ui via its exports map) fails at `field-store` with TS2307/ERR_MODULE_NOT_FOUND. It also breaks silently-but-fatally the moment apps/web's tsconfig paths or Vite `tsconfigPaths` are removed/changed.
**Suggestion**: Add extension-aware entries before the catch-all, e.g. `"./components/formedible/builder/field-store": "./src/components/formedible/builder/field-store.ts"`, and exact entries for the barrels (`"./components/formedible/ai": "./src/components/formedible/ai/index.ts"`, same for `.../builder`). Better: since Node/TS exports patterns cannot express optional extensions, either stop syncing `.ts`/`.tsx` mixtures into one namespace or add explicit entries generated from the synced file list (validate-sync-boundaries.js is a natural place to assert every synced file is resolvable through the exports map).

---

### [SEVERITY: LOW] Finding 3: `@formedible/env` validates nothing and is imported nowhere, yet is declared as a dependency of apps/web and the workspace root
**File**: packages/env/src/web.ts:3-8 (also apps/web/package.json:15, package.json:45)
**Problem**: The t3-env schema has an empty `client: {}`, no `server` block, and `runtimeEnvStrict: {}` — it validates zero variables. Moreover, no file in the repo imports `@formedible/env/web` (grep across apps/, packages/, tests/, scripts/ finds only the two package.json declarations). The web app reads only `import.meta.env.DEV` (a Vite builtin), so no env var is validated anywhere despite the package existing specifically for that purpose. The dependency edges are declared "both directions" (root → env, web → env) but the consumer edge is dead code.
**Evidence**: `grep -rn "@formedible/env" --include="*.ts" --include="*.tsx" ...` over apps/, packages/, tests/, scripts/ returns only `apps/web/package.json:15` and `packages/env/package.json:2` (the package's own name). packages/env `tsc --noEmit` passes because the module is a semantically valid no-op.
**Impact**: No runtime breakage today. The hazard is silent: the intended validation layer (server vs client keys, `VITE_` prefix gating) never executes, so any future `VITE_*` key added to apps/web will ship unvalidated, and the dead workspace deps mislead readers into thinking env validation is active. Also note the strict-mode trap: with `runtimeEnvStrict`, any future key added to `client` must also be added to `runtimeEnvStrict` or `createEnv` throws at import time.
**Suggestion**: Either wire it up — import `env` from `@formedible/env/web` in apps/web's entry and declare the real client keys — or remove the `@formedible/env` dependency from apps/web/package.json and the root package.json until the package has something to validate. If it stays, document that `runtimeEnvStrict` must be kept in lockstep with `client`/`server` keys.

---

## Checked and found NOT problematic (for the record)
- turbo.json: `outputs: []` overrides for formedible/builder/ai-builder/parser are correct — their `build` scripts are `tsc --noEmit` guards that emit nothing; `dist/**` correctly matches apps/web's Vite output (`apps/web/dist/client` per scripts/build-release.js). `check-types`/`lint` `^` deps don't need `^build` since no package produces consumed build artifacts (all consumers read workspace source via tsconfig paths). The `lint` task is currently dead (no package defines a lint script) but nothing invokes it.
- pnpm-workspace.yaml catalog resolves for all referenced entries (repo installs cleanly); packages/ui declaring `@base-ui/react": "^1.0.0"` as a literal instead of `catalog:` is a guideline nit with identical range, no divergence.
- packages/ui exports ordering is otherwise correct: exact entries (`use-formedible`, `advanced-field-utils`, `ai-picker`) precede the patterns that would otherwise shadow them, and every specifier currently imported by apps/web, packages/ai-builder, and packages/ai-picker resolves (verified by enumeration and by passing `tsc` runs in both consumer packages).
- packages/ui/src/lib/utils.ts, postcss.config.mjs, tsconfig setups, packages/config/tsconfig.base.json: no issues found. `./postcss.config` is an unused export referencing an undeclared plugin (`@tailwindcss/postcss`), but nothing in-repo loads it — not flagged.
- packages/formedible/components.json `src/styles/globals.css` does not exist in that package, but `shadcn build` (build:registry) only reads style/aliases from it; no failing workflow observed.
- Root `workspaces` field coexisting with pnpm-workspace.yaml is inert under pnpm 10 — harmless.

## Summary
3 findings: 1 HIGH, 1 MEDIUM, 1 LOW.
