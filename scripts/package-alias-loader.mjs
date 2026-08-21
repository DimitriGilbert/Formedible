import { access } from 'node:fs/promises';
import { dirname, sep, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoots = [
  resolvePath(repoRoot, 'packages/ai-builder'),
  resolvePath(repoRoot, 'packages/builder'),
  resolvePath(repoRoot, 'packages/formedible-parser'),
  resolvePath(repoRoot, 'packages/formedible'),
  resolvePath(repoRoot, 'packages/ui'),
  resolvePath(repoRoot, 'apps/web'),
];

const registryAliasTargets = new Map([
  ['@/components/formedible/hooks/use-formedible', resolvePath(repoRoot, 'packages/formedible/src/hooks/use-formedible.tsx')],
  ['@/components/formedible/lib/types', resolvePath(repoRoot, 'packages/formedible/src/lib/formedible/types.ts')],
  ['@/components/formedible/lib/formedible-parser', resolvePath(repoRoot, 'packages/formedible-parser/src/lib/formedible/formedible-parser.ts')],
  ['@/components/formedible/lib/parser-config-schema', resolvePath(repoRoot, 'packages/formedible-parser/src/lib/formedible/parser-config-schema.ts')],
  ['@/components/formedible/lib/parser-types', resolvePath(repoRoot, 'packages/formedible-parser/src/lib/formedible/parser-types.ts')],
  ['@/components/ui/scroll-area', resolvePath(repoRoot, 'packages/ui/src/components/scroll-area.tsx')],
]);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const registryTarget = registryAliasTargets.get(specifier);

    if (registryTarget !== undefined) {
      return { shortCircuit: true, url: pathToFileURL(registryTarget).href };
    }

    const parentPath = context.parentURL?.startsWith('file:') ? fileURLToPath(context.parentURL) : process.cwd();
    const packageRoot = packageRoots.find((root) => parentPath === root || parentPath.startsWith(root + sep)) ?? process.cwd();
    const resolved = await resolveExistingPath(resolvePath(packageRoot, 'src', specifier.slice(2)));

    if (resolved !== undefined) {
      return { shortCircuit: true, url: pathToFileURL(resolved).href };
    }
  }

  return nextResolve(specifier, context);
}

async function resolveExistingPath(path) {
  const candidates = [path, `${path}.ts`, `${path}.tsx`, `${path}.js`, `${path}.jsx`, `${path}/index.ts`, `${path}/index.tsx`];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  return undefined;
}
