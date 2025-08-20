"use client";

import { useState, useRef, useEffect } from "react";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MessageSquare, Send, StopCircle, User, Bot, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ProviderConfig } from "./provider-selection";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatInterfaceProps {
  onFormGenerated?: (formCode: string) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  className?: string;
  providerConfig?: ProviderConfig | null;
}

export function ChatInterface({ onFormGenerated, onStreamingStateChange, className, providerConfig }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Remove the automatic conversation completion

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createModel = (config: ProviderConfig) => {
    const { provider, apiKey, model, endpoint } = config;
    
    switch (provider) {
      case 'openai':
        const openaiProvider = createOpenAI({ apiKey });
        return openaiProvider(model || 'gpt-4o');
      
      case 'anthropic':
        const anthropicProvider = createAnthropic({ apiKey });
        return anthropicProvider(model || 'claude-3-5-sonnet-20241022');
      
      case 'google':
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        return googleProvider(model || 'gemini-1.5-pro');
      
      case 'mistral':
        const mistralProvider = createMistral({ apiKey });
        return mistralProvider(model || 'mistral-large-latest');
      
      case 'openrouter':
        const openrouterProvider = createOpenRouter({ apiKey });
        return openrouterProvider.chat(model || 'meta-llama/llama-3.2-3b-instruct:free');
      
      case 'openai-compatible':
        if (!endpoint) throw new Error('Endpoint required for OpenAI-compatible providers');
        const openaiCompatible = createOpenAICompatible({
          name: 'openai-compatible',
          baseURL: endpoint,
          ...(apiKey && { apiKey }),
        });
        return openaiCompatible(model || 'gpt-3.5-turbo');
      
      default:
        throw new Error('Unsupported provider');
    }
  };

  const generateResponse = async (userMessage: string) => {
    if (!providerConfig) {
      setError(new Error('Provider configuration required'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      onStreamingStateChange?.(true);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
      };

      setMessages(prev => [...prev, userMsg]);

      const model = createModel(providerConfig);
      
      const systemPrompt = `You are a helpful AI assistant for form creation. You can chat naturally with users about forms, answer questions, and help them design forms.

**IMPORTANT: Only show formedible code blocks when the user specifically asks to create, build, generate, or show a form.**

When creating forms, use formedible code blocks like this:

\`\`\`formedible
{
  "fields": [
    {
      "name": "firstName",
      "type": "text",
      "label": "First Name",
      "placeholder": "Enter your first name"
    }
  ]
}
\`\`\`

Available field types: text, email, password, tel, textarea, select, checkbox, switch, number, date, slider, file, rating, phone, colorPicker, location, duration, multiSelect, autocomplete, masked, object, array, radio

Chat naturally. Ask clarifying questions. Suggest improvements. Only output formedible blocks when specifically requested.`;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const result = await streamText({
        model,
        system: systemPrompt,
        messages: [...messages, userMsg].map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: providerConfig.temperature || 0.7,
        maxOutputTokens: providerConfig.maxTokens || 2000,
        abortSignal: abortController.signal,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMsg]);

      let fullResponse = '';
      for await (const textPart of result.textStream) {
        if (abortController.signal.aborted) break;
        
        fullResponse += textPart;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsg.id 
            ? { ...msg, content: fullResponse }
            : msg
        ));
      }

      // Extract and send formedible code blocks to preview
      if (fullResponse && onFormGenerated) {
        const formedibleMatch = fullResponse.match(/```formedible\s*\n([\s\S]*?)\n```/);
        if (formedibleMatch && formedibleMatch[1]) {
          onFormGenerated(formedibleMatch[1].trim());
        }
      }

      onStreamingStateChange?.(false);

    } catch (err) {
      console.error('AI Generation Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
      onStreamingStateChange?.(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !providerConfig) return;
    
    const userInput = input;
    setInput("");
    generateResponse(userInput);
  };

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className={cn("flex flex-col h-full border-2 border-accent/30 shadow-lg", className)}>
      <CardHeader className="pb-4 bg-gradient-to-r from-accent/10 to-transparent">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 bg-accent/20 rounded-lg">
            <MessageSquare className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-foreground font-semibold">AI Form Builder Chat</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 p-6 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 min-h-0 max-h-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Welcome to AI Form Builder</h3>
              <p className="text-sm max-w-md">
                Describe the form you want to create and I'll generate it for you. 
                Try something like "Create a contact form with name, email, and message fields"
              </p>
            </div>
          )}

          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-4xl",
                message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div
                className={cn(
                  "flex flex-col gap-2 rounded-lg px-3 py-2 text-sm shadow-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-4xl mr-auto">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating form...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to send message. Please check your configuration and try again.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the form you want to create..."
            disabled={isLoading}
            className="flex-1"
          />
          
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stop}
              className="shrink-0"
            >
              <StopCircle className="h-4 w-4" />
              <span className="sr-only">Stop generation</span>
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim()}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}