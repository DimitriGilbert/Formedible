"use client";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { FormTabsProps, DynamicText } from "@/lib/formedible/types";
import type { FormedibleFormApi } from "@/lib/formedible/types";
import { resolveDynamicText } from "@/lib/formedible/template-interpolation";
import type { TemplateOptions } from "@/lib/formedible/template-interpolation";


// Enhanced FormTabs props to support dynamic labels
export interface EnhancedFormTabsProps<TFormValues extends Record<string, unknown>> {
  children?: React.ReactNode;
  tabs: {
    id: string;
    label: DynamicText;
    content: React.ReactNode;
  }[];
  activeTab: string;
  className?: string;
  onTabChange: (tabId: string) => void;
  form?: FormedibleFormApi<TFormValues>;
  templateOptions?: TemplateOptions;
}

// PURE DISPLAY COMPONENT - NO STATE, NO RERENDERS
export const FormTabs: React.FC<FormTabsProps> = ({
  children,
  tabs,
  activeTab,
  className,
  onTabChange,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
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

// Enhanced FormTabs component that supports dynamic labels
export const EnhancedFormTabs = <TFormValues extends Record<string, unknown>>({
  children,
  tabs,
  activeTab,
  className,
  onTabChange,
  form,
  templateOptions,
}: EnhancedFormTabsProps<TFormValues>) => {
  const [formValues, setFormValues] = React.useState<TFormValues>(
    (form?.state?.values || {}) as TFormValues
  );

  React.useEffect(() => {
    if (!form) return;
    const unsubscribe = form.store.subscribe((state) => {
      setFormValues((state as any).values as TFormValues);
    });
    return unsubscribe;
  }, [form]);

  return (
    <div className={cn("space-y-4", className)}>
      {children}
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {form ? 
                resolveDynamicText(tab.label, formValues as Record<string, unknown>, templateOptions) || ''
              : (
                typeof tab.label === 'string' ? tab.label : ''
              )}
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