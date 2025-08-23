"use client";

import { useState, useEffect } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  parserConfigFields, 
  defaultParserConfig, 
  validateParserConfig,
  mergeParserConfig,
  generateSystemPrompt,
  type ParserConfig 
} from "@/lib/formedible/parser-config-schema";
import { Info, RotateCcw, Copy, Check } from "lucide-react";

interface ParserSettingsProps {
  className?: string;
  onConfigChange?: (config: ParserConfig) => void;
}

export function ParserSettings({ className, onConfigChange }: ParserSettingsProps) {
  const [config, setConfig] = useState<ParserConfig>(defaultParserConfig);
  const [lastSavedConfig, setLastSavedConfig] = useState<ParserConfig>(defaultParserConfig);
  const [copied, setCopied] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('formedible-parser-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validateParserConfig(parsed)) {
          setConfig(parsed);
          setLastSavedConfig(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load parser config:', error);
    }
  }, []);

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(config) !== JSON.stringify(lastSavedConfig);

  // Save config to localStorage and notify parent
  const handleSaveConfig = (newConfig: ParserConfig) => {
    try {
      localStorage.setItem('formedible-parser-config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setLastSavedConfig(newConfig);
      onConfigChange?.(newConfig);
    } catch (error) {
      console.error('Failed to save parser config:', error);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    const resetConfig = { ...defaultParserConfig };
    handleSaveConfig(resetConfig);
  };

  // Copy system prompt to clipboard
  const handleCopySystemPrompt = async () => {
    try {
      const systemPrompt = generateSystemPrompt(config);
      const promptToCopy = systemPrompt || 'System prompt will be generated based on current configuration...';
      
      await navigator.clipboard.writeText(promptToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy system prompt:', error);
    }
  };

  // Create form fields with conditional logic
  const formFields = [
    // Basic Configuration Section
    ...parserConfigFields
      .filter(field => 
        ['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'aiErrorMessages'].includes(field.name)
      )
      .map(field => ({
        ...field,
      })),
    
    // Show Advanced Settings (after basic fields)
    {
      name: 'showAdvanced',
      type: 'switch',
      label: 'Show Advanced Settings',
      description: 'Display advanced configuration options',
      defaultValue: false,
    },
    
    // Advanced Configuration Section (conditional)
    ...parserConfigFields
      .filter(field => 
        !['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'aiErrorMessages', 'selectFields', 'systemPromptFields', 'includeTabFormatting', 'includePageFormatting'].includes(field.name)
      )
      .map(field => ({
        ...field,
        conditional: (values: any) => values.showAdvanced === true,
      })),

    // System Prompt Fields
    ...parserConfigFields
      .filter(field => 
        ['selectFields', 'systemPromptFields'].includes(field.name)
      )
      .map(field => ({
        ...field,
        conditional: field.name === 'systemPromptFields'
          ? (values: any) => values.selectFields === true
          : undefined
      })),

    // Formatting Options (always visible)
    ...parserConfigFields
      .filter(field => 
        ['includeTabFormatting', 'includePageFormatting'].includes(field.name)
      )
  ];

  const { Form } = useFormedible<ParserConfig & { showAdvanced: boolean }>({
    fields: formFields,
    formOptions: {
      defaultValues: { 
        ...config, 
        showAdvanced: false,
        // Ensure all system prompt fields have proper defaults
        selectFields: config.selectFields ?? false,
        systemPromptFields: config.systemPromptFields ?? defaultParserConfig.systemPromptFields,
        includeTabFormatting: config.includeTabFormatting ?? defaultParserConfig.includeTabFormatting,
        includePageFormatting: config.includePageFormatting ?? defaultParserConfig.includePageFormatting
      },
      onSubmit: async ({ value }) => {
        // Extract showAdvanced and save the rest
        const { showAdvanced, ...parserConfig } = value;
        const mergedConfig = mergeParserConfig({ ...config, ...parserConfig });
        handleSaveConfig(mergedConfig);
      },
      onChange: ({ value }) => {
        // Update config in real time (but don't save yet)
        const { showAdvanced, ...parserConfig } = value;
        setConfig(prev => ({ ...prev, ...parserConfig }));
      }
    },
    submitLabel: hasChanges ? "Save Settings" : "Settings Saved",
    showSubmitButton: hasChanges,
    autoSubmitOnChange: false,
    layout: {
      type: 'grid',
      columns: 1,
      gap: 'md'
    }
  });

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Form Parser Settings
          </CardTitle>
          <CardDescription>
            Configure how the Formedible parser processes form definitions and handles AI interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Formedible Form */}
          <div className="space-y-4">
            <Form />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button 
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </Button>
            
            <Button
              onClick={handleCopySystemPrompt}
              variant={copied ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Prompt
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">System Prompt Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted rounded-md text-xs overflow-auto max-h-64">
            <pre className="whitespace-pre-wrap">
              {generateSystemPrompt(config) || 'System prompt will be generated based on current configuration...'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}