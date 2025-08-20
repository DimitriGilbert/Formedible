"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { streamText } from "ai";
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

export interface ChatInterfaceProps {
  onFormGenerated?: (formCode: string) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onConversationUpdate?: (messages: Message[], isStreamEnd?: boolean) => void;
  onNewConversation?: () => void;
  messages?: Message[];
  className?: string;
  providerConfig?: ProviderConfig | null;
}

export function ChatInterface({
  onFormGenerated,
  onStreamingStateChange,
  onConversationUpdate,
  onNewConversation,
  messages: externalMessages,
  className,
  providerConfig,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(externalMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Remove the automatic conversation completion

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShowScrollToBottom(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Sync with external messages only when switching conversations
  useEffect(() => {
    if (
      externalMessages &&
      externalMessages.length > 0 &&
      messages.length === 0
    ) {
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

  const createModel = (config: ProviderConfig) => {
    const { provider, apiKey, model, endpoint } = config;

    switch (provider) {
      case "openai":
        const openaiProvider = createOpenAI({ apiKey });
        return openaiProvider(model || "gpt-4o");

      case "anthropic":
        const anthropicProvider = createAnthropic({ apiKey });
        return anthropicProvider(model || "claude-3-5-sonnet-20241022");

      case "google":
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        return googleProvider(model || "gemini-1.5-pro");

      case "mistral":
        const mistralProvider = createMistral({ apiKey });
        return mistralProvider(model || "mistral-large-latest");

      case "openrouter":
        const openrouterProvider = createOpenRouter({ apiKey });
        return openrouterProvider.chat(
          model || "meta-llama/llama-3.2-3b-instruct:free"
        );

      case "openai-compatible":
        if (!endpoint)
          throw new Error("Endpoint required for OpenAI-compatible providers");
        const openaiCompatible = createOpenAICompatible({
          name: "openai-compatible",
          baseURL: endpoint,
          ...(apiKey && { apiKey }),
        });
        return openaiCompatible(model || "gpt-3.5-turbo");

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

      // Immediately save user message
      onConversationUpdate?.(newMessages, false);

      const model = createModel(providerConfig);

      const systemPrompt = `You are a helpful AI assistant for form creation. You can chat naturally with users about forms, answer questions, and help them design forms.

**IMPORTANT: Only show formedible code blocks when the user specifically asks to create, build, generate, or show a form.**

When creating forms, use formedible code blocks with complete JavaScript object literal syntax including Zod schemas:

\`\`\`formedible
{
  schema: z.object({
    firstName: z.string().min(1, 'First name is required'),
    email: z.string().email('Please enter a valid email address'),
    age: z.number().min(18, 'Must be 18 or older').optional(),
    newsletter: z.boolean().default(false)
  }),
  fields: [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      placeholder: 'Enter your first name'
    },
    {
      name: 'email',
      type: 'email', 
      label: 'Email Address',
      placeholder: 'your@email.com'
    },
    {
      name: 'age',
      type: 'number',
      label: 'Age',
      placeholder: '18+'
    },
    {
      name: 'newsletter',
      type: 'checkbox',
      label: 'Subscribe to newsletter'
    }
  ],
  formOptions: {
    defaultValues: {
      firstName: '',
      email: '',
      newsletter: false
    }
  }
}
\`\`\`

**CRITICAL REQUIREMENTS:**
- ALWAYS include complete Zod schema with proper validation
- Use JavaScript object literals (unquoted keys, single quotes for strings) 
- Match schema field names EXACTLY with field names
- Include proper Zod validations: .min(), .max(), .email(), .optional(), .default()
- Available field types: text, email, password, tel, textarea, select, checkbox, switch, number, date, slider, file, rating, phone, colorPicker, location, duration, multiSelect, autocomplete, masked, object, array, radio

**Zod Schema Examples:**
- z.string().min(1, 'Required') - required text
- z.string().email('Invalid email') - email validation  
- z.number().min(18, 'Must be 18+') - number with min
- z.boolean().default(false) - checkbox with default
- z.string().optional() - optional field
- z.enum(['option1', 'option2']) - select options
- z.array(z.string()) - multiSelect

**ARRAY FIELDS - Use arrayConfig with proper configuration:**

Simple string arrays:
\`\`\`javascript
{
  name: 'contactMethods',
  type: 'array',
  label: 'Contact Email Addresses',
  arrayConfig: {
    itemType: 'email',
    itemLabel: 'Email Address',
    itemPlaceholder: 'contact@company.com',
    minItems: 1,
    maxItems: 5,
    addButtonLabel: 'Add Email',
    removeButtonLabel: 'Remove',
    defaultValue: ''
  }
}
\`\`\`

Complex object arrays:
\`\`\`javascript
{
  name: 'teamMembers',
  type: 'array',
  label: 'Team Members',
  arrayConfig: {
    itemType: 'object',
    itemLabel: 'Team Member',
    minItems: 1,
    maxItems: 10,
    sortable: true,
    addButtonLabel: 'Add Team Member',
    removeButtonLabel: 'Remove Member',
    defaultValue: {
      name: '',
      email: '',
      role: 'developer'
    },
    objectConfig: {
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Enter name'
        },
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          placeholder: 'Enter email'
        },
        {
          name: 'role',
          type: 'select',
          label: 'Role',
          options: [
            { value: 'developer', label: 'Developer' },
            { value: 'designer', label: 'Designer' }
          ]
        }
      ]
    }
  }
}
\`\`\`

**STANDALONE OBJECT FIELDS - Use objectConfig with fields:**

\`\`\`javascript
{
  name: 'atmosphericConditions',
  type: 'object',
  label: 'Atmospheric Conditions',
  description: 'Fundamental atmospheric parameters',
  objectConfig: {
    title: 'Atmospheric Parameters',
    collapsible: true,
    defaultExpanded: true,
    columns: 2,
    layout: 'grid',
    fields: [
      {
        name: 'altitude',
        type: 'number',
        label: 'Altitude',
        placeholder: 'Enter altitude in meters'
      },
      {
        name: 'pressure',
        type: 'number',
        label: 'Pressure',
        placeholder: 'Enter pressure in hPa'
      },
      {
        name: 'temperature',
        type: 'slider',
        label: 'Temperature',
        min: -50,
        max: 50,
        step: 1
      }
    ]
  }
}
\`\`\`

**NESTED OBJECT FIELDS - Objects inside objects:**

\`\`\`javascript
{
  name: 'location',
  type: 'object',
  label: 'Location Details',
  objectConfig: {
    fields: [
      {
        name: 'coordinates',
        type: 'object',
        label: 'GPS Coordinates',
        objectConfig: {
          fields: [
            {
              name: 'latitude',
              type: 'number',
              label: 'Latitude',
              placeholder: 'Enter latitude'
            },
            {
              name: 'longitude',
              type: 'number',
              label: 'Longitude',
              placeholder: 'Enter longitude'
            }
          ]
        }
      }
    ]
  }
}
\`\`\`

**Optional properties:**
- pages: [...] for multi-page forms
- progress: { showSteps: true, showPercentage: false }
- submitLabel: 'Submit Form'
- formOptions: { defaultValues: {...}, onSubmit: async (data) => {...} }

Chat naturally. Ask clarifying questions. Suggest improvements. Only output formedible blocks when specifically requested.`;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const result = await streamText({
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
        const formedibleMatch = fullResponse.match(
          /```formedible\s*\n([\s\S]*?)\n```/
        );
        if (formedibleMatch && formedibleMatch[1]) {
          onFormGenerated(formedibleMatch[1].trim());
        }
      }

      onStreamingStateChange?.(false);

      // Save conversation to localStorage ONLY on stream end with complete messages
      setMessages((currentMessages) => {
        // Use a microtask to defer the parent update until after current render cycle
        Promise.resolve().then(() => {
          onConversationUpdate?.(currentMessages, true);
        });
        return currentMessages;
      });
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
        "flex flex-col h-full border-2 border-accent/30 shadow-lg !py-0 !gap-0",
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

      <CardContent className="flex flex-col flex-1 px-3 pt-0 pb-1 min-h-0 relative">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-3 mb-1 pr-2 min-h-0 max-h-full"
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

          <div ref={messagesEndRef} />
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
