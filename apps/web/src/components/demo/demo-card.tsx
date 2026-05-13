import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ScrollArea } from '@formedible/ui/components/scroll-area';

interface DemoCardProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  code: string;
  codeTitle?: string;
  codeDescription?: string;
}

export function DemoCard({
  title,
  description,
  preview,
  code,
  codeTitle,
  codeDescription,
}: DemoCardProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10">
      <div className="flex border-b border-border/60">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${activeTab === 'preview' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${activeTab === 'code' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Code
        </button>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {activeTab === 'preview' ? (
          <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
            {preview}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-xs text-secondary-foreground transition hover:bg-secondary/80"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">{codeTitle ?? `${title} Code`}</p>
              <p className="text-xs text-muted-foreground">{codeDescription ?? `Implementation for ${title.toLowerCase()}`}</p>
            </div>
            <div className="max-h-[67vh] overflow-hidden rounded-xl bg-muted">
              <ScrollArea className="h-[67vh]">
                <pre className="p-4 text-[0.82rem] leading-6 text-foreground [tab-size:2]">
                  <code>{code}</code>
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
