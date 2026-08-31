# Formedible Performance Benchmark And TanStack Modernization Orchestration Plan

## Purpose

Two outcomes, executed in order:

1. **TanStack modernization (Phase 0)**: bring every `@tanstack/*` dependency the repo uses to its latest published version, migrating `packages/ai-builder` AI code where provider/`@tanstack/ai` APIs changed, with all repo gates green at every step.
2. **Performance benchmark suite (Phases 1-4)**: a reproducible, browser-based benchmark harness (real Chromium driven by `agent-browser` is the sole UI measurement medium; node remains only for the DOM-free parser scenarios) that produces real-world performance numbers for the current implementation and for the old implementation on the `main` branch (a Next.js-era, monolithic-hook, npm-based architecture), with an artifact format, a compare/report script, and regression gates, so progress and regressions are visible over time.

This plan is written for execution with the `subagent-orchestration` workflow: every phase has an implementer, a validator right after the implementer, and a fixer loop if validation fails. Multi-sub-phase phases additionally get a phase-wide validator.

## Prerequisites

- Node v24.x, pnpm 10.10.0 (repo `packageManager`), npm 10.x available for the `main` baseline worktree (`main` uses npm with `package-lock.json`).
- Network access for `pnpm view`, `pnpm install`, and `npm ci`.
- `agent-browser` ^0.27.0 (already a root devDependency) with a working Chromium install (`pnpm exec agent-browser doctor` reports healthy).
- Clean working tree on branch `re-codex` before Phase 0 starts.
- No dev servers left running. Benchmark scripts spawn and stop their own `vite preview`/static servers on allocated ports (see `tests/consumer-smoke/utils/ports.ts` for the port-allocation pattern).

## Version Snapshot (verified 2026-08-31 via `pnpm view`)

Direct dependencies declared by workspace packages:

| Package | Declared / locked (current) | Latest | Used by |
| --- | --- | --- | --- |
| `@tanstack/react-form` | `^1.27.1` / 1.33.5 | **1.33.5** (already latest) | formedible, formedible-parser, builder, ai-builder, ai-picker, ui, web |
| `@tanstack/react-query` | `^5.99.0` / 5.100.6 | 5.102.8 | apps/web |
| `@tanstack/react-router` | `^1.168.22` / 1.168.25 | 1.170.32 | apps/web |
| `@tanstack/react-router-devtools` | `^1.166.13` / 1.166.13 | 1.167.1 | apps/web (dev) |
| `@tanstack/react-start` | `^1.167.41` / 1.167.50 | 1.168.49 | apps/web |
| `@tanstack/ai` | `^0.16.0` / 0.16.0 | **0.52.0** | ai-builder, ai-picker, ui, web |
| `@tanstack/ai-anthropic` | `^0.8.6` / 0.8.6 | 0.18.3 | ai-builder, ai-picker, ui, web |
| `@tanstack/ai-openai` | `^0.8.5` / 0.8.5 | 0.22.3 | ai-builder, ai-picker, ui, web |
| `@tanstack/ai-openrouter` | `^0.8.5` / 0.8.5 | 0.19.5 | ai-builder, ai-picker, ui, web |

Transitive-only packages (`form-core` 1.33.5, `react-store` 0.11.1 + a stale 0.9.3, `store`, `router-core`, `router-plugin`, `start-plugin-core`, `ai-client`, `ai-event-client`, `ai-utils`, `openai-base`, `pacer-lite`, `history`, `query-core`, devtools/event clients) update as a consequence of the direct bumps and are only verified, never edited by hand.

Important facts discovered by inspecting the actual published packages (not guessed):

- The AI family jump is far larger than "0.16 → 0.18": the latest providers peer on `@tanstack/ai@^0.52.0` (`ai-anthropic@0.18.3`, `ai-openai@0.22.3`, `ai-openrouter@0.19.5` all declare it).
- The `chat()` core options our code uses survive in 0.52: `adapter`, `messages`, `systemPrompts`, `temperature`, `maxTokens`, `modelOptions`, `abortController`. `conversationId` is **deprecated in favor of `threadId`** (`@tanstack/ai` 0.52 `types.d.ts` marks it legacy with fallback).
- Provider factory signatures keep the `(model, apiKey, config?)` shape (`createOpenaiChat`, `createAnthropicChat`, `createOpenRouterText` all verified in the latest tarballs). `AnthropicTextConfig` now extends the Anthropic SDK `ClientOptions` (so `dangerouslyAllowBrowser` still applies); `OpenAITextConfig` extends the OpenAI client config; `OpenRouterText` config is `SDKOptions`.
- `ChatStreamSummarizeAdapter` (the migration named in earlier notes) is NOT imported anywhere in this repo today. The real migration surface is: `packages/ai-builder/src/lib/formedible/ai-adapters.ts` (~99 lines), `ai-generation.ts` (~405 lines), `ai-messages.ts` (~161 lines) — plus their quick-sync copies in `packages/ui/src/components/formedible/lib/`. `ai-storage.ts`, `ai-stream-scheduler.ts`, `ai-types.ts` have no `@tanstack/*` imports.
- New heavyweight transitives arrive with the AI bump: `@anthropic-ai/sdk` ^0.97.1, `openai` ^6.41, `@openrouter/sdk`, `@ag-ui/core`, `@standard-schema/spec`, `partial-json`, `@tanstack/ai-utils` ^0.4, `@tanstack/ai-event-client` ^0.11. `@opentelemetry/api` is an **optional** peer of `@tanstack/ai` (verified `peerDependenciesMeta`) — do not add it unless a real error demands it.
- `@tanstack/react-form@1.33.5` is the latest release; no bump exists to make. `@tanstack/react-store` appears twice in the lockfile (0.9.3 and 0.11.1); `react-form@1.33.5` depends on `^0.11.0`, so 0.9.3 is stale residue to investigate and consolidate.
- Model literal catalogs changed between provider versions. `DEFAULT_TANSTACK_AI_MODELS` in `ai-adapters.ts` (`gpt-5.4-mini`, `claude-sonnet-4-6`, `minimax/minimax-2.7`) must still exist in the new catalogs; `ai-model-catalog.test.ts` and type checks will catch drift.

Orchestrator rule: Phase 0 sub-phase 0.1 re-runs `pnpm view <pkg> version` for every package in the table above on execution day. If a newer version shipped since this snapshot, target the newest; the snapshot here records intent, not a pin.

## Orchestration Rules (global, every phase)

1. Follow repo `AGENTS.md` exactly: no `any`/`as any`/`: any`; no `await import()` (static imports only); no `confirm`/`alert`; `import type` for type-only imports; never start a dev server.
2. Formedible core fixes happen in `packages/formedible/src/` then `pnpm run build:pkg` → `node scripts/quick-sync.js` → `pnpm run check-types`. AI adapter/lib files are owned by `packages/ai-builder/src/lib/formedible/` and sync out to `packages/ui` (see `scripts/quick-sync.js` routes); fix them in the owner, rebuild, re-sync. Never hand-edit synced copies.
3. Every implementer and fixer runs the phase's gatekeeping commands before reporting done. Every validator actually reads the changed files line by line, then runs the gates.
4. NO-SLOP policy from the `subagent-orchestration` skill applies to every dispatch: no placeholders, no TODO/FIXME, no unused imports/variables, no console.log suppression hacks.
5. Implementers may not weaken or delete existing tests to make gates pass.
6. Benchmark code is test infrastructure: it must typecheck under the repo's strict config like any other code (no `any`, no skipped strictness), and must not be imported by app runtime code.
7. Benchmarks must be deterministic in shape: fixed seeds for any generated data, fixed iteration counts, fixed N-run medians, and recorded environment metadata. No wall-clock assertions in CI paths.

## Baseline Fairness Policy (decided, see DECISION-1)

The `main` branch implementation runs on **its own pinned dependencies** inside a dedicated git worktree, and the current implementation runs on the updated dependencies from Phase 0. Rationale:

- `main`'s `packages/formedible` peers `@tanstack/react-form@^1.28.5`; forcing it onto form-core 1.33 is an unsupported configuration that may not even compile, and would measure a fiction.
- "Real-world performance" means what a consumer of each branch actually experienced, which includes each branch's dependency set.
- Every artifact record embeds the resolved versions, so any comparison states exactly what ran.

Consequences that implementers must honor:

- Both implementations execute the **same scenario definitions** (same field schemas, same keystroke sequences, same iteration counts, same N-run medians) through a thin adapter interface.
- The scenario field set is restricted to the lowest common denominator both implementations support: `text`, `email`, `password`, `textarea`, `number`, `select`, `checkbox`, `switch`, `radio`, plus `array` (primitive + object items), `pages`, and zod `schema` submit. Advanced current-only field types stay out of cross-implementation scenarios; current-only scenarios (streaming, bundle, and the browser-native instrumentation extras) are tracked over time instead of compared against `main`.
- Known behavioral divergences are annotated in the report, not hidden: `main` gates page navigation on per-page validation while the rewrite navigates freely (see `FROM-SCRATCH-2.md` D12), and `currentPage` semantics differ (D11). The `pageswitch-*` scenario is reported with a divergence note.
- Cross-implementation timing runs execute sequentially on the same machine, never concurrently, to avoid CPU contention noise (12-core box, unrelated background load unknown and recorded as a caveat, not a variable).

## Decisions (defaults pre-approved; orchestrator proceeds without stopping)

> **Revision 2026-08-31 (user override, mid-execution)**: jsdom is REJECTED as a source of benchmark values — jsdom numbers are not real-world numbers. Real Chromium driven by `agent-browser` is now the primary and ONLY UI timing medium. DECISION-2/3/6 below carry the revised text; the Phase 1 rework removes the already-committed jsdom artifacts while the medium-independent modules (scenario data, timing statistics, artifact IO) are reused.

- **DECISION-1 Baseline dependency policy**: each implementation on its own pinned dependencies (adopted, rationale above). Alternative rejected: force both onto identical `@tanstack/*` versions.
- **DECISION-2 Primary timing environment (REVISED — user override 2026-08-31)**: Real Chromium via `agent-browser` is the PRIMARY and ONLY UI timing medium. Measurements come from: in-page `performance.now()` via agent-browser JS evaluation (scenario loops run in-page, samples returned to the driver); `agent-browser --enable react-devtools` + `react renders start/stop --json` render counts; `profiler start/stop` traces; and `vitals --json`. jsdom is REMOVED from the bench tree entirely — no jsdom mount helpers, no jsdom adapters. The timing stats math (warmup/median/p75/min/max, N-run medians) is unchanged, applied to browser-collected samples. Fixtures are committed vite apps served with `vite preview` on allocated ports (port-book pattern), spawned/stopped by the bench scripts in `finally` blocks. Two scenario-specific rulings under the same override:
  - **Memory (`memory-500`)**: measured in-browser via agent-browser JS evaluation of the heap APIs available in Chromium (e.g. `performance.memory` / `PerformanceObserver`); forced GC is NOT assumed — the scenario records the API used and any caveat as an artifact note. Node's `process.memoryUsage` stays only for parser scenarios if useful.
  - **Streaming (`stream-100chunks`)**: the scheduler + transcript fixture runs INSIDE the browser fixture (real React commits), render counts via react-devtools instrumentation.
  - Alternative rejected: jsdom-primary with a browser subset (the original decision — overridden; its premise that jsdom numbers are acceptable directional values is exactly what the user rejected).
- **DECISION-3 Smoke subset (REVISED)**: exactly four fast scenarios in `bench:smoke` — `mount-50`, `typing-50`, `submit-50` (browser) + `parser-medium` (node, no DOM) — with N=5 runs. Full suite keeps N=25 for timing scenarios.
- **DECISION-4 Results retention**: `tests/bench/results/reference.json` (current-implementation reference for regression gating) is committed. Timestamped run artifacts (`tests/bench/results/runs/*.json`) are gitignored. The report always reads the newest artifact per implementation from `runs/`.
- **DECISION-5 Baseline worktree location**: sibling directory `../Formedible-main-baseline` (override with `FORMEDIBLE_MAIN_WORKTREE` env var), created by `git worktree add`. Alternative rejected: inside the repo (risks scanner false positives from `tests/architecture` scans and nested workspace confusion).
- **DECISION-6 Main browser fixture (REVISED)**: the `main` implementation ALSO gets a browser fixture — cross-comparable UI scenarios must run in-browser for BOTH implementations. Mechanism: a committed fixture app whose vite config aliases (a) the formedible source imports to the baseline worktree's source and (b) the pinned runtime deps (at minimum `@tanstack/react-form`, `react`, `react-dom`, and anything else main's source imports from its own tree) to the WORKTREE's installed `node_modules` — preserving DECISION-1 isolation (each implementation runs its own dependency set) inside one fixture pattern. If a dependency cannot be cleanly aliased, the implementer records it as a finding with the exact blocker; silently falling back to jsdom is FORBIDDEN (the bench tree no longer contains jsdom to fall back to).
- **DECISION-7 Regression gate thresholds**: versus `reference.json`, a **headline metric** (`mount-100`, `typing-50`, `submit-100`, `bundle-minimal`) regressing more than **10%** fails with exit code 1; a secondary metric regressing more than **25%** also fails with exit code 1; missing metrics warn but pass. `--allow-regression` flag downgrades failures to warnings (for exploratory runs).

---

## Phase 0: TanStack Dependency Modernization

**Type**: Sequential (three sub-phases, then a phase-wide validation). Order rationale: form family first because it is expected to be a no-op verify (cheap gate check that the toolchain is healthy), then the apps/web-only router cluster (isolated to one package), then the AI family last because it carries real code migration and must not be entangled with the other two.

### 0.1: Form Family Verification And Lockfile Hygiene

**Requirements**:

1. Re-run `pnpm view @tanstack/react-form version` and `pnpm view @tanstack/form-core version`. If newer than 1.33.5, update the `@tanstack/react-form` range in every workspace package that declares it (`packages/formedible`, `packages/formedible-parser`, `packages/builder`, `packages/ai-builder`, `packages/ai-picker`, `packages/ui`, `apps/web`) — prefer adding `"@tanstack/react-form": "^1.x"` to `pnpm-workspace.yaml` catalog and switching declarations to `catalog:` if that reduces drift; otherwise keep per-package ranges consistent.
2. Verify 1.33.5 is the actually-latest: if no bump occurred, this sub-phase's dependency outcome is "verified latest, no change".
3. Investigate the dual `@tanstack/react-store` (0.9.3 + 0.11.1) and `@tanstack/store` resolution in `pnpm-lock.yaml` with `pnpm why @tanstack/react-store`. If 0.9.3 is stale residue (nothing requires it after resolution refresh), remove it via a clean `pnpm install` refresh; if a real consumer pins it, identify it in the sub-phase report and leave it (do not force).
4. Do not touch source code in this sub-phase unless type errors demand it (none expected: react-form stays 1.33.5).

**Inputs**:
- Read: root `package.json`, `pnpm-workspace.yaml`, all seven workspace `package.json` files listed above.
- Reference: the Version Snapshot table in this plan.

**Outputs**:
- Modify: `pnpm-lock.yaml`; optionally `pnpm-workspace.yaml` + workspace `package.json` files (catalog move or range updates).

**Validation Criteria**:
- `pnpm install` exits 0 with no unmet-peer errors.
- `pnpm run check-types` passes (all packages).
- `pnpm run build` passes.
- `pnpm why @tanstack/react-store` output explained in the implementer's report (single version, or named reason for dual).

**Dependencies**: None (first sub-phase).

### 0.2: apps/web Router/Start/Query Cluster Update

**Requirements**:

1. Update in `apps/web/package.json` only: `@tanstack/react-query` → latest 5.x, `@tanstack/react-router` → latest 1.x, `@tanstack/react-router-devtools` → latest, `@tanstack/react-start` → latest 1.x (see Version Snapshot; re-verify with `pnpm view` on execution day). Keep the existing caret-range style.
2. Run `pnpm install` from the repo root; confirm the router/start cluster transitives (`router-core`, `router-plugin`, `start-plugin-core`, `start-client-core`, `start-server-core`, `router-generator`, `router-utils`, `history`, `virtual-file-routes`, `query-core`) resolve to a coherent set without peer warnings.
3. Fix any breaking changes in `apps/web/src` (route tree is generated by `@tanstack/react-start` tooling — regenerate via the package's normal build if the generated files fail typecheck; generated files under the app are tooling output and may be regenerated, never hand-patched).
4. Do not modify `packages/*` in this sub-phase.

**Inputs**:
- Read: `apps/web/package.json`, `apps/web/vite.config.ts`, generated route tree files under `apps/web/src/routeTree.gen.ts` (or equivalent).

**Outputs**:
- Modify: `apps/web/package.json`, `pnpm-lock.yaml`, regenerated route-tree output if required, minimal `apps/web/src` fixes for API breaks.

**Validation Criteria**:
- `pnpm run check-types:web` passes.
- `pnpm run build:web` passes (vite build incl. prerender).
- `pnpm run check-types` (all) still passes.

**Dependencies**: 0.1 complete.

### 0.3: TanStack AI Family Update And Code Migration

**Requirements**:

1. Update `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openai`, `@tanstack/ai-openrouter` to latest (0.52.0 / 0.18.3 / 0.22.3 / 0.19.5 as of the snapshot; re-verify with `pnpm view`) in every package that declares them: `packages/ai-builder/package.json`, `packages/ai-picker/package.json`, `packages/ui/package.json`, `apps/web/package.json`. Keep the four versions identical across packages.
2. Run `pnpm install`; verify peers resolve (all providers peer `@tanstack/ai@^0.52`; `@opentelemetry/api` optional peer may stay uninstalled).
3. Migrate owner code in `packages/ai-builder/src/lib/formedible/`:
   - `ai-generation.ts`: replace deprecated `conversationId` with `threadId` (verify fallback semantics in the installed `@tanstack/ai` types; keep passing the same value). Verify `chat()` option names against the installed `@tanstack/ai` `.d.ts` — do not guess. Consider adopting the newly exported `normalizeStreamChunk` utility ONLY if it strictly simplifies `normalizeTanStackStreamChunk` without changing our public `AiStreamEvent` shape; otherwise keep our normalizer (it already handles AG-UI `TEXT_MESSAGE_CONTENT`/`REASONING_MESSAGE_CONTENT` and legacy `text-delta` shapes — verify each branch still matches 0.52 chunk types).
   - `ai-adapters.ts`: verify `createOpenaiChat`/`createAnthropicChat`/`createOpenRouterText` signatures, `dangerouslyAllowBrowser` config acceptance, and the `AnthropicTextProviderOptions` thinking-budget shape (`{ thinking: { type: 'enabled', budget_tokens } }`) against the installed packages. Update `DEFAULT_TANSTACK_AI_MODELS` if any model id no longer exists in the new `OPENAI_CHAT_MODELS` / `ANTHROPIC_MODELS` / OpenRouter model catalogs, choosing the closest current equivalent per provider.
   - `ai-messages.ts`: verify `ModelMessage` generic constraints (`ModelMessage<string>` usage) still typecheck.
4. Follow the repo sync workflow after owner edits: `pnpm run check-types` on ai-builder, then `node scripts/quick-sync.js` so `packages/ui/src/components/formedible/lib/ai-*.ts` receive the migrated files, then `pnpm run check-types` (all).
5. Run the AI-related behavior tests: `pnpm --filter @formedible/ai-builder run test` and `pnpm --filter @formedible/ai-picker run test` (ai-picker's src has no direct `@tanstack/*` imports — its tests should pass unchanged; its dependency declarations are updated purely for install parity with what its synced/registry files expect).
6. No network calls in tests: the existing tests inject `streamFactory`/fetcher fakes; keep it that way. Do not add tests that call real providers.

**Inputs**:
- Read: `packages/ai-builder/src/lib/formedible/ai-adapters.ts`, `ai-generation.ts`, `ai-messages.ts`, `ai-types.ts`, `ai-model-catalog.ts`, `packages/ai-builder/src/components/formedible/ai/chat-interface.tsx`, the installed `.d.ts` files under `node_modules/@tanstack/ai/dist/esm/types.d.ts` and the provider packages' `adapters/text.d.ts`.
- Reference: `docs/ai-builder-tanstack-client-orchestration-plan.md` (original AI-builder constraints: client-side only, TanStack AI not Vercel SDK, BYOK handling).

**Outputs**:
- Modify: `packages/ai-builder/package.json`, `packages/ai-picker/package.json`, `packages/ui/package.json`, `apps/web/package.json`, `pnpm-lock.yaml`, `packages/ai-builder/src/lib/formedible/ai-adapters.ts`, `ai-generation.ts`, `ai-messages.ts` (and `ai-model-catalog.ts`/`ai-types.ts` only if needed), synced copies under `packages/ui/src/components/formedible/lib/` via quick-sync only.

**Validation Criteria**:
- `pnpm install` clean; single `@tanstack/ai` version in `pnpm-lock.yaml`.
- `pnpm run check-types` (all packages) passes.
- `pnpm run build` passes.
- `pnpm --filter @formedible/ai-builder run test` and `pnpm --filter @formedible/ai-picker run test` pass.
- `grep -rn "conversationId" packages/ai-builder/src/lib/formedible/` shows no deprecated usages (renamed to `threadId` or removed).
- No `@opentelemetry/api` added unless a documented error required it.

**Dependencies**: 0.2 complete (keeps router churn out of the AI diff).

### Phase 0 Phase-Wide Validation

After 0.1-0.3 pass individually, one phase-wide validator:

1. Reads every modified manifest and migrated file together; confirms the four AI packages are version-identical across all declarers; confirms no synced copy was hand-edited (`node scripts/quick-sync.js` idempotency check: run it, `git status` must show no further changes).
2. Runs the full gate set: `pnpm run check-types`, `pnpm run build`, `pnpm run test:formedible:normalization`, `pnpm run test:formedible:basic-fields`, `pnpm run test:sync`, `pnpm run test:consumer-smoke:vite-base` (slow but this is the real-consumer proof for the dependency change), `pnpm run test:e2e` (web on the updated router/start stack).
3. Produces the resolved-version table (implemented vs. this plan's snapshot) recorded in the phase report — Phase 4 embeds these versions in benchmark artifacts.

---

## Phase 1: Benchmark Foundations (Current Implementation)

**Type**: Sequential.

**Rework note (revision 2026-08-31)**: Phase 1 already executed under the superseded jsdom decision. This rework splits the committed output: `tests/bench/lib/scenarios/forms.ts`, `tests/bench/lib/scenarios/index.ts`, `tests/bench/lib/bench-timing.ts` (stats math), `tests/bench/lib/artifacts.ts`, and the adapter contract in `tests/bench/lib/adapter-types.ts` are REUSED (pure scenario data, timing statistics, artifact IO — medium-independent). The jsdom artifacts — `tests/bench/lib/render-client.ts`, `tests/bench/lib/dom-bootstrap.ts`, the jsdom adapter mount path in `adapter-current.ts`, and `perf-probe.ts` (built on the jsdom render client) — are scheduled for DELETION in this rework. No jsdom mount helper or jsdom adapter survives anywhere under `tests/bench/` (DECISION-2 revised).

**Prerequisite**: `pnpm exec agent-browser doctor` reports healthy (working Chromium) before any bench run; a red doctor is a hard stop, never a fallback trigger.

**Requirements**:

1. Keep `tests/bench/tsconfig.json` (per-suite convention, `tests/formedible/tsconfig.basic-fields.json` pattern): extends `packages/config/tsconfig.base.json`, `jsx: react-jsx`, DOM libs, `paths` mapping `@/*` for direct source imports from `packages/formedible/src` — including the dual formedible/formedible-parser mapping and the explicit `registry-dependencies.d.ts` include already proven by the committed tsconfig.
2. Create the committed vite fixture `tests/bench/fixtures/current-consumer/` (`index.html`, `main.tsx`, `vite.config.ts`, `tsconfig.json`):
   - Imports formedible from local source via a vite alias (`@/hooks/use-formedible` → `packages/formedible/src/hooks/use-formedible`, the fixture-side twin of the bench tsconfig mapping).
   - Renders the scenario forms from the SHARED scenario definitions — it consumes the `tests/bench/lib/scenarios/forms.ts` generators directly; the fixture contains no form-config data of its own.
   - Selects the mounted form via a `?scenario=<id>` query-param switch, so one committed fixture serves every scenario.
   - Exposes an in-page harness surface (a `window` global taking JSON-serializable requests and returning JSON-serializable results) that the driver invokes to run scenario operation loops in-page with `performance.now()` sampling.
3. Create `tests/bench/utils/agent-browser.ts` — the bench driver, modeled on `tests/e2e/utils/agent-browser.ts` (per-suite utils are the established convention here): wraps `pnpm exec agent-browser --session <bench-session>` invocations (`execFile`, JSON output parsing, `AGENT_BROWSER_MAX_OUTPUT`) and implements the `BenchAdapter` operations from `adapter-types.ts` (mount, keystroke, switchPage, switchTab, arrayAdd, arrayRemove, submit, persistenceSave, getRenderedFieldCount) against the real page. Timing loops run in-page: the driver evaluates a script that executes the scenario operation warmup + measured runs with `performance.now()` around each run and returns the samples array; the driver summarizes those samples with the unchanged `bench-timing.ts` stats helpers — identical warmup/median/p75/min/max math, applied to browser-collected samples. The driver opens timing scenarios WITHOUT devtools instrumentation; render-count scenarios (Phase 3.2) are the instrumented ones, so instrumentation never contaminates timing medians.
4. Carry over the already-built modules unchanged in role: the scenario registry (`scenarios/index.ts`, including `submit-50`), the deterministic generators (`scenarios/forms.ts`), the timing statistics (`bench-timing.ts`), the artifact IO (`artifacts.ts`), and the adapter contract (`adapter-types.ts`).
5. Rework `tests/bench/lib/run.ts` as the current-implementation runner: for each scenario — allocate a port (`tests/consumer-smoke/utils/ports.ts` pattern), spawn `vite preview` for the fixture on that port, open the scenario URL via the driver, execute the in-page timing loop, collect the samples, write the artifact record; the preview server is stopped and the agent-browser session closed in `finally` so a failing run never leaks processes or ports. CLI flags stay: `--smoke` (DECISION-3 subset, N=5), `--only <scenario-id>` (repeatable), `--runs <n>`. Scenario set: `mount-10`/`mount-50`/`mount-100`, `typing-10`/`typing-50`/`typing-100` (typing = 100 input events into one field, report ms/keystroke median), `submit-10`/`submit-50`/`submit-100` (zod validation + `onSubmit` round-trip via `formOptions.onSubmit`) — all browser — plus `parser-medium` (node, no DOM: imports `FormedibleParser` from `packages/formedible-parser/src`, parses a medium config 50 times). Prints a results table to stdout and writes the artifact.
6. Root scripts `bench` (full) and `bench:smoke` in root `package.json`: typecheck, then spawn the fixture server on an allocated port, drive agent-browser, tear down in `finally`. `tsc -p tests/bench/tsconfig.json` stays in the root `check-types` script chain (this repo requires every new surface to typecheck in the aggregate gate).
7. `.gitignore` keeps ignoring `tests/bench/results/runs/` (DECISION-4).
8. Delete the jsdom artifacts named in the rework note: `render-client.ts`, `dom-bootstrap.ts`, `perf-probe.ts`, and the jsdom mount path in `adapter-current.ts` (its adapter operations are implemented by the driver from requirement 3).

**Inputs**:
- Read: `tests/e2e/utils/agent-browser.ts` (driver pattern: execFile wrapper, sessions, JSON parsing, server spawn/stop discipline), `tests/consumer-smoke/utils/ports.ts` (port allocation), `packages/formedible/src/hooks/use-formedible.tsx` public return shape, `tests/compatibility-examples/core-examples.ts` (field-config shapes proven to work), the committed Phase 1 survivors listed in the rework note.

**Outputs**:
- Create: `tests/bench/fixtures/current-consumer/` (`index.html`, `main.tsx`, `vite.config.ts`, `tsconfig.json`), `tests/bench/utils/agent-browser.ts`.
- Modify: `tests/bench/lib/run.ts` (fixture-server + agent-browser orchestration), `tests/bench/lib/adapter-current.ts` (jsdom mount path removed; the current-implementation adapter surface is provided through the driver), root `package.json` (bench scripts), `.gitignore` (verify the runs/ ignore stays).
- Delete: `tests/bench/lib/render-client.ts`, `tests/bench/lib/dom-bootstrap.ts`, `tests/bench/lib/perf-probe.ts`.

**Validation Criteria**:
- `pnpm exec agent-browser doctor` healthy.
- `pnpm run check-types` passes including the bench tsconfig and the new fixture.
- `pnpm run bench:smoke` completes, prints a table with the four smoke scenarios (three browser + `parser-medium`), and writes an artifact file with valid records (validator inspects the JSON; the UI records carry browser-collected medians).
- Running `pnpm run bench:smoke` twice produces medians within reasonable same-machine variance (validator records both runs; no hard threshold at this phase, but >50% swings must be investigated and reported).
- No orphan processes or ports after a completed run AND after a deliberately failing run (`finally` teardown verified by the validator).
- Scenario ids in artifacts exactly match the registry ids; `comparable` flags correct.
- Code review: the driver contains no implementation-conditional logic; scenarios import nothing from `packages/*` except types where unavoidable (they must build form-config data only); no jsdom import or mount helper remains anywhere under `tests/bench/`.

**Dependencies**: Phase 0 complete (benchmarks run on the updated dependency set).

---

## Phase 2: Main Baseline Worktree And Baseline Fixture

**Type**: Sequential.

**Requirements**:

1. Keep `tests/bench/lib/baseline-worktree.ts` as committed: idempotent setup/refresh of the baseline worktree.
   - Default path `../Formedible-main-baseline`, overridable via `FORMEDIBLE_MAIN_WORKTREE` (DECISION-5).
   - `--setup`: `git worktree add <path> main` (skip if exists), then `npm ci` inside the worktree (main is npm-based with a committed `package-lock.json`).
   - `--refresh`: reset worktree to local `main` HEAD and re-run `npm ci` only when the recorded HEAD changed (persist last-setup SHA in `<worktree>/.bench-setup.json`).
   - `--check`: verifies worktree exists, is on `main`, has `node_modules`, and prints the SHA + resolved `@tanstack/react-form` version from the worktree's installed tree.
2. Implement the main baseline via the ALIASED FIXTURE (DECISION-6 revised) — not via in-process worktree imports of main's UI source. Create `tests/bench/fixtures/main-consumer/` with the same shape and `?scenario=` switch as `current-consumer/`, whose vite config aliases:
   - main's formedible source imports (`@/hooks/*`, `@/components/*`, `@/lib/*` — main's self-aliases) to `<worktree>/packages/formedible/src/*`;
   - the pinned runtime deps — at minimum `@tanstack/react-form`, `react`, `react-dom`, and anything else main's formedible source imports from its own tree — to the WORKTREE's installed `node_modules`.
   The worktree path is injected from `FORMEDIBLE_MAIN_WORKTREE` at serve time through a committed template (no absolute machine paths committed — the same pattern `tsconfig.main.template.json` already established). This preserves DECISION-1 isolation inside one fixture pattern: the served main page runs main's source against main's dependency set. If a dependency cannot be cleanly aliased, the implementer records a finding with the exact blocker; silently falling back to jsdom is FORBIDDEN (the bench tree has no jsdom left).
3. Dependency-isolation assertion (replacing the old in-process import-and-print check): the served main fixture's page REPORTS its resolved runtime versions via in-page JS — the fixture exposes the aliased `@tanstack/react-form` version on the benchmark harness global, and `run-main.ts` evals it and asserts it equals the worktree's installed version (main's pinned 1.29.x line) before measuring. The artifact's `versions` block records what the page actually resolved.
4. Rework `tests/bench/lib/run-main.ts`: same runner shape as `run.ts`, executing the `comparable: 'cross'` scenarios through the SAME driver against the served main fixture (UI scenarios: browser), plus the node-side `parser-*` scenarios, which still import main's `packages/formedible-parser` from the worktree in-process under `tests/bench/tsconfig.main.json` (the generated-from-template worktree tsconfig survives for the parser path only). Delete the jsdom/in-process UI mount path from `adapter-main.ts`; where main's semantics differ (page-navigation validity gating, D11/D12), the driver implements the operation as "switch to page N" and `run-main.ts` records the divergence note on `pageswitch-*` artifacts, exactly as before. Artifacts carry `implementation: 'main'` and the worktree's resolved versions (page-reported for UI, manifest-read for parser).
5. Root scripts unchanged: `bench:baseline:setup` (runs `baseline-worktree.ts --setup`), `bench:baseline` (assumes setup done; fails with a pointer to `bench:baseline:setup` if the worktree is missing).
6. Execute one baseline run producing `tests/bench/results/runs/<iso>-main.json` covering the cross-comparable scenarios (browser UI + node parser).

**Inputs**:
- Read: `git show main:packages/formedible/src/hooks/use-formedible.tsx` (return shape AND its import surface — that import list enumerates exactly which dependencies the fixture must alias), `git show main:packages/formedible/package.json` (peer pins), main's `packages/formedible-parser` entry for the parser scenario, the Phase 1 driver, fixture, adapter contract, and scenario registry.

**Outputs**:
- Create: `tests/bench/fixtures/main-consumer/` (`index.html`, `main.tsx`, vite config template, `tsconfig.json`).
- Modify: `tests/bench/lib/run-main.ts` (fixture orchestration + in-page version assertion), `tests/bench/lib/adapter-main.ts` (jsdom/in-process UI mount path removed; main adapter surface provided through the driver), `tests/bench/lib/formedible-main-bridge.d.ts` (reduced to the parser surface the node path still imports; the main-hook module declaration goes with the in-process UI mount).
- Delete: nothing else — `baseline-worktree.ts`, `tsconfig.main.template.json` stay as committed.

**Validation Criteria**:
- `pnpm run bench:baseline:setup` succeeds from a clean state and is idempotent on re-run.
- `pnpm run bench:baseline` completes, writes a valid `implementation: 'main'` artifact, and its resolved-versions block reports main's pinned `@tanstack/react-form` (1.29.x line) as resolved INSIDE the served page — proving DECISION-1 isolation in the browser medium.
- `pnpm run bench:smoke` (current) and `pnpm run bench:baseline` (main) artifacts exist side by side; record ids align one-to-one for `comparable: 'cross'` scenarios.
- Worktree is outside the repo; `git status` in the main repo is unaffected by setup; `pnpm run test:architecture` still passes (no scanner false positives).
- Code review: no absolute machine paths committed (template + env var only); any un-aliasable dependency appears as a findings entry with the exact blocker, never as a silent medium switch.

**Dependencies**: Phase 1 rework complete.

---

## Phase 3: Full Scenario Coverage

**Type**: SEQUENTIAL (3.1 then 3.2, followed by a phase-wide validator). This is a change from the original parallel scheduling: 3.1 and 3.2 BOTH modify `tests/bench/lib/run.ts` and the scenario registry, so dispatching them simultaneously would collide on the same files. Dispatch 3.1 first, then 3.2.

### 3.1: Extended Browser Scenarios (Both Implementations)

**Requirements**:

1. Extend the scenario registry and both runners/drivers with:
   - `pageswitch-50`: switch through all pages of the 5-page form 10 times via the driver; metric `ms-per-switch` median; divergence note recorded for `main` (D12 nav gating changes what a switch does when the page is invalid — scenario keeps all pages valid so the paths stay comparable).
   - `tabswitch-50`: same shape for the 4-tab form, driven in-browser.
   - `array-50`: 20 `add` operations + 20 `remove` operations on the array form via the driver; metric `ms-per-op` median.
   - `autosave-50`: typing-50 workload with `persistence` autosave enabled vs. disabled; artifact records BOTH measurements; metric `autosave-overhead-ms` = median(with) - median(without) (may be negative; report raw deltas, not abs).
   - `memory-500`: 500 interleaved interactions (type/switch/add) on the 50-field form, measured IN-BROWSER via agent-browser JS evaluation of the heap APIs Chromium exposes (e.g. `performance.memory` / `PerformanceObserver`). Forced GC is NOT assumed — the scenario records the API used and any caveat as an artifact note. Metrics `heap-growth-mb` and retained-growth slope `mb-per-100-interactions` (second metric) stay. Node's `process.memoryUsage` remains only for parser scenarios if useful. (This replaces the jsdom `--expose-gc` design; `bench:full` no longer spawns `node --expose-gc`.)
   - `parser-small` / `parser-large`: complete the parser throughput triple (node, no DOM, both implementations; main's `packages/formedible-parser` is imported from the worktree in `run-main.ts`).
2. Keep every scenario deterministic (fixed op sequences) and every record tagged `comparable: 'cross'` unless genuinely current-only.

**Outputs**:
- Create: `tests/bench/lib/scenarios/extended.ts` (or extend `forms.ts`/`index.ts`).
- Modify: `tests/bench/lib/run.ts`, `run-main.ts`, `tests/bench/utils/agent-browser.ts` (new in-page interaction/heap operations), root `package.json` (`bench:full` script — no `--expose-gc`).

**Validation**:
- Both `pnpm run bench:full` (current) and `pnpm run bench:baseline` complete; artifacts contain all extended scenarios with matching ids.
- `memory-500` records the heap API used (and any caveat) as artifact notes; no GC-forcing assumption anywhere.
- `pnpm run check-types` passes.

### 3.2: Streaming, Browser-Native Metrics, And Bundle Size (Current-Only)

**Requirements**:

1. `stream-100chunks` (current-only): the scheduler + transcript fixture runs INSIDE the browser fixture — the fixture's streaming scenario mounts a minimal transcript component fed by `AiStreamScheduler` (`packages/ai-builder/src/lib/formedible/ai-stream-scheduler.ts`) with 100 synthetic text-delta events and simulated 16ms frame ticks, all in-page (real React commits). Metrics: `renders-per-100-chunks` via `--enable react-devtools` + `react renders start/stop --json`, and `flush-ms-total` via in-page `performance.now()` sampling. No network, no API keys.
2. Browser-native metrics for the core scenarios (current-only instrumentation records). These are now the CORE measurement types of the suite rather than a small subset corroborating jsdom — the timing medians themselves already come from Chromium in every scenario; these records add render counts, traces, and vitals on top:
   - `browser-typing-50`: on the typing-50 fixture page — `renders-per-50-keystrokes` (react renders start/stop --json) and `interaction-trace-ms` (`profiler start/stop` around the interaction).
   - `browser-mount-100`: `lcp-ms` / `inp-ms` from `vitals --json` on a fresh load of the mount-100 page.
   - Render-count scenarios run devtools-instrumented; trace timing uses the un-instrumented path; counts and traces are separate records so instrumentation never contaminates timing medians.
3. `bundle-minimal` (current; comparable record type reserved for main): build the dedicated minimal fixture `tests/bench/fixtures/minimal-consumer/` with `vite build`, sum `dist/assets/*.js` sizes raw and gzip (`node:zlib.gzipSync`), metrics `bundle-bytes-raw` and `bundle-bytes-gzip`. The minimal consumer stays a separate tiny fixture on purpose — the scenario fixture mounts every scenario form and would inflate the byte count. Tag the record `comparable: 'current-only'` in this phase; the revised DECISION-6 main fixture makes a main-side bundle build mechanically possible later, and the artifact schema keeps `comparable` so it can flip without migration.

**Outputs**:
- Create: `tests/bench/lib/stream-bench.ts`, `tests/bench/lib/browser-metrics.ts`, `tests/bench/lib/bundle-size.ts`, `tests/bench/fixtures/minimal-consumer/` (index.html, main.tsx, vite.config.ts, tsconfig.json).
- Modify: `tests/bench/lib/scenarios/index.ts`, `tests/bench/lib/run.ts`, `tests/bench/utils/agent-browser.ts` (react renders / profiler / vitals operations), root `package.json` (fixture build script if needed).

**Validation**:
- `pnpm run bench:full` executes streaming + browser-native + bundle scenarios; every browser step cleans up its server and agent-browser session in `finally` (verify no orphan processes/ports).
- Render-count output parses from `react renders stop --json` (validator inspects the artifact); a render-count assertion sanity check is printed (e.g., commits ≤ keystrokes×2 for the memoized path) as a note, not a gate.
- `bundle-bytes-*` records exist and are stable across two consecutive builds (±1% byte-identical expectation for deterministic builds; note if vite hashing/empty-diff prevents this).

### Phase 3 Phase-Wide Validation

1. One validator reads the whole bench tree together: adapter contract symmetry, scenario registry as single source of truth, artifact schema conformance across all writers, no duplication between `run.ts`/`run-main.ts` beyond the unavoidable adapter swap, no `any`, no `await import()`, no dev-server leaks.
2. Runs the complete matrix: `bench:full`, `bench:baseline`, then confirms `tests/bench/results/runs/` holds paired artifacts for every `comparable: 'cross'` scenario id.

**Dependencies**: Phase 2 complete (3.1 extends both runners; 3.2 only needs Phase 1 foundations but is sequenced here to keep one phase-wide validation).

---

## Phase 4: Compare, Report, And Regression Gates

**Type**: Sequential.

**Requirements**:

1. Create `tests/bench/lib/report.ts` (node script, run via tsx):
   - Modes: `--mode current-vs-main` (newest current artifact vs. newest main artifact, cross-comparable scenarios only) and `--mode current-vs-reference` (newest current artifact vs. committed `tests/bench/results/reference.json`, DECISION-7 thresholds; `--allow-regression` downgrades).
   - Comparisons use the browser-collected records for UI scenarios and the node records for parser scenarios (DECISION-2 revised); the report labels the medium per row so the two are never mixed within a scenario.
   - Output: a fixed-width table — scenario, metric, main/median (where applicable), reference median, current median, delta %, verdict — plus environment header (node, git SHAs, resolved `@tanstack/*` versions per side) and divergence notes for D11/D12-affected scenarios.
   - Exit codes: 0 pass; 1 regression (headline >10% or secondary >25% in `current-vs-reference`); 2 usage/missing-artifact error. `current-vs-main` is informational (exit 0 unless artifacts are missing) — it answers "how do we compare to the old implementation", not "did we regress".
   - Missing-metric rows print `MISSING` and warn (pass), so adding scenarios never breaks old references.
2. Snapshot `tests/bench/results/reference.json`: after final validation, run `pnpm run bench:full` and copy the produced artifact to `reference.json` (committed; DECISION-4). The report's `--update-reference` flag automates this copy with an explicit flag guard.
3. Add root scripts: `bench:compare` (current-vs-main), `bench:regress` (current-vs-reference). Document same-machine variance policy inside `report.ts` output: the report prints the reference's `runs`/`min`/`max` so reviewers see spread, and the thresholds from DECISION-7 assume same-machine, same-node comparisons (artifacts record node version + SHA; the report prints a loud warning when node or machine-relevant env differs from the reference).
4. Final full validation run of everything this plan added (see Success Criteria).

**Inputs**:
- Read: all Phase 1-3 artifact writers, DECISION-7, the divergence notes in `FROM-SCRATCH-2.md` (D11, D12) for the report annotations.

**Outputs**:
- Create: `tests/bench/lib/report.ts`, `tests/bench/results/reference.json` (generated snapshot).
- Modify: root `package.json` (two scripts).

**Validation Criteria**:
- `pnpm run bench:compare` prints the full current-vs-main table with at least: `mount-{10,50,100}`, `typing-{10,50,100}`, `submit-{10,50,100}`, `pageswitch-50`, `tabswitch-50`, `array-50`, `autosave-50`, `memory-500`, `parser-{small,medium,large}` rows, exit 0.
- `pnpm run bench:regress` against a fresh identical run exits 0.
- A deliberately corrupted reference (validator temporarily edits a copy via the report's `--reference <file>` flag; no committed file is touched) with a +50% headline inflation makes `bench:regress` exit 1 — proving the gate actually gates.
- `pnpm run check-types` passes; `reference.json` committed; `runs/` ignored.

**Dependencies**: Phase 3 complete.

---

## Success Criteria

1. All Phase 0 gates green on the updated dependency set: `pnpm run check-types`, `pnpm run build`, `pnpm run test:consumer-smoke:vite-base`, `pnpm run test:e2e`, ai-builder/ai-picker tests — with every `@tanstack/*` direct dependency at its execution-day latest and the four AI packages version-identical across declarers.
2. `pnpm run bench:full` and `pnpm run bench:baseline` each produce a complete, schema-valid artifact covering every registered scenario for its implementation, with environment metadata and resolved versions embedded.
3. `pnpm run bench:compare` prints a readable current-vs-main table; `pnpm run bench:regress` enforces DECISION-7 thresholds against the committed reference; `pnpm run bench:smoke` runs the four fast scenarios (three in Chromium + `parser-medium`, N=5 to bound browser wall time) in well under two minutes.
4. Reproducibility demonstrated: two consecutive full runs of `bench:full` on the same machine report medians whose spread is recorded (min/max in artifacts), and the reference snapshot embeds the exact SHA + node version it was taken on.
5. No repo gate weakened: `pnpm run check-types` includes the bench tsconfig; `pnpm run test:architecture` and `pnpm run test:sync` still pass (no scanner/sync fallout from the bench tree or the baseline worktree).

## Risks And Mitigations

1. **AI provider breaking changes beyond the inspected surface** (0.16→0.52 is 36 minor releases): mitigated by scoping 0.3 to the three files with actual imports, verifying every option name against installed `.d.ts` (no guessing), and the existing behavior tests with injected `streamFactory` fakes. If runtime stream chunk shapes changed such that our normalizer misses them, the tests' fake streams must be updated to the new canonical shapes — that is part of 0.3, not a plan change.
2. **Bundle-size regression from new AI SDK transitives** (`@anthropic-ai/sdk`, `openai@6`, `@openrouter/sdk`): the `bundle-minimal` scenario makes this visible; if the minimal consumer (no AI imports) is unaffected but `apps/web` grows, that is an accepted consequence of the modernization and the numbers document it.
3. **Main worktree install fragility** (npm ci on a Next.js-era lockfile, older transitive versions): setup is idempotent and isolated in `bench:baseline:setup`; if `npm ci` fails on execution day, the fixer documents the error and, only if unresolvable, pins the worktree to `main`'s lockfile state at the recorded SHA — the artifact records whichever SHA actually ran.
4. **Browser runs are slower, and instrumentation adds variance**: real-Chromium N-run medians cost more wall time than in-process loops (fixture-server spawn, page loads, agent-browser round-trips per scenario) — mitigated by `bench:smoke` keeping N=5, one fixture-server lifecycle per run, and in-page (not per-round-trip) timing loops; react-devtools instrumentation and profiler tracing perturb what they measure — mitigated by keeping the timing path un-instrumented while devtools render counts are collected and reported as separate records (never mixed into timing medians).
5. **Same-machine variance**: N-run medians, warmup runs, sequential execution, spread (min/max/p75) recorded per artifact, loud report warnings when node/SHA context differs between compared artifacts.
6. **Behavioral divergences masquerading as performance deltas** (D11/D12, persistence semantics): scenarios keep forms valid where the divergent paths would otherwise trigger; divergence notes are attached to affected records and printed by the report.
7. **agent-browser react-devtools instrumentation itself skewing renders**: render-count scenarios report counts (devtools-instrumented) while trace timing comes from the un-instrumented profiler path; the report separates them.
8. **Dual `@tanstack/react-store` resolution** could mask dependency drift: 0.1 resolves or explains it before anything else changes.

## Appendix A: Scenario Registry (Authoritative)

| id | what is measured | metric (unit) | medium | comparable |
| --- | --- | --- | --- | --- |
| `mount-10` / `mount-50` / `mount-100` | initial render + commit of N-field form | `ms` | agent-browser (Chromium) | cross |
| `typing-10` / `typing-50` / `typing-100` | ms per keystroke, 100 input events into one field | `ms-per-keystroke` | agent-browser (Chromium) | cross |
| `pageswitch-50` | conditional page switch settle time (5 pages, all valid) | `ms-per-switch` | agent-browser (Chromium) | cross (D11/D12 note) |
| `tabswitch-50` | tab switch settle time (4 tabs) | `ms-per-switch` | agent-browser (Chromium) | cross |
| `array-50` | array add/remove op cost (20 object items) | `ms-per-op` | agent-browser (Chromium) | cross |
| `submit-10` / `submit-50` / `submit-100` | zod validation + submit round-trip | `ms` | agent-browser (Chromium) | cross |
| `autosave-50` | persistence autosave overhead: typing with vs without | `autosave-overhead-ms` | agent-browser (Chromium) | cross |
| `memory-500` | heap growth after 500 interactions (Chromium heap APIs, no forced GC — API + caveats recorded as notes) | `heap-growth-mb`, `mb-per-100-interactions` | agent-browser (Chromium) | cross |
| `parser-small` / `parser-medium` / `parser-large` | parse throughput per config size | `ms-per-parse`, `parses-per-sec` | node (no DOM) | cross |
| `stream-100chunks` | scheduler flush → transcript render cost, 100 chunks (real React commits in-page) | `renders-per-100-chunks`, `flush-ms-total` | agent-browser (Chromium) | current-only |
| `browser-typing-50` | devtools render counts + profiler trace for typing-50 | `renders-per-50-keystrokes`, `interaction-trace-ms` | agent-browser (Chromium, react-devtools + profiler) | current-only |
| `browser-mount-100` | load vitals for 100-field form | `lcp-ms`, `inp-ms` | agent-browser (Chromium, vitals) | current-only |
| `bundle-minimal` | minimal consumer app JS payload | `bundle-bytes-raw`, `bundle-bytes-gzip` | vite build | current-only (schema reserved for main) |

## Appendix B: Commands Added By This Plan

- `pnpm run bench` — full current-implementation browser/node suite (Phases 1+3.1).
- `pnpm run bench:smoke` — 4-scenario fast subset (3 browser + `parser-medium`), N=5 (Phase 1).
- `pnpm run bench:full` — everything incl. in-browser memory, streaming, browser-native metrics, bundle (Phase 3).
- `pnpm run bench:baseline:setup` / `pnpm run bench:baseline` — main worktree setup and baseline run (Phase 2).
- `pnpm run bench:compare` — current vs. main table (Phase 4).
- `pnpm run bench:regress` — current vs. committed reference with DECISION-7 exit-code gates (Phase 4).

None of these join the default `check-types`/`build`/test paths except the bench tsconfig typecheck, which joins `pnpm run check-types`.
