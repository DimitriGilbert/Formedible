"use client";

/**
 * Parser Configuration Schema for Settings UI
 *
 * This file provides a formedible-compatible schema for configuring
 * parser settings through a UI form. It includes types and field
 * configurations for all parser options.
 */

// Note: In actual usage, this would import from 'zod', but for standalone
// compatibility, we define the schema structure that can be used with zod

/**
 * Parser configuration options
 */
export interface ParserConfig {
  strictValidation: boolean;
  enableSchemaInference: boolean;
  mergeStrategy: "extend" | "override" | "intersect";
  fieldTypeValidation: boolean;
  customInstructions?: string;
  maxCodeLength: number;
  maxNestingDepth: number;
  enableZodParsing: boolean;
  showDetailedErrors: boolean;
  selectFields: boolean;
  systemPromptFields: string[];
  includeTabFormatting: boolean;
  includePageFormatting: boolean;
  [key: string]: unknown;
}

/**
 * Zod schema definition structure (for use with actual zod when available)
 * This represents what the schema would look like when used with zod
 */
export const parserConfigSchemaDefinition = {
  strictValidation: {
    type: "boolean",
    default: true,
    description: "Enable strict validation of form definitions",
  },
  enableSchemaInference: {
    type: "boolean",
    default: false,
    description: "Automatically infer Zod schemas from field definitions",
  },
  mergeStrategy: {
    type: "enum",
    values: ["extend", "override", "intersect"],
    default: "extend",
    description: "Strategy for merging with base schemas",
  },
  fieldTypeValidation: {
    type: "boolean",
    default: true,
    description: "Validate field types against supported types",
  },
  customInstructions: {
    type: "string",
    optional: true,
    description: "Custom parsing instructions or constraints",
  },
  maxCodeLength: {
    type: "number",
    default: 1000000,
    min: 1000,
    max: 10000000,
    description: "Maximum allowed code length in characters",
  },
  maxNestingDepth: {
    type: "number",
    default: 50,
    min: 5,
    max: 200,
    description: "Maximum nesting depth for object structures",
  },
  enableZodParsing: {
    type: "boolean",
    default: true,
    description: "Enable parsing of Zod schema expressions",
  },
  showDetailedErrors: {
    type: "boolean",
    default: true,
    description: "Show detailed error information in parser output",
  },
};

/**
 * Default parser configuration
 */
export const defaultParserConfig: ParserConfig = {
  strictValidation: true,
  enableSchemaInference: false,
  mergeStrategy: "extend",
  fieldTypeValidation: true,
  customInstructions: undefined,
  maxCodeLength: 1000000,
  maxNestingDepth: 50,
  enableZodParsing: true,
  showDetailedErrors: true,
  selectFields: false,
  // Default to the set of formedible field types used as examples in the UI
  systemPromptFields: [
    "text",
    "email",
    "url",
    "textarea",
    "number",
    "select",
    "multiSelect",
    "radio",
    "checkbox",
    "switch",
    "date",
    "file",
    "slider",
    "rating",
    "phone",
    "colorPicker",
    "password",
    "duration",
    "autocomplete",
    "maskedInput",
    "array",
    "object",
  ],
  includeTabFormatting: true,
  includePageFormatting: true,
};

/**
 * Type-safe field examples for each field type - aligned with formedible documentation
 */
const fieldExamples = {
  text: { name: "fullName", type: "text", label: "Full Name", required: true },
  email: {
    name: "email",
    type: "email",
    label: "Email Address",
    required: true,
  },
  url: { name: "website", type: "url", label: "Website URL" },
  textarea: {
    name: "message",
    type: "textarea",
    label: "Message",
    textareaConfig: { rows: 4, maxLength: 500, showWordCount: true },
  },
  number: {
    name: "age",
    type: "number",
    label: "Age",
    numberConfig: { min: 18, max: 120, allowNegative: false },
  },
  select: {
    name: "country",
    type: "select",
    label: "Country",
    options: [
      { value: "us", label: "United States" },
      { value: "uk", label: "United Kingdom" },
      { value: "ca", label: "Canada" },
    ],
  },
  multiSelect: {
    name: "skills",
    type: "multiSelect",
    label: "Skills",
    options: ["React", "Vue", "Angular", "Node.js"],
    multiSelectConfig: { maxSelections: 3, searchable: true, creatable: true },
  },
  radio: {
    name: "plan",
    type: "radio",
    label: "Plan",
    options: [
      { value: "free", label: "Free Plan" },
      { value: "pro", label: "Pro Plan" },
      { value: "enterprise", label: "Enterprise Plan" },
    ],
  },
  checkbox: {
    name: "newsletter",
    type: "checkbox",
    label: "Subscribe to Newsletter",
  },
  switch: {
    name: "notifications",
    type: "switch",
    label: "Enable Notifications",
  },
  date: {
    name: "birthDate",
    type: "date",
    label: "Birth Date",
    dateConfig: { format: "yyyy-MM-dd", showTime: false },
  },
  file: {
    name: "resume",
    type: "file",
    label: "Resume",
    fileConfig: {
      accept: ".pdf,.doc,.docx",
      maxSize: 5000000,
      multiple: false,
    },
  },
  slider: {
    name: "experience",
    type: "slider",
    label: "Years Experience",
    sliderConfig: { min: 0, max: 20, step: 1 },
  },
  rating: {
    name: "satisfaction",
    type: "rating",
    label: "Satisfaction Rating",
    ratingConfig: { max: 5, allowHalf: true, icon: "star" },
  },
  phone: {
    name: "phone",
    type: "phone",
    label: "Phone Number",
    phoneConfig: { defaultCountry: "US", format: "national" },
  },
  colorPicker: {
    name: "brandColor",
    type: "colorPicker",
    label: "Brand Color",
    colorConfig: {
      format: "hex",
      presetColors: ["#ff0000", "#00ff00", "#0000ff"],
      allowCustom: true,
    },
  },
  password: {
    name: "password",
    type: "password",
    label: "Password",
    passwordConfig: { showToggle: true, strengthMeter: true },
  },
  duration: {
    name: "workHours",
    type: "duration",
    label: "Work Hours",
    durationConfig: { format: "hm", showLabels: true },
  },
  autocomplete: {
    name: "city",
    type: "autocomplete",
    label: "City",
    autocompleteConfig: {
      options: ["New York", "Los Angeles", "Chicago", "Houston"],
      minChars: 2,
      allowCustom: true,
    },
  },
  maskedInput: {
    name: "ssn",
    type: "maskedInput",
    label: "SSN",
    maskedInputConfig: { mask: "000-00-0000", guide: true },
  },
  array: {
    name: "team",
    type: "array",
    label: "Team Members",
    arrayConfig: {
      itemType: "object",
      itemLabel: "Team Member",
      minItems: 1,
      maxItems: 10,
      sortable: true,
      addButtonLabel: "Add Member",
      removeButtonLabel: "Remove",
      objectConfig: {
        fields: [
          { name: "name", type: "text", label: "Full Name", required: true },
          {
            name: "role",
            type: "select",
            label: "Role",
            options: ["Developer", "Designer", "Manager"],
          },
          { name: "email", type: "email", label: "Email", required: true },
        ],
      },
    },
  },
  object: {
    name: "address",
    type: "object",
    label: "Address",
    objectConfig: {
      title: "Mailing Address",
      collapsible: true,
      layout: "vertical",
      fields: [
        {
          name: "street",
          type: "text",
          label: "Street Address",
          required: true,
        },
        { name: "city", type: "text", label: "City", required: true },
        {
          name: "state",
          type: "select",
          label: "State",
          options: ["CA", "NY", "TX", "FL"],
        },
        { name: "zip", type: "text", label: "ZIP Code", required: true },
      ],
    },
  },
} as const;

/**
 * Formedible field configurations for the parser settings UI
 * These can be used to generate a settings form using formedible
 */
export const parserConfigFields = [
  {
    name: "strictValidation",
    type: "switch",
    label: "Strict Validation",
    description:
      "Enable strict validation of form definitions. When enabled, unknown properties are rejected.",
    defaultValue: true,
  },
  {
    name: "enableSchemaInference",
    type: "switch",
    label: "Schema Inference",
    description:
      "Automatically infer Zod schemas from field definitions to provide better type safety.",
    defaultValue: false,
  },
  {
    name: "mergeStrategy",
    type: "select",
    label: "Schema Merge Strategy",
    description: "How to merge parsed configurations with base schemas.",
    defaultValue: "extend",
    options: [
      {
        value: "extend",
        label: "Extend - Add missing fields from base schema",
      },
      { value: "override", label: "Override - Replace schema completely" },
      { value: "intersect", label: "Intersect - Keep only common fields" },
    ],
  },
  {
    name: "fieldTypeValidation",
    type: "switch",
    label: "Field Type Validation",
    description:
      "Validate field types against the list of supported field types.",
    defaultValue: true,
  },
  {
    name: "customInstructions",
    type: "textarea",
    label: "Custom Instructions",
    description:
      "Optional custom parsing instructions or constraints to apply.",
    placeholder: "Enter any custom parsing rules or requirements...",
    required: false,
  },
  {
    name: "maxCodeLength",
    type: "number",
    label: "Maximum Code Length",
    description:
      "Maximum allowed length for form definition code (in characters).",
    defaultValue: 1000000,
    min: 1000,
    max: 10000000,
    step: 1000,
  },
  {
    name: "maxNestingDepth",
    type: "number",
    label: "Maximum Nesting Depth",
    description:
      "Maximum allowed nesting depth for object and array structures.",
    defaultValue: 50,
    min: 5,
    max: 200,
    step: 5,
  },
  {
    name: "enableZodParsing",
    type: "switch",
    label: "Zod Expression Parsing",
    description:
      "Enable parsing and handling of Zod schema expressions in form definitions.",
    defaultValue: true,
  },
  {
    name: "showDetailedErrors",
    type: "switch",
    label: "Detailed Error Information",
    description:
      "Include detailed error context and location information in parser output.",
    defaultValue: true,
  },
  {
    name: "selectFields",
    type: "switch",
    label: "Select Fields",
    defaultValue: false,
  },
  {
    name: "systemPromptFields",
    type: "multiSelect",
    label: "Field Types",
    description:
      "Select which formedible field types to include as examples in the system prompt.",
    options: Object.keys(fieldExamples).map((fieldType) => ({
      value: fieldType,
      label: fieldType.charAt(0).toUpperCase() + fieldType.slice(1),
    })),
    defaultValue: Object.keys(fieldExamples),
  },
  {
    name: "includeTabFormatting",
    type: "switch",
    label: "Tab Formatting",
    description: "Include tab-based form structure in the system prompt.",
    defaultValue: true,
  },
  {
    name: "includePageFormatting",
    type: "switch",
    label: "Page Formatting",
    description: "Include multi-page form structure in the system prompt.",
    defaultValue: true,
  },
];

/**
 * Parser configuration form definition
 * Complete formedible form configuration for parser settings
 */
export const parserConfigFormDefinition = {
  title: "Parser Configuration",
  description: "Configure how the Formedible parser processes form definitions",
  fields: parserConfigFields,
  submitLabel: "Save Configuration",
  formOptions: {
    defaultValues: defaultParserConfig,
  },
};

/**
 * Helper function to validate parser configuration
 */
export function validateParserConfig(config: unknown): config is ParserConfig {
  if (!config || typeof config !== "object") {
    return false;
  }

  const c = config as Record<string, unknown>;

  return (
    typeof c.strictValidation === "boolean" &&
    typeof c.enableSchemaInference === "boolean" &&
    (c.mergeStrategy === "extend" ||
      c.mergeStrategy === "override" ||
      c.mergeStrategy === "intersect") &&
    typeof c.fieldTypeValidation === "boolean" &&
    (c.customInstructions === undefined ||
      typeof c.customInstructions === "string") &&
    typeof c.maxCodeLength === "number" &&
    typeof c.maxNestingDepth === "number" &&
    typeof c.enableZodParsing === "boolean" &&
    typeof c.showDetailedErrors === "boolean" &&
    typeof c.selectFields === "boolean" &&
    Array.isArray(c.systemPromptFields) &&
    c.systemPromptFields.every((field) => typeof field === "string") &&
    typeof c.includeTabFormatting === "boolean" &&
    typeof c.includePageFormatting === "boolean"
  );
}

/**
 * Helper function to merge parser configuration with defaults
 */
export function mergeParserConfig(config: Partial<ParserConfig>): ParserConfig {
  return {
    ...defaultParserConfig,
    ...config,
  };
}

/**
 * Generate a dynamic system prompt based on selected configuration fields
 */
export function generateSystemPrompt(config: ParserConfig): string {
  const fieldDescriptions: Record<string, string> = {
    strictValidation: config.strictValidation
      ? "Use strict validation - reject unknown properties and enforce schema compliance"
      : "Use permissive validation - allow unknown properties and be flexible with schema",
    fieldTypeValidation: config.fieldTypeValidation
      ? "Validate all field types against the 24 supported formedible field types"
      : "Allow flexible field types without strict validation",
    enableSchemaInference: config.enableSchemaInference
      ? "Automatically infer Zod schemas from field definitions for better type safety"
      : "Use manual schema definition without automatic inference",
    mergeStrategy: `Use "${
      config.mergeStrategy
    }" strategy when merging schemas - ${
      config.mergeStrategy === "extend"
        ? "add missing fields from base schema"
        : config.mergeStrategy === "override"
        ? "replace schema completely"
        : "keep only fields that exist in both schemas"
    }`,
    maxCodeLength: `Maximum allowed form definition length: ${config.maxCodeLength.toLocaleString()} characters`,
    maxNestingDepth: `Maximum nesting depth for object and array structures: ${config.maxNestingDepth} levels`,
    enableZodParsing: config.enableZodParsing
      ? "Parse and handle Zod schema expressions (z.string(), z.number(), etc.)"
      : "Treat Zod expressions as plain text without parsing",
    showDetailedErrors: config.showDetailedErrors
      ? "Include detailed error context, location information, and debugging details"
      : "Provide minimal error information",
    ...(config.customInstructions
      ? {
          customInstructions: `Additional instructions: ${config.customInstructions}`,
        }
      : {}),
  };

  const selectedConfigFields = Object.entries(fieldDescriptions)
    .filter(([_key, desc]) => Boolean(desc))
    .map(([_key, desc]) => desc);

  if (
    !selectedConfigFields.length &&
    !config.includeTabFormatting &&
    !config.includePageFormatting
  ) {
    return "";
  }

  let prompt = `# Formedible Parser Configuration

You are working with a Formedible form parser that has been configured with the following settings:

${selectedConfigFields.map((desc, index) => `${index + 1}. ${desc}`).join("\n")}

## Key Guidelines
- Follow the configured validation and parsing rules strictly
- Generate forms that respect the maximum limits and nesting depth
- Use the specified error message style and detail level
- Apply the configured schema inference and merging strategies

## CRITICAL: Output Format Requirements
- Generate CONFIGURATION OBJECTS for formedible, NOT executable code
- Use this format: { fields: [...], formOptions: { defaultValues: {...} }, ... }
- DO NOT include function implementations in onSubmit - use placeholder comments
- DO NOT include validation strings like "z.string()" - use validation property objects
- The parser expects a configuration object that will be passed to useFormedible hook`;

  // Add formatting guidelines
  if (config.includeTabFormatting || config.includePageFormatting) {
    prompt += `

## Form Structure Guidelines`;

    if (config.includeTabFormatting) {
      prompt += `
- **Tab Layout**: Use the \`layout: { type: 'tabs' }\` configuration for organizing forms into logical sections
- **Tab Structure**: Each tab should group related fields together for better user experience
- **Tab Navigation**: Ensure tab titles are descriptive and help users understand the content`;
    }

    if (config.includePageFormatting) {
      prompt += `
- **Multi-Page Forms**: Use the \`pages\` array to create multi-step forms for complex data collection
- **Page Structure**: Each page should have a clear purpose and logical flow
- **Page Navigation**: Include appropriate navigation controls with \`nextLabel\`, \`previousLabel\`, and \`submitLabel\`
- **Progress Indication**: Consider adding progress indicators for multi-page forms using the \`progress\` configuration`;
    }
  }

  // Create a comprehensive, realistic form example
  let basicExample: any = {
    title: "User Registration Form",
    description: "Complete user registration with validation",
    fields: [
      {
        name: "fullName",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
        validation: "z.string().min(2, 'Name must be at least 2 characters')"
      },
      {
        name: "email",
        type: "email", 
        label: "Email Address",
        placeholder: "your@email.com",
        required: true,
        validation: "z.string().email('Please enter a valid email address')"
      },
      {
        name: "password",
        type: "password",
        label: "Password",
        required: true,
        passwordConfig: { showToggle: true, strengthMeter: true },
        validation: "z.string().min(8, 'Password must be at least 8 characters')"
      },
      {
        name: "age",
        type: "number",
        label: "Age",
        required: true,
        numberConfig: { min: 18, max: 120, allowNegative: false },
        validation: "z.number().min(18, 'Must be at least 18 years old').max(120)"
      },
      {
        name: "country",
        type: "select",
        label: "Country",
        required: true,
        options: [
          { value: "us", label: "United States" },
          { value: "uk", label: "United Kingdom" },
          { value: "ca", label: "Canada" },
          { value: "au", label: "Australia" }
        ],
        validation: "z.enum(['us', 'uk', 'ca', 'au'])"
      },
      {
        name: "newsletter",
        type: "checkbox",
        label: "Subscribe to Newsletter",
        description: "Receive updates about new features and promotions"
      }
    ],
    schema: "z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(8), age: z.number().min(18).max(120), country: z.enum(['us', 'uk', 'ca', 'au']), newsletter: z.boolean().optional() })",
    formOptions: {
      defaultValues: {
        fullName: "",
        email: "",
        password: "",
        age: 18,
        country: "",
        newsletter: false
      },
      onSubmit: "async ({ value }) => { console.log('Registration data:', value); await submitRegistration(value); }",
      onSubmitInvalid: "({ errors }) => { console.log('Validation errors:', errors); }"
    },
    submitLabel: "Create Account",
    layout: {
      type: "grid",
      columns: 2,
      gap: "md"
    }
  };

  if (config.includeTabFormatting && config.includePageFormatting) {
    // Both tabs and pages - comprehensive multi-step form with tabs
    basicExample = {
      title: "Complete Profile Setup",
      description: "Multi-step registration with organized sections",
      layout: { type: "stepper" },
      pages: [
        { title: "Personal Information", description: "Basic details about you" },
        { title: "Account Preferences", description: "Customize your experience" },
        { title: "Review & Submit", description: "Confirm your information" }
      ],
      tabs: [
        { id: "basic", label: "Basic Info", description: "Name and contact" },
        { id: "address", label: "Address", description: "Location details" },
        { id: "settings", label: "Settings", description: "Account preferences" }
      ],
      fields: [
        {
          name: "firstName",
          type: "text",
          label: "First Name",
          required: true,
          page: 1,
          tab: "basic",
          validation: "z.string().min(1, 'First name is required')"
        },
        {
          name: "lastName", 
          type: "text",
          label: "Last Name",
          required: true,
          page: 1,
          tab: "basic",
          validation: "z.string().min(1, 'Last name is required')"
        },
        {
          name: "email",
          type: "email",
          label: "Email",
          required: true,
          page: 1,
          tab: "basic",
          validation: "z.string().email('Invalid email address')"
        },
        {
          name: "address",
          type: "object",
          label: "Address",
          page: 1,
          tab: "address",
          objectConfig: {
            title: "Mailing Address",
            fields: [
              { name: "street", type: "text", label: "Street Address", required: true },
              { name: "city", type: "text", label: "City", required: true },
              { name: "zipCode", type: "text", label: "ZIP Code", required: true }
            ]
          }
        },
        {
          name: "notifications",
          type: "switch",
          label: "Email Notifications",
          page: 2,
          tab: "settings"
        },
        {
          name: "theme",
          type: "select",
          label: "Preferred Theme",
          page: 2,
          tab: "settings",
          options: [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "auto", label: "Auto" }
          ]
        }
      ],
      schema: "z.object({ firstName: z.string().min(1), lastName: z.string().min(1), email: z.string().email(), address: z.object({ street: z.string(), city: z.string(), zipCode: z.string() }), notifications: z.boolean().optional(), theme: z.enum(['light', 'dark', 'auto']).optional() })",
      formOptions: {
        defaultValues: {
          firstName: "",
          lastName: "",
          email: "",
          address: { street: "", city: "", zipCode: "" },
          notifications: true,
          theme: "auto"
        },
        onSubmit: "async ({ value }) => { console.log('Profile setup complete:', value); await saveProfile(value); }"
      },
      nextLabel: "Continue",
      previousLabel: "Back",
      submitLabel: "Complete Setup"
    };
  } else if (config.includeTabFormatting) {
    // Tab-based form with organized sections
    basicExample = {
      title: "Project Application Form",
      description: "Comprehensive application with tabbed organization",
      layout: { type: "tabs" },
      tabs: [
        { id: "personal", label: "Personal Info", description: "Your basic information" },
        { id: "project", label: "Project Details", description: "About your project" },
        { id: "experience", label: "Experience", description: "Your background" }
      ],
      fields: [
        {
          name: "fullName",
          type: "text",
          label: "Full Name",
          required: true,
          tab: "personal",
          validation: "z.string().min(2, 'Name must be at least 2 characters')"
        },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          required: true,
          tab: "personal",
          validation: "z.string().email('Please enter a valid email')"
        },
        {
          name: "phone",
          type: "phone",
          label: "Phone Number",
          tab: "personal",
          phoneConfig: { defaultCountry: "US", format: "national" }
        },
        {
          name: "projectTitle",
          type: "text",
          label: "Project Title",
          required: true,
          tab: "project",
          validation: "z.string().min(5, 'Project title must be at least 5 characters')"
        },
        {
          name: "projectDescription",
          type: "textarea",
          label: "Project Description",
          required: true,
          tab: "project",
          textareaConfig: { rows: 6, maxLength: 1000, showWordCount: true },
          validation: "z.string().min(50, 'Description must be at least 50 characters')"
        },
        {
          name: "budget",
          type: "select",
          label: "Budget Range",
          required: true,
          tab: "project",
          options: [
            { value: "under-5k", label: "Under $5,000" },
            { value: "5k-15k", label: "$5,000 - $15,000" },
            { value: "15k-50k", label: "$15,000 - $50,000" },
            { value: "over-50k", label: "Over $50,000" }
          ]
        },
        {
          name: "yearsExperience",
          type: "slider",
          label: "Years of Experience",
          tab: "experience",
          sliderConfig: { min: 0, max: 30, step: 1 }
        },
        {
          name: "skills",
          type: "multiSelect",
          label: "Skills",
          tab: "experience",
          options: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Design"],
          multiSelectConfig: { maxSelections: 5, searchable: true }
        }
      ],
      schema: "z.object({ fullName: z.string().min(2), email: z.string().email(), phone: z.string().optional(), projectTitle: z.string().min(5), projectDescription: z.string().min(50), budget: z.enum(['under-5k', '5k-15k', '15k-50k', 'over-50k']), yearsExperience: z.number().min(0).max(30).optional(), skills: z.array(z.string()).optional() })",
      formOptions: {
        defaultValues: {
          fullName: "",
          email: "",
          phone: "",
          projectTitle: "",
          projectDescription: "",
          budget: "",
          yearsExperience: 0,
          skills: []
        },
        onSubmit: "async ({ value }) => { console.log('Application submitted:', value); await submitApplication(value); }"
      },
      submitLabel: "Submit Application"
    };
  } else if (config.includePageFormatting) {
    // Multi-page form with step-by-step progression
    basicExample = {
      title: "Customer Onboarding",
      description: "Complete your account setup in simple steps",
      layout: { type: "stepper" },
      pages: [
        { title: "Account Details", description: "Create your account credentials" },
        { title: "Personal Information", description: "Tell us about yourself" },
        { title: "Preferences", description: "Customize your experience" },
        { title: "Confirmation", description: "Review and confirm your information" }
      ],
      fields: [
        {
          name: "username",
          type: "text",
          label: "Username",
          required: true,
          page: 1,
          placeholder: "Choose a unique username",
          validation: "z.string().min(3, 'Username must be at least 3 characters')"
        },
        {
          name: "email",
          type: "email",
          label: "Email Address",
          required: true,
          page: 1,
          validation: "z.string().email('Please enter a valid email address')"
        },
        {
          name: "password",
          type: "password",
          label: "Password",
          required: true,
          page: 1,
          passwordConfig: { showToggle: true, strengthMeter: true },
          validation: "z.string().min(8, 'Password must be at least 8 characters')"
        },
        {
          name: "firstName",
          type: "text",
          label: "First Name",
          required: true,
          page: 2,
          validation: "z.string().min(1, 'First name is required')"
        },
        {
          name: "lastName",
          type: "text",
          label: "Last Name",
          required: true,
          page: 2,
          validation: "z.string().min(1, 'Last name is required')"
        },
        {
          name: "birthDate",
          type: "date",
          label: "Date of Birth",
          page: 2,
          dateConfig: { format: "yyyy-MM-dd", showTime: false }
        },
        {
          name: "company",
          type: "text",
          label: "Company (Optional)",
          page: 2
        },
        {
          name: "notifications",
          type: "switch",
          label: "Email Notifications",
          description: "Receive product updates and newsletters",
          page: 3
        },
        {
          name: "language",
          type: "select",
          label: "Preferred Language",
          page: 3,
          options: [
            { value: "en", label: "English" },
            { value: "es", label: "Spanish" },
            { value: "fr", label: "French" },
            { value: "de", label: "German" }
          ],
          validation: "z.enum(['en', 'es', 'fr', 'de'])"
        },
        {
          name: "interests",
          type: "multiSelect",
          label: "Interests",
          page: 3,
          options: ["Technology", "Design", "Marketing", "Sales", "Finance", "Education"],
          multiSelectConfig: { maxSelections: 3, searchable: true }
        }
      ],
      schema: "z.object({ username: z.string().min(3), email: z.string().email(), password: z.string().min(8), firstName: z.string().min(1), lastName: z.string().min(1), birthDate: z.date().optional(), company: z.string().optional(), notifications: z.boolean().optional(), language: z.enum(['en', 'es', 'fr', 'de']).optional(), interests: z.array(z.string()).optional() })",
      formOptions: {
        defaultValues: {
          username: "",
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          birthDate: undefined,
          company: "",
          notifications: true,
          language: "en",
          interests: []
        },
        onSubmit: "async ({ value }) => { console.log('Onboarding complete:', value); await completeOnboarding(value); }"
      },
      nextLabel: "Continue",
      previousLabel: "Back",
      submitLabel: "Complete Setup",
      progress: {
        showProgress: true,
        showStepNumbers: true
      }
    };
  }

  // Filter field examples based on selected field types
  const selectedFieldExamples = Object.entries(fieldExamples)
    .filter(([type]) => config.systemPromptFields.includes(type));

  if (selectedFieldExamples.length > 0) {
    prompt += `

## Field Examples

Each field type has a complete example configuration:

### Available Field Types (Selected: ${config.systemPromptFields.join(', ')})
${selectedFieldExamples
  .map(
    ([type, example]) => `**${type}**: \`${JSON.stringify(example, null, 2)}\``
  )
  .join("\n\n")}`;
  } else {
    prompt += `

## Field Examples

No specific field types selected. Use the default formedible field types as needed.`;
  }

  prompt += `

## Complete Form Example

Based on your current configuration:

\`\`\`json
${JSON.stringify(basicExample, null, 2)}
\`\`\`

When generating forms, use these field examples and adapt the structure based on the configuration options above.`;

  return prompt;
}
