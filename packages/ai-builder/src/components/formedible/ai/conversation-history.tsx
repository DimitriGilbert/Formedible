"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, MessageSquare, Trash2, Download, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./chat-interface";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation?: () => void;
  onExportConversation?: (conversation: Conversation) => void;
  className?: string;
}

export function ConversationHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onExportConversation,
  className,
}: ConversationHistoryProps) {

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;

    // Generate title from first user message
    const firstUserMessage = conversation.messages?.find(m => m.role === "user");
    if (firstUserMessage?.content) {
      const text = firstUserMessage.content;
      return text.length > 50 ? text.substring(0, 50) + "..." : text;
    }

    return "New Conversation";
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Conversation History
            <Badge variant="secondary">
              {conversations.length}
            </Badge>
          </CardTitle>
          {onNewConversation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewConversation}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New conversation</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="h-[300px] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start a chat to see your history</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm",
                    currentConversationId === conversation.id && "bg-muted"
                  )}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {getConversationTitle(conversation)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onExportConversation && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportConversation(conversation);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}