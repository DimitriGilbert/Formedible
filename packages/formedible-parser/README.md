# @formedible/formedible-parser

This package parses Formedible config text into data compatible with `UseFormedibleOptions<FormedibleFormValues>`. It accepts JSON, object literals with single quotes or trailing commas, structured object output, and lowercase `formedible` fenced blocks. It rejects executable callbacks, constructors, imports, JSX/component markup, unsupported top-level keys, and unsupported field keys.

Public install item:

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-parser.json
```

The registry item is `formedible-parser` in `packages/formedible-parser/registry.json`. It depends on `https://formedible.dev/r/formedible-core.json` and copies parser libs to `@ui/formedible/lib/*`.

## Public exports

`packages/formedible-parser/src/index.ts` re-exports:

### Parser

- `FormedibleParser`
- `extractFormedibleCode`
- `supportedFieldTypes`
- `supportedFieldTypeInfo`

### Parser config helpers

- `defaultParserConfig`
- `generateSystemPrompt`
- `mergeParserConfig`
- `parserConfigFields`
- `parserConfigFormDefinition`
- `parserConfigSchemaDefinition`
- `validateParserConfig`

### Types

- `SupportedFieldType`
- `SupportedFieldTypeInfo`
- `EnhancedParserError`
- `EnhancedParserOptions`
- `FieldConfig`
- `FieldOption`
- `FieldOptions`
- `FormedibleExtractionResult`
- `FormedibleParseResult`
- `FormedibleStructuredOutput`
- `ObjectConfig`
- `PageConfig`
- `ParsedFieldConfig`
- `ParsedFormConfig`
- `ParserError`
- `ParserOptions`
- `ProgressConfig`
- `SchemaInferenceOptions`
- `SchemaInferenceResult`
- `UseFormedibleOptions`
- `ValidationWithSuggestionsResult`
- `ParserConfig`

## Parse direct config text

```ts
import { FormedibleParser } from '@/components/ui/formedible/lib/formedible-parser';

export const parsed = FormedibleParser.parse(`{
  fields: [
    { name: 'email', type: 'email', label: 'Email Address', required: true },
    { name: 'age', type: 'number', min: 18, max: 99 }
  ],
  submitLabel: 'Create',
  formOptions: { defaultValues: { email: '', age: 18 } }
}`);

export const parsedFieldCount = parsed.fields.length;
```

The parser strips inert Zod expressions from object-literal input instead of executing them. Safe JSON schema objects stay intact (`src/lib/formedible/formedible-parser.test.ts:47`).

## Parse AI output

```ts
import { FormedibleParser, extractFormedibleCode } from '@/components/ui/formedible/lib/formedible-parser';

const aiOutput = `Here is the form:

\`\`\`formedible
{ fields: [{ name: 'email', type: 'email', label: 'Email' }] }
\`\`\``;

const extraction = extractFormedibleCode(aiOutput);
const result = FormedibleParser.parseAiOutput(aiOutput);

export const extractedEmailField = {
  source: extraction.source,
  success: result.success,
  firstFieldName: result.config?.fields[0]?.name,
};
```

Only lowercase `formedible` fences are accepted. The tests reject `json`, `ts`, and unfenced object strings for AI extraction (`src/lib/formedible/formedible-parser.test.ts:113`, `packages/ai-builder/src/components/formedible/ai/ai-builder.test.ts:194`).

## Schema inference

```ts
import { FormedibleParser } from '@/components/ui/formedible/lib/formedible-parser';

const result = FormedibleParser.parseWithSchemaInference(`{
  fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'age', type: 'number', min: 18, max: 99 },
    { name: 'tags', type: 'multiSelect', required: false }
  ]
}`, { enabled: true });

export const inferredSchemaSummary = {
  schema: result.inferredSchema,
  confidence: result.confidence,
};
```

The expected inference shape is locked in `src/lib/formedible/formedible-parser.test.ts:146`.

## Supported field types

`supportedFieldTypes` is defined in `src/lib/formedible/formedible-parser.ts:24`:

`text`, `email`, `password`, `url`, `tel`, `textarea`, `select`, `checkbox`, `switch`, `number`, `date`, `slider`, `file`, `rating`, `phone`, `colorPicker`, `location`, `duration`, `multiSelect`, `autocomplete`, `masked`, `object`, `array`, `radio`.

`supportedFieldTypeInfo` pairs each field type with an inferred schema string and description (`src/lib/formedible/formedible-parser.ts:59`).

## Parser configuration

```ts
import {
  defaultParserConfig,
  generateSystemPrompt,
  mergeParserConfig,
  validateParserConfig,
} from '@/components/ui/formedible/lib/parser-config-schema';

const config = mergeParserConfig({
  enableSchemaInference: true,
  selectFields: true,
  systemPromptFields: ['text', 'email', 'textarea'],
});

export const parserRuntimeConfig = {
  systemPrompt: validateParserConfig(config) ? generateSystemPrompt(config) : '',
  strictValidation: defaultParserConfig.strictValidation,
};
```

`ParserConfig` includes `strictValidation`, `enableSchemaInference`, `mergeStrategy`, `fieldTypeValidation`, `customInstructions`, `maxCodeLength`, `maxNestingDepth`, `enableZodParsing`, `showDetailedErrors`, `selectFields`, `systemPromptFields`, `includeTabFormatting`, and `includePageFormatting` (`src/lib/formedible/parser-config-schema.ts:3`).

## Safety rules

- Maximum code length defaults to `1000000` (`src/lib/formedible/formedible-parser.ts:122`).
- Executable syntax is rejected by `executableSyntaxPattern` (`src/lib/formedible/formedible-parser.ts:161`).
- Allowed top-level keys and allowed field keys are explicit sets (`src/lib/formedible/formedible-parser.ts:86`, `src/lib/formedible/formedible-parser.ts:124`).
- Parser errors use `ParserError` with a `code` property (`src/lib/formedible/formedible-parser.ts:167`).

## Package scripts

Exact scripts from `packages/formedible-parser/package.json`:

```bash
pnpm --filter @formedible/formedible-parser run check-types
pnpm --filter @formedible/formedible-parser run test
pnpm --filter @formedible/formedible-parser run build
pnpm --filter @formedible/formedible-parser run build:registry
pnpm --filter @formedible/formedible-parser run sync
```

Root equivalents used most often:

```bash
pnpm run build:parser
pnpm run check-types:parser
pnpm run check-types
```

## Docs and tests

- Docs route: `/docs/parser`.
- Source entrypoint: `packages/formedible-parser/src/index.ts`.
- Parser source: `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`.
- Parser config source: `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts`.
- Tests: `packages/formedible-parser/src/lib/formedible/formedible-parser.test.ts`.
