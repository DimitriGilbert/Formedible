"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronUp, Settings, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AIProvider = "openai" | "anthropic" | "google" | "mistral" | "openrouter" | "openai-compatible";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  endpoint?: string;
}

export interface ProviderSelectionProps {
  onConfigChange: (config: ProviderConfig | null) => void;
  className?: string;
}

const STORAGE_KEY = "ai-builder-provider-config";

const configSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "mistral", "openrouter", "openai-compatible"]),
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().optional(),
  endpoint: z.string().url("Please enter a valid URL").optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

const PROVIDERS = [
  { 
    value: "openai" as const, 
    label: "OpenAI", 
    models: [] as string[], // Will be fetched from API
    requiresKey: true,
    description: "GPT-4, GPT-3.5 Turbo models",
    supportsModelFetch: true
  },
  { 
    value: "anthropic" as const, 
    label: "Anthropic", 
    models: [] as string[], // Will be fetched from API
    requiresKey: true,
    description: "Claude 3.5 Sonnet, Claude 3 models",
    supportsModelFetch: true
  },
  { 
    value: "google" as const, 
    label: "Google Gemini", 
    models: [] as string[], // Will be fetched from API
    requiresKey: true,
    description: "Gemini Pro, Gemini Flash models",
    supportsModelFetch: true
  },
  { 
    value: "mistral" as const, 
    label: "Mistral", 
    models: [] as string[], // Will be fetched from API
    requiresKey: true,
    description: "Mistral Large, Medium, Small models",
    supportsModelFetch: true
  },
  { 
    value: "openrouter" as const, 
    label: "OpenRouter", 
    models: [] as string[], // Will be fetched from API
    requiresKey: true,
    description: "Access to multiple models via OpenRouter",
    supportsModelFetch: true
  },
  { 
    value: "openai-compatible" as const, 
    label: "OpenAI Compatible", 
    models: ["Enter custom model name"], // User can specify
    requiresKey: false,
    description: "Custom endpoints (Ollama, LocalAI, etc.)",
    requiresEndpoint: true
  }
];

interface StoredConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  endpoint?: string;
  timestamp: number;
}

export function ProviderSelection({ onConfigChange, className }: ProviderSelectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});
  const [currentConfig, setCurrentConfig] = useState<ProviderConfig | null>(null);

  // Fetch models from API for a provider
  const fetchModels = useCallback(async (provider: AIProvider, apiKey: string, endpoint?: string) => {
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, endpoint })
      });
      
      if (response.ok) {
        const { models } = await response.json();
        setAvailableModels(prev => ({ ...prev, [provider]: models }));
        return models;
      }
    } catch (error) {
      console.error(`Failed to fetch models for ${provider}:`, error);
    }
    return [];
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConfig: StoredConfig = JSON.parse(stored);
        // Check if config is less than 24 hours old
        const isRecent = Date.now() - parsedConfig.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          const config: ProviderConfig = {
            provider: parsedConfig.provider,
            apiKey: parsedConfig.apiKey,
            model: parsedConfig.model,
            endpoint: parsedConfig.endpoint,
          };
          setCurrentConfig(config);
          onConfigChange(config);
          setIsCollapsed(true); // Keep collapsed if we have a valid config
          
          // Fetch models for the configured provider
          const provider = PROVIDERS.find(p => p.value === config.provider);
          if (provider?.supportsModelFetch) {
            fetchModels(config.provider, config.apiKey, config.endpoint);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setIsCollapsed(false); // Expand if config is stale
        }
      } else {
        setIsCollapsed(false); // Expand if no config
      }
    } catch (error) {
      console.error("Failed to load provider config:", error);
      setIsCollapsed(false);
    }
  }, [onConfigChange, fetchModels]);

  const saveConfig = useCallback(async (config: ProviderConfig) => {
    try {
      // Fetch models if this provider supports it
      const provider = PROVIDERS.find(p => p.value === config.provider);
      if (provider?.supportsModelFetch) {
        await fetchModels(config.provider, config.apiKey, config.endpoint);
      }
      
      const toStore: StoredConfig = {
        ...config,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      setCurrentConfig(config);
      onConfigChange(config);
      setIsCollapsed(true);
    } catch (error) {
      console.error("Failed to save provider config:", error);
    }
  }, [onConfigChange, fetchModels]);

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentConfig(null);
      onConfigChange(null);
      setIsCollapsed(false);
    } catch (error) {
      console.error("Failed to clear provider config:", error);
    }
  }, [onConfigChange]);

  const { Form } = useFormedible<ConfigFormData>({
    schema: configSchema,
    tabs: [
      {
        id: "config",
        label: "Provider Configuration",
        description: "Choose your AI provider and configure credentials"
      },
      {
        id: "models",
        label: "Model Selection",
        description: "Select the specific model to use"
      }
    ],
    fields: [
      {
        name: "provider",
        type: "select",
        label: "AI Provider",
        description: "Choose your preferred AI provider",
        tab: "config",
        options: PROVIDERS.map(p => ({ value: p.value, label: `${p.label} - ${p.description}` })),
        section: {
          title: "Provider Settings",
          description: "Configure your AI provider credentials",
          collapsible: false
        }
      },
      {
        name: "apiKey",
        type: "password",
        label: "API Key",
        description: "Your API key is stored locally and never sent to our servers",
        placeholder: "Enter your API key",
        tab: "config",
        conditional: (values) => {
          const provider = PROVIDERS.find(p => p.value === values.provider);
          return !!provider?.requiresKey;
        }
      },
      {
        name: "endpoint",
        type: "text",
        label: "Endpoint URL",
        description: "Enter the base URL for your OpenAI-compatible API endpoint",
        placeholder: "https://api.example.com/v1",
        tab: "config",
        conditional: (values) => {
          const provider = PROVIDERS.find(p => p.value === values.provider);
          return !!provider?.requiresEndpoint;
        }
      },
      {
        name: "model",
        type: "select",
        label: "Model",
        description: "Select the specific model to use for generation",
        tab: "models",
        conditional: (values) => !!values.provider,
        options: (values) => {
          const provider = PROVIDERS.find(p => p.value === values.provider);
          if (!provider) return [];
          
          const models = availableModels[provider.value] || provider.models;
          return models.map(model => ({ value: model, label: model }));
        },
        section: {
          title: "Model Configuration",
          description: "Choose the specific AI model for your use case",
          collapsible: false
        }
      }
    ],
    formOptions: {
      defaultValues: {
        provider: (currentConfig?.provider || "") as AIProvider,
        apiKey: currentConfig?.apiKey || "",
        model: currentConfig?.model || "",
        endpoint: currentConfig?.endpoint || "",
      },
      onSubmit: async ({ value }) => {
        saveConfig({
          provider: value.provider,
          apiKey: value.apiKey,
          model: value.model,
          endpoint: value.endpoint,
        });
      },
    },
    submitLabel: "Save Configuration",
    formClassName: "w-full max-w-2xl mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl",
  });

  const isConfigured = !!currentConfig;
  const provider = currentConfig ? PROVIDERS.find(p => p.value === currentConfig.provider) : null;

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>AI Provider Configuration</CardTitle>
            {isConfigured && (
              <div className="flex items-center gap-1 text-green-600">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {provider?.label} {currentConfig.model && `(${currentConfig.model})`}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="gap-2"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
        
        {isConfigured && isCollapsed && (
          <div className="pt-2">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                ✅ Configured with {provider?.label} {currentConfig.model && `using ${currentConfig.model}`}
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearConfig}
                  className="h-auto p-0 ml-2 text-red-600 hover:text-red-700"
                >
                  Clear
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="pt-0">
          {!isConfigured && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure your AI provider to start building forms with AI assistance.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <Form />
            
            {isConfigured && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={clearConfig}
                  className="w-full"
                >
                  Clear Configuration
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}