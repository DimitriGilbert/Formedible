"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewControls } from "./preview-controls";
import { FormedibleParser, type ParsedFormConfig, type ParsedFieldConfig } from "./formedible-parser";
import { Eye, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormConfiguration {
  title?: string;
  description?: string;
  fields: Array<ParsedFieldConfig & {
    id?: string;
    page?: number;
    group?: string;
    section?: unknown;
    help?: unknown;
    inlineValidation?: unknown;
  }>;
  pages?: Array<{
    page: number;
    title: string;
    description?: string;
  }>;
  settings?: {
    submitLabel?: string;
    nextLabel?: string;
    previousLabel?: string;
    showProgress?: boolean;
    allowPageNavigation?: boolean;
    resetOnSubmit?: boolean;
  };
}

export interface FormPreviewBaseProps {
  formCode?: string;
  isStreaming?: boolean;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
  className?: string;
  title?: string;
  emptyStateMessage?: string;
}

export function FormPreviewBase({ 
  formCode,
  isStreaming = false, 
  onFormSubmit, 
  className,
  title = "Form Preview",
  emptyStateMessage = "No form generated yet. The preview will appear here once a form is created."
}: FormPreviewBaseProps) {
  
  const parsedConfig = useMemo<FormConfiguration | null>(() => {
    if (!formCode) return null;
    
    try {
      console.log('Attempting to parse form code:', {
        codeLength: formCode.length,
        codePreview: formCode.substring(0, 200) + '...'
      });
      
      const parsed: ParsedFormConfig = FormedibleParser.parse(formCode);
      
      console.log('Successfully parsed form config:', {
        fieldsCount: parsed.fields.length,
        hasSchema: !!parsed.schema,
        title: parsed.title
      });
      
      // Convert to builder preview format
      const config: FormConfiguration = {
        title: parsed.title || "Generated Form",
        description: parsed.description,
        fields: parsed.fields.map((field, index) => ({
          ...field,
          id: field.name || `field_${index}`, // Use name as ID fallback
        })),
        pages: parsed.pages || [],
        settings: {
          submitLabel: parsed.submitLabel || "Submit",
          nextLabel: parsed.nextLabel || "Next",
          previousLabel: parsed.previousLabel || "Previous", 
          showProgress: parsed.progress?.showSteps || false,
          allowPageNavigation: true,
          resetOnSubmit: false,
        }
      };
      
      return config;
    } catch (error) {
      console.error('Error parsing form configuration:', {
        error: error instanceof Error ? error.message : String(error),
        formCodePreview: formCode.substring(0, 500)
      });
      return null;
    }
  }, [formCode]);

  if (!formCode && !isStreaming) {
    return (
      <Card className={cn("flex flex-col h-full", className)}>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50 mx-auto" />
            <h3 className="text-lg font-medium mb-2">No Form Available</h3>
            <p className="text-sm max-w-md">
              {emptyStateMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      
      <CardContent className={cn("flex-1 overflow-hidden", title ? "p-0" : "p-0")}>
        <div className="h-full">
          {isStreaming && !formCode && (
            <div className="p-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Form is being generated... Please wait for completion.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {formCode && parsedConfig && (
            <PreviewControls
              config={parsedConfig}
              code={formCode}
              showModeSelector={true}
              showDeviceSelector={true}
              onFormSubmit={onFormSubmit}
              className="border-0 h-full"
            />
          )}

          {formCode && !parsedConfig && (
            <div className="p-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to parse the form configuration. The form may have invalid syntax.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}