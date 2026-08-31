import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite config for the committed MAIN-baseline benchmark fixture
 * (PERF-BENCHMARK-PLAN.md Phase 2, DECISION-6 revised).
 *
 * The served page runs the `main`-branch implementation on ITS OWN pinned
 * dependencies (DECISION-1): module resolution goes through the fixture's
 * GENERATED `tsconfig.json` (`resolve.tsconfigPaths`, the same mechanism the
 * current-consumer fixture uses — string aliases do not extension-resolve TS
 * paths under rolldown-vite 8, see BENCH-FINDINGS [P1-rework] medium). The
 * generated tsconfig maps the fixture's `react`/`react-dom` imports and the
 * `formedible-bench-main-*` specifiers into the baseline worktree, so the page
 * loads main's hook source and main's installed react/react-form. Everything
 * main's own source imports (`@tanstack/react-form`, radix, lucide-react, ...)
 * resolves from the WORKTREE's hoisted node_modules by plain directory
 * walk-up, because those importers live inside the worktree — no repo
 * dependency can leak into the page.
 *
 * `dedupe` is deliberately ABSENT (unlike the current fixture): deduping
 * react/react-dom to the project root would load THIS repo's react instance
 * next to the worktree's — two React copies in one page — and destroy the
 * isolation this fixture exists to prove.
 *
 * The config is a plain default export (no `vite` import): it must typecheck
 * under the repo's aggregate `check-types` chain without adding `vite` to any
 * manifest — vite itself loads and validates the object at build time.
 */

const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(fixtureDirectory, '..', '..', '..', '..');

const config = {
  root: fixtureDirectory,
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // Outside `tests/bench` on purpose (BENCH-FINDINGS [P1-rework] low): the
    // bundle embeds vendored dependency code, and the bench tree stays free of
    // irrelevant third-party strings (output is gitignored at the repo root).
    outDir: path.join(repositoryRoot, '.bench-dist', 'main-consumer'),
    emptyOutDir: true,
    target: 'es2022',
  },
  preview: {
    host: '127.0.0.1',
  },
};

export default config;
