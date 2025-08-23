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
  showDetailedErrors: true
};

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
    typeof c.showDetailedErrors === 'boolean'
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