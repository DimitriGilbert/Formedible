"use client";

import { cn } from "@/lib/utils";
import type { ProviderConfig } from "./provider-selection";
import { ChatMessages } from "./chat-messages";
import type { Message } from "./chat-messages";


export type { Message } from "./chat-messages";

export interface ChatInterfaceProps {
  onFormGenerated?: (formCode: string) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onConversationUpdate?: (messages: Message[], isStreamEnd?: boolean) => void;
  onNewConversation?: () => void;
  messages?: Message[];
  className?: string;
  providerConfig?: ProviderConfig | null;
}

export function ChatInterface({
  onFormGenerated,
  onStreamingStateChange,
  onConversationUpdate,
  onNewConversation,
  messages: externalMessages,
  className,
  providerConfig,
}: ChatInterfaceProps) {
  return (
    <ChatMessages
      onFormGenerated={onFormGenerated}
      onStreamingStateChange={onStreamingStateChange}
      onConversationUpdate={onConversationUpdate}
      onNewConversation={onNewConversation}
      messages={externalMessages}
      providerConfig={providerConfig}
      className={cn("h-full", className)}
    />
  );
}
