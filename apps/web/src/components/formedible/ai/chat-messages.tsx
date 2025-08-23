"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { streamText, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  MessageSquare,
  Send,
  StopCircle,
  User,
  Bot,
  Loader2,
  ArrowDown,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeBlock } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";
import type { ProviderConfig } from "./provider-selection";
import { extractFormedibleCode } from "@/lib/form-extraction-utils";
import { generateSystemPrompt, defaultParserConfig } from "@/lib/formedible/parser-config-schema";

// MessageContent component to handle code blocks with syntax highlighting
interface MessageContentProps {
  content: string;
}

function MessageContent({ content }: MessageContentProps) {
  // Detect and render code blocks with syntax highlighting
  const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push(
        <span
          key={`text-${lastIndex}`}
          className="whitespace-pre-wrap break-words leading-relaxed"
        >
          {content.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add code block with syntax highlighting
    const language = match[1] || "text";
    const code = match[2];
    parts.push(
      <div key={`code-${match.index}`} className="my-2">
        <CodeBlock
          code={code}
          language={language}
          showLineNumbers={false}
          showCopyButton={true}
          className="text-xs"
          darkMode={true}
          scrollable={false}
        />
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span
        key={`text-${lastIndex}`}
        className="whitespace-pre-wrap break-words leading-relaxed"
      >
        {content.slice(lastIndex)}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      {parts.length > 0 ? (
        parts
      ) : (
        <span className="whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </span>
      )}
    </div>
  );
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatMessagesProps {
  onFormGenerated?: (formCode: string) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onConversationUpdate?: (messages: Message[], isStreamEnd?: boolean) => void;
  onNewConversation?: () => void;
  messages?: Message[];
  className?: string;
  providerConfig?: ProviderConfig | null;
}

export function ChatMessages({
  onFormGenerated,
  onStreamingStateChange,
  onConversationUpdate,
  onNewConversation,
  messages: externalMessages,
  className,
  providerConfig,
}: ChatMessagesProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(externalMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Remove the automatic conversation completion

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Sync with external messages when switching conversations
  useEffect(() => {
    if (externalMessages !== undefined) {
      setMessages(externalMessages);
    }
  }, [externalMessages]);

  // Remove the useEffect that was causing multiple updates

  // Removed auto-scroll - let users control scrolling manually

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const createModel = (config: ProviderConfig): LanguageModel => {
    const { provider, apiKey, model, endpoint } = config;

    switch (provider) {
      case "openai": {
        const openaiProvider = createOpenAI({ apiKey });
        // Flagship latest; swap to "gpt-5-mini" if you prefer cost/latency.
        return openaiProvider(model || "gpt-5");
      }

      case "anthropic": {
        const anthropicProvider = createAnthropic({ apiKey });
        // Latest Sonnet generation
        // TODO : fix this shit ! -_-
        return anthropicProvider(
          model || "claude-sonnet-4"
        ) as unknown as LanguageModel;
      }

      case "google": {
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        // Latest top reasoning model in Gemini API
        return googleProvider(model || "gemini-2.5-pro");
      }

      case "mistral": {
        const mistralProvider = createMistral({ apiKey });
        // Mistral Large 2 (GA, sometimes shown as mistral-large-2407)
        return mistralProvider(model || "mistral-large-2407");
      }

      case "openrouter": {
        const openrouterProvider = createOpenRouter({ apiKey });
        // OpenRouter must route to Kimi K2 per your requirement
        // Common IDs: "openrouter/kimiplus-k2" (preferred) or "moonshotai/moonshot-k2"
        return openrouterProvider.chat(
          model || "openrouter/kimiplus-k2"
        ) as LanguageModel;
      }

      case "openai-compatible": {
        if (!endpoint)
          throw new Error("Endpoint required for OpenAI-compatible providers");
        const openaiCompatible = createOpenAICompatible({
          name: "openai-compatible",
          baseURL: endpoint,
          ...(apiKey && { apiKey }),
        });
        // Use a modern widely supported baseline; adjust to your endpoint's catalog
        return openaiCompatible(model || "gpt-4.1-mini");
      }

      default:
        throw new Error("Unsupported provider");
    }
  };

  const generateResponse = async (userMessage: string) => {
    if (!providerConfig) {
      setError(new Error("Provider configuration required"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      onStreamingStateChange?.(true);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);

      const model = createModel(providerConfig);

      // Get parser configuration from localStorage or use defaults
      let parserConfig = defaultParserConfig;
      try {
        const savedConfig = localStorage.getItem('formedible-parser-config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          parserConfig = { ...defaultParserConfig, ...parsed };
        }
      } catch (error) {
        console.warn('Failed to load parser config, using defaults:', error);
      }

      // Generate dynamic system prompt based on configuration
      const configuredSystemPrompt = generateSystemPrompt(parserConfig);
      
      const baseSystemPrompt = `You are a helpful AI assistant for form creation. You can chat naturally with users about forms, answer questions, and help them design forms.

**IMPORTANT: Only show formedible code blocks when the user specifically asks to create, build, generate, or show a form.**

When creating forms, use formedible code blocks with complete JavaScript object literal syntax including Zod schemas. Chat naturally. Ask clarifying questions. Suggest improvements. Only output formedible blocks when specifically requested.`;

      const systemPrompt = configuredSystemPrompt 
        ? `${baseSystemPrompt}\n\n${configuredSystemPrompt}` 
        : baseSystemPrompt;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const result = streamText({
        model,
        system: systemPrompt,
        messages: [...messages, userMsg].map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: providerConfig.temperature || 0.7,
        maxOutputTokens: providerConfig.maxTokens || 2000,
        abortSignal: abortController.signal,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMsg]);

      let fullResponse = "";
      for await (const textPart of result.textStream) {
        if (abortController.signal.aborted) break;

        fullResponse += textPart;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id ? { ...msg, content: fullResponse } : msg
          )
        );
      }

      // Extract and send formedible code blocks to preview
      if (fullResponse && onFormGenerated) {
        const code = extractFormedibleCode(fullResponse);
        if (code) {
          onFormGenerated(code);
        }
      }

      onStreamingStateChange?.(false);

      // Save conversation to localStorage ONLY on stream end with complete messages
      const finalMessages = [
        ...newMessages, // This includes user message
        { ...assistantMsg, content: fullResponse },
      ];
      onConversationUpdate?.(finalMessages, true);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
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
    <Card
      className={cn(
        "flex flex-col h-full max-h-full border-2 border-accent/30 shadow-lg !py-0 !gap-0 overflow-hidden",
        className
      )}
    >
      <CardHeader className="px-3 pt-1 pb-0 bg-gradient-to-r from-accent/10 to-transparent">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <MessageSquare className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-foreground font-semibold">
              AI Form Builder Chat
            </span>
          </div>
          {onNewConversation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewConversation}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New conversation</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 px-3 pt-0 pb-1 min-h-0 max-h-full relative overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-3 mb-1 pr-2 min-h-0"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                Welcome to AI Form Builder
              </h3>
              <p className="text-sm max-w-md">
                Describe the form you want to create and I'll generate it for
                you. Try something like "Create a contact form with name, email,
                and message fields"
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
                  "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border-2 shadow-md",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary/30"
                    : "bg-muted text-foreground border-border"
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
                  "flex flex-col gap-2 rounded-lg px-4 py-3 text-sm shadow-md border max-w-[85%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary/30"
                    : "bg-background text-foreground border-border"
                )}
              >
                <MessageContent content={message.content} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-4xl mr-auto">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border-2 shadow-md bg-muted text-foreground border-border">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-md border bg-background text-foreground border-border">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Generating response...</span>
              </div>
            </div>
          )}

        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 rounded-full w-10 h-10 p-0 shadow-lg z-10"
            variant="secondary"
            size="sm"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="sr-only">Scroll to bottom</span>
          </Button>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to send message. Please check your configuration and try
              again.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the form you want to create... (Shift+Enter for new line)"
            disabled={isLoading}
            className="flex-1 min-h-[80px] resize-none"
            rows={3}
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