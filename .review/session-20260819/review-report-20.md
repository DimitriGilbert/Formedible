# Cluster 20 — Architecture scan tests (tests/architecture/*)

Reviewer: code-reviewer cluster 20. Scope: scan-logic correctness of the node:test architecture scans. All findings verified experimentally (regex replays in /tmp; the real suite was run for a baseline). Known gaps already reported elsewhere (alias-regex corrupting string literals in non-import positions; consumer-smoke fixture compat coverage) are NOT re-reported.

Baseline note: `pnpm run test:architecture` currently FAILS (see Finding 1) — 26/27 pass, the repository-scope docs assertion fails on an internal review report.

---

### [SEVERITY: HHIGH] Finding 1: Docs-import scan treats every Markdown file in the working tree as public docs — the gate is failing right now on an internal review report

**File**: tests/architecture/public-doc-imports.test.ts:5 (and tests/architecture/utils.ts:14-30 for the ignore list)

**Problem**: `documentationPathPattern = /(^|\/)(docs|app\/docs|src\/app\/docs|README\.(?:md|mdx)$|.*\.(?:md|mdx)$)/` — the `.*\.(?:md|mdx)$` alternative matches ANY `.md`/`.mdx` path, making the intended `docs/`-scoped alternatives dead code. Every Markdown file in the tree — internal orchestration plans, design notes, untracked reviewer scratch reports under `.review/` — is held to the public-docs import policy. Additionally, `(^|\/)docs` is not right-anchored, so any `.ts`/`.tsx` file under a directory merely *starting* with "docs" (e.g. `src/components/docs-helper/foo.ts`) is also classified as documentation (verified by regex replay).

**Evidence**: Running `pnpm run test:architecture` on the current working tree fails with:

```
Error: public docs must import Formedible from local shadcn install paths,
not @/components/formedible/hooks/use-formedible in .review/session-20260819/review-report-10.md
```

`review-report-10.md` is an internal review report whose evidence legitimately quotes a generated-code sample containing that specifier (a real finding about the code generator). The report is untracked but `.review/` is NOT in `.gitignore`, and `collectRepositoryEntries()` walks untracked files too. Any committed plan/doc that quotes a non-allowlisted formedible specifier in an `import … from` shape (exactly what evidence-quoting documents do) breaks the architecture gate. Notably, this report itself had to avoid quoting import statements verbatim to not add new violations — the scan forces reviewers to write around their own test suite.

**Impact**: Architecture gate #1 in ORCHESTRATION-PLAN-2.md is red on the working tree today for a reason unrelated to architecture violations. False-positive pressure invites weakening or deleting the scan. Internal notes and public docs have fundamentally different rules but are scanned identically.

**Suggestion**: Restrict the pattern to actual public docs surfaces, e.g. `^(docs\/|README\.mdx?$|packages\/[^/]+\/README\.mdx?$|apps\/web\/src\/app\/docs\/)`, drop the catch-all `.*\.(?:md|mdx)$` alternative (or keep it but add `.review` and plan files to the ignore set in `utils.ts`), and right-anchor the `docs` segment (`(^|\/)docs(\/|$)`).

---

### [SEVERITY: MEDIUM] Finding 2: Copy-only sync scan — generated-content writeFile detection evades on any concatenation, on parens inside string literals, and the forbidden writeFile regexes are comma-blind in the first argument

**File**: tests/architecture/copy-only-sync-contract.test.ts:6-16, 18-84

**Problem**: Three compounding weaknesses in the "sync must not assemble generated source" detection:
1. `findWriteFileMutationViolations` flags a content argument only if it *starts with* a quote/backtick or if the *entire* argument is a tracked variable name. Any concatenation evades.
2. `extractWriteFileContentArguments` scans characters without string-literal awareness, so a `)` inside a string literal terminates the argument early and mis-slices it.
3. The two forbidden writeFile regexes use `\([^,]+,` for the first argument, which cannot match when the first argument itself contains a comma (e.g. a `join(a, b)` path).

**Evidence** (exact replays of the scan logic on sample sync scripts):
- `const header = <template literal starting with export…>; await writeFile(target, header + source);` → EVADES (tracked variable must be the sole argument).
- `await writeFile(target, source + <backtick literal containing export …>);` → EVADES (argument does not start with a quote).
- `await writeFile(target, source + ')export const a = 1;');` → EVADES: the `)` inside the literal truncates extraction so the sliced argument is just an orphan quote fragment, which fails the generated-content check.
- `await writeFile(join(root, name), '// generated…');` → both forbidden writeFile regexes miss (comma in first arg, verified `false`); only the arg-extractor saves this case, and per (2) it is itself unreliable.

This is distinct from the already-known gap (alias regex corrupting string literals during rewrite): these are misses in *detecting content assembly* at the write site.

**Impact**: A sync script that prepends/appends header/footer strings to copied source — precisely the "generated banner + copied body" anti-pattern the test's own samples target — passes the scan whenever the literal is not the first operand or contains a paren. The copy-only contract is enforced weaker than its sample tests imply.

**Suggestion**: In `extractWriteFileContentArguments`, skip over quoted regions (single/double/backtick with escape handling) when tracking depth and commas; treat an argument as suspect if it *contains* a tracked generated variable (not only equals one) or *contains* a string/template literal combined with any other operand; use a depth-aware (not `[^,]+`) first-argument match in the forbidden regexes.

---

### [SEVERITY: MEDIUM] Finding 3: Package entrypoint scans pass vacuously — an empty (or deleted) entrypoint is green, and 4 of 8 packages have no entrypoint at all, so the core package has zero coverage

**File**: tests/architecture/package-root-real-exports.test.ts:14-16 (same path pattern shared by tests/architecture/no-placeholder-public-exports.test.ts:5)

**Problem**: `findPackageRootExportViolations` returns `[]` when `stripCommentsAndWhitespace(content).length === 0`, so an empty or comments-only entrypoint passes the "must re-export real modules" invariant. More structurally, both entrypoint scans only iterate files matching `packages/*/src/index.(ts|tsx)` — a package with no such file is simply never examined. Today `packages/formedible` (the package the whole rewrite is about), `packages/ui`, `packages/config`, and `packages/env` have no `src/index.ts`, so the core package's public surface has no entrypoint coverage at all. Deleting or emptying any package's entrypoint keeps the gate green.

**Evidence**: `ls packages/formedible/src/` → only `components/ hooks/ lib/` (no index file; `packages/formedible/package.json` has no `main`/`exports` — it is a registry source package, so absence may be intentional, but nothing pins that intent). Regex replay: empty file → PASS; comments-only file → PASS; `export * as ns from './x';` → FLAGGED (a legitimate re-export form, latent false positive); bare side-effect `import './polyfill';` → FLAGGED.

**Impact**: The invariant "source root entrypoint must re-export real modules instead of implementing runtime behavior" is unenforced in the degenerate cases it most needs to catch (gutted or missing entrypoint), and the allowed-statement regex simultaneously rejects valid re-export forms (`export * as ns …`), so the scan is both too lenient and too strict.

**Suggestion**: Fail on empty/comments-only entrypoints; for packages that legitimately have no entrypoint, pin that expectation (e.g. an explicit allowlist of entrypoint-less packages, so a new package missing its entrypoint fails); extend the allowed pattern to `export * as <name> from …` (and decide explicitly on side-effect imports).

---

### [SEVERITY: MEDIUM] Finding 4: Generated-output allowlist is a repo-wide bare-filename blind spot, and its gating test is tautological — the set is never pinned and the repo is never scanned

**File**: tests/architecture/utils.ts:28,49-51,67-70; tests/architecture/generated-output-allowlist.test.ts:7-9

**Problem**: `ignoredGeneratedFileNames` (`routeTree.gen.ts`) is applied in `collectRepositoryEntries()` by bare filename at every directory level, so a file with that name *anywhere* — e.g. a hand-written `packages/formedible/src/routeTree.gen.ts` — is invisible to every architecture scan (registry mirror, fake import surface, placeholder, docs imports, shadcn primitives). Meanwhile `generated-output-allowlist.test.ts` only asserts `isIgnoredGeneratedFileName('routeTree.gen.ts') === true`: it hardcodes the same literal the set contains, so (a) adding any other name to the set (e.g. `form.tsx`) keeps the suite green while exempting every file of that name from all scans, and (b) no test enumerates generated-looking files in the repo and asserts they are allowlisted — the invariant "only allowlisted generated output may exist" is never checked against the repository.

**Evidence**: The entry is not stale (`apps/web/src/routeTree.gen.ts` exists — verified), and the docs-imports allowlist entries were spot-checked and all map to real modules under `packages/formedible/src/`. The weakness is structural, as described: the walk-time skip at utils.ts:67-70 uses `ignoredGeneratedFileNames.has(child.name)` with no path scoping, and the test at generated-output-allowlist.test.ts:7-9 performs no repository iteration whatsoever.

**Impact**: The allowlist is an unpinned global exemption list. One-line additions or a misplaced generated-named file silently shrink every other scan's coverage with zero test signal.

**Suggestion**: Pin the set in the test (assert exact membership, e.g. export the set and deep-equal it against `['routeTree.gen.ts']`); scope the ignore to approved generated locations (e.g. only under `apps/web/src/`); add a repo assertion that every file matching generated-output naming (`*.gen.ts(x)`, etc.) is either allowlisted or flagged.

---

### [SEVERITY: MEDIUM] Finding 5: Docs-import scan only sees static ESM forms — require() and dynamic import() specifiers evade

**File**: tests/architecture/utils.ts:129-146 (used by tests/architecture/public-doc-imports.test.ts)

**Problem**: `extractImportSpecifiers` implements only `import … from`, bare side-effect `import`, and `export … from`. It has no `require(...)` and no `import(...)` patterns — even though the sibling scan `no-fake-formedible-import-surface.test.ts:13-19` ships exactly those two extra patterns, so the suite itself treats them as worth scanning elsewhere.

**Evidence**: Regex replay: content containing `const F = require('@formedible/formedible');` yields `[]`; `const F = await import('@formedible/formedible');` yields `[]`; the ESM form yields the specifier. A docs/README sample showing a CJS require or lazy dynamic import of a forbidden formedible surface is invisible to the docs scan.

**Impact**: Docs-import policy is enforceable only against the ESM subset; the two extractors in the same suite disagree on coverage, which is the classic path to "assumed covered but isn't".

**Suggestion**: Reuse one shared extractor: move the `require`/dynamic-import patterns from `no-fake-formedible-import-surface.test.ts` into `utils.extractImportSpecifiers` (or extract a common module-reference extractor) so all consumers get the same forms.

---

### [SEVERITY: LOW] Finding 6: Sync scans are keyed to filenames containing "sync" — sync logic in any other script name evades both contract scans

**File**: tests/architecture/copy-only-sync-contract.test.ts:5; tests/architecture/no-source-rewrite-sync.test.ts:5

**Problem**: Both scans gate on `/^scripts\/.*sync.*\.(?:cjs|js|mjs|ts)$/`. Only `scripts/quick-sync.js` and `scripts/validate-sync-boundaries.js` match today. Other file-writing scripts exist in `scripts/` (`prepare-registry-host.js` uses `copyFile`, `build-release.js` and `prepare-web-deploy.js` use `writeFile`) and are currently benign (byte copies / deploy config), but nothing structural prevents sync work — including import rewriting — from living in a script simply named without "sync".

**Evidence**: Enumerated `scripts/` and cross-checked writer usage against the pattern; the two matched scripts are the only ones scanned, and the current `quick-sync.js` content passes all forbidden patterns (verified by reading it; suite green for this file).

**Impact**: Low today (the only import-rewriting script is scanned), but the coverage is by naming convention rather than by behavior; a renamed or new sync script silently leaves the contract unenforced.

**Suggestion**: Either scan all `scripts/*.{js,mjs,cjs,ts}` for the forbidden write patterns (they are specific enough), or add an explicit allowlist of non-sync script names so a new writer script forces a conscious decision.

---

## Checked and found sound (no findings)

- **Fail-loud on I/O errors**: `collectRepositoryEntries`/`collectRepositoryTextFiles` let `readdir`/`stat`/`readFile` errors propagate — unreadable files fail the tests, no silent skipping.
- **No stale allowlist entries**: `routeTree.gen.ts` exists (`apps/web/src/routeTree.gen.ts`); all 8 `allowedFormedibleDocImports` specifiers resolve to real modules under `packages/formedible/src/`.
- **No registry mirrors**: no `registry/` directory exists anywhere in the tree; the prefix check is exact and correct for its scope.
- **`no-fake-formedible-import-surface`**: path regex is properly boundary-anchored (`(^|\/)generated\/formedible(\/|$)`), and its import extractor covers static, require, and dynamic forms (it is the richer extractor referenced in Finding 5).
- **`shadcn-primitive-usage`**: `fields/.*\.tsx$` correctly covers nested subdirectories; the raw-HTML regex matches both quote/attribute forms; scope limited to the owner package is consistent with the copy-only model.
- **`quick-sync.js` vs. the forbidden patterns**: the real sync script passes all patterns for the right reasons (content argument is a pass-through function call, not a literal), i.e. the scans are calibrated to the real file.
