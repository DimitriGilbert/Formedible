import type { ParsedFormConfig } from '@/lib/formedible/parser-types';
import type { FormedibleFormValues, UseFormedibleOptions } from '@formedible/ui/components/formedible/lib/types';

export type AIProvider = 'openai' | 'anthropic' | 'openrouter';

export type AIBuilderMode = 'client';

export type AiMessageRole = 'user' | 'assistant' | 'system';

export type AiMessageStatus = 'idle' | 'submitted' | 'streaming' | 'completed' | 'error' | 'aborted';

export type AiFinishReason = 'stop' | 'length' | 'tool-calls' | 'content-filter' | 'error' | 'abort' | 'unknown';

export type AiJsonValue = string | number | boolean | null | readonly AiJsonValue[] | { readonly [key: string]: AiJsonValue };

export interface ProviderModelSettings {
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface OpenAIProviderSettings extends ProviderModelSettings {
  readonly provider: 'openai';
  readonly model: string;
  readonly endpoint?: never;
  readonly baseURL?: never;
  readonly thinkingBudgetTokens?: never;
}

export interface AnthropicProviderSettings extends ProviderModelSettings {
  readonly provider: 'anthropic';
  readonly model: string;
  readonly endpoint?: never;
  readonly baseURL?: never;
  readonly thinkingBudgetTokens?: number;
}

export interface OpenRouterProviderSettings extends ProviderModelSettings {
  readonly provider: 'openrouter';
  readonly model: string;
  readonly endpoint?: never;
  readonly baseURL?: never;
  readonly thinkingBudgetTokens?: never;
}

export type ProviderSettings = OpenAIProviderSettings | AnthropicProviderSettings | OpenRouterProviderSettings;

export interface ProviderSecrets {
  readonly provider: AIProvider;
  readonly apiKey: string;
}

export interface AiUsageMetadata {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
  readonly cachedInputTokens?: number;
  readonly reasoningTokens?: number;
}

export interface AiGenerationMetadata {
  readonly provider: AIProvider;
  readonly model: string;
  readonly finishReason?: AiFinishReason;
  readonly usage?: AiUsageMetadata;
  readonly startedAt?: number;
  readonly finishedAt?: number;
  readonly requestId?: string;
  readonly metadata?: Readonly<Record<string, AiJsonValue>>;
}

export interface AiParseError {
  readonly message: string;
  readonly code?: string;
  readonly field?: string;
  readonly line?: number;
  readonly column?: number;
  readonly details?: unknown;
}

export interface AiErrorInfo {
  readonly message: string;
  readonly code?: string;
  readonly recoverable?: boolean;
  readonly details?: unknown;
}

export interface AiToolChunk {
  readonly toolCallId?: string;
  readonly toolName?: string;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly raw?: unknown;
}

export type AiStreamEvent =
  | {
      readonly type: 'text-delta';
      readonly delta: string;
      readonly raw?: unknown;
      readonly receivedAt: number;
    }
  | {
      readonly type: 'thinking-delta';
      readonly delta: string;
      readonly raw?: unknown;
      readonly receivedAt: number;
    }
  | {
      readonly type: 'tool-call' | 'tool-result';
      readonly tool: AiToolChunk;
      readonly receivedAt: number;
    }
  | {
      readonly type: 'error';
      readonly error: AiErrorInfo;
      readonly raw?: unknown;
      readonly receivedAt: number;
    }
  | {
      readonly type: 'finish';
      readonly finishReason: AiFinishReason;
      readonly usage?: AiUsageMetadata;
      readonly raw?: unknown;
      readonly receivedAt: number;
    }
  | {
      readonly type: 'raw';
      readonly event: unknown;
      readonly receivedAt: number;
      readonly source?: string;
    };

export type AiMessagePart =
  | {
      readonly type: 'text';
      readonly text: string;
    }
  | {
      readonly type: 'thinking';
      readonly text: string;
    }
  | {
      readonly type: 'tool';
      readonly tool: AiToolChunk;
    }
  | {
      readonly type: 'raw';
      readonly value: unknown;
    };

export interface AiRawOutput {
  readonly text: string;
  readonly chunks?: readonly string[];
  readonly events?: readonly AiStreamEvent[];
}

export interface AiThinkingOutput {
  readonly text: string;
  readonly chunks?: readonly string[];
}

export interface GeneratedFormSnapshot {
  readonly id: string;
  readonly conversationId: string;
  readonly messageId: string;
  readonly formCode: string;
  readonly formConfig?: ParsedFormConfig;
  readonly parseErrors?: readonly AiParseError[];
  readonly status: 'extracted' | 'parsed' | 'parse-error';
  readonly createdAt: number;
  readonly provider?: AIProvider;
  readonly model?: string;
  readonly metadata?: Readonly<Record<string, AiJsonValue>>;
}

export interface AiMessage {
  readonly id: string;
  readonly role: AiMessageRole;
  readonly content: string;
  readonly rawContent?: string;
  readonly thinking?: string;
  readonly parts?: readonly AiMessagePart[];
  readonly events?: readonly AiStreamEvent[];
  readonly formCode?: string;
  readonly formConfig?: ParsedFormConfig;
  readonly parseErrors?: readonly AiParseError[];
  readonly timestamp?: number;
  readonly createdAt?: number;
  readonly updatedAt?: number;
  readonly provider?: AIProvider;
  readonly model?: string;
  readonly generation?: AiGenerationMetadata;
  readonly status?: AiMessageStatus;
}

export interface AiConversationMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly activeProvider?: AIProvider;
  readonly activeModel?: string;
  readonly values?: Readonly<Record<string, AiJsonValue>>;
}

export interface AiConversation {
  readonly id: string;
  readonly title: string;
  readonly messages: readonly AiMessage[];
  readonly generatedForms?: readonly GeneratedFormSnapshot[];
  readonly activeGeneratedFormId?: string;
  readonly formCode?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata?: AiConversationMetadata;
}

export interface AiConversationExport {
  readonly version: 1;
  readonly conversation: AiConversation;
  readonly exportedAt: number;
  readonly metadata?: Readonly<Record<string, AiJsonValue>>;
}

export interface AiGenerationRequest {
  readonly prompt: string;
  readonly providerSettings: ProviderSettings | null;
  readonly providerSecrets: ProviderSecrets | null;
  readonly messages: readonly AiMessage[];
  readonly systemPrompt: string;
  readonly userMessage: AiMessage;
  readonly conversationId?: string;
}

export interface AiGenerationResult {
  readonly content: string;
  readonly finalText?: string;
  readonly rawOutput?: AiRawOutput;
  readonly thinkingOutput?: AiThinkingOutput;
  readonly formCode?: string;
  readonly formConfig?: ParsedFormConfig;
  readonly usage?: AiUsageMetadata;
  readonly provider?: AIProvider;
  readonly model?: string;
  readonly finishReason?: AiFinishReason;
  readonly errors?: readonly AiErrorInfo[];
  readonly events?: readonly AiStreamEvent[];
  readonly metadata?: AiGenerationMetadata;
}

export interface AiFormParseResult<TFormData extends FormedibleFormValues = FormedibleFormValues> {
  readonly schema: unknown;
  readonly formOptions: UseFormedibleOptions<TFormData>;
  readonly success: boolean;
  readonly error?: string;
  readonly errors?: readonly AiParseError[];
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
