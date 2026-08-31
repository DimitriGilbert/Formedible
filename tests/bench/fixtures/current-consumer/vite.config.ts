import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite config for the committed current-implementation benchmark fixture
 * (PERF-BENCHMARK-PLAN.md Phase 1, DECISION-2 revised).
 *
 * Module resolution goes through the fixture's OWN tsconfig paths
 * (`resolve.tsconfigPaths`, the same mechanism `apps/web` uses): the fixture
 * imports formedible from LOCAL SOURCE through `@formedible-src/*`, formedible's
 * own `@/` self-imports resolve to the same tree, and `@bench-scenarios` points
 * at the SHARED scenario generators — the fixture contains no form-config data
 * of its own, and the fixture and the driver execute the same
 * `tests/bench/lib/scenarios/forms.ts` definitions.
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
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Outside `tests/bench` on purpose: the bundle embeds vendored dependency
    // code, and the bench tree must stay free of irrelevant third-party
    // strings (grep-clean tree; output is gitignored at the repo root).
    outDir: path.join(repositoryRoot, '.bench-dist', 'current-consumer'),
    emptyOutDir: true,
    target: 'es2022',
  },
  preview: {
    host: '127.0.0.1',
    // Cross-origin isolation lets the page use
    // performance.measureUserAgentSpecificMemory() — the accurate Chromium heap
    // API the memory-500 scenario prefers (the legacy performance.memory
    // counter is bucketed and only refreshes at the browser's own GC points).
    // Same-origin preview assets satisfy COEP; both fixtures set the same
    // headers so the measured environment stays symmetric.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
};

export default config;
