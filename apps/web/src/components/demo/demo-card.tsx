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
    if (!navigator.clipboard) {
      return;
    }

    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-muted">
      <div className="flex border-b border-border">
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
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {activeTab === 'preview' ? (
          <div className="rounded-xl bg-background p-4">
            {preview}
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">{codeTitle ?? `${title} Code`}</p>
              <p className="text-xs text-muted-foreground">{codeDescription ?? `Implementation for ${title.toLowerCase()}`}</p>
            </div>
            <div className="max-h-[67vh] overflow-hidden rounded-xl bg-background">
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
