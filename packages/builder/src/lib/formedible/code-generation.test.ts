import assert from 'node:assert/strict';
import test from 'node:test';

import type { FormedibleFieldConfig, FormedibleFormValues } from '@/components/formedible/lib/types';
import { generateFormCode } from '@/lib/formedible/code-generation';

type ArrayItemType = NonNullable<FormedibleFieldConfig<FormedibleFormValues>['arrayConfig']>['itemType'];

function textField(name: string): FormedibleFieldConfig<FormedibleFormValues> {
  return { name, type: 'text', label: name };
}

function arrayField(itemType: ArrayItemType): FormedibleFieldConfig<FormedibleFormValues> {
  return { name: 'items', type: 'array', label: 'Items', arrayConfig: { itemType } };
}

function schemaFor(fields: readonly FormedibleFieldConfig<FormedibleFormValues>[]): string {
  return generateFormCode({ fields }).schemaCode;
}

test('generateFormCode keeps plain identifier field names unquoted', () => {
  assert.equal(schemaFor([textField('firstName')]), 'z.object({\n  firstName: z.string().optional()\n})');
});

test('generateFormCode quotes schema keys for spaced and hyphenated field names', () => {
  assert.equal(
    schemaFor([textField('First Name')]),
    'z.object({\n  ["First Name"]: z.string().optional()\n})',
  );
  assert.equal(
    schemaFor([textField('first-name')]),
    'z.object({\n  ["first-name"]: z.string().optional()\n})',
  );
});

test('generateFormCode neutralizes schema injection payloads in field names', () => {
  const payload = 'a: z.string(), backdoor: z.any(), b';

  assert.equal(
    schemaFor([textField(payload)]),
    'z.object({\n  ["a: z.string(), backdoor: z.any(), b"]: z.string().optional()\n})',
  );
});

test('generateFormCode escapes quote breakout attempts inside injected field names', () => {
  const payload = 'x": z.any(), "y';

  assert.equal(
    schemaFor([textField(payload)]),
    'z.object({\n  ["x\\": z.any(), \\"y"]: z.string().optional()\n})',
  );
});

test('generateFormCode rejects field names containing line breaks', () => {
  assert.throws(
    () => schemaFor([textField('bad\nname')]),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /line breaks/);
      assert.ok(error.message.includes('"bad\\nname"'), 'the error must echo the offending name in JSON form');
      return true;
    },
  );
  assert.throws(() => schemaFor([textField('bad\rname')]), /line breaks/);
});

test('generateFormCode maps arrayConfig.itemType onto the zod item schema', () => {
  const cases: readonly [ArrayItemType, string][] = [
    ['string', 'z.array(z.string())'],
    ['text', 'z.array(z.string())'],
    ['email', 'z.array(z.string())'],
    ['number', 'z.array(z.number())'],
    ['checkbox', 'z.array(z.boolean())'],
    ['switch', 'z.array(z.boolean())'],
    ['object', 'z.array(z.record(z.string(), z.unknown()))'],
    [undefined, 'z.array(z.string())'],
  ];

  for (const [itemType, expectedItemSchema] of cases) {
    const schemaCode = schemaFor([arrayField(itemType)]);

    assert.equal(
      schemaCode,
      `z.object({\n  items: ${expectedItemSchema}.optional()\n})`,
      `itemType ${String(itemType)} must emit ${expectedItemSchema}`,
    );
  }
});

test('generateFormCode still emits string arrays for multiSelect fields', () => {
  assert.equal(
    schemaFor([{ name: 'tags', type: 'multiSelect', label: 'Tags' }]),
    'z.object({\n  tags: z.array(z.string()).optional()\n})',
  );
});
