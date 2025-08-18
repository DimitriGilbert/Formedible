"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, MessageSquare, Send, StopCircle, User, Bot, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ProviderConfig } from "./provider-selection";

export interface ChatInterfaceProps {
  onFormGenerated?: (formCode: string) => void;
  apiEndpoint?: string;
  className?: string;
  providerConfig?: ProviderConfig | null;
}

export function ChatInterface({ onFormGenerated, apiEndpoint = "/api/chat", className, providerConfig }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      body: providerConfig ? {
        provider: providerConfig.provider,
        apiKey: providerConfig.apiKey,
        ...(providerConfig.endpoint && { endpoint: providerConfig.endpoint }),
      } : {},
    }),
    onFinish: ({ message }: { message: UIMessage }) => {
      const textContent = message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
      if (textContent && onFormGenerated) {
        onFormGenerated(textContent);
      }
    },
  });

  const isLoading = status !== "ready";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Form Builder Chat
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
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

          {messages.map((message: UIMessage) => (
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
                {message.parts.map((part: any, index: number) => {
                  if (part.type === "text") {
                    return (
                      <div key={index} className="whitespace-pre-wrap break-words">
                        {part.text}
                      </div>
                    );
                  }
                  return null;
                })}
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