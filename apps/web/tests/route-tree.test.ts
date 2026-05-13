import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const expectedRoutes = [
  { fullPath: '/', variableName: 'IndexRoute', importAlias: 'IndexRouteImport', source: './routes/index' },
  { fullPath: '/ai-builder', variableName: 'AiBuilderRoute', importAlias: 'AiBuilderRouteImport', source: './routes/ai-builder' },
  { fullPath: '/builder', variableName: 'BuilderRoute', importAlias: 'BuilderRouteImport', source: './routes/builder' },
  { fullPath: '/docs', variableName: 'DocsRouteWithChildren', importAlias: 'DocsRouteImport', source: './routes/docs' },
  { fullPath: '/docs/', variableName: 'DocsIndexRoute', importAlias: 'DocsIndexRouteImport', source: './routes/docs.index' },
  {
    fullPath: '/docs/advanced-features',
    variableName: 'DocsAdvancedFeaturesRoute',
    importAlias: 'DocsAdvancedFeaturesRouteImport',
    source: './routes/docs.advanced-features',
  },
  {
    fullPath: '/docs/ai-builder',
    variableName: 'DocsAiBuilderRoute',
    importAlias: 'DocsAiBuilderRouteImport',
    source: './routes/docs.ai-builder',
  },
  { fullPath: '/docs/analytics', variableName: 'DocsAnalyticsRoute', importAlias: 'DocsAnalyticsRouteImport', source: './routes/docs.analytics' },
  { fullPath: '/docs/api', variableName: 'DocsApiRoute', importAlias: 'DocsApiRouteImport', source: './routes/docs.api' },
  { fullPath: '/docs/builder', variableName: 'DocsBuilderRoute', importAlias: 'DocsBuilderRouteImport', source: './routes/docs.builder' },
  {
    fullPath: '/docs/dynamic-text',
    variableName: 'DocsDynamicTextRoute',
    importAlias: 'DocsDynamicTextRouteImport',
    source: './routes/docs.dynamic-text',
  },
  { fullPath: '/docs/examples', variableName: 'DocsExamplesRoute', importAlias: 'DocsExamplesRouteImport', source: './routes/docs.examples' },
  { fullPath: '/docs/fields', variableName: 'DocsFieldsRoute', importAlias: 'DocsFieldsRouteImport', source: './routes/docs.fields' },
  {
    fullPath: '/docs/getting-started',
    variableName: 'DocsGettingStartedRoute',
    importAlias: 'DocsGettingStartedRouteImport',
    source: './routes/docs.getting-started',
  },
  { fullPath: '/docs/parser', variableName: 'DocsParserRoute', importAlias: 'DocsParserRouteImport', source: './routes/docs.parser' },
  { fullPath: '/docs/persistence', variableName: 'DocsPersistenceRoute', importAlias: 'DocsPersistenceRouteImport', source: './routes/docs.persistence' },
  { fullPath: '/docs/validation', variableName: 'DocsValidationRoute', importAlias: 'DocsValidationRouteImport', source: './routes/docs.validation' },
] as const;

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('docs route tree', () => {
  it('keeps the docs routes registered in generated route tree output', async () => {
    const routeTree = await readFile(join(process.cwd(), 'src/routeTree.gen.ts'), 'utf8');

    for (const route of expectedRoutes) {
      assert.match(
        routeTree,
        new RegExp(`import \\{ Route as ${route.importAlias} \\} from '${escapePattern(route.source)}'`),
        `${route.fullPath} import must be registered`,
      );
      assert.match(
        routeTree,
        new RegExp(`'${escapePattern(route.fullPath)}': typeof ${route.variableName}`),
        `${route.fullPath} must be present in generated path types`,
      );
      assert.match(
        routeTree,
        new RegExp(`fullPath: '${escapePattern(route.fullPath)}'`),
        `${route.fullPath} must be present in route declarations`,
      );
    }

    assert.match(routeTree, /IndexRoute: IndexRoute/);
    assert.match(routeTree, /BuilderRoute: BuilderRoute/);
    assert.match(routeTree, /AiBuilderRoute: AiBuilderRoute/);
    assert.match(routeTree, /DocsRoute: DocsRouteWithChildren/);
  });

  it('keeps docs hub and docs examples on distinct route files', async () => {
    const routeTree = await readFile(join(process.cwd(), 'src/routeTree.gen.ts'), 'utf8');

    assert.match(routeTree, /import \{ Route as DocsRouteImport \} from '\.\/routes\/docs'/);
    assert.match(routeTree, /import \{ Route as DocsIndexRouteImport \} from '\.\/routes\/docs\.index'/);
    assert.match(routeTree, /import \{ Route as DocsExamplesRouteImport \} from '\.\/routes\/docs\.examples'/);
    assert.match(routeTree, /const DocsRoute = DocsRouteImport\.update\(\{\s*id: '\/docs',[\s\S]*path: '\/docs',[\s\S]*getParentRoute: \(\) => rootRouteImport/);
    assert.match(routeTree, /const DocsIndexRoute = DocsIndexRouteImport\.update\(\{\s*id: '\/',[\s\S]*path: '\/',[\s\S]*getParentRoute: \(\) => DocsRoute/);
    assert.match(routeTree, /const DocsExamplesRoute = DocsExamplesRouteImport\.update\(\{\s*id: '\/examples',[\s\S]*path: '\/examples',[\s\S]*getParentRoute: \(\) => DocsRoute/);
    assert.match(routeTree, /'\/docs\/': typeof DocsIndexRoute/);
    assert.match(routeTree, /'\/docs\/examples': typeof DocsExamplesRoute/);
  });
});
