# Shadcn Build Release Plan

## Purpose

Create a current build and release workflow for Formedible shadcn registries.

This is not an npm package publishing workflow. The primary distributed artifacts are the hosted shadcn registry JSON files under `https://formedible.dev/r/*.json`, the generated registry files committed in the repo, the synced app install surface in `packages/ui`, the deployed web app, and GitHub release assets.

## Current Architecture

- Package manager: `pnpm@10.10.0`.
- Root package: private package named `formedible`.
- Root `package.json` has a `version` field and is the release version source of truth.
- Formedible core source of truth is `packages/formedible/src`.
- Current web app consumes Formedible core from `@formedible/ui/components/formedible/...`.
- Current app install surface for web lives under `packages/ui/src/components/formedible/...`.
- Package/plugin workspaces (`packages/builder`, `packages/ai-builder`, `packages/formedible-parser`) keep local shadcn-style source copies where needed. They must not import from `@formedible/ui`.
- Public shadcn registry items must install into the consumer project's `@ui/formedible/...` alias surface.

## Registry Items

Current source registry files:

- `packages/formedible/registry.json`
- `packages/formedible-parser/registry.json`
- `packages/builder/registry.json`
- `packages/ai-builder/registry.json`

Current built registry files:

- `packages/formedible/public/r/registry.json`
- `packages/formedible/public/r/formedible-core.json`
- `packages/formedible-parser/public/r/registry.json`
- `packages/formedible-parser/public/r/formedible-parser.json`
- `packages/builder/public/r/registry.json`
- `packages/builder/public/r/form-builder.json`
- `packages/ai-builder/public/r/registry.json`
- `packages/ai-builder/public/r/ai-builder.json`

Public release items:

- `formedible-core`
- `formedible-parser`
- `form-builder`
- `ai-builder`

## Registry Dependency Contract

Every dependent registry item must be installable by itself. The shadcn CLI must resolve dependencies automatically.

Required public dependency chain:

- `formedible-core`: depends only on shadcn primitives and npm runtime dependencies.
- `formedible-parser`: `registryDependencies` includes `https://formedible.dev/r/formedible-core.json`.
- `form-builder`: `registryDependencies` includes `https://formedible.dev/r/formedible-core.json`.
- `ai-builder`: `registryDependencies` includes:
  - `https://formedible.dev/r/formedible-core.json`
  - `https://formedible.dev/r/formedible-parser.json`

Required public target layout:

- Formedible core files target `@ui/formedible/...`.
- Parser files target `@ui/formedible/lib/...`.
- Builder files target `@ui/formedible/builder/...` and `@ui/formedible/lib/...`.
- AI builder files target `@ui/formedible/ai/...` and `@ui/formedible/lib/...`.
- Public registry files must not target raw `components/formedible/...` or raw `lib/formedible/...` paths.

Required dependency validation:

- Installing `form-builder` from a registry URL into a fresh app must install Formedible core through `registryDependencies`.
- Installing `ai-builder` from a registry URL into a fresh app must install Formedible core and parser through `registryDependencies`.
- Consumer smoke must use a local HTTP registry server in CI so the dependency resolution path is tested without relying on production `formedible.dev`.

## Locked Decisions

- Release shadcn registry artifacts, not npm packages.
- Do not add `npm publish` behavior.
- Do not make the packages publishable npm packages as part of this workflow.
- Do not add invented `version` fields to shadcn registry JSON files.
- Set the root `package.json` `version` field via `--release vX.Y.Z` for release versioning. No auto-bump flags.
- Dirty worktrees must not block local/no-publish release preparation.
- Real publish commits only release-relevant files through an explicit allowlist.
- Real publish tags must point at the release commit containing the built registry files.
- Real publish must push the release commit and tag before creating the GitHub release.
- Release zip assets are archival-only transparency artifacts. Consumers install from hosted JSON URLs.
- The central release gate is installability from hosted/local registry URLs, not merely successful repo typechecking.
- First version is manual-only. No CI/CD pipeline. GitHub Actions are a separate future concern.
- Deploy to GitHub Pages via the `gh-pages` npm package using local git credentials.
- On mid-flow failure: fail loudly with clear messages, manual fix required. No auto-rollback.
- After `--no-publish`, transitioning to real publish requires re-running the full flow from scratch. No build reuse.
- Commit message format: simple `release vX.Y.Z`. No conventional commits, no changelog generation.
- Assume `gh` CLI is available and authenticated.

## Root Scripts To Add

Add current convenience scripts using `pnpm` and scoped package filters/directories:

- `build:pkg`: build/check `@formedible/formedible`.
- `build:parser`: build/check `@formedible/formedible-parser`.
- `build:builder`: build/check `@formedible/builder`.
- `build:ai-builder`: build/check `@formedible/ai-builder`.
- `build:web`: build `web`.
- `check-types:pkg`: typecheck `@formedible/formedible`.
- `check-types:parser`: typecheck `@formedible/formedible-parser`.
- `check-types:builder`: typecheck `@formedible/builder`.
- `check-types:ai-builder`: typecheck `@formedible/ai-builder`.
- `check-types:web`: typecheck `web`.
- `build:registries`: run the registry build script.
- `sync-components`: run `node scripts/quick-sync.js`.
- `build:release`: run the release orchestrator.

Do not add legacy unscoped package names or npm-based commands.

## Script Shape

Use split JavaScript ESM scripts under `scripts/`, not one large Bash script.

Recommended scripts:

- `scripts/build-release.js`
  - Main orchestrator for `pnpm build:release`.
  - Parses and validates flags.
  - Runs the focused scripts in release order.
- `scripts/build-registries.js`
  - Rebuilds all shadcn registries in dependency order.
  - Removes stale generated JSON files before rebuilding each package.
- `scripts/prepare-registry-host.js`
  - Copies built public registry JSON files into the web deploy output `r/` directory.
  - Ensures `formedible.dev/r/*.json` will serve every public registry item.
- `scripts/prepare-web-deploy.js`
  - Locates or receives the web build output directory.
  - Writes `.nojekyll` into the output directory (explicit control, even though `apps/web/public/.nojekyll` already exists and Vite copies it).
  - Writes `CNAME` containing `formedible.dev` into the output directory.
- `scripts/create-release-assets.js`
  - Creates per-registry zip files.
  - Creates a web build zip.
  - Does not package npm `dist` outputs.
- `scripts/deploy-gh-pages.js`
  - Deploys the prepared web output to GitHub Pages using the `gh-pages` npm package.
  - Uses local git credentials (no token required).
  - Runs `gh-pages --dotfiles -d apps/web/dist/client`.
- `scripts/validate-public-registries.js`
  - Validates dependency contracts, target layout, and installability assumptions for public registry items.

The exact split can change during implementation, but these responsibilities must remain explicit.

## Release Command Contract

Primary command:

```bash
pnpm build:release [flags]
```

Required flag:

- `--release <version>`
  - Explicit version string. Must be valid semver with `v` prefix (e.g., `v1.0.0`, `v0.2.0-alpha.1`).
  - Uses direct JSON editing for the root `package.json` `version` field.
  - Must be greater than the current root version. Exception: a same-version rerun is idempotent when root `package.json` already carries the release version and is the only dirty deploy-affecting file (the recovery state after a mid-flow failure); the bump is skipped and the flow proceeds.
  - Derives release name and git tag as the provided version string.

Optional flags:

- `--no-publish`
  - Builds, syncs, validates, prepares deploy output, and creates local release assets.
  - Does not commit, tag, push, deploy, or create a GitHub release.
  - Modifies the worktree with built output. To transition to real publish, re-run the full flow from scratch.
- `--skip-github`
  - Skips GitHub release creation but still allows release commit/tag/push and web deploy.
- `--skip-web-deploy`
  - Skips GitHub Pages deploy.

Do not support `--skip-build`. The flow always builds from scratch.

Flag validation:

- `--release` is required for real publish. Optional for `--no-publish` (if omitted, no version change occurs).
- Invalid semver values must fail.
- `--release` version must be greater than current root `package.json` version, except for the idempotent same-version rerun state described above (root `package.json` at the release version and the only dirty deploy-affecting file).
- `--no-publish` must disable commit/tag/push/deploy/GitHub-release side effects.

## Registry Build Requirements

Registry builds must use current package `build:registry` scripts:

- `pnpm --dir packages/formedible build:registry`
- `pnpm --dir packages/formedible-parser build:registry`
- `pnpm --dir packages/builder build:registry`
- `pnpm --dir packages/ai-builder build:registry`

Build order:

1. `packages/formedible`
2. `packages/formedible-parser`
3. `packages/builder`
4. `packages/ai-builder`

Before rebuilding a package registry, remove stale generated JSON under that package's `public/r/*.json`. Do not remove source `registry.json` files.

After rebuilding, validate:

- All expected item JSON files exist.
- All expected package `public/r/registry.json` files exist.
- Public dependent items contain required `registryDependencies`.
- Public targets use `@ui/formedible/...`.
- No bridge/facade names such as `formedible-react-form` or `formedible-classname-runtime` appear.
- No literal `src/@ui` directory exists.

## Sync Requirements

Use current `scripts/quick-sync.js` as the source of truth. Do not port legacy sync behavior that ignored registry `target` fields or stripped paths blindly.

Current default sync routes:

- `packages/formedible` to `packages/ui/src/components` using registry targets.
- `packages/formedible` to:
  - `packages/formedible-parser/src`
  - `packages/builder/src`
  - `packages/ai-builder/src`
- `packages/formedible-parser` to:
  - `apps/web/src`
  - `packages/builder/src`
  - `packages/ai-builder/src`
- `packages/builder` to:
  - `apps/web/src`
  - `packages/ai-builder/src`
- `packages/ai-builder` to:
  - `apps/web/src`

`packages/formedible` must not sync core directly into `apps/web/src`. The web app consumes core through `packages/ui/src/components/formedible`.

After sync, validate:

- `apps/web` has no stale core imports such as `@/hooks/use-formedible`, `@/components/formedible/fields`, or `@/lib/formedible/types`.
- `apps/web` core Formedible imports use `@formedible/ui/components/formedible/...`.
- Package/plugin workspaces do not import `@formedible/ui` for their shadcn package internals.
- `packages/ui/src/components/formedible` has no invalid `@ui` or `/ui` imports.

## Registry Host Requirements

GitHub Pages must serve the web app and the public registry JSON files.

`prepare-registry-host.js` must copy these files into the final web deploy output under `r/`:

- `packages/formedible/public/r/formedible-core.json` -> `r/formedible-core.json`
- `packages/formedible-parser/public/r/formedible-parser.json` -> `r/formedible-parser.json`
- `packages/builder/public/r/form-builder.json` -> `r/form-builder.json`
- `packages/ai-builder/public/r/ai-builder.json` -> `r/ai-builder.json`

If a combined registry index is published, it must be generated intentionally and validated. Do not accidentally publish a stale package-local `registry.json` as the only index.

## GitHub Pages Requirements

The deploy preparation must:

- Build the current Vite/TanStack Start web app with `pnpm --dir apps/web build`.
- Use `apps/web/dist/client` as the GitHub Pages static deploy output directory.
- Do not deploy `apps/web/dist/server` to GitHub Pages. It is SSR server output, not the static Pages artifact.
- Fail if `apps/web/dist/client` does not exist after the web build.
- Write `.nojekyll` into that output directory (explicit, even though Vite copies it from `apps/web/public/`).
- Write `CNAME` containing `formedible.dev` into that output directory.
- Copy public registry JSON files into `r/` under that output directory.

Deploy to GitHub Pages using:

```bash
gh-pages --dotfiles -d apps/web/dist/client
```

The `gh-pages` npm package pushes to the `gh-pages` branch.

## Release Assets

Create one zip per public registry item:

- `formedible-core-vX.Y.Z.zip`
- `formedible-parser-vX.Y.Z.zip`
- `form-builder-vX.Y.Z.zip`
- `ai-builder-vX.Y.Z.zip`

Each registry zip should contain the built registry JSON file needed by shadcn consumers. If implementation proves extra registry index files are useful, include them intentionally and document the structure.

Also create:

- `web-vX.Y.Z.zip`

The web zip should contain the prepared deployable web output, including `.nojekyll`, `CNAME`, and `r/*.json`.

## Real Publish Flow

For a real publish, run this sequence:

1. Parse and validate flags. Require `--release vX.Y.Z`.
2. Fail before artifact generation if deploy-affecting dirty files exist outside the release allowlist.
3. Update root `package.json` version by direct JSON edit to the value from `--release` (strip the `v` prefix for the JSON field).
4. Build/check source packages in dependency order.
5. Rebuild shadcn registries in dependency order.
6. Run `node scripts/quick-sync.js`.
7. Run registry and sync boundary validations.
8. Build the web app.
9. Prepare web deploy output (write `.nojekyll` and `CNAME`).
10. Copy public registry files into deploy output `r/`.
11. Run release validation gates (check-types, test:sync, test:consumer-smoke, existing-output e2e gate with `pnpm run test:e2e:existing`).
12. Create release assets.
13. Stage only allowlisted release files.
14. Commit release files with message `release vX.Y.Z`.
15. Create the Git tag `vX.Y.Z` from the release commit.
16. Push release commit and tag.
17. Deploy GitHub Pages via `gh-pages --dotfiles -d apps/web/dist/client` unless `--skip-web-deploy` is set.
18. Create the GitHub release with assets via `gh release create` unless `--skip-github` is set.

The tag must point at the release commit containing the generated registry files.

## No Publish Flow

For `--no-publish`, run this sequence:

1. Parse and validate flags. `--release` is optional (if provided, update root version; if omitted, no version change).
2. If `--release` is provided, update root `package.json` version in the worktree by direct JSON edit.
3. Build/check source packages.
4. Rebuild shadcn registries.
5. Run `node scripts/quick-sync.js`.
6. Run registry and sync boundary validations.
7. Build the web app.
8. Prepare web deploy output locally (write `.nojekyll` and `CNAME`).
9. Copy public registry files into local deploy output `r/`.
10. Run no-publish validation gates (check-types, test:sync, test:consumer-smoke, existing-output e2e gate with `pnpm run test:e2e:existing`).
11. Create release assets locally.
12. Print the exact files that would be committed, tagged, deployed, pushed, and released.

No-publish must not create a commit, tag, push, deploy, or GitHub release.

## Commit Scope

The real release commit must include only release-relevant files through an explicit allowlist.

Expected included files:

- Root `package.json` if version or scripts changed.
- Built registry outputs under `packages/*/public/r/*.json`.
- Registry source files if intentionally changed.
- Synced app install surface under `packages/ui/src/components/formedible/**` if changed by sync.
- Synced package-local files in `packages/builder`, `packages/ai-builder`, and `packages/formedible-parser` if changed by sync.
- App-specific synced AI/builder/parser files in `apps/web/src` if changed by sync.
- Release/deploy scripts.
- Root package script changes.
- Release plan documentation if part of the implementation branch.

Expected excluded files:

- Unrelated dirty worktree files.
- Local debug artifacts.
- Temporary generated consumer smoke apps.
- Release zip files, unless implementation explicitly decides to commit them. Preferred behavior is GitHub release assets only.

The release script should print the staged file list before committing. It should fail if unexpected files are staged by the release flow.

## Validation Gates

The release flow builds everything once in the earlier steps. Validation gates must not trigger redundant rebuilds.

Mandatory real publish gates:

- Validate public registry dependency contracts.
- Validate public registry target layout.
- Validate deploy output contains `r/formedible-core.json`, `r/formedible-parser.json`, `r/form-builder.json`, and `r/ai-builder.json`.
- Run all-package typecheck with `pnpm run check-types`.
- Run sync tests with `pnpm run test:sync`.
- Run consumer smoke with `pnpm run test:consumer-smoke`. This is mandatory because it installs dependent registry items through a local registry URL and proves `registryDependencies` pull Formedible core/parser correctly.
- Run existing-output e2e tests with `pnpm run test:e2e:existing`.

No-publish gates:

- Same as real publish.
- Consumer smoke remains mandatory because registry installability is the release contract.

Failure handling:

- On mid-flow failure: print clear error messages describing what succeeded and what failed. No auto-rollback. Manual fix required.

## Implementation Phases

### Phase 1: Root Script Alignment

- Add missing root script aliases with `pnpm` and current package names.
- Add `build:registries`, `sync-components`, and `build:release`.
- Preserve root `version` as the release source of truth.

Validation:

- Inspect `package.json` scripts.
- Run `pnpm run check-types`.

### Phase 2: Registry Build And Contract Validation

- Add `scripts/build-registries.js`.
- Add `scripts/validate-public-registries.js`.
- Encode registry item order and dependency contracts.
- Remove stale package `public/r/*.json` before each package registry build.

Validation:

- Run `pnpm run build:registries`.
- Run public registry validation.
- Run `pnpm run test:consumer-smoke`.

### Phase 3: Sync And App Install Surface Validation

- Keep current `scripts/quick-sync.js` behavior.
- Add any missing validation for `packages/ui/src/components/formedible` import normalization and stale web-local core imports.

Validation:

- Run `node scripts/quick-sync.js`.
- Run `pnpm run test:sync`.
- Run `pnpm run check-types`.

### Phase 4: Registry Host And GitHub Pages Preparation

- Add `scripts/prepare-registry-host.js`.
- Add `scripts/prepare-web-deploy.js`.
- Add `scripts/deploy-gh-pages.js` using the `gh-pages` npm package.
- Add `gh-pages` as a devDependency at the root.

Validation:

- Build web.
- Confirm `.nojekyll`, `CNAME`, and `r/*.json` exist in actual deploy output.
- Confirm no-publish does not deploy.

### Phase 5: Release Asset Script

- Add `scripts/create-release-assets.js`.
- Create per-registry zips and web zip.
- Avoid npm package `dist` assumptions.

Validation:

- Run asset script after builds.
- Inspect zip names and contents.

### Phase 6: Release Orchestrator

- Add `scripts/build-release.js`.
- Implement flag parsing (`--release vX.Y.Z`, `--no-publish`, `--skip-github`, `--skip-web-deploy`).
- Implement version update via direct JSON edit of root `package.json`.
- Implement real-publish and no-publish flows.
- Implement allowlisted staging.
- Commit with message `release vX.Y.Z`, tag, push, deploy via `gh-pages`, create GitHub release via `gh release create` in the correct order.
- On failure: print clear error, no auto-rollback.

Validation:

- Run `pnpm build:release --no-publish`.
- Verify no commit/tag/push/deploy/GitHub release happens.
- Inspect output summary.

## Explicit Non-Goals

- Do not add `npm publish`.
- Do not make packages publishable npm packages.
- Do not add `tsup` package distribution unless a separate future decision changes the architecture.
- Do not inject `version` fields into shadcn registry JSON.
- Do not port legacy sync behavior that ignores registry `target` fields.
- Do not block release solely because unrelated dirty files exist.
- Do not use `@formedible/ui` imports inside shadcn package/plugin workspaces.

## Remaining Implementation-Time Checks

- Implement web deploy preparation against `apps/web/dist/client` and fail if that directory is missing after build.
- Verify `gh-pages` npm package is added as devDependency.
- Verify final release asset contents.
- Verify exact no-publish and real-publish command lists before coding side effects.
- The `prepare-web-deploy.js` script must explicitly write both `.nojekyll` and `CNAME` into `apps/web/dist/client/` even though `.nojekyll` already exists in `apps/web/public/`.
- Stale import patterns (`@/hooks/use-formedible`, `@/components/formedible/fields`, `@/lib/formedible/types`) are already absent from the codebase. Keep validation as a safety check, not an active cleanup step.
