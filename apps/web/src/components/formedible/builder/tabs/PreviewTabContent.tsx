"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormPreview } from "../form-preview";
import type { TabContentProps } from "../types";

export const PreviewTabContent: React.FC<TabContentProps> = ({
  getFormConfig,
  previewMode,
  setPreviewMode,
}) => {
  return (
    <div className="h-full m-0 p-8 overflow-y-auto min-h-0">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live Preview</h2>
            <p className="text-muted-foreground">See how your form will look and behave</p>
          </div>
          <div className="flex items-center space-x-3">
            {(["desktop", "tablet", "mobile"] as const).map((mode) => (
              <Button
                key={mode}
                variant={previewMode === mode ? "default" : "outline"}
                onClick={() => setPreviewMode(mode)}
              >
                {mode === "desktop" && "🖥️"}
                {mode === "tablet" && "📱"}
                {mode === "mobile" && "📱"}
                <span className="ml-2 capitalize">{mode}</span>
              </Button>
            ))}
          </div>
        </div>
        <div
          className={cn(
            "mx-auto transition-all",
            previewMode === "mobile"
              ? "max-w-sm"
              : previewMode === "tablet"
              ? "max-w-md"
              : "max-w-4xl"
          )}
        >
          <FormPreview config={{
            ...getFormConfig(),
            pages: getFormConfig().pages || []
          }} />
        </div>
      </div>
    </div>
  );
};