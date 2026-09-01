import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultParserConfig, extractFormedibleCode, FormedibleParser, supportedFieldTypeInfo, supportedFieldTypes } from '@/index';
import type { ParserError } from '@/index';

describe('FormedibleParser', () => {
  it('parses JSON input through the public parser', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [
        { "name": "firstName", "type": "text", "label": "First Name", "required": true },
        { "name": "age", "type": "number", "min": 0, "max": 120 }
      ],
      "submitLabel": "Create"
    }`);

    assert.equal(parsed.fields?.length, 2);
    assert.equal(parsed.fields?.[0]?.name, 'firstName');
    assert.equal(parsed.submitLabel, 'Create');
  });

  it('parses object literal input with single quotes and trailing commas', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'email', type: 'email', label: 'Email Address', required: true, },
      ],
    }`);

    assert.equal(parsed.fields?.[0]?.type, 'email');
  });

  it('parses object literals containing inert Zod schema expressions without executing them', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'email', type: 'email' },
        { name: 'count', type: 'number' }
      ],
      schema: z.object({ email: z.string().email(), count: z.number() })
    }`);

    assert.equal(parsed.fields?.length, 2);
    const firstField = parsed.fields?.[0];
    assert.ok(firstField);
    assert.equal('validation' in firstField, false);
    assert.equal('schema' in parsed, false);
  });

  it('preserves safe JSON schema objects', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [{ "name": "email", "type": "email" }],
      "schema": {
        "type": "object",
        "properties": {
          "email": { "type": "string", "format": "email" }
        },
        "required": ["email"]
      }
    }`);

    assert.deepEqual(parsed.schema, {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
      required: ['email'],
    });
  });

  it('preserves safe object literal schema objects', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [{ name: 'age', type: 'number' }],
      schema: {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18 }
        }
      }
    }`);

    assert.deepEqual(parsed.schema, {
      type: 'object',
      properties: {
        age: { type: 'number', minimum: 18 },
      },
    });
  });

  it('rejects unsafe executable input', () => {
    assert.throws(() => FormedibleParser.parse(`{
      fields: [{ name: 'safe', type: 'text', conditional: () => process.exit(1) }],
      onSubmit: (data) => globalThis.dispatchEvent(data),
      dangerous: require('fs')
    }`), /Executable callbacks|unsupported/i);
  });

  it('rejects constructor calls instead of sanitizing them to null', () => {
    assert.throws(() => FormedibleParser.parse(`{
      fields: [{ name: 'createdAt', type: 'text', defaultValue: new Evil() }]
    }`), /Executable callbacks|constructors/i);

    const result = FormedibleParser.parseAiOutput('```formedible\n{ fields: [{ name: "createdAt", type: "text", defaultValue: new Evil() }] }\n```');

    assert.equal(result.success, false);
    assert.match(result.errors[0]?.message ?? '', /Executable callbacks|constructors/i);
  });

  it('rejects eval and require calls outside string literals', () => {
    assert.throws(() => FormedibleParser.parse(`{
      fields: [{ name: 'danger', type: 'text', defaultValue: eval('1 + 1') }]
    }`), /Executable callbacks/i);

    assert.throws(() => FormedibleParser.parse(`{
      fields: [{ name: 'danger', type: 'text', defaultValue: require('fs') }]
    }`), /Executable callbacks/i);
  });

  it('audits template literal interpolations as executable code', () => {
    assert.throws(() => FormedibleParser.parse(`{
      fields: [{ name: 'greeting', type: 'text', defaultValue: \`hi \${new Evil()}\` }]
    }`), /Executable callbacks|constructors/i);
  });

  it('preserves sensitive identifiers inside string values', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [
        { "name": "note", "type": "text", "label": "Close the window" },
        { "name": "runtime", "type": "textarea", "placeholder": "Calls into document, process, and globalThis APIs" },
        { "name": "shape", "type": "text", "description": "Reads constructor and prototype metadata" }
      ]
    }`);

    assert.equal(parsed.fields?.[0]?.label, 'Close the window');
    assert.equal(parsed.fields?.[1]?.placeholder, 'Calls into document, process, and globalThis APIs');
    assert.equal(parsed.fields?.[2]?.description, 'Reads constructor and prototype metadata');
  });

  it('accepts arrow, JSX-like, and eval prose inside string values', () => {
    const result = FormedibleParser.parseAiOutput(`{
      fields: [
        { name: 'mapping', type: 'text', label: 'key => value' },
        { name: 'tax', type: 'text', label: 'VAT <Included> applies' },
        { name: 'example', type: 'text', label: 'e.g. eval(x) pattern' }
      ]
    }`);

    assert.equal(result.success, true);
    assert.equal(result.config?.fields?.[0]?.label, 'key => value');
    assert.equal(result.config?.fields?.[1]?.label, 'VAT <Included> applies');
    assert.equal(result.config?.fields?.[2]?.label, 'e.g. eval(x) pattern');
  });

  it('parses object literals containing apostrophes, URL double slashes, and escaped quotes', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: "song", type: "text", label: "Don't stop" },
        { name: "docs", type: "url", placeholder: "https://example.com/a//b" },
        { name: "quote", type: "text", label: 'It\\'s fine' },
        { name: "mixed", type: "text", label: 'say "hi" loudly' }
      ]
    }`);

    assert.equal(parsed.fields?.[0]?.label, "Don't stop");
    assert.equal(parsed.fields?.[1]?.placeholder, 'https://example.com/a//b');
    assert.equal(parsed.fields?.[2]?.label, "It's fine");
    assert.equal(parsed.fields?.[3]?.label, 'say "hi" loudly');
  });

  it('allows identifier-collision names as plain field names', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'window', type: 'text' },
        { name: 'constructor', type: 'text' },
        { name: 'document', type: 'text' }
      ]
    }`);

    assert.equal(parsed.fields?.[0]?.name, 'window');
    assert.equal(parsed.fields?.[1]?.name, 'constructor');
    assert.equal(parsed.fields?.[2]?.name, 'document');
  });

  it('rejects empty, whitespace-only, and __proto__ field names with a coded error', () => {
    const isInvalidFieldName = (error: unknown): boolean => (error as ParserError).code === 'INVALID_FIELD_NAME';

    assert.throws(() => FormedibleParser.parse('{ "fields": [{ "name": "", "type": "text" }] }'), isInvalidFieldName);
    assert.throws(() => FormedibleParser.parse('{ "fields": [{ "name": "   ", "type": "text" }] }'), isInvalidFieldName);
    assert.throws(() => FormedibleParser.parse(`{ fields: [{ name: '__proto__', type: 'text' }] }`), isInvalidFieldName);
    assert.throws(() => FormedibleParser.parseStructured({ formedible: { fields: [{ name: '__proto__', type: 'text' }] } }), isInvalidFieldName);
    assert.throws(() => FormedibleParser.parseStructured({ formedible: { fields: [{ name: '', type: 'text' }] } }), isInvalidFieldName);

    const result = FormedibleParser.parseAiOutput('{ "fields": [{ "name": "", "type": "text" }] }');

    assert.equal(result.success, false);
    assert.match(result.errors[0]?.message ?? '', /non-empty name/i);
  });

  it('rejects unsupported keys in strict AI-safe configs', () => {
    assert.throws(() => FormedibleParser.parse(`{
      fields: [{ name: 'safe', type: 'text', component: 'CustomInput' }],
      dangerous: 'value'
    }`), /unsupported/i);
  });

  it('extracts only lowercase formedible fenced blocks from prose', () => {
    const extraction = extractFormedibleCode(`Here is a form:\n\n\`\`\`formedible\n{ fields: [{ name: 'email', type: 'email' }] }\n\`\`\``);

    assert.equal(extraction.source, 'fenced');
    assert.match(extraction.code ?? '', /fields/);

    const wrongFence = extractFormedibleCode('```json\n{ "fields": [] }\n```');
    assert.equal(wrongFence.source, 'none');
    assert.equal(wrongFence.errors.length, 1);
  });

  it('parses structured object output before fenced or direct string parsing', () => {
    const result = FormedibleParser.parseAiOutput({
      formedible: {
        fields: [{ name: 'email', type: 'email', label: 'Email' }],
        submitLabel: 'Send',
        formOptions: { defaultValues: { email: '' } },
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.source, 'structured');
    assert.equal(result.config?.fields?.[0]?.name, 'email');
  });

  it('returns detailed parse errors without throwing from AI output parsing', () => {
    const result = FormedibleParser.parseAiOutput('```formedible\n{ fields: [{ name: 1, type: "wat" }] }\n```');

    assert.equal(result.success, false);
    assert.equal(result.errors.length, 1);
    assert.match(result.errors[0]?.message ?? '', /name|type|field/i);
  });

  it('classifies unsupported field types as field_type with the supported-types suggestion', () => {
    const result = FormedibleParser.parseAiOutput('{ "fields": [{ "name": "magic", "type": "bogus" }] }');

    assert.equal(result.success, false);
    assert.equal(result.errors[0]?.type, 'field_type');
    assert.match(result.errors[0]?.message ?? '', /invalid type 'bogus'/);
    assert.equal(result.errors[0]?.suggestion, `Use one of the supported field types: ${supportedFieldTypes.join(', ')}`);
  });

  it('keeps classifying disallowed field types as field_type', () => {
    const result = FormedibleParser.parseAiOutput('{ "fields": [{ "name": "pick", "type": "select" }] }', { allowedFieldTypes: ['text'] });

    assert.equal(result.success, false);
    assert.equal(result.errors[0]?.type, 'field_type');
    assert.match(result.errors[0]?.message ?? '', /not allowed/);
    assert.match(result.errors[0]?.suggestion ?? '', /supported field types/);
  });

  it('normalizes common UI field type aliases before validation', () => {
    const result = FormedibleParser.parseAiOutput(`{
      fields: [
        { name: 'visitType', type: 'radio-group', label: 'Visit type', options: [{ value: 'dine_in', label: 'Dine in' }] },
        { name: 'features', type: 'multi-select', label: 'Features', options: [{ value: 'speed', label: 'Speed' }] },
        { name: 'favoriteColor', type: 'color-picker', label: 'Favorite color' }
      ],
      formOptions: { defaultValues: { visitType: 'dine_in', features: [], favoriteColor: '#f59e0b' } }
    }`);

    assert.equal(result.success, true);
    assert.equal(result.config?.fields?.[0]?.type, 'radio');
    assert.equal(result.config?.fields?.[1]?.type, 'multiSelect');
    assert.equal(result.config?.fields?.[2]?.type, 'colorPicker');
  });

  it('preserves supported field config objects such as numberConfig', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'partySize', type: 'number', label: 'Party size', min: 1, max: 12, numberConfig: { min: 1, max: 12, step: 1 } },
        { name: 'comments', type: 'textarea', label: 'Comments', textareaConfig: { showWordCount: true } }
      ],
      formOptions: { defaultValues: { partySize: 2, comments: '' } }
    }`);

    assert.deepEqual(parsed.fields?.[0]?.numberConfig, { min: 1, max: 12, step: 1 });
    assert.deepEqual(parsed.fields?.[1]?.textareaConfig, { showWordCount: true });
  });

  it('preserves serializable canonical field metadata keys', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        {
          name: 'phone',
          type: 'masked',
          label: 'Phone',
          mask: '(999) 999-9999',
          help: { text: 'Use your best contact number.' },
          datalist: [{ value: 'home', label: 'Home' }],
          optionSets: {
            country: [{ value: 'us', label: 'United States' }]
          }
        }
      ],
      formOptions: { defaultValues: { phone: '' } }
    }`);

    assert.equal(parsed.fields?.[0]?.mask, '(999) 999-9999');
    assert.deepEqual(parsed.fields?.[0]?.help, { text: 'Use your best contact number.' });
    assert.deepEqual(parsed.fields?.[0]?.datalist, [{ value: 'home', label: 'Home' }]);
    assert.deepEqual(parsed.fields?.[0]?.optionSets, { country: [{ value: 'us', label: 'United States' }] });
  });

  it('infers schema information from field definitions', () => {
    const result = FormedibleParser.parseWithSchemaInference(`{
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'age', type: 'number', min: 18, max: 99 },
        { name: 'tags', type: 'multiSelect', required: false }
      ]
    }`, { enabled: true });

    assert.deepEqual(result.inferredSchema, {
      type: 'object',
      properties: {
        email: 'z.string().email()',
        age: 'z.number().min(18).max(99)',
        tags: 'z.array(z.string()).optional()',
      },
      isInferred: true,
    });
    assert.equal(result.confidence > 0.5, true);
  });

  it('round-trips direct structured configs including formOptions', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [{ "name": "email", "type": "email", "label": "Email" }],
      "formOptions": { "defaultValues": { "email": "" } },
      "submitLabel": "Send"
    }`);

    const roundTripped = FormedibleParser.parseStructured(parsed);

    assert.equal(roundTripped.fields?.[0]?.name, 'email');
    assert.equal(roundTripped.submitLabel, 'Send');
    assert.deepEqual(roundTripped.formOptions, { defaultValues: { email: '' } });

    const direct = FormedibleParser.parseStructured({
      fields: [{ name: 'email', type: 'email' }],
      formOptions: { defaultValues: { email: '' } },
    });

    assert.equal(direct.fields?.[0]?.name, 'email');
    assert.deepEqual(direct.formOptions, { defaultValues: { email: '' } });
  });

  it('rejects nesting beyond maxNestingDepth with a coded error and honors custom limits', () => {
    const isNestingDepthError = (error: unknown): boolean => (error as ParserError).code === 'EXCEEDS_MAX_NESTING_DEPTH';

    const buildNestedValue = (depth: number): unknown => {
      let value: unknown = { leaf: true };

      for (let level = 0; level < depth; level += 1) {
        value = { nested: value };
      }

      return value;
    };

    const deepCode = (depth: number): string => `{"fields":[{"name":"deep","type":"text","defaultValue":${JSON.stringify(buildNestedValue(depth))}}]}`;

    assert.throws(() => FormedibleParser.parse(deepCode(100)), isNestingDepthError);

    assert.throws(
      () => FormedibleParser.parseStructured({ fields: [{ name: 'deep', type: 'text', defaultValue: buildNestedValue(100) }] }),
      isNestingDepthError,
    );

    assert.throws(() => FormedibleParser.parse(deepCode(30), { maxNestingDepth: 20 }), isNestingDepthError);

    const customLimit = FormedibleParser.parse(deepCode(100), { maxNestingDepth: 150 });
    assert.equal(customLimit.fields?.[0]?.name, 'deep');

    const shallow = FormedibleParser.parse(deepCode(10));
    assert.equal(shallow.fields?.[0]?.name, 'deep');
  });

  it('maps stack-overflowing input to the coded nesting error across public entry points', () => {
    const isNestingDepthError = (error: unknown): boolean => (error as ParserError).code === 'EXCEEDS_MAX_NESTING_DEPTH';
    const megaDeep = `{"fields":[{"name":"deep","type":"text","defaultValue":${'{"a":'.repeat(100000)}1${'}'.repeat(100000)}}]}`;

    assert.throws(() => FormedibleParser.parse(megaDeep), isNestingDepthError);

    const result = FormedibleParser.parseAiOutput(megaDeep);

    assert.equal(result.success, false);
    assert.match(result.errors[0]?.message ?? '', /nesting depth/i);

    let structuredDeep: unknown = { leaf: true };
    for (let level = 0; level < 100000; level += 1) {
      structuredDeep = { nested: structuredDeep };
    }

    const validationResult = FormedibleParser.validateConfig({ fields: [{ name: 'deep', type: 'text', defaultValue: structuredDeep }] });
    assert.equal(validationResult.isValid, false);
    assert.match(validationResult.errors[0] ?? '', /nesting depth/i);

    assert.throws(() => FormedibleParser.parseStructured({ formedible: { fields: [{ name: 'deep', type: 'text', defaultValue: structuredDeep }] } }), isNestingDepthError);
  });

  it('numbers auto-numbered pages 1-based so fields land on the declared page', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [
        { "name": "email", "type": "email", "page": 1 },
        { "name": "comments", "type": "textarea", "page": 2 }
      ],
      "pages": [
        { "title": "Contact" },
        { "title": "Feedback" }
      ]
    }`);

    assert.deepEqual(parsed.pages?.map((page) => page.page), [1, 2]);
    assert.deepEqual(parsed.fields?.map((field) => field.page), [1, 2]);

    const explicit = FormedibleParser.parse(`{
      "fields": [{ "name": "email", "type": "email", "page": 2 }],
      "pages": [{ "page": 2, "title": "Details" }]
    }`);

    assert.deepEqual(explicit.pages?.map((page) => page.page), [2]);
  });

  it('preserves allowlisted class-name options through parsing', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [{ "name": "email", "type": "email" }],
      "formClassName": "space-y-4",
      "fieldClassName": "rounded-lg",
      "labelClassName": "text-sm font-medium",
      "buttonClassName": "px-4 py-2",
      "submitButtonClassName": "font-semibold"
    }`);

    assert.equal(parsed.formClassName, 'space-y-4');
    assert.equal(parsed.fieldClassName, 'rounded-lg');
    assert.equal(parsed.labelClassName, 'text-sm font-medium');
    assert.equal(parsed.buttonClassName, 'px-4 py-2');
    assert.equal(parsed.submitButtonClassName, 'font-semibold');
  });

  it('consumes baseSchema and mergeStrategy during validation', () => {
    const baseSchema = {
      type: 'object',
      properties: {
        email: { type: 'string' },
        age: { type: 'number' },
        newsletter: { type: 'boolean' },
      },
    };

    const extended = FormedibleParser.parse('{ "fields": [{ "name": "email", "type": "email" }] }', { baseSchema, mergeStrategy: 'extend' });

    assert.deepEqual(extended.schema, baseSchema);
    assert.deepEqual(extended.fields?.map((field) => field.name), ['email', 'age', 'newsletter']);
    assert.equal(extended.fields?.[1]?.type, 'number');
    assert.equal(extended.fields?.[2]?.type, 'checkbox');

    const overridden = FormedibleParser.parse('{ "fields": [{ "name": "email", "type": "email" }] }', { baseSchema, mergeStrategy: 'override' });

    assert.deepEqual(overridden.fields?.map((field) => field.name), ['email']);
    assert.deepEqual(overridden.schema, baseSchema);

    const intersected = FormedibleParser.parse(
      '{ "fields": [{ "name": "email", "type": "email" }, { "name": "phone", "type": "phone" }] }',
      { baseSchema, mergeStrategy: 'intersect' },
    );

    assert.deepEqual(intersected.fields?.map((field) => field.name), ['email']);
    assert.deepEqual(intersected.schema, baseSchema);
  });

  it('exports supported field type information and parser config helpers', () => {
    assert.equal(FormedibleParser.isValidFieldType('text'), true);
    assert.equal(FormedibleParser.isValidFieldType('invalid'), false);
    assert.equal(FormedibleParser.getSupportedFieldTypes(), supportedFieldTypes);
    assert.equal(supportedFieldTypeInfo.length, supportedFieldTypes.length);
    assert.equal(defaultParserConfig.strictValidation, true);
  });
});

// ---------------------------------------------------------------------------
// Fast-path / fallback parity and behavior locks (parser performance phase).
//
// The JSON fast path (raw JSON.parse before the assert + sanitize pipeline)
// and the fallback pipeline (one scan feeding the executable-syntax assert and
// the neutralizing sanitize pass, then the object-literal parse) must be
// observably equivalent. All tests below assert BEHAVIOR only — timing
// belongs to the bench suite.
// ---------------------------------------------------------------------------

interface TrickyLabelCase {
  readonly label: string;
  readonly reason: string;
}

const trickyStringValues: readonly TrickyLabelCase[] = [
  { label: 'key => value', reason: 'arrow prose' },
  { label: 'VAT <Included> applies', reason: 'markup-looking suffix' },
  { label: 'e.g. eval(x) pattern', reason: 'eval prose' },
  { label: "Don't stop", reason: 'apostrophe' },
  { label: 'https://example.com/a//b', reason: 'URL double slashes' },
  { label: 'use `backticks` here', reason: 'backticks in a double-quoted string' },
  { label: 'cost is ${amount} total', reason: 'template-looking interpolation' },
  { label: 'see /* inline */ marker', reason: 'block-comment markers' },
  { label: 'trailing // slashes', reason: 'line-comment markers' },
  { label: 'mentions constructor and prototype in prose', reason: 'global-identifier prose' },
  { label: 'a new Date() mention in text', reason: 'constructor prose' },
  { label: 'plain label', reason: 'control' },
];

// Renders the same JSON text the way the fallback pipeline is reached: a
// trailing comma makes raw JSON.parse fail, so the parse runs the full
// one-scan assert + sanitize + object-literal pipeline and must produce the
// same output as the fast path does for the comma-free twin.
function toTrailingCommaTwin(code: string): string {
  return `${code.slice(0, -1)},}`;
}

function buildBenchStyleConfig(fieldCount: number, title: string): Record<string, unknown> {
  const types = ['text', 'email', 'textarea', 'select', 'tel'];
  const fields = Array.from({ length: fieldCount }, (_unused, index) => ({
    name: `field${index + 1}`,
    type: types[index % types.length],
    label: `Field ${String(index + 1).padStart(3, '0')}`,
    placeholder: `Enter field ${index + 1}`,
    required: index % 3 === 0,
    ...(types[index % types.length] === 'select' ? { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] } : {}),
  }));
  const pageCount = Math.ceil(fieldCount / 10);

  return {
    title,
    description: 'Deterministic config for parser parity checks',
    fields: fields.map((field, index) => ({ ...field, page: Math.floor(index / 10) + 1 })),
    pages: Array.from({ length: pageCount }, (_unused, page) => ({
      page: page + 1,
      title: `Part ${page + 1}`,
      description: `Fields ${page * 10 + 1}..${Math.min((page + 1) * 10, fieldCount)}`,
    })),
    formOptions: { defaultValues: Object.fromEntries(fields.map((field) => [field.name, ''])) },
  };
}

function buildDeepValue(depth: number): unknown {
  let value: unknown = { leaf: true };

  for (let level = 0; level < depth; level += 1) {
    value = { nested: value };
  }

  return value;
}

function hasCode(code: string): (error: unknown) => boolean {
  return (candidate: unknown): boolean => (candidate as ParserError).code === code;
}

describe('FormedibleParser fast path and fallback parity', () => {
  it('parses the bench-style configs identically through the fast path and the forced fallback pipeline', () => {
    const configs = [
      buildBenchStyleConfig(5, 'Bench small'),
      buildBenchStyleConfig(25, 'Bench medium'),
      buildBenchStyleConfig(100, 'Bench large'),
    ];

    for (const config of configs) {
      const json = JSON.stringify(config);
      const fastPath = FormedibleParser.parse(json);
      const fallback = FormedibleParser.parse(toTrailingCommaTwin(json));

      assert.deepEqual(fastPath, fallback);
      assert.equal(fastPath.fields?.length, (config.fields as unknown[]).length);
    }
  });

  it('keeps tricky string values byte-identical on both paths', () => {
    for (const { label } of trickyStringValues) {
      const config = {
        fields: [{ name: 'note', type: 'text', label }],
        formOptions: { defaultValues: { note: label } },
      };
      const json = JSON.stringify(config);
      const fastPath = FormedibleParser.parse(json);
      const fallback = FormedibleParser.parse(toTrailingCommaTwin(json));

      assert.deepEqual(fastPath, fallback);
      assert.equal(fastPath.fields?.[0]?.label, label);
      assert.deepEqual(fallback.formOptions, { defaultValues: { note: label } });
    }
  });

  it('agrees on __proto__ default-value rejection and legal deep values on both paths', () => {
    // Written as raw JSON text: an object literal `{ __proto__: ... }` would
    // set a prototype instead of an own key and JSON.stringify would drop it.
    const protoConfig = '{"fields":[{"name":"hostile","type":"text","defaultValue":{"__proto__":"nope"}}]}';

    assert.throws(() => FormedibleParser.parse(protoConfig), hasCode('UNSUPPORTED_CONFIG_KEY'));
    assert.throws(() => FormedibleParser.parse(toTrailingCommaTwin(protoConfig)), hasCode('UNSUPPORTED_CONFIG_KEY'));

    const deepConfig = JSON.stringify({
      fields: [{ name: 'deep', type: 'text', defaultValue: buildDeepValue(40) }],
    });
    const fastDeep = FormedibleParser.parse(deepConfig);
    const fallbackDeep = FormedibleParser.parse(toTrailingCommaTwin(deepConfig));

    assert.deepEqual(fastDeep, fallbackDeep);
    assert.deepEqual(fastDeep.fields?.[0]?.defaultValue, buildDeepValue(40));
  });

  it('deep-equals fast path and forced fallback across a seeded generated corpus', () => {
    let state = 0x2f6e2b1 >>> 0;
    const nextRandom = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };

    const types = ['text', 'email', 'textarea', 'select', 'number', 'checkbox'];
    const pick = <T>(values: readonly T[]): T => values[Math.floor(nextRandom() * values.length)] as T;
    const defaultOf = (type: string): string | number | boolean => {
      if (type === 'checkbox') {
        return false;
      }

      if (type === 'number') {
        return 0;
      }

      return '';
    };

    for (let iteration = 0; iteration < 200; iteration += 1) {
      const fieldCount = 1 + Math.floor(nextRandom() * 8);
      const fields = Array.from({ length: fieldCount }, (_unused, index) => {
        const type = pick(types);
        const label = pick(trickyStringValues).label;

        return {
          name: `generated${index}`,
          type,
          label,
          ...(type === 'select' ? { options: [{ value: 'a', label: 'A' }] } : {}),
          ...(nextRandom() < 0.5 ? { required: true } : {}),
          ...(nextRandom() < 0.3 ? { page: 1 } : {}),
          ...(nextRandom() < 0.3 ? { tab: 'main' } : {}),
          ...(type === 'number' ? { min: 0, max: 10 } : {}),
        };
      });

      const config = {
        title: pick(trickyStringValues).label,
        fields,
        tabs: [{ id: 'main', label: 'Main' }],
        formOptions: { defaultValues: Object.fromEntries(fields.map((field) => [field.name, defaultOf(field.type)])) },
      };
      const json = JSON.stringify(config);

      assert.deepEqual(FormedibleParser.parse(json), FormedibleParser.parse(toTrailingCommaTwin(json)), `corpus mismatch at iteration ${iteration}`);
    }
  });
});

describe('FormedibleParser error shapes across the fast path decision', () => {
  it('surfaces SYNTAX_ERROR for non-record JSON instead of accepting or crashing', () => {
    const nonRecordInputs = ['[1,2]', '42', 'null', 'true', '"str"'];

    for (const input of nonRecordInputs) {
      assert.throws(() => FormedibleParser.parse(input), (error: unknown): boolean => {
        const parserError = error as ParserError;
        return parserError.code === 'SYNTAX_ERROR' && parserError.message === 'Invalid syntax. Use JSON or a JavaScript object literal.';
      });
      assert.throws(() => FormedibleParser.parseStructured({ output: input }), hasCode('SYNTAX_ERROR'));

      // parseAiOutput gates non-'{'-prefixed input upstream, so these never
      // reach parse() through that entry point.
      const result = FormedibleParser.parseAiOutput(input);

      assert.equal(result.success, false);
      assert.equal(result.source, 'none');
      assert.equal(result.errors.length, 0);
    }
  });

  it('rejects executable object literals with EXECUTABLE_INPUT before any neutralization', () => {
    const executableInputs = [
      '{ fields: [{ name: "a", type: "text", defaultValue: new Evil() }] }',
      '{ fields: [{ name: "a", type: "text", conditional: () => process.exit(1) }] }',
      '{ fields: [{ name: "a", type: "text", dangerous: eval("1 + 1") }] }',
    ];

    for (const input of executableInputs) {
      assert.throws(() => FormedibleParser.parse(input), hasCode('EXECUTABLE_INPUT'));

      const result = FormedibleParser.parseAiOutput(input);

      assert.equal(result.success, false);
      assert.match(result.errors[0]?.message ?? '', /Executable callbacks/);
    }
  });

  it('treats fenced input passed to parse as SYNTAX_ERROR, not as a config', () => {
    const fencedInputs = ['```formedible\n{ fields: [] }\n```', '```json\n{ "fields": [] }\n```'];

    for (const input of fencedInputs) {
      assert.throws(() => FormedibleParser.parse(input), hasCode('SYNTAX_ERROR'));
      assert.throws(() => FormedibleParser.parseStructured({ output: input }), hasCode('SYNTAX_ERROR'));
    }

    // The fenced-block extractor remains the supported route for fenced input.
    const extracted = FormedibleParser.parseAiOutput('```formedible\n{ fields: [{ name: "email", type: "email" }] }\n```');

    assert.equal(extracted.success, true);
    assert.equal(extracted.source, 'fenced');
    assert.equal(extracted.config?.fields?.[0]?.name, 'email');
  });

  it('maps fast-path stack overflow and depth-limit breaches to EXCEEDS_MAX_NESTING_DEPTH', () => {
    const megaDeep = `{"fields":[{"name":"deep","type":"text","defaultValue":${'{"a":'.repeat(100000)}1${'}'.repeat(100000)}}]}`;

    assert.throws(() => FormedibleParser.parse(megaDeep), hasCode('EXCEEDS_MAX_NESTING_DEPTH'));

    const deepCode = (depth: number): string => `{"fields":[{"name":"deep","type":"text","defaultValue":${JSON.stringify(buildDeepValue(depth))}}]}`;

    assert.throws(() => FormedibleParser.parse(deepCode(100)), hasCode('EXCEEDS_MAX_NESTING_DEPTH'));
    assert.throws(() => FormedibleParser.parse(deepCode(30), { maxNestingDepth: 20 }), hasCode('EXCEEDS_MAX_NESTING_DEPTH'));
    assert.equal(FormedibleParser.parse(deepCode(30), { maxNestingDepth: 60 }).fields?.[0]?.name, 'deep');
  });
});

describe('FormedibleParser type alias and fallback behavior locks', () => {
  it('applies the full alias map and rejects unsupported types on the JSON fast path', () => {
    const aliasEntries: ReadonlyArray<readonly [string, string]> = [
      ['radio-group', 'radio'],
      ['radioGroup', 'radio'],
      ['checkbox-group', 'multiSelect'],
      ['checkboxGroup', 'multiSelect'],
      ['multiselect', 'multiSelect'],
      ['multi-select', 'multiSelect'],
      ['text-area', 'textarea'],
      ['number-input', 'number'],
      ['date-picker', 'date'],
      ['file-upload', 'file'],
      ['color-picker', 'colorPicker'],
      ['color', 'colorPicker'],
      ['telephone', 'phone'],
    ];

    const json = JSON.stringify({
      fields: aliasEntries.map(([alias], index) => ({ name: `alias${index}`, type: alias })),
    });
    const parsed = FormedibleParser.parse(json);

    assert.deepEqual(
      parsed.fields?.map((field) => field.type),
      aliasEntries.map(([, canonical]) => canonical),
    );

    // The string branch of parseStructured shares the fast path.
    const structured = FormedibleParser.parseStructured({ output: json });

    assert.deepEqual(
      structured.fields?.map((field) => field.type),
      aliasEntries.map(([, canonical]) => canonical),
    );

    for (const unsupported of ['combobox', 'multiCombobox', 'multicombobox', 'maskedInput', 'not-a-type']) {
      assert.throws(
        () => FormedibleParser.parse(JSON.stringify({ fields: [{ name: 'field', type: unsupported }] })),
        hasCode('UNSUPPORTED_FIELD_TYPE'),
      );
    }
  });

  it('neutralizes bare global identifiers in object literals on the fallback path', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'ownerDocument', type: 'text', defaultValue: document },
        { name: 'globalHandle', type: 'text', defaultValue: window }
      ]
    }`);

    assert.equal(parsed.fields?.[0]?.defaultValue, null);
    assert.equal(parsed.fields?.[1]?.defaultValue, null);
  });

  it('parses mixed object-literal input through the single-scan fallback with golden outputs', () => {
    const parsed = FormedibleParser.parse(`{
      // contact section
      title: 'Contact us',
      fields: [
        { name: 'email', type: 'email', label: 'Email', required: true, },
        { name: 'scale', type: 'number', numberConfig: { min: 1, max: 5, step: 1 } },
        { name: 'stamp', type: 'text', defaultValue: document }
      ],
      schema: z.object({ email: z.string().email() })
    }`);

    assert.equal(parsed.title, 'Contact us');
    assert.deepEqual(parsed.fields?.map((field) => field.name), ['email', 'scale', 'stamp']);
    assert.deepEqual(parsed.fields?.[1]?.numberConfig, { min: 1, max: 5, step: 1 });
    assert.equal(parsed.fields?.[2]?.defaultValue, null);
    assert.equal('schema' in parsed, false);
  });
});

// ---------------------------------------------------------------------------
// Legacy neutralization locks for word-char-prefixed constructor and function
// residue. The executable-syntax assert gates `new` and `function` behind word
// boundaries, so input like `xnew Foo()` or `afunction(x){y}` passes the
// assert; the boundary-less legacy patterns in neutralizeExecutableConstructs
// must still run so this residue neutralizes to `null` and surfaces the legacy
// unsupported-key outcomes (not SYNTAX_ERROR). The outcomes below are the
// pre-fast-path spec.
// ---------------------------------------------------------------------------
describe('FormedibleParser legacy neutralization of word-char-prefixed executable residue', () => {
  it('neutralizes a word-char-prefixed constructor key to the legacy unsupported-key outcome', () => {
    assert.throws(
      () => FormedibleParser.parse(`{ xnew Foo(): 1, fields: [{ name: 'a', type: 'text' }] }`),
      (error: unknown): boolean => {
        const parserError = error as ParserError;
        return parserError.code === 'UNSUPPORTED_TOP_LEVEL_KEY' && parserError.message === `Unsupported top-level key 'xnull'`;
      },
    );
  });

  it('accepts a word-char-prefixed constructor key under strictValidation: false', () => {
    const parsed = FormedibleParser.parse(`{ xnew Foo(): 1, fields: [{ name: 'a', type: 'text' }] }`, { strictValidation: false });

    assert.deepEqual(parsed.fields?.map((field) => field.name), ['a']);
  });

  it('neutralizes a word-char-prefixed function-expression key to the legacy unsupported-key outcome', () => {
    assert.throws(
      () => FormedibleParser.parse(`{ afunction(x){y}: 1, fields: [{ name: 'a', type: 'text' }] }`),
      (error: unknown): boolean => {
        const parserError = error as ParserError;
        return parserError.code === 'UNSUPPORTED_TOP_LEVEL_KEY' && parserError.message === `Unsupported top-level key 'anull'`;
      },
    );
  });

  it('neutralizes word-char-prefixed constructor residue in field position to the legacy field-key outcome', () => {
    assert.throws(
      () => FormedibleParser.parse(`{ fields: [{ name: 'a', type: 'text', xnew Foo(): 1 }] }`),
      (error: unknown): boolean => {
        const parserError = error as ParserError;
        return parserError.code === 'UNSUPPORTED_FIELD_KEY' && parserError.message === `Field at index 0 has unsupported key 'xnull'`;
      },
    );
  });
});
