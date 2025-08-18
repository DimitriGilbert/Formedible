"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Key, Server } from "lucide-react";

export type AIProvider = "openai" | "anthropic" | "google" | "mistral" | "openrouter" | "openai-compatible";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  endpoint?: string;
}

export interface ProviderSelectionProps {
  onConfigChange: (config: ProviderConfig | null) => void;
  className?: string;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI", requiresKey: true },
  { value: "anthropic", label: "Anthropic", requiresKey: true },
  { value: "google", label: "Google Gemini", requiresKey: true },
  { value: "mistral", label: "Mistral", requiresKey: true },
  { value: "openrouter", label: "OpenRouter", requiresKey: true },
  { value: "openai-compatible", label: "OpenAI Compatible", requiresKey: false },
] as const;

export function ProviderSelection({ onConfigChange, className }: ProviderSelectionProps) {
  const [provider, setProvider] = useState<AIProvider | "">("");
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const selectedProvider = PROVIDERS.find(p => p.value === provider);
  const showEndpointField = provider === "openai-compatible";
  const isValid = provider && (selectedProvider?.requiresKey ? apiKey.trim() : showEndpointField ? endpoint.trim() : true);

  const handleSave = () => {
    if (!isValid) return;

    const config: ProviderConfig = {
      provider: provider as AIProvider,
      apiKey: apiKey.trim(),
      ...(showEndpointField && endpoint.trim() && { endpoint: endpoint.trim() }),
    };

    onConfigChange(config);
  };

  const handleClear = () => {
    setProvider("");
    setApiKey("");
    setEndpoint("");
    onConfigChange(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          AI Provider Configuration
        </CardTitle>
        <CardDescription>
          Choose your AI provider and configure your API credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={provider}
            onValueChange={(value) => {
              setProvider(value as AIProvider);
              setApiKey("");
              setEndpoint("");
            }}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showEndpointField && (
          <div className="space-y-2">
            <Label htmlFor="endpoint" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Endpoint URL
            </Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.example.com/v1"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the base URL for your OpenAI-compatible API endpoint (including port if needed)
            </p>
          </div>
        )}

        {selectedProvider && (
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
              {!selectedProvider.requiresKey && (
                <span className="text-xs text-muted-foreground">(Optional)</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder={selectedProvider.requiresKey ? "Enter your API key" : "Optional API key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
                tabIndex={-1}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showApiKey ? "Hide" : "Show"} API key
                </span>
              </Button>
            </div>
            {selectedProvider.requiresKey && (
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers
              </p>
            )}
          </div>
        )}

        {provider && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1"
            >
              Save Configuration
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
            >
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}