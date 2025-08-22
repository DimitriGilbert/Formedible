// AI Builder specific types - imports builder types when synced
import type { FormField, FormConfig } from "@/lib/formedible/builder-types";

// AI Provider Types
export interface AIProvider {
  id: string;
  name: string;
  icon?: string;
  models: string[];
  apiKeyRequired: boolean;
  description?: string;
}

// AI Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: number;
    error?: string;
  };
}

// AI Form Generation Types
export interface AIFormRequest {
  description: string;
  provider: string;
  model: string;
  context?: {
    existingFields?: FormField[];
    requirements?: string[];
    constraints?: string[];
  };
}

export interface AIFormResponse {
  success: boolean;
  config?: FormConfig;
  error?: string;
  metadata?: {
    provider: string;
    model: string;
    tokens: number;
    processingTime: number;
  };
}

// Conversation Types
export interface ConversationHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  formConfig?: FormConfig;
}

// AI Builder Component Props
export interface AIBuilderProps {
  className?: string;
  onFormGenerated?: (config: FormConfig) => void;
  initialPrompt?: string;
  enabledProviders?: string[];
}

export interface ChatInterfaceProps {
  onFormGenerated: (config: FormConfig) => void;
  className?: string;
}

export interface ProviderSelectionProps {
  onProviderChange: (provider: string, model: string) => void;
  enabledProviders?: string[];
  className?: string;
}