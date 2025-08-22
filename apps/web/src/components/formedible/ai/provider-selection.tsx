"use client";

import { useFormedible } from "@/hooks/use-formedible";

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

export function ProviderSelection({
  onConfigChange,
  initialConfig,
  className,
}: ProviderSelectionProps) {
  const { Form } = useFormedible({
    fields: [
      {
        name: "provider",
        type: "select",
        label: "Provider",
        placeholder: "Select provider...",
        options: PROVIDERS.map((p) => ({ value: p.value, label: p.label })),
      },
      {
        name: "apiKey",
        type: "password",
        label: "API Key",
        placeholder: "Enter your API key...",
        // conditional: (values) => {
        //   const provider = PROVIDERS.find(p => p.value === values.provider);
        //   return provider?.requiresKey || false;
        // },
        description:
          "Your API key is stored securely and never sent to our servers",
      },
      {
        name: "endpoint",
        type: "text",
        label: "API Endpoint",
        placeholder: "https://api.example.com/v1",
        conditional: (values) => values.provider === "openai-compatible",
        description: "Base URL for OpenAI-compatible API",
      },
    ],
    formOptions: {
      defaultValues: {
        provider: initialConfig?.provider,
        apiKey: initialConfig?.apiKey || "",
        endpoint: initialConfig?.endpoint || "",
      },
      onSubmit: async ({ value }) => {
        const config: ProviderConfig = {
          provider: value.provider as AIProvider,
          apiKey: value.apiKey || "",
          ...(value.endpoint && { endpoint: value.endpoint }),
        };
        onConfigChange(config);
      },
    },
    submitLabel: "💾 Save Configuration",
    showSubmitButton: true,
    autoSubmitOnChange: false,
  });

  return (
    <div className={`p-4 space-y-4 ${className || ""}`}>
      <h3 className="text-base font-semibold">AI Provider</h3>
      <Form />
    </div>
  );
}
