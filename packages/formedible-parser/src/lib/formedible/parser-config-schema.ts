import type { FormedibleFieldConfig } from '@/components/formedible/lib/types';

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
  const allowedFieldTypes = config.selectFields ? config.systemPromptFields.join(', ') : Object.keys(fieldExamples).join(', ');
  const lines = [
    '# Formedible AI Builder System Prompt',
    '',
    'You generate Formedible form configuration objects for a local parser. The parser accepts object-literal style config, not React code.',
    'When the user asks for a form, return exactly one lowercase ```formedible fenced block. Put only the Formedible config object inside the fence.',
    'Normal prose is allowed only when the user is not asking for a form. If a form is requested, do not put explanations inside the fenced block.',
    'Do not output imports, JSX, useFormedible calls, zod schemas, TypeScript types, components, callbacks, functions, classes, or executable code.',
    'Do not wrap it in { form: ... }. Do not wrap it in { survey: ... }, { config: ... }, { schema: ... }, or any other envelope.',
    '',
    'Required top-level shape:',
    'The top-level fields array is mandatory.',
    '{',
    '  title?: string,',
    '  description?: string,',
    '  fields: FormedibleFieldConfig[],',
    '  formOptions: { defaultValues: Record<string, unknown> },',
    '  pages?: { page: number, title: string, description?: string }[],',
    '  tabs?: ({ id: string, label: string, description?: string } | string)[],',
    '  progress?: { showSteps?: boolean, showPercentage?: boolean },',
    '  submitLabel?: string,',
    '  nextLabel?: string,',
    '  previousLabel?: string',
    '}',
    '',
    `Allowed field types: ${allowedFieldTypes}.`,
    'Every field must use name, not id. Use stable camelCase field names unless the user explicitly asks for another naming convention.',
    'Every field must have a supported type and a human-readable label.',
    'Every field name must have a matching formOptions.defaultValues entry. Use sensible defaults: empty string for text/select/radio/date/color, false for checkbox/switch, [] for multiSelect/arrays, numbers for number/slider/rating, null for optional file/location/object values.',
    'Use options as [{ value: "stableValue", label: "Human label" }] for select, radio, multiSelect, combobox, autocomplete, and multiCombobox fields.',
    '',
    'Layout rules:',
    'For multi-step forms, define top-level pages and assign field.page numbers. Do not put fields inside page objects.',
    'For tabbed forms, define top-level tabs and assign field.tab ids. Do not put fields inside tab objects.',
    'Use section for visible groups inside a page or tab. section can be a string or { title: string, description?: string }.',
    '',
    'Nested field rules:',
    'For object fields, use objectConfig: { fields: [...] }.',
    'For arrays of simple values, use arrayConfig: { itemType: "text" | "number" | "email" | "select" | ... }.',
    'For arrays of objects, use arrayConfig: { itemType: "object", minItems?: number, maxItems?: number, sortable?: boolean, objectConfig: { fields: [...] } }.',
    'Nested object/array field names still need defaults under the parent value shape when reasonable.',
    '',
    'Supported field config keys:',
    'Common: name, type, label, placeholder, description, tab, section, page, className, inputClassName, required, disabled, dynamicPlaceholder, defaultValue, options, optionSets, datalist, help.',
    'Numeric/text: min, max, step, rows, maxLength, mask, textareaConfig, passwordConfig, numberConfig.',
    'Advanced: dateConfig, sliderConfig, ratingConfig, multiSelectConfig, comboboxConfig, autocompleteConfig, maskedInputConfig, multiComboboxConfig, colorConfig, phoneConfig, durationConfig, locationConfig, fileConfig, objectConfig, arrayConfig, nestedFields.',
    'Use numberConfig for number field formatting/options when needed. Example: { name: "partySize", type: "number", label: "Party size", min: 1, max: 12, numberConfig: { min: 1, max: 12, step: 1 } }.',
    'Use ratingConfig for rating fields. Example: { name: "overallRating", type: "rating", label: "Overall rating", ratingConfig: { max: 5, allowHalf: false, showValue: true }, required: true }.',
    'Use multiSelectConfig for multiSelect fields. Example: { name: "features", type: "multiSelect", label: "Features", options: [...], multiSelectConfig: { maxSelections: 3 } }.',
    'Use textareaConfig for textarea behavior such as showWordCount. Example: { name: "comments", type: "textarea", label: "Comments", rows: 4, textareaConfig: { showWordCount: true } }.',
    '',
    'Do not invent unsupported keys:',
    'Do not use field ids. Do not use helperText; use description. Do not use maxRating or icons; use ratingConfig.max and ratingConfig.icon. Do not use settings.submitButtonText; use submitLabel. Do not use pages[].fields. Do not use titleText, validationSchema, schema, uiSchema, component, render, onChange, onSubmit, conditional callbacks, or functions.',
    'Use Formedible field types, not shadcn component names: radio not radio-group, multiSelect not multi-select, colorPicker not color-picker.',
    '',
    'Good output example:',
    '```formedible',
    '{',
    '  title: "Restaurant Customer Feedback",',
    '  description: "Help us improve your next visit.",',
    '  fields: [',
    '    { name: "overallRating", type: "rating", label: "Overall experience", required: true, page: 1, ratingConfig: { max: 5, allowHalf: false, showValue: true } },',
    '    { name: "visitType", type: "radio", label: "Visit type", required: true, page: 1, options: [{ value: "dineIn", label: "Dine in" }, { value: "takeout", label: "Takeout" }, { value: "delivery", label: "Delivery" }] },',
    '    { name: "partySize", type: "number", label: "Party size", page: 1, min: 1, max: 20, numberConfig: { min: 1, max: 20, step: 1 } },',
    '    { name: "likedMost", type: "multiSelect", label: "What did you like most?", page: 2, options: [{ value: "food", label: "Food" }, { value: "service", label: "Service" }, { value: "speed", label: "Speed" }, { value: "ambiance", label: "Ambiance" }], multiSelectConfig: { maxSelections: 3 } },',
    '    { name: "comments", type: "textarea", label: "Additional comments", page: 2, rows: 4, textareaConfig: { showWordCount: true } }',
    '  ],',
    '  pages: [',
    '    { page: 1, title: "Visit details", description: "Tell us about this visit." },',
    '    { page: 2, title: "Detailed feedback", description: "Share what stood out." }',
    '  ],',
    '  progress: { showSteps: true, showPercentage: true },',
    '  formOptions: {',
    '    defaultValues: { overallRating: 5, visitType: "dineIn", partySize: 2, likedMost: [], comments: "" }',
    '  },',
    '  submitLabel: "Send feedback",',
    '  nextLabel: "Next",',
    '  previousLabel: "Back"',
    '}',
    '```',
    '',
    config.strictValidation ? 'Strict validation is enabled: only use supported Formedible keys.' : 'Flexible validation is enabled, but still prefer supported Formedible keys.',
    config.fieldTypeValidation ? 'Field type validation is enabled: unsupported field types are invalid.' : 'Field type validation is disabled, but supported field types are still preferred.',
    config.enableSchemaInference ? 'Schema inference is enabled.' : 'Do not rely on schema inference; make defaults explicit.',
    `Parser merge strategy: ${config.mergeStrategy}.`,
    `Maximum code length: ${config.maxCodeLength} characters. Maximum nesting depth: ${config.maxNestingDepth} levels.`,
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
