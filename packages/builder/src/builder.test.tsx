import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createElement } from 'react';

import { FieldConfigurator } from '@/components/formedible/builder/field-configurator';
import { FormBuilder } from '@/components/formedible/builder/form-builder';
import { FormPreview } from '@/components/formedible/builder/form-preview';
import { FieldStore } from '@/components/formedible/builder/field-store';
import { createTabsWithDisabled, createTabsWithOrder, defaultTabs } from '@/components/formedible/builder/default-tabs';
import { generateFormCode } from '@/lib/formedible/code-generation';
import type { FormField } from '@/lib/formedible/builder-types';

test('public builder components are real React component exports', () => {
  const field: FormField = {
    id: 'field_1',
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true,
  };

  assert.equal(createElement(FormBuilder).type, FormBuilder);
  assert.equal(createElement(FieldConfigurator, { fieldId: field.id, initialField: field }).type, FieldConfigurator);
  assert.equal(createElement(FormPreview, { config: { fields: [field], formOptions: { defaultValues: {} } } }).type, FormPreview);
});

test('field store preserves structure and field update behavior', () => {
  const store = new FieldStore();
  let structureChanges = 0;
  let updatedLabel = '';
  const unsubscribeStructure = store.subscribe(() => {
    structureChanges += 1;
  });
  const fieldId = store.addField('text');
  const unsubscribeField = store.subscribeToFieldUpdates(fieldId, (field) => {
    updatedLabel = String(field.label);
  });

  store.updateField(fieldId, { label: 'Full name', name: 'fullName' });
  const duplicateId = store.duplicateField(fieldId);

  assert.equal(store.getField(fieldId)?.name, 'fullName');
  assert.equal(updatedLabel, 'Full name');
  assert.equal(store.getAllFields().length, 2);
  assert.equal(duplicateId !== null, true);
  assert.equal(structureChanges, 3);

  store.deleteField(fieldId);
  assert.equal(store.getAllFields().length, 1);
  unsubscribeField();
  unsubscribeStructure();
});

test('field store returns cached snapshots until fields change', () => {
  const store = new FieldStore();
  const emptySnapshot = store.getAllFields();

  assert.equal(store.getAllFields(), emptySnapshot);

  const fieldId = store.addField('text');
  const populatedSnapshot = store.getAllFields();

  assert.equal(store.getAllFields(), populatedSnapshot);
  assert.notEqual(populatedSnapshot, emptySnapshot);

  store.updateField(fieldId, { label: 'Stable snapshot update' });

  assert.notEqual(store.getAllFields(), populatedSnapshot);
  assert.equal(store.getAllFields()[0]?.label, 'Stable snapshot update');
});

test('field edits notify structure subscribers with current snapshots', () => {
  const store = new FieldStore();
  const fieldId = store.addField('text');
  let latestFields: readonly FormField[] = [];
  const unsubscribe = store.subscribe(() => {
    latestFields = store.getAllFields();
  });

  store.updateField(fieldId, { label: 'Edited label' });

  assert.equal(latestFields[0]?.label, 'Edited label');
  unsubscribe();
});

test('field imports advance generated IDs beyond imported field IDs', () => {
  const store = new FieldStore();

  store.importFields([
    {
      id: 'field_2',
      name: 'email',
      type: 'email',
      label: 'Email',
    },
  ]);

  const addedFieldId = store.addField('text');

  assert.equal(addedFieldId, 'field_3');
  assert.equal(store.getAllFields().map((field) => field.id).join(','), 'field_2,field_3');
});

test('form builder avoids omitted initial field default arrays', () => {
  const builderRoot = process.cwd();
  const content = readFileSync(join(builderRoot, 'src/components/formedible/builder/form-builder.tsx'), 'utf8');

  assert.doesNotMatch(content, /initialFields\s*=\s*\[\]/);
  assert.match(content, /const emptyInitialFields/);
});

test('default tabs expose builder preview and code behavior', () => {
  assert.deepEqual(defaultTabs.map((tab) => tab.id), ['builder', 'preview', 'code']);
  assert.deepEqual(createTabsWithOrder(['code', 'builder']).map((tab) => tab.id), ['code', 'builder']);
  assert.deepEqual(createTabsWithDisabled(['preview']).map((tab) => tab.enabled), [true, false, true]);
});

test('code generation produces local shadcn install imports and schema behavior', () => {
  const result = generateFormCode({
    title: 'Contact',
    description: 'Contact form',
    fields: [
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'age', type: 'number', label: 'Age' },
    ],
    pages: [
      { page: 1, title: 'Contact' },
      { page: 2, title: 'Details' },
    ],
    settings: {
      submitLabel: 'Send',
      nextLabel: 'Next',
      previousLabel: 'Back',
      showProgress: true,
    },
  });

  assert.match(result.fullCode, /import \{ useFormedible \} from '@\/components\/formedible\/hooks\/use-formedible';/);
  assert.match(result.schemaCode, /email: z\.string\(\)\.min\(1, "Email is required"\)/);
  assert.match(result.schemaCode, /age: z\.number\(\)\.optional\(\)/);
  assert.match(result.formConfig, /"submitLabel": "Send"/);
});

test('builder authored source uses local installed core and parser aliases', () => {
  const builderRoot = process.cwd();
  const sourceFiles = [
    'src/components/formedible/builder/form-builder.tsx',
    'src/components/formedible/builder/field-configurator.tsx',
    'src/components/formedible/builder/form-preview.tsx',
    'src/components/formedible/builder/default-tabs.tsx',
    'src/lib/formedible/code-generation.ts',
  ];

  for (const sourceFile of sourceFiles) {
    const content = readFileSync(join(builderRoot, sourceFile), 'utf8');
    assert.doesNotMatch(content, /from ['"]\.\.?\//, `${sourceFile} must not use relative internal imports`);
    assert.doesNotMatch(content, /from ['"][^'"]+\.(?:js|mjs)['"]/, `${sourceFile} must not import TS files with JS suffixes`);
  }

  const previewContent = readFileSync(join(builderRoot, 'src/components/formedible/builder/form-preview.tsx'), 'utf8');
  assert.match(previewContent, /@\/components\/formedible\/hooks\/use-formedible/);
  assert.match(previewContent, /@\/components\/formedible\/lib\/types/);
});
