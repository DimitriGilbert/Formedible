import assert from 'node:assert/strict';
import test from 'node:test';

import type { FormedibleFieldConfig, FormedibleFormValues } from '@/components/formedible/lib/types';
import type { FormField } from '@/lib/formedible/builder-types';
import { getFieldConfigFormDefinition } from '@/lib/formedible/builder-config-registry';

function objectFieldWithNested(nested: readonly FormedibleFieldConfig<FormedibleFormValues>[]): FormField {
  return {
    id: 'field_1',
    name: 'preferences',
    type: 'object',
    label: 'Preferences',
    objectConfig: { layout: 'stack', columns: 1, fields: nested },
  };
}

test('object field updates preserve nested configs the nested editor does not expose', () => {
  const storedNested: FormedibleFieldConfig<FormedibleFormValues> = {
    name: 'priority',
    type: 'select',
    label: 'Priority',
    placeholder: 'Pick one',
    required: true,
    disabled: false,
    description: 'Nested select',
    options: [{ label: 'High', value: 'high' }],
    arrayConfig: { itemType: 'string', sortable: true },
    objectConfig: { layout: 'grid', columns: 2 },
  };
  const field = objectFieldWithNested([storedNested]);
  const definition = getFieldConfigFormDefinition('object');

  const update = definition.toFieldUpdate(
    {
      label: 'Preferences',
      name: 'preferences',
      objectLayout: 'stack',
      objectColumns: 1,
      nestedFields: [{ name: 'priority', type: 'select', label: 'Renamed Priority', placeholder: 'Pick one' }],
    },
    field,
  );

  const nested = (update.objectConfig?.fields ?? [])[0];
  assert.ok(nested !== undefined, 'the edited nested field must survive the update');
  assert.equal(nested.label, 'Renamed Priority', 'the edited label must win');
  assert.deepEqual(nested.options, [{ label: 'High', value: 'high' }]);
  assert.equal(nested.required, true);
  assert.equal(nested.disabled, false);
  assert.equal(nested.description, 'Nested select');
  assert.deepEqual(nested.arrayConfig, { itemType: 'string', sortable: true });
  assert.deepEqual(nested.objectConfig, { layout: 'grid', columns: 2 });
});

test('object field updates keep nested configs aligned when items are reordered', () => {
  const first: FormedibleFieldConfig<FormedibleFormValues> = {
    name: 'alpha',
    type: 'text',
    label: 'Alpha',
    description: 'First nested field',
  };
  const second: FormedibleFieldConfig<FormedibleFormValues> = {
    name: 'beta',
    type: 'number',
    label: 'Beta',
    required: true,
  };
  const field = objectFieldWithNested([first, second]);
  const definition = getFieldConfigFormDefinition('object');

  const update = definition.toFieldUpdate(
    {
      label: 'Preferences',
      name: 'preferences',
      objectLayout: 'stack',
      objectColumns: 1,
      nestedFields: [
        { name: 'beta', type: 'number', label: 'Beta' },
        { name: 'alpha', type: 'text', label: 'Alpha' },
      ],
    },
    field,
  );

  const nested = update.objectConfig?.fields ?? [];
  assert.deepEqual(nested.map((item) => item.name), ['beta', 'alpha']);
  assert.equal(nested[0]?.required, true, 'reordered beta must keep its own config');
  assert.equal(nested[0]?.description, undefined, 'beta never had a description');
  assert.equal(nested[1]?.description, 'First nested field', 'reordered alpha must keep its own config');
  assert.equal(nested[1]?.required, undefined, 'alpha never had required');
});

test('object field updates drop a cleared nested placeholder', () => {
  const field = objectFieldWithNested([{ name: 'note', type: 'text', label: 'Note', placeholder: 'Old hint' }]);
  const definition = getFieldConfigFormDefinition('object');

  const update = definition.toFieldUpdate(
    {
      label: 'Preferences',
      name: 'preferences',
      objectLayout: 'stack',
      objectColumns: 1,
      nestedFields: [{ name: 'note', type: 'text', label: 'Note', placeholder: '' }],
    },
    field,
  );

  const nested = (update.objectConfig?.fields ?? [])[0];
  assert.equal(nested?.placeholder, undefined);
  assert.ok(nested !== undefined && !('placeholder' in nested), 'a cleared placeholder must not linger as an undefined key');
});

test('object field updates default newly added nested fields', () => {
  const field = objectFieldWithNested([]);
  const definition = getFieldConfigFormDefinition('object');

  const update = definition.toFieldUpdate(
    {
      label: 'Preferences',
      name: 'preferences',
      objectLayout: 'stack',
      objectColumns: 1,
      nestedFields: [{ name: 'extra', type: 'email', label: 'Extra' }],
    },
    field,
  );

  const nested = (update.objectConfig?.fields ?? [])[0];
  assert.equal(nested?.name, 'extra');
  assert.equal(nested?.type, 'email');
  assert.equal(nested?.label, 'Extra');
  assert.ok(!('placeholder' in nested), 'unset placeholder must stay absent');
});
