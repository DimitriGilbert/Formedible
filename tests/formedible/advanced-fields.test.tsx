import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import { normalizeFieldConfig } from '../../packages/formedible/src/lib/formedible/normalize-field-config';
import { buildFieldValidators } from '../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleFieldConfig, FormedibleFormValues, FormedibleLocationValue } from '../../packages/formedible/src/lib/formedible/types';
import type { FormedibleFieldValidationApi, FormedibleFieldValidators } from '../../packages/formedible/src/lib/formedible/validation';
import { vacationFlowCompatibilityExample } from '../compatibility-examples/advanced-field-examples';

const advancedTypes = ['date', 'slider', 'rating', 'multiSelect', 'combobox', 'multiCombobox', 'color', 'phone', 'duration', 'location', 'file'] as const;
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
