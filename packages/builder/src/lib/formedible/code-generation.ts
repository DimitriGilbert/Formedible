"use client";

import type { FieldConfig, UseFormedibleOptions } from "./types";
import { resolveDynamicText } from "./template-interpolation";

export interface CodeGenerationOptions {
  title?: string;
  description?: string;
  fields: FieldConfig[];
  pages?: Array<{ page: number; title: string; description?: string }>;
  settings?: {
    submitLabel?: string;
    nextLabel?: string;
    previousLabel?: string;
    showProgress?: boolean;
  };
  tabs?: Array<{ id: string; title: string; description?: string }>;
}

export interface GeneratedCodeResult {
  fullCode: string;
  formConfig: string;
  schemaCode: string;
}

/**
 * Generates complete React/TypeScript code for a formedible form
 */
export function generateFormCode(options: CodeGenerationOptions): GeneratedCodeResult {
  const {
    title = "",
    description = "",
    fields = [],
    pages = [],
    settings = {},
    tabs = []
  } = options;

  if (fields.length === 0) {
    const emptyCode = `import { useFormedible } from 'formedible';
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

    return {
      fullCode: emptyCode,
      formConfig: "{}",
      schemaCode: "z.object({})"
    };
  }

  // Build form configuration
  const formConfig = {
    ...(title && { title }),
    ...(description && { description }),
    schema: "z.object(schemaFields)",
    fields: fields.map((field) => {
      const mappedField: any = {
        name: field.name,
        type: field.type,
        label: resolveDynamicText(field.label, {}) || field.label,
        ...(field.page && { page: field.page }),
        ...(field.tab && { tab: field.tab }),
        ...(field.group && { group: field.group }),
        ...(field.section && { section: field.section }),
        ...(field.required && { required: field.required }),
      };

      // Add optional properties if they exist
      if (field.placeholder) mappedField.placeholder = resolveDynamicText(field.placeholder, {}) || field.placeholder;
      if (field.description) mappedField.description = resolveDynamicText(field.description, {}) || field.description;
      if (field.help) mappedField.help = field.help;
      if (field.inlineValidation) mappedField.inlineValidation = field.inlineValidation;
      if (field.options) mappedField.options = field.options;
      if (field.arrayConfig) mappedField.arrayConfig = field.arrayConfig;
      if (field.objectConfig) mappedField.objectConfig = field.objectConfig;
      if (field.datalist) mappedField.datalist = field.datalist;
      if (field.multiSelectConfig) mappedField.multiSelectConfig = field.multiSelectConfig;
      if (field.colorConfig) mappedField.colorConfig = field.colorConfig;
      if (field.ratingConfig) mappedField.ratingConfig = field.ratingConfig;
      if (field.phoneConfig) mappedField.phoneConfig = field.phoneConfig;
      if (field.min !== undefined) mappedField.min = field.min;
      if (field.max !== undefined) mappedField.max = field.max;
      if (field.step !== undefined) mappedField.step = field.step;

      return mappedField;
    }),
    ...(pages && pages.length > 1 && { pages }),
    ...(tabs && tabs.length > 1 && { tabs }),
    ...(settings.submitLabel && { submitLabel: settings.submitLabel }),
    ...(settings.nextLabel && { nextLabel: settings.nextLabel }),
    ...(settings.previousLabel && { previousLabel: settings.previousLabel }),
    ...(settings.showProgress && {
      progress: { showSteps: true, showPercentage: true }
    }),
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
      case "object":
        fieldSchema = "z.object({}).passthrough()";
        break;
      default:
        fieldSchema = "z.string()";
    }

    if (field.required) {
      if (field.type === "checkbox" || field.type === "switch") {
        fieldSchema = `${fieldSchema}.refine((val) => val === true, {
    message: '${field.label || field.name} is required',
  })`;
      } else if (field.type !== "number" && field.type !== "slider" && field.type !== "rating") {
        fieldSchema = `${fieldSchema}.min(1, '${field.label || field.name} is required')`;
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

  const fullCode = `import { useFormedible } from 'formedible';
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

  return {
    fullCode,
    formConfig: configString,
    schemaCode: `z.object({\n${schemaFieldsCode}\n})`
  };
}

/**
 * Generates code from a parsed formedible configuration (for AI builder)
 */
export function generateCodeFromParsedConfig(config: UseFormedibleOptions<any>): GeneratedCodeResult {
  return generateFormCode({
    title: config.title,
    description: config.description,
    fields: config.fields || [],
    pages: config.pages?.map(page => ({
      page: page.page,
      title: page.title || `Page ${page.page}`,
      description: page.description
    })),
    tabs: config.tabs?.map(tab => ({
      id: tab.id,
      title: tab.label || tab.id,
      description: tab.description
    })),
    settings: {
      submitLabel: config.submitLabel,
      nextLabel: config.nextLabel,
      previousLabel: config.previousLabel,
      showProgress: !!config.progress,
    }
  });
}