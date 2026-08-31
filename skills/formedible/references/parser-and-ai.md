# Parser and AI reference — config from text, AI-generated forms

Registry items (each installs its own files and declares its dependencies):

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-parser.json   # parser; needs formedible-core
pnpm dlx shadcn@latest add https://formedible.dev/r/ai-builder.json         # chat UI + parser + visual builder
pnpm dlx shadcn@latest add https://formedible.dev/r/ai-picker.json          # provider/model/key picker
```

`ai-builder` and `ai-picker` additionally depend on `@tanstack/ai`, `@tanstack/ai-openai`, `@tanstack/ai-anthropic`, `@tanstack/ai-openrouter`, `react-markdown`, `remark-gfm`, `rehype-highlight` (installed by the registry command).

## FormedibleParser — text to reviewed config

Import from `@/components/ui/formedible/lib/formedible-parser` and `@/components/ui/formedible/lib/parser-config-schema` after install.

```ts
import { FormedibleParser } from '@/components/ui/formedible/lib/formedible-parser';
import { defaultParserConfig } from '@/components/ui/formedible/lib/parser-config-schema';
```

| Method | Returns | Behavior |
| --- | --- | --- |
| `FormedibleParser.parse(code, options?)` | `ParsedFormConfig` (throws `ParserError`) | Parses JSON or object-literal config text; rejects executable syntax first |
| `FormedibleParser.parseStructured(output, options?)` | `ParsedFormConfig` (throws) | Structured (non-string) model output; clones serializable values, then validates |
| `FormedibleParser.parseAiOutput(output, options?)` | `FormedibleParseResult` | Non-throwing: `{ success, config?, code?, source, errors }` with `source: 'structured' \| 'fenced' \| 'direct' \| 'none'` |
| `FormedibleParser.parseWithSchemaInference(code, options?)` | `{ config, inferredSchema?, confidence }` | Infers a schema shape from field types and min/max when `options.enabled` |
| `FormedibleParser.mergeSchemas(parsedConfig, baseSchema, strategy?)` | `UseFormedibleOptions` | `'extend'` (default) / `'override'` / `'intersect'` |
| `FormedibleParser.validateWithSuggestions(code)` | `{ isValid, errors, suggestions }` | Parse errors plus fix suggestions |

Other exports: `extractFormedibleCode`, `supportedFieldTypes`, `supportedFieldTypeInfo`, `version`, `defaultParserConfig`, `mergeParserConfig`, `validateParserConfig`, `generateSystemPrompt`, `parserConfigFields`.

````ts
const aiText = 'Some assistant prose...\n```formedible\n{"fields":[{"name":"email","type":"email","label":"Email","required":true}]}\n```';

const result = FormedibleParser.parseAiOutput(aiText);

if (result.success && result.config) {
  // ParsedFormConfig = UseFormedibleOptions<FormedibleFormValues> & { title?, description? }
  const options = result.config;

  const emailForm = useFormedible(options);   // render like any config
  return <emailForm.Form />;
}

console.error(result.errors);   // EnhancedParserError[] with code, field?, line?, column?, suggestion?
````

### Fence and security rules

- Only a lowercase ` ```formedible ` fence extracts; ` ```json `, ` ```ts `, ` ```tsx `, ` ```typescript `, ` ```javascript `, ` ```js ` fences return a validation error telling the model to use ` ```formedible `. Text starting with `{` parses directly (`source: 'direct'`).
- Rejected before parsing: arrow functions, function expressions, classes, constructors, `eval`, `Function`, timers, `require`, dynamic imports, capitalized JSX-like markup.
- Rejected config keys: `component`, `render`, `children`, `onChange`, `onBlur`, `onFocus`, `onSubmit`, `conditional` (functions cannot be expressed in generated text — use schema-level rules or re-add conditionals in app code).
- `sanitizeField` rejects unsupported field keys and unsupported field types; `strictValidation: true` (default) rejects unsupported top-level keys instead of skipping them.
- Type aliases accepted (normalized in every parse path, then validated): `radio-group`/`radioGroup` → `radio`, `checkbox-group`/`checkboxGroup` → `multiSelect`, `multiselect`/`multi-select` → `multiSelect`, `text-area` → `textarea`, `number-input` → `number`, `date-picker` → `date`, `file-upload` → `file`, `color-picker`/`color` → `colorPicker`, `telephone` → `phone`.
- The parser's type set is narrower than the runtime's: `combobox` and `multiCombobox` are missing from `supportedFieldTypes` and no alias maps to them, so configs using `type: 'multiCombobox'`/`'multicombobox'`, `'maskedInput'`, or `'combobox'` are rejected with `UNSUPPORTED_FIELD_TYPE` — the first two are aliases the runtime normalizes and `combobox` is a runtime type the parser simply lacks. (Color inverts: the parser canonicalizes on `colorPicker`, the runtime on `color` — parsed output still renders.)

### ParserConfig

`defaultParserConfig` values: `strictValidation: true`, `enableSchemaInference: false`, `mergeStrategy: 'extend'`, `fieldTypeValidation: true`, `maxCodeLength: 1_000_000`, `maxNestingDepth: 50`, `enableZodParsing: true`, `showDetailedErrors: true`, `selectFields: false`, `includeTabFormatting: true`, `includePageFormatting: true`. Use `mergeParserConfig(partial)` for overrides, `validateParserConfig(config)` to check one, `generateSystemPrompt(config)` to build the model prompt.

`ParserOptions` (per call): `strictValidation`, `allowedKeys`, `allowedFieldTypes`, `allowedFieldKeys`, `allowedPageKeys`, `allowedProgressKeys`, `allowedFormOptionsKeys`, `maxNestingDepth`. `EnhancedParserOptions` adds `baseSchema` (merged per `mergeStrategy` during validation).

## AI Builder — chat that generates forms

BYOK: keys live in the browser (or your controlled state), never a server. Providers: `openai`, `anthropic`, `openrouter` — all require an API key; custom endpoints/`baseURL` are rejected. Default models: `gpt-5.4-mini`, `claude-sonnet-4-6`, `minimax/minimax-2.7`. `thinkingBudgetTokens` is Anthropic-only.

```tsx
import { AIBuilder } from '@/components/ui/formedible/ai/ai-builder';

export function DraftForms() {
  return (
    <AIBuilder
      mode="client"                       // only 'client' exists
      onFormGenerated={(formCode) => console.log('generated', formCode)}
      onFormSubmit={(formData) => console.log('submitted', formData)}
    />
  );
}
```

`AIBuilderProps`: `className?`, `mode?`, `providerSettings?` / `providerSecrets?` (controlled — persistence is skipped while controlled) plus `onProviderSettingsChange` / `onProviderSecretsChange`, `onFormGenerated?(formCode)`, `onFormSubmit?(formData)`. Uncontrolled state persists under storage keys `formedible-ai-builder-provider-settings`, `formedible-ai-builder-provider-secrets` (memory/session/local modes; `rememberKey: false` stores the preference but not the key), `formedible-ai-builder-model-catalogs`, `formedible-ai-builder-conversations`, `formedible-ai-builder-ui-state`.

Helper exports (from the ai-builder root): `createDefaultProviderSettings`, `createDefaultProviderSecrets`, `providerOptions`, `validateProviderAccess(settings, secrets): string | undefined`, `createTanStackTextAdapter(settings, secrets)`, `SUPPORTED_TANSTACK_AI_PROVIDERS`, `DEFAULT_TANSTACK_AI_MODELS`, plus storage helpers (`readPersistedAIBuilderState`, `persistConversations`, `exportConversation`, `STORAGE_KEYS`, ...).

### Render a generated form yourself

`parseAiToFormedible(code, parserConfig?)` returns `{ success, schema?, formOptions, errors }`; on success it also infers `defaultValues` (booleans → `false`, numbers → `0`, multi-select/array → `[]`, object/location → `{}`, others → `''`) unless `parserConfig.inferDefaultValues === false`. `AiFormRenderer` wires it for you:

```tsx
import { AiFormRenderer } from '@/components/ui/formedible/ai/ai-form-renderer';

<AiFormRenderer
  code={formCode}
  isStreaming={false}
  onParseComplete={(result) => result.success === false && console.error(result.errors)}
  onSubmit={(formData) => saveForm(formData)}
/>
```

Streaming flow: `ChatInterface` streams one assistant message, extracts the ` ```formedible ` fence when the stream completes, parses it, stores `formConfig` or `parseErrors` on the message, and calls `onFormGenerated(formCode)`. Generated config is draft output — always review before shipping.

## AI Picker — standalone provider/model/key picker

```tsx
import { AiPicker, valuesToSettings, valuesToSecrets } from '@/components/ui/ai-picker';

const [settings, setSettings] = useState<ProviderSettings | null>(null);
const [secrets, setSecrets] = useState<ProviderSecrets | null>(null);

<AiPicker
  variant="panel"                 // 'panel' | 'popover'
  settings={settings ?? undefined}
  secrets={secrets ?? undefined}
  onChange={(nextSettings, nextSecrets) => {
    setSettings(nextSettings);
    setSecrets(nextSecrets);
  }}
  persistencePreference={{ mode: 'session', rememberKey: true }}
  onClearStoredSecrets={() => console.log('cleared')}
  onFetchModels={async (provider, apiKey) => fetchCatalog(provider, apiKey)}
/>
```

`ProviderSettings` is a discriminated union on `provider` (`openai` | `anthropic` | `openrouter`) with `model`, `temperature?`, `maxTokens?`, and `thinkingBudgetTokens?` (Anthropic only); `ProviderSecrets` is `{ provider, apiKey }`. Also exported: `AiPickerPanel`, `AiPickerPopover`, `ModelAutocompleteField`, `settingsToValues`.

## Visual builder (non-AI)

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/form-builder.json
```

Exports (from `@/components/ui/formedible/builder` after install): `FormBuilder`, `FieldConfigurator`, `FormPreview`, `CodeGenerator`, `FieldStore`/`globalFieldStore`, `defaultTabs` (builder/preview/code) plus tab helpers, and `generateFormCode({ title, fields, settings })` → `{ fullCode, formConfig, schemaCode }` — a full component string plus the config and schema used by `useFormedible`.
