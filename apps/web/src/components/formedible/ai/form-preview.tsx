"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PreviewControls } from "../builder/preview-controls";
import { Eye, AlertCircle, ChevronLeft, ChevronRight, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeneratedForm {
  id: string;
  code: string;
  timestamp: Date;
}

export interface FormPreviewProps {
  forms: GeneratedForm[];
  currentFormIndex: number;
  onFormIndexChange: (index: number) => void;
  onDeleteForm?: (index: number) => void;
  isStreaming?: boolean;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
  className?: string;
}

interface FormConfiguration {
  title?: string;
  description?: string;
  fields: Array<{
    id?: string;
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    description?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    validation?: any;
    page?: number;
    group?: string;
    section?: any;
    help?: any;
    inlineValidation?: any;
    arrayConfig?: any;
    datalist?: any;
    multiSelectConfig?: any;
    colorConfig?: any;
    ratingConfig?: any;
    phoneConfig?: any;
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

export function FormPreview({ 
  forms, 
  currentFormIndex, 
  onFormIndexChange,
  onDeleteForm,
  isStreaming = false, 
  onFormSubmit, 
  className 
}: FormPreviewProps) {
  const currentForm = forms[currentFormIndex];
  
  const parsedConfig = useMemo<FormConfiguration | null>(() => {
    if (!currentForm?.code) return null;
    
    try {
      const parsed = JSON.parse(currentForm.code);
      
      // Convert to builder preview format
      const config: FormConfiguration = {
        title: parsed.title || "Generated Form",
        description: parsed.description,
        fields: (parsed.fields || []).map((field: any, index: number) => ({
          ...field,
          id: field.id || `field_${index}`,
        })),
        pages: parsed.pages || [],
        settings: {
          submitLabel: parsed.submitLabel || "Submit",
          nextLabel: parsed.nextLabel || "Next",
          previousLabel: parsed.previousLabel || "Previous", 
          showProgress: parsed.progress?.showSteps || false,
          allowPageNavigation: true,
          resetOnSubmit: false,
          ...parsed.settings
        }
      };
      
      return config;
    } catch (error) {
      console.error('Error parsing form configuration:', error);
      return null;
    }
  }, [currentForm?.code]);

  if (forms.length === 0 && !isStreaming) {
    return (
      <Card className={cn("flex flex-col h-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Form Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50 mx-auto" />
            <h3 className="text-lg font-medium mb-2">No Forms Generated Yet</h3>
            <p className="text-sm max-w-md">
              Start a conversation in the chat to generate your first form. 
              The preview will appear here once the AI creates your form.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Form Preview
            {forms.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({currentFormIndex + 1} of {forms.length})
              </span>
            )}
          </CardTitle>
          
          {forms.length > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormIndexChange(Math.max(0, currentFormIndex - 1))}
                disabled={currentFormIndex === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous form</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormIndexChange(Math.min(forms.length - 1, currentFormIndex + 1))}
                disabled={currentFormIndex === forms.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next form</span>
              </Button>

              {onDeleteForm && forms.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteForm(currentFormIndex)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete form</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full">
          {isStreaming && !currentForm && (
            <div className="p-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Form is being generated... Please wait for the AI to complete.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {currentForm && parsedConfig && (
            <PreviewControls
              config={parsedConfig}
              code={currentForm.code}
              showModeSelector={true}
              showDeviceSelector={true}
              onFormSubmit={onFormSubmit}
              className="border-0 h-full"
            />
          )}

          {currentForm && !parsedConfig && (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to parse the form configuration. The generated form may have invalid JSON.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}