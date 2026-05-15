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
  { title: 'AI Builder', description: 'Generate draft forms, then hand parser-safe output to review and rendering flows.', href: '/docs/ai-builder' },
  { title: 'API', description: 'Hook options, field config, formOptions, and the renderer contract used after parsing.', href: '/docs/api' },
  { title: 'Getting Started', description: 'Install the copied surface and render the first typed form.', href: '/docs/getting-started' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Overview',
    body: 'The parser turns plain Formedible config text or structured model output into a UseFormedibleOptions-compatible draft. Treat it as an import gate for AI output: parse, sanitize, validate, review, then render only the accepted config.',
    bullets: [
      'Use it when generated text, migration data, or saved builder output needs to land on the public field model.',
      'The security model rejects executable syntax before object parsing, strips unsafe globals, and keeps callbacks out of parsed config.',
      'Parser output is still a draft. Show the result to a reviewer before saving it as product source.',
    ],
  },
  {
    title: 'Main API',
    body: 'FormedibleParser exposes static methods for the full import path. Use parse for trusted config text, parseStructured for object-shaped model responses, and parseAiOutput when the response might include prose around a fenced block.',
    bullets: [
      'parse returns ParsedFormConfig or throws a ParserError with a code such as INVALID_INPUT, EXECUTABLE_INPUT, or UNSUPPORTED_FIELD_TYPE.',
      'parseStructured accepts direct config objects or wrappers named formedible, formConfig, config, output, or formOptions.',
      'parseAiOutput returns success, source, errors, code, and config so chat UIs can show useful feedback without throwing.',
      'parseWithSchemaInference returns config, inferredSchema, and confidence when schema inference is enabled.',
      'mergeSchemas joins parsed fields with a base schema through extend, override, or intersect behavior.',
      'validateWithSuggestions reports parser errors with suggestions fit for editor and review screens.',
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
  },
  {
    title: 'Extraction',
    body: 'extractFormedibleCode is intentionally narrow. It accepts only a lowercase formedible fenced block, trims the block content, and tells the caller whether code came from a fence or no usable source was found.',
    bullets: [
      'Valid format starts with three backticks plus formedible, followed by the config object, then a closing fence.',
      'json, ts, tsx, typescript, javascript, and js fences are rejected with a validation error.',
      'When no fence exists and the response starts with an object, parseAiOutput treats the whole string as direct config text.',
    ],
  },
  {
    title: 'Security',
    body: 'The parser is built for generated config, not code execution. It blocks callbacks, constructors, imports, classes, component markup, timers, eval-style calls, unsafe globals, and unsupported config keys before the renderer sees the result.',
    bullets: [
      'Executable syntax rejection catches arrow functions, function declarations, classes, imports, constructors, JSX-like component markup, timers, require, and eval-style calls.',
      'Code sanitization removes comments, replaces unsafe globals with null, normalizes date constructors, and strips executable function bodies.',
      'Zod expressions are replaced with an inert sentinel during object-literal parsing so generated schema text cannot run.',
      'Key allowlisting limits top-level config, field config, page config, progress config, and formOptions properties.',
      'Field type validation checks names against the supported Formedible field type list before fields reach rendering.',
    ],
  },
  {
    title: 'Parser configuration',
    body: 'ParserConfig drives strictness, schema inference, merge behavior, size limits, and Zod parsing for builder-facing settings screens. defaultParserConfig keeps strict validation on, schema inference off, extend merging, a 1000000 character limit, and Zod parsing on.',
    bullets: [
      'strictValidation controls whether unsupported top-level keys fail or get skipped.',
      'enableSchemaInference toggles inferred schema output from parsed fields.',
      'mergeStrategy sets the default schema merge behavior: extend, override, or intersect.',
      'maxCodeLength protects parser work from oversized responses.',
      'enableZodParsing keeps Zod-like text parseable as inert schema placeholders, not executable logic.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('strictValidation', 'boolean', 'true', 'Reject unsupported top-level keys instead of skipping them.'),
        createPropertyRow('enableSchemaInference', 'boolean', 'false', 'Build inferred schema metadata from parsed fields when requested.'),
        createPropertyRow('mergeStrategy', "'extend' | 'override' | 'intersect'", "'extend'", 'Select the default strategy used when parsed config meets a base schema.'),
        createPropertyRow('maxCodeLength', 'number', '1000000', 'Maximum config text length accepted by parser settings.'),
        createPropertyRow('enableZodParsing', 'boolean', 'true', 'Allow inert parsing of Zod expression text in generated definitions.'),
        createPropertyRow('defaultParserConfig', 'ParserConfig', 'Exported value', 'Default settings used by parser configuration forms and system prompt generation.'),
      ],
    },
  },
  {
    title: 'Schema inference',
    body: 'parseWithSchemaInference reads parsed fields and maps supported field types to Zod-style schema strings. The result carries inferredSchema plus a confidence score, so a review UI can separate strong guesses from fields that still need human edits.',
    bullets: [
      'Text and textarea fields can add min or max string checks from field limits.',
      'Number and slider fields can add min or max numeric checks from field limits.',
      'A field with required set to false becomes optional in the inferred schema text.',
      'mergeSchemas with extend keeps parsed fields and adds missing fields from baseSchema.properties.',
      'mergeSchemas with override keeps parsed fields but replaces schema with the base schema.',
      'mergeSchemas with intersect keeps only parsed fields that also exist in baseSchema.properties.',
    ],
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
      description="Use the parser as the handoff between AI output, migration text, or builder exports and the Formedible field model your app can review and render."
      sections={sections}
      related={relatedLinks}
    />
  );
}
