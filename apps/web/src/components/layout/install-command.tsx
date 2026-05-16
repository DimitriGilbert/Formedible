import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export type PkgManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export const pkgCommands: Record<PkgManager, string> = {
  pnpm: 'pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json',
  npm: 'npx shadcn@latest add https://formedible.dev/r/formedible-core.json',
  yarn: 'yarn dlx shadcn@latest add https://formedible.dev/r/formedible-core.json',
  bun: 'bunx --bun shadcn@latest add https://formedible.dev/r/formedible-core.json',
};

export const pkgLabels: Record<PkgManager, string> = {
  pnpm: 'pnpm',
  npm: 'npm',
  yarn: 'yarn',
  bun: 'bun',
};

export function InstallCommand() {
  const [activePkg, setActivePkg] = useState<PkgManager>('pnpm');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!navigator.clipboard) {
      return;
    }

    navigator.clipboard
      .writeText(pkgCommands[activePkg])
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  }

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex gap-1">
          {(Object.keys(pkgLabels) as PkgManager[]).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setActivePkg(pm)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${activePkg === pm ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {pkgLabels[pm]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 py-3">
        <Terminal size={14} strokeWidth={1.5} className="shrink-0 text-muted-foreground" />
        <code className="overflow-x-auto text-sm text-foreground">{pkgCommands[activePkg]}</code>
      </div>
    </div>
  );
}
