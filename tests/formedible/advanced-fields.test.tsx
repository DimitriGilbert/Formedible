import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  getAutocompleteSelection,
  getNextAutocompleteRequestId,
  getRenderedAutocompleteOptions,
  isCurrentAutocompleteRequest,
  shouldCommitCustomAutocompleteValue,
} from '../../packages/formedible/src/components/formedible/fields/autocomplete-field';
import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import { normalizeFieldConfig } from '../../packages/formedible/src/lib/formedible/normalize-field-config';
import { buildFieldValidators } from '../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleFieldConfig, FormedibleFormValues, FormedibleLocationValue } from '../../packages/formedible/src/lib/formedible/types';
import type { FormedibleOptionConfig } from '../../packages/formedible/src/lib/formedible/types';
import type { FormedibleFieldValidationApi, FormedibleFieldValidators } from '../../packages/formedible/src/lib/formedible/validation';
import { vacationFlowCompatibilityExample } from '../compatibility-examples/advanced-field-examples';

const advancedTypes = ['date', 'slider', 'rating', 'multiSelect', 'combobox', 'autocomplete', 'multiCombobox', 'color', 'phone', 'duration', 'location', 'file'] as const;
const supportedCarDestinations = ['beach', 'mountains', 'city'] as const;

interface VacationFlowValues extends FormedibleFormValues {
  readonly name: string;
  readonly destination: string;
  readonly passengers: number;
  readonly carType: string;
}

function sourcePath(fileName: string) {
  return join(process.cwd(), 'packages/formedible/src/components/formedible/fields', fileName);
}

function AdvancedFieldsForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    {
      name: 'startDate',
      type: 'date',
      label: 'Start date',
      dateConfig: {
        disableDate: (date, values) => values.destination === 'beach' && date.getDay() === 0,
      },
    },
    { name: 'range', type: 'slider', label: 'Range', sliderConfig: { min: 1, max: 5, valueMapping: [{ sliderValue: 3, displayValue: 'C', label: 'Good' }] } },
    { name: 'rating', type: 'rating', label: 'Rating', ratingConfig: { max: 5, allowHalf: true, showValue: true } },
    { name: 'extras', type: 'multiSelect', label: 'Extras', options: ['gps', 'wifi'], multiSelectConfig: { searchable: true, creatable: true, maxSelections: 3 } },
    { name: 'country', type: 'combobox', label: 'Country', options: ['France', 'Germany'] },
    { name: 'legacyCountry', type: 'autocomplete', label: 'Legacy country', autocompleteConfig: { options: ['France', 'Germany'], placeholder: 'Type a country' } },
    { name: 'tools', type: 'multiCombobox', label: 'Tools', options: ['React', 'TypeScript'] },
    { name: 'color', type: 'colorPicker', label: 'Color', colorConfig: { format: 'rgb', presetColors: ['#ff0000'] } },
    { name: 'phone', type: 'phone', label: 'Phone', phoneConfig: { defaultCountry: 'US', format: 'international' } },
    { name: 'duration', type: 'duration', label: 'Duration', durationConfig: { format: 'hm', maxHours: 24 } },
    {
      name: 'location',
      type: 'location',
      label: 'Location',
      locationConfig: {
        showMap: false,
        searchCallback: (): readonly FormedibleLocationValue[] => [{ lat: 48.8566, lng: 2.3522, address: 'Paris' }],
      },
    },
    { name: 'resume', type: 'file', label: 'Resume', fileConfig: { accept: '.pdf', multiple: false, maxFiles: 1 } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: {
      defaultValues: {
        destination: 'beach',
        startDate: '',
        range: 3,
        rating: 2.5,
        extras: ['gps'],
        country: 'France',
        legacyCountry: '',
        tools: ['React'],
        color: '#ff0000',
        phone: '',
        duration: { hours: 1, minutes: 30, seconds: 0, totalSeconds: 5400 },
        location: { lat: 48.8566, lng: 2.3522, address: 'Paris' },
        resume: null,
      },
    },
  });

  return <Form />;
}

function LegacyAliasRenderedBehaviorForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'legacyExtras', type: 'multiselect', label: 'Legacy extras', options: ['GPS', 'WiFi'], multiSelectConfig: { searchable: true, maxSelections: 3 } },
    { name: 'legacyTools', type: 'multicombobox', label: 'Legacy tools', options: ['React', 'TypeScript'], multiComboboxConfig: { searchable: true } },
    { name: 'legacyColor', type: 'colorPicker', label: 'Legacy color', colorConfig: { presetColors: ['#123456'] } },
    { name: 'legacyPresetOnlyColor', type: 'colorPicker', label: 'Legacy preset-only color', colorConfig: { allowCustom: false, format: 'rgb', presetColors: ['#abcdef'] } },
    { name: 'currentMaskedSsn', type: 'masked', label: 'Current masked SSN', mask: '999-99-9999' },
    { name: 'legacySsn', type: 'maskedInput', label: 'Legacy SSN', mask: '999-99-9999', placeholder: '___-__-____' },
    { name: 'legacyMaskedConfigSsn', type: 'maskedInput', label: 'Legacy config SSN', maskedInputConfig: { mask: '000-00-0000', placeholder: 'masked config placeholder' } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: {
      defaultValues: {
        legacyExtras: ['GPS'],
        legacyTools: ['React'],
        legacyColor: '#123456',
        legacyPresetOnlyColor: '#abcdef',
        currentMaskedSsn: '321654987',
        legacySsn: '123456789',
        legacyMaskedConfigSsn: '987654321',
      },
    },
  });

  return <Form />;
}

function FormattedColorRoundTripForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'rgbColor', type: 'colorPicker', label: 'RGB color', colorConfig: { format: 'rgb', presetColors: ['#123456'] } },
    { name: 'hslColor', type: 'colorPicker', label: 'HSL color', colorConfig: { format: 'hsl', presetColors: ['#ff0000'] } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: {
      defaultValues: {
        rgbColor: 'rgb(18, 52, 86)',
        hslColor: 'hsl(0, 100%, 50%)',
      },
    },
  });

  return <Form />;
}

function MaskedCompatibilityBehaviorForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'functionMask', type: 'masked', label: 'Function mask', mask: (value) => `ID-${value.toUpperCase()}` },
    { name: 'pipeString', type: 'maskedInput', label: 'Pipe string', maskedInputConfig: { mask: '999', pipe: (conformedValue) => `#${conformedValue}` } },
    {
      name: 'pipeObject',
      type: 'maskedInput',
      label: 'Pipe object',
      maskedInputConfig: { mask: '999', pipe: (conformedValue) => ({ value: `${conformedValue}!`, indexesOfPipedChars: [conformedValue.length] }) },
    },
    { name: 'pipeFalse', type: 'maskedInput', label: 'Pipe false', maskedInputConfig: { mask: '999', pipe: () => false } },
    { name: 'nonDigitTokens', type: 'maskedInput', label: 'Non digit tokens', maskedInputConfig: { mask: 'aa-AA-**' } },
    { name: 'guidedMask', type: 'maskedInput', label: 'Guided mask', maskedInputConfig: { mask: '999-99', showMask: true, guide: true } },
    { name: 'hiddenGuideMask', type: 'maskedInput', label: 'Hidden guide mask', maskedInputConfig: { mask: '999-99', showMask: true, guide: false } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: {
      defaultValues: {
        functionMask: 'ab12',
        pipeString: '123',
        pipeObject: '456',
        pipeFalse: '789',
        nonDigitTokens: 'AbCd12',
        guidedMask: '12',
        hiddenGuideMask: '12',
      },
    },
  });

  return <Form />;
}

const vacationFlowFields: readonly FormedibleFieldConfig<VacationFlowValues>[] = [
  { name: 'name', type: 'text', label: 'Name', required: true },
  { name: 'destination', type: 'radio', label: 'Where are you going, {{name}}?', options: ['beach', 'mountains', 'city'], required: true },
  { name: 'passengers', type: 'number', label: 'Passengers for {{name}}', min: 1, required: true },
  {
    name: 'carType',
    type: 'select',
    label: 'Pick a car for {{destination}}',
    conditional: (values) => supportedCarDestinations.includes(values.destination as (typeof supportedCarDestinations)[number]),
    options: ['convertible', 'suv', 'compact', 'luxury'],
    required: true,
  },
  { name: 'extras', type: 'multiSelect', label: 'Extras for your {{carType}}', options: ['gps', 'child_seat', 'roof_rack', 'wifi'] },
];

const vacationFlowPages = [
  { page: 2, title: 'Destination', description: 'Hi {{name}}! Where are you going?' },
  { page: 6, title: 'Choose Your Car', description: 'Pick the perfect ride for {{destination}}' },
  { page: 7, title: 'Extras', description: 'Add selected extras to make your {{carType}} more comfortable' },
] as const;

function interpolateDynamicText(template: string, values: VacationFlowValues): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_token, key: string) => String(values[key] ?? ''));
}

function passengerValidationMessage(value: number, values: VacationFlowValues): string | undefined {
  const passengersField = normalizeFieldConfig(vacationFlowFields.find((field) => field.name === 'passengers') ?? { name: 'passengers', type: 'number', min: 1 });
  const validators = buildFieldValidators<VacationFlowValues, 'passengers'>(passengersField, undefined, undefined, undefined) as unknown as FormedibleFieldValidators<VacationFlowValues>;
  const fieldApi: FormedibleFieldValidationApi<VacationFlowValues> = {
    form: {
      state: { values },
      parseValuesWithSchema: () => undefined,
      parseValuesWithSchemaAsync: () => Promise.resolve(undefined),
    },
  };

  return validators.onChange?.({ value, fieldApi });
}

test('advanced field registry maps all phase 8 field types', () => {
  const source = readFileSync(sourcePath('field-registry.tsx'), 'utf8');

  for (const fieldType of advancedTypes) {
    assert.match(source, new RegExp(`${fieldType}:`));
  }
});

test('vacation flow advanced compatibility behavior executes', () => {
  const values: VacationFlowValues = {
    name: 'Avery',
    destination: 'beach',
    passengers: 2,
    carType: 'convertible',
  };
  const carTypeField = vacationFlowFields.find((field) => field.name === 'carType');
  const extrasField = vacationFlowFields.find((field) => field.name === 'extras');
  const destinationPage = vacationFlowPages.find((page) => page.page === 2);
  const carPage = vacationFlowPages.find((page) => page.page === 6);
  const extrasPage = vacationFlowPages.find((page) => page.page === 7);

  assert.ok(vacationFlowCompatibilityExample.fields.some((field) => field.type === 'date'));
  assert.ok(vacationFlowCompatibilityExample.fields.some((field) => field.type === 'multiSelect'));
  assert.equal(interpolateDynamicText(String(destinationPage?.description), values), 'Hi Avery! Where are you going?');
  assert.equal(interpolateDynamicText(String(carPage?.description), values), 'Pick the perfect ride for beach');
  assert.equal(interpolateDynamicText(String(extrasPage?.description), values), 'Add selected extras to make your convertible more comfortable');
  assert.equal(interpolateDynamicText(String(extrasField?.label), values), 'Extras for your convertible');
  assert.equal(typeof carTypeField?.conditional === 'function' ? carTypeField.conditional({ ...values, destination: 'beach' }) : false, true);
  assert.equal(typeof carTypeField?.conditional === 'function' ? carTypeField.conditional({ ...values, destination: 'mountains' }) : false, true);
  assert.equal(typeof carTypeField?.conditional === 'function' ? carTypeField.conditional({ ...values, destination: 'city' }) : false, true);
  assert.equal(typeof carTypeField?.conditional === 'function' ? carTypeField.conditional({ ...values, destination: 'space' }) : true, false);
  assert.equal(passengerValidationMessage(0, values), 'Must be at least 1');
  assert.equal(passengerValidationMessage(1, values), undefined);
});

test('advanced fields render without browser APIs during SSR', () => {
  const markup = renderToStaticMarkup(<AdvancedFieldsForm />);

  assert.match(markup, /type="date"/);
  assert.match(markup, /data-slot="slider"/);
  assert.match(markup, /data-slot="badge"/);
  assert.match(markup, /type="file"/);
  assert.match(markup, /Paris/);
  assert.match(markup, /Type a country/);
  assert.match(markup, /autoComplete="off"|autocomplete="off"/);
});

test('legacy alias fields render field-specific compatibility UI instead of plain text inputs', () => {
  const markup = renderToStaticMarkup(<LegacyAliasRenderedBehaviorForm />);

  assert.match(markup, /Legacy extras/);
  assert.match(markup, /GPS/);
  assert.match(markup, /\(1\/3\)/);
  assert.match(markup, /data-slot="badge"/);
  assert.doesNotMatch(markup, /name="legacyExtras"[^>]*type="text"/);

  assert.match(markup, /Legacy tools/);
  assert.match(markup, /React/);
  assert.doesNotMatch(markup, /name="legacyTools"[^>]*type="text"/);

  assert.match(markup, /Legacy color/);
  assert.match(markup, /data-slot="color-input"/);
  assert.match(markup, /type="color"/);
  assert.doesNotMatch(markup, /name="legacyColor"[^>]*type="text"/);

  assert.match(markup, /Legacy preset-only color/);
  assert.match(markup, /background-color:#abcdef/);
  assert.doesNotMatch(markup, /value="rgb\(171, 205, 239\)"/);

  assert.match(markup, /Current masked SSN/);
  assert.match(markup, /value="321-65-4987"/);

  assert.match(markup, /Legacy SSN/);
  assert.match(markup, /data-slot="masked-input"/);
  assert.match(markup, /data-mask="999-99-9999"/);
  assert.match(markup, /value="123-45-6789"/);

  assert.match(markup, /Legacy config SSN/);
  assert.match(markup, /data-mask="000-00-0000"/);
  assert.match(markup, /placeholder="masked config placeholder"/);
  assert.match(markup, /value="987-65-4321"/);
});

test('formatted color picker values round-trip without resetting the color UI', () => {
  const markup = renderToStaticMarkup(<FormattedColorRoundTripForm />);

  assert.match(markup, /RGB color/);
  assert.match(markup, /value="rgb\(18, 52, 86\)"/);
  assert.match(markup, /background-color:#123456/);
  assert.match(markup, /type="color"[^>]*value="#123456"/);

  assert.match(markup, /HSL color/);
  assert.match(markup, /value="hsl\(0, 100%, 50%\)"/);
  assert.match(markup, /background-color:#ff0000/);
  assert.match(markup, /type="color"[^>]*value="#ff0000"/);

  assert.doesNotMatch(markup, /type="color"[^>]*value="#000000"/);
});

test('masked fields restore function mask, pipe, token, and guide behavior', () => {
  const markup = renderToStaticMarkup(<MaskedCompatibilityBehaviorForm />);

  assert.match(markup, /Function mask/);
  assert.match(markup, /value="ID-AB12"/);

  assert.match(markup, /Pipe string/);
  assert.match(markup, /value="#123"/);

  assert.match(markup, /Pipe object/);
  assert.match(markup, /value="456!"/);

  assert.match(markup, /Pipe false/);
  assert.match(markup, /name="pipeFalse"[^>]*value=""/);

  assert.match(markup, /Non digit tokens/);
  assert.match(markup, /value="ab-CD-12"/);

  assert.match(markup, /Guided mask/);
  assert.match(markup, /placeholder="___-__"[^>]*name="guidedMask"[^>]*value="12_-__"/);

  assert.match(markup, /Hidden guide mask/);
  assert.match(markup, /name="hiddenGuideMask"(?![^>]*placeholder="___-__")[^>]*value="12"/);
});

test('legacy autocompleteConfig renders and filters static options', () => {
  const options = getRenderedAutocompleteOptions({
    configOptions: ['France', { value: 'de', label: 'Germany' }, 'Finland'],
    fallbackOptions: ['Fallback'],
    query: 'fr',
    minChars: 1,
    maxResults: 10,
  });

  assert.deepEqual(
    options.map((option) => option.value),
    ['France'],
  );
});

test('legacy autocomplete uses top-level options when autocompleteConfig options are absent', () => {
  const options = getRenderedAutocompleteOptions({
    configOptions: undefined,
    fallbackOptions: ['Portugal', { value: 'pl', label: 'Poland' }],
    query: 'po',
    minChars: 1,
    maxResults: 10,
  });

  assert.deepEqual(
    options.map((option) => option.value),
    ['Portugal', 'pl'],
  );
});

test('legacy autocompleteConfig empty options override top-level fallback options', () => {
  const options = getRenderedAutocompleteOptions({
    configOptions: [],
    fallbackOptions: ['Portugal', { value: 'pl', label: 'Poland' }],
    query: 'po',
    minChars: 1,
    maxResults: 10,
  });

  assert.deepEqual(options, []);
});

test('legacy autocomplete option selection updates input label and submitted value', () => {
  const selection = getAutocompleteSelection({ value: 'de', label: 'Germany' });

  assert.deepEqual(selection, { inputValue: 'Germany', fieldValue: 'de' });
});

test('legacy autocomplete allowCustom controls typed value commits', () => {
  assert.equal(shouldCommitCustomAutocompleteValue(undefined), true);
  assert.equal(shouldCommitCustomAutocompleteValue(true), true);
  assert.equal(shouldCommitCustomAutocompleteValue(false), false);
});

test('legacy autocomplete returns no options for configured empty state rendering', () => {
  const options = getRenderedAutocompleteOptions({
    configOptions: ['France'],
    fallbackOptions: [],
    query: 'zz',
    minChars: 1,
    maxResults: 10,
  });
  const noOptionsText = 'Nothing matched';

  assert.deepEqual(options, []);
  assert.equal(noOptionsText, 'Nothing matched');
});

test('legacy autocomplete debounce request sequencing ignores stale async results', async () => {
  let currentRequestId = 0;
  const appliedValues: string[] = [];

  async function applyAsyncResult(requestId: number, options: readonly FormedibleOptionConfig[]) {
    if (!isCurrentAutocompleteRequest(requestId, currentRequestId)) {
      return;
    }

    appliedValues.splice(0, appliedValues.length, ...options.map((option) => option.value));
  }

  const staleRequestId = getNextAutocompleteRequestId(currentRequestId);
  currentRequestId = staleRequestId;
  const latestRequestId = getNextAutocompleteRequestId(currentRequestId);
  currentRequestId = latestRequestId;

  await applyAsyncResult(latestRequestId, [{ value: 'latest', label: 'Latest' }]);
  await applyAsyncResult(staleRequestId, [{ value: 'stale', label: 'Stale' }]);

  assert.deepEqual(appliedValues, ['latest']);
});

test('authored advanced field imports use consumer-safe aliases', () => {
  for (const fileName of [
    'date-field.tsx',
    'slider-field.tsx',
    'rating-field.tsx',
    'multi-select-field.tsx',
    'combobox-field.tsx',
    'multi-combobox-field.tsx',
    'color-picker-field.tsx',
    'phone-field.tsx',
    'duration-picker-field.tsx',
    'location-picker-field.tsx',
    'file-upload-field.tsx',
  ]) {
    const source = readFileSync(sourcePath(fileName), 'utf8');

    assert.doesNotMatch(source, /from ['"]\.\.?\//);
    assert.doesNotMatch(source, /from ['"][^'"]+\.(?:js|mjs)['"]/);
  }
});
