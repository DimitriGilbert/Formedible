# Verified Report — Cluster 12 (review-report-12)

Verification agent: re-checked every finding against actual source, node_modules layout, real `tsc --noEmit` runs in packages/ui and apps/web, real Node `import()` resolution of the exports map, and repo-wide greps. All commands executed on branch `re-codex` at the current working tree.

Result: **3 confirmed, 0 dismissed.**

---

### Finding 1: packages/ui missing `react-markdown`, `rehype-highlight`, `remark-gfm` — CONFIRMED
**Original**: Synced ai copy `markdown-message.tsx` imports three markdown libs not declared in packages/ui/package.json and not resolvable from packages/ui; fixing only the known @tanstack/ai* gap will not fix check-types or the web build.
**Verification**: Every claim reproduced:
- `packages/ui/src/components/formedible/ai/markdown-message.tsx` lines 5-8 import `react-markdown`, `rehype-highlight`, `remark-gfm` (plus `type Components` from react-markdown). `packages/ui/package.json` dependencies (lines 26-39) do not declare any of them.
- Resolution is genuinely broken, not hoisting-masked: `packages/ui/node_modules` does not contain them (only @base-ui, cva, clsx, @formedible, lucide-react, next-themes, react, react-dom, shadcn, sonner, tailwind*, @tanstack, tw-animate-css, @types, typescript), and the workspace root `node_modules` does not contain them either.
- `cd packages/ui && tsc --noEmit` exits 2. The complete set of unresolved modules is exactly: `react-markdown`, `rehype-highlight`, `remark-gfm`, `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openai`, `@tanstack/ai-openrouter` (21 total errors incl. cascading TS7031 in markdown-message.tsx). This directly validates the reporter's core claim: fixing only the @tanstack/ai* set leaves 3 modules unresolved and check-types stays red.
- `cd apps/web && tsc --noEmit` exits 2 with the same TS2307 errors against `../../packages/ui/src/components/formedible/ai/markdown-message.tsx` — confirming web's own node_modules do not help files living under packages/ui/src (pnpm isolated layout resolves from the importing file's package upward).
- The source package declares all of them: `packages/ai-builder/package.json` has `react-markdown: ^10.1.0`, `rehype-highlight: ^7.0.2`, `remark-gfm: ^4.0.1` — so the suggested fix versions match what already exists in the monorepo.

### Finding 2: exports map cannot resolve `./components/formedible/builder/field-store` (.ts vs .tsx) and the `ai`/`builder` barrels — CONFIRMED
**Original**: The catch-all `"./components/formedible/*": "./src/components/formedible/*.tsx"` maps field-store to a non-existent `.tsx`, and the `ai`/`builder` index barrels have no entries; masked in-repo by tsconfig paths.
**Verification**: Every claim reproduced with real Node runs from packages/ui (Node v24.19.0, self-reference through the exports map):
- `import('@formedible/ui/components/formedible/builder/field-store')` → `ERR_MODULE_NOT_FOUND: Cannot find module '.../packages/ui/src/components/formedible/builder/field-store.tsx'`. The file on disk is `field-store.ts` (6780 bytes, no `.tsx` sibling). Exactly as reported.
- `import('@formedible/ui/components/formedible/ai')` → resolves to non-existent `ai.tsx` (real file: `ai/index.ts`); `.../builder` → non-existent `builder.tsx` (real file: `builder/index.ts`). Both barrels lack exact entries, unlike `./components/formedible/ai-picker` which has one.
- Control proving the mechanism is the extension, not the map: `@formedible/ui/components/formedible/ai-picker` resolves successfully (fails only at Node's inability to *execute* `.tsx`, `ERR_UNKNOWN_FILE_EXTENSION` — resolution succeeded, file found), and `builder/form-builder` resolves to the existing `form-builder.tsx`; only its internal `field-store` import then dies.
- Importers of the broken specifier: exactly the four claimed self-imports in packages/ui/src — `builder/default-tabs.tsx:7`, `builder/field-configurator.tsx:6`, `builder/form-builder.tsx:6`, `builder/index.ts:5`. No external package imports field-store directly.
- Masking verified: packages/ui tsconfig has `paths: {"@formedible/ui/*": ["./src/*"]}` and apps/web tsconfig has `"@formedible/ui/*": ["../../packages/ui/src/*"]`, both of which bypass the exports map in tsc; `apps/web/vite.config.ts:12` sets `tsconfigPaths: true` so Vite also bypasses it. The two in-repo exports-resolving consumers (ai-builder and ai-picker — their tsconfigs have no `@formedible/ui` paths; base config uses `moduleResolution: "bundler"` which honors exports) touch only the healthy surface: ai-builder imports just `@formedible/ui/components/formedible/ai-picker` (exact entry), ai-picker imports `components/button|input|popover|select` and `lib/utils` (all map to existing files). Meanwhile apps/web does import `@formedible/ui/components/formedible/builder/form-builder` and `ai/ai-builder` — currently saved only by tsconfig paths.
- Not a false positive from "private package can rely on hoisting": the exports map exists and is the only resolution path for ai-builder/ai-picker (proven above), and the broken subpaths are real files with real in-package importers. Latent, not hypothetical, for any standard-resolution consumer. MEDIUM severity is appropriate.

### Finding 3: `@formedible/env` validates nothing, imported nowhere, yet declared as dep of apps/web and root — CONFIRMED
**Original**: Empty t3-env schema (no server block, empty client/runtimeEnvStrict), zero importers, dead dependency edges.
**Verification**:
- `packages/env/src/web.ts` in full: `createEnv({ client: {}, clientPrefix: 'VITE_', emptyStringAsUndefined: true, runtimeEnvStrict: {} })` — no `server` block, empty `client`, empty `runtimeEnvStrict`. Validates zero variables. (It is the package's only source file.)
- Repo-wide grep for `@formedible/env` (excluding node_modules/.turbo/.git) finds only: `apps/web/package.json:15` and root `package.json:45` (the declared deps), `packages/env/package.json:2` (its own name), `pnpm-lock.yaml` entries, and a README table row. Zero code imports of `@formedible/env/web` anywhere (apps, packages, scripts, tests, config files).
- apps/web reads only Vite builtins (`import.meta.env.DEV` at `src/routes/__root.tsx:16`) — no env var is validated anywhere.
- LOW severity is correct: no runtime breakage today; hazard is silent non-validation plus misleading dead workspace deps.

---

## Notes on the "checked and found NOT problematic" section
Spot-checked and consistent with the report: packages/ui exports ordering (exact entries before patterns), the ai-picker exact entry at `package.json:17`, and the root/apps/web dependency declarations. No corrections needed.

## Summary
3 confirmed, 0 dismissed.
