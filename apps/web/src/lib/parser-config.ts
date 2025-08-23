"use client";

/**
 * Parser Configuration for AI Builder Settings
 * Local copy of parser config schema for ai-builder package
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
  enableSystemPromptBuilder: boolean;
  systemPromptFields: string[];
  [key: string]: unknown;
}

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
  enableSystemPromptBuilder: false,
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
  ]
};

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
    name: 'enableSystemPromptBuilder',
    type: 'switch',
    label: 'System Prompt Builder',
    description: 'Enable dynamic system prompt generation with configurable field selection.',
    defaultValue: false
  },
  {
    name: 'systemPromptFields',
    type: 'multiSelect',
    label: 'System Prompt Fields',
    description: 'Select which configuration fields to include in the generated system prompt.',
    options: [
      { value: 'strictValidation', label: 'Strict Validation' },
      { value: 'fieldTypeValidation', label: 'Field Type Validation' },
      { value: 'aiErrorMessages', label: 'AI-Friendly Error Messages' },
      { value: 'enableSchemaInference', label: 'Schema Inference' },
      { value: 'mergeStrategy', label: 'Schema Merge Strategy' },
      { value: 'maxCodeLength', label: 'Maximum Code Length' },
      { value: 'maxNestingDepth', label: 'Maximum Nesting Depth' },
      { value: 'enableZodParsing', label: 'Zod Expression Parsing' },
      { value: 'showDetailedErrors', label: 'Detailed Error Information' },
      { value: 'customInstructions', label: 'Custom Instructions' }
    ],
    defaultValue: [
      'strictValidation',
      'fieldTypeValidation', 
      'aiErrorMessages',
      'enableSchemaInference',
      'mergeStrategy',
      'maxCodeLength',
      'maxNestingDepth',
      'enableZodParsing',
      'showDetailedErrors'
    ]
  }
];

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
    typeof c.enableSystemPromptBuilder === 'boolean' &&
    Array.isArray(c.systemPromptFields) &&
    c.systemPromptFields.every(field => typeof field === 'string')
  );
}

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
  if (!config.enableSystemPromptBuilder || !config.systemPromptFields.length) {
    return '';
  }

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

  if (!selectedFields.length) {
    return '';
  }

  return `# Formedible Parser Configuration

You are working with a Formedible form parser that has been configured with the following settings:

${selectedFields.map((desc, index) => `${index + 1}. ${desc}`).join('\n')}

## Key Guidelines
- Follow the configured validation and parsing rules strictly
- Generate forms that respect the maximum limits and nesting depth
- Use the specified error message style and detail level
- Apply the configured schema inference and merging strategies

When generating or parsing form definitions, ensure all output adheres to these configuration parameters.`;
}