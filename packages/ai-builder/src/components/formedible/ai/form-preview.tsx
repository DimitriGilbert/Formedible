"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormPreviewBase } from "@/components/formedible/builder/form-preview-base";
import { SandpackPreview } from "./sandpack-preview";
import { Eye, ChevronLeft, ChevronRight, Trash2, Monitor, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeneratedForm {
  id: string;
  code: string;
  timestamp: Date;
}

export type PreviewMode = "static" | "live";

const PREVIEW_MODE_STORAGE_KEY = "formedible-preview-mode";

export interface FormPreviewProps {
  forms: GeneratedForm[];
  currentFormIndex: number;
  onFormIndexChange: (index: number) => void;
  onDeleteForm?: (index: number) => void;
  isStreaming?: boolean;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
  className?: string;
  /** Allow toggling between preview modes */
  enableModeToggle?: boolean;
  /** Default preview mode */
  defaultPreviewMode?: PreviewMode;
}

export function FormPreview({ 
  forms, 
  currentFormIndex, 
  onFormIndexChange,
  onDeleteForm,
  isStreaming = false, 
  onFormSubmit, 
  className,
  enableModeToggle = true,
  defaultPreviewMode = "static"
}: FormPreviewProps) {
  const currentForm = forms[currentFormIndex];
  
  // Preview mode state with localStorage persistence
  const [previewMode, setPreviewMode] = useState<PreviewMode>(defaultPreviewMode);
  
  // Load preview mode from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem(PREVIEW_MODE_STORAGE_KEY) as PreviewMode;
      if (savedMode === "static" || savedMode === "live") {
        setPreviewMode(savedMode);
      }
    }
  }, []);
  
  // Persist preview mode to localStorage
  const handlePreviewModeChange = (mode: PreviewMode) => {
    setPreviewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(PREVIEW_MODE_STORAGE_KEY, mode);
    }
  };

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
          
          <div className="flex items-center gap-2">
            {enableModeToggle && (
              <div className="flex items-center gap-2 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className={cn("transition-colors", previewMode === "static" && "text-foreground font-medium")}>Static</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Static preview with current form design</p>
                  </TooltipContent>
                </Tooltip>
                
                <Switch
                  checked={previewMode === "live"}
                  onCheckedChange={(checked) => handlePreviewModeChange(checked ? "live" : "static")}
                  aria-label="Toggle preview mode"
                  className="h-4 w-7"
                />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4 text-muted-foreground" />
                      <span className={cn("transition-colors", previewMode === "live" && "text-foreground font-medium")}>Live</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Interactive live preview with code execution</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
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
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        {previewMode === "static" ? (
          <FormPreviewBase 
            formCode={currentForm?.code}
            isStreaming={isStreaming && !currentForm}
            onFormSubmit={onFormSubmit}
            className="border-0 h-full"
          />
        ) : (
          <SandpackPreview
            formCode={currentForm?.code}
            onFormSubmit={onFormSubmit}
            className="h-full"
            height="100%"
            isLoading={isStreaming && !currentForm}
            showCodeEditor={false}
            showConsole={false}
            showFileExplorer={false}
          />
        )}
      </CardContent>
    </Card>
  );
}