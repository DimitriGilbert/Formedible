"use client";

import { cn } from "@/lib/utils";
import type { ProviderConfig } from "./provider-selection";
import type { AIBuilderMode, BackendConfig } from "./ai-builder";
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
  mode?: AIBuilderMode;
  backendConfig?: BackendConfig;
}

export function ChatInterface({
  onFormGenerated,
  onStreamingStateChange,
  onConversationUpdate,
  onNewConversation,
  messages: externalMessages,
  className,
  providerConfig,
  mode,
  backendConfig,
}: ChatInterfaceProps) {
  return (
    <ChatMessages
      onFormGenerated={onFormGenerated}
      onStreamingStateChange={onStreamingStateChange}
      onConversationUpdate={onConversationUpdate}
      onNewConversation={onNewConversation}
      messages={externalMessages}
      providerConfig={providerConfig}
      mode={mode}
      backendConfig={backendConfig}
      className={cn("h-full", className)}
    />
  );
}
