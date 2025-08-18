"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AiFormRenderer } from "./ai-form-renderer";
import { Eye, AlertCircle, Code2, Copy, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormPreviewProps {
  formCode?: string;
  isStreaming?: boolean;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
  className?: string;
}

export function FormPreview({ formCode, isStreaming = false, onFormSubmit, className }: FormPreviewProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasContent = formCode && formCode.trim().length > 0;

  const handleCopyCode = async () => {
    if (!formCode) return;
    
    try {
      await navigator.clipboard.writeText(formCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!hasContent && !isStreaming) {
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
            <h3 className="text-lg font-medium mb-2">No Form Generated Yet</h3>
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
          </CardTitle>
          
          {hasContent && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCode(!showCode)}
                className="gap-2"
              >
                <Code2 className="h-4 w-4" />
                {showCode ? "Preview" : "Code"}
              </Button>
              
              {showCode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {showCode ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Generated form configuration:
              </div>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-words">
                <code>{formCode}</code>
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              {isStreaming && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Form is being generated... Please wait for the AI to complete.
                  </AlertDescription>
                </Alert>
              )}
              
              {hasContent && (
                <div className="border rounded-lg p-4 bg-background">
                  <AiFormRenderer
                    code={formCode}
                    isStreaming={isStreaming}
                    onSubmit={onFormSubmit}
                    debug={process.env.NODE_ENV === "development"}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}