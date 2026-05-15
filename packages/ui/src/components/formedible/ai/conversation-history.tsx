'use client';

import { Download, MessageSquare, Plus, Trash2 } from 'lucide-react';

import { Button } from '@formedible/ui/components/button';
import type { AiConversation } from '@formedible/ui/components/formedible/lib/ai-types';
import { cn } from '@formedible/ui/lib/utils';

export interface ConversationHistoryProps {
  readonly conversations: readonly AiConversation[];
  readonly currentConversationId?: string;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onDeleteConversation: (conversationId: string) => void;
  readonly onNewConversation: () => void;
  readonly onExportConversation: (conversation: AiConversation) => void;
  readonly className?: string;
}

function formatConversationTime(updatedAt: number): string {
  const hoursSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60);

  if (hoursSinceUpdate < 1) {
    return 'Just now';
  }

  if (hoursSinceUpdate < 24) {
    return `${Math.floor(hoursSinceUpdate)}h ago`;
  }

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(updatedAt));
}

function getConversationTitle(conversation: AiConversation): string {
  const firstUserMessage = conversation.messages.find((message) => message.role === 'user');
  const title = conversation.title || firstUserMessage?.content || 'New conversation';

  return title.length > 64 ? `${title.slice(0, 61)}...` : title;
}

export function ConversationHistory({ conversations, currentConversationId, onSelectConversation, onDeleteConversation, onNewConversation, onExportConversation, className }: ConversationHistoryProps) {
  return (
    <section className={cn('flex h-full min-h-0 flex-col rounded-lg border bg-background', className)} aria-labelledby="ai-builder-history-title">
      <header className="flex items-center justify-between gap-3 border-b p-3">
        <div>
          <h2 id="ai-builder-history-title" className="text-sm font-semibold">History</h2>
          <p className="text-xs text-muted-foreground">{conversations.length} saved conversations</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onNewConversation} className="gap-1">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {conversations.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center text-muted-foreground">
            <MessageSquare className="mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs">Start a chat and it will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === currentConversationId;

              return (
                <li key={conversation.id} className={cn('group rounded-md border border-transparent', isActive && 'border-border bg-muted/70')}>
                  <div className="flex items-center gap-2 p-2">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelectConversation(conversation.id)} aria-current={isActive ? 'true' : undefined}>
                      <span className="block truncate text-sm font-medium">{getConversationTitle(conversation)}</span>
                      <span className="block text-xs text-muted-foreground">{formatConversationTime(conversation.updatedAt)} · {conversation.messages.length} messages</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onExportConversation(conversation)} aria-label={`Export ${getConversationTitle(conversation)}`}>
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDeleteConversation(conversation.id)} aria-label={`Delete ${getConversationTitle(conversation)}`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
