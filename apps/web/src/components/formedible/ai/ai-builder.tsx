"use client";

import { useState, useCallback } from "react";
import { ProviderSelection, type ProviderConfig } from "./provider-selection";
import { ChatInterface } from "./chat-interface";
import { FormPreview } from "./form-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIBuilderProps {
  className?: string;
  onFormGenerated?: (formCode: string) => void;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
}

export function AIBuilder({ className, onFormGenerated, onFormSubmit }: AIBuilderProps) {
  const [providerConfig, setProviderConfig] = useState<ProviderConfig | null>(null);
  const [generatedFormCode, setGeneratedFormCode] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleProviderConfigChange = useCallback((config: ProviderConfig | null) => {
    setProviderConfig(config);
  }, []);

  const handleFormGenerated = useCallback((formCode: string) => {
    setGeneratedFormCode(formCode);
    setIsGenerating(false);
    onFormGenerated?.(formCode);
  }, [onFormGenerated]);

  const handleFormSubmit = useCallback((formData: Record<string, unknown>) => {
    console.log("Form submitted:", formData);
    onFormSubmit?.(formData);
  }, [onFormSubmit]);

  const isConfigured = !!providerConfig;

  return (
    <div className={cn("flex flex-col h-full space-y-6", className)}>
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Form Builder</h1>
      </div>

      <ProviderSelection
        onConfigChange={handleProviderConfigChange}
        className="shrink-0"
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col min-h-0">
          <ChatInterface
            onFormGenerated={handleFormGenerated}
            apiEndpoint="/api/chat"
            providerConfig={providerConfig}
            className="flex-1"
          />
        </div>
        
        <div className="flex flex-col min-h-0">
          <FormPreview
            formCode={generatedFormCode}
            isStreaming={isGenerating}
            onFormSubmit={handleFormSubmit}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}