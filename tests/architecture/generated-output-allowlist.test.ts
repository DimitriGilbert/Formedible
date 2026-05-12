import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { isIgnoredGeneratedFileName } from './utils.js';

describe('generated output allowlist', () => {
  it('allows sample app tooling routeTree.gen.ts output', () => {
    strictEqual(isIgnoredGeneratedFileName('routeTree.gen.ts'), true);
  });
});
