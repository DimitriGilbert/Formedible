import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { summarize } from './bench-timing';
import { buildBenchFixture } from '../utils/agent-browser';
import type { ScenarioMetricStats } from './run-common';

/**
 * `bundle-minimal` (current-only, PERF-BENCHMARK-PLAN.md §3.2): builds the
 * dedicated MINIMAL consumer fixture (`tests/bench/fixtures/minimal-consumer/`
 * — a separate tiny fixture on purpose; the scenario fixture mounts every
 * scenario form and would inflate the byte count) with `vite build` and sums
 * the built `assets/*.js` sizes, raw and gzip (`node:zlib.gzipSync`).
 *
 * Determinism: the fixture is built TWICE per run and both builds' sizes are
 * recorded in the artifact notes; the recorded metrics come from the second
 * build. Vite content-hashes asset file names, so byte-stable builds show up
 * as identical sizes (and identical hash names) — the stability delta is
 * noted, never silently ignored.
 *
 * The record stays `comparable: 'current-only'` for now; the artifact schema
 * keeps the `comparable` field so a main-side bundle build can flip it later
 * without migration (the main fixture is mechanically buildable the same way).
 */

const benchLibDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(benchLibDirectory, '..', '..', '..');
const MINIMAL_ASSETS_DIRECTORY = join(repositoryRoot, '.bench-dist', 'minimal-consumer', 'assets');

/** Allowed relative drift between two consecutive builds before it is called out. */
const BUNDLE_STABILITY_TOLERANCE_PCT = 1;

interface BundleAsset {
  readonly name: string;
  readonly rawBytes: number;
  readonly gzipBytes: number;
}

interface BundleSizes {
  readonly rawBytes: number;
  readonly gzipBytes: number;
  readonly assets: readonly BundleAsset[];
}

function readBundleSizes(): BundleSizes {
  const names = readdirSync(MINIMAL_ASSETS_DIRECTORY)
    .filter((name) => name.endsWith('.js'))
    .sort((first, second) => (first < second ? -1 : first > second ? 1 : 0));

  if (names.length === 0) {
    throw new Error(`bundle-minimal: no *.js assets under ${MINIMAL_ASSETS_DIRECTORY} — did the build output move?`);
  }

  const assets: BundleAsset[] = names.map((name) => {
    const content = readFileSync(join(MINIMAL_ASSETS_DIRECTORY, name));

    return { name, rawBytes: content.byteLength, gzipBytes: gzipSync(content).byteLength };
  });

  return {
    rawBytes: assets.reduce((total, asset) => total + asset.rawBytes, 0),
    gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
    assets,
  };
}

function percentDelta(from: number, to: number): number {
  return from === 0 ? Number.NaN : (Math.abs(to - from) / from) * 100;
}

export interface BundleScenarioResult {
  readonly metrics: readonly ScenarioMetricStats[];
  readonly notes: readonly string[];
}

export async function executeBundleScenario(): Promise<BundleScenarioResult> {
  await buildBenchFixture('minimal-consumer');
  const firstBuild = readBundleSizes();

  await buildBenchFixture('minimal-consumer');
  const secondBuild = readBundleSizes();

  if (secondBuild.assets.length !== firstBuild.assets.length) {
    throw new Error(
      `bundle-minimal: two consecutive builds produced different asset counts (${firstBuild.assets.length} vs ${secondBuild.assets.length}).`,
    );
  }

  const rawDeltaPct = percentDelta(firstBuild.rawBytes, secondBuild.rawBytes);
  const gzipDeltaPct = percentDelta(firstBuild.gzipBytes, secondBuild.gzipBytes);
  const stable =
    Number.isNaN(rawDeltaPct) || Number.isNaN(gzipDeltaPct)
      ? false
      : rawDeltaPct <= BUNDLE_STABILITY_TOLERANCE_PCT && gzipDeltaPct <= BUNDLE_STABILITY_TOLERANCE_PCT;

  const assetList = secondBuild.assets.map((asset) => `${asset.name} (${asset.rawBytes} bytes)`).join(', ');

  const metrics: readonly ScenarioMetricStats[] = [
    { metric: 'bundle-bytes-raw', stats: summarize([secondBuild.rawBytes]) },
    { metric: 'bundle-bytes-gzip', stats: summarize([secondBuild.gzipBytes]) },
  ];

  return {
    metrics,
    notes: [
      'medium: vite build of tests/bench/fixtures/minimal-consumer (a dedicated minimal consumer importing formedible from local source — one 3-field form, no scenario machinery); metrics sum every built assets/*.js file, raw and gzip (node:zlib.gzipSync)',
      `two consecutive builds of the same commit: raw ${firstBuild.rawBytes} -> ${secondBuild.rawBytes} bytes (${rawDeltaPct.toFixed(3)}% delta), gzip ${firstBuild.gzipBytes} -> ${secondBuild.gzipBytes} bytes (${gzipDeltaPct.toFixed(3)}% delta) — ${stable ? 'within' : 'BEYOND'} the ±${BUNDLE_STABILITY_TOLERANCE_PCT}% determinism expectation; vite content-hashes asset names, so byte-stable input yields identical names and sizes`,
      `recorded from the second build; assets: ${assetList}; single deterministic build measurement per run (runs = 1)`,
    ],
  };
}
