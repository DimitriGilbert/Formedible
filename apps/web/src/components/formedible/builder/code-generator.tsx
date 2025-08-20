"use client";
import React, { useMemo } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import type { FormField } from "@/lib/formedible/builder-types";

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
    if (fields.length === 0) {
      return `import { useFormedible } from 'formedible';
import { z } from 'zod';

export const MyForm = () => {
  const { Form } = useFormedible({
    schema: z.object({}),
    fields: [],
    formOptions: {
      onSubmit: async ({ value }) => {
        console.log('Form submitted:', value);
      },
    },
  });
  
  return <Form />;
};`;
    }

    const formConfig = {
      title: formTitle,
      description: formDescription,
      schema: "z.object(schemaFields)",
      fields: fields.map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        page: field.page || 1,
        group: field.group,
        section: field.section,
        help: field.help,
        inlineValidation: field.inlineValidation,
        ...(field.options && { options: field.options }),
        ...(field.arrayConfig && { arrayConfig: field.arrayConfig }),
        ...(field.datalist && { datalist: field.datalist }),
        ...(field.multiSelectConfig && { multiSelectConfig: field.multiSelectConfig }),
        ...(field.colorConfig && { colorConfig: field.colorConfig }),
        ...(field.ratingConfig && { ratingConfig: field.ratingConfig }),
        ...(field.phoneConfig && { phoneConfig: field.phoneConfig }),
      })),
      pages: pages,
      submitLabel: settings.submitLabel,
      nextLabel: settings.nextLabel,
      previousLabel: settings.previousLabel,
      progress: settings.showProgress
        ? { showSteps: true, showPercentage: true }
        : undefined,
      formOptions: {
        onSubmit: "async ({ value }) => {\n      console.log('Form submitted:', value);\n      // Handle form submission here\n    }",
      },
    };

    // Generate schema fields
    const schemaFieldsCode = fields.map((field) => {
      let fieldSchema = "";
      
      switch (field.type) {
        case "number":
        case "slider":
        case "rating":
          fieldSchema = "z.number()";
          break;
        case "checkbox":
        case "switch":
          fieldSchema = "z.boolean()";
          break;
        case "date":
          fieldSchema = "z.string()";
          break;
        case "multiSelect":
        case "array":
          fieldSchema = "z.array(z.string())";
          break;
        default:
          fieldSchema = "z.string()";
      }

      if (field.required) {
        if (field.type === "checkbox" || field.type === "switch") {
          fieldSchema = `${fieldSchema}.refine((val) => val === true, {
    message: '${field.label} is required',
  })`;
        } else if (field.type !== "number" && field.type !== "slider" && field.type !== "rating") {
          fieldSchema = `${fieldSchema}.min(1, '${field.label} is required')`;
        }
      } else {
        fieldSchema = `${fieldSchema}.optional()`;
      }

      return `  ${field.name}: ${fieldSchema}`;
    }).join(",\n");

    const configString = JSON.stringify(formConfig, null, 2)
      .replace('"z.object(schemaFields)"', 'z.object(schemaFields)')
      .replace('"async ({ value }) => {\\n      console.log(\'Form submitted:\', value);\\n      // Handle form submission here\\n    }"', 
        'async ({ value }) => {\n      console.log(\'Form submitted:\', value);\n      // Handle form submission here\n    }');

    return `import { useFormedible } from 'formedible';
import { z } from 'zod';

export const MyForm = () => {
  // Define the schema for form validation
  const schemaFields = {
${schemaFieldsCode}
  };

  const formConfig = ${configString};

  const { Form } = useFormedible(formConfig);
  
  return <Form />;
};`;
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