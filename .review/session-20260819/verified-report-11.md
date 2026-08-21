# Verified Report 11 — Release/deploy/alias loader scripts

Source report: `review-report-11.md` (2 findings). Both verified against actual source on branch `re-codex` (HEAD `2122842`).

Files verified:
- `/home/didi/workspace/Formedible/scripts/build-release.js`
- `/home/didi/workspace/Formedible/scripts/package-alias-loader.mjs`
- `/home/didi/workspace/Formedible/scripts/register-package-alias-loader.mjs`
- `/home/didi/workspace/Formedible/docs/shadcn-build-release-plan.md` (design intent)
- Consumer scripts in `packages/ai-builder/package.json`, `packages/ai-picker/package.json`, `packages/formedible-parser/package.json`

Method: full source reads, line-reference cross-checks, end-to-end trace of the version-bump state machine, and empirical execution of the loader's `resolve()` (repo copy as-is, plus a /tmp-simulated reordered `packageRoots`) with synthetic parent URLs. No repo files modified.

---

### Finding 1: Release rerun of the same version is always blocked after the version bump has been applied — CONFIRMED
**Original**: `updateRootVersion` requires strictly-greater version and the bump is never reverted (neither in `--no-publish` mode nor on mid-flow failure), so rerunning the same `--release` — exactly what the failure message instructs — always throws.

**Verification**: Every mechanical claim checks out against the source:

- **Strict check**: `scripts/build-release.js:348-350` — `if (compareSemver(releaseSemver, currentSemver) <= 0) throw ...`. `compareSemver(x, x)` returns 0 for identical versions (lines 134-143: equal numerics, empty prerelease lists → 0), so equal versions throw.
- **Bump applies in no-publish mode too**: `parseFlags` (lines 172-242) permits `--no-publish --release v1.2.3` — line 233 only requires `--release` when `noPublish` is false; there is no mutual-exclusion rule. `runReleaseFlow` line 565-566 calls `updateRootVersion` whenever `flags.release !== undefined`, independent of `noPublish`. `printNoPublishSummary` (line 540) even prints "Git tag that would be created: v1.2.3", confirming `--no-publish --release` is a first-class supported invocation, not operator error.
- **No restore**: the only `writeFile` of `package.json` in the script is inside `updateRootVersion` (lines 352-353). The `--no-publish` early return (lines 616-618) and the failure handler (lines 657-663) both leave the bumped version on disk.
- **No escape hatch**: `parseFlags` accepts exactly four flags (`--release`, `--no-publish`, `--skip-github`, `--skip-web-deploy`); nothing bypasses the version check. Traced both broken flows end-to-end:
  1. `--no-publish --release v1.2.3` leaves `package.json` at 1.2.3 uncommitted. Follow-up real publish `--release v1.2.3`: the dirty-file guard passes (see below), then `updateRootVersion` throws `Release v1.2.3 must be greater than current root package.json version 1.2.3.` Dead end without manual `git checkout -- package.json`.
  2. Real publish failing after the bump but before the commit (validation gates run at lines 594-596, push at 628-629) leaves the same state. The failure handler (line 659) says "fix manually and rerun the full command", but rerunning the identical command fails identically. The error text ("must be greater than current...") pushes toward choosing a new higher version rather than reverting the file.
- **Internal inconsistency confirmed**: `isDeployAffectingDirtyFile` (lines 426-437) flags `package.json`, but `/^package\.json$/` is in `stageAllowlist` (line 30), so `assertNoUnallowlistedDeployAffectingDirtyFiles` (lines 439-452, runs first at line 561-563) deliberately tolerates a dirty, already-bumped `package.json` — and then `updateRootVersion` (line 565-566) rejects the exact state the guard just tolerated.
- **Design-intent check (false-positive signal)**: `docs/shadcn-build-release-plan.md` locks in "must be greater than current root version" (line ~180) and "On mid-flow failure: fail loudly with clear messages, manual fix required. No auto-rollback" (~line 87), and states "After `--no-publish`, transitioning to real publish requires re-running the full flow from scratch" (~line 90). So the strict check and absence of auto-rollback are intentional — but the doc never says to revert `package.json` (it only notes "if omitted, no version change occurs" for `--no-publish`), and the script's own recovery instruction ("rerun the full command") demonstrably fails for the same version. The finding does not request auto-rollback; it correctly identifies that the documented/scripted recovery path is broken and undiscoverable. Severity MEDIUM is defensible for release tooling (accidental version inflation under release stress); the trap is manually recoverable, which keeps it out of HIGH.

---

### Finding 2: Alias loader matches package roots with bare `startsWith`, making correctness silently dependent on array order — CONFIRMED
**Original**: `packageRoots.find((root) => parentPath.startsWith(root))` resolves `packages/formedible` as a prefix of `packages/formedible-parser` paths; only undocumented array order prevents parser files from resolving `@/` against the wrong package's `src`.

**Verification**:

- **Code claims exact**: `scripts/package-alias-loader.mjs:33` is verbatim `const packageRoot = packageRoots.find((root) => parentPath.startsWith(root)) ?? process.cwd();`. `packageRoots` (lines 6-13) lists `formedible-parser` (line 9) before `formedible` (line 10). No comment, test, or assertion anywhere documents or enforces the ordering (the `// must precede` comment in the report's evidence block is the reviewer's annotation, correctly reflecting an invariant the source lacks).
- **Prefix relationship real**: `/repo/packages/formedible-parser/src/...`.startsWith(`/repo/packages/formedible`) is `true`.
- **Ordering is one innocent refactor away from wrong**: the current order is *not* strictly alphabetical (`apps/web` is last despite sorting first). A tidy-up to strict alphabetical order would move `apps/web` first AND `formedible` before `formedible-parser` — triggering the hazard exactly.
- **Empirical proof (current order)**: drove the real `resolve()` from the repo file with synthetic parent URLs. With the shipped order, a parser parent resolves `@/lib/formedible/parser-types` → `packages/formedible-parser/src/lib/formedible/parser-types.ts` and `@/lib/utils` → `packages/formedible-parser/src/lib/utils.ts` — correct.
- **Empirical proof (reordered)**: same loader logic in /tmp with `formedible` before `formedible-parser` (repoRoot pinned to the repo):
  - `@/lib/utils` from `packages/formedible-parser/src/components/ui/button.tsx` → **silently resolved to `/packages/formedible/src/lib/utils.ts`** (wrong tree; parser has its own `src/lib/utils.ts`). No error.
  - `@/components/ui/button` from a parser file → **silently resolved to `/packages/formedible/src/components/ui/button.tsx`** (both packages have this file; verified `packages/formedible/src/components/ui/button.tsx` exists).
  - `@/lib/formedible/parser-types` from parser's `index.ts` → matched root flips to `formedible`, file absent there → falls through to `nextResolve` (tsx). So parser-only specifiers are masked or fail loudly rather than misresolve — consistent with the review's "most such cases fail loudly" caveat.
- **Concrete misresolution scenario (as required)**: reorder the array (e.g. alphabetize) + any parser file with an unmapped `@/` specifier naming a path that exists in both trees (`@/lib/utils`, `@/components/ui/*` — both trees verifiably contain these) → loader returns the wrong package's module with `shortCircuit: true`, so tsx/tsconfig resolution never runs and tests keep passing against the wrong tree. One nuance vs. the report's illustrative example: parser actually imports `@/lib/formedible/{formedible-parser,parser-types,parser-config-schema}`, none of which exist under `formedible/src/lib/formedible/` (verified directory listing), so the review's specific `types.ts` pairing is imprecise — but `@/lib/utils` and `@/components/ui/*` make the claimed silent-wrong-module outcome concretely real, so the finding stands.
- **Present-day exposure (why MEDIUM, not higher)**: the loader's only consumers are the `test` scripts of `packages/ai-builder` and `packages/ai-picker` (`node --import ../../scripts/register-package-alias-loader.mjs ...`); `formedible-parser` tests use plain `tsx` without the loader. During ai-builder/ai-picker runs, the parser files actually loaded are the registry redirect targets (`formedible-parser.ts`, `parser-config-schema.ts`, `parser-types.ts`), and their `@/` imports are all registry-map hits (`@/components/formedible/lib/types`, `@/components/formedible/lib/parser-types`), which bypass `find()`. So today nothing misresolves even in principle — this is a latent invariant with zero enforcement, exactly as the review framed it ("latent"). The suggested segment-aware fix (`parentPath === r || parentPath.startsWith(r + sep)`) is correct and trivial. The `resolveExistingPath`/`access()` note is a hardening aside (access() does succeed on directories; no current specifier names a bare directory — verified), correctly not claimed as a live bug.

---

## Summary

- **Finding 1 (release rerun blocked after bump)** — CONFIRMED. Fully traced: no-publish-with-release is a supported invocation, the bump persists, no flag bypasses the strictly-greater check, the dirty-file guard tolerates precisely the state `updateRootVersion` rejects, and the "rerun the full command" recovery advice cannot work for the same version. Design doc confirms intent for strictness/no-rollback but documents no workaround, so this is a genuine workflow defect, not intended behavior.
- **Finding 2 (loader `startsWith` order dependence)** — CONFIRMED. Mechanism verified in source and demonstrated empirically in both directions; concrete silent cross-tree misresolution exists under reorder for specifiers present in both trees (`@/lib/utils`, `@/components/ui/*`). Latent today (correct order shipped; loader consumers never hit the `find()` branch for parser parents), which matches the review's own "latent" framing. Minor imprecision in the review's illustrative file pairing does not change the conclusion.

2 confirmed, 0 dismissed.
