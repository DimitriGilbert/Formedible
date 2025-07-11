"use client";
import React from "react";
import { useFormedible } from "formedible";
import { z } from "zod";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Settings, Palette, Star, Phone, Upload, List, Sliders, Hash, Calendar, FileText, Eye, Mail, Type, CopyCheck, HelpCircle } from "lucide-react";

interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  page?: number;
  group?: string;
  section?: {
    title: string;
    description?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  };
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
  options?: Array<{ value: string; label: string }>;
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    addLabel?: string;
    removeLabel?: string;
  };
  datalist?: string[];
  multiSelectConfig?: {
    placeholder?: string;
    searchable?: boolean;
    maxSelections?: number;
    creatable?: boolean;
  };
  colorConfig?: {
    format?: "hex" | "rgb" | "hsl";
    presets?: string[];
  };
  ratingConfig?: {
    max?: number;
    allowHalf?: boolean;
    icon?: string;
    showValue?: boolean;
  };
  phoneConfig?: {
    defaultCountry?: string;
    format?: "national" | "international";
    placeholder?: string;
  };
  sliderConfig?: {
    min?: number;
    max?: number;
    step?: number;
    marks?: Array<{ value: number; label: string }>;
    showTooltip?: boolean;
    showValue?: boolean;
    orientation?: "horizontal" | "vertical";
  };
  numberConfig?: {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    allowNegative?: boolean;
    showSpinButtons?: boolean;
  };
  dateConfig?: {
    minDate?: string;
    maxDate?: string;
    format?: string;
    disablePast?: boolean;
    disableFuture?: boolean;
    disableWeekends?: boolean;
    disabledDates?: string[];
  };
  fileConfig?: {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    allowedTypes?: string[];
  };
  textareaConfig?: {
    rows?: number;
    cols?: number;
    resize?: "none" | "vertical" | "horizontal" | "both";
    maxLength?: number;
    showWordCount?: boolean;
  };
  passwordConfig?: {
    showToggle?: boolean;
    strengthMeter?: boolean;
    minStrength?: number;
    requirements?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSymbols?: boolean;
    };
  };
  emailConfig?: {
    allowedDomains?: string[];
    blockedDomains?: string[];
    suggestions?: string[];
    validateMX?: boolean;
  };
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
    includes?: string;
    startsWith?: string;
    endsWith?: string;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    transform?: string;
    refine?: string;
    customMessages?: Record<string, string>;
  };
}

interface FieldConfiguratorProps {
  fieldId: string;
  initialField: FormField;
  onFieldChange: (fieldId: string, field: FormField) => void;
  availablePages?: number[];
}

// Main Configuration Schema combining all field configurations
const fieldConfigurationSchema = z.object({
  // Basic configuration
  basic: z.object({
    label: z.string().min(1, "Field label is required"),
    name: z.string().min(1, "Field name is required"),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    page: z.number().min(1),
    group: z.string().optional(),
    required: z.boolean().default(false),
  }),
  
  // Options configuration
  options: z.array(z.object({
    value: z.string().min(1, "Option value required"),
    label: z.string().min(1, "Option label required"),
  })).optional(),
  
  // Field-specific configurations
  sliderConfig: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().min(1).optional(),
    showTooltip: z.boolean().default(false),
    showValue: z.boolean().default(false),
    orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  }).optional(),
  
  numberConfig: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().min(1).optional(),
    precision: z.number().min(0).max(10).optional(),
    allowNegative: z.boolean().default(true),
    showSpinButtons: z.boolean().default(true),
  }).optional(),
  
  dateConfig: z.object({
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    format: z.enum(["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MMM dd, yyyy"]).default("yyyy-MM-dd"),
    disablePast: z.boolean().default(false),
    disableFuture: z.boolean().default(false),
    disableWeekends: z.boolean().default(false),
  }).optional(),
  
  multiSelectConfig: z.object({
    placeholder: z.string().optional(),
    searchable: z.boolean().default(false),
    maxSelections: z.number().min(1).optional(),
    creatable: z.boolean().default(false),
  }).optional(),
  
  ratingConfig: z.object({
    max: z.number().min(1).max(10).default(5),
    allowHalf: z.boolean().default(false),
    showValue: z.boolean().default(false),
    icon: z.string().default("star"),
  }).optional(),
  
  phoneConfig: z.object({
    defaultCountry: z.string().default("US"),
    format: z.enum(["national", "international"]).default("national"),
    placeholder: z.string().optional(),
  }).optional(),
  
  colorConfig: z.object({
    format: z.enum(["hex", "rgb", "hsl"]).default("hex"),
    presets: z.array(z.string()).optional(),
  }).optional(),
  
  fileConfig: z.object({
    accept: z.string().optional(),
    multiple: z.boolean().default(false),
    maxSize: z.number().min(1).optional(),
    maxFiles: z.number().min(1).optional(),
  }).optional(),
  
  textareaConfig: z.object({
    rows: z.number().min(1).default(4),
    cols: z.number().min(10).optional(),
    resize: z.enum(["none", "vertical", "horizontal", "both"]).default("vertical"),
    maxLength: z.number().min(1).optional(),
    showWordCount: z.boolean().default(false),
  }).optional(),
  
  passwordConfig: z.object({
    showToggle: z.boolean().default(true),
    strengthMeter: z.boolean().default(false),
    minStrength: z.number().min(1).max(4).default(1),
    requireUppercase: z.boolean().default(false),
    requireLowercase: z.boolean().default(false),
    requireNumbers: z.boolean().default(false),
    requireSymbols: z.boolean().default(false),
    minLength: z.number().min(1).default(8),
  }).optional(),
  
  emailConfig: z.object({
    allowedDomains: z.string().optional(),
    blockedDomains: z.string().optional(),
    suggestions: z.string().optional(),
    validateMX: z.boolean().default(false),
  }).optional(),
  
  // Advanced configurations
  advanced: z.object({
    help: z.object({
      text: z.string().optional(),
      tooltip: z.string().optional(),
      position: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
      linkUrl: z.string().optional(),
      linkText: z.string().optional(),
    }).optional(),
    
    section: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      collapsible: z.boolean().default(false),
      defaultExpanded: z.boolean().default(true),
    }).optional(),
    
    inlineValidation: z.object({
      enabled: z.boolean().default(false),
      debounceMs: z.number().min(0).default(300),
      showSuccess: z.boolean().default(false),
    }).optional(),
    
    validation: z.object({
      minLength: z.number().min(0).optional(),
      maxLength: z.number().min(1).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      includes: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      email: z.boolean().default(false),
      url: z.boolean().default(false),
      uuid: z.boolean().default(false),
      custom: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const FieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  fieldId,
  initialField,
  onFieldChange,
  availablePages = [1],
}) => {
  const needsOptions = ['select', 'radio', 'multiSelect'].includes(initialField.type);
  const needsSliderConfig = initialField.type === 'slider';
  const needsNumberConfig = initialField.type === 'number';
  const needsDateConfig = initialField.type === 'date';
  const needsFileConfig = initialField.type === 'file';
  const needsTextareaConfig = initialField.type === 'textarea';
  const needsPasswordConfig = initialField.type === 'password';
  const needsEmailConfig = initialField.type === 'email';
  const needsRatingConfig = initialField.type === 'rating';
  const needsPhoneConfig = initialField.type === 'phone';
  const needsColorConfig = initialField.type === 'colorPicker';
  const needsMultiSelectAdvancedConfig = initialField.type === 'multiSelect';

  // Single unified form with object fields
  const configForm = useFormedible({
    schema: fieldConfigurationSchema,
    fields: [
      // Basic Configuration
      {
        name: "basic",
        type: "object",
        label: "Basic Configuration",
        objectConfig: {
          title: "Basic Field Settings",
          description: "Configure the basic properties of your field",
          layout: "vertical",
          showCard: true,
          fields: [
            { name: "label", type: "text", label: "Field Label", placeholder: "Enter field label" },
            { name: "name", type: "text", label: "Field Name", placeholder: "Enter field name" },
            { name: "placeholder", type: "text", label: "Placeholder", placeholder: "Enter placeholder text" },
            { name: "description", type: "textarea", label: "Description", placeholder: "Enter field description" },
            { 
              name: "page", 
              type: "select", 
              label: "Page",
              options: availablePages.map(page => ({ value: page.toString(), label: `Page ${page}` }))
            },
            { name: "group", type: "text", label: "Group (Optional)", placeholder: "Group name for organizing fields" },
            { name: "required", type: "checkbox", label: "Required field" },
          ]
        }
      },
      
      // Options Configuration
      ...(needsOptions ? [{
        name: "options",
        type: "array",
        label: "Field Options",
        arrayConfig: {
          itemType: "object",
          itemLabel: "Option",
          minItems: 1,
          addLabel: "Add Option",
          removeLabel: "Remove Option",
        }
      }] : []),
      
      // Field-specific configurations
      ...(needsSliderConfig ? [{
        name: "sliderConfig",
        type: "object",
        label: "Slider Configuration",
        objectConfig: {
          title: "Slider Settings",
          description: "Configure slider-specific options",
          layout: "grid",
          columns: 2,
          showCard: true,
          fields: [
            { name: "min", type: "number", label: "Minimum Value" },
            { name: "max", type: "number", label: "Maximum Value" },
            { name: "step", type: "number", label: "Step", min: 1 },
            { name: "orientation", type: "radio", label: "Orientation", options: [
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" }
            ]},
            { name: "showTooltip", type: "switch", label: "Show tooltip" },
            { name: "showValue", type: "switch", label: "Show current value" },
          ]
        }
      }] : []),
      
      ...(needsNumberConfig ? [{
        name: "numberConfig",
        type: "object",
        label: "Number Configuration",
        objectConfig: {
          title: "Number Settings",
          description: "Configure number field options",
          layout: "grid",
          columns: 2,
          showCard: true,
          fields: [
            { name: "min", type: "number", label: "Minimum Value" },
            { name: "max", type: "number", label: "Maximum Value" },
            { name: "step", type: "number", label: "Step", min: 1 },
            { name: "precision", type: "number", label: "Precision (Decimal Places)", min: 0, max: 10 },
            { name: "allowNegative", type: "switch", label: "Allow negative numbers" },
            { name: "showSpinButtons", type: "switch", label: "Show spin buttons" },
          ]
        }
      }] : []),
      
      ...(needsDateConfig ? [{
        name: "dateConfig",
        type: "object",
        label: "Date Configuration",
        objectConfig: {
          title: "Date Settings",
          description: "Configure date picker options",
          layout: "vertical",
          showCard: true,
          fields: [
            { name: "minDate", type: "date", label: "Minimum Date" },
            { name: "maxDate", type: "date", label: "Maximum Date" },
            { name: "format", type: "select", label: "Date Format", options: [
              { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
              { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
              { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
              { value: "MMM dd, yyyy", label: "MMM DD, YYYY" }
            ]},
            { name: "disablePast", type: "switch", label: "Disable past dates" },
            { name: "disableFuture", type: "switch", label: "Disable future dates" },
            { name: "disableWeekends", type: "switch", label: "Disable weekends" },
          ]
        }
      }] : []),
      
      // Advanced configurations
      {
        name: "advanced",
        type: "object",
        label: "Advanced Configuration",
        objectConfig: {
          title: "Advanced Settings",
          description: "Configure advanced field options",
          collapsible: true,
          defaultExpanded: false,
          layout: "vertical",
          showCard: true,
          fields: [
            // Help configuration
            { name: "help", type: "object", label: "Help Settings", objectConfig: {
              title: "Help & Tooltips",
              layout: "vertical",
              fields: [
                { name: "text", type: "textarea", label: "Help Text", placeholder: "Additional help text for users" },
                { name: "tooltip", type: "text", label: "Tooltip", placeholder: "Short tooltip text" },
                { name: "position", type: "select", label: "Help Position", options: [
                  { value: "top", label: "Top" },
                  { value: "bottom", label: "Bottom" },
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" }
                ]},
                { name: "linkUrl", type: "text", label: "Help Link URL", placeholder: "https://example.com/help" },
                { name: "linkText", type: "text", label: "Help Link Text", placeholder: "Learn more" },
              ]
            }},
            
            // Section configuration
            { name: "section", type: "object", label: "Section Settings", objectConfig: {
              title: "Section Organization",
              layout: "vertical",
              fields: [
                { name: "title", type: "text", label: "Section Title", placeholder: "Section title" },
                { name: "description", type: "textarea", label: "Section Description", placeholder: "Section description" },
                { name: "collapsible", type: "switch", label: "Collapsible section" },
                { name: "defaultExpanded", type: "switch", label: "Expanded by default" },
              ]
            }},
            
            // Inline validation
            { name: "inlineValidation", type: "object", label: "Inline Validation", objectConfig: {
              title: "Real-time Validation",
              layout: "vertical",
              fields: [
                { name: "enabled", type: "switch", label: "Enable inline validation" },
                { name: "debounceMs", type: "number", label: "Debounce (ms)", min: 0 },
                { name: "showSuccess", type: "switch", label: "Show success indicator" },
              ]
            }},
            
            // Validation rules
            { name: "validation", type: "object", label: "Validation Rules", objectConfig: {
              title: "Field Validation",
              layout: "grid",
              columns: 2,
              fields: [
                { name: "minLength", type: "number", label: "Minimum Length", min: 0 },
                { name: "maxLength", type: "number", label: "Maximum Length", min: 1 },
                { name: "min", type: "number", label: "Minimum Value" },
                { name: "max", type: "number", label: "Maximum Value" },
                { name: "pattern", type: "text", label: "Pattern (Regex)", placeholder: "e.g., ^[A-Za-z]+$" },
                { name: "includes", type: "text", label: "Must Include" },
                { name: "startsWith", type: "text", label: "Must Start With" },
                { name: "endsWith", type: "text", label: "Must End With" },
                { name: "email", type: "switch", label: "Validate email format" },
                { name: "url", type: "switch", label: "URL format" },
                { name: "uuid", type: "switch", label: "UUID format" },
                { name: "custom", type: "textarea", label: "Custom Validation Message" },
              ]
            }},
          ]
        }
      }
    ],
    formOptions: {
      defaultValues: {
        basic: {
          label: initialField.label,
          name: initialField.name,
          placeholder: initialField.placeholder || "",
          description: initialField.description || "",
          page: initialField.page || 1,
          group: initialField.group || "",
          required: initialField.required || false,
        },
        options: initialField.options || [],
        sliderConfig: initialField.sliderConfig || {},
        numberConfig: initialField.numberConfig || {},
        dateConfig: initialField.dateConfig || {},
        advanced: {
          help: initialField.help || {},
          section: initialField.section || {},
          inlineValidation: initialField.inlineValidation || {},
          validation: initialField.validation || {},
        }
      },
      onChange: ({ value }) => {
        // Real-time updates on every change
        const updatedField = {
          ...initialField,
          ...value.basic,
          options: value.options,
          sliderConfig: value.sliderConfig,
          numberConfig: value.numberConfig,
          dateConfig: value.dateConfig,
          help: value.advanced?.help,
          section: value.advanced?.section,
          inlineValidation: value.advanced?.inlineValidation,
          validation: value.advanced?.validation,
        };
        onFieldChange(fieldId, updatedField);
      },
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4">
        <h3 className="font-semibold text-lg">Configure Field</h3>
        <p className="text-sm text-muted-foreground">
          Configure the properties for this {initialField.type} field
        </p>
      </div>

      {configForm.fields.map((field) => {
        const FieldComponent = configForm.fieldComponents[field.type as keyof typeof configForm.fieldComponents];
        if (!FieldComponent) return null;
        
        return (
          <FieldComponent
            key={field.name}
            fieldApi={configForm.form.useField({ name: field.name })}
            label={field.label}
            {...field}
          />
        );
      })}
    </div>
  );
};