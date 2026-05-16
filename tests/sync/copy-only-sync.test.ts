import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);
const repositoryRoot = process.cwd();
const syncScriptPath = join(repositoryRoot, 'scripts/quick-sync.js');

async function writeFixtureFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function runSync(rootDirectory: string, configPath: string): Promise<{ stderr: string }> {
  const result = await execFileAsync('node', [syncScriptPath, '--root', rootDirectory, '--config', configPath], {
    cwd: repositoryRoot,
  });

  return { stderr: result.stderr };
}

describe('quick sync', () => {
  it('copies registry-listed files from owning source directories for local source workspaces', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'formedible-local-sync-'));

    try {
      const sourceContent = "import { helper } from './helper';\n\nexport const value = helper('source');\n";
      const helperContent = "export function helper(value: string): string {\n  return value;\n}\n";
      const registryContent = JSON.stringify(
        {
          items: [
            {
              name: 'owner-core',
              files: [
                { path: 'src/components/owner/source.ts', target: 'components/owner/source.ts' },
                { path: 'src/components/owner/helper.ts', target: 'components/owner/helper.ts' },
                { path: 'src/components/owner/missing.ts', target: 'components/owner/missing.ts' },
              ],
            },
          ],
        },
        null,
        2,
      );

      await writeFixtureFile(join(fixtureRoot, 'packages/owner/registry.json'), registryContent);
      await writeFixtureFile(join(fixtureRoot, 'packages/owner/src/components/owner/source.ts'), sourceContent);
      await writeFixtureFile(join(fixtureRoot, 'packages/owner/src/components/owner/helper.ts'), helperContent);
      await writeFixtureFile(join(fixtureRoot, 'packages/owner/public/r/owner-core.json'), 'built payload must not be copied');

      const configPath = join(fixtureRoot, 'sync.config.json');
      await writeFixtureFile(
        configPath,
        JSON.stringify({ routes: [{ ownerRoot: 'packages/owner', destinationRoots: ['apps/docs/src', 'packages/consumer/src'] }] }),
      );

      const result = await runSync(fixtureRoot, configPath);
      const docsCopy = await readFile(join(fixtureRoot, 'apps/docs/src/components/owner/source.ts'), 'utf8');
      const packageCopy = await readFile(join(fixtureRoot, 'packages/consumer/src/components/owner/helper.ts'), 'utf8');

      assert.equal(docsCopy, sourceContent);
      assert.equal(packageCopy, helperContent);
      assert.equal(docsCopy.includes("./helper.js"), false);
      assert.equal(docsCopy.startsWith('//'), false);
      assert.match(result.stderr, /listed source file not found/);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('rewrites package install-surface imports like shadcn resolves aliases', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'formedible-ui-sync-'));

    try {
      const sourceContent = [
        "import { Button } from '@/components/ui/button';",
        "import { FieldStore } from '@/components/formedible/builder/field-store';",
        "import { useFormedible } from '@/hooks/use-formedible';",
        "import { cn } from '@/lib/utils';",
        "import type { FormedibleFormValues } from '@/lib/formedible/types';",
        '',
        'export const value = cn(Button, FieldStore, useFormedible);',
        'export type Values = FormedibleFormValues;',
        '',
      ].join('\n');
      const registryContent = JSON.stringify(
        {
          items: [
            {
              name: 'owner-core',
              files: [{ path: 'src/components/formedible/example.tsx', target: '@ui/formedible/example.tsx' }],
            },
          ],
        },
        null,
        2,
      );

      await writeFixtureFile(join(fixtureRoot, 'packages/owner/registry.json'), registryContent);
      await writeFixtureFile(join(fixtureRoot, 'packages/owner/src/components/formedible/example.tsx'), sourceContent);
      await writeFixtureFile(
        join(fixtureRoot, 'packages/ui/components.json'),
        JSON.stringify({ aliases: { ui: '@formedible/ui/components', utils: '@formedible/ui/lib/utils' } }),
      );

      const configPath = join(fixtureRoot, 'sync.config.json');
      await writeFixtureFile(
        configPath,
        JSON.stringify({ routes: [{ ownerRoot: 'packages/owner', destinationRoots: ['packages/ui/src/components'], useRegistryTargets: true }] }),
      );

      await runSync(fixtureRoot, configPath);

      const uiCopy = await readFile(join(fixtureRoot, 'packages/ui/src/components/formedible/example.tsx'), 'utf8');

      assert.match(uiCopy, /from '@formedible\/ui\/components\/button'/);
      assert.match(uiCopy, /from '@formedible\/ui\/components\/formedible\/builder\/field-store'/);
      assert.match(uiCopy, /from '@formedible\/ui\/components\/formedible\/hooks\/use-formedible'/);
      assert.match(uiCopy, /from '@formedible\/ui\/lib\/utils'/);
      assert.match(uiCopy, /from '@formedible\/ui\/components\/formedible\/lib\/types'/);
      assert.equal(uiCopy.includes("@/components/ui/button"), false);
      assert.equal(uiCopy.includes("@/lib/formedible/types"), false);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('rewrites only Formedible core imports for apps/web sync output', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'formedible-web-sync-'));

    try {
      const sourceContent = "import { Button } from '@/components/ui/button';\nimport { useFormedible } from '@/hooks/use-formedible';\nimport { cn } from '@/lib/utils';\nimport type { FormedibleFormValues } from '@/lib/formedible/types';\n";
      const registryContent = JSON.stringify(
        {
          items: [
            {
              name: 'owner-core',
              files: [{ path: 'src/components/formedible/example.tsx', target: '@ui/formedible/example.tsx' }],
            },
          ],
        },
        null,
        2,
      );

      await writeFixtureFile(join(fixtureRoot, 'packages/owner/registry.json'), registryContent);
      await writeFixtureFile(join(fixtureRoot, 'packages/owner/src/components/formedible/example.tsx'), sourceContent);

      const configPath = join(fixtureRoot, 'sync.config.json');
      await writeFixtureFile(
        configPath,
        JSON.stringify({ routes: [{ ownerRoot: 'packages/owner', destinationRoots: ['apps/web/src'] }] }),
      );

      await runSync(fixtureRoot, configPath);

      const webCopy = await readFile(join(fixtureRoot, 'apps/web/src/components/formedible/example.tsx'), 'utf8');

      assert.match(webCopy, /from '@\/components\/ui\/button'/);
      assert.match(webCopy, /from '@formedible\/ui\/components\/formedible\/hooks\/use-formedible'/);
      assert.match(webCopy, /from '@\/lib\/utils'/);
      assert.match(webCopy, /from '@formedible\/ui\/components\/formedible\/lib\/types'/);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('does not vendor Formedible core into registry extension packages', async () => {
    const syncScript = await readFile(syncScriptPath, 'utf8');

    assert.doesNotMatch(syncScript, /ownerRoot:\s*['"]packages\/formedible['"][\s\S]*packages\/builder\/src/);
    assert.doesNotMatch(syncScript, /ownerRoot:\s*['"]packages\/formedible['"][\s\S]*packages\/ai-builder\/src/);
    assert.doesNotMatch(syncScript, /ownerRoot:\s*['"]packages\/formedible['"][\s\S]*packages\/formedible-parser\/src/);
    assert.doesNotMatch(syncScript, /ownerRoot:\s*['"]packages\/builder['"][\s\S]*packages\/ai-builder\/src/);
    assert.doesNotMatch(syncScript, /ownerRoot:\s*['"]packages\/formedible-parser['"][\s\S]*packages\/builder\/src/);
    assert.doesNotMatch(syncScript, /ownerRoot:\s*['"]packages\/formedible-parser['"][\s\S]*packages\/ai-builder\/src/);
  });
});
