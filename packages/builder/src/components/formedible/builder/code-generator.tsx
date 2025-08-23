"use client";
import React, { useMemo } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import type { FieldConfig } from "@/lib/formedible/types";
import { generateFormCode } from "@/lib/formedible/code-generation";

interface FormField extends FieldConfig {
  id: string;
  label: string; // Make label required for builder
  help?: {
    text?: string;
    tooltip?: string;
    position?: "top" | "bottom" | "left" | "right";
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  options?: string[] | Array<{ value: string; label: string }> | ((values: Record<string, unknown>) => string[] | Array<{ value: string; label: string }>);
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: any;
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
}

interface CodeGeneratorProps {
  formTitle: string;
  formDescription: string;
  fields: FormField[];
  pages: Array<{ page: number; title: string; description?: string }>;
  settings: {
    submitLabel: string;
    nextLabel: string;
    previousLabel: string;
    showProgress: boolean;
  };
}

export const CodeGenerator: React.FC<CodeGeneratorProps> = ({
  formTitle,
  formDescription,
  fields,
  pages,
  settings,
}) => {
  const generatedCode = useMemo(() => {
    const result = generateFormCode({
      title: formTitle,
      description: formDescription,
      fields,
      pages,
      settings,
    });
    
    return result.fullCode;
  }, [formTitle, formDescription, fields, pages, settings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Generated Code</h2>
        <p className="text-muted-foreground text-lg mb-6">
          Copy this code to use your form in your application
        </p>
      </div>
      
      {fields.length === 0 ? (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No Fields Added</h3>
            <p className="text-muted-foreground">Add some fields to generate code</p>
          </div>
        </div>
      ) : (
        <CodeBlock
          code={generatedCode}
          language="tsx"
          title="MyForm.tsx"
          showCopyButton={true}
          showLineNumbers={true}
        />
      )}
    </div>
  );
};