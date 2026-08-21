# Review Report — Cluster 10 (Sync engine & registry manifests)

Reviewer scope: `scripts/quick-sync.js`, `scripts/validate-sync-boundaries.js`, `scripts/build-registries.js`, `scripts/validate-public-registries.js`, `tests/sync/copy-only-sync.test.ts`, the five `registry.json` manifests, and the three `sync.config.json` files.

Verified-clean before flagging (so the findings below are against a known-good baseline):
- All 92 registry-listed source files exist on disk in their owning packages.
- All 92 `packages/ui/src/components/formedible/**` copies are byte-identical to `owning source + alias rewrite` (sync is current, not stale).
- Every `@/...` import in every registry-listed file resolves to an existing file under `packages/ui/src` after applying the rewrite rules (no dangling install-surface imports).
- `registryDependencies` match actual imports: formedible-core's list (`badge button checkbox command field input popover radio-group select slider switch textarea`) is exactly the set of `@/components/ui/*` imports in `packages/formedible/src`; builder's `button` and ai-builder's `button input select textarea scroll-area` are covered via the core dependency; `scroll-area` is genuinely imported by ai-builder.
- `validate-public-registries.js` passes; `validate-sync-boundaries.js` fails only on the pre-declared KNOWN issue (`packages/ai-builder/src/components/formedible/ai/ai-builder.tsx:5`), which is excluded from this report per instructions. The stale parser→builder/ai-builder route in `packages/formedible-parser/sync.config.json` is also KNOWN and excluded.
- `packages/ui/package.json` exports patterns don't cover `.ts` files under `formedible/builder|ai` (e.g. `field-store.ts`, `index.ts`), but apps/web resolves `@formedible/ui/*` via `tsconfigPaths` in Vite and the package is private, so nothing consumes those exports — not flagged.

---

### [SEVERITY: HIGH] Finding 1: Alias-rewrite regex corrupts non-import string content — synced builder generates code with a broken import
**File**: scripts/quick-sync.js:219 (corruption site: packages/ui/src/components/formedible/lib/code-generation.ts:265, originating from packages/builder/src/lib/formedible/code-generation.ts:265)
**Problem**: `rewriteModuleSpecifiers` rewrites any `from '@/...'` occurrence via a plain regex over the raw text. It cannot distinguish an import/export module specifier from the same characters appearing inside a string or template literal. The builder's code generator embeds a sample import in a template literal, and the rewrite silently rewrites that embedded sample too.
**Evidence**: Owning source (`packages/builder/src/lib/formedible/code-generation.ts:265`):
```ts
const fullCode = `import { z } from 'zod';\n\nimport { useFormedible } from '@/components/formedible/hooks/use-formedible';\n\n...`
```
Synced copy (`packages/ui/src/components/formedible/lib/code-generation.ts:265`):
```ts
const fullCode = `import { z } from 'zod';\n\nimport { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';\n\n...`
```
The published payload (`packages/builder/public/r/form-builder.json`) still embeds the correct `'@/components/formedible/hooks/use-formedible'`, proving the two install surfaces of the same block now diverge.
**Impact**: `fullCode` is user-facing output — `packages/ui/src/components/formedible/builder/code-generator.tsx:5,16` calls `generateFormCode`, and the hosted builder (`apps/web/src/routes/builder.tsx` imports `@formedible/ui/components/formedible/builder`) shows this code for users to copy into their own app. Users of the hosted builder get generated code with `@formedible/ui/components/formedible/hooks/use-formedible` — a private workspace path (packages/ui is `"private": true`, unpublished) that does not exist in any consumer app, so the pasted code fails to compile. It also violates the sync contract ("copy-only except alias specifiers"): a template literal is not a module specifier, and `shadcn add` (AST-based transform) would never rewrite it, so quick-sync's output is no longer "the exact local paths/content `shadcn add` would install". `generateAiFormCode` in ai-builder flows through the same lib, so AI-generated form code from the ui surface is affected identically.
**Suggestion**: Rewrite specifiers via AST instead of regex — the repo already parses with the TypeScript compiler in `validate-sync-boundaries.js` (`ts.isImportDeclaration` / `ts.isExportDeclaration` + `node.moduleSpecifier`); use the same approach to compute exact specifier replacement ranges, or at minimum require that the matched quote is preceded (ignoring whitespace) by `import`/`export`/`from` token boundaries and skip matches inside template/string literals. Add a fixture covering this case (see Finding 3).

### [SEVERITY: MEDIUM] Finding 2: ai-picker authored source hard-codes the destination alias `@formedible/ui/*`, breaking the ownership model and making the ai-picker registry unpublishable
**File**: packages/ai-picker/src/components/ai-picker/ai-picker-popover.tsx:3-5 (also ai-picker-panel.tsx:5-8, ai-picker.tsx:5, model-autocomplete-field.tsx:5-7)
**Problem**: The sync contract is that owning sources use portable `@/...` aliases and only quick-sync rewrites them to `@formedible/ui/...` for the packages/ui install surface (quick-sync.js:139-172 encodes exactly this, including dedicated `@/components/ai-picker/` and `@/lib/ai-picker-*` rules). The ai-picker components instead hard-code the destination specifier in authored source:
```ts
import { Button } from '@formedible/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@formedible/ui/components/popover';
import { cn } from '@formedible/ui/lib/utils';
```
These pass through sync untouched (the rewrite only matches `@/...`), which happens to work in-repo, but the package is left internally inconsistent — the same files mix portable (`from '@/lib/ai-picker-types'`) and non-portable specifiers, so this is drift, not design. Every other owner package has zero `@formedible/ui` imports in authored source (ai-builder's single occurrence is the KNOWN issue).
**Impact**: (a) `packages/ai-picker/registry.json` is a full shadcn manifest (public `formedible.dev` registryDependencies, `popover` dep, `build:registry -> shadcn build` script in package.json), yet its payload would embed `@formedible/ui/components/popover` etc., which `shadcn add` cannot resolve or rewrite in a consumer app — the block can never be published as authored. (b) It silently escapes enforcement: `validate-sync-boundaries.js` has no scope for `packages/ai-picker/src`, and the packages/ui install-surface check (`validateUiInstallSurfaceImport`) doesn't match `@formedible/ui/components/popover` (it only flags `@ui/` and `/formedible/ui/` substrings), so nothing catches the divergence. (c) If the packages/ui alias ever changes, owning-source files break directly instead of via the single sync transform.
**Suggestion**: In the four ai-picker component files, change `@formedible/ui/components/{button,input,popover,select}` → `@/components/ui/{...}` and `@formedible/ui/lib/utils` → `@/lib/utils` (the existing rewrite rules already map these correctly for the ui surface, and ai-picker's tsconfig alias `@/` resolves in-package), then re-run sync. Optionally add `packages/ai-picker/src` to `validate-sync-boundaries.js` validationScopes with `validatePackageWorkspaceImport` so owning sources can't regress.

### [SEVERITY: MEDIUM] Finding 3: Sync contract test misses the forbidden non-specifier transform — no fixture proves strings/comments survive alias rewriting
**File**: tests/sync/copy-only-sync.test.ts:75-130
**Problem**: The copy-only test (lines 27-73) does assert exact content equality, but only for a route with no rewriting. The alias-rewrite test ("rewrites package install-surface imports like shadcn resolves aliases") asserts only positive rewrites (specific specifiers changed, `@/` forms gone) — it never asserts that non-import content is untouched. So the one forbidden transform class the contract actually forbids ("must never rewrite other content" beyond alias specifiers — e.g. `from '@/...'` occurring inside a template literal, string, or comment) has zero coverage, which is exactly why Finding 1 shipped undetected.
**Evidence**: Test fixture (lines 79-89) contains only real import statements; there is no line like `const sample = "import { x } from '@/lib/utils'";`, and no assertion of overall equality against `sourceContent` modulo specifiers.
**Impact**: The regression that corrupts builder-generated code (Finding 1) passes this suite today; any future regex tweak can silently corrupt string content with a green test run.
**Suggestion**: Add to the rewrite fixture a string/template literal containing `from '@/lib/utils'` and `from '@/components/formedible/hooks/use-formedible'` (mirroring the real code-generation.ts:265 shape), and assert those substrings remain byte-identical in the ui copy, alongside the existing positive assertions.

### [SEVERITY: MEDIUM] Finding 4: build-registries.js spawns `pnpm` without a shell — fails on Windows
**File**: scripts/build-registries.js:42-46
**Problem**: `spawn('pnpm', ['--dir', packageRoot, 'build:registry'], { stdio: 'inherit', shell: false })`. On Windows, `pnpm` is a `.cmd` shim (corepack/npm-global), and Node ≥ 18.20/20.12 deliberately rejects spawning `.cmd`/`.bat` files without `shell: true` (CVE-2024-27980 mitigation); older Node fails with ENOENT because `.cmd` isn't on the PATHEXT resolution path for `spawn` without shell.
**Evidence**:
```js
const childProcess = spawn('pnpm', ['--dir', packageRoot, 'build:registry'], {
  cwd: rootDirectory,
  stdio: 'inherit',
  shell: false,
});
```
The explicit `shell: false` forecloses the usual fix, and the error surfaces only at runtime per package (`Failed to start registry build for ...`), after `removeStaleGeneratedRegistryJson` has already deleted the previous `public/r/*.json` for that package — so a Windows run leaves a package with its published payloads removed and no rebuild.
**Impact**: Registry builds are impossible on Windows dev machines (repo targets cross-platform pnpm workspaces), with the added hazard of deleting existing `public/r` output before the doomed build starts.
**Suggestion**: Use `shell: process.platform === 'win32'` (and drop the hard `false`), or resolve the executable cross-platform. Optionally reorder so `removeStaleGeneratedRegistryJson` runs only after the replacement build succeeds, or restore on failure.

### [SEVERITY: MEDIUM] Finding 5: quick-sync performs no containment check on registry targets — `..` in a target writes outside `packages/ui/src/components`
**File**: scripts/quick-sync.js:105-119 (resolveSyncTargetPath) and 294-299 (join + write)
**Problem**: `resolveSyncTargetPath` strips the `@ui/` prefix and returns the remainder verbatim; `copyRegistryFiles` then does `join(destinationRoot, resolveSyncTargetPath(...))` and writes. `join` normalizes `..` segments, so a target such as `@ui/../../formedible/src/lib/x.ts` writes to `packages/formedible/src/lib/x.ts` — outside the destination root — with `copied += 1` and no warning. The same applies to the non-`@` fallback branch (`targetPath` returned as-is). There is no check that the resolved path stays under the destination root.
**Evidence**:
```js
if (useRegistryTargets && targetPath.startsWith('@ui/')) {
  return targetPath.slice('@ui/'.length);   // '../../...' passes through
}
...
const targetPath = join(resolveFromRoot(rootDirectory, destinationRoot), resolveSyncTargetPath(...));
await mkdir(dirname(targetPath), { recursive: true });
...
await writeFile(targetPath, syncedContent);
```
**Impact**: Low exploitability today (registry.json files are repo-controlled, and current manifests are clean — verified all 92 targets land inside `packages/ui/src/components/formedible/`), but a malicious or fat-fingered manifest entry silently overwrites owning-source files — the exact files sync is supposed to treat as read-only truth — or anything else under the repo. This is a defense-in-depth gap on the write path, not a live breakage.
**Suggestion**: After resolving, assert `resolve(targetPath).startsWith(resolve(destinationRoot) + sep)` (throw or warn-and-skip otherwise), for both the `@ui/` strip and the fallback branch.

---

## Explicitly checked, NOT flagged
- `packages/formedible/registry.json` shipping `src/lib/utils.ts` to `@ui/formedible/lib/utils.ts` while sync rewrites `@/lib/utils` to the separate `@formedible/ui/lib/utils` alias: intentional self-containment; both files exist and resolve.
- Exact-order `registryDependencies` comparison in validate-public-registries.js: intentional manifest locking.
- `src/index.ts` skip logic in quick-sync.js:282: no currently-configured route hits the deprecated branch.
- Dead helper `isExactOrSubpath` in validate-sync-boundaries.js:115: trivial/dead code, not behavior.
- `validatePublicTargets` unreachable sub-checks (`target.startsWith('components/formedible/')` can't be true after the `@ui/formedible/` requirement): harmless redundancy.
- `rewriteWebSpecifier` (apps/web destination): no configured route currently targets `apps/web/src`; same string-literal weakness as Finding 1 applies if revived, but no live corruption.
