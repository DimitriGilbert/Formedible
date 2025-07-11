"use client";
import React from "react";
import { useFormedible } from "formedible";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Palette, Star, Phone, Upload, List, Sliders, Hash, Calendar, FileText, Eye, Mail, Type, CopyCheck, HelpCircle } from "lucide-react";

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

// Basic Configuration Schema
const basicConfigSchema = z.object({
  label: z.string().min(1, "Field label is required"),
  name: z.string().min(1, "Field name is required"),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  page: z.number().min(1),
  group: z.string().optional(),
  required: z.boolean().default(false),
});

// Options Configuration Schema
const optionsConfigSchema = z.object({
  options: z.array(z.object({
    value: z.string().min(1, "Option value required"),
    label: z.string().min(1, "Option label required"),
  })).optional(),
  datalist: z.array(z.string()).optional(),
});

// Field-specific Configuration Schemas
const sliderConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().min(1).optional(),
  showTooltip: z.boolean().default(false),
  showValue: z.boolean().default(false),
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
});

// Advanced Configuration Schemas
const helpConfigSchema = z.object({
  text: z.string().optional(),
  tooltip: z.string().optional(),
  position: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
});

const sectionConfigSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  collapsible: z.boolean().default(false),
  defaultExpanded: z.boolean().default(true),
});

const inlineValidationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  debounceMs: z.number().min(0).default(300),
  showSuccess: z.boolean().default(false),
});

const multiSelectConfigSchema = z.object({
  placeholder: z.string().optional(),
  searchable: z.boolean().default(false),
  maxSelections: z.number().min(1).optional(),
  creatable: z.boolean().default(false),
});

const ratingConfigSchema = z.object({
  max: z.number().min(1).max(10).default(5),
  allowHalf: z.boolean().default(false),
  showValue: z.boolean().default(false),
  icon: z.string().default("star"),
});

const phoneConfigSchema = z.object({
  defaultCountry: z.string().default("US"),
  format: z.enum(["national", "international"]).default("national"),
  placeholder: z.string().optional(),
});

const colorConfigSchema = z.object({
  format: z.enum(["hex", "rgb", "hsl"]).default("hex"),
  presets: z.array(z.string()).optional(),
});

const fileConfigSchema = z.object({
  accept: z.string().optional(),
  multiple: z.boolean().default(false),
  maxSize: z.number().min(1).optional(),
  maxFiles: z.number().min(1).optional(),
});

const textareaConfigSchema = z.object({
  rows: z.number().min(1).default(4),
  cols: z.number().min(10).optional(),
  resize: z.enum(["none", "vertical", "horizontal", "both"]).default("vertical"),
  maxLength: z.number().min(1).optional(),
  showWordCount: z.boolean().default(false),
});

const passwordConfigSchema = z.object({
  showToggle: z.boolean().default(true),
  strengthMeter: z.boolean().default(false),
  minStrength: z.number().min(1).max(4).default(1),
  requireUppercase: z.boolean().default(false),
  requireLowercase: z.boolean().default(false),
  requireNumbers: z.boolean().default(false),
  requireSymbols: z.boolean().default(false),
  minLength: z.number().min(1).default(8),
});

const emailConfigSchema = z.object({
  allowedDomains: z.string().optional(),
  blockedDomains: z.string().optional(),
  suggestions: z.string().optional(),
  validateMX: z.boolean().default(false),
});

const numberConfigSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().min(1).optional(),
  precision: z.number().min(0).max(10).optional(),
  allowNegative: z.boolean().default(true),
  showSpinButtons: z.boolean().default(true),
});

const dateConfigSchema = z.object({
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  format: z.enum(["yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MMM dd, yyyy"]).default("yyyy-MM-dd"),
  disablePast: z.boolean().default(false),
  disableFuture: z.boolean().default(false),
  disableWeekends: z.boolean().default(false),
});

const validationConfigSchema = z.object({
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
});

// Main Configuration Schema combining all field configurations
const fieldConfigurationSchema = z.object({
  // Basic configuration
  label: z.string().min(1, "Field label is required"),
  name: z.string().min(1, "Field name is required"),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  page: z.number().min(1),
  group: z.string().optional(),
  required: z.boolean().default(false),
  
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
        // Array configuration will be handled by the array field component
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
      onSubmit: async ({ value }) => {
        // Final submit handling
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



  // Number Configuration Form
  const numberForm = useFormedible({
    schema: numberConfigSchema,
    fields: [
      { name: "min", type: "number", label: "Minimum Value" },
      { name: "max", type: "number", label: "Maximum Value" },
      { name: "step", type: "number", label: "Step", min: 1 },
      { name: "precision", type: "number", label: "Precision (Decimal Places)", min: 0, max: 10 },
      { name: "allowNegative", type: "switch", label: "Allow negative numbers" },
      { name: "showSpinButtons", type: "switch", label: "Show spin buttons" },
    ],
    formOptions: {
      defaultValues: {
        min: initialField.numberConfig?.min,
        max: initialField.numberConfig?.max,
        step: initialField.numberConfig?.step || 1,
        precision: initialField.numberConfig?.precision || 0,
        allowNegative: initialField.numberConfig?.allowNegative !== false,
        showSpinButtons: initialField.numberConfig?.showSpinButtons !== false,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, numberConfig: value });
      },
    },
  });

  // Date Configuration Form
  const dateForm = useFormedible({
    schema: dateConfigSchema,
    fields: [
      { name: "minDate", type: "date", label: "Minimum Date" },
      { name: "maxDate", type: "date", label: "Maximum Date" },
      { 
        name: "format", 
        type: "select", 
        label: "Date Format",
        options: [
          { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
          { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
          { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
          { value: "MMM dd, yyyy", label: "MMM DD, YYYY" }
        ]
      },
      { name: "disablePast", type: "switch", label: "Disable past dates" },
      { name: "disableFuture", type: "switch", label: "Disable future dates" },
      { name: "disableWeekends", type: "switch", label: "Disable weekends" },
    ],
    formOptions: {
      defaultValues: {
        minDate: initialField.dateConfig?.minDate || "",
        maxDate: initialField.dateConfig?.maxDate || "",
        format: (initialField.dateConfig?.format as "yyyy-MM-dd" | "MM/dd/yyyy" | "dd/MM/yyyy" | "MMM dd, yyyy") || "yyyy-MM-dd",
        disablePast: initialField.dateConfig?.disablePast || false,
        disableFuture: initialField.dateConfig?.disableFuture || false,
        disableWeekends: initialField.dateConfig?.disableWeekends || false,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, dateConfig: value });
      },
    },
  });

  // Advanced Field Configuration Forms
  const multiSelectAdvancedForm = useFormedible({
    schema: multiSelectConfigSchema,
    fields: [
      { name: "placeholder", type: "text", label: "Placeholder", placeholder: "Select options..." },
      { name: "maxSelections", type: "number", label: "Max Selections", min: 1, placeholder: "Unlimited" },
      { name: "searchable", type: "switch", label: "Enable search" },
      { name: "creatable", type: "switch", label: "Allow creating new options" },
    ],
    formOptions: {
      defaultValues: {
        placeholder: initialField.multiSelectConfig?.placeholder || "",
        maxSelections: initialField.multiSelectConfig?.maxSelections,
        searchable: initialField.multiSelectConfig?.searchable || false,
        creatable: initialField.multiSelectConfig?.creatable || false,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, multiSelectConfig: value });
      },
    },
  });

  const ratingAdvancedForm = useFormedible({
    schema: ratingConfigSchema,
    fields: [
      { name: "max", type: "number", label: "Maximum Rating", min: 1, max: 10 },
      { name: "allowHalf", type: "switch", label: "Allow half ratings" },
      { name: "showValue", type: "switch", label: "Show rating value" },
      { 
        name: "icon", 
        type: "select", 
        label: "Icon Style",
        options: [
          { value: "star", label: "⭐ Star" },
          { value: "heart", label: "❤️ Heart" },
          { value: "thumb", label: "👍 Thumb" },
          { value: "circle", label: "⚫ Circle" }
        ]
      },
    ],
    formOptions: {
      defaultValues: {
        max: initialField.ratingConfig?.max || 5,
        allowHalf: initialField.ratingConfig?.allowHalf || false,
        showValue: initialField.ratingConfig?.showValue || false,
        icon: initialField.ratingConfig?.icon || "star",
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, ratingConfig: value });
      },
    },
  });

  const phoneAdvancedForm = useFormedible({
    schema: phoneConfigSchema,
    fields: [
      { name: "defaultCountry", type: "text", label: "Default Country Code", placeholder: "US" },
      { 
        name: "format", 
        type: "radio", 
        label: "Phone Format",
        options: [
          { value: "national", label: "National (123) 456-7890" },
          { value: "international", label: "International +1 123 456 7890" }
        ]
      },
      { name: "placeholder", type: "text", label: "Placeholder", placeholder: "Enter phone number" },
    ],
    formOptions: {
      defaultValues: {
        defaultCountry: initialField.phoneConfig?.defaultCountry || "US",
        format: initialField.phoneConfig?.format || "national",
        placeholder: initialField.phoneConfig?.placeholder || "",
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, phoneConfig: value });
      },
    },
  });

  const colorAdvancedForm = useFormedible({
    schema: colorConfigSchema,
    fields: [
      { 
        name: "format", 
        type: "select", 
        label: "Color Format",
        options: [
          { value: "hex", label: "HEX (#ffffff)" },
          { value: "rgb", label: "RGB (255, 255, 255)" },
          { value: "hsl", label: "HSL (0, 0%, 100%)" }
        ]
      },
      { 
        name: "presets", 
        type: "array", 
        label: "Color Presets",
        // Array configuration will be handled differently
      },
    ],
    formOptions: {
      defaultValues: {
        format: initialField.colorConfig?.format || "hex",
        presets: initialField.colorConfig?.presets || [],
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, colorConfig: value });
      },
    },
  });

  const fileAdvancedForm = useFormedible({
    schema: fileConfigSchema,
    fields: [
      { name: "accept", type: "text", label: "Accepted File Types", placeholder: ".pdf,.doc,.docx,image/*" },
      { name: "multiple", type: "switch", label: "Allow multiple files" },
      { name: "maxSize", type: "number", label: "Max File Size (MB)", min: 1, placeholder: "No limit" },
      { name: "maxFiles", type: "number", label: "Max Number of Files", min: 1, placeholder: "No limit" },
    ],
    formOptions: {
      defaultValues: {
        accept: initialField.fileConfig?.accept || "",
        multiple: initialField.fileConfig?.multiple || false,
        maxSize: initialField.fileConfig?.maxSize,
        maxFiles: initialField.fileConfig?.maxFiles,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, fileConfig: value });
      },
    },
  });

  const textareaAdvancedForm = useFormedible({
    schema: textareaConfigSchema,
    fields: [
      { name: "rows", type: "number", label: "Rows", min: 1, max: 20 },
      { name: "cols", type: "number", label: "Columns", min: 10, placeholder: "Auto" },
      { 
        name: "resize", 
        type: "select", 
        label: "Resize Behavior",
        options: [
          { value: "none", label: "No resize" },
          { value: "vertical", label: "Vertical only" },
          { value: "horizontal", label: "Horizontal only" },
          { value: "both", label: "Both directions" }
        ]
      },
      { name: "maxLength", type: "number", label: "Maximum Length", min: 1, placeholder: "No limit" },
      { name: "showWordCount", type: "switch", label: "Show word count" },
    ],
    formOptions: {
      defaultValues: {
        rows: initialField.textareaConfig?.rows || 4,
        cols: initialField.textareaConfig?.cols,
        resize: initialField.textareaConfig?.resize || "vertical",
        maxLength: initialField.textareaConfig?.maxLength,
        showWordCount: initialField.textareaConfig?.showWordCount || false,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, textareaConfig: value });
      },
    },
  });

  const passwordAdvancedForm = useFormedible({
    schema: passwordConfigSchema,
    fields: [
      { name: "showToggle", type: "switch", label: "Show/hide toggle button" },
      { name: "strengthMeter", type: "switch", label: "Show strength meter" },
      { name: "minStrength", type: "number", label: "Minimum Strength (1-4)", min: 1, max: 4 },
      { name: "minLength", type: "number", label: "Minimum Length", min: 1 },
      { name: "requireUppercase", type: "switch", label: "Require uppercase letters" },
      { name: "requireLowercase", type: "switch", label: "Require lowercase letters" },
      { name: "requireNumbers", type: "switch", label: "Require numbers" },
      { name: "requireSymbols", type: "switch", label: "Require symbols" },
    ],
    formOptions: {
      defaultValues: {
        showToggle: initialField.passwordConfig?.showToggle !== false,
        strengthMeter: initialField.passwordConfig?.strengthMeter || false,
        minStrength: initialField.passwordConfig?.minStrength || 1,
        minLength: initialField.passwordConfig?.requirements?.minLength || 8,
        requireUppercase: initialField.passwordConfig?.requirements?.requireUppercase || false,
        requireLowercase: initialField.passwordConfig?.requirements?.requireLowercase || false,
        requireNumbers: initialField.passwordConfig?.requirements?.requireNumbers || false,
        requireSymbols: initialField.passwordConfig?.requirements?.requireSymbols || false,
      },
      onSubmit: async ({ value }) => {
        const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSymbols, ...rest } = value;
        onFieldChange(fieldId, { 
          ...initialField, 
          passwordConfig: {
            ...rest,
            requirements: {
              minLength,
              requireUppercase,
              requireLowercase,
              requireNumbers,
              requireSymbols,
            }
          }
        });
      },
    },
  });

  const emailAdvancedForm = useFormedible({
    schema: emailConfigSchema,
    fields: [
      { name: "allowedDomains", type: "text", label: "Allowed Domains (comma-separated)", placeholder: "gmail.com, company.com" },
      { name: "blockedDomains", type: "text", label: "Blocked Domains (comma-separated)", placeholder: "tempmail.com, throwaway.email" },
      { name: "suggestions", type: "text", label: "Domain Suggestions (comma-separated)", placeholder: "gmail.com, yahoo.com, outlook.com" },
      { name: "validateMX", type: "switch", label: "Validate MX records" },
    ],
    formOptions: {
      defaultValues: {
        allowedDomains: initialField.emailConfig?.allowedDomains?.join(', ') || "",
        blockedDomains: initialField.emailConfig?.blockedDomains?.join(', ') || "",
        suggestions: initialField.emailConfig?.suggestions?.join(', ') || "",
        validateMX: initialField.emailConfig?.validateMX || false,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { 
          ...initialField, 
          emailConfig: {
            allowedDomains: value.allowedDomains ? value.allowedDomains.split(',').map(d => d.trim()).filter(Boolean) : undefined,
            blockedDomains: value.blockedDomains ? value.blockedDomains.split(',').map(d => d.trim()).filter(Boolean) : undefined,
            suggestions: value.suggestions ? value.suggestions.split(',').map(d => d.trim()).filter(Boolean) : undefined,
            validateMX: value.validateMX,
          }
        });
      },
    },
  });

  // Help Configuration Form
  const helpForm = useFormedible({
    schema: helpConfigSchema,
    fields: [
      { name: "text", type: "textarea", label: "Help Text", placeholder: "Additional help text for users" },
      { name: "tooltip", type: "text", label: "Tooltip", placeholder: "Short tooltip text" },
      { 
        name: "position", 
        type: "select", 
        label: "Help Position",
        options: [
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "left", label: "Left" },
          { value: "right", label: "Right" }
        ]
      },
      { name: "linkUrl", type: "text", label: "Help Link URL", placeholder: "https://example.com/help" },
      { name: "linkText", type: "text", label: "Help Link Text", placeholder: "Learn more" },
    ],
    formOptions: {
      defaultValues: {
        text: initialField.help?.text || "",
        tooltip: initialField.help?.tooltip || "",
        position: initialField.help?.position || "bottom",
        linkUrl: initialField.help?.link?.url || "",
        linkText: initialField.help?.link?.text || "",
      },
      onSubmit: async ({ value }) => {
        const { linkUrl, linkText, ...rest } = value;
        onFieldChange(fieldId, { 
          ...initialField, 
          help: {
            ...rest,
            ...(linkUrl && linkText && { link: { url: linkUrl, text: linkText } })
          }
        });
      },
    },
  });

  // Section Configuration Form
  const sectionForm = useFormedible({
    schema: sectionConfigSchema,
    fields: [
      { name: "title", type: "text", label: "Section Title", placeholder: "Section title" },
      { name: "description", type: "textarea", label: "Section Description", placeholder: "Section description" },
      { name: "collapsible", type: "switch", label: "Collapsible section" },
      { name: "defaultExpanded", type: "switch", label: "Expanded by default" },
    ],
    formOptions: {
      defaultValues: {
        title: initialField.section?.title || "",
        description: initialField.section?.description || "",
        collapsible: initialField.section?.collapsible || false,
        defaultExpanded: initialField.section?.defaultExpanded !== false,
      },
      onSubmit: async ({ value }) => {
        if (value.title) {
          onFieldChange(fieldId, { ...initialField, section: value as { title: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean; } });
        } else {
          onFieldChange(fieldId, { ...initialField, section: undefined });
        }
      },
    },
  });

  // Inline Validation Configuration Form
  const inlineValidationForm = useFormedible({
    schema: inlineValidationConfigSchema,
    fields: [
      { name: "enabled", type: "switch", label: "Enable inline validation" },
      { name: "debounceMs", type: "number", label: "Debounce (ms)", min: 0 },
      { name: "showSuccess", type: "switch", label: "Show success indicator" },
    ],
    formOptions: {
      defaultValues: {
        enabled: initialField.inlineValidation?.enabled || false,
        debounceMs: initialField.inlineValidation?.debounceMs || 300,
        showSuccess: initialField.inlineValidation?.showSuccess || false,
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, inlineValidation: value });
      },
    },
  });

  // Validation Configuration Form
  const validationForm = useFormedible({
    schema: validationConfigSchema,
    fields: [
      // Basic validation
      { name: "minLength", type: "number", label: "Minimum Length", min: 0, conditional: (values: any) => ['text', 'textarea', 'email', 'password'].includes(initialField.type) },
      { name: "maxLength", type: "number", label: "Maximum Length", min: 1, conditional: (values: any) => ['text', 'textarea', 'email', 'password'].includes(initialField.type) },
      { name: "min", type: "number", label: "Minimum Value", conditional: (values: any) => ['number', 'slider', 'rating'].includes(initialField.type) },
      { name: "max", type: "number", label: "Maximum Value", conditional: (values: any) => ['number', 'slider', 'rating'].includes(initialField.type) },
      
      // String validation
      { name: "pattern", type: "text", label: "Pattern (Regex)", placeholder: "e.g., ^[A-Za-z]+$", conditional: (values: any) => ['text', 'textarea', 'email', 'password'].includes(initialField.type) },
      { name: "includes", type: "text", label: "Must Include", conditional: (values: any) => ['text', 'textarea', 'email', 'password'].includes(initialField.type) },
      { name: "startsWith", type: "text", label: "Must Start With", conditional: (values: any) => ['text', 'textarea', 'email', 'password'].includes(initialField.type) },
      { name: "endsWith", type: "text", label: "Must End With", conditional: (values: any) => ['text', 'textarea', 'email', 'password'].includes(initialField.type) },
      
      // Built-in validators
      { name: "email", type: "switch", label: "Validate email format", conditional: (values: any) => initialField.type === 'email' },
      { name: "url", type: "switch", label: "URL format", conditional: (values: any) => initialField.type === 'text' },
      { name: "uuid", type: "switch", label: "UUID format", conditional: (values: any) => initialField.type === 'text' },
      
      // Custom validation
      { name: "custom", type: "textarea", label: "Custom Validation Message", placeholder: "Custom error message for this field" },
    ],
    formOptions: {
      defaultValues: {
        minLength: initialField.validation?.minLength,
        maxLength: initialField.validation?.maxLength,
        min: initialField.validation?.min,
        max: initialField.validation?.max,
        pattern: initialField.validation?.pattern || "",
        includes: initialField.validation?.includes || "",
        startsWith: initialField.validation?.startsWith || "",
        endsWith: initialField.validation?.endsWith || "",
        email: initialField.validation?.email || false,
        url: initialField.validation?.url || false,
        uuid: initialField.validation?.uuid || false,
        custom: initialField.validation?.custom || "",
      },
      onSubmit: async ({ value }) => {
        onFieldChange(fieldId, { ...initialField, validation: value });
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

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <basicForm.Form className="space-y-4" />
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          {needsOptions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Field Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <optionsForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}
          
          {!needsOptions && (
            <div className="text-center py-12 text-muted-foreground">
              <p>This field type doesn't use options.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CopyCheck className="h-4 w-4" />
                Validation Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <validationForm.Form className="space-y-4" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          {needsSliderConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Slider Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <sliderForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsNumberConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Number Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <numberForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsDateConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dateForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {!needsSliderConfig && !needsNumberConfig && !needsDateConfig && (
            <div className="text-center py-12 text-muted-foreground">
              <p>This field type doesn't have specific configuration options.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {needsMultiSelectAdvancedConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Multi-Select Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <multiSelectAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsRatingConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ratingAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsPhoneConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <phoneAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsColorConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Picker Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <colorAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsFileConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  File Upload Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <fileAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsTextareaConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Textarea Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textareaAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsPasswordConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Password Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <passwordAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          {needsEmailConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Advanced Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <emailAdvancedForm.Form className="space-y-4" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <helpForm.Form className="space-y-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Section Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <sectionForm.Form className="space-y-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CopyCheck className="h-4 w-4" />
                Inline Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <inlineValidationForm.Form className="space-y-4" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};