'use client';

import { Bot, User } from 'lucide-react';

import { MarkdownMessage } from '@/components/formedible/ai/markdown-message';
import { RawOutputPanel } from '@/components/formedible/ai/raw-output-panel';
import type { AiMessage } from '@/lib/formedible/ai-types';
import { cn } from '@/lib/utils';

export interface ChatMessagesProps {
  readonly messages: readonly AiMessage[];
  readonly className?: string;
}

function MessageIcon({ role }: { readonly role: AiMessage['role'] }) {
  if (role === 'user') {
    return <User className="h-4 w-4" aria-hidden="true" />;
  }

  return <Bot className="h-4 w-4" aria-hidden="true" />;
}

function renderStatus(message: AiMessage): string | undefined {
  if (message.status === 'streaming') {
    return 'Streaming';
  }

  if (message.status === 'aborted') {
    return 'Aborted';
  }

  if (message.status === 'error') {
    return 'Error';
  }

  return undefined;
}

export function ChatMessages({ messages, className }: ChatMessagesProps) {
  if (messages.length === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>Describe the form you want to build.</p>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {messages.map((message) => {
        const status = renderStatus(message);
        const isAssistant = message.role === 'assistant';
        const isStreaming = message.status === 'streaming';

        return (
          <article key={message.id} className={cn('rounded-lg p-3 text-sm', message.role === 'user' ? 'bg-muted' : 'border bg-background')}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-medium capitalize">
                <MessageIcon role={message.role} />
                {message.role}
              </p>
              {status ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{status}</span> : null}
            </div>
            {message.thinking ? (
              <details className="mb-3 rounded-md border bg-muted/30 p-2">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Thinking</summary>
                <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{message.thinking}</p>
              </details>
            ) : null}
            {isAssistant && !isStreaming ? <MarkdownMessage content={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
            {isAssistant && !isStreaming ? <RawOutputPanel message={message} className="mt-3" /> : null}
          </article>
        );
      })}
    </div>
  );
}
