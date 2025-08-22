"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormedible } from "@/hooks/use-formedible";
import type { ProviderConfig, AIProvider } from "./provider-selection";

interface AgentSettingsProps {
  providerConfig: ProviderConfig | null;
  onConfigChange: (config: ProviderConfig | null) => void;
  className?: string;
}

// OpenRouter models fetcher with memoization
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
      label: model.name,
    }))
    .sort((a: any, b: any) => a.label.localeCompare(b.label));
};

// Memoized function to get model options based on provider
const useModelOptions = (
  provider: AIProvider | undefined,
  openRouterModels: Array<{ value: string; label: string }> = [],
  openRouterLoading: boolean = false
) => {
  return useMemo(() => {
    if (provider === "openai")
      return [
        { value: "gpt-5", label: "GPT-5" },
        { value: "gpt-5-mini", label: "GPT-5 Mini" },
        { value: "gpt-4o", label: "GPT-4o" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      ];
    if (provider === "anthropic")
      return [
        { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
        { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
        { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
      ];
    if (provider === "google")
      return [
        { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
      ];
    if (provider === "mistral")
      return [
        { value: "mistral-large-2407", label: "Mistral Large 2407" },
        { value: "mistral-medium-2312", label: "Mistral Medium 2312" },
        { value: "mistral-small-2312", label: "Mistral Small 2312" },
      ];
    if (provider === "openrouter") {
      if (openRouterLoading) return [{ value: "loading", label: "Loading models..." }];
      return openRouterModels.length > 0
        ? openRouterModels.filter(model => model.value && model.value.trim() !== "")
        : [
            { value: "openrouter/kimiplus-k2", label: "OpenRouter Kimi Plus K2" },
            { value: "moonshotai/moonshot-k2", label: "Moonshot K2" },
          ];
    }
    if (provider === "openai-compatible")
      return [
        { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
        { value: "custom-model", label: "Custom Model" },
      ];
    return [];
  }, [provider, openRouterModels, openRouterLoading]);
};

export function AgentSettings({ providerConfig, onConfigChange, className }: AgentSettingsProps) {
  // Use TanStack Query for OpenRouter models with proper caching
  const {
    data: openRouterModels = [],
    isLoading: openRouterLoading,
    error: openRouterError,
  } = useQuery({
    queryKey: ["openrouter-models", providerConfig?.apiKey],
    queryFn: () => fetchOpenRouterModels(providerConfig?.apiKey || ""),
    enabled: providerConfig?.provider === "openrouter" && !!providerConfig?.apiKey && providerConfig.apiKey.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const availableModels = useModelOptions(
    providerConfig?.provider,
    openRouterModels,
    openRouterLoading
  );

  const { Form } = useFormedible({
    fields: !providerConfig ? [] : [
      {
        name: "model",
        type: "select",
        label: "Model",
        placeholder: "Select a model",
        options: providerConfig?.provider === "openrouter" && openRouterError
          ? [{ value: "error", label: "Failed to load models - check API key" }]
          : availableModels,
      },
      {
        name: "temperature",
        type: "slider",
        label: `Temperature: ${(providerConfig?.temperature || 0.7).toFixed(2)}`,
        sliderConfig: {
          min: 0,
          max: 1,
          step: 0.01,
        },
        description: "Controls randomness: Focused ← → Creative",
      },
      {
        name: "maxTokens",
        type: "number",
        label: "Max Tokens",
        placeholder: "2000",
        description: "Maximum response length",
        numberConfig: {
          min: 1,
          max: 32768,
        },
      },
    ],
    formOptions: {
      defaultValues: {
        model: providerConfig?.model || "",
        temperature: providerConfig?.temperature || 0.7,
        maxTokens: providerConfig?.maxTokens || 2000,
      },
      onSubmit: async ({ value }) => {
        if (!providerConfig) return;
        const updatedConfig: ProviderConfig = {
          ...providerConfig,
          model: value.model,
          temperature: value.temperature,
          maxTokens: value.maxTokens,
        };
        onConfigChange(updatedConfig);
      },
    },
    submitLabel: "💾 Save Model Settings",
    showSubmitButton: !providerConfig ? false : true,
    autoSubmitOnChange: false,
  });

  return (
    <div className={`p-4 space-y-4 ${className || ""}`}>
      <h3 className="text-base font-semibold">Model Settings</h3>
      {!providerConfig ? (
        <p className="text-muted-foreground">Select a provider first to configure model settings</p>
      ) : (
        <Form />
      )}
    </div>
  );
}