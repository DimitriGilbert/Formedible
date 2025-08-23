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
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('formedible-parser-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validateParserConfig(parsed)) {
          setConfig(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load parser config:', error);
    }
  }, []);

  // Save config to localStorage and notify parent
  const handleSaveConfig = (newConfig: ParserConfig) => {
    try {
      localStorage.setItem('formedible-parser-config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setHasChanges(false);
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

  // Basic fields (always shown)
  const basicFields = parserConfigFields.filter(field => 
    ['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'aiErrorMessages'].includes(field.name)
  );

  // Advanced fields (shown when expanded)
  const advancedFields = parserConfigFields.filter(field => 
    !['strictValidation', 'enableSchemaInference', 'fieldTypeValidation', 'aiErrorMessages'].includes(field.name)
  );

  const { Form: BasicForm } = useFormedible({
    fields: basicFields,
    formOptions: {
      defaultValues: config,
      onSubmit: async ({ value }) => {
        const mergedConfig = mergeParserConfig({ ...config, ...value });
        handleSaveConfig(mergedConfig);
      },
      onChange: () => setHasChanges(true)
    },
    submitLabel: "Save Basic Settings",
    showSubmitButton: hasChanges,
    autoSubmitOnChange: false,
  });

  const { Form: AdvancedForm } = useFormedible({
    fields: advancedFields,
    formOptions: {
      defaultValues: config,
      onSubmit: async ({ value }) => {
        const mergedConfig = mergeParserConfig({ ...config, ...value });
        handleSaveConfig(mergedConfig);
      },
      onChange: () => setHasChanges(true)
    },
    submitLabel: "Save Advanced Settings",
    showSubmitButton: false,
    autoSubmitOnChange: false,
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
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">Parser Status</p>
              <div className="flex gap-2">
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

          {/* Basic Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Basic Configuration</h4>
            <BasicForm />
          </div>

          {/* Advanced Settings Toggle */}
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-center"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced Settings
            </Button>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Advanced Configuration</h4>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Advanced settings control parser behavior for edge cases and performance optimization.
                  Default values are recommended for most use cases.
                </AlertDescription>
              </Alert>
              <AdvancedForm />
            </div>
          )}

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
            {hasChanges && (
              <Button 
                onClick={() => {
                  const mergedConfig = mergeParserConfig(config);
                  handleSaveConfig(mergedConfig);
                }}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-3 w-3" />
                Save All Changes
              </Button>
            )}
          </div>

          {/* Configuration Preview */}
          {showAdvanced && (
            <details className="pt-2">
              <summary className="text-sm font-medium cursor-pointer">
                Current Configuration (JSON)
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
                {JSON.stringify(config, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Parser Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Parser Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
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
        </CardContent>
      </Card>
    </div>
  );
}