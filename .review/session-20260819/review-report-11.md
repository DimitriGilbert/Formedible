# Cluster 11 Review — Release/deploy/alias loader scripts

Reviewer scope: `scripts/build-release.js`, `scripts/create-release-assets.js`, `scripts/deploy-gh-pages.js`, `scripts/prepare-registry-host.js`, `scripts/prepare-web-deploy.js`, `scripts/package-alias-loader.mjs`, `scripts/register-package-alias-loader.mjs`.

## Verification performed

- Read all seven files in full; traced cross-module contracts (`build-release.js` imports `createReleaseAssets`, `deployGhPages`, `prepareRegistryHost`, `prepareWebDeploy`, `validatePublicRegistries`).
- Verified all child_process usage: every `spawn` uses an args array with `shell: false` (or no shell option, defaulting to false). The only externally-influenced value reaching a command is `--release`, and it is validated against a strict `v`-prefixed semver regex (`[0-9A-Za-z-.]` identifiers only) before it is ever used in a tag name, commit message, GitHub release title, or zip filename. **No command injection vectors found.**
- Verified destructive operations: the only deletion is `cleanCurrentReleaseAssets` (`rm(..., { force: true })`, non-recursive) on filenames composed of constants + a validated semver string inside `release-assets/`. No `rm -rf` on computed paths anywhere; nothing can resolve outside the repo.
- Verified `git status --porcelain -z` parsing: the rename second-entry skip logic is correct, and because `releaseFilePaths()` returns both sides of a rename and every allowlist check is symmetric over both, the PATH1/PATH2 ordering ambiguity of porcelain renames has no functional effect.
- Verified the release allowlist covers everything the flow dirties: quick-sync's registry targets all land under `packages/ui/src/components/formedible/` (checked all five `registry.json` files), which is allowlisted; build outputs (`dist/`, `tests/**/.compiled`) are gitignored.
- Empirically confirmed `zip -rq out.zip .` includes dotfiles (`.nojekyll`, `CNAME`), so the web asset zip is not silently broken.
- Verified the alias loader end-to-end: all six `registryAliasTargets` files exist; their transitive `@/` imports resolve correctly within their own package roots; the redirect targets are genuinely absent from the local `src` trees of `ai-builder`/`ai-picker` (so the loader is required and cannot be shadowed by tsx's tsconfig-paths resolution); no `@/` specifier in the repo names a bare directory, so the extension-candidate order works today.
- Verified `gh-pages` invocation (`--dotfiles -d apps/web/dist/client` from repo root; `gh-pages` is a root devDependency).

The scripts are notably solid for dev tooling: arg-array spawns, strict input validation, symmetric allowlist enforcement, pre-asset assertions (`assertPreparedInputs` catches missing `.nojekyll`/`CNAME`/`r/*.json` before packaging). Only two real findings, both recoverable but workflow-breaking/latent:

### [SEVERITY: MEDIUM] Finding 1: Release rerun of the same version is always blocked after the version bump has been applied (no-publish preview or failed publish)
**File**: scripts/build-release.js:348 (check), scripts/build-release.js:565-566 (bump), scripts/build-release.js:616-618 (no restore)
**Problem**: `updateRootVersion` requires the new version to be strictly greater than the version currently in `package.json`, and the bump is never reverted — not in `--no-publish` mode and not when a later step of the real publish fails. Yet the rest of the script explicitly anticipates rerunning with a dirty, already-bumped `package.json` (the dirty-file guard at line 426-437 allowlists `package.json` precisely so a bumped-but-uncommitted `package.json` does not block a real publish).
**Evidence**:
```js
if (compareSemver(releaseSemver, currentSemver) <= 0) {
  throw new Error(`Release ${release} must be greater than current root package.json version ${currentVersion}.`);
}
```
combined with the failure handler's advice:
```js
console.error('\nRelease orchestrator failed. Completed steps are not rolled back automatically; fix manually and rerun the full command.');
```
Two concrete broken flows:
1. `--no-publish --release v1.2.3` (a supported combination — `parseFlags` allows it) permanently writes `version: 1.2.3` into `package.json`. The natural follow-up real publish `--release v1.2.3` then throws at `updateRootVersion` because `1.2.3 <= 1.2.3`, even though the dirty `package.json` is exactly the state the allowlist tolerates.
2. A real publish that fails after the bump but before the commit (e.g. a validation gate fails, `git push` offline) leaves `package.json` bumped and uncommitted. "Rerun the full command" as instructed fails the same way, and the error text pushes the operator toward choosing a *new* version rather than reverting the file.
**Impact**: The documented recovery path ("fix manually and rerun the full command") does not work; operators must know to `git checkout -- package.json` first, which the error message never mentions. In flow 2 this can also nudge someone into publishing a higher version than intended.
**Suggestion**: Treat "already at the target version with a dirty, uncommitted `package.json`" as the idempotent-rerun case: in `updateRootVersion`, allow equality when the version change is still uncommitted (`git diff -- package.json` shows the bump and the value equals `release`), or at minimum change the error message to say "package.json is already at ${release} (likely from a previous no-publish/failed run); revert it with `git checkout -- package.json` and rerun". Alternatively, restore the original version in a `finally` when `flags.noPublish` is set.

### [SEVERITY: MEDIUM] Finding 2: Alias loader matches package roots with bare `startsWith`, making correctness silently dependent on array order (`formedible-parser` must stay before `formedible`)
**File**: scripts/package-alias-loader.mjs:33
**Problem**: The importing package is selected with `packageRoots.find((root) => parentPath.startsWith(root))`. `packages/formedible` is a literal string prefix of `packages/formedible-parser` paths (`/repo/packages/formedible-parser/...`.startsWith(`/repo/packages/formedible`) is `true`). The only thing preventing files in `formedible-parser` from resolving `@/` aliases against `packages/formedible/src` is that `formedible-parser` happens to be listed earlier in `packageRoots` (lines 6-13). Nothing documents or enforces this ordering, and the same hazard applies to any future sibling whose name extends an existing root (`packages/builder`, `apps/web`).
**Evidence**:
```js
const packageRoots = [
  resolvePath(repoRoot, 'packages/ai-builder'),
  resolvePath(repoRoot, 'packages/builder'),
  resolvePath(repoRoot, 'packages/formedible-parser'),  // must precede 'packages/formedible'
  resolvePath(repoRoot, 'packages/formedible'),
  ...
];
...
const packageRoot = packageRoots.find((root) => parentPath.startsWith(root)) ?? process.cwd();
```
**Impact**: If the array is reordered (e.g. alphabetized or grouped during a refactor) or a new package with a prefixed name is added, imports from the shadowed package resolve against the wrong package's `src`. Most such cases fail loudly with `ERR_MODULE_NOT_FOUND`, but where both trees contain the same relative path (e.g. `src/lib/formedible/types.ts` exists in `packages/formedible`; `packages/formedible-parser` files import `@/lib/formedible/*` aliases) the loader would silently load the wrong package's module — tests keep passing against incorrect code, which defeats the loader's purpose of testing against canonical sources.
**Suggestion**: Match on path segments, not raw prefix:
```js
const root = packageRoots.find((r) => parentPath === r || parentPath.startsWith(r + sep));
```
(using `sep` from `node:path`). While touching this function, `resolveExistingPath` (line 44-57) uses `access()`, which succeeds for directories, so the extensionless first candidate can return a directory and fail later with `EISDIR` instead of falling through to `/index.*`; using `stat` + `isFile()` would make the candidate chain match TS bundler resolution (no current specifier triggers this, so it is a hardening note only).

## Explicitly checked and NOT flagged (for the record)

- **Shell injection**: none — all spawns use arg arrays, `shell: false`; `--release` validated against strict semver before any use; `git add` receives status-derived paths behind `--`.
- **Destructive paths**: `rm` is non-recursive, `force: true`, limited to constant-named zips under `release-assets/`; `outputDirectory` overrides resolve within the repo root for all default flows.
- **gh-pages deploy**: fixed directory, `--dotfiles` present (required for `.nojekyll`), correct root cwd; cannot overwrite an unexpected directory.
- **Zip packaging**: dotfiles confirmed included empirically; registry zips use `-j` (flat entry named after the JSON file, version carried by the zip filename — intentional); assets cleaned per-version before creation; `assertPreparedInputs` fails loudly before producing empty/broken artifacts.
- **Missing `.gitignore` entry for `release-assets/`**: untracked zips never block or enter the release flow (not deploy-affecting per `isDeployAffectingDirtyFile`); considered dev clutter, not a release bug.
- **Windows**: scripts are POSIX-oriented (`zip`, `pnpm` spawns) but all spawn failures produce clear errors; not flagged per threat model.
- **Duplicated semver parser** between `build-release.js` and `create-release-assets.js`: style, not flagged.
- **Loader cache/loops**: `shortCircuit: true` on every return prevents resolution loops; per-resolve fs probes are adequate for test workloads.
