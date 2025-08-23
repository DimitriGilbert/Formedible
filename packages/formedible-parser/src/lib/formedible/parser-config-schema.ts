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
  mergeStrategy: 'extend' | 'override' | 'intersect';
  fieldTypeValidation: boolean;
  aiErrorMessages: boolean;
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
    type: 'boolean',
    default: true,
    description: 'Enable strict validation of form definitions'
  },
  enableSchemaInference: {
    type: 'boolean', 
    default: false,
    description: 'Automatically infer Zod schemas from field definitions'
  },
  mergeStrategy: {
    type: 'enum',
    values: ['extend', 'override', 'intersect'],
    default: 'extend',
    description: 'Strategy for merging with base schemas'
  },
  fieldTypeValidation: {
    type: 'boolean',
    default: true,
    description: 'Validate field types against supported types'
  },
  aiErrorMessages: {
    type: 'boolean',
    default: true,
    description: 'Provide AI-friendly error messages with suggestions'
  },
  customInstructions: {
    type: 'string',
    optional: true,
    description: 'Custom parsing instructions or constraints'
  },
  maxCodeLength: {
    type: 'number',
    default: 1000000,
    min: 1000,
    max: 10000000,
    description: 'Maximum allowed code length in characters'
  },
  maxNestingDepth: {
    type: 'number',
    default: 50,
    min: 5,
    max: 200,
    description: 'Maximum nesting depth for object structures'
  },
  enableZodParsing: {
    type: 'boolean',
    default: true,
    description: 'Enable parsing of Zod schema expressions'
  },
  showDetailedErrors: {
    type: 'boolean',
    default: true,
    description: 'Show detailed error information in parser output'
  }
};

/**
 * Default parser configuration
 */
export const defaultParserConfig: ParserConfig = {
  strictValidation: true,
  enableSchemaInference: false,
  mergeStrategy: 'extend',
  fieldTypeValidation: true,
  aiErrorMessages: true,
  customInstructions: undefined,
  maxCodeLength: 1000000,
  maxNestingDepth: 50,
  enableZodParsing: true,
  showDetailedErrors: true,
  selectFields: false,
  systemPromptFields: [
    'strictValidation',
    'fieldTypeValidation', 
    'aiErrorMessages',
    'enableSchemaInference',
    'mergeStrategy',
    'maxCodeLength',
    'maxNestingDepth',
    'enableZodParsing',
    'showDetailedErrors'
  ],
  includeTabFormatting: true,
  includePageFormatting: true
};

/**
 * Type-safe field examples for each field type - aligned with formedible documentation
 */
const fieldExamples = {
  text: { name: "fullName", type: "text", label: "Full Name", required: true },
  email: { name: "email", type: "email", label: "Email Address", required: true },
  url: { name: "website", type: "url", label: "Website URL" },
  textarea: { 
    name: "message", 
    type: "textarea", 
    label: "Message", 
    textareaConfig: { rows: 4, maxLength: 500, showWordCount: true }
  },
  number: { 
    name: "age", 
    type: "number", 
    label: "Age", 
    numberConfig: { min: 18, max: 120, allowNegative: false }
  },
  select: { 
    name: "country", 
    type: "select", 
    label: "Country", 
    options: [
      { value: "us", label: "United States" },
      { value: "uk", label: "United Kingdom" },
      { value: "ca", label: "Canada" }
    ]
  },
  multiSelect: { 
    name: "skills", 
    type: "multiSelect", 
    label: "Skills", 
    options: ["React", "Vue", "Angular", "Node.js"],
    multiSelectConfig: { maxSelections: 3, searchable: true, creatable: true }
  },
  radio: { 
    name: "plan", 
    type: "radio", 
    label: "Plan", 
    options: [
      { value: "free", label: "Free Plan" }, 
      { value: "pro", label: "Pro Plan" },
      { value: "enterprise", label: "Enterprise Plan" }
    ]
  },
  checkbox: { name: "newsletter", type: "checkbox", label: "Subscribe to Newsletter" },
  switch: { name: "notifications", type: "switch", label: "Enable Notifications" },
  date: { 
    name: "birthDate", 
    type: "date", 
    label: "Birth Date", 
    dateConfig: { format: "yyyy-MM-dd", showTime: false }
  },
  file: { 
    name: "resume", 
    type: "file", 
    label: "Resume", 
    fileConfig: { accept: ".pdf,.doc,.docx", maxSize: 5000000, multiple: false }
  },
  slider: { 
    name: "experience", 
    type: "slider", 
    label: "Years Experience", 
    sliderConfig: { min: 0, max: 20, step: 1 }
  },
  rating: { 
    name: "satisfaction", 
    type: "rating", 
    label: "Satisfaction Rating", 
    ratingConfig: { max: 5, allowHalf: true, icon: "star" }
  },
  phone: { 
    name: "phone", 
    type: "phone", 
    label: "Phone Number", 
    phoneConfig: { defaultCountry: "US", format: "national" }
  },
  colorPicker: { 
    name: "brandColor", 
    type: "colorPicker", 
    label: "Brand Color", 
    colorConfig: { 
      format: "hex", 
      presetColors: ["#ff0000", "#00ff00", "#0000ff"],
      allowCustom: true 
    }
  },
  password: {
    name: "password",
    type: "password", 
    label: "Password",
    passwordConfig: { showToggle: true, strengthMeter: true }
  },
  duration: {
    name: "workHours",
    type: "duration",
    label: "Work Hours",
    durationConfig: { format: "hm", showLabels: true }
  },
  autocomplete: {
    name: "city",
    type: "autocomplete",
    label: "City",
    autocompleteConfig: {
      options: ["New York", "Los Angeles", "Chicago", "Houston"],
      minChars: 2,
      allowCustom: true
    }
  },
  maskedInput: {
    name: "ssn",
    type: "maskedInput", 
    label: "SSN",
    maskedInputConfig: { mask: "000-00-0000", guide: true }
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
          { name: "role", type: "select", label: "Role", options: ["Developer", "Designer", "Manager"] },
          { name: "email", type: "email", label: "Email", required: true }
        ]
      }
    }
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
        { name: "street", type: "text", label: "Street Address", required: true },
        { name: "city", type: "text", label: "City", required: true },
        { name: "state", type: "select", label: "State", options: ["CA", "NY", "TX", "FL"] },
        { name: "zip", type: "text", label: "ZIP Code", required: true }
      ]
    }
  }
} as const;

/**
 * Formedible field configurations for the parser settings UI
 * These can be used to generate a settings form using formedible
 */
export const parserConfigFields = [
  {
    name: 'strictValidation',
    type: 'switch',
    label: 'Strict Validation',
    description: 'Enable strict validation of form definitions. When enabled, unknown properties are rejected.',
    defaultValue: true
  },
  {
    name: 'enableSchemaInference',
    type: 'switch',
    label: 'Schema Inference',
    description: 'Automatically infer Zod schemas from field definitions to provide better type safety.',
    defaultValue: false
  },
  {
    name: 'mergeStrategy',
    type: 'select',
    label: 'Schema Merge Strategy',
    description: 'How to merge parsed configurations with base schemas.',
    defaultValue: 'extend',
    options: [
      { value: 'extend', label: 'Extend - Add missing fields from base schema' },
      { value: 'override', label: 'Override - Replace schema completely' },
      { value: 'intersect', label: 'Intersect - Keep only common fields' }
    ]
  },
  {
    name: 'fieldTypeValidation',
    type: 'switch',
    label: 'Field Type Validation',
    description: 'Validate field types against the list of supported field types.',
    defaultValue: true
  },
  {
    name: 'aiErrorMessages',
    type: 'switch',
    label: 'AI-Friendly Error Messages',
    description: 'Generate detailed error messages with suggestions for AI systems.',
    defaultValue: true
  },
  {
    name: 'customInstructions',
    type: 'textarea',
    label: 'Custom Instructions',
    description: 'Optional custom parsing instructions or constraints to apply.',
    placeholder: 'Enter any custom parsing rules or requirements...',
    required: false
  },
  {
    name: 'maxCodeLength',
    type: 'number',
    label: 'Maximum Code Length',
    description: 'Maximum allowed length for form definition code (in characters).',
    defaultValue: 1000000,
    min: 1000,
    max: 10000000,
    step: 1000
  },
  {
    name: 'maxNestingDepth',
    type: 'number',
    label: 'Maximum Nesting Depth',
    description: 'Maximum allowed nesting depth for object and array structures.',
    defaultValue: 50,
    min: 5,
    max: 200,
    step: 5
  },
  {
    name: 'enableZodParsing',
    type: 'switch',
    label: 'Zod Expression Parsing',
    description: 'Enable parsing and handling of Zod schema expressions in form definitions.',
    defaultValue: true
  },
  {
    name: 'showDetailedErrors',
    type: 'switch',
    label: 'Detailed Error Information',
    description: 'Include detailed error context and location information in parser output.',
    defaultValue: true
  },
  {
    name: 'selectFields',
    type: 'switch',
    label: 'Select Fields',
    defaultValue: false
  },
  {
    name: 'systemPromptFields',
    type: 'multiSelect',
    label: 'Field Types',
    description: 'Select which formedible field types to include as examples in the system prompt.',
    options: Object.keys(fieldExamples).map(fieldType => ({
      value: fieldType,
      label: fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
    })),
    defaultValue: Object.keys(fieldExamples)
  },
  {
    name: 'includeTabFormatting',
    type: 'switch',
    label: 'Tab Formatting',
    description: 'Include tab-based form structure in the system prompt.',
    defaultValue: true
  },
  {
    name: 'includePageFormatting',
    type: 'switch',
    label: 'Page Formatting',
    description: 'Include multi-page form structure in the system prompt.',
    defaultValue: true
  }
];

/**
 * Parser configuration form definition
 * Complete formedible form configuration for parser settings
 */
export const parserConfigFormDefinition = {
  title: 'Parser Configuration',
  description: 'Configure how the Formedible parser processes form definitions',
  fields: parserConfigFields,
  submitLabel: 'Save Configuration',
  formOptions: {
    defaultValues: defaultParserConfig
  }
};

/**
 * Helper function to validate parser configuration
 */
export function validateParserConfig(config: unknown): config is ParserConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const c = config as Record<string, unknown>;
  
  return (
    typeof c.strictValidation === 'boolean' &&
    typeof c.enableSchemaInference === 'boolean' &&
    (c.mergeStrategy === 'extend' || c.mergeStrategy === 'override' || c.mergeStrategy === 'intersect') &&
    typeof c.fieldTypeValidation === 'boolean' &&
    typeof c.aiErrorMessages === 'boolean' &&
    (c.customInstructions === undefined || typeof c.customInstructions === 'string') &&
    typeof c.maxCodeLength === 'number' &&
    typeof c.maxNestingDepth === 'number' &&
    typeof c.enableZodParsing === 'boolean' &&
    typeof c.showDetailedErrors === 'boolean' &&
    typeof c.selectFields === 'boolean' &&
    Array.isArray(c.systemPromptFields) &&
    c.systemPromptFields.every(field => typeof field === 'string') &&
    typeof c.includeTabFormatting === 'boolean' &&
    typeof c.includePageFormatting === 'boolean'
  );
}

/**
 * Helper function to merge parser configuration with defaults
 */
export function mergeParserConfig(config: Partial<ParserConfig>): ParserConfig {
  return {
    ...defaultParserConfig,
    ...config
  };
}


/**
 * Generate a dynamic system prompt based on selected configuration fields
 */
export function generateSystemPrompt(config: ParserConfig): string {

  const fieldDescriptions: Record<string, string> = {
    strictValidation: config.strictValidation 
      ? 'Use strict validation - reject unknown properties and enforce schema compliance'
      : 'Use permissive validation - allow unknown properties and be flexible with schema',
    fieldTypeValidation: config.fieldTypeValidation
      ? 'Validate all field types against the 24 supported formedible field types'
      : 'Allow flexible field types without strict validation',
    aiErrorMessages: config.aiErrorMessages
      ? 'Generate detailed, AI-friendly error messages with suggestions and examples'
      : 'Use basic error messages without detailed suggestions',
    enableSchemaInference: config.enableSchemaInference
      ? 'Automatically infer Zod schemas from field definitions for better type safety'
      : 'Use manual schema definition without automatic inference',
    mergeStrategy: `Use "${config.mergeStrategy}" strategy when merging schemas - ${
      config.mergeStrategy === 'extend' ? 'add missing fields from base schema' :
      config.mergeStrategy === 'override' ? 'replace schema completely' :
      'keep only fields that exist in both schemas'
    }`,
    maxCodeLength: `Maximum allowed form definition length: ${config.maxCodeLength.toLocaleString()} characters`,
    maxNestingDepth: `Maximum nesting depth for object and array structures: ${config.maxNestingDepth} levels`,
    enableZodParsing: config.enableZodParsing
      ? 'Parse and handle Zod schema expressions (z.string(), z.number(), etc.)'
      : 'Treat Zod expressions as plain text without parsing',
    showDetailedErrors: config.showDetailedErrors
      ? 'Include detailed error context, location information, and debugging details'
      : 'Provide minimal error information',
    ...(config.customInstructions ? {
      customInstructions: `Additional instructions: ${config.customInstructions}`
    } : {})
  };

  const selectedFields = config.systemPromptFields
    .map(field => fieldDescriptions[field])
    .filter((desc): desc is string => Boolean(desc));

  if (!selectedFields.length && !config.includeTabFormatting && !config.includePageFormatting) {
    return '';
  }

  let prompt = `# Formedible Parser Configuration

You are working with a Formedible form parser that has been configured with the following settings:

${selectedFields.map((desc, index) => `${index + 1}. ${desc}`).join('\n')}

## Key Guidelines
- Follow the configured validation and parsing rules strictly
- Generate forms that respect the maximum limits and nesting depth
- Use the specified error message style and detail level
- Apply the configured schema inference and merging strategies`;

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

  // Generate dynamic examples using the field example objects
  const exampleFields = [
    fieldExamples.text,
    fieldExamples.email,
    fieldExamples.textarea
  ];

  let basicExample: any = {
    title: "Contact Form",
    fields: exampleFields,
    formOptions: {
      defaultValues: {
        fullName: "",
        email: "",
        message: ""
      },
      onSubmit: "async ({ value }) => { console.log('Form submitted:', value); }"
    }
  };

  if (config.includeTabFormatting && config.includePageFormatting) {
    // Both tabs and pages - use stepper with tabs inside
    basicExample = {
      title: "Multi-Step Registration",
      layout: { type: "stepper" },
      pages: [
        { title: "Personal Info", description: "Your basic information" },
        { title: "Account Setup", description: "Create your account" }
      ],
      tabs: [
        { id: "contact", label: "Contact Details", description: "How to reach you" },
        { id: "preferences", label: "Preferences", description: "Your account preferences" }
      ],
      fields: [
        { ...fieldExamples.text, page: 1, tab: "contact" },
        { ...fieldExamples.email, page: 1, tab: "contact" },
        { ...fieldExamples.phone, page: 1, tab: "preferences" },
        { ...fieldExamples.textarea, page: 2 }
      ],
      formOptions: {
        defaultValues: {
          fullName: "",
          email: "",
          phone: "",
          message: ""
        },
        onSubmit: "async ({ value }) => { console.log('Registration submitted:', value); }"
      }
    };
  } else if (config.includeTabFormatting) {
    basicExample = {
      title: "Contact Form",
      layout: { type: "tabs" },
      tabs: [
        { id: "contact", label: "Contact Info", description: "Your personal details" },
        { id: "message", label: "Message", description: "Tell us what you need" }
      ],
      fields: [
        { ...fieldExamples.text, tab: "contact" },
        { ...fieldExamples.email, tab: "contact" },
        { ...fieldExamples.textarea, tab: "message" }
      ],
      formOptions: {
        defaultValues: {
          fullName: "",
          email: "",
          message: ""
        },
        onSubmit: "async ({ value }) => { console.log('Contact form submitted:', value); }"
      }
    };
  } else if (config.includePageFormatting) {
    basicExample = {
      title: "Multi-Step Contact Form",
      layout: { type: "stepper" },
      pages: [
        { title: "Personal Info", description: "Your basic information" },
        { title: "Your Message", description: "Tell us what you need" }
      ],
      fields: [
        { ...fieldExamples.text, page: 1 },
        { ...fieldExamples.email, page: 1 },
        { ...fieldExamples.textarea, page: 2 }
      ],
      nextLabel: "Continue",
      previousLabel: "Back",
      submitLabel: "Send Message",
      formOptions: {
        defaultValues: {
          fullName: "",
          email: "",
          message: ""
        },
        onSubmit: "async ({ value }) => { console.log('Multi-step form submitted:', value); }"
      }
    };
  }

  prompt += `

## Field Examples

Each field type has a complete example configuration:

### Available Field Types
${Object.entries(fieldExamples).map(([type, example]) => 
  `**${type}**: \`${JSON.stringify(example, null, 2)}\``
).join('\n\n')}

## Complete Form Example

Based on your current configuration:

\`\`\`json
${JSON.stringify(basicExample, null, 2)}
\`\`\`

When generating forms, use these field examples and adapt the structure based on the configuration options above.`;

  return prompt;
}