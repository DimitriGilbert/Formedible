import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultParserConfig, extractFormedibleCode, FormedibleParser, supportedFieldTypeInfo, supportedFieldTypes } from '@/index';

describe('FormedibleParser', () => {
  it('parses JSON input through the public parser', () => {
    const parsed = FormedibleParser.parse(`{
      "fields": [
        { "name": "firstName", "type": "text", "label": "First Name", "required": true },
        { "name": "age", "type": "number", "min": 0, "max": 120 }
      ],
      "submitLabel": "Create"
    }`);

    assert.equal(parsed.fields.length, 2);
    assert.equal(parsed.fields[0]?.name, 'firstName');
    assert.equal(parsed.submitLabel, 'Create');
  });

  it('parses object literal input with single quotes and trailing commas', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'email', type: 'email', label: 'Email Address', required: true, },
      ],
    }`);

    assert.equal(parsed.fields[0]?.type, 'email');
  });

  it('parses object literals containing inert Zod schema expressions without executing them', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'email', type: 'email' },
        { name: 'count', type: 'number' }
      ],
      schema: z.object({ email: z.string().email(), count: z.number() })
    }`);

    assert.equal(parsed.fields.length, 2);
    const firstField = parsed.fields[0];
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
    assert.equal(result.config?.fields[0]?.name, 'email');
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
    assert.equal(result.config?.fields[0]?.type, 'radio');
    assert.equal(result.config?.fields[1]?.type, 'multiSelect');
    assert.equal(result.config?.fields[2]?.type, 'colorPicker');
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

  it('exports supported field type information and parser config helpers', () => {
    assert.equal(FormedibleParser.isValidFieldType('text'), true);
    assert.equal(FormedibleParser.isValidFieldType('invalid'), false);
    assert.equal(FormedibleParser.getSupportedFieldTypes(), supportedFieldTypes);
    assert.equal(supportedFieldTypeInfo.length, supportedFieldTypes.length);
    assert.equal(defaultParserConfig.strictValidation, true);
  });
});
