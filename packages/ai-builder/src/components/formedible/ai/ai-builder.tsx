"use client";

import { useState, useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProviderSelection, type ProviderConfig } from "./provider-selection";
import { ChatInterface } from "./chat-interface";
import { FormPreview } from "./form-preview";
import { ConversationHistory, type Conversation } from "./conversation-history";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, Settings, History, ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react";
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
  const [generatedForms, setGeneratedForms] = useState<Array<{ id: string; code: string; timestamp: Date }>>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
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
    const newForm = {
      id: `form_${Date.now()}`,
      code: formCode,
      timestamp: new Date()
    };
    
    setGeneratedForms(prev => {
      const updated = [...prev, newForm];
      setCurrentFormIndex(updated.length - 1); // Auto-navigate to newest form
      return updated;
    });
    
    onFormGenerated?.(formCode);
  }, [onFormGenerated]);

  const handleStreamingStateChange = useCallback((streaming: boolean) => {
    setIsGenerating(streaming);
  }, []);

  const handleFormSubmit = useCallback((formData: Record<string, unknown>) => {
    console.log("Form submitted:", formData);
    onFormSubmit?.(formData);
  }, [onFormSubmit]);

  const handleFormIndexChange = useCallback((index: number) => {
    setCurrentFormIndex(index);
  }, []);

  const handleDeleteForm = useCallback((index: number) => {
    setGeneratedForms(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Adjust current index if necessary
      if (index <= currentFormIndex && currentFormIndex > 0) {
        setCurrentFormIndex(currentFormIndex - 1);
      } else if (index < currentFormIndex) {
        // No change needed to currentFormIndex
      } else if (updated.length === 0) {
        setCurrentFormIndex(0);
      } else if (currentFormIndex >= updated.length) {
        setCurrentFormIndex(updated.length - 1);
      }
      return updated;
    });
  }, [currentFormIndex]);

  const handleConversationUpdate = useCallback((messages: Message[], isStreamEnd: boolean = false) => {
    // Always update current messages for UI
    setCurrentMessages(messages);
    
    // Only create/update conversations when needed
    if (messages.length > 0) {
      if (!currentConversationId) {
        // Create new conversation ONLY on first user message
        const newConversationId = `conversation_${Date.now()}`;
        const newConversation: Conversation = {
          id: newConversationId,
          title: "", // Will be generated from first message
          messages,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setConversations(prev => [...prev, newConversation]);
        setCurrentConversationId(newConversationId);
      } else {
        // ALWAYS update existing conversation with new messages (not just on stream end)
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversationId 
            ? { ...conv, messages, updatedAt: new Date() }
            : conv
        ));
      }
    }
  }, [currentConversationId]);

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(undefined);
    setCurrentMessages([]);
    // Clear forms when starting new conversation
    setGeneratedForms([]);
    setCurrentFormIndex(0);
  }, []);

  // Remove automatic conversation creation

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    setCurrentMessages(conversation.messages);
    
    // Extract forms from conversation messages
    const extractedForms: Array<{ id: string; code: string; timestamp: Date }> = [];
    
    conversation.messages.forEach((message, messageIndex) => {
      if (message.role === 'assistant' && message.content) {
        // Look for code blocks containing form definitions
        const codeBlockRegex = /```(?:javascript|js|json)?\s*([\s\S]*?)\s*```/g;
        let match;
        let codeBlockIndex = 0;
        
        while ((match = codeBlockRegex.exec(message.content)) !== null) {
          const code = match[1].trim();
          
          // Check if this looks like a form definition (has fields array)
          if (code.includes('fields:') || code.includes('"fields"') || code.includes('fields =')) {
            console.log('Found form code in conversation:', {
              conversationId: conversation.id,
              messageIndex,
              codeBlockIndex,
              codePreview: code.substring(0, 100) + '...'
            });
            
            extractedForms.push({
              id: `form_${conversation.id}_${messageIndex}_${codeBlockIndex}`,
              code: code,
              timestamp: new Date(conversation.updatedAt)
            });
          }
          codeBlockIndex++;
        }
      }
    });
    
    console.log('Extracted forms from conversation:', extractedForms.length);
    
    // Update generated forms and reset index
    setGeneratedForms(extractedForms);
    setCurrentFormIndex(0);
  }, []);

  const handleDeleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined);
      setCurrentMessages([]);
      // Clear forms when deleting current conversation
      setGeneratedForms([]);
      setCurrentFormIndex(0);
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
      <div className="flex items-center gap-2 px-1 pb-1 flex-shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
        <h1 className="text-lg font-bold text-foreground">AI Form Builder</h1>
      </div>

      {/* Compact Collapsible Settings & History */}
      <div className="flex-shrink-0">
        <div 
          className="flex items-center justify-between mb-1 p-1.5 bg-accent/10 hover:bg-accent/20 rounded-lg border-2 border-accent/20 hover:border-accent/30 transition-all duration-200 shadow-sm cursor-pointer"
          onClick={() => setIsTopSectionCollapsed(!isTopSectionCollapsed)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-accent/20 rounded-md">
              <Settings className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Settings & History</span>
          </div>
          <div className="flex items-center gap-1 text-sm h-7 px-3">
            {isTopSectionCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="font-medium">Show</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="font-medium">Hide</span>
              </>
            )}
          </div>
        </div>

        {!isTopSectionCollapsed && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-1.5 min-h-0 overflow-hidden">
        <ChatInterface
          onFormGenerated={handleFormGenerated}
          onStreamingStateChange={handleStreamingStateChange}
          onConversationUpdate={handleConversationUpdate}
          onNewConversation={handleNewConversation}
          messages={currentMessages}
          providerConfig={providerConfig}
          className="h-full overflow-hidden"
        />

        <FormPreview
          forms={generatedForms}
          currentFormIndex={currentFormIndex}
          onFormIndexChange={handleFormIndexChange}
          onDeleteForm={handleDeleteForm}
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