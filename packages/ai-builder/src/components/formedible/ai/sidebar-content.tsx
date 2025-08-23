"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SidebarView } from "./sidebar-icons";
import { ConversationHistory, type Conversation, type ConversationHistoryProps } from "./conversation-history";
import { AgentSettings } from "./agent-settings";
import { ProviderSelection } from "./provider-selection";
import { ParserSettings } from "./parser-settings";
import type { ProviderConfig } from "./provider-selection";

interface SidebarContentProps {
  activeView: SidebarView | null;
  isCollapsed: boolean;
  className?: string;
  
  // History props
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation?: () => void;
  onExportConversation?: (conversation: Conversation) => void;
  
  // Settings props  
  providerConfig: ProviderConfig | null;
  onConfigChange: (config: ProviderConfig | null) => void;
}

export function SidebarContent({
  activeView,
  isCollapsed,
  className,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onExportConversation,
  providerConfig,
  onConfigChange,
}: SidebarContentProps) {
  if (isCollapsed || !activeView) {
    return null;
  }

  const renderContent = () => {
    switch (activeView) {
      case "history":
        return (
          <ConversationHistory
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
            onNewConversation={onNewConversation}
            onExportConversation={onExportConversation}
            className="border-0 shadow-none h-full"
          />
        );
        
      case "settings":
        return (
          <Card className="h-full">
            <AgentSettings
              providerConfig={providerConfig}
              onConfigChange={onConfigChange}
              className="h-full"
            />
          </Card>
        );
        
      case "provider":
        return (
          <Card className="h-full">
            <ProviderSelection
              onConfigChange={onConfigChange}
              initialConfig={providerConfig}
              className="h-full"
            />
          </Card>
        );
        
      case "parser":
        return (
          <ParserSettings
            className="h-full"
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "w-80 border-r border-border bg-background/50 transition-all duration-200 ease-in-out overflow-hidden",
        isCollapsed ? "w-0" : "w-80",
        className
      )}
    >
      <div className="h-full p-2">
        {renderContent()}
      </div>
    </div>
  );
}