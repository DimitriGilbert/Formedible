import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/parser');

const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'AI Builder', description: 'Generate draft forms, then parse the output before rendering it.', href: '/docs/ai-builder' },
  { title: 'API', description: 'Hook options, field config, formOptions, and the renderer contract used after parsing.', href: '/docs/api' },
  { title: 'Getting Started', description: 'Install the copied files and render the first typed form.', href: '/docs/getting-started' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Public exports',
    body: 'Import parser pieces from the package root. It exports FormedibleParser, fence extraction, field type metadata, parser types, and config helpers.',
    bullets: [
      'FormedibleParser and extractFormedibleCode come from lib/formedible/formedible-parser.',
      'ParserConfig, defaultParserConfig, mergeParserConfig, validateParserConfig, and generateSystemPrompt come from parser-config-schema.',
      'FormedibleParseResult records success, config, code, source, and errors.',
    ],
    snippet: {
      title: 'packages/formedible-parser/src/index.ts',
      language: 'ts',
      code: `export {
  FormedibleParser,
  extractFormedibleCode,
  supportedFieldTypeInfo,
  supportedFieldTypes,
} from '@/components/ui/formedible/lib/formedible-parser';

export {
  defaultParserConfig,
  generateSystemPrompt,
  mergeParserConfig,
  parserConfigFields,
  validateParserConfig,
} from '@/components/ui/formedible/lib/parser-config-schema';`,
    },
  },
  {
    title: 'Main API',
    body: 'FormedibleParser has throwing methods for direct parser work and result-returning methods for chat or editor flows.',
    bullets: [
      'parse rejects empty strings, oversized strings, executable syntax, invalid object syntax, and invalid config shape.',
      'parseStructured accepts the chosen structured candidate, clones serializable values, then validates and sanitizes.',
      'parseAiOutput returns success false instead of throwing when extraction or parsing fails.',
      'parseWithSchemaInference and mergeSchemas are static methods on the same class.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('parse', '(code: string, options?: ParserOptions | EnhancedParserOptions) => ParsedFormConfig', 'Throws on error', 'Parses JSON or object-literal config text after executable syntax checks and sanitization.'),
        createPropertyRow('parseStructured', '(output: FormedibleStructuredOutput, options?: ParserOptions | EnhancedParserOptions) => ParsedFormConfig', 'Throws on error', 'Clones serializable structured output, selects the likely config payload, then validates it.'),
        createPropertyRow('parseAiOutput', '(output: string | FormedibleStructuredOutput, options?: ParserOptions | EnhancedParserOptions) => FormedibleParseResult', 'Result object', 'Handles structured output, lowercase formedible fences, and direct object text with non-throwing errors.'),
        createPropertyRow('parseWithSchemaInference', '(code: string, options?: SchemaInferenceOptions) => SchemaInferenceResult', 'confidence 0 to 1', 'Parses config and, when enabled, builds an inferred schema shape from field types and min or max hints.'),
        createPropertyRow('mergeSchemas', '(parsedConfig, baseSchema, strategy?) => UseFormedibleOptions', 'extend', 'Combines parsed fields with an existing schema using extend, override, or intersect.'),
        createPropertyRow('validateWithSuggestions', '(code: string) => ValidationWithSuggestionsResult', 'Result object', 'Runs parse and returns errors plus suggestions instead of throwing.'),
      ],
    },
    snippet: {
      title: 'packages/formedible-parser/src/lib/formedible/formedible-parser.ts',
      language: 'ts',
      code: `static parseAiOutput(output: string | FormedibleStructuredOutput, options?: ParserOptions | EnhancedParserOptions): FormedibleParseResult {
  try {
    if (typeof output !== 'string') {
      return { success: true, config: this.parseStructured(output, options), source: 'structured', errors: [] };
    }

    const extraction = extractFormedibleCode(output);
    if (extraction.code !== undefined) {
      return { success: true, config: this.parse(extraction.code, options), code: extraction.code, source: 'fenced', errors: extraction.errors };
    }

    if (extraction.errors.length > 0) {
      return { success: false, source: 'none', errors: extraction.errors };
    }

    if (!output.trim().startsWith('{')) {
      return { success: false, source: 'none', errors: [] };
    }

    return { success: true, config: this.parse(output, options), code: output, source: 'direct', errors: [] };
  } catch (error) {
    return { success: false, source: typeof output === 'string' ? 'direct' : 'structured', errors: [parserErrorToEnhanced(error, typeof output === 'string' ? output : undefined)] };
  }
}`,
    },
  },
  {
    title: 'Extraction',
    body: 'extractFormedibleCode only accepts a lowercase formedible fence. Other common code fences return a validation error.',
    bullets: [
      'A matching fence returns source fenced and the trimmed block body.',
      'json, ts, tsx, typescript, javascript, and js fences return source none with a validation error.',
      'parseAiOutput handles direct object text after extraction returns no code and no errors.',
    ],
    snippet: {
      title: 'Source excerpt: packages/formedible-parser/src/lib/formedible/formedible-parser.ts',
      language: 'ts',
      code: `export function extractFormedibleCode(content: string): FormedibleExtractionResult {
  const formedibleBlock = content.match(/\`\`\`formedible\\s*\\n([\\s\\S]*?)\`\`\`/);

  if (formedibleBlock?.[1]) {
    return { code: formedibleBlock[1].trim(), source: 'fenced', errors: [] };
  }

  if (/\`\`\`(?:json|ts|tsx|typescript|javascript|js)\\b/i.test(content)) {
    return {
      source: 'none',
      errors: [
        {
          type: 'validation',
          message: 'Generated forms must use a lowercase \`\`\`formedible fenced block.',
          suggestion: 'Wrap the Formedible configuration in \`\`\`formedible, not json/ts/tsx/javascript fences.',
        },
      ],
    };
  }

  return { source: 'none', errors: [] };
}`,
    },
  },
  {
    title: 'Security',
    body: 'The parser rejects executable syntax before object parsing. It then sanitizes config keys and values before returning ParsedFormConfig.',
    bullets: [
      'executableSyntaxPattern includes arrow functions, function declarations, classes, constructor calls, eval, Function, timers, require, dynamic imports, and capitalized JSX-like markup.',
      'sanitizePlainConfig rejects component, render, children, onChange, onBlur, onFocus, onSubmit, and conditional keys.',
      'sanitizeField rejects unsupported field keys and unsupported field types.',
      'validateAndSanitize rejects unsupported top-level keys when strictValidation is true.',
    ],
    snippet: {
      title: 'packages/formedible-parser/src/lib/formedible/formedible-parser.ts',
      language: 'ts',
      code: `const executableSyntaxPattern = /(?:=>|\\bfunction\\s*\\(|\\bclass\\s+[A-Za-z_$]|\\bnew\\s+[A-Za-z_$][\\w$]*\\s*\\(|\\beval\\s*\\(|\\bFunction\\s*\\(|\\bsetTimeout\\s*\\(|\\bsetInterval\\s*\\(|\\brequire\\s*\\(|\\bimport\\s*\\(|<\\s*[A-Z][A-Za-z0-9]*(?:\\s|>|\\/))/;

function assertNoExecutableSyntax(code: string): void {
  if (executableSyntaxPattern.test(code)) {
    throw createParserError('Executable callbacks, constructors, imports, and component markup are not supported in AI-generated Formedible configs.', 'EXECUTABLE_INPUT');
  }
}

function sanitizePlainConfig(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const output: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (['component', 'render', 'children', 'onChange', 'onBlur', 'onFocus', 'onSubmit', 'conditional'].includes(key)) {
      throw createParserError(\`Unsupported executable config key '\${key}'\`, 'UNSUPPORTED_CONFIG_KEY');
    }

    if (typeof nestedValue === 'function' || nestedValue === zodSentinel) {
      throw createParserError(\`Unsupported executable value for key '\${key}'\`, 'UNSUPPORTED_CONFIG_VALUE');
    }

    if (Array.isArray(nestedValue)) {
      output[key] = nestedValue.filter((entry) => typeof entry !== 'function' && entry !== zodSentinel);
      continue;
    }

    const nestedConfig = sanitizePlainConfig(nestedValue);
    output[key] = nestedConfig ?? nestedValue;
  }

  return output;
}`,
    },
  },
  {
    title: 'Parser configuration',
    body: 'ParserConfig is the settings object for parser screens, schema validation, and parser behavior.',
    bullets: [
      'strictValidation controls whether unsupported top-level keys fail or get skipped.',
      'enableSchemaInference toggles inferred schema output from parsed fields.',
      'mergeStrategy sets the default schema merge behavior: extend, override, or intersect.',
      'maxCodeLength protects parser work from oversized responses.',
      'enableZodParsing is a parser config/schema/form field that allows inert Zod expression syntax in form definitions.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('strictValidation', 'boolean', 'true', 'Reject unsupported top-level keys instead of skipping them.'),
        createPropertyRow('enableSchemaInference', 'boolean', 'false', 'Build inferred schema metadata from parsed fields when requested.'),
        createPropertyRow('mergeStrategy', "'extend' | 'override' | 'intersect'", "'extend'", 'Select the default strategy used when parsed config meets a base schema.'),
        createPropertyRow('maxCodeLength', 'number', '1000000', 'Maximum config text length accepted by parser settings.'),
        createPropertyRow('enableZodParsing', 'boolean', 'true', 'Configuration field for allowing inert Zod expression syntax in form definitions.'),
        createPropertyRow('defaultParserConfig', 'ParserConfig', 'Exported value', 'Default settings used by parser configuration forms and parser behavior.'),
      ],
    },
    snippet: {
      title: 'packages/formedible-parser/src/lib/formedible/parser-config-schema.ts',
      language: 'ts',
      code: `export const defaultParserConfig: ParserConfig = {
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
};`,
    },
  },
  {
    title: 'Schema inference',
    body: 'Schema inference maps parsed fields to Zod-style strings only when options.enabled is true. mergeSchemas combines parsed fields with baseSchema.properties by the selected strategy.',
    bullets: [
      'Text and textarea fields can add min or max string checks from field limits.',
      'Number and slider fields can add min or max numeric checks from field limits.',
      'A field with required set to false becomes optional in the inferred schema text.',
      'mergeSchemas with extend keeps parsed fields and adds missing fields from baseSchema.properties.',
      'mergeSchemas with override keeps parsed fields but replaces schema with the base schema.',
      'mergeSchemas with intersect keeps only parsed fields that also exist in baseSchema.properties.',
    ],
    snippet: {
      title: 'packages/formedible-parser/src/lib/formedible/formedible-parser.ts',
      language: 'ts',
      code: `static parseWithSchemaInference(code: string, options?: SchemaInferenceOptions): SchemaInferenceResult {
  const config = this.parse(code);
  const properties: Record<string, string> = {};
  let confidence = options?.enabled ? 0.5 : 0;

  if (options?.enabled) {
    for (const field of config.fields) {
      const schema = inferZodTypeFromField(field);
      if (schema !== undefined) {
        properties[field.name] = schema;
        confidence += 0.1;
      }
    }
  }

  return { config, inferredSchema: options?.enabled ? { type: 'object', properties, isInferred: true } : undefined, confidence: Math.min(confidence, 1) };
}

static mergeSchemas(parsedConfig: UseFormedibleOptions<FormedibleFormValues>, baseSchema: unknown, strategy: 'extend' | 'override' | 'intersect' = 'extend') {
  if (strategy === 'override') return { ...parsedConfig, schema: baseSchema };
  if (strategy === 'intersect') return { ...parsedConfig, fields: parsedConfig.fields.filter((field) => Object.prototype.hasOwnProperty.call(properties, field.name)), schema: baseSchema };
  return { ...parsedConfig, fields: [...parsedConfig.fields, ...addedFields], schema: baseSchema };
}`,
    },
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/parser')({
  head: () => routeHead,
  component: ParserRoute,
});

function ParserRoute() {
  return (
    <DocsGuidePage
      eyebrow="Parser"
      title="Parse generated form config without running generated code."
      description="Use the parser between AI output, migration text, or builder exports and the Formedible field model your app reviews and renders."
      sections={sections}
      related={relatedLinks}
    />
  );
}
