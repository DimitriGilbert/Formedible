"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
}

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  className?: string;
  collapsible?: boolean;
}

const AccordionContext = React.createContext<{
  openItems: Set<string>;
  toggleItem: (id: string) => void;
  type: 'single' | 'multiple';
}>({
  openItems: new Set(),
  toggleItem: () => {},
  type: 'single'
});

export const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'single',
  className,
  collapsible = true
}) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    if (!collapsible && openItems.has(id)) return;

    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (type === 'single') {
        newSet.clear();
        if (!prev.has(id)) {
          newSet.add(id);
        }
      } else {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      }
      return newSet;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn("space-y-2", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  children,
  defaultOpen = false,
  disabled = false
}) => {
  const { openItems, toggleItem } = React.useContext(AccordionContext);
  const isOpen = openItems.has(id);

  React.useEffect(() => {
    if (defaultOpen && !openItems.has(id)) {
      toggleItem(id);
    }
  }, [defaultOpen, id, openItems, toggleItem]);

  return (
    <div className="border rounded-lg">
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between p-4 h-auto font-medium text-left"
        onClick={() => !disabled && toggleItem(id)}
        disabled={disabled}
      >
        {title}
        <span className={cn(
          "transition-transform duration-200",
          isOpen ? "rotate-180" : "rotate-0"
        )}>
          ▼
        </span>
      </Button>
      
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};