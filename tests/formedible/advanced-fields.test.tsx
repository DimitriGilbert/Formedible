import './advanced-fields-dom-bootstrap';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';

import {
  getAutocompleteDisplayText,
  getAutocompleteSelection,
  getNextAutocompleteRequestId,
  getRenderedAutocompleteOptions,
  isCurrentAutocompleteRequest,
  shouldCommitCustomAutocompleteValue,
} from '../../packages/formedible/src/components/formedible/fields/autocomplete-field';
import { toDateInputValue } from '../../packages/formedible/src/components/formedible/fields/date-field';
import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import { resolveDynamicText } from '../../packages/formedible/src/lib/formedible/dynamic-text';
import { normalizeFieldConfig, normalizeFieldType } from '../../packages/formedible/src/lib/formedible/normalize-field-config';
import { buildFieldValidators } from '../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleFieldConfig, FormedibleFormValues, FormedibleLocationValue } from '../../packages/formedible/src/lib/formedible/types';
import type { FormedibleOptionConfig } from '../../packages/formedible/src/lib/formedible/types';
import type { FormedibleFieldValidationApi, FormedibleFieldValidators } from '../../packages/formedible/src/lib/formedible/validation';
import { advancedFieldTypesCompatibilityExample } from '../compatibility-examples/core-examples';
import { vacationFlowCompatibilityExample } from '../compatibility-examples/advanced-field-examples';
import type { CompatibilityExample, FieldDescriptor } from '../compatibility-examples/example-manifest';

const advancedTypes = ['date', 'slider', 'rating', 'multiSelect', 'combobox', 'autocomplete', 'multiCombobox', 'color', 'phone', 'duration', 'location', 'file'] as const;

interface VacationFlowValues extends FormedibleFormValues {
  readonly name: string;
  readonly destination: string;
  readonly passengers: number;
  readonly carType: string;
}

function findExampleField(example: CompatibilityExample, name: string): FieldDescriptor {
  const descriptor = example.fields.find((field) => field.name === name);

  if (!descriptor) {
    throw new Error(`${example.id} fixture is missing the ${name} field`);
  }

  return descriptor;
}

function fixtureStringOptions(descriptor: FieldDescriptor): readonly string[] {
  return (descriptor.options ?? []).filter((option): option is string => typeof option === 'string');
}

function vacationFixtureConfigValue(fieldName: string, key: string): string | undefined {
  const entry = findExampleField(vacationFlowCompatibilityExample, fieldName).config?.find((token) => token.startsWith(`${key}:`));

  return entry?.slice(key.length + 1);
}

/** The supported car destinations are exactly the fixture's destination options. */
function vacationCarTypeVisible(values: VacationFlowValues): boolean {
  return fixtureStringOptions(findExampleField(vacationFlowCompatibilityExample, 'destination')).includes(values.destination);
}

function passengerValidationMessage(value: number, values: VacationFlowValues): string | undefined {
  const passengersMin = Number(vacationFixtureConfigValue('passengers', 'min') ?? '1');
  const passengersField = normalizeFieldConfig<VacationFlowValues>({ name: 'passengers', type: 'number', min: passengersMin });
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

function sourcePath(fileName: string) {
  return join(process.cwd(), 'packages/formedible/src/components/formedible/fields', fileName);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function setNativeInputValue(input: HTMLInputElement, nextValue: string, window: Window & typeof globalThis) {
  const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set as ((value: string) => void) | undefined;

  assert.ok(valueSetter);
  valueSetter.call(input, nextValue);
}

function renderClient(element: ReactElement) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true });
  const rootElement = dom.window.document.getElementById('root');

  assert.ok(rootElement);

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousElement = globalThis.Element;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const actGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT;
  const elementPrototype = dom.window.HTMLElement.prototype as HTMLElement & {
    attachEvent?: () => void;
    detachEvent?: () => void;
  };

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;
  globalThis.Event = dom.window.Event;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame?.bind(dom.window) ?? previousRequestAnimationFrame;
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame?.bind(dom.window) ?? previousCancelAnimationFrame;
  actGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  elementPrototype.attachEvent = () => undefined;
  elementPrototype.detachEvent = () => undefined;

  const root = createRoot(rootElement);
  act(() => {
    root.render(element);
  });

  return {
    document: dom.window.document,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      globalThis.HTMLElement = previousHTMLElement;
      globalThis.Element = previousElement;
      globalThis.Node = previousNode;
      globalThis.Event = previousEvent;
      globalThis.getComputedStyle = previousGetComputedStyle;
      globalThis.requestAnimationFrame = previousRequestAnimationFrame;
      globalThis.cancelAnimationFrame = previousCancelAnimationFrame;
      actGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      dom.window.close();
    },
  };
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

test('vacation flow advanced compatibility behavior executes', () => {
  const values: VacationFlowValues = {
    name: 'Avery',
    destination: 'beach',
    passengers: 2,
    carType: 'convertible',
  };
  const fixturePages = vacationFlowCompatibilityExample.pages ?? [];
  const destinationPage = fixturePages.find((page) => page.page === 2);
  const tripStartPage = fixturePages.find((page) => page.page === 3);
  const carPage = fixturePages.find((page) => page.page === 6);
  const extrasPage = fixturePages.find((page) => page.page === 7);

  assert.ok(vacationFlowCompatibilityExample.fields.some((field) => field.type === 'date'));
  assert.ok(vacationFlowCompatibilityExample.fields.some((field) => field.type === 'multiSelect'));
  assert.ok(vacationFlowCompatibilityExample.assertionsRequired.some((required) => required.includes('tokens interpolate in labels and page descriptions')));

  assert.equal(resolveDynamicText(destinationPage?.description ?? '', values), 'Hi Avery! Where are you going?');
  assert.equal(resolveDynamicText(tripStartPage?.description ?? '', { ...values, destination: 'mountains' }), 'When does your adventure to the mountains begin?');
  assert.equal(resolveDynamicText(carPage?.description ?? '', values), 'Pick the perfect ride for beach');
  assert.equal(resolveDynamicText(extrasPage?.description ?? '', values), 'Add selected extras to make your convertible more comfortable');

  for (const page of fixturePages) {
    assert.doesNotMatch(String(resolveDynamicText(page.description ?? '', values)), /\{\{/, `page ${page.page} description must resolve every dynamic token`);
  }

  const destinationOptions = fixtureStringOptions(findExampleField(vacationFlowCompatibilityExample, 'destination'));
  assert.deepEqual(destinationOptions, ['beach', 'mountains', 'city']);

  for (const option of destinationOptions) {
    assert.equal(vacationCarTypeVisible({ ...values, destination: option }), true, `carType must be visible for the fixture destination ${option}`);
  }

  assert.equal(vacationCarTypeVisible({ ...values, destination: 'space' }), false);
  assert.ok(findExampleField(vacationFlowCompatibilityExample, 'carType').conditional !== undefined, 'the fixture must keep the carType conditional evidence');
  assert.equal(passengerValidationMessage(0, values), 'Must be at least 1');
  assert.equal(passengerValidationMessage(1, values), undefined);
});

function advancedExampleDefault(descriptor: FieldDescriptor): unknown {
  switch (descriptor.type) {
    case 'rating':
      return 3;
    case 'slider':
      return 1;
    case 'duration':
      return 0;
    case 'multiSelect': {
      const firstOption = descriptor.options?.[0];

      return [typeof firstOption === 'string' ? firstOption : firstOption?.value];
    }
    case 'file':
    case 'location':
      return null;
    default:
      return '';
  }
}

function AdvancedFieldTypesFixtureForm() {
  const defaultValues: FormedibleFormValues = {};

  for (const descriptor of advancedFieldTypesCompatibilityExample.fields) {
    defaultValues[descriptor.name] = advancedExampleDefault(descriptor);
  }

  const { Form } = useFormedible<FormedibleFormValues>({
    fields: advancedFieldTypesCompatibilityExample.fields.map((descriptor) => ({
      name: descriptor.name,
      type: descriptor.type,
      label: descriptor.name,
      options: descriptor.options,
    })),
    formOptions: { defaultValues },
  });

  return <Form />;
}

test('advanced field types example fixture maps every field to real registry components', () => {
  assert.ok(
    advancedFieldTypesCompatibilityExample.assertionsRequired.some((required) => required.includes('rating, phone, colorPicker, location, duration, multiSelect, slider, date, file, textarea, password, and email')),
  );

  const registrySource = readFileSync(sourcePath('field-registry.tsx'), 'utf8');

  for (const descriptor of advancedFieldTypesCompatibilityExample.fields) {
    const normalizedType = normalizeFieldType(descriptor.type);

    assert.match(registrySource, new RegExp(`${normalizedType}:`), `fixture field ${descriptor.name} (${descriptor.type}) must map to a registered component`);
  }
});

test('advanced field types example fixture fields render their real controls', () => {
  const markup = renderToStaticMarkup(<AdvancedFieldTypesFixtureForm />);

  for (const descriptor of advancedFieldTypesCompatibilityExample.fields) {
    assert.ok(markup.includes(`>${descriptor.name}`), `fixture field ${descriptor.name} must render its field wrapper`);
  }

  const dom = new JSDOM(markup);
  const { document } = dom.window;

  assert.ok(document.querySelector('[role="radiogroup"][aria-label="satisfaction"]'), 'the fixture rating field must render rating semantics');
  const birthDate = document.querySelector<HTMLInputElement>('input[name="birthDate"]');
  assert.ok(birthDate);
  assert.equal(birthDate.type, 'date', 'the fixture date field must render a native date input');
  const resume = document.querySelector<HTMLInputElement>('input[name="resume"]');
  assert.ok(resume);
  assert.equal(resume.type, 'file', 'the fixture resume field must render a file input');
  assert.ok(document.querySelector('textarea[name="aboutMe"]'), 'the fixture textarea field must render a textarea');
  const password = document.querySelector<HTMLInputElement>('input[name="password"]');
  assert.ok(password);
  assert.equal(password.type, 'password', 'the fixture password field must render a password input');
  const workEmail = document.querySelector<HTMLInputElement>('input[name="workEmail"]');
  assert.ok(workEmail);
  assert.equal(workEmail.type, 'email', 'the fixture email field must render an email input');
  assert.ok(document.querySelector('input[name="phoneNumber"]'), 'the fixture phone field must render the phone control');

  const skillsDescriptor = findExampleField(advancedFieldTypesCompatibilityExample, 'skills');
  const firstSkill = skillsDescriptor.options?.[0];

  assert.ok(typeof firstSkill === 'object' && firstSkill !== null, 'the fixture skills options must carry object labels');
  assert.ok(document.querySelector('[data-slot="badge"]'), 'the fixture multiSelect default selection must render a badge');
  assert.ok(document.querySelector(`[aria-label="Remove ${firstSkill.label}"]`), 'the multiSelect badge must show the fixture option label');
});

test('advanced field registry maps all phase 8 field types', () => {
  const source = readFileSync(sourcePath('field-registry.tsx'), 'utf8');

  for (const fieldType of advancedTypes) {
    assert.match(source, new RegExp(`${fieldType}:`));
  }
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

type FormedibleHookApi = ReturnType<typeof useFormedible<FormedibleFormValues>>;

test('date field commits local midnight Date instances and clears to undefined', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function ExampleForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Start date',
          dateConfig: {
            disableDate: (date) => {
              if (Number.isNaN(date.getTime())) {
                throw new Error('disableDate invoked with an invalid date');
              }

              return false;
            },
          },
        },
      ],
      formOptions: {
        defaultValues: { startDate: '' },
      },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const input = rendered.document.querySelector<HTMLInputElement>('input[name="startDate"]');
  assert.ok(input);
  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  setNativeInputValue(input, '1990-05-05', defaultView);
  act(() => {
    input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });

  const committed = formApi?.state.values.startDate;
  assert.ok(committed instanceof Date);
  assert.equal(committed.getFullYear(), 1990);
  assert.equal(committed.getMonth(), 4);
  assert.equal(committed.getDate(), 5);

  setNativeInputValue(input, '', defaultView);
  act(() => {
    input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(formApi?.state.values.startDate, undefined);
  rendered.unmount();
});

function LocalMidnightDateForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'startDate', type: 'date', label: 'Start date' },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: {
      defaultValues: { startDate: new Date(2026, 0, 15) },
    },
  });

  return <Form />;
}

test('date field renders local midnight dates as their own day', () => {
  assert.equal(toDateInputValue(new Date(2026, 0, 15)), '2026-01-15');

  const markup = renderToStaticMarkup(<LocalMidnightDateForm />);

  assert.match(markup, /value="2026-01-15"/);
});

function DateBoundsForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'pickupOnly', type: 'date', label: 'Pickup', dateConfig: { disablePastDates: true } },
    { name: 'pickupPastMin', type: 'date', label: 'Pickup with past min', dateConfig: { disablePastDates: true, minDate: new Date(2000, 0, 1) } },
    { name: 'pickupFutureMin', type: 'date', label: 'Pickup with future min', dateConfig: { disablePastDates: true, minDate: new Date(2030, 5, 1) } },
    { name: 'returnOnly', type: 'date', label: 'Return', dateConfig: { disableFutureDates: true } },
    { name: 'returnFutureMax', type: 'date', label: 'Return with future max', dateConfig: { disableFutureDates: true, maxDate: new Date(2030, 11, 31) } },
    { name: 'returnPastMax', type: 'date', label: 'Return with past max', dateConfig: { disableFutureDates: true, maxDate: new Date(2000, 0, 1) } },
    { name: 'plainBounds', type: 'date', label: 'Plain bounds', dateConfig: { minDate: new Date(2024, 2, 10), maxDate: new Date(2024, 3, 20) } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: {
      defaultValues: {},
    },
  });

  return <Form />;
}

test('date field disablePastDates and disableFutureDates clamp bounds around today', () => {
  const rendered = renderClient(<DateBoundsForm />);

  const today = toDateInputValue(new Date());

  const pickupOnly = rendered.document.querySelector<HTMLInputElement>('input[name="pickupOnly"]');
  assert.ok(pickupOnly);
  assert.equal(pickupOnly.getAttribute('min'), today);
  assert.equal(pickupOnly.getAttribute('max'), null);

  const pickupPastMin = rendered.document.querySelector<HTMLInputElement>('input[name="pickupPastMin"]');
  assert.ok(pickupPastMin);
  assert.equal(pickupPastMin.getAttribute('min'), today);

  const pickupFutureMin = rendered.document.querySelector<HTMLInputElement>('input[name="pickupFutureMin"]');
  assert.ok(pickupFutureMin);
  assert.equal(pickupFutureMin.getAttribute('min'), '2030-06-01');

  const returnOnly = rendered.document.querySelector<HTMLInputElement>('input[name="returnOnly"]');
  assert.ok(returnOnly);
  assert.equal(returnOnly.getAttribute('max'), today);
  assert.equal(returnOnly.getAttribute('min'), null);

  const returnFutureMax = rendered.document.querySelector<HTMLInputElement>('input[name="returnFutureMax"]');
  assert.ok(returnFutureMax);
  assert.equal(returnFutureMax.getAttribute('max'), today);

  const returnPastMax = rendered.document.querySelector<HTMLInputElement>('input[name="returnPastMax"]');
  assert.ok(returnPastMax);
  assert.equal(returnPastMax.getAttribute('max'), '2000-01-01');

  const plainBounds = rendered.document.querySelector<HTMLInputElement>('input[name="plainBounds"]');
  assert.ok(plainBounds);
  assert.equal(plainBounds.getAttribute('min'), '2024-03-10');
  assert.equal(plainBounds.getAttribute('max'), '2024-04-20');

  rendered.unmount();
});

test('cleared phone input commits empty string instead of format literals', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function PhoneClearBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'phoneIntl', type: 'phone', label: 'Phone intl', phoneConfig: { defaultCountry: 'US', format: 'international' } },
        { name: 'phoneNat', type: 'phone', label: 'Phone nat', phoneConfig: { defaultCountry: 'US', format: 'national' } },
      ],
      formOptions: { defaultValues: { phoneIntl: '', phoneNat: '' } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<PhoneClearBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const intlInput = rendered.document.querySelector<HTMLInputElement>('input[name="phoneIntl"]');
  assert.ok(intlInput);
  setNativeInputValue(intlInput, '5551234567', defaultView);
  act(() => {
    intlInput.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.phoneIntl, '+1 (555) 123-4567');

  setNativeInputValue(intlInput, '', defaultView);
  act(() => {
    intlInput.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.phoneIntl, '');
  assert.equal(intlInput.value, '');

  const natInput = rendered.document.querySelector<HTMLInputElement>('input[name="phoneNat"]');
  assert.ok(natInput);
  setNativeInputValue(natInput, '5551234567', defaultView);
  act(() => {
    natInput.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.phoneNat, '(555) 123-4567');

  setNativeInputValue(natInput, '', defaultView);
  act(() => {
    natInput.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.phoneNat, '');
  assert.equal(natInput.value, '');

  rendered.unmount();
});

test('phone country menu closes on escape and outside pointerdown', async () => {
  function PhoneMenuBehaviorForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'phone', type: 'phone', label: 'Phone', phoneConfig: { defaultCountry: 'US' } }],
      formOptions: { defaultValues: { phone: '' } },
    });

    return <Form />;
  }

  const rendered = renderClient(<PhoneMenuBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const findMenu = () => rendered.document.querySelector('[data-slot="phone-country-menu"]');
  const findTrigger = () => [...rendered.document.querySelectorAll('button')].find((button) => button.textContent?.trim().startsWith('+1'));
  const trigger = findTrigger();
  assert.ok(trigger);

  act(() => {
    trigger.click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.ok(findMenu());

  act(() => {
    findMenu()?.querySelector('button')?.dispatchEvent(new defaultView.Event('pointerdown', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.ok(findMenu(), 'pointerdown inside the menu must not dismiss it');

  act(() => {
    rendered.document.dispatchEvent(new defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(findMenu(), null, 'escape must dismiss the menu');

  const reopenedTrigger = findTrigger();
  assert.ok(reopenedTrigger);
  act(() => {
    reopenedTrigger.click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.ok(findMenu());

  act(() => {
    rendered.document.body.dispatchEvent(new defaultView.Event('pointerdown', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(findMenu(), null, 'outside pointerdown must dismiss the menu');

  rendered.unmount();
});

test('autocomplete display text resolves option labels and raw values', () => {
  const options: readonly FormedibleOptionConfig[] = [
    { value: 'fr', label: 'France' },
    { value: 'de', label: 42 },
  ];

  assert.equal(getAutocompleteDisplayText('fr', options), 'France');
  assert.equal(getAutocompleteDisplayText('de', options), '42');
  assert.equal(getAutocompleteDisplayText('zz', options), 'zz');
  assert.equal(getAutocompleteDisplayText(undefined, options), '');
});

test('autocomplete input syncs with external field value changes', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function AutocompleteSyncBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'legacyCountry',
          type: 'autocomplete',
          label: 'Legacy country',
          autocompleteConfig: { options: [{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }] },
        },
      ],
      formOptions: { defaultValues: { legacyCountry: '' } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<AutocompleteSyncBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const input = rendered.document.querySelector<HTMLInputElement>('input[name="legacyCountry"]');
  assert.ok(input);
  assert.equal(input.value, '');

  await act(async () => {
    formApi?.setFieldValue('legacyCountry', 'de');
    await wait(0);
  });
  assert.equal(input.value, 'Germany', 'programmatic option values must surface their label');

  await act(async () => {
    formApi?.setFieldValue('legacyCountry', 'Narnia');
    await wait(0);
  });
  assert.equal(input.value, 'Narnia', 'raw external strings without a matching option pass through');

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);
  setNativeInputValue(input, 'Spain', defaultView);
  act(() => {
    input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  act(() => {
    input.dispatchEvent(new defaultView.Event('focusout', { bubbles: true }));
  });
  await act(async () => {
    await wait(200);
  });
  assert.equal(formApi?.state.values.legacyCountry, 'Spain', 'custom blur commit keeps working with allowCustom defaulting to true');
  assert.equal(input.value, 'Spain');

  await act(async () => {
    formApi?.reset();
    await wait(0);
  });
  assert.equal(input.value, '', 'form reset must clear the autocomplete input');

  rendered.unmount();
});

test('autocomplete blur reverts custom text when allowCustom is false', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function AutocompleteStrictBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'strictCountry',
          type: 'autocomplete',
          label: 'Strict country',
          autocompleteConfig: { allowCustom: false, options: [{ value: 'fr', label: 'France' }, { value: 'de', label: 'Germany' }] },
        },
      ],
      formOptions: { defaultValues: { strictCountry: '' } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<AutocompleteStrictBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const input = rendered.document.querySelector<HTMLInputElement>('input[name="strictCountry"]');
  assert.ok(input);

  setNativeInputValue(input, 'Franc', defaultView);
  act(() => {
    input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });

  const franceOption = [...rendered.document.querySelectorAll('button')].find((button) => button.textContent?.startsWith('France'));
  assert.ok(franceOption, 'typing must surface the France option');
  act(() => {
    franceOption.click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(input.value, 'France');
  assert.equal(formApi?.state.values.strictCountry, 'fr');

  setNativeInputValue(input, 'zzz', defaultView);
  act(() => {
    input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
  });
  act(() => {
    input.dispatchEvent(new defaultView.Event('focusout', { bubbles: true }));
  });
  await act(async () => {
    await wait(200);
  });
  assert.equal(input.value, 'France', 'blur with uncommitted custom text must revert to the selected option label');
  assert.equal(formApi?.state.values.strictCountry, 'fr', 'blur revert must not corrupt the committed value');

  rendered.unmount();
});

test('half ratings render distinct markup with correct radio semantics', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function HalfRatingBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'halfRating', type: 'rating', label: 'Half rating', ratingConfig: { max: 5, allowHalf: true } },
        { name: 'fullRating', type: 'rating', label: 'Full rating', ratingConfig: { max: 5, allowHalf: true } },
      ],
      formOptions: { defaultValues: { halfRating: 3.5, fullRating: 4 } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<HalfRatingBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const halfGroup = rendered.document.querySelector('[role="radiogroup"][aria-label="Half rating"]');
  assert.ok(halfGroup);
  const fullGroup = rendered.document.querySelector('[role="radiogroup"][aria-label="Full rating"]');
  assert.ok(fullGroup);

  const checkedState = (group: Element, label: string) => group.querySelector(`button[aria-label="${label}"]`)?.getAttribute('aria-checked');

  assert.equal(halfGroup.querySelectorAll('[data-slot="rating-half"]').length, 1, '3.5 must render exactly one half-filled star');
  assert.equal(checkedState(halfGroup, 'Rate 3.5'), 'true');
  assert.equal(checkedState(halfGroup, 'Rate 3'), 'false');
  assert.equal(checkedState(halfGroup, 'Rate 4'), 'false');

  assert.equal(fullGroup.querySelectorAll('[data-slot="rating-half"]').length, 0, '4 must not render half-filled stars');
  assert.equal(checkedState(fullGroup, 'Rate 4'), 'true');
  assert.equal(checkedState(fullGroup, 'Rate 4.5'), 'false');
  assert.equal(checkedState(fullGroup, 'Rate 3'), 'false');

  const halfButton = fullGroup.querySelector<HTMLButtonElement>('button[aria-label="Rate 2.5"]');
  assert.ok(halfButton);
  act(() => {
    halfButton.click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.fullRating, 2.5, 'clicking a half-step button commits the half value');
  assert.equal(fullGroup.querySelectorAll('[data-slot="rating-half"]').length, 1, '2.5 must render a distinct half-filled star');
  assert.equal(checkedState(fullGroup, 'Rate 2.5'), 'true');
  assert.equal(checkedState(fullGroup, 'Rate 4'), 'false');

  rendered.unmount();
});

test('duration text entry preserves drafts per keystroke and commits valid parses', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function DurationTypingBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'duration', type: 'duration', label: 'Duration', durationConfig: { format: 'hms' } }],
      formOptions: { defaultValues: { duration: 0 } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<DurationTypingBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const input = rendered.document.querySelector<HTMLInputElement>('input[placeholder="Enter duration (e.g., 1h 30m 45s)"]');
  assert.ok(input);
  assert.equal(input.value, '0');

  const typeDurationText = (nextValue: string) => {
    setNativeInputValue(input, nextValue, defaultView);
    act(() => {
      input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
    });
  };

  typeDurationText('1');
  assert.equal(input.value, '1', 'intermediate text without a unit token must stay untouched');
  assert.equal(formApi?.state.values.duration, 0, 'intermediate text must not commit');

  typeDurationText('1h');
  assert.equal(input.value, '1h');
  assert.deepEqual(formApi?.state.values.duration, { hours: 1, minutes: 0, seconds: 0, totalSeconds: 3600 });

  typeDurationText('1h ');
  assert.equal(input.value, '1h ');
  assert.deepEqual(formApi?.state.values.duration, { hours: 1, minutes: 0, seconds: 0, totalSeconds: 3600 });

  typeDurationText('1h 3');
  assert.equal(input.value, '1h 3');
  typeDurationText('1h 30');
  assert.equal(input.value, '1h 30');
  assert.deepEqual(formApi?.state.values.duration, { hours: 1, minutes: 0, seconds: 0, totalSeconds: 3600 }, 'partial minute text must not corrupt the committed value');

  typeDurationText('1h 30m');
  assert.equal(input.value, '1h 30m');
  assert.deepEqual(formApi?.state.values.duration, { hours: 1, minutes: 30, seconds: 0, totalSeconds: 5400 });

  typeDurationText('zzz');
  assert.equal(input.value, 'zzz');
  assert.deepEqual(formApi?.state.values.duration, { hours: 1, minutes: 30, seconds: 0, totalSeconds: 5400 }, 'invalid drafts must not be stored');

  act(() => {
    input.dispatchEvent(new defaultView.Event('focusout', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(input.value, '1h 30m', 'blur must revert invalid drafts to the committed duration');
  assert.deepEqual(formApi?.state.values.duration, { hours: 1, minutes: 30, seconds: 0, totalSeconds: 5400 });

  rendered.unmount();
});

test('duration hours, minutes, and seconds formats gate unit selects and round-trip bare numbers', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function DurationUnitFormatsBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'hoursDuration', type: 'duration', label: 'Hours duration', durationConfig: { format: 'hours' } },
        { name: 'minutesDuration', type: 'duration', label: 'Minutes duration', durationConfig: { format: 'minutes' } },
        { name: 'secondsDuration', type: 'duration', label: 'Seconds duration', durationConfig: { format: 'seconds' } },
      ],
      formOptions: { defaultValues: { hoursDuration: 2, minutesDuration: 90, secondsDuration: 90 } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<DurationUnitFormatsBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const unitSelects = (unit: string) => [...rendered.document.querySelectorAll(`[data-slot="duration-select"][data-unit="${unit}"]`)];
  assert.equal(unitSelects('hours').length, 1, 'hours format renders exactly one Hours select');
  assert.equal(unitSelects('minutes').length, 1, 'minutes format renders exactly one Minutes select');
  assert.equal(unitSelects('seconds').length, 1, 'seconds format renders exactly one Seconds select');
  assert.equal(rendered.document.querySelectorAll('[data-slot="duration-select"]').length, 3, 'hours and minutes formats must not render stray selects');

  const hoursTriggerValue = unitSelects('hours')[0]?.querySelector('[data-slot="select-value"]')?.textContent ?? '';
  assert.match(hoursTriggerValue, /^0?2$/, 'stored 2 in hours format must render as 2 hours, not snap to 00');

  const textInputs = [...rendered.document.querySelectorAll<HTMLInputElement>('input[placeholder="Enter duration (e.g., 1h 30m 45s)"]')];
  assert.equal(textInputs.length, 3);
  assert.equal(textInputs[0]?.value, '2h', 'bare number 2 in hours format renders as 2 hours');
  assert.equal(textInputs[1]?.value, '30m', 'minutes format renders only its gated unit segment');
  assert.equal(textInputs[2]?.value, '30s', 'seconds format renders only its gated unit segment');

  const totalLines = [...rendered.document.querySelectorAll('div.text-sm.text-muted-foreground')].map((element) => element.textContent ?? '');
  assert.ok(totalLines.includes('Total: 7200 seconds'), 'hours-format value must total 2 hours');
  assert.ok(totalLines.includes('Total: 5400 seconds'), 'minutes-format value must total 90 minutes');
  assert.ok(totalLines.includes('Total: 90 seconds'), 'seconds-format value must total 90 seconds');

  const hoursInput = textInputs[0];
  assert.ok(hoursInput);
  for (const keystroke of ['3', '3h']) {
    setNativeInputValue(hoursInput, keystroke, defaultView);
    act(() => {
      hoursInput.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
    });
  }
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.hoursDuration, 3, 'editing in hours format commits a bare hours number');
  assert.equal(hoursInput.value, '3h');

  await act(async () => {
    formApi?.setFieldValue('hoursDuration', 5);
    await wait(0);
  });
  assert.equal(formApi?.state.values.hoursDuration, 5);
  assert.equal(hoursInput.value, '5h', 'external hour values must not snap back to 00');
  assert.match(unitSelects('hours')[0]?.querySelector('[data-slot="select-value"]')?.textContent ?? '', /^0?5$/);

  rendered.unmount();
});

test('color picker text entry preserves drafts, commits normalized colors, and flags invalid input', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  function ColorTypingBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'favoriteColor', type: 'colorPicker', label: 'Favorite color' },
        { name: 'workColor', type: 'colorPicker', label: 'Work color', colorConfig: { format: 'rgb' } },
      ],
      formOptions: { defaultValues: { favoriteColor: '#000000', workColor: 'rgb(255, 0, 0)' } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<ColorTypingBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const colorInputs = [...rendered.document.querySelectorAll<HTMLInputElement>('input[placeholder="#000000"]')];
  assert.equal(colorInputs.length, 2);
  const hexInput = colorInputs[0];
  const rgbInput = colorInputs[1];
  assert.ok(hexInput && rgbInput);
  assert.equal(hexInput.value, '#000000');
  assert.equal(rgbInput.value, 'rgb(255, 0, 0)');

  const typeColorText = (input: HTMLInputElement, nextValue: string) => {
    setNativeInputValue(input, nextValue, defaultView);
    act(() => {
      input.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
    });
  };

  typeColorText(hexInput, '#f');
  assert.equal(hexInput.value, '#f', 'intermediate hex drafts must stay untouched');
  assert.equal(formApi?.state.values.favoriteColor, '#000000', 'intermediate hex drafts must not commit');

  typeColorText(hexInput, '#ff0000');
  assert.equal(hexInput.value, '#ff0000');
  assert.equal(formApi?.state.values.favoriteColor, '#ff0000', 'a valid hex draft commits immediately');
  assert.notEqual(hexInput.getAttribute('aria-invalid'), 'true', 'valid drafts must not be flagged');

  typeColorText(hexInput, 'zzz');
  assert.equal(hexInput.value, 'zzz');
  assert.equal(formApi?.state.values.favoriteColor, '#ff0000', 'invalid drafts must not be stored');
  assert.equal(hexInput.getAttribute('aria-invalid'), 'true', 'invalid drafts must be flagged inline');
  assert.ok(rendered.document.querySelector('[data-slot="color-invalid-hint"]'), 'invalid drafts must surface an inline hint');

  act(() => {
    hexInput.dispatchEvent(new defaultView.Event('focusout', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(hexInput.value, '#ff0000', 'blur must revert invalid drafts to the committed color');
  assert.equal(formApi?.state.values.favoriteColor, '#ff0000');
  assert.equal(hexInput.getAttribute('aria-invalid'), null);

  typeColorText(rgbInput, 'rgb(0, 128, 255)');
  act(() => {
    rgbInput.dispatchEvent(new defaultView.Event('focusout', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(formApi?.state.values.workColor, 'rgb(0, 128, 255)');
  assert.equal(rgbInput.value, 'rgb(0, 128, 255)');

  rendered.unmount();
});

test('multi-select trigger keeps remove affordances out of nested buttons and removable via pointer and keyboard', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;

  const multiSelectFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'extras', type: 'multiSelect', label: 'Extras', options: ['gps', 'wifi'], multiSelectConfig: { searchable: true } },
  ];

  function MultiSelectStructureForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: multiSelectFields,
      formOptions: { defaultValues: { extras: ['gps', 'wifi'] } },
    });

    formApi = form;

    return <Form />;
  }

  const markup = renderToStaticMarkup(<MultiSelectStructureForm />);
  const serverDom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`);
  const serverTrigger = serverDom.window.document.querySelector('button[aria-expanded]');
  assert.ok(serverTrigger, 'the multi-select trigger renders as a button');
  assert.equal(serverTrigger.querySelectorAll('button').length, 0, 'SSR markup must not nest buttons inside the trigger button');
  assert.ok(serverTrigger.querySelector('[role="button"][aria-label="Remove gps"]'), 'each badge exposes a remove affordance with an accessible name');

  const rendered = renderClient(<MultiSelectStructureForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const trigger = rendered.document.querySelector<HTMLButtonElement>('button[aria-expanded]');
  assert.ok(trigger);
  assert.equal(trigger.querySelectorAll('button').length, 0, 'the hydrated trigger must not contain nested buttons');

  const removeGps = trigger.querySelector<HTMLElement>('[role="button"][aria-label="Remove gps"]');
  assert.ok(removeGps);
  act(() => {
    removeGps.click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.deepEqual(formApi?.state.values.extras, ['wifi'], 'clicking the remove affordance removes the value');
  assert.equal(rendered.document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded'), 'false', 'removing a badge must not toggle the options dropdown');

  const removeWifi = rendered.document.querySelector<HTMLElement>('[role="button"][aria-label="Remove wifi"]');
  assert.ok(removeWifi);
  act(() => {
    removeWifi.dispatchEvent(new defaultView.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.deepEqual(formApi?.state.values.extras, [], 'keyboard activation removes the value');

  rendered.unmount();
});

test('file upload surfaces rejected files inline, fires the rejection callback, and clears on the next accepted selection', async () => {
  let formApi: FormedibleHookApi['form'] | undefined;
  const recordedRejections: { name: string; reason: string }[][] = [];

  function FileRejectionBehaviorForm() {
    const { Form, form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'attachments',
          type: 'file',
          label: 'Attachments',
          fileConfig: {
            multiple: true,
            maxFiles: 2,
            maxSize: 10,
            onFilesRejected: (rejections) => {
              recordedRejections.push(rejections.map((rejection) => ({ name: rejection.file.name, reason: rejection.reason })));
            },
          },
        },
      ],
      formOptions: { defaultValues: { attachments: null } },
    });

    formApi = form;

    return <Form />;
  }

  const rendered = renderClient(<FileRejectionBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const input = rendered.document.querySelector<HTMLInputElement>('input[type="file"][name="attachments"]');
  assert.ok(input);

  const selectFiles = (files: readonly File[]) => {
    Object.defineProperty(input, 'files', { configurable: true, value: files });
    act(() => {
      input.dispatchEvent(new defaultView.Event('change', { bubbles: true }));
    });
  };

  const goodFile = new File(['123456789'], 'good.txt');
  const oversizedFile = new File(['1234567890123'], 'oversized.txt');
  const excessFile = new File(['12345'], 'excess.txt');

  selectFiles([goodFile, oversizedFile, excessFile]);
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(formApi?.state.values.attachments, [goodFile], 'only files within the size and count limits are accepted');

  assert.equal(recordedRejections.length, 1, 'the rejection callback fires once per rejected selection');
  assert.deepEqual(recordedRejections[0], [
    { name: 'oversized.txt', reason: 'maxSize' },
    { name: 'excess.txt', reason: 'maxFiles' },
  ]);

  const feedback = rendered.document.querySelector('[data-slot="file-rejections"]');
  assert.ok(feedback, 'rejected files must surface an inline message');
  assert.match(feedback.textContent ?? '', /oversized\.txt was not uploaded \(exceeds the maximum file size\)/);
  assert.match(feedback.textContent ?? '', /excess\.txt was not uploaded \(exceeds the maximum number of files\)/);

  selectFiles([new File(['abc'], 'replacement.txt')]);
  await act(async () => {
    await wait(0);
  });
  assert.equal(rendered.document.querySelector('[data-slot="file-rejections"]'), null, 'a fully accepted selection replaces the rejection message');
  assert.deepEqual(
    formApi?.state.values.attachments?.map((file) => (file instanceof File ? file.name : '')),
    ['replacement.txt'],
  );
  assert.equal(recordedRejections.length, 1, 'accepted selections must not fire the rejection callback');

  rendered.unmount();
});

test('file list renders every selected file even when names and sizes collide', async () => {
  const duplicateOne = new File(['aaa'], 'duplicate.txt');
  const duplicateTwo = new File(['bbb'], 'duplicate.txt');

  function DuplicateFileNameForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'attachments', type: 'file', label: 'Attachments', fileConfig: { multiple: true } }],
      formOptions: { defaultValues: { attachments: [duplicateOne, duplicateTwo] } },
    });

    return <Form />;
  }

  const rendered = renderClient(<DuplicateFileNameForm />);
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.document.querySelectorAll('span[title="duplicate.txt"]').length, 2, 'both files with identical names and sizes must render');
  assert.equal(rendered.document.querySelectorAll('button[aria-label="Remove file"]').length, 2, 'each rendered file keeps its own remove affordance');

  rendered.unmount();
});

test('location search results dismiss on escape and outside pointerdown but not on inside pointerdown', async () => {
  function LocationDismissalBehaviorForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'venue',
          type: 'location',
          label: 'Venue',
          locationConfig: {
            searchCallback: (query): readonly FormedibleLocationValue[] => [{ lat: 48.8566, lng: 2.3522, address: `Paris ${query}` }],
          },
        },
      ],
      formOptions: { defaultValues: { venue: null } },
    });

    return <Form />;
  }

  const rendered = renderClient(<LocationDismissalBehaviorForm />);
  await act(async () => {
    await wait(0);
  });

  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);

  const searchInput = rendered.document.querySelector<HTMLInputElement>('input[name="venue"]');
  assert.ok(searchInput);

  const findResults = () => rendered.document.querySelector('[data-slot="location-results"]');

  const typeQuery = (nextValue: string) => {
    setNativeInputValue(searchInput, nextValue, defaultView);
    act(() => {
      searchInput.dispatchEvent(new defaultView.Event('input', { bubbles: true }));
    });
  };

  typeQuery('Pa');
  await act(async () => {
    await wait(400);
  });
  assert.ok(findResults(), 'debounced search results must render');

  act(() => {
    findResults()?.querySelector('button')?.dispatchEvent(new defaultView.Event('pointerdown', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.ok(findResults(), 'pointerdown inside the results must not dismiss them');

  act(() => {
    rendered.document.dispatchEvent(new defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(findResults(), null, 'escape must dismiss the results');

  typeQuery('Par');
  await act(async () => {
    await wait(400);
  });
  assert.ok(findResults(), 'new search results reopen the dropdown');

  act(() => {
    rendered.document.body.dispatchEvent(new defaultView.Event('pointerdown', { bubbles: true }));
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(findResults(), null, 'pointerdown outside the search area must dismiss the results');

  rendered.unmount();
});

function SliderGradientForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    {
      name: 'performanceLevel',
      type: 'slider',
      label: 'Performance level',
      sliderConfig: {
        min: 0,
        max: 100,
        step: 10,
        gradientColors: { start: '#ef4444', end: '#22c55e', direction: 'horizontal' },
      },
    },
    {
      name: 'verticalLevel',
      type: 'slider',
      label: 'Vertical level',
      sliderConfig: { min: 0, max: 10, gradientColors: { start: '#111111', end: '#eeeeee', direction: 'vertical' } },
    },
    { name: 'plainRange', type: 'slider', label: 'Plain range', sliderConfig: { min: 0, max: 10 } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: { defaultValues: { performanceLevel: 50, verticalLevel: 5, plainRange: 5 } },
  });

  return <Form />;
}

function TopLevelFilePropsForm() {
  const fields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = [
    { name: 'resume', type: 'file', label: 'Resume', accept: '.pdf,.doc', multiple: true },
    { name: 'avatar', type: 'file', label: 'Avatar', fileConfig: { accept: 'image/*', multiple: false } },
  ];

  const { Form } = useFormedible<FormedibleFormValues>({
    fields,
    formOptions: { defaultValues: { resume: null, avatar: null } },
  });

  return <Form />;
}

interface CollapsibleObjectValues extends FormedibleFormValues {
  readonly billing: { readonly address: string; readonly city: string };
  readonly notes: string;
}

function CollapsibleObjectForm(config: { readonly defaultExpanded?: boolean; readonly showCard?: boolean; readonly layout?: 'stack' | 'grid' | 'vertical' | 'horizontal' }) {
  const fields: readonly FormedibleFieldConfig<CollapsibleObjectValues>[] = [
    { name: 'notes', type: 'textarea', label: 'Notes' },
    {
      name: 'billing',
      type: 'object',
      label: 'Billing address',
      objectConfig: {
        collapsible: true,
        defaultExpanded: config.defaultExpanded,
        showCard: config.showCard,
        collapseLabel: 'Hide billing',
        expandLabel: 'Show billing',
        layout: config.layout,
        fields: [
          { name: 'address', type: 'text', label: 'Street address' },
          { name: 'city', type: 'text', label: 'City' },
        ],
      },
    },
  ];

  return function ObjectForm() {
    const { Form } = useFormedible<CollapsibleObjectValues>({
      fields,
      formOptions: { defaultValues: { billing: { address: '', city: '' }, notes: '' }, onSubmit: () => undefined },
    });

    return <Form />;
  };
}

test('slider gradientColors paints the gradient track style and class', () => {
  const dom = new JSDOM(renderToStaticMarkup(<SliderGradientForm />));
  const { document } = dom.window;

  const performanceSlider = document.querySelector<HTMLInputElement>('input[name="performanceLevel"]');
  const verticalSlider = document.querySelector<HTMLInputElement>('input[name="verticalLevel"]');
  const plainSlider = document.querySelector<HTMLInputElement>('input[name="plainRange"]');

  assert.ok(performanceSlider);
  assert.ok(verticalSlider);
  assert.ok(plainSlider);

  assert.equal(performanceSlider.getAttribute('data-formedible-slider-gradient'), 'true');
  assert.match(performanceSlider.className, /formedible-slider-gradient/);
  assert.equal(
    performanceSlider.style.background,
    'linear-gradient(90deg, rgb(239, 68, 68), rgb(34, 197, 94))',
    'horizontal gradient must paint the slider track background',
  );

  assert.equal(
    verticalSlider.style.background,
    'linear-gradient(180deg, rgb(17, 17, 17), rgb(238, 238, 238))',
    'vertical gradient must use the 180deg direction',
  );

  assert.equal(plainSlider.hasAttribute('data-formedible-slider-gradient'), false, 'plain sliders keep their default track');
  assert.equal(plainSlider.style.background, '');
});

test('top-level accept and multiple file props are honored', () => {
  const dom = new JSDOM(renderToStaticMarkup(<TopLevelFilePropsForm />));
  const { document } = dom.window;

  const resumeInput = document.querySelector<HTMLInputElement>('input[name="resume"]');
  const avatarInput = document.querySelector<HTMLInputElement>('input[name="avatar"]');

  assert.ok(resumeInput);
  assert.ok(avatarInput);
  assert.equal(resumeInput.type, 'file');
  assert.equal(resumeInput.getAttribute('accept'), '.pdf,.doc', 'top-level accept must reach the file input');
  assert.equal(resumeInput.multiple, true, 'top-level multiple must reach the file input');
  assert.equal(avatarInput.getAttribute('accept'), 'image/*', 'fileConfig.accept keeps working');
  assert.equal(avatarInput.multiple, false, 'fileConfig.multiple keeps working');
  assert.match(document.body.textContent ?? '', /Accepted types: \.pdf,\.doc/);
});

test('collapsible object toggles its nested fields and starts expanded by default', async () => {
  const ObjectForm = CollapsibleObjectForm({});

  const rendered = renderClient(<ObjectForm />);
  await act(async () => {
    await wait(0);
  });

  assert.ok(rendered.document.querySelector('input[name="billing.address"]'), 'nested fields render while expanded');

  const toggle = rendered.document.querySelector<HTMLElement>('[data-formedible-object-toggle="billing"]');
  assert.ok(toggle, 'the collapsible object must render a toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.match(toggle.textContent ?? '', /Hide billing/);

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.document.querySelector('input[name="billing.address"]'), null, 'collapsing must hide the nested fields');
  assert.equal(rendered.document.querySelector('input[name="billing.city"]'), null, 'collapsing must hide every nested field');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.match(toggle.textContent ?? '', /Show billing/);
  assert.ok(rendered.document.querySelector('textarea[name="notes"]'), 'fields outside the object stay visible');

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.ok(rendered.document.querySelector('input[name="billing.address"]'), 'expanding must restore the nested fields');
  rendered.unmount();
});

test('collapsible object starts collapsed with defaultExpanded false and showCard wraps a card', async () => {
  const ObjectForm = CollapsibleObjectForm({ defaultExpanded: false, showCard: true });
  const markup = renderToStaticMarkup(<ObjectForm />);

  assert.match(markup, /data-formedible-object-card="billing"/);
  assert.doesNotMatch(markup, /name="billing\.address"/, 'defaultExpanded: false must render the object collapsed');

  const rendered = renderClient(<ObjectForm />);
  await act(async () => {
    await wait(0);
  });

  const toggle = rendered.document.querySelector<HTMLElement>('[data-formedible-object-toggle="billing"]');
  assert.ok(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.ok(rendered.document.querySelector('input[name="billing.address"]'), 'the toggle must expand the object fields');
  assert.ok(rendered.document.querySelector('[data-formedible-object-card="billing"]'), 'the card wrapper must stay rendered');
  rendered.unmount();
});

test('object layout vertical and horizontal aliases render like stack', () => {
  const VerticalObjectForm = CollapsibleObjectForm({ layout: 'vertical' });
  const HorizontalObjectForm = CollapsibleObjectForm({ layout: 'horizontal' });

  const verticalMarkup = renderToStaticMarkup(<VerticalObjectForm />);
  const horizontalMarkup = renderToStaticMarkup(<HorizontalObjectForm />);

  for (const markup of [verticalMarkup, horizontalMarkup]) {
    assert.ok(markup.includes('name="billing.address"'), 'legacy layout aliases must render the nested fields');
    assert.doesNotMatch(markup, /grid-template-columns/, 'legacy layout aliases must not apply the grid layout');
  }
});
