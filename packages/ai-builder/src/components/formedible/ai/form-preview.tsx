"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormPreviewBase } from "@/components/formedible/builder/form-preview-base";
import { Eye, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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

  if (forms.length === 0 && !isStreaming) {
    return (
      <FormPreviewBase 
        className={className}
        title=""
        emptyStateMessage="Start a conversation in the chat to generate your first form. The preview will appear here once the AI creates your form."
      />
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="px-3 pt-1 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
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
      
      <CardContent className="flex-1 overflow-hidden">
        <FormPreviewBase 
          formCode={currentForm?.code}
          isStreaming={isStreaming && !currentForm}
          onFormSubmit={onFormSubmit}
          className="border-0 h-full"
        />
      </CardContent>
    </Card>
  );
}