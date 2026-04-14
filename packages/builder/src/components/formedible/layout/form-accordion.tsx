"use client";
import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { FormAccordionProps } from "@/lib/formedible/types";


export const FormAccordion: React.FC<FormAccordionProps> = ({
  children,
  sections,
  type = 'single',
  className,
}) => {
  const defaultOpenIds = sections.filter(s => s.defaultOpen).map(s => s.id);

  return (
    <div className={cn("space-y-4", className)}>
      {children}
      <Accordion
        multiple={type === 'multiple'}
        defaultValue={defaultOpenIds}
      >
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>{section.title}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {section.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
