"use client";
import React from "react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface FormAccordionProps {
  children?: React.ReactNode;
  sections: {
    id: string;
    title: string;
    content: React.ReactNode;
    defaultOpen?: boolean;
  }[];
  type?: 'single' | 'multiple';
  className?: string;
}

export const FormAccordion: React.FC<FormAccordionProps> = ({
  children,
  sections,
  type = 'single',
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
      
      <Accordion type={type}>
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            id={section.id}
            title={section.title}
            defaultOpen={section.defaultOpen}
          >
            <div className="space-y-4">
              {section.content}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};