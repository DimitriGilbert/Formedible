import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('docs route tree', () => {
  it('keeps the docs routes registered in generated route tree output', async () => {
    const routeTree = await readFile(join(process.cwd(), 'src/routeTree.gen.ts'), 'utf8');

    assert.match(routeTree, /import \{ Route as IndexRouteImport \} from '\.\/routes\/index'/);
    assert.match(routeTree, /import \{ Route as DocsRouteImport \} from '\.\/routes\/docs'/);
    assert.match(routeTree, /'\/': typeof IndexRoute/);
    assert.match(routeTree, /'\/builder': typeof BuilderRoute/);
    assert.match(routeTree, /'\/ai-builder': typeof AiBuilderRoute/);
    assert.match(routeTree, /'\/docs': typeof DocsRouteWithChildren/);
    assert.match(routeTree, /'\/docs\/examples': typeof DocsExamplesRoute/);
    assert.match(routeTree, /IndexRoute: IndexRoute/);
    assert.match(routeTree, /BuilderRoute: BuilderRoute/);
    assert.match(routeTree, /AiBuilderRoute: AiBuilderRoute/);
    assert.match(routeTree, /DocsRoute: DocsRouteWithChildren/);
  });
});
