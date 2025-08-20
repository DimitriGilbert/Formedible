"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Tablet, Smartphone, Code, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormPreview } from "./form-preview";
import type { FormConfiguration } from "./form-preview-base";

export type PreviewMode = "desktop" | "tablet" | "mobile";
export type ViewMode = "preview" | "code";

interface PreviewControlsProps {
  config: FormConfiguration;
  code?: string; // Generated code for code view
  className?: string;
  showModeSelector?: boolean;
  showDeviceSelector?: boolean;
  onFormSubmit?: (formData: Record<string, unknown>) => void;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  config,
  code,
  className,
  showModeSelector = true,
  showDeviceSelector = true,
  onFormSubmit,
}) => {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  const deviceModes: { mode: PreviewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "desktop", icon: <Monitor className="h-4 w-4" />, label: "Desktop" },
    { mode: "tablet", icon: <Tablet className="h-4 w-4" />, label: "Tablet" },
    { mode: "mobile", icon: <Smartphone className="h-4 w-4" />, label: "Mobile" },
  ];

  const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "preview", icon: <Eye className="h-4 w-4" />, label: "Preview" },
    { mode: "code", icon: <Code className="h-4 w-4" />, label: "Code" },
  ];

  return (
    <Card className={cn("flex flex-col h-full !py-0 !gap-0", className)}>
      <CardHeader className="px-3 pt-1 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {viewMode === "preview" ? (
              <Eye className="h-5 w-5" />
            ) : (
              <Code className="h-5 w-5" />
            )}
            {viewMode === "preview" ? "" : "Generated Code"}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            {showModeSelector && (
              <div className="flex rounded-md border">
                {viewModes.map(({ mode, icon, label }) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className="h-8 px-3 rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    {icon}
                    <span className="ml-1 hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>
            )}
            
            {/* Device Mode Selector - only show in preview mode */}
            {showDeviceSelector && viewMode === "preview" && (
              <div className="flex rounded-md border">
                {deviceModes.map(({ mode, icon, label }) => (
                  <Button
                    key={mode}
                    variant={previewMode === mode ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode(mode)}
                    className="h-8 px-3 rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    {icon}
                    <span className="ml-1 hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden px-3 pt-0">
        {viewMode === "preview" ? (
          <div
            className={cn(
              "h-full overflow-y-auto transition-all",
              previewMode === "mobile"
                ? "max-w-sm mx-auto"
                : previewMode === "tablet"
                ? "max-w-2xl mx-auto"
                : "max-w-full"
            )}
          >
            <FormPreview config={config} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {code ? (
              <CodeBlock
                code={code}
                language="json"
                showLineNumbers={true}
                showCopyButton={true}
                className="h-full"
                darkMode={true}
                scrollable={true}
                maxHeight="100%"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No code available
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};