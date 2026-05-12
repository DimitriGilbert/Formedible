import type { FormedibleFormValues, UseFormedibleOptions } from '@/lib/formedible/types';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'openrouter' | 'openai-compatible';

export type AIBuilderMode = 'backend' | 'direct';

export interface ProviderConfig {
  readonly provider: AIProvider;
  readonly model: string;
  readonly apiKey: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly endpoint?: string;
}

export interface BackendConfig {
  readonly endpoint: string;
  readonly headers?: Readonly<Record<string, string>>;
}

export interface AiMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly formCode?: string;
  readonly timestamp?: number;
}

export interface AiConversation {
  readonly id: string;
  readonly title: string;
  readonly messages: readonly AiMessage[];
  readonly formCode?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface AiGenerationRequest {
  readonly prompt: string;
  readonly providerConfig: ProviderConfig | null;
  readonly messages: readonly AiMessage[];
  readonly systemPrompt: string;
  readonly userMessage: AiMessage;
  readonly conversationId?: string;
}

export interface AiGenerationResult {
  readonly content: string;
  readonly formCode?: string;
}

export interface AiFormParseResult<TFormData extends FormedibleFormValues = FormedibleFormValues> {
  readonly schema: unknown;
  readonly formOptions: UseFormedibleOptions<TFormData>;
  readonly success: boolean;
  readonly error?: string;
}

export interface AiParserConfig {
  readonly strictValidation?: boolean;
  readonly inferDefaultValues?: boolean;
  readonly allowedFieldTypes?: readonly string[];
  readonly allowedKeys?: readonly string[];
  readonly allowedFieldKeys?: readonly string[];
  readonly allowedPageKeys?: readonly string[];
  readonly allowedProgressKeys?: readonly string[];
  readonly allowedFormOptionsKeys?: readonly string[];
}
