import { useState } from 'react';

import type { DocsCodeExample } from './code-examples';

type CopyState = 'idle' | 'copied' | 'failed';

type CodeBlockProps = {
  readonly example: DocsCodeExample;
};

export function CodeBlock({ example }: CodeBlockProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  function handleCopy() {
    if (!navigator.clipboard) {
      setCopyState('failed');
      return;
    }

    navigator.clipboard
      .writeText(example.code)
      .then(() => {
        setCopyState('copied');
      })
      .catch(() => {
        setCopyState('failed');
      });
  }

  const copyLabel = copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy';

  return (
    <figure className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-zinc-950 shadow-2xl shadow-black/25">
      <figcaption className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{example.title}</p>
          <p className="max-w-2xl text-xs leading-5 text-zinc-400">{example.description}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 outline-none transition hover:border-white/30 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-live="polite"
        >
          {copyLabel}
        </button>
      </figcaption>
      <pre className="overflow-x-auto p-5 text-[0.82rem] leading-6 text-zinc-100 [tab-size:2]">
        <code>{example.code}</code>
      </pre>
    </figure>
  );
}
