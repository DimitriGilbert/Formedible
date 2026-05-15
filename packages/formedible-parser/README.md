# Formedible Parser

## What it is

`@formedible/formedible-parser` turns AI-generated form definitions into safe `UseFormedibleOptions` config.

The parser accepts three input shapes:

- a lowercase `formedible` fenced block from chat output
- a direct JSON or JavaScript object literal string
- structured model output with `formedible`, `formConfig`, `config`, `output`, or `formOptions`

It is intentionally narrow. It keeps form config data and rejects executable code, JSX, imports, constructors, callbacks, unsupported field types, and unknown keys in strict mode.

## Quick start: `parseAiOutput`

Use `FormedibleParser.parseAiOutput` for model responses. It handles fenced blocks, direct object strings, and structured output.

```ts
import { FormedibleParser } from '@formedible/formedible-parser';

const aiOutput = `Here is the form:

\`\`\`formedible
{
  title: 'Contact',
  fields: [
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'message', type: 'textarea', label: 'Message', rows: 4 }
  ],
  formOptions: {
    defaultValues: {
      email: '',
      message: ''
    }
  }
}
\`\`\`
`;

const result = FormedibleParser.parseAiOutput(aiOutput);

if (result.success) {
  const config = result.config;
  // Pass config to useFormedible.
} else {
  const messages = result.errors.map((error) => error.message);
}
```

For structured output, pass the object directly:

```ts
const result = FormedibleParser.parseAiOutput({
  formedible: {
    title: 'Signup',
    fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
    formOptions: { defaultValues: { email: '' } },
  },
});
```

`parseAiOutput` returns a `FormedibleParseResult`:

| Property | Meaning |
| --- | --- |
| `success` | `true` if a safe config was parsed. |
| `config` | Parsed `UseFormedibleOptions`, present on success. |
| `code` | Extracted source text when the input was text. |
| `source` | `structured`, `fenced`, `direct`, or `none`. |
| `errors` | Parser errors with type, message, suggestion, and optional location. |

## Main API methods

Import from the package root:

```ts
import { FormedibleParser, extractFormedibleCode } from '@formedible/formedible-parser';
```

### `FormedibleParser.parse(code, options?)`

Parses a non-empty string containing JSON or a JavaScript object literal. Throws a `ParserError` if parsing or validation fails.

```ts
const config = FormedibleParser.parse(`{
  fields: [{ name: 'age', type: 'number', label: 'Age', min: 18 }],
  formOptions: { defaultValues: { age: 18 } }
}`);
```

### `FormedibleParser.parseStructured(output, options?)`

Parses structured model output. The parser first checks wrapper keys in this order: `formedible`, `formConfig`, `config`, `output`, `formOptions`. If none of those keys exist, it treats the object itself as the form config.

### `FormedibleParser.parseAiOutput(output, options?)`

Best default for AI integrations. Returns a result object instead of throwing.

Input behavior:

- object input uses `parseStructured`
- text with a lowercase `formedible` fenced block uses the fenced block
- text starting with `{` is parsed as a direct config
- text with `json`, `ts`, `tsx`, `typescript`, `javascript`, or `js` fenced blocks is rejected with a suggestion to use `formedible`

### `FormedibleParser.isValidFieldType(type)`

Checks whether a string is one of the supported field types.

### `FormedibleParser.getSupportedFieldTypes()`

Returns the supported field type list:

`text`, `email`, `password`, `url`, `tel`, `textarea`, `select`, `checkbox`, `switch`, `number`, `date`, `slider`, `file`, `rating`, `phone`, `colorPicker`, `location`, `duration`, `multiSelect`, `autocomplete`, `masked`, `object`, `array`, `radio`.

### `FormedibleParser.getSupportedFieldTypeInfo()`

Returns field type metadata with `type`, inferred schema text, and a short description.

### `FormedibleParser.validateConfig(config)`

Validates an object and returns `{ isValid, errors }`. This method uses strict validation.

### `FormedibleParser.parseWithSchemaInference(code, options?)`

Parses string config, then builds a lightweight inferred schema when `options.enabled` is true.

```ts
const result = FormedibleParser.parseWithSchemaInference(code, { enabled: true });

const config = result.config;
const inferredSchema = result.inferredSchema;
const confidence = result.confidence;
```

### `FormedibleParser.mergeSchemas(parsedConfig, baseSchema, strategy?)`

Merges a parsed config with a base schema-like object. Supported strategies:

| Strategy | Behavior |
| --- | --- |
| `extend` | Adds missing fields from `baseSchema.properties` and attaches `schema`. |
| `override` | Keeps parsed fields and replaces `schema` with the base schema. |
| `intersect` | Keeps fields whose names exist in `baseSchema.properties` and attaches `schema`. |

### `FormedibleParser.validateWithSuggestions(code)`

Parses string config and returns `{ isValid, errors, suggestions }`. Use this for editor feedback.

### `extractFormedibleCode(content)`

Extracts a lowercase `formedible` fenced block without parsing it.

```ts
const extraction = extractFormedibleCode(markdown);

if (extraction.code !== undefined) {
  const config = FormedibleParser.parse(extraction.code);
}
```

## Security model

The parser treats AI output as untrusted text.

It blocks executable syntax before parsing, including:

- arrow functions and `function` declarations
- classes and constructors
- `eval`, `Function`, timers, `require`, and dynamic imports
- JSX and component markup

During sanitization it removes or rejects risky values and keys:

- browser and runtime globals such as `window`, `document`, `process`, and `globalThis`
- prototype-related names such as `__proto__`, `constructor`, and `prototype`
- executable config keys such as `component`, `render`, `children`, event handlers, and `conditional`
- unsupported top-level keys when `strictValidation` is enabled
- unsupported field keys and unsupported field types

Zod expressions are parsed as inert marker values, not executed. The output is plain config data suitable for Formedible.

## Parser config

Parser configuration helpers live in `parser-config-schema.ts` and are exported from the package root.

```ts
import {
  defaultParserConfig,
  generateSystemPrompt,
  mergeParserConfig,
  validateParserConfig,
} from '@formedible/formedible-parser';

const parserConfig = mergeParserConfig({
  enableSchemaInference: true,
  mergeStrategy: 'extend',
  selectFields: true,
});

if (validateParserConfig(parserConfig)) {
  const prompt = generateSystemPrompt(parserConfig);
}
```

Exported parser config items:

| Export | Purpose |
| --- | --- |
| `defaultParserConfig` | Default config values. |
| `parserConfigSchemaDefinition` | Field-level metadata for config settings. |
| `parserConfigFields` | Formedible fields for editing parser settings. |
| `parserConfigFormDefinition` | Ready-to-render parser settings form definition. |
| `validateParserConfig(config)` | Runtime guard for `ParserConfig`. |
| `mergeParserConfig(config)` | Merges partial config over defaults. |
| `generateSystemPrompt(config)` | Builds prompt instructions for model output. |

`ParserConfig` settings include:

| Setting | Default | Notes |
| --- | --- | --- |
| `strictValidation` | `true` | Rejects unsupported top-level keys. |
| `enableSchemaInference` | `false` | Asks helper flows to infer schema data. |
| `mergeStrategy` | `extend` | One of `extend`, `override`, or `intersect`. |
| `fieldTypeValidation` | `true` | Keeps model output within supported fields. |
| `customInstructions` | `undefined` | Extra prompt constraints. |
| `maxCodeLength` | `1000000` | Prompt-facing limit in parser config. |
| `maxNestingDepth` | `50` | Prompt-facing nesting limit. |
| `enableZodParsing` | `true` | Allows inert Zod expression parsing. |
| `showDetailedErrors` | `true` | Keeps detailed error output enabled. |
| `selectFields` | `false` | Enables field selection in config UIs. |
| `systemPromptFields` | built-in list | Field types included in generated prompts. |
| `includeTabFormatting` | `true` | Adds tab guidance to generated prompts. |
| `includePageFormatting` | `true` | Adds page guidance to generated prompts. |

## Extraction rules

AI-generated forms should use a lowercase `formedible` fence:

````md
```formedible
{
  fields: [
    { name: 'name', type: 'text', label: 'Name' }
  ],
  formOptions: {
    defaultValues: { name: '' }
  }
}
```
````

`extractFormedibleCode` only extracts that fence. Other code fences are rejected by `parseAiOutput` because they often invite code instead of data.

For direct input, the text must start with `{`. Plain chat text without a form returns `success: false`, `source: 'none'`, and no errors.
