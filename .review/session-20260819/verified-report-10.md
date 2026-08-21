# Verified Report — Cluster 10 (Sync engine & registry manifests)

Verifier method: read every cited file:line in the actual sources, re-derived the rewrite regex on synthetic cases in /tmp, ran the real `quick-sync.js` script against a /tmp fixture to prove path escape, and ran `pnpm run test:sync` against the live repo. Branch: `re-codex`.

Sanction check (applies to Findings 1 and 3): `tests/architecture/copy-only-sync-contract.test.ts:109-140` explicitly ALLOWS passing copied content through `rewriteModuleSpecifiers` ("allows sample sync that rewrites registry aliases before writing"), and `tests/sync/copy-only-sync.test.ts:75` names the behavior "rewrites package install-surface imports **like shadcn resolves aliases**". So the alias transform itself is sanctioned design (AST-scoped, import-specifiers-only, matching what `shadcn add` does); only its overreach beyond module specifiers is a bug. FROM-SCRATCH-2.md §"Sync Model" (lines 86-118) says sync "must not rewrite imports / rewrite source content", but the doc's route list describes the older multi-destination model; the operative, enforced contract is the test suite, which sanctions the specifier-only rewrite. Both findings below correctly target only the overreach, not the transform.

---

### Finding 1: Alias-rewrite regex corrupts non-import string content — CONFIRMED
**Original**: `rewriteModuleSpecifiers` (scripts/quick-sync.js:219) rewrites any `from '@/...'` via plain regex over raw text, including inside string/template literals; the builder's code generator embeds a sample import in a template literal that gets silently rewritten in the packages/ui copy, so the hosted builder emits code importing an unpublished private package path.

**Verification**:
1. **Regex re-derived** (extracted verbatim from quick-sync.js:139-222, run in /tmp): the pattern `/(from\s+['"]|import\s*\(\s*['"]|export\s+[^;]*?from\s+['"])(@\/[^'"]+)(['"])/g` matches `from '@/...'` wherever it appears. Synthetic case mirroring line 265 (`const fullCode = \`import { useFormedible } from '@/components/formedible/hooks/use-formedible';...\`;`) produced `'@formedible/ui/components/formedible/hooks/use-formedible'` inside the template literal. A second synthetic case shows the same corruption inside plain strings and comments.
2. **Live instance confirmed by diff**: owning source `packages/builder/src/lib/formedible/code-generation.ts:265` contains the template literal with `'@/components/formedible/hooks/use-formedible'`; the synced copy `packages/ui/src/components/formedible/lib/code-generation.ts:265` contains `'@formedible/ui/components/formedible/hooks/use-formedible'`. The full-file diff shows ONLY the rewrite sites differ (imports at lines 7-9 plus line 265), proving the corruption is produced by the sync rewrite, not stale content. `packages/builder/registry.json:83-85` lists `src/lib/formedible/code-generation.ts` → `@ui/formedible/lib/code-generation.ts`, so this file provably flows through quick-sync.
3. **User-facing impact chain verified end to end**: `apps/web/src/routes/builder.tsx:3` imports `FormBuilder` from `@formedible/ui/components/formedible/builder/form-builder` → `form-builder.tsx:7` imports `defaultTabs` → `default-tabs.tsx:4,119` imports and renders `<CodeGenerator/>` → `code-generator.tsx:5,16` calls `generateFormCode` from the corrupted lib. `packages/ui/package.json:4` is `"private": true` (never published), so the emitted import cannot resolve in any consumer app; pasted code fails to compile.
4. **Surface divergence verified**: `packages/builder/public/r/form-builder.json` still embeds the correct `from '@/components/formedible/hooks/use-formedible'` (3 occurrences), so the registry payload and the packages/ui install surface of the same block now disagree — exactly what "sync emulates shadcn add" must not allow.
5. **Sanction check**: the finding does not contest the sanctioned alias transform, only its overreach past module specifiers — correctly scoped. (An AST-based fix is feasible: `scripts/validate-sync-boundaries.js:60-91` already uses `ts.isImportDeclaration`/`ts.isExportDeclaration` + `node.moduleSpecifier` in this repo.)

**One sub-claim corrected**: the review states "`generateAiFormCode` in ai-builder flows through the same lib, so AI-generated form code from the ui surface is affected identically." False: `generateAiFormCode` (`packages/ui/src/components/formedible/ai/chat-interface.tsx:50`) has no import of `code-generation`/`generateFormCode`, and grep across `packages/ui/src/components/formedible/ai/` and `packages/ai-builder/src/` finds zero references. The only runtime consumer of the corrupted output is the builder's `CodeGenerator`. This does not change severity — the confirmed HIGH core (hosted builder emits broken code to end users) stands.

---

### Finding 2: ai-picker authored source hard-codes the destination alias `@formedible/ui/*` — CONFIRMED
**Original**: Four ai-picker component files hard-code `@formedible/ui/components/{button,input,popover,select}` and `@formedible/ui/lib/utils` in owning source, violating the portable-`@/`-alias ownership model, leaving files internally inconsistent, making the ai-picker registry unpublishable as authored, and escaping all enforcement.

**Verification**:
1. **Literals confirmed** at exactly the cited locations: `packages/ai-picker/src/components/ai-picker/ai-picker-popover.tsx:3-5`, `ai-picker-panel.tsx:5-8`, `ai-picker.tsx:5`, `model-autocomplete-field.tsx:5-7` (12 import lines total).
2. **Drift, not design — three independent proofs**:
   - The same files mix portable specifiers (`'@/components/ai-picker/ai-picker-panel'`, `'@/lib/ai-picker-types'`, `'@/lib/default-picker-schema'` at ai-picker-popover.tsx:7-9 and ai-picker-panel.tsx:10-12), so the files are internally inconsistent.
   - `scripts/quick-sync.js:163-168` contains dedicated ai-picker portable-alias rules (`@/components/ai-picker/` → `${uiAlias}/formedible/ai-picker/components/`, `@/lib/ai-picker-*` → `.../ai-picker/lib/`), which only make sense if authored source is expected to use `@/`.
   - Every sibling owner vendors primitives under `src/components/ui/` (verified for packages/formedible, packages/builder, packages/ai-builder) and uses `@/components/ui/*`; grep confirms the only other `@formedible/ui` occurrence in any owner's authored src is the pre-declared KNOWN issue (`packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:5`). ai-picker is the sole outlier and instead declares `"@formedible/ui": "workspace:*"` (package.json:14) with no `src/components/ui` directory at all.
   - `packages/ai-picker/registry.json` declares `"registryDependencies": ["https://formedible.dev/r/formedible-core.json", "popover"]` — the `popover` dep is only meaningful if the files import `@/components/ui/popover`, directly contradicting the hard-coded `@formedible/ui/components/popover`.
3. **Enforcement escape confirmed**: `scripts/validate-sync-boundaries.js:12-38` (`validationScopes`) has no scope for `packages/ai-picker/src` — the check that would fire (`validatePackageWorkspaceImport`, line 127-133, flags any `@formedible/ui` import) is bound only to builder/ai-builder/formedible-parser. And `validateUiInstallSurfaceImport` (lines 135-145) matches only `@ui/` prefixes and `/formedible/ui/` substrings/ends-with — `@formedible/ui/components/popover` matches neither (the character before `formedible` is `@`, not `/`).
4. **Caveats (do not overturn the finding)**: ai-picker is not in `build-registries.js` `publicRegistryPackages` (only formedible, formedible-parser, builder, ai-builder) and the package is `"private": true`, so "unpublishable as authored" is latent rather than a live pipeline failure. Also, the review's suggested fix (plain swap to `@/components/ui/...`) requires first vendoring primitives or extending ai-picker's tsconfig paths — `packages/ai-picker/src` has no `components/ui/` and `@/*` maps to `./src/*`, so a bare swap would break `check-types` for that package. The ownership-model violation and zero-enforcement facts are fully confirmed; MEDIUM severity is fair.

---

### Finding 3: Sync contract test misses the forbidden non-specifier transform — CONFIRMED
**Original**: No fixture proves that non-import content (strings, template literals, comments) survives alias rewriting, which is why Finding 1 shipped undetected with a green suite.

**Verification**:
1. `tests/sync/copy-only-sync.test.ts:79-89`: the alias-rewrite fixture contains only real import statements and export lines — no line embeds `from '@/...'` inside a string/template/comment. Assertions at lines 120-126 check only positive rewrites plus `includes(...) === false` for two specific `@/` specifiers. The exact-content-equality test (lines 27-73) runs on a route with no rewriting at all (destinations `apps/docs/src`/`packages/consumer/src` hit the pass-through branch of `syncContentForDestination`, quick-sync.js:265).
2. `tests/architecture/copy-only-sync-contract.test.ts:6-16`: `forbiddenSyncPatterns` guard generated headers, assembled writeFile content, `.js` suffixes, replacement entries, and the obsolete lib mirror — nothing constrains the alias rewrite to module specifiers.
3. **Empirical proof**: ran `pnpm run test:sync` on the live repo — all 4 quick-sync tests PASS (`tests 4, pass 4, fail 0`) while the Finding-1 corruption is present in `packages/ui/src/components/formedible/lib/code-generation.ts:265`. (The only failure in the command is `validate-sync-boundaries.js` flagging the pre-declared KNOWN issue at ai-builder.tsx:5, matching the review baseline.) The gap claim is demonstrated, not just inferred.

---

### Finding 4: build-registries.js spawns `pnpm` with `shell: false` — fails on Windows — CONFIRMED (with realism caveat)
**Original**: `spawn('pnpm', ['--dir', packageRoot, 'build:registry'], { stdio: 'inherit', shell: false })` cannot launch pnpm's `.cmd` shim on Windows (Node ≥ 18.20/20.12 rejects `.cmd` without a shell per CVE-2024-27980; older Node gets ENOENT), and stale `public/r/*.json` are deleted before the doomed build starts.

**Verification**:
1. Code confirmed verbatim at `scripts/build-registries.js:42-46`, including the explicit `shell: false`.
2. The Node/Windows mechanics are accurate: pnpm on Windows installs as `pnpm.cmd`; `spawn` without `shell: true` either throws EINVAL (post-CVE-2024-27980 hardening) or ENOENT.
3. The aggravator is real: `buildRegistries` (lines 67-70) awaits `removeStaleGeneratedRegistryJson` BEFORE `runPackageRegistryBuild` per package, so a spawn failure leaves that package's published payloads deleted with no rebuild, and the error only surfaces via the `Failed to start registry build for ...` rejection (line 49).
4. **Realism caveat (severity, not validity)**: the repo makes no Windows accommodations anywhere — sibling scripts use the identical pattern (`deploy-gh-pages.js:46-48` and `build-release.js:246-248` both spawn `pnpm`/commands with `shell: false`), and `create-release-assets.js:185` spawns `zip`, a Unix-only tool. The toolchain de facto assumes a Unix dev environment, and nothing in the repo promises Windows support, so the review's "repo targets cross-platform pnpm workspaces" is weakly supported. The code-level defect is real and the suggested fix (`shell: process.platform === 'win32'`) is correct and harmless; practical severity is arguably LOW given no Windows usage is evidenced.

---

### Finding 5: No containment check on registry targets — `..` writes outside the destination root — CONFIRMED
**Original**: `resolveSyncTargetPath` returns the `@ui/`-stripped target verbatim; `join` normalizes `..` segments, so a manifest target with `..` writes outside `packages/ui/src/components` silently. Low exploitability (repo-controlled manifests, currently clean) — a defense-in-depth gap.

**Verification**:
1. Code confirmed: `scripts/quick-sync.js:105-119` (`resolveSyncTargetPath` strips `@ui/` and returns the remainder unchecked; the non-`@` fallback at 110-112 likewise) and `quick-sync.js:294-299` (`join(destinationRoot, ...)`, `mkdir`, `writeFile`, `copied += 1` — no containment assertion anywhere in the file).
2. **Live proof with the real script**: built a /tmp fixture with registry target `@ui/../../../victim/escaped.ts` and ran `node scripts/quick-sync.js --root ... --config ...`. Result: file written to `packages/victim/escaped.ts`, far outside `packages/ui/src/components`, exit code 0, no warning. The escape is mechanically real.
3. **Realism**: all current manifests are clean — grep over the five `registry.json` files finds zero targets containing `..` (target counts 45+3+13+23+8 = 92, matching the review's baseline), and manifests are repo-controlled, so exploitation requires an already-malicious commit. The review itself frames this honestly as "defense-in-depth gap on the write path, not a live breakage" — confirmed as such; the suggested `resolve(targetPath).startsWith(resolve(destinationRoot) + sep)` guard is correct for both branches.

---

## Summary

All five findings confirmed; none dismissed. One sub-claim inside Finding 1 corrected (AI codegen does NOT flow through the corrupted lib — the hosted builder's `CodeGenerator` is the sole consumer), and two severity caveats noted (Finding 4: repo de facto assumes Unix; Finding 2: publishability impact is latent since ai-picker is private and outside `build-registries.js`'s package list).
