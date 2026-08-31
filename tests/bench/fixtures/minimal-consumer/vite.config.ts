import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Vite config for the MINIMAL consumer benchmark fixture
 * (`bundle-minimal`, PERF-BENCHMARK-PLAN.md §3.2). Same resolution mechanism
 * as the other bench fixtures (`resolve.tsconfigPaths` through the fixture's
 * own tsconfig — rolldown-vite does not extension-resolve string aliases), no
 * preview-specific headers: this fixture is only ever BUILT (`vite build`) —
 * the bundle scenario never serves it.
 *
 * Plain default export (no `vite` import): it must typecheck under the repo's
 * aggregate `check-types` chain without adding `vite` to any manifest.
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
    // Outside `tests/bench` on purpose (same convention as the other fixtures):
    // the bundle embeds vendored dependency code and the bench tree stays
    // grep-clean; the output is gitignored at the repo root.
    outDir: path.join(repositoryRoot, '.bench-dist', 'minimal-consumer'),
    emptyOutDir: true,
    target: 'es2022',
  },
};

export default config;
