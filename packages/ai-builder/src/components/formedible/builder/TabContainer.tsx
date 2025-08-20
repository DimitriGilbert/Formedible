"use client";
import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useBuilderContext } from "./BuilderContext";
import type { TabConfig, TabContainerProps } from "@/lib/formedible/builder-types";

export const TabContainer: React.FC<TabContainerProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  className,
}) => {
  const builderContext = useBuilderContext();
  
  // Filter and sort tabs
  const activeTabs = useMemo(() => {
    return tabs
      .filter(tab => tab.enabled !== false)
      .sort((a, b) => {
        // Sort by order if provided, otherwise maintain array order
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      });
  }, [tabs]);

  // Determine initial active tab
  const initialTab = useMemo(() => {
    if (defaultTab && activeTabs.some(tab => tab.id === defaultTab)) {
      return defaultTab;
    }
    return activeTabs.length > 0 ? activeTabs[0].id : "";
  }, [defaultTab, activeTabs]);

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  if (activeTabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No Tabs Available</h3>
          <p className="text-muted-foreground">No enabled tabs to display</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleTabChange} 
      className={cn("flex-1 flex flex-col", className)}
    >
      <TabsList className="w-full justify-start border-b rounded-none h-14 bg-card p-0">
        {activeTabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="flex items-center gap-2 h-full px-6"
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="flex-1 min-h-0">
        {activeTabs.map((tab) => {
          const TabComponent = tab.component;
          return (
            <TabsContent 
              key={tab.id} 
              value={tab.id} 
              className="h-full m-0"
            >
              <TabComponent {...builderContext} />
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
};