import type { FormedibleFieldConfig } from '@formedible/ui/components/formedible/lib/types';

export interface ParserConfig {
  readonly strictValidation: boolean;
  readonly enableSchemaInference: boolean;
  readonly mergeStrategy: 'extend' | 'override' | 'intersect';
  readonly fieldTypeValidation: boolean;
  readonly customInstructions?: string;
  readonly maxCodeLength: number;
  readonly maxNestingDepth: number;
  readonly enableZodParsing: boolean;
  readonly showDetailedErrors: boolean;
  readonly selectFields: boolean;
  readonly systemPromptFields: readonly string[];
  readonly includeTabFormatting: boolean;
  readonly includePageFormatting: boolean;
  readonly [key: string]: unknown;
}

export const parserConfigSchemaDefinition = {
  strictValidation: {
    type: 'boolean',
    default: true,
    description: 'Enable strict validation of form definitions',
  },
  enableSchemaInference: {
    type: 'boolean',
    default: false,
    description: 'Automatically infer schema information from field definitions',
  },
  mergeStrategy: {
    type: 'enum',
    values: ['extend', 'override', 'intersect'],
    default: 'extend',
    description: 'Strategy for merging parsed definitions with a base schema shape',
  },
  fieldTypeValidation: {
    type: 'boolean',
    default: true,
    description: 'Validate field types against supported Formedible field types',
  },
  customInstructions: {
    type: 'string',
    optional: true,
    description: 'Custom parsing instructions or constraints',
  },
  maxCodeLength: {
    type: 'number',
    default: 1000000,
    min: 1000,
    max: 10000000,
    description: 'Maximum allowed code length in characters',
  },
  maxNestingDepth: {
    type: 'number',
    default: 50,
    min: 5,
    max: 200,
    description: 'Maximum nesting depth for object structures',
  },
  enableZodParsing: {
    type: 'boolean',
    default: true,
    description: 'Allow inert parsing of Zod expression syntax in form definitions',
  },
  showDetailedErrors: {
    type: 'boolean',
    default: true,
    description: 'Show detailed error information in parser output',
  },
} as const;

export const defaultParserConfig: ParserConfig = {
  strictValidation: true,
  enableSchemaInference: false,
  mergeStrategy: 'extend',
  fieldTypeValidation: true,
  customInstructions: undefined,
  maxCodeLength: 1000000,
  maxNestingDepth: 50,
  enableZodParsing: true,
  showDetailedErrors: true,
  selectFields: false,
  systemPromptFields: [
    'text',
    'email',
    'url',
    'textarea',
    'number',
    'select',
    'multiSelect',
    'radio',
    'checkbox',
    'switch',
    'date',
    'file',
    'slider',
    'rating',
    'phone',
    'colorPicker',
    'password',
    'duration',
    'autocomplete',
    'masked',
    'array',
    'object',
  ],
  includeTabFormatting: true,
  includePageFormatting: true,
};

const fieldExamples: Readonly<Record<string, FormedibleFieldConfig>> = {
  text: { name: 'fullName', type: 'text', label: 'Full Name', required: true },
  email: { name: 'email', type: 'email', label: 'Email Address', required: true },
  url: { name: 'website', type: 'url', label: 'Website URL' },
  textarea: { name: 'message', type: 'textarea', label: 'Message', rows: 4, maxLength: 500 },
  number: { name: 'age', type: 'number', label: 'Age', min: 18, max: 120 },
  select: { name: 'country', type: 'select', label: 'Country', options: ['US', 'UK', 'CA'] },
  multiSelect: { name: 'skills', type: 'multiSelect', label: 'Skills', options: ['React', 'Vue', 'Angular'] },
  radio: { name: 'plan', type: 'radio', label: 'Plan', options: ['Free', 'Pro'] },
  checkbox: { name: 'newsletter', type: 'checkbox', label: 'Subscribe to newsletter' },
  switch: { name: 'notifications', type: 'switch', label: 'Enable notifications' },
  date: { name: 'birthDate', type: 'date', label: 'Birth Date' },
  file: { name: 'resume', type: 'file', label: 'Resume', fileConfig: { accept: '.pdf' } },
  slider: { name: 'experience', type: 'slider', label: 'Years Experience', min: 0, max: 20, step: 1 },
  rating: { name: 'satisfaction', type: 'rating', label: 'Satisfaction', ratingConfig: { max: 5 } },
  phone: { name: 'phone', type: 'phone', label: 'Phone Number' },
  colorPicker: { name: 'brandColor', type: 'colorPicker', label: 'Brand Color' },
  password: { name: 'password', type: 'password', label: 'Password' },
  duration: { name: 'workHours', type: 'duration', label: 'Work Hours' },
  autocomplete: { name: 'city', type: 'autocomplete', label: 'City', options: ['New York', 'Chicago'] },
  masked: { name: 'ssn', type: 'masked', label: 'SSN' },
  array: { name: 'team', type: 'array', label: 'Team Members', arrayConfig: { itemType: 'object' } },
  object: { name: 'address', type: 'object', label: 'Address', objectConfig: { fields: [] } },
};

export const parserConfigFields: readonly FormedibleFieldConfig[] = [
  { name: 'strictValidation', type: 'switch', label: 'Strict Validation', defaultValue: true },
  { name: 'enableSchemaInference', type: 'switch', label: 'Schema Inference', defaultValue: false },
  {
    name: 'mergeStrategy',
    type: 'select',
    label: 'Schema Merge Strategy',
    defaultValue: 'extend',
    options: ['extend', 'override', 'intersect'],
  },
  { name: 'fieldTypeValidation', type: 'switch', label: 'Field Type Validation', defaultValue: true },
  { name: 'customInstructions', type: 'textarea', label: 'Custom Instructions', required: false },
  { name: 'maxCodeLength', type: 'number', label: 'Maximum Code Length', defaultValue: 1000000, min: 1000, max: 10000000 },
  { name: 'maxNestingDepth', type: 'number', label: 'Maximum Nesting Depth', defaultValue: 50, min: 5, max: 200 },
  { name: 'enableZodParsing', type: 'switch', label: 'Zod Expression Parsing', defaultValue: true },
  { name: 'showDetailedErrors', type: 'switch', label: 'Detailed Error Information', defaultValue: true },
  { name: 'selectFields', type: 'switch', label: 'Select Fields', defaultValue: false },
  {
    name: 'systemPromptFields',
    type: 'multiSelect',
    label: 'Field Types',
    options: Object.keys(fieldExamples),
    defaultValue: Object.keys(fieldExamples),
  },
  { name: 'includeTabFormatting', type: 'switch', label: 'Tab Formatting', defaultValue: true },
  { name: 'includePageFormatting', type: 'switch', label: 'Page Formatting', defaultValue: true },
];

export const parserConfigFormDefinition = {
  title: 'Parser Configuration',
  description: 'Configure how the Formedible parser processes form definitions',
  fields: parserConfigFields,
  submitLabel: 'Save Configuration',
  formOptions: {
    defaultValues: defaultParserConfig,
  },
} as const;

export function validateParserConfig(config: unknown): config is ParserConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const candidate = config as Readonly<Record<string, unknown>>;

  return (
    typeof candidate.strictValidation === 'boolean' &&
    typeof candidate.enableSchemaInference === 'boolean' &&
    (candidate.mergeStrategy === 'extend' || candidate.mergeStrategy === 'override' || candidate.mergeStrategy === 'intersect') &&
    typeof candidate.fieldTypeValidation === 'boolean' &&
    (candidate.customInstructions === undefined || typeof candidate.customInstructions === 'string') &&
    typeof candidate.maxCodeLength === 'number' &&
    typeof candidate.maxNestingDepth === 'number' &&
    typeof candidate.enableZodParsing === 'boolean' &&
    typeof candidate.showDetailedErrors === 'boolean' &&
    typeof candidate.selectFields === 'boolean' &&
    Array.isArray(candidate.systemPromptFields) &&
    candidate.systemPromptFields.every((field) => typeof field === 'string') &&
    typeof candidate.includeTabFormatting === 'boolean' &&
    typeof candidate.includePageFormatting === 'boolean'
  );
}

export function mergeParserConfig(config: Partial<ParserConfig>): ParserConfig {
  return {
    ...defaultParserConfig,
    ...config,
  };
}

export function generateSystemPrompt(config: ParserConfig): string {
  const lines = [
    '# Formedible Parser Configuration',
    '',
    config.strictValidation ? 'Use strict validation for form definitions.' : 'Allow flexible form definition validation.',
    config.fieldTypeValidation ? 'Validate field types against supported Formedible field types.' : 'Do not enforce field type validation.',
    config.enableSchemaInference ? 'Infer schema information from field definitions.' : 'Do not infer schemas automatically.',
    `Use the ${config.mergeStrategy} merge strategy.`,
    `Maximum code length: ${config.maxCodeLength} characters.`,
    `Maximum nesting depth: ${config.maxNestingDepth} levels.`,
    'Normal prose conversation is allowed when no form is requested.',
    'When generating a form, return the Formedible config object inside a lowercase ```formedible fenced block.',
    'Do not include executable callbacks, React components, JSX, imports, classes, functions, or unsupported config keys in generated forms.',
  ];

  if (config.customInstructions) {
    lines.push(config.customInstructions);
  }

  if (config.includeTabFormatting) {
    lines.push('Use tabs only when they improve form organization.');
  }

  if (config.includePageFormatting) {
    lines.push('Use pages for multi-step forms with clear progression.');
  }

  return lines.join('\n');
}
