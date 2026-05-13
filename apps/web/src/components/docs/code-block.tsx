import { useState } from 'react';

import type { DocsCodeExample } from '@/features/docs/code-examples';

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
    <figure className="overflow-hidden">
      <figcaption className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{example.title}</p>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">{example.description}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-live="polite"
        >
          {copyLabel}
        </button>
      </figcaption>
      <pre className="overflow-x-auto rounded-xl bg-background p-5 text-sm leading-6 text-foreground [tab-size:2]">
        <code>{example.code}</code>
      </pre>
    </figure>
  );
}
