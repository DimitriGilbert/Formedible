import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultParserConfig, FormedibleParser, supportedFieldTypeInfo, supportedFieldTypes } from '@/index';

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

  it('parses object literals containing Zod expressions without executing them', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [
        { name: 'email', type: 'email', validation: z.string().email().min(3) },
        { name: 'count', type: 'number', validation: z.number().min(1).max(5) }
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

  it('sanitizes unsafe executable input and unknown keys', () => {
    const parsed = FormedibleParser.parse(`{
      fields: [{ name: 'safe', type: 'text', conditional: () => process.exit(1) }],
      onSubmit: (data) => window.alert(data),
      dangerous: require('fs')
    }`);

    assert.equal(parsed.fields.length, 1);
    const firstField = parsed.fields[0];
    assert.ok(firstField);
    assert.equal('conditional' in firstField, false);
    assert.equal('onSubmit' in parsed, false);
    assert.equal('dangerous' in parsed, false);
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
