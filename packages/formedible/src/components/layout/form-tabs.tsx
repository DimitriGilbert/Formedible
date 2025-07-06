"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface FormTabsProps {
  children: React.ReactNode;
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
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

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