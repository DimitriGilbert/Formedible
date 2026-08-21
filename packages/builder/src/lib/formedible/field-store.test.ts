import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { FieldStore } from '@/components/formedible/builder/field-store';
import type { FormField } from '@/lib/formedible/builder-types';

test('addField keeps field names unique after deletions', () => {
  const store = new FieldStore();

  const first = store.addField('text');
  const second = store.addField('text');
  const third = store.addField('text');
  store.deleteField(second);

  const fourth = store.addField('text');
  const names = store.getAllFields().map((field) => field.name);

  assert.equal(store.getField(fourth)?.name, 'field_2');
  assert.deepEqual(names, ['field_1', 'field_3', 'field_2']);
  assert.equal(new Set(names).size, names.length, `field names must stay unique, got ${names.join(', ')}`);
  assert.ok(first !== fourth);
  assert.ok(second !== third);
});

test('addField reuses the first unused generated name when earlier fields were renamed', () => {
  const store = new FieldStore();
  const first = store.addField('text');

  store.updateField(first, { name: 'full_name' });

  const second = store.addField('text');

  assert.equal(store.getField(first)?.name, 'full_name');
  assert.equal(store.getField(second)?.name, 'field_1');
});

test('duplicateField suffixes copies without collisions', () => {
  const store = new FieldStore();
  const fieldId = store.addField('text');

  const firstCopy = store.duplicateField(fieldId);
  assert.ok(firstCopy !== null);
  const secondCopy = store.duplicateField(fieldId);
  assert.ok(secondCopy !== null);
  const copyOfCopy = store.duplicateField(secondCopy);
  assert.ok(copyOfCopy !== null);
  const names = store.getAllFields().map((field) => field.name);

  assert.equal(store.getField(firstCopy)?.name, 'field_1_copy');
  assert.equal(store.getField(secondCopy)?.name, 'field_1_copy_2');
  assert.equal(store.getField(copyOfCopy)?.name, 'field_1_copy_2_copy');
  assert.equal(new Set(names).size, names.length, `field names must stay unique, got ${names.join(', ')}`);
});

test('updateField throws when renaming to a name another field already uses', () => {
  const store = new FieldStore();
  const first = store.addField('text');
  const second = store.addField('text');

  store.updateField(first, { name: 'contact_email' });

  assert.throws(
    () => store.updateField(second, { name: 'contact_email' }),
    /contact_email.*already uses that name/s,
  );
  assert.equal(store.getField(second)?.name, 'field_2', 'the rejected rename must not mutate the store');
  assert.equal(store.getAllFields().length, 2);
});

test('updateField allows re-applying the current name alongside other updates', () => {
  const store = new FieldStore();
  const first = store.addField('text');
  store.addField('text');

  const updated = store.updateField(first, { name: 'contact_email', label: 'Contact email' });

  assert.equal(updated?.name, 'contact_email');
  assert.equal(store.updateField(first, { name: 'contact_email', required: true })?.required, true);
});

test('replaceField throws when the replacement name collides with another field', () => {
  const store = new FieldStore();
  const first = store.addField('text');
  const second = store.addField('text');

  store.updateField(first, { name: 'contact_email' });

  assert.throws(() => store.replaceField(second, {
    id: second,
    name: 'contact_email',
    type: 'text',
    label: 'Colliding',
  }), /already uses that name/);
});

test('importFields is a no-op when the incoming fields match the current snapshot', () => {
  const store = new FieldStore();

  store.importFields([{ id: 'field_1', name: 'email', type: 'email', label: 'Email' }]);
  store.updateField('field_1', { label: 'Work email' });

  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });
  const snapshotBefore = store.getAllFields();

  store.importFields([{ id: 'field_1', name: 'email', type: 'email', label: 'Work email' }]);

  assert.equal(notifications, 0, 'structurally equal imports must not notify');
  assert.equal(store.getAllFields(), snapshotBefore, 'structurally equal imports must keep the cached snapshot');
  assert.equal(store.getField('field_1')?.label, 'Work email');
  unsubscribe();
});

test('importFields still re-imports when the incoming fields differ from the snapshot', () => {
  const store = new FieldStore();

  store.importFields([{ id: 'field_1', name: 'email', type: 'email', label: 'Email' }]);
  store.importFields([{ id: 'field_1', name: 'email', type: 'email', label: 'Primary email' }]);

  assert.equal(store.getField('field_1')?.label, 'Primary email');
});

test('importFields compares nested configuration structurally', () => {
  const store = new FieldStore();
  const imported: FormField[] = [
    {
      id: 'field_1',
      name: 'choices',
      type: 'select',
      label: 'Choices',
      options: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
      ],
    },
  ];

  store.importFields(imported);

  let notifications = 0;
  const unsubscribe = store.subscribe(() => {
    notifications += 1;
  });

  const sameContentDifferentIdentity: FormField[] = [
    {
      id: 'field_1',
      name: 'choices',
      type: 'select',
      label: 'Choices',
      options: [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
      ],
    },
  ];

  store.importFields(sameContentDifferentIdentity);
  assert.equal(notifications, 0);

  const changedContent: FormField[] = [
    {
      id: 'field_1',
      name: 'choices',
      type: 'select',
      label: 'Choices',
      options: [{ label: 'One', value: 'one' }],
    },
  ];

  store.importFields(changedContent);
  assert.equal(notifications, 1);
  assert.equal(store.getField('field_1')?.options?.length, 1);
  unsubscribe();
});

test('independent field stores never share state between builder instances', () => {
  const builderA = new FieldStore();
  const builderB = new FieldStore();

  builderA.importFields([{ id: 'field_1', name: 'email', type: 'email', label: 'Email' }]);
  builderB.importFields([{ id: 'field_1', name: 'phone', type: 'phone', label: 'Phone' }]);
  builderB.addField('text');

  assert.deepEqual(builderA.getAllFields().map((field) => field.name), ['email']);
  assert.deepEqual(builderB.getAllFields().map((field) => field.name), ['phone', 'field_1']);
});

test('form builder owns a per-instance store with an explicit global opt-in', () => {
  const builderRoot = process.cwd();
  const content = readFileSync(join(builderRoot, 'src/components/formedible/builder/form-builder.tsx'), 'utf8');

  assert.match(content, /fieldStoreProp \?\? new FieldStore\(\)/, 'FormBuilder must default to a per-instance FieldStore');
  assert.match(content, /FieldStoreContext\.Provider/, 'FormBuilder must provide its store through FieldStoreContext');
  assert.match(content, /fieldStore: fieldStoreProp/, 'FormBuilder must accept the fieldStore opt-in prop');
  assert.doesNotMatch(content, /globalFieldStore\./, 'FormBuilder must not touch the module singleton directly');
});

test('form builder onChange uses a latest-callback ref instead of the prop identity', () => {
  const builderRoot = process.cwd();
  const content = readFileSync(join(builderRoot, 'src/components/formedible/builder/form-builder.tsx'), 'utf8');

  assert.match(content, /const onChangeRef = useRef\(onChange\)/);
  assert.match(content, /onChangeRef\.current = onChange/);
  assert.match(content, /onChangeRef\.current\?\.\(metadata, fields\)/, 'the notify effect must call through the ref');
  assert.doesNotMatch(content, /\[fields, metadata, onChange\]/, 'onChange must not be an effect dependency');
});

test('field configurator reads the store from context and survives rejected updates', () => {
  const builderRoot = process.cwd();
  const content = readFileSync(join(builderRoot, 'src/components/formedible/builder/field-configurator.tsx'), 'utf8');

  assert.match(content, /useFieldStore\(\)/);
  assert.doesNotMatch(content, /globalFieldStore/, 'the configurator must not hardwire the global singleton');
  assert.match(content, /catch \(error\)/, 'rename collisions thrown by the store must be caught in the UI');
});
