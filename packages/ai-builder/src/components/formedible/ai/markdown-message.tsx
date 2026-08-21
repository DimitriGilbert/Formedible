'use client';

import { Check, Copy } from 'lucide-react';
import { Children, isValidElement, memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MarkdownMessageProps {
  readonly content: string;
  readonly className?: string;
}

interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

function normalizeCode(children: ReactNode): string {
  return extractTextContent(children).replace(/\n$/, '');
}

function extractTextContent(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return String(child);
    }

    if (isValidElement<{ readonly children?: ReactNode }>(child)) {
      return extractTextContent(child.props.children);
    }

    return '';
  }).join('');
}

function CodeBlock({ code, language, className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="group my-3 overflow-hidden rounded-lg border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        <span>{language ?? 'text'}</span>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={copyCode} aria-label="Copy code block">
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code className={cn(className, language ? `language-${language}` : undefined)}>{children}</code>
      </pre>
    </div>
  );
}

const markdownComponents = {
  a({ children, href, ...props }) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4" {...props}>
        {children}
      </a>
    );
  },
  code({ children, className, ...props }) {
    const languageMatch = /language-([\w-]+)/.exec(className ?? '');
    const code = normalizeCode(children);

    if (languageMatch) {
      return <CodeBlock code={code} language={languageMatch[1]} className={className}>{children}</CodeBlock>;
    }

    return (
      <code className={cn('rounded bg-muted px-1 py-0.5 text-[0.9em]', className)} {...props}>
        {children}
      </code>
    );
  },
  table({ children, ...props }) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th({ children, ...props }) {
    return (
      <th className="border px-2 py-1 text-left font-semibold" {...props}>
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td className="border px-2 py-1" {...props}>
        {children}
      </td>
    );
  },
} satisfies Components;

export const MarkdownMessage = memo(function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
});
