"use client";
import React from "react";
import { useFormedible } from "formedible";
import { z } from "zod";

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

// Simplified Configuration Schema
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
  helpText: z.string().optional(),
  helpTooltip: z.string().optional(),
  helpPosition: z.enum(["top", "bottom", "left", "right"]).default("bottom"),
  helpLinkUrl: z.string().optional(),
  helpLinkText: z.string().optional(),
  
  sectionTitle: z.string().optional(),
  sectionDescription: z.string().optional(),
  sectionCollapsible: z.boolean().default(false),
  sectionDefaultExpanded: z.boolean().default(true),
  
  inlineValidationEnabled: z.boolean().default(false),
  inlineValidationDebounceMs: z.number().min(0).default(300),
  inlineValidationShowSuccess: z.boolean().default(false),
  
  validationMinLength: z.number().min(0).optional(),
  validationMaxLength: z.number().min(1).optional(),
  validationMin: z.number().optional(),
  validationMax: z.number().optional(),
  validationPattern: z.string().optional(),
  validationIncludes: z.string().optional(),
  validationStartsWith: z.string().optional(),
  validationEndsWith: z.string().optional(),
  validationEmail: z.boolean().default(false),
  validationUrl: z.boolean().default(false),
  validationUuid: z.boolean().default(false),
  validationCustom: z.string().optional(),
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
  const needsMultiSelectConfig = initialField.type === 'multiSelect';

  // Build fields array dynamically based on field type
  const buildFields = () => {
    const fields = [
      // Basic Configuration
      { name: "label", type: "text", label: "Field Label", placeholder: "Enter field label", section: { title: "Basic Configuration" } },
      { name: "name", type: "text", label: "Field Name", placeholder: "Enter field name", section: { title: "Basic Configuration" } },
      { name: "placeholder", type: "text", label: "Placeholder", placeholder: "Enter placeholder text", section: { title: "Basic Configuration" } },
      { name: "description", type: "textarea", label: "Description", placeholder: "Enter field description", section: { title: "Basic Configuration" } },
      { 
        name: "page", 
        type: "select", 
        label: "Page",
        options: availablePages.map(page => ({ value: page.toString(), label: `Page ${page}` })),
        section: { title: "Basic Configuration" }
      },
      { name: "group", type: "text", label: "Group (Optional)", placeholder: "Group name for organizing fields", section: { title: "Basic Configuration" } },
      { name: "required", type: "checkbox", label: "Required field", section: { title: "Basic Configuration" } },
    ];

    // Add options configuration if needed
    if (needsOptions) {
      fields.push({
        name: "options",
        type: "array",
        label: "Field Options",
        section: { title: "Options Configuration" }
      });
    }

    // Add field-specific configurations
    if (needsSliderConfig) {
      fields.push(
        { name: "sliderConfig.min", type: "number", label: "Minimum Value", section: { title: "Slider Configuration" } },
        { name: "sliderConfig.max", type: "number", label: "Maximum Value", section: { title: "Slider Configuration" } },
        { name: "sliderConfig.step", type: "number", label: "Step", section: { title: "Slider Configuration" } },
        { name: "sliderConfig.orientation", type: "radio", label: "Orientation", options: [
          { value: "horizontal", label: "Horizontal" },
          { value: "vertical", label: "Vertical" }
        ], section: { title: "Slider Configuration" }},
        { name: "sliderConfig.showTooltip", type: "switch", label: "Show tooltip", section: { title: "Slider Configuration" } },
        { name: "sliderConfig.showValue", type: "switch", label: "Show current value", section: { title: "Slider Configuration" } }
      );
    }

    if (needsNumberConfig) {
      fields.push(
        { name: "numberConfig.min", type: "number", label: "Minimum Value", section: { title: "Number Configuration" } },
        { name: "numberConfig.max", type: "number", label: "Maximum Value", section: { title: "Number Configuration" } },
        { name: "numberConfig.step", type: "number", label: "Step", section: { title: "Number Configuration" } },
        { name: "numberConfig.precision", type: "number", label: "Precision (Decimal Places)", section: { title: "Number Configuration" } },
        { name: "numberConfig.allowNegative", type: "switch", label: "Allow negative numbers", section: { title: "Number Configuration" } },
        { name: "numberConfig.showSpinButtons", type: "switch", label: "Show spin buttons", section: { title: "Number Configuration" } }
      );
    }

    if (needsDateConfig) {
      fields.push(
        { name: "dateConfig.minDate", type: "date", label: "Minimum Date", section: { title: "Date Configuration" } },
        { name: "dateConfig.maxDate", type: "date", label: "Maximum Date", section: { title: "Date Configuration" } },
        { name: "dateConfig.format", type: "select", label: "Date Format", options: [
          { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
          { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
          { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
          { value: "MMM dd, yyyy", label: "MMM DD, YYYY" }
        ], section: { title: "Date Configuration" }},
        { name: "dateConfig.disablePast", type: "switch", label: "Disable past dates", section: { title: "Date Configuration" } },
        { name: "dateConfig.disableFuture", type: "switch", label: "Disable future dates", section: { title: "Date Configuration" } },
        { name: "dateConfig.disableWeekends", type: "switch", label: "Disable weekends", section: { title: "Date Configuration" } }
      );
    }

    if (needsMultiSelectConfig) {
      fields.push(
        { name: "multiSelectConfig.placeholder", type: "text", label: "Placeholder", placeholder: "Select options...", section: { title: "Multi-Select Configuration" } },
        { name: "multiSelectConfig.maxSelections", type: "number", label: "Max Selections", section: { title: "Multi-Select Configuration" } },
        { name: "multiSelectConfig.searchable", type: "switch", label: "Enable search", section: { title: "Multi-Select Configuration" } },
        { name: "multiSelectConfig.creatable", type: "switch", label: "Allow creating new options", section: { title: "Multi-Select Configuration" } }
      );
    }

    if (needsRatingConfig) {
      fields.push(
        { name: "ratingConfig.max", type: "number", label: "Maximum Rating", section: { title: "Rating Configuration" } },
        { name: "ratingConfig.allowHalf", type: "switch", label: "Allow half ratings", section: { title: "Rating Configuration" } },
        { name: "ratingConfig.showValue", type: "switch", label: "Show rating value", section: { title: "Rating Configuration" } },
        { name: "ratingConfig.icon", type: "select", label: "Icon Style", options: [
          { value: "star", label: "⭐ Star" },
          { value: "heart", label: "❤️ Heart" },
          { value: "thumb", label: "👍 Thumb" },
          { value: "circle", label: "⚫ Circle" }
        ], section: { title: "Rating Configuration" }}
      );
    }

    if (needsPhoneConfig) {
      fields.push(
        { name: "phoneConfig.defaultCountry", type: "text", label: "Default Country Code", placeholder: "US", section: { title: "Phone Configuration" } },
        { name: "phoneConfig.format", type: "radio", label: "Phone Format", options: [
          { value: "national", label: "National (123) 456-7890" },
          { value: "international", label: "International +1 123 456 7890" }
        ], section: { title: "Phone Configuration" }},
        { name: "phoneConfig.placeholder", type: "text", label: "Placeholder", placeholder: "Enter phone number", section: { title: "Phone Configuration" } }
      );
    }

    if (needsColorConfig) {
      fields.push(
        { name: "colorConfig.format", type: "select", label: "Color Format", options: [
          { value: "hex", label: "HEX (#ffffff)" },
          { value: "rgb", label: "RGB (255, 255, 255)" },
          { value: "hsl", label: "HSL (0, 0%, 100%)" }
        ], section: { title: "Color Configuration" }},
        { name: "colorConfig.presets", type: "array", label: "Color Presets", section: { title: "Color Configuration" }}
      );
    }

    if (needsFileConfig) {
      fields.push(
        { name: "fileConfig.accept", type: "text", label: "Accepted File Types", placeholder: ".pdf,.doc,.docx,image/*", section: { title: "File Configuration" } },
        { name: "fileConfig.multiple", type: "switch", label: "Allow multiple files", section: { title: "File Configuration" } },
        { name: "fileConfig.maxSize", type: "number", label: "Max File Size (MB)", section: { title: "File Configuration" } },
        { name: "fileConfig.maxFiles", type: "number", label: "Max Number of Files", section: { title: "File Configuration" } }
      );
    }

    if (needsTextareaConfig) {
      fields.push(
        { name: "textareaConfig.rows", type: "number", label: "Rows", section: { title: "Textarea Configuration" } },
        { name: "textareaConfig.cols", type: "number", label: "Columns", section: { title: "Textarea Configuration" } },
        { name: "textareaConfig.resize", type: "select", label: "Resize Behavior", options: [
          { value: "none", label: "No resize" },
          { value: "vertical", label: "Vertical only" },
          { value: "horizontal", label: "Horizontal only" },
          { value: "both", label: "Both directions" }
        ], section: { title: "Textarea Configuration" }},
        { name: "textareaConfig.maxLength", type: "number", label: "Maximum Length", section: { title: "Textarea Configuration" } },
        { name: "textareaConfig.showWordCount", type: "switch", label: "Show word count", section: { title: "Textarea Configuration" } }
      );
    }

    if (needsPasswordConfig) {
      fields.push(
        { name: "passwordConfig.showToggle", type: "switch", label: "Show/hide toggle button", section: { title: "Password Configuration" } },
        { name: "passwordConfig.strengthMeter", type: "switch", label: "Show strength meter", section: { title: "Password Configuration" } },
        { name: "passwordConfig.minStrength", type: "number", label: "Minimum Strength (1-4)", section: { title: "Password Configuration" } },
        { name: "passwordConfig.minLength", type: "number", label: "Minimum Length", section: { title: "Password Configuration" } },
        { name: "passwordConfig.requireUppercase", type: "switch", label: "Require uppercase letters", section: { title: "Password Configuration" } },
        { name: "passwordConfig.requireLowercase", type: "switch", label: "Require lowercase letters", section: { title: "Password Configuration" } },
        { name: "passwordConfig.requireNumbers", type: "switch", label: "Require numbers", section: { title: "Password Configuration" } },
        { name: "passwordConfig.requireSymbols", type: "switch", label: "Require symbols", section: { title: "Password Configuration" } }
      );
    }

    if (needsEmailConfig) {
      fields.push(
        { name: "emailConfig.allowedDomains", type: "text", label: "Allowed Domains (comma-separated)", placeholder: "gmail.com, company.com", section: { title: "Email Configuration" } },
        { name: "emailConfig.blockedDomains", type: "text", label: "Blocked Domains (comma-separated)", placeholder: "tempmail.com, throwaway.email", section: { title: "Email Configuration" } },
        { name: "emailConfig.suggestions", type: "text", label: "Domain Suggestions (comma-separated)", placeholder: "gmail.com, yahoo.com, outlook.com", section: { title: "Email Configuration" } },
        { name: "emailConfig.validateMX", type: "switch", label: "Validate MX records", section: { title: "Email Configuration" } }
      );
    }

    // Always add advanced configuration
    fields.push(
      // Help configuration
      { name: "helpText", type: "textarea", label: "Help Text", placeholder: "Additional help text for users", section: { title: "Advanced Configuration" } },
      { name: "helpTooltip", type: "text", label: "Tooltip", placeholder: "Short tooltip text", section: { title: "Advanced Configuration" } },
      { name: "helpPosition", type: "select", label: "Help Position", options: [
        { value: "top", label: "Top" },
        { value: "bottom", label: "Bottom" },
        { value: "left", label: "Left" },
        { value: "right", label: "Right" }
      ], section: { title: "Advanced Configuration" }},
      { name: "helpLinkUrl", type: "text", label: "Help Link URL", placeholder: "https://example.com/help", section: { title: "Advanced Configuration" } },
      { name: "helpLinkText", type: "text", label: "Help Link Text", placeholder: "Learn more", section: { title: "Advanced Configuration" } },
      
      // Section configuration
      { name: "sectionTitle", type: "text", label: "Section Title", placeholder: "Section title", section: { title: "Advanced Configuration" } },
      { name: "sectionDescription", type: "textarea", label: "Section Description", placeholder: "Section description", section: { title: "Advanced Configuration" } },
      { name: "sectionCollapsible", type: "switch", label: "Collapsible section", section: { title: "Advanced Configuration" } },
      { name: "sectionDefaultExpanded", type: "switch", label: "Expanded by default", section: { title: "Advanced Configuration" } },
      
      // Inline validation
      { name: "inlineValidationEnabled", type: "switch", label: "Enable inline validation", section: { title: "Advanced Configuration" } },
      { name: "inlineValidationDebounceMs", type: "number", label: "Debounce (ms)", section: { title: "Advanced Configuration" } },
      { name: "inlineValidationShowSuccess", type: "switch", label: "Show success indicator", section: { title: "Advanced Configuration" } },
      
      // Validation rules
      { name: "validationMinLength", type: "number", label: "Minimum Length", section: { title: "Advanced Configuration" } },
      { name: "validationMaxLength", type: "number", label: "Maximum Length", section: { title: "Advanced Configuration" } },
      { name: "validationMin", type: "number", label: "Minimum Value", section: { title: "Advanced Configuration" } },
      { name: "validationMax", type: "number", label: "Maximum Value", section: { title: "Advanced Configuration" } },
      { name: "validationPattern", type: "text", label: "Pattern (Regex)", placeholder: "e.g., ^[A-Za-z]+$", section: { title: "Advanced Configuration" } },
      { name: "validationIncludes", type: "text", label: "Must Include", section: { title: "Advanced Configuration" } },
      { name: "validationStartsWith", type: "text", label: "Must Start With", section: { title: "Advanced Configuration" } },
      { name: "validationEndsWith", type: "text", label: "Must End With", section: { title: "Advanced Configuration" } },
      { name: "validationEmail", type: "switch", label: "Validate email format", section: { title: "Advanced Configuration" } },
      { name: "validationUrl", type: "switch", label: "URL format", section: { title: "Advanced Configuration" } },
      { name: "validationUuid", type: "switch", label: "UUID format", section: { title: "Advanced Configuration" } },
      { name: "validationCustom", type: "textarea", label: "Custom Validation Message", section: { title: "Advanced Configuration" } }
    );

    return fields;
  };

  // Helper function to get nested value
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to set nested value
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  // Single unified form
  const configForm = useFormedible({
    schema: fieldConfigurationSchema,
    fields: buildFields(),
    formOptions: {
      defaultValues: {
        label: initialField.label,
        name: initialField.name,
        placeholder: initialField.placeholder || "",
        description: initialField.description || "",
        page: initialField.page || 1,
        group: initialField.group || "",
        required: initialField.required || false,
        options: initialField.options || [],
        sliderConfig: initialField.sliderConfig || {},
        numberConfig: initialField.numberConfig || {},
        dateConfig: {
          ...initialField.dateConfig,
          format: (initialField.dateConfig?.format as "yyyy-MM-dd" | "MM/dd/yyyy" | "dd/MM/yyyy" | "MMM dd, yyyy") || "yyyy-MM-dd"
        },
        multiSelectConfig: initialField.multiSelectConfig || {},
        ratingConfig: initialField.ratingConfig || {},
        phoneConfig: initialField.phoneConfig || {},
        colorConfig: initialField.colorConfig || {},
        fileConfig: initialField.fileConfig || {},
        textareaConfig: initialField.textareaConfig || {},
        passwordConfig: initialField.passwordConfig || {},
        emailConfig: {
          allowedDomains: initialField.emailConfig?.allowedDomains?.join(', ') || "",
          blockedDomains: initialField.emailConfig?.blockedDomains?.join(', ') || "",
          suggestions: initialField.emailConfig?.suggestions?.join(', ') || "",
          validateMX: initialField.emailConfig?.validateMX || false,
        },
        helpText: initialField.help?.text || "",
        helpTooltip: initialField.help?.tooltip || "",
        helpPosition: initialField.help?.position || "bottom",
        helpLinkUrl: initialField.help?.link?.url || "",
        helpLinkText: initialField.help?.link?.text || "",
        sectionTitle: initialField.section?.title || "",
        sectionDescription: initialField.section?.description || "",
        sectionCollapsible: initialField.section?.collapsible || false,
        sectionDefaultExpanded: initialField.section?.defaultExpanded !== false,
        inlineValidationEnabled: initialField.inlineValidation?.enabled || false,
        inlineValidationDebounceMs: initialField.inlineValidation?.debounceMs || 300,
        inlineValidationShowSuccess: initialField.inlineValidation?.showSuccess || false,
        validationMinLength: initialField.validation?.minLength,
        validationMaxLength: initialField.validation?.maxLength,
        validationMin: initialField.validation?.min,
        validationMax: initialField.validation?.max,
        validationPattern: initialField.validation?.pattern || "",
        validationIncludes: initialField.validation?.includes || "",
        validationStartsWith: initialField.validation?.startsWith || "",
        validationEndsWith: initialField.validation?.endsWith || "",
        validationEmail: initialField.validation?.email || false,
        validationUrl: initialField.validation?.url || false,
        validationUuid: initialField.validation?.uuid || false,
        validationCustom: initialField.validation?.custom || "",
      },
      onChange: ({ value }) => {
        // Real-time updates on every change
        const updatedField: FormField = {
          ...initialField,
          label: value.label,
          name: value.name,
          placeholder: value.placeholder,
          description: value.description,
          page: value.page,
          group: value.group,
          required: value.required,
          options: value.options,
          sliderConfig: value.sliderConfig,
          numberConfig: value.numberConfig,
          dateConfig: value.dateConfig,
          multiSelectConfig: value.multiSelectConfig,
          ratingConfig: value.ratingConfig,
          phoneConfig: value.phoneConfig,
          colorConfig: value.colorConfig,
          fileConfig: value.fileConfig,
          textareaConfig: value.textareaConfig,
          passwordConfig: value.passwordConfig,
          emailConfig: value.emailConfig ? {
            allowedDomains: value.emailConfig.allowedDomains ? value.emailConfig.allowedDomains.split(',').map(d => d.trim()).filter(Boolean) : undefined,
            blockedDomains: value.emailConfig.blockedDomains ? value.emailConfig.blockedDomains.split(',').map(d => d.trim()).filter(Boolean) : undefined,
            suggestions: value.emailConfig.suggestions ? value.emailConfig.suggestions.split(',').map(d => d.trim()).filter(Boolean) : undefined,
            validateMX: value.emailConfig.validateMX,
          } : undefined,
          help: (value.helpText || value.helpTooltip || value.helpLinkUrl) ? {
            text: value.helpText,
            tooltip: value.helpTooltip,
            position: value.helpPosition,
            ...(value.helpLinkUrl && value.helpLinkText && { 
              link: { url: value.helpLinkUrl, text: value.helpLinkText } 
            })
          } : undefined,
          section: value.sectionTitle ? {
            title: value.sectionTitle,
            description: value.sectionDescription,
            collapsible: value.sectionCollapsible,
            defaultExpanded: value.sectionDefaultExpanded,
          } : undefined,
          inlineValidation: value.inlineValidationEnabled ? {
            enabled: value.inlineValidationEnabled,
            debounceMs: value.inlineValidationDebounceMs,
            showSuccess: value.inlineValidationShowSuccess,
          } : undefined,
          validation: (value.validationMinLength || value.validationMaxLength || value.validationMin || value.validationMax || value.validationPattern || value.validationIncludes || value.validationStartsWith || value.validationEndsWith || value.validationEmail || value.validationUrl || value.validationUuid || value.validationCustom) ? {
            minLength: value.validationMinLength,
            maxLength: value.validationMaxLength,
            min: value.validationMin,
            max: value.validationMax,
            pattern: value.validationPattern,
            includes: value.validationIncludes,
            startsWith: value.validationStartsWith,
            endsWith: value.validationEndsWith,
            email: value.validationEmail,
            url: value.validationUrl,
            uuid: value.validationUuid,
            custom: value.validationCustom,
          } : undefined,
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

      <configForm.Form />
    </div>
  );
};