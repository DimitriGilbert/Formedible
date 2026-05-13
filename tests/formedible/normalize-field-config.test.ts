import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeFieldConfig, normalizeFieldType } from '../../packages/formedible/src/lib/formedible/normalize-field-config.js';
import { normalizeOptions } from '../../packages/formedible/src/lib/formedible/normalize-options.js';
import type { FormedibleFieldConfig, UseFormedibleOptions } from '../../packages/formedible/src/lib/formedible/types.js';

interface TestValues extends Record<string, unknown> {
  categories: string[];
  favoriteColor: string;
  ssn: string;
  subject: string;
}

describe('compatibility examples field normalization', () => {
  it('normalizes aliases centrally', () => {
    assert.equal(normalizeFieldType('multiselect'), 'multiSelect');
    assert.equal(normalizeFieldType('multicombobox'), 'multiCombobox');
    assert.equal(normalizeFieldType('colorPicker'), 'color');
    assert.equal(normalizeFieldType('maskedInput'), 'masked');
    assert.equal(normalizeFieldType('autocomplete'), 'autocomplete');
    assert.equal(normalizeFieldType(undefined), 'text');
  });

  it('does not mutate raw input objects', () => {
    const field = {
      name: 'categories',
      type: 'multiselect',
      disabled: true,
      maxSelections: 3,
      options: ['forms', 'validation'],
    } satisfies FormedibleFieldConfig<TestValues>;

    const before = { ...field };
    const normalized = normalizeFieldConfig(field);

    assert.notEqual(normalized, field);
    assert.deepEqual(field, before);
    assert.equal(field.type, 'multiselect');
    assert.equal(normalized.type, 'multiSelect');
    assert.equal(normalized.required, false);
    assert.equal(normalized.disabled, true);
    assert.equal(normalized.maxSelections, 3);
  });

  it('preserves arbitrary custom field props through normalization', () => {
    const normalized = normalizeFieldConfig({
      name: 'subject',
      type: 'combobox',
      searchable: true,
      searchPlaceholder: 'Search subjects',
      noOptionsText: 'No subjects found',
    } satisfies FormedibleFieldConfig<TestValues>);

    assert.equal(normalized.searchable, true);
    assert.equal(normalized.searchPlaceholder, 'Search subjects');
    assert.equal(normalized.noOptionsText, 'No subjects found');
  });

  it('preserves string and object section metadata through normalization', () => {
    const stringSection = normalizeFieldConfig({
      name: 'subject',
      section: 'Contact Information',
    } satisfies FormedibleFieldConfig<TestValues>);
    const objectSection = normalizeFieldConfig({
      name: 'subject',
      section: { title: 'Project Details', description: 'Tell us more about your project' },
    } satisfies FormedibleFieldConfig<TestValues>);

    assert.equal(stringSection.section, 'Contact Information');
    assert.deepEqual(objectSection.section, {
      title: 'Project Details',
      description: 'Tell us more about your project',
    });
  });

  it('normalizes fields when normalizing options without mutating raw options', () => {
    const options = {
      fields: [
        { name: 'favoriteColor', type: 'colorPicker', colorConfig: { allowCustom: false, format: 'rgb', presetColors: ['#123456'] } },
        { name: 'ssn', type: 'maskedInput', mask: '999-99-9999' },
      ],
      formOptions: {
        defaultValues: {
          categories: [],
          favoriteColor: '#000000',
          ssn: '',
          subject: 'general',
        },
      },
      submitLabel: 'Submit compatibility examples',
    } satisfies UseFormedibleOptions<TestValues>;

    const normalized = normalizeOptions(options);

    assert.notEqual(normalized, options);
    assert.notEqual(normalized.fields, options.fields);
    assert.equal(options.fields[0]?.type, 'colorPicker');
    assert.equal(options.fields[1]?.type, 'maskedInput');
    assert.equal(normalized.fields[0]?.type, 'color');
    assert.deepEqual(normalized.fields[0]?.colorConfig, { allowCustom: false, format: 'rgb', presetColors: ['#123456'] });
    assert.equal(normalized.fields[1]?.type, 'masked');
    assert.equal(normalized.submitLabel, options.submitLabel);
  });
});
