import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('docs route tree', () => {
  it('keeps the docs index route registered in generated route tree output', async () => {
    const routeTree = await readFile(join(process.cwd(), 'src/routeTree.gen.ts'), 'utf8');

    assert.match(routeTree, /import \{ Route as IndexRouteImport \} from '\.\/routes\/index'/);
    assert.match(routeTree, /fullPaths: '\/'/);
    assert.match(routeTree, /IndexRoute: IndexRoute/);
  });
});
