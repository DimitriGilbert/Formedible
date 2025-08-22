"use client";

import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export type AIProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "openrouter"
  | "openai-compatible";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  endpoint?: string;
}

export interface ProviderSelectionProps {
  onConfigChange: (config: ProviderConfig | null) => void;
  initialConfig?: ProviderConfig | null;
  className?: string;
}

const providerSchema = z.object({
  provider: z
    .enum([
      "openai",
      "anthropic",
      "google",
      "mistral",
      "openrouter",
      "openai-compatible",
    ])
    .optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32768).default(16384),
  endpoint: z.string().url().optional(),
});

const PROVIDERS = [
  { value: "openai", label: "OpenAI", requiresKey: true },
  { value: "anthropic", label: "Anthropic", requiresKey: true },
  { value: "google", label: "Google Gemini", requiresKey: true },
  { value: "mistral", label: "Mistral", requiresKey: true },
  { value: "openrouter", label: "OpenRouter", requiresKey: true },
  {
    value: "openai-compatible",
    label: "OpenAI Compatible",
    requiresKey: false,
  },
] as const;

// Separate function to get model options based on provider
const getModelOptions = (
  provider: AIProvider | undefined,
  openRouterModels: Array<{ value: string; label: string }> = [],
  openRouterLoading: boolean = false
) => {
  if (provider === "openai")
    return [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
      { value: "gpt-4o-2024-08-06", label: "GPT-4o (2024-08-06)" },
      { value: "gpt-4o-mini-2024-07-18", label: "GPT-4o Mini (2024-07-18)" },
    ];
  if (provider === "anthropic")
    return [
      { value: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
      { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    ];
  if (provider === "google")
    return [
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ];
  if (provider === "mistral")
    return [
      { value: "mistral-large-2411", label: "Mistral Large 2.1" },
      { value: "mistral-medium-2508", label: "Mistral Medium 3.1" },
      { value: "codestral-2508", label: "Codestral 2508" },
      { value: "ministral-8b-2410", label: "Ministral 8B" },
      { value: "ministral-3b-2410", label: "Ministral 3B" },
      { value: "mistral-small-2506", label: "Mistral Small 3.2" },
    ];
  if (provider === "openrouter") {
    if (openRouterLoading) return [{ value: "loading", label: "Loading models..." }];
    return openRouterModels.length > 0
      ? openRouterModels.filter(model => model.value && model.value.trim() !== "")
      : [
          { value: "openai/gpt-5", label: "OpenAI GPT-5" },
          { value: "openai/gpt-5-mini", label: "OpenAI GPT-5 Mini" },
          { value: "openai/o3-pro", label: "OpenAI o3 Pro" },
          { value: "openai/o3-mini", label: "OpenAI o3 Mini" },
          {
            value: "anthropic/claude-opus-4.1",
            label: "Anthropic Claude Opus 4.1",
          },
          {
            value: "anthropic/claude-sonnet-4",
            label: "Anthropic Claude Sonnet 4",
          },
          { value: "google/gemini-2.5-pro", label: "Google Gemini 2.5 Pro" },
          { value: "deepseek/deepseek-r1", label: "DeepSeek R1" },
          {
            value: "mistralai/mistral-medium-3.1",
            label: "Mistral Medium 3.1",
          },
          { value: "qwen/qwen3-235b-a22b", label: "Qwen Qwen3 235B A22B" },
        ];
  }
  return [];
};

// OpenRouter models fetcher
const fetchOpenRouterModels = async (apiKey: string) => {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data
    .filter((model: any) => model.id && model.name && model.id.trim() !== "")
    .map((model: any) => ({
      value: model.id,
      label: `${model.name} (${model.id})`,
    }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label));
};

export function ProviderSelection({
  onConfigChange,
  initialConfig,
  className,
}: ProviderSelectionProps) {
  const [currentApiKey, setCurrentApiKey] = useState<string>(initialConfig?.apiKey || "");
  const [currentProvider, setCurrentProvider] = useState<AIProvider | undefined>(initialConfig?.provider);

  // Use TanStack Query for OpenRouter models
  const {
    data: openRouterModels = [],
    isLoading: openRouterLoading,
    error: openRouterError,
  } = useQuery({
    queryKey: ["openrouter-models", currentApiKey],
    queryFn: () => fetchOpenRouterModels(currentApiKey),
    enabled: currentProvider === "openrouter" && !!currentApiKey && currentApiKey.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const { Form, form } = useFormedible({
    schema: providerSchema,
    layout: { type: "grid", columns: 2, gap: "lg" },
    fields: [
      // Field 1 - Provider
      {
        name: "provider",
        type: "select",
        label: "AI Provider",
        placeholder: "Select provider...",
        gridColumn: 1,
        options: PROVIDERS.map((p) => ({ value: p.value, label: p.label })),
      },
      // Field 2 - API Key (MOVED BEFORE MODEL)
      {
        name: "apiKey",
        type: "text",
        label: "API Key",
        placeholder: "sk-...",
        gridColumn: 2,
        conditional: (values) => !!values.provider,
        help: {
          tooltip:
            "Your API key is stored securely and never sent to our servers",
        },
      },
      // Field 3 - Model (NOW AFTER API KEY)
      {
        name: "model",
        type: "select",
        label: "Model",
        placeholder: "Select model...",
        gridColumn: 1,
        options: (values) => {
          const models = getModelOptions(
            values.provider as AIProvider | undefined,
            openRouterModels,
            openRouterLoading
          );
          
          // Show error state for OpenRouter if there's an error
          if (values.provider === "openrouter" && openRouterError) {
            return [{ value: "error", label: "Failed to load models - check API key" }];
          }
          
          return models;
        },
        conditional: (values) => !!values.provider,
      },
      // Field 4 - Temperature
      {
        name: "temperature",
        type: "slider",
        label: "Temperature",
        description: "Controls randomness: 0 = focused, 2 = creative",
        gridColumn: 2,
        sliderConfig: {
          min: 0,
          max: 2,
          step: 0.1,
          showValue: true,
          marks: [
            { value: 0, label: "Focused" },
            { value: 1, label: "Balanced" },
            { value: 2, label: "Creative" },
          ],
        },
        conditional: (values) => !!values.provider,
      },
      // Field 5 - Endpoint
      {
        name: "endpoint",
        type: "text",
        label: "API Endpoint",
        placeholder: "https://api.example.com/v1",
        conditional: (values) => values.provider === "openai-compatible",
        gridColumn: 1,
        description: "Base URL for OpenAI-compatible API",
      },
      // Field 6 - Max Tokens
      {
        name: "maxTokens",
        type: "number",
        label: "Max Tokens",
        placeholder: "16384",
        description: "Maximum response length",
        gridColumn: 2,
        numberConfig: {
          min: 1,
          max: 32768,
          step: 1,
        },
        conditional: (values) => !!values.provider,
      },
    ],
    formOptions: {
      defaultValues: {
        provider: initialConfig?.provider,
        model: initialConfig?.model || "",
        apiKey: initialConfig?.apiKey || "",
        endpoint: initialConfig?.endpoint || "",
        temperature: initialConfig?.temperature || 0.7,
        maxTokens: initialConfig?.maxTokens || 16384,
      },
      onSubmit: async ({ value }) => {
        const config: ProviderConfig = {
          provider: value.provider as AIProvider,
          apiKey: value.apiKey || "",
          model: value.model,
          temperature: value.temperature,
          maxTokens: value.maxTokens,
          ...(value.endpoint && { endpoint: value.endpoint }),
        };
        onConfigChange(config);
      },
    },
    submitLabel: "💾 Save Configuration",
    showSubmitButton: true,
    autoSubmitOnChange: false,
  });

  // Use TanStack Form subscriptions to watch specific fields without causing full rerenders
  useEffect(() => {
    const unsubscribeProvider = form.store.subscribe(() => {
      const provider = form.state.values.provider;
      if (provider !== currentProvider) {
        setCurrentProvider(provider as AIProvider);
      }
    });

    const unsubscribeApiKey = form.store.subscribe(() => {
      const apiKey = form.state.values.apiKey;
      if (apiKey && apiKey !== currentApiKey) {
        setCurrentApiKey(apiKey);
      }
    });

    return () => {
      unsubscribeProvider();
      unsubscribeApiKey();
    };
  }, [form, currentProvider, currentApiKey]);

  return <Form />;
}
