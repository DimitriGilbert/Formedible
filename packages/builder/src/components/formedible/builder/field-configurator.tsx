"use client";
import React, { useRef } from "react";
import { useFormedible } from "formedible";
import { z } from "zod";
import { globalFieldStore, type FormField } from "./field-store";



interface FieldConfiguratorProps {
  fieldId: string;
  initialField: FormField;
  availablePages?: number[];
}

export const FieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  fieldId,
  initialField,
  availablePages = [1],
}) => {
  // Track the current field state without causing re-renders
  const currentFieldRef = useRef<FormField>(initialField);
  
  // Update current field when props change
  React.useEffect(() => {
    currentFieldRef.current = initialField;
  }, [fieldId, initialField]);
  
  // Use current field for configuration (this will update when field changes)
  const currentField = currentFieldRef.current;
  const needsOptions = ['select', 'radio', 'multiSelect'].includes(currentField.type);
  const needsSliderConfig = currentField.type === 'slider';
  const needsNumberConfig = currentField.type === 'number';
  const needsDateConfig = currentField.type === 'date';
  const needsFileConfig = currentField.type === 'file';
  const needsTextareaConfig = currentField.type === 'textarea';
  const needsPasswordConfig = currentField.type === 'password';
  const needsEmailConfig = currentField.type === 'email';
  const needsRatingConfig = currentField.type === 'rating';
  const needsPhoneConfig = currentField.type === 'phone';
  const needsColorConfig = currentField.type === 'colorPicker';
  const needsMultiSelectConfig = currentField.type === 'multiSelect';

  // SINGLE FORM WITH TABS CONFIGURATION - TanStack Form Best Practice Implementation
  const configForm = useFormedible({
    schema: z.object({
      // Basic fields
      label: z.string().min(1, "Field label is required"),
      name: z.string().min(1, "Field name is required"),
      placeholder: z.string().optional(),
      description: z.string().optional(),
      page: z.number().min(1),
      group: z.string().optional(),
      required: z.boolean().default(false),
      
      // Options
      options: z.array(z.object({
        value: z.string().min(1, "Option value required"),
        label: z.string().min(1, "Option label required"),
      })).optional(),
      
      // Field-specific configs
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
      
      // Help and advanced
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
    }),
    
    fields: [
      // BASIC TAB
      { name: "label", type: "text", label: "Field Label", placeholder: "Enter field label", tab: "basic" },
      { name: "name", type: "text", label: "Field Name", placeholder: "Enter field name", tab: "basic" },
      { name: "placeholder", type: "text", label: "Placeholder", placeholder: "Enter placeholder text", tab: "basic" },
      { name: "description", type: "textarea", label: "Description", placeholder: "Enter field description", tab: "basic" },
      { 
        name: "page", 
        type: "select", 
        label: "Page",
        options: availablePages.map(page => ({ value: page.toString(), label: `Page ${page}` })),
        tab: "basic"
      },
      { name: "group", type: "text", label: "Group (Optional)", placeholder: "Group name for organizing fields", tab: "basic" },
      { name: "required", type: "checkbox", label: "Required field", tab: "basic" },
      
      // OPTIONS TAB - only show if needed
      ...(needsOptions ? [
        { name: "options", type: "array", label: "Field Options", tab: "options" },
      ] : []),
      
      // FIELD CONFIG TAB - show different configs based on field type
      ...(needsSliderConfig ? [
        { name: "sliderConfig.min", type: "number", label: "Minimum Value", tab: "config" },
        { name: "sliderConfig.max", type: "number", label: "Maximum Value", tab: "config" },
        { name: "sliderConfig.step", type: "number", label: "Step", tab: "config" },
        { name: "sliderConfig.orientation", type: "radio", label: "Orientation", options: [
          { value: "horizontal", label: "Horizontal" },
          { value: "vertical", label: "Vertical" }
        ], tab: "config" },
        { name: "sliderConfig.showTooltip", type: "switch", label: "Show tooltip", tab: "config" },
        { name: "sliderConfig.showValue", type: "switch", label: "Show current value", tab: "config" },
      ] : []),
      
      ...(needsNumberConfig ? [
        { name: "numberConfig.min", type: "number", label: "Minimum Value", tab: "config" },
        { name: "numberConfig.max", type: "number", label: "Maximum Value", tab: "config" },
        { name: "numberConfig.step", type: "number", label: "Step", tab: "config" },
        { name: "numberConfig.precision", type: "number", label: "Precision (Decimal Places)", tab: "config" },
        { name: "numberConfig.allowNegative", type: "switch", label: "Allow negative numbers", tab: "config" },
        { name: "numberConfig.showSpinButtons", type: "switch", label: "Show spin buttons", tab: "config" },
      ] : []),
      
      ...(needsDateConfig ? [
        { name: "dateConfig.minDate", type: "date", label: "Minimum Date", tab: "config" },
        { name: "dateConfig.maxDate", type: "date", label: "Maximum Date", tab: "config" },
        { name: "dateConfig.format", type: "select", label: "Date Format", options: [
          { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
          { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
          { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
          { value: "MMM dd, yyyy", label: "MMM DD, YYYY" }
        ], tab: "config" },
        { name: "dateConfig.disablePast", type: "switch", label: "Disable past dates", tab: "config" },
        { name: "dateConfig.disableFuture", type: "switch", label: "Disable future dates", tab: "config" },
        { name: "dateConfig.disableWeekends", type: "switch", label: "Disable weekends", tab: "config" },
      ] : []),
      
      ...(needsMultiSelectConfig ? [
        { name: "multiSelectConfig.placeholder", type: "text", label: "Placeholder", placeholder: "Select options...", tab: "config" },
        { name: "multiSelectConfig.maxSelections", type: "number", label: "Max Selections", tab: "config" },
        { name: "multiSelectConfig.searchable", type: "switch", label: "Enable search", tab: "config" },
        { name: "multiSelectConfig.creatable", type: "switch", label: "Allow creating new options", tab: "config" },
      ] : []),
      
      ...(needsRatingConfig ? [
        { name: "ratingConfig.max", type: "number", label: "Maximum Rating", tab: "config" },
        { name: "ratingConfig.allowHalf", type: "switch", label: "Allow half ratings", tab: "config" },
        { name: "ratingConfig.showValue", type: "switch", label: "Show rating value", tab: "config" },
        { name: "ratingConfig.icon", type: "select", label: "Icon Style", options: [
          { value: "star", label: "⭐ Star" },
          { value: "heart", label: "❤️ Heart" },
          { value: "thumb", label: "👍 Thumb" },
          { value: "circle", label: "⚫ Circle" }
        ], tab: "config" },
      ] : []),
      
      ...(needsPhoneConfig ? [
        { name: "phoneConfig.defaultCountry", type: "text", label: "Default Country Code", placeholder: "US", tab: "config" },
        { name: "phoneConfig.format", type: "radio", label: "Phone Format", options: [
          { value: "national", label: "National (123) 456-7890" },
          { value: "international", label: "International +1 123 456 7890" }
        ], tab: "config" },
        { name: "phoneConfig.placeholder", type: "text", label: "Placeholder", placeholder: "Enter phone number", tab: "config" },
      ] : []),
      
      ...(needsColorConfig ? [
        { name: "colorConfig.format", type: "select", label: "Color Format", options: [
          { value: "hex", label: "HEX (#ffffff)" },
          { value: "rgb", label: "RGB (255, 255, 255)" },
          { value: "hsl", label: "HSL (0, 0%, 100%)" }
        ], tab: "config" },
        { name: "colorConfig.presets", type: "array", label: "Color Presets", tab: "config" },
      ] : []),
      
      ...(needsFileConfig ? [
        { name: "fileConfig.accept", type: "text", label: "Accepted File Types", placeholder: ".pdf,.doc,.docx,image/*", tab: "config" },
        { name: "fileConfig.multiple", type: "switch", label: "Allow multiple files", tab: "config" },
        { name: "fileConfig.maxSize", type: "number", label: "Max File Size (MB)", tab: "config" },
        { name: "fileConfig.maxFiles", type: "number", label: "Max Number of Files", tab: "config" },
      ] : []),
      
      ...(needsTextareaConfig ? [
        { name: "textareaConfig.rows", type: "number", label: "Rows", tab: "config" },
        { name: "textareaConfig.cols", type: "number", label: "Columns", tab: "config" },
        { name: "textareaConfig.resize", type: "select", label: "Resize Behavior", options: [
          { value: "none", label: "No resize" },
          { value: "vertical", label: "Vertical only" },
          { value: "horizontal", label: "Horizontal only" },
          { value: "both", label: "Both directions" }
        ], tab: "config" },
        { name: "textareaConfig.maxLength", type: "number", label: "Maximum Length", tab: "config" },
        { name: "textareaConfig.showWordCount", type: "switch", label: "Show word count", tab: "config" },
      ] : []),
      
      ...(needsPasswordConfig ? [
        { name: "passwordConfig.showToggle", type: "switch", label: "Show/hide toggle button", tab: "config" },
        { name: "passwordConfig.strengthMeter", type: "switch", label: "Show strength meter", tab: "config" },
        { name: "passwordConfig.minStrength", type: "number", label: "Minimum Strength (1-4)", tab: "config" },
        { name: "passwordConfig.minLength", type: "number", label: "Minimum Length", tab: "config" },
        { name: "passwordConfig.requireUppercase", type: "switch", label: "Require uppercase letters", tab: "config" },
        { name: "passwordConfig.requireLowercase", type: "switch", label: "Require lowercase letters", tab: "config" },
        { name: "passwordConfig.requireNumbers", type: "switch", label: "Require numbers", tab: "config" },
        { name: "passwordConfig.requireSymbols", type: "switch", label: "Require symbols", tab: "config" },
      ] : []),
      
      ...(needsEmailConfig ? [
        { name: "emailConfig.allowedDomains", type: "text", label: "Allowed Domains (comma-separated)", placeholder: "gmail.com, company.com", tab: "config" },
        { name: "emailConfig.blockedDomains", type: "text", label: "Blocked Domains (comma-separated)", placeholder: "tempmail.com, throwaway.email", tab: "config" },
        { name: "emailConfig.suggestions", type: "text", label: "Domain Suggestions (comma-separated)", placeholder: "gmail.com, yahoo.com, outlook.com", tab: "config" },
        { name: "emailConfig.validateMX", type: "switch", label: "Validate MX records", tab: "config" },
      ] : []),
      
      // HELP TAB
      { name: "helpText", type: "textarea", label: "Help Text", placeholder: "Additional help text for users", tab: "help" },
      { name: "helpTooltip", type: "text", label: "Tooltip", placeholder: "Short tooltip text", tab: "help" },
      { name: "helpPosition", type: "select", label: "Help Position", options: [
        { value: "top", label: "Top" },
        { value: "bottom", label: "Bottom" },
        { value: "left", label: "Left" },
        { value: "right", label: "Right" }
      ], tab: "help" },
      { name: "helpLinkUrl", type: "text", label: "Help Link URL", placeholder: "https://example.com/help", tab: "help" },
      { name: "helpLinkText", type: "text", label: "Help Link Text", placeholder: "Learn more", tab: "help" },
      
      // SECTION TAB
      { name: "sectionTitle", type: "text", label: "Section Title", placeholder: "Section title", tab: "section" },
      { name: "sectionDescription", type: "textarea", label: "Section Description", placeholder: "Section description", tab: "section" },
      { name: "sectionCollapsible", type: "switch", label: "Collapsible section", tab: "section" },
      { name: "sectionDefaultExpanded", type: "switch", label: "Expanded by default", tab: "section" },
      
      // VALIDATION TAB
      { name: "inlineValidationEnabled", type: "switch", label: "Enable inline validation", tab: "validation" },
      { name: "inlineValidationDebounceMs", type: "number", label: "Debounce (ms)", tab: "validation" },
      { name: "inlineValidationShowSuccess", type: "switch", label: "Show success indicator", tab: "validation" },
      
      { name: "validationMinLength", type: "number", label: "Minimum Length", tab: "validation" },
      { name: "validationMaxLength", type: "number", label: "Maximum Length", tab: "validation" },
      { name: "validationMin", type: "number", label: "Minimum Value", tab: "validation" },
      { name: "validationMax", type: "number", label: "Maximum Value", tab: "validation" },
      { name: "validationPattern", type: "text", label: "Pattern (Regex)", placeholder: "e.g., ^[A-Za-z]+$", tab: "validation" },
      { name: "validationIncludes", type: "text", label: "Must Include", tab: "validation" },
      { name: "validationStartsWith", type: "text", label: "Must Start With", tab: "validation" },
      { name: "validationEndsWith", type: "text", label: "Must End With", tab: "validation" },
      { name: "validationEmail", type: "switch", label: "Validate email format", tab: "validation" },
      { name: "validationUrl", type: "switch", label: "URL format", tab: "validation" },
      { name: "validationUuid", type: "switch", label: "UUID format", tab: "validation" },
      { name: "validationCustom", type: "textarea", label: "Custom Validation Message", tab: "validation" },
    ],
    
    // TABS CONFIGURATION
    tabs: [
      { id: "basic", label: "Basic" },
      ...(needsOptions ? [{ id: "options", label: "Options" }] : []),
      ...(needsSliderConfig || needsNumberConfig || needsDateConfig || needsMultiSelectConfig || needsRatingConfig || needsPhoneConfig || needsColorConfig || needsFileConfig || needsTextareaConfig || needsPasswordConfig || needsEmailConfig ? [{ id: "config", label: "Config" }] : []),
      { id: "help", label: "Help" },
      { id: "section", label: "Section" },
      { id: "validation", label: "Validation" },
    ],
    
    formOptions: {
      defaultValues: {
        label: initialField.label || "",
        name: initialField.name || "",
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
      
      // DIRECT STORE UPDATE - NO PARENT RE-RENDERS!
      onChange: ({ value }: { value: any }) => {
        // console.log('=== FIELD CONFIGURATOR CHANGE ===');
        // console.log('Field ID:', fieldId);
        // console.log('Current field page:', currentFieldRef.current.page);
        // console.log('Form value page:', value.page);
        
        // Preserve original page if form value is empty/undefined
        const finalPage = value.page || currentFieldRef.current.page || 1;
        // console.log('Will update to page:', finalPage);
        
        const updatedField: FormField = {
          ...currentFieldRef.current,
          label: value.label,
          name: value.name,
          placeholder: value.placeholder,
          description: value.description,
          page: finalPage,
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
            allowedDomains: value.emailConfig.allowedDomains ? value.emailConfig.allowedDomains.split(',').map((d: string) => d.trim()).filter(Boolean) : undefined,
            blockedDomains: value.emailConfig.blockedDomains ? value.emailConfig.blockedDomains.split(',').map((d: string) => d.trim()).filter(Boolean) : undefined,
            suggestions: value.emailConfig.suggestions ? value.emailConfig.suggestions.split(',').map((d: string) => d.trim()).filter(Boolean) : undefined,
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
        
        // UPDATE FIELD STORE AND NOTIFY SUBSCRIBERS
        currentFieldRef.current = updatedField;
        globalFieldStore.updateField(fieldId, updatedField);
        
        // Notify field update subscribers immediately
        globalFieldStore.notifyFieldUpdate(fieldId, updatedField);
      },
    },
    
    // NO SUBMIT BUTTON!
    showSubmitButton: false,
  });

  // Reset form values when field changes
  React.useEffect(() => {
    configForm.form.reset();
  }, [fieldId, configForm.form]);

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4">
        <h3 className="font-semibold text-lg">Configure Field</h3>
        <p className="text-sm text-muted-foreground">
          Configure the properties for this {initialField.type} field
        </p>
      </div>

      {/* SINGLE FORMEDIBLE FORM WITH TABS - NO RE-RENDERS! */}
      <configForm.Form />
    </div>
  );
};