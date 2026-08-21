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
