"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { BuilderProvider, useBuilderContext } from "./BuilderContext";
import { TabContainer } from "./TabContainer";
import { defaultTabs } from "./default-tabs";
import type { FormBuilderProps } from "@/lib/formedible/builder-types";

// Internal FormBuilder component that uses context
const FormBuilderInternal: React.FC<{
  tabs: FormBuilderProps["tabs"];
  defaultTab?: string;
  onTabChange?: FormBuilderProps["onTabChange"];
  className?: string;
}> = ({ 
  tabs = defaultTabs, 
  defaultTab = "builder",
  onTabChange,
  className
}) => {
  const { exportConfig, importConfig, submitConfig } = useBuilderContext();

  return (
    <div className="w-full min-h-[800px] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Form Builder 2.0</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="secondary" onClick={exportConfig}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="secondary" onClick={importConfig}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col">
          <TabContainer
            tabs={tabs}
            defaultTab={defaultTab}
            onTabChange={onTabChange}
            className={className}
          />
        </div>
      </div>
    </div>
  );
};

// Main FormBuilder component with provider
export const FormBuilder: React.FC<FormBuilderProps> = ({
  tabs = defaultTabs,
  defaultTab = "builder",
  enabledTabs,
  onTabChange,
  className,
  initialData,
  onSubmit,
  isLoading,
}) => {
  // Filter tabs based on enabledTabs if provided
  const finalTabs = enabledTabs 
    ? tabs.filter(tab => enabledTabs.includes(tab.id))
    : tabs;

  return (
    <BuilderProvider 
      initialData={initialData}
      onSubmit={onSubmit}
      isLoading={isLoading}
    >
      <FormBuilderInternal
        tabs={finalTabs}
        defaultTab={defaultTab}
        onTabChange={onTabChange}
        className={className}
      />
    </BuilderProvider>
  );
};