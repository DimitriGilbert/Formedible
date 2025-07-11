"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface FormTabsProps {
  children?: React.ReactNode;
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export const FormTabs: React.FC<FormTabsProps> = ({
  children,
  tabs,
  defaultTab,
  className,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (defaultTab) return defaultTab;
    if (tabs.length > 0) return tabs[0].id;
    return '';
  });

  // Sync activeTab with props when they change
  useEffect(() => {
    const newDefaultTab = defaultTab || (tabs.length > 0 ? tabs[0].id : '');
    if (newDefaultTab && newDefaultTab !== activeTab) {
      // Only update if the current activeTab is not in the new tabs list
      const isCurrentTabValid = tabs.some(tab => tab.id === activeTab);
      if (!isCurrentTabValid) {
        setActiveTab(newDefaultTab);
      }
    }
  }, [defaultTab, tabs, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {children}
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};