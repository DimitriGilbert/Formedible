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

describe('copy-only sync', () => {
  it('copies registry-listed files from owning source directories without content changes', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'formedible-copy-sync-'));

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

  it('keeps sync script free of rewrite and mirror shortcuts', async () => {
    const script = await readFile(syncScriptPath, 'utf8');

    assert.equal(/\.replace(?:All)?\s*\(/.test(script), false);
    assert.equal(/MagicString|ts-morph/.test(script), false);
    assert.equal(script.includes(['registry', 'default'].join('/')), false);
    assert.equal(script.includes(['generated', 'formedible'].join('/')), false);
    assert.equal(script.includes('public/r'), false);
  });
});
