"use client";

import { useState, useEffect } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  parserConfigFields, 
  defaultParserConfig, 
  validateParserConfig,
  mergeParserConfig,
  type ParserConfig 
} from "@/lib/parser-config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Save, RotateCcw } from "lucide-react";

interface ParserSettingsProps {
  className?: string;
  onConfigChange?: (config: ParserConfig) => void;
}

export function ParserSettings({ className, onConfigChange }: ParserSettingsProps) {
  const [config, setConfig] = useState<ParserConfig>(defaultParserConfig);
  const [lastSavedConfig, setLastSavedConfig] = useState<ParserConfig>(defaultParserConfig);

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

  // Create form fields with conditional logic
  const formFields = [
    // Basic Settings Section
    {
      name: 'showAdvanced',
      type: 'switch',
      label: 'Show Advanced Settings',
      description: 'Display advanced configuration options',
      defaultValue: false,
      section: {
        title: 'Settings View',
        collapsible: false
      }
    },
    
    // Basic Configuration Section
    ...parserConfigFields
      .filter(field => 
        ['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'aiErrorMessages'].includes(field.name)
      )
      .map(field => ({
        ...field,
        section: {
          title: 'Basic Configuration',
          description: 'Core parser settings that affect form processing behavior',
          collapsible: false
        }
      })),
    
    // Advanced Configuration Section (conditional)
    ...parserConfigFields
      .filter(field => 
        !['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'aiErrorMessages'].includes(field.name)
      )
      .map(field => ({
        ...field,
        conditional: (values: any) => values.showAdvanced === true,
        section: {
          title: 'Advanced Configuration',
          description: 'Advanced settings for performance optimization and edge cases',
          collapsible: false
        }
      }))
  ];

  const { Form } = useFormedible<ParserConfig & { showAdvanced: boolean }>({
    fields: formFields,
    formOptions: {
      defaultValues: { ...config, showAdvanced: false },
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
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">Parser Status</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={config.strictValidation ? "default" : "secondary"}>
                  {config.strictValidation ? "Strict" : "Permissive"}
                </Badge>
                <Badge variant={config.aiErrorMessages ? "default" : "secondary"}>
                  {config.aiErrorMessages ? "AI-Friendly" : "Basic"}
                </Badge>
                <Badge variant={config.enableSchemaInference ? "default" : "secondary"}>
                  {config.enableSchemaInference ? "Schema Inference" : "Manual Schema"}
                </Badge>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="destructive">Unsaved Changes</Badge>
            )}
          </div>

          {/* Formedible Form */}
          <div className="space-y-4">
            <Form />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parser Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Parser Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium mb-1">Supported Field Types</p>
              <p className="text-muted-foreground">24 field types including text, email, number, array, object, etc.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Schema Support</p>
              <p className="text-muted-foreground">Full Zod schema parsing with validation and type inference</p>
            </div>
            <div>
              <p className="font-medium mb-1">AI Integration</p>
              <p className="text-muted-foreground">Enhanced error messages and dynamic system prompt creation</p>
            </div>
            <div>
              <p className="font-medium mb-1">Performance</p>
              <p className="text-muted-foreground">Configurable limits: {config.maxCodeLength.toLocaleString()} chars, {config.maxNestingDepth} levels</p>
            </div>
          </div>
          
          {/* Configuration Preview (always available) */}
          <details className="pt-2 border-t">
            <summary className="text-sm font-medium cursor-pointer">
              Current Configuration (JSON)
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
              {JSON.stringify(config, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}