import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { exportConversation, persistConversations, readPersistedAIBuilderState } from '@/lib/formedible/ai-storage';
import type { AiConversation, ProviderSettings } from '@/lib/formedible/ai-types';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function installWindowStorage(storage: Storage): () => void {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage },
  });

  return () => {
    if (previousWindow) {
      Object.defineProperty(globalThis, 'window', previousWindow);
      return;
    }

    Reflect.deleteProperty(globalThis, 'window');
  };
}

const fallbackProviderSettings: ProviderSettings = {
  provider: 'openrouter',
  model: 'openai/gpt-4o-mini',
};

function createConversation(formConfig: NonNullable<AiConversation['messages'][number]['formConfig']>): AiConversation {
  return {
    id: 'conversation_1',
    title: 'Canonical config preservation',
    messages: [
      {
        id: 'message_1',
        role: 'assistant',
        content: 'Generated form',
        formConfig,
      },
    ],
    createdAt: 1,
    updatedAt: 2,
  };
}

describe('AI storage canonical config preservation', () => {
  it('round-trips all supported serializable canonical field configs through conversation export', () => {
    const minDate = new Date('2026-01-01T00:00:00.000Z');
    const maxDate = new Date('2026-12-31T23:59:59.000Z');
    const conversation = createConversation({
      fields: [
        {
          name: 'appointmentDate',
          type: 'date',
          dateConfig: {
            minDate,
            maxDate,
            format: 'yyyy-MM-dd',
            disableDate: () => false,
          },
        },
        {
          name: 'budget',
          type: 'slider',
          sliderConfig: {
            min: 0,
            max: 100,
            step: 5,
            valueMapping: [{ sliderValue: 50, displayValue: '$50', label: 'Midpoint' }],
            valueLabelPrefix: '$',
            valueLabelSuffix: ' USD',
            valueDisplayPrecision: 0,
            showRawValue: false,
            showValue: true,
            marks: [{ value: 100, label: 'Max' }],
            visualizationComponent: () => null,
          },
        },
        {
          name: 'rating',
          type: 'rating',
          ratingConfig: { max: 10, allowHalf: true, icon: 'heart', size: 'lg', showValue: true },
        },
        {
          name: 'tags',
          type: 'multiSelect',
          multiSelectConfig: { maxSelections: 3, searchable: true, creatable: true, placeholder: 'Choose tags', noOptionsText: 'No tags' },
        },
        {
          name: 'country',
          type: 'combobox',
          comboboxConfig: { searchable: true, placeholder: 'Choose country', searchPlaceholder: 'Search countries', noOptionsText: 'No countries' },
        },
        {
          name: 'skills',
          type: 'multiCombobox',
          multiComboboxConfig: { maxSelections: 5, searchable: true, creatable: false, placeholder: 'Choose skills', searchPlaceholder: 'Search skills', noOptionsText: 'No skills' },
        },
        {
          name: 'phone',
          type: 'phone',
          phoneConfig: { defaultCountry: 'US', format: 'international', allowedCountries: ['US', 'CA'], placeholder: '+1 555 0100' },
        },
        {
          name: 'duration',
          type: 'duration',
          durationConfig: { format: 'hm', maxHours: 8, maxMinutes: 59, maxSeconds: 30, showLabels: true },
        },
        {
          name: 'office',
          type: 'location',
          locationConfig: {
            defaultLocation: { lat: 40.7128, lng: -74.006, address: 'New York, NY', city: 'New York', state: 'NY', country: 'US' },
            enableSearch: true,
            enableGeolocation: false,
            enableManualEntry: true,
            showMap: true,
            searchPlaceholder: 'Search address',
            searchOptions: { debounceMs: 300, minQueryLength: 3, maxResults: 6 },
            searchCallback: () => [],
            reverseGeocodeCallback: () => ({ lat: 40.7128, lng: -74.006 }),
          },
        },
        {
          name: 'attachments',
          type: 'file',
          fileConfig: {
            accept: '.pdf,.docx',
            multiple: true,
            maxSize: 10_000_000,
            maxFiles: 4,
            onFilesChange: () => undefined,
            onFileRemove: () => undefined,
          },
        },
      ],
      formOptions: { defaultValues: {} },
      autoSubmitOnChange: true,
      autoSubmitDebounceMs: 400,
      disabled: true,
      loading: false,
      showSubmitButton: false,
    });

    const exported = exportConversation(conversation);
    const formConfig = exported.conversation.messages[0]?.formConfig;

    assert.deepEqual(formConfig?.fields, [
      { name: 'appointmentDate', type: 'date', dateConfig: { minDate: minDate.toISOString(), maxDate: maxDate.toISOString(), format: 'yyyy-MM-dd' } },
      {
        name: 'budget',
        type: 'slider',
        sliderConfig: {
          min: 0,
          max: 100,
          step: 5,
          valueMapping: [{ sliderValue: 50, displayValue: '$50', label: 'Midpoint' }],
          valueLabelPrefix: '$',
          valueLabelSuffix: ' USD',
          valueDisplayPrecision: 0,
          showRawValue: false,
          showValue: true,
          marks: [{ value: 100, label: 'Max' }],
        },
      },
      { name: 'rating', type: 'rating', ratingConfig: { max: 10, allowHalf: true, icon: 'heart', size: 'lg', showValue: true } },
      { name: 'tags', type: 'multiSelect', multiSelectConfig: { maxSelections: 3, searchable: true, creatable: true, placeholder: 'Choose tags', noOptionsText: 'No tags' } },
      { name: 'country', type: 'combobox', comboboxConfig: { searchable: true, placeholder: 'Choose country', searchPlaceholder: 'Search countries', noOptionsText: 'No countries' } },
      { name: 'skills', type: 'multiCombobox', multiComboboxConfig: { maxSelections: 5, searchable: true, creatable: false, placeholder: 'Choose skills', searchPlaceholder: 'Search skills', noOptionsText: 'No skills' } },
      { name: 'phone', type: 'phone', phoneConfig: { defaultCountry: 'US', format: 'international', allowedCountries: ['US', 'CA'], placeholder: '+1 555 0100' } },
      { name: 'duration', type: 'duration', durationConfig: { format: 'hm', maxHours: 8, maxMinutes: 59, maxSeconds: 30, showLabels: true } },
      {
        name: 'office',
        type: 'location',
        locationConfig: {
          defaultLocation: { lat: 40.7128, lng: -74.006, address: 'New York, NY', city: 'New York', state: 'NY', country: 'US' },
          enableSearch: true,
          enableGeolocation: false,
          enableManualEntry: true,
          showMap: true,
          searchPlaceholder: 'Search address',
          searchOptions: { debounceMs: 300, minQueryLength: 3, maxResults: 6 },
        },
      },
      { name: 'attachments', type: 'file', fileConfig: { accept: '.pdf,.docx', multiple: true, maxSize: 10_000_000, maxFiles: 4 } },
    ]);
    assert.equal(formConfig?.autoSubmitOnChange, true);
    assert.equal(formConfig?.autoSubmitDebounceMs, 400);
    assert.equal(formConfig?.disabled, true);
    assert.equal(formConfig?.loading, false);
    assert.equal(formConfig?.showSubmitButton, false);
  });

  it('round-trips all supported serializable canonical field configs through persisted conversations', () => {
    const restoreWindow = installWindowStorage(new MemoryStorage());

    try {
      const minDate = new Date('2026-01-01T00:00:00.000Z');
      const maxDate = new Date('2026-12-31T23:59:59.000Z');
      const conversation = createConversation({
        fields: [
          { name: 'appointmentDate', type: 'date', dateConfig: { minDate, maxDate, format: 'yyyy-MM-dd', disableDate: () => false } },
          { name: 'budget', type: 'slider', sliderConfig: { min: 0, max: 100, step: 5, valueMapping: [{ sliderValue: 1, displayValue: 'One' }], marks: [{ value: 1, label: 'One' }], visualizationComponent: () => null } },
          { name: 'rating', type: 'rating', ratingConfig: { max: 5, allowHalf: false, icon: 'star', size: 'md', showValue: true } },
          { name: 'tags', type: 'multiSelect', multiSelectConfig: { maxSelections: 2, searchable: true, creatable: false, placeholder: 'Tags', noOptionsText: 'None' } },
          { name: 'country', type: 'combobox', comboboxConfig: { searchable: true, placeholder: 'Country', searchPlaceholder: 'Search', noOptionsText: 'None' } },
          { name: 'skills', type: 'multiCombobox', multiComboboxConfig: { maxSelections: 2, searchable: true, creatable: true, placeholder: 'Skills', searchPlaceholder: 'Search', noOptionsText: 'None' } },
          { name: 'phone', type: 'phone', phoneConfig: { defaultCountry: 'US', format: 'national', allowedCountries: ['US'], placeholder: '(555) 0100' } },
          { name: 'duration', type: 'duration', durationConfig: { format: 'ms', maxHours: 1, maxMinutes: 30, maxSeconds: 59, showLabels: false } },
          { name: 'office', type: 'location', locationConfig: { defaultLocation: { lat: 1, lng: 2, address: 'HQ' }, enableSearch: true, enableGeolocation: true, enableManualEntry: false, showMap: false, searchPlaceholder: 'Address', searchOptions: { debounceMs: 100, minQueryLength: 2, maxResults: 3 }, searchCallback: () => [], reverseGeocodeCallback: () => ({ lat: 1, lng: 2 }) } },
          { name: 'attachments', type: 'file', fileConfig: { accept: 'image/*', multiple: false, maxSize: 1_000, maxFiles: 1, onFilesChange: () => undefined, onFileRemove: () => undefined } },
        ],
        formOptions: { defaultValues: {} },
        autoSubmitOnChange: false,
        autoSubmitDebounceMs: 250,
        disabled: false,
        loading: true,
        showSubmitButton: true,
        onPageChange: () => undefined,
      });

      persistConversations([conversation]);

      const persisted = readPersistedAIBuilderState(fallbackProviderSettings);
      const formConfig = persisted.conversations[0]?.messages[0]?.formConfig;

      assert.deepEqual(formConfig?.fields, [
        { name: 'appointmentDate', type: 'date', dateConfig: { minDate: minDate.toISOString(), maxDate: maxDate.toISOString(), format: 'yyyy-MM-dd' } },
        { name: 'budget', type: 'slider', sliderConfig: { min: 0, max: 100, step: 5, valueMapping: [{ sliderValue: 1, displayValue: 'One' }], marks: [{ value: 1, label: 'One' }] } },
        { name: 'rating', type: 'rating', ratingConfig: { max: 5, allowHalf: false, icon: 'star', size: 'md', showValue: true } },
        { name: 'tags', type: 'multiSelect', multiSelectConfig: { maxSelections: 2, searchable: true, creatable: false, placeholder: 'Tags', noOptionsText: 'None' } },
        { name: 'country', type: 'combobox', comboboxConfig: { searchable: true, placeholder: 'Country', searchPlaceholder: 'Search', noOptionsText: 'None' } },
        { name: 'skills', type: 'multiCombobox', multiComboboxConfig: { maxSelections: 2, searchable: true, creatable: true, placeholder: 'Skills', searchPlaceholder: 'Search', noOptionsText: 'None' } },
        { name: 'phone', type: 'phone', phoneConfig: { defaultCountry: 'US', format: 'national', allowedCountries: ['US'], placeholder: '(555) 0100' } },
        { name: 'duration', type: 'duration', durationConfig: { format: 'ms', maxHours: 1, maxMinutes: 30, maxSeconds: 59, showLabels: false } },
        { name: 'office', type: 'location', locationConfig: { defaultLocation: { lat: 1, lng: 2, address: 'HQ' }, enableSearch: true, enableGeolocation: true, enableManualEntry: false, showMap: false, searchPlaceholder: 'Address', searchOptions: { debounceMs: 100, minQueryLength: 2, maxResults: 3 } } },
        { name: 'attachments', type: 'file', fileConfig: { accept: 'image/*', multiple: false, maxSize: 1_000, maxFiles: 1 } },
      ]);
      assert.equal(formConfig?.autoSubmitOnChange, false);
      assert.equal(formConfig?.autoSubmitDebounceMs, 250);
      assert.equal(formConfig?.disabled, false);
      assert.equal(formConfig?.loading, true);
      assert.equal(formConfig?.showSubmitButton, true);
      assert.equal(formConfig?.onPageChange, undefined);
    } finally {
      restoreWindow();
    }
  });

  it('round-trips serializable canonical field config objects through conversation export', () => {
    const conversation = createConversation({
      fields: [
        {
          name: 'bio',
          type: 'textarea',
          textareaConfig: {
            rows: 6,
            cols: 48,
            maxLength: 500,
            resize: 'vertical',
            showWordCount: true,
          },
          datalist: [
            'Product feedback',
            { value: 'support', label: 'Support', disabled: true, description: 'Customer support request' },
          ],
          help: {
            tooltip: 'Use plain language.',
            text: 'Tell us what happened.',
          },
        },
        {
          name: 'password',
          type: 'password',
          passwordConfig: {
            showToggle: true,
            strengthMeter: true,
            minStrength: 3,
          },
        },
        {
          name: 'quantity',
          type: 'number',
          numberConfig: {
            min: 1,
            max: 10,
            step: 0.5,
          },
        },
        {
          name: 'assignee',
          type: 'autocomplete',
          autocompleteConfig: {
            options: [{ value: 'ada', label: 'Ada Lovelace' }],
            debounceMs: 250,
            minChars: 2,
            maxResults: 5,
            allowCustom: true,
            placeholder: 'Search people',
            noOptionsText: 'No people found',
            loadingText: 'Searching people',
          },
        },
        {
          name: 'ssn',
          type: 'maskedInput',
          mask: '999-99-9999',
          maskedInputConfig: {
            mask: '999-99-9999',
            placeholder: '___-__-____',
            showMask: true,
            guide: false,
            keepCharPositions: true,
          },
        },
        {
          name: 'brandColor',
          type: 'colorPicker',
          colorConfig: {
            format: 'hex',
            showPreview: true,
            presetColors: ['#111111', '#ffffff'],
            allowCustom: false,
          },
        },
      ],
      formOptions: { defaultValues: {} },
    });

    const exported = exportConversation(conversation);
    const fields = exported.conversation.messages[0]?.formConfig?.fields;

    assert.deepEqual(fields, conversation.messages[0]?.formConfig?.fields);
  });

  it('preserves fully JSON-safe form schemas through conversation export and omits unsafe schemas', () => {
    const safeSchema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
      required: ['email'],
    } as const;
    const unsafeSchema = {
      type: 'object',
      properties: {
        email: { type: 'string' },
      },
      validate: (value: unknown) => value,
    } as const;

    const safeExport = exportConversation(createConversation({
      fields: [{ name: 'email', type: 'email' }],
      formOptions: { defaultValues: { email: '' } },
      schema: safeSchema,
    }));
    const unsafeExport = exportConversation(createConversation({
      fields: [{ name: 'email', type: 'email' }],
      formOptions: { defaultValues: { email: '' } },
      schema: unsafeSchema,
    }));

    assert.deepEqual(safeExport.conversation.messages[0]?.formConfig?.schema, safeSchema);
    assert.equal(unsafeExport.conversation.messages[0]?.formConfig?.schema, undefined);
  });

  it('preserves fully JSON-safe form schemas through persisted conversations and omits unsafe schemas', () => {
    const restoreWindow = installWindowStorage(new MemoryStorage());

    try {
      const safeSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      } as const;
      const unsafeSchema = {
        type: 'object',
        properties: {
          email: { type: 'string' },
        },
        transform: Symbol('schema-transform'),
      } as const;
      const safeConversation = createConversation({
        fields: [{ name: 'email', type: 'email' }],
        formOptions: { defaultValues: { email: '' } },
        schema: safeSchema,
      });
      const unsafeConversation: AiConversation = {
        ...createConversation({
          fields: [{ name: 'name', type: 'text' }],
          formOptions: { defaultValues: { name: '' } },
          schema: unsafeSchema,
        }),
        id: 'conversation_2',
      };

      persistConversations([safeConversation, unsafeConversation]);

      const persisted = readPersistedAIBuilderState(fallbackProviderSettings);
      assert.deepEqual(persisted.conversations[0]?.messages[0]?.formConfig?.schema, safeSchema);
      assert.equal(persisted.conversations[1]?.messages[0]?.formConfig?.schema, undefined);
    } finally {
      restoreWindow();
    }
  });

  it('round-trips preserved canonical configs through persisted conversations', () => {
    const restoreWindow = installWindowStorage(new MemoryStorage());

    try {
      const conversation = createConversation({
        fields: [
          {
            name: 'theme',
            type: 'color',
            section: { title: 'Branding', description: 'Choose brand colors' },
            colorConfig: { format: 'rgb', presetColors: ['#000000'], allowCustom: true },
          },
          {
            name: 'pin',
            type: 'masked',
            mask: '9999',
            maskedInputConfig: { mask: '9999', showMask: false },
          },
        ],
        formOptions: { defaultValues: { theme: '#000000', pin: '' } },
      });

      persistConversations([conversation]);

      const persisted = readPersistedAIBuilderState(fallbackProviderSettings);
      assert.deepEqual(persisted.conversations[0]?.messages[0]?.formConfig, conversation.messages[0]?.formConfig);
    } finally {
      restoreWindow();
    }
  });

  it('documents unsupported function-backed configs are intentionally omitted from storage parsing', () => {
    const validationSchema = {
      '~standard': {
        version: 1,
        validate: (value: unknown) => value,
      },
    } as const;
    const conversation = createConversation({
      fields: [
        {
          name: 'email',
          type: 'email',
          validation: validationSchema,
          component: () => null,
          autocompleteConfig: {
            asyncOptions: async () => [{ value: 'ada', label: 'Ada Lovelace' }],
            options: [{ value: 'grace', label: 'Grace Hopper' }],
          },
        },
        {
          name: 'masked',
          type: 'masked',
          maskedInputConfig: {
            mask: '999',
            pipe: (value: string) => value,
          },
        },
      ],
      formOptions: {
        defaultValues: {},
        onSubmit: () => undefined,
      },
      analytics: {
        onFormStart: () => undefined,
      },
    });

    const exported = exportConversation(conversation);
    const fields = exported.conversation.messages[0]?.formConfig?.fields;

    assert.deepEqual(fields?.[0], {
      name: 'email',
      type: 'email',
      autocompleteConfig: {
        options: [{ value: 'grace', label: 'Grace Hopper' }],
      },
    });
    assert.deepEqual(fields?.[1], {
      name: 'masked',
      type: 'masked',
      maskedInputConfig: { mask: '999' },
    });
    assert.deepEqual(exported.conversation.messages[0]?.formConfig?.formOptions, { defaultValues: {} });
    assert.equal(exported.conversation.messages[0]?.formConfig?.analytics, undefined);
  });

  it('omits unsupported component callback and schema boundaries through persisted conversations', () => {
    const restoreWindow = installWindowStorage(new MemoryStorage());

    try {
      const conversation = createConversation({
        fields: [
          {
            name: 'email',
            type: 'email',
            component: () => null,
            autocompleteConfig: {
              asyncOptions: async () => [{ value: 'ada', label: 'Ada Lovelace' }],
              options: [{ value: 'grace', label: 'Grace Hopper' }],
            },
          },
        ],
        formOptions: {
          defaultValues: {},
          onSubmit: () => undefined,
        },
        schema: {
          type: 'object',
          validate: (value: unknown) => value,
        },
        analytics: {
          onFieldFocus: () => undefined,
        },
      });

      persistConversations([conversation]);

      const persisted = readPersistedAIBuilderState(fallbackProviderSettings);
      const formConfig = persisted.conversations[0]?.messages[0]?.formConfig;

      assert.deepEqual(formConfig?.fields[0], {
        name: 'email',
        type: 'email',
        autocompleteConfig: {
          options: [{ value: 'grace', label: 'Grace Hopper' }],
        },
      });
      assert.deepEqual(formConfig?.formOptions, { defaultValues: {} });
      assert.equal(formConfig?.schema, undefined);
      assert.equal(formConfig?.analytics, undefined);
    } finally {
      restoreWindow();
    }
  });
});
