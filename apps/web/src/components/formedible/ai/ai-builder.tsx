"use client";

import { useState, useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProviderSelection, type ProviderConfig } from "./provider-selection";
import { ChatInterface } from "./chat-interface";
import { FormPreview } from "./form-preview";
import { ConversationHistory, type Conversation } from "./conversation-history";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./chat-interface";

// Create a client instance outside the component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
});

export interface AIBuilderProps {
  className?: string;
  onFormGenerated?: (formCode: string) => void;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
}

const STORAGE_KEYS = {
  PROVIDER_CONFIG: "formedible-ai-builder-provider-config",
  CONVERSATIONS: "formedible-ai-builder-conversations",
  UI_STATE: "formedible-ai-builder-ui-state",
};

function AIBuilderCore({ className, onFormGenerated, onFormSubmit }: AIBuilderProps) {
  const [providerConfig, setProviderConfig] = useState<ProviderConfig | null>(null);
  const [generatedFormCode, setGeneratedFormCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [isTopSectionCollapsed, setIsTopSectionCollapsed] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    try {
      // Load provider config
      const savedConfig = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIG);
      if (savedConfig) {
        setProviderConfig(JSON.parse(savedConfig));
      }

      // Load conversations
      const savedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (savedConversations) {
        const parsedConversations = JSON.parse(savedConversations);
        setConversations(parsedConversations.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })));
      }

      // Load UI state
      const savedUIState = localStorage.getItem(STORAGE_KEYS.UI_STATE);
      if (savedUIState) {
        const uiState = JSON.parse(savedUIState);
        setIsTopSectionCollapsed(uiState.isTopSectionCollapsed || false);
        setCurrentConversationId(uiState.currentConversationId);
      }
    } catch (error) {
      console.warn("Failed to load saved AI Builder data:", error);
    }
  }, []);

  // Save provider config when it changes
  useEffect(() => {
    if (providerConfig) {
      try {
        localStorage.setItem(STORAGE_KEYS.PROVIDER_CONFIG, JSON.stringify(providerConfig));
      } catch (error) {
        console.warn("Failed to save provider config:", error);
      }
    }
  }, [providerConfig]);

  // Save conversations when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.warn("Failed to save conversations:", error);
    }
  }, [conversations]);

  // Save UI state when it changes
  useEffect(() => {
    try {
      const uiState = {
        isTopSectionCollapsed,
        currentConversationId,
      };
      localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(uiState));
    } catch (error) {
      console.warn("Failed to save UI state:", error);
    }
  }, [isTopSectionCollapsed, currentConversationId]);

  const handleProviderConfigChange = useCallback((config: ProviderConfig | null) => {
    setProviderConfig(config);
  }, []);

  const handleFormGenerated = useCallback((formCode: string) => {
    setGeneratedFormCode(formCode);
    onFormGenerated?.(formCode);
  }, [onFormGenerated]);

  const handleStreamingStateChange = useCallback((streaming: boolean) => {
    setIsGenerating(streaming);
  }, []);

  const handleFormSubmit = useCallback((formData: Record<string, unknown>) => {
    console.log("Form submitted:", formData);
    onFormSubmit?.(formData);
  }, [onFormSubmit]);

  // Remove automatic conversation creation

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    // Here you would typically load the conversation messages into the chat
  }, []);

  const handleDeleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined);
    }
  }, [currentConversationId]);

  const handleExportConversation = useCallback((conversation: Conversation) => {
    const dataStr = JSON.stringify(conversation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `conversation-${conversation.id}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, []);



  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-1 pb-2 flex-shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
        <h1 className="text-lg font-bold text-foreground">AI Form Builder</h1>
      </div>

      {/* Compact Collapsible Settings & History */}
      <div className="flex-shrink-0 pb-1">
        <div className="flex items-center justify-between mb-1 p-1 bg-muted/20 rounded border">
          <div className="flex items-center gap-2">
            <Settings className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-foreground">Settings</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTopSectionCollapsed(!isTopSectionCollapsed)}
            className="flex items-center gap-1 text-xs h-5 px-2"
          >
            {isTopSectionCollapsed ? (
              <>
                <ChevronDown className="h-3 w-3" />
                Show
              </>
            ) : (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide
              </>
            )}
          </Button>
        </div>

        {!isTopSectionCollapsed && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-1">
            <ConversationHistory
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onExportConversation={handleExportConversation}
            />
            <ProviderSelection
              onConfigChange={handleProviderConfigChange}
              initialConfig={providerConfig}
            />
          </div>
        )}
      </div>

      {/* Chat Interface - Takes ALL Remaining Space */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0 overflow-hidden">
        <ChatInterface
          onFormGenerated={handleFormGenerated}
          onStreamingStateChange={handleStreamingStateChange}
          providerConfig={providerConfig}
          className="h-full overflow-hidden"
        />

        <FormPreview
          formCode={generatedFormCode}
          isStreaming={isGenerating}
          onFormSubmit={handleFormSubmit}
          className="h-full overflow-hidden"
        />
      </div>
    </div>
  );
}

// Export the main component wrapped with QueryClientProvider
export function AIBuilder(props: AIBuilderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AIBuilderCore {...props} />
    </QueryClientProvider>
  );
}