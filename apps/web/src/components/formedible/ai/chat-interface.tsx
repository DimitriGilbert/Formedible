'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validateProviderConfig } from '@/components/formedible/ai/provider-selection';
import { extractFormCode } from '@/lib/formedible/ai-parser';
import type {
  AiGenerationRequest,
  AiGenerationResult,
  AiMessage,
  AIBuilderMode,
  BackendConfig,
  ProviderConfig,
} from '@/lib/formedible/ai-types';
import { cn } from '@/lib/utils';

export interface ChatInterfaceProps {
  readonly providerConfig: ProviderConfig | null;
  readonly mode: AIBuilderMode;
  readonly backendConfig?: BackendConfig;
  readonly messages: readonly AiMessage[];
  readonly onMessagesChange: (messages: readonly AiMessage[]) => void;
  readonly onFormGenerated?: (formCode: string) => void;
  readonly generateForm?: (request: AiGenerationRequest) => Promise<AiGenerationResult>;
  readonly conversationId?: string;
  readonly systemPrompt?: string;
  readonly className?: string;
}

export const DEFAULT_AI_SYSTEM_PROMPT = 'You are Formedible AI Builder. Return a valid Formedible form configuration in a fenced formedible code block when generating or changing a form.';

function createMessage(role: AiMessage['role'], content: string, formCode?: string): AiMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    formCode,
    timestamp: Date.now(),
  };
}

function extractTextFromProviderPayload(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null) {
    if ('content' in payload && typeof payload.content === 'string') {
      return payload.content;
    }

    if ('content' in payload && Array.isArray(payload.content)) {
      return payload.content
        .map((part: unknown) => (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string' ? part.text : ''))
        .join('');
    }

    if ('text' in payload && typeof payload.text === 'string') {
      return payload.text;
    }

    if ('choices' in payload && Array.isArray(payload.choices)) {
      const firstChoice: unknown = payload.choices[0];
      if (typeof firstChoice === 'object' && firstChoice !== null && 'message' in firstChoice) {
        const message: unknown = firstChoice.message;
        if (typeof message === 'object' && message !== null && 'content' in message && typeof message.content === 'string') {
          return message.content;
        }
      }

      if (typeof firstChoice === 'object' && firstChoice !== null && 'delta' in firstChoice) {
        const delta: unknown = firstChoice.delta;
        if (typeof delta === 'object' && delta !== null && 'content' in delta && typeof delta.content === 'string') {
          return delta.content;
        }
      }
    }

    if ('candidates' in payload && Array.isArray(payload.candidates)) {
      const firstCandidate: unknown = payload.candidates[0];
      if (typeof firstCandidate === 'object' && firstCandidate !== null && 'content' in firstCandidate) {
        const content: unknown = firstCandidate.content;
        if (typeof content === 'object' && content !== null && 'parts' in content && Array.isArray(content.parts)) {
          return content.parts
            .map((part: unknown) => (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string' ? part.text : ''))
            .join('');
        }
      }
    }
  }

  throw new Error('AI response must include string content.');
}

function parseSseText(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter((line) => line.length > 0 && line !== '[DONE]')
    .map((line) => {
      try {
        return extractTextFromProviderPayload(JSON.parse(line));
      } catch {
        return line;
      }
    })
    .join('');
}

function getDirectEndpoint(config: ProviderConfig): string {
  if (config.provider === 'openai-compatible') {
    return `${config.endpoint?.replace(/\/$/, '')}/chat/completions`;
  }

  if (config.provider === 'openrouter') {
    return 'https://openrouter.ai/api/v1/chat/completions';
  }

  if (config.provider === 'openai') {
    return 'https://api.openai.com/v1/chat/completions';
  }

  if (config.provider === 'anthropic') {
    return 'https://api.anthropic.com/v1/messages';
  }

  if (config.provider === 'google') {
    return `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  }

  return 'https://api.mistral.ai/v1/chat/completions';
}

function createDirectHeaders(config: ProviderConfig): Readonly<Record<string, string>> {
  if (config.provider === 'anthropic') {
    return {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  if (config.provider === 'google') {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };
}

function createDirectBody(config: ProviderConfig, request: AiGenerationRequest): unknown {
  const messages = request.messages.map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content }));

  if (config.provider === 'anthropic') {
    return {
      model: config.model,
      system: request.systemPrompt,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages,
    };
  }

  if (config.provider === 'google') {
    return {
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      generationConfig: { temperature: config.temperature, maxOutputTokens: config.maxTokens },
      contents: request.messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
    };
  }

  return {
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: false,
    messages: [{ role: 'system', content: request.systemPrompt }, ...request.messages.map((message) => ({ role: message.role, content: message.content }))],
  };
}

async function readAiResponse(response: Response): Promise<AiGenerationResult> {
  const contentType = response.headers.get('Content-Type') ?? '';
  let content: string;

  if (contentType.includes('application/json')) {
    content = extractTextFromProviderPayload(await response.json());
  } else {
    const text = await response.text();
    content = contentType.includes('text/event-stream') ? parseSseText(text) : text;
  }

  return { content, formCode: extractFormCode(content) };
}

async function requestBackend(config: BackendConfig, request: AiGenerationRequest): Promise<AiGenerationResult> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    body: JSON.stringify({
      messages: request.messages,
      systemPrompt: request.systemPrompt,
      userMessage: request.userMessage,
      providerConfig: request.providerConfig,
      conversationId: request.conversationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI backend responded with ${response.status}`);
  }

  return readAiResponse(response);
}

async function requestDirectProvider(request: AiGenerationRequest): Promise<AiGenerationResult> {
  const validationError = validateProviderConfig(request.providerConfig);

  if (validationError) {
    throw new Error(validationError);
  }

  const providerConfig = request.providerConfig;

  if (!providerConfig) {
    throw new Error('Provider configuration is required.');
  }

  const response = await fetch(getDirectEndpoint(providerConfig), {
    method: 'POST',
    headers: createDirectHeaders(providerConfig),
    body: JSON.stringify(createDirectBody(providerConfig, request)),
  });

  if (!response.ok) {
    throw new Error(`AI provider responded with ${response.status}`);
  }

  return readAiResponse(response);
}

export async function generateAiFormCode(
  request: AiGenerationRequest,
  mode: AIBuilderMode,
  backendConfig?: BackendConfig,
  generateForm?: (request: AiGenerationRequest) => Promise<AiGenerationResult>,
): Promise<AiGenerationResult> {
  if (generateForm) {
    const result = await generateForm(request);
    return { ...result, formCode: result.formCode ?? extractFormCode(result.content) };
  }

  if (mode === 'backend' && backendConfig) {
    return requestBackend(backendConfig, request);
  }

  if (mode === 'direct') {
    return requestDirectProvider(request);
  }

  throw new Error('AI Builder requires backendConfig to generate a form in backend mode.');
}

export function ChatInterface({
  providerConfig,
  mode,
  backendConfig,
  messages,
  onMessagesChange,
  onFormGenerated,
  generateForm,
  conversationId,
  systemPrompt = DEFAULT_AI_SYSTEM_PROMPT,
  className,
}: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);

  async function submitPrompt() {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isGenerating) {
      return;
    }

    const userMessage = createMessage('user', trimmedPrompt);
    const nextMessages = [...messages, userMessage];
    onMessagesChange(nextMessages);
    setPrompt('');
    setError(undefined);
    setIsGenerating(true);

    try {
      const result = await generateAiFormCode(
        { prompt: trimmedPrompt, providerConfig, messages: nextMessages, systemPrompt, userMessage, conversationId },
        mode,
        backendConfig,
        generateForm,
      );
      const assistantMessage = createMessage('assistant', result.content, result.formCode);
      onMessagesChange([...nextMessages, assistantMessage]);

      if (result.formCode) {
        onFormGenerated?.(result.formCode);
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : String(generationError));
      onMessagesChange(nextMessages);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className={cn('flex h-full flex-col gap-3', className)}>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto rounded-lg border p-3">
        {messages.length === 0 ? <p className="text-sm text-muted-foreground">Describe the form you want to build.</p> : null}
        {messages.map((message) => (
          <article key={message.id} className={cn('rounded-md p-3 text-sm', message.role === 'user' ? 'bg-muted' : 'border')}>
            <p className="mb-1 font-medium capitalize">{message.role}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </article>
        ))}
      </div>
      {error ? <p className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-2">
        <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Create a multi-step onboarding form..." />
        <Button type="button" disabled={isGenerating || prompt.trim().length === 0} onClick={submitPrompt}>
          {isGenerating ? 'Generating...' : 'Generate form'}
        </Button>
      </div>
    </div>
  );
}

export type { AiGenerationRequest, AiGenerationResult, AiMessage } from '@/lib/formedible/ai-types';
