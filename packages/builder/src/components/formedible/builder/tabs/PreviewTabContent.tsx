"use client";
import React from "react";
import { PreviewControls } from "../preview-controls";
import type { TabContentProps } from "@/lib/formedible/builder-types";

export const PreviewTabContent: React.FC<TabContentProps> = ({
  getFormConfig,
}) => {
  const formConfig = getFormConfig();
  
  return (
    <div className="h-full m-0 p-8 overflow-y-auto min-h-0">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Live Preview</h2>
          <p className="text-muted-foreground">See how your form will look and behave</p>
        </div>
        
        <PreviewControls
          config={{
            ...formConfig,
            pages: formConfig.pages || []
          }}
          showModeSelector={false}
          showDeviceSelector={true}
        />
      </div>
    </div>
  );
};