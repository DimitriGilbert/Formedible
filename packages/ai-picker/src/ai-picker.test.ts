import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AiPicker, settingsToValues, valuesToSecrets, valuesToSettings } from '@/components/ai-picker/ai-picker';
import { AiPickerPanel } from '@/components/ai-picker/ai-picker-panel';
import { AiPickerPopover } from '@/components/ai-picker/ai-picker-popover';
import { evaluatePickerConditional, getValueAtPickerPath } from '@/lib/conditional-path';
import type { AiPickerValues, ProviderModelCatalog, ProviderSecretPersistencePreference, ProviderSecrets, ProviderSettings } from '@/lib/ai-picker-types';
import {
  applyProviderSwitch,
  createDefaultPickerValues,
  createDefaultProviderSecrets,
  createDefaultProviderSettings,
  createErrorCatalog,
  getFilteredModelOptions,
  mergePickerSchema,
  resolveEffectiveCatalog,
  splitPickerValues,
  validateProviderAccess,
} from '@/lib/ai-picker-utils';
import { defaultPickerSchema, defaultProviderConfigs } from '@/lib/default-picker-schema';

globalThis.React = React;

const noopOnChange = () => {};

test('default provider configs has exactly three entries for openai, anthropic, and openrouter', () => {
  assert.equal(defaultProviderConfigs.length, 3);
  assert.deepEqual(
    defaultProviderConfigs.map((c) => c.value),
    ['openai', 'anthropic', 'openrouter'],
  );
});

test('each default provider config has value, label, defaultModel, and requiresKey', () => {
  for (const config of defaultProviderConfigs) {
    assert.equal(typeof config.value, 'string');
    assert.equal(typeof config.label, 'string');
    assert.equal(typeof config.defaultModel, 'string');
    assert.equal(typeof config.requiresKey, 'boolean');
  }
});

test('default provider models match expected values', () => {
  assert.equal(defaultProviderConfigs[0]?.defaultModel, 'gpt-5.4-mini');
  assert.equal(defaultProviderConfigs[1]?.defaultModel, 'claude-sonnet-4-6');
  assert.equal(defaultProviderConfigs[2]?.defaultModel, 'minimax/minimax-2.7');
});

test('default picker schema has exactly eight fields', () => {
  assert.equal(defaultPickerSchema.length, 8);
});

test('default picker schema field names match expected order', () => {
  assert.deepEqual(
    defaultPickerSchema.map((f) => f.name),
    ['provider', 'apiKey', 'model', 'temperature', 'maxTokens', 'thinkingBudgetTokens', 'storageMode', 'rememberKey'],
  );
});

test('default picker schema field types are correct', () => {
  assert.equal(defaultPickerSchema[0]?.type, 'select');
  assert.equal(defaultPickerSchema[1]?.type, 'password');
  assert.equal(defaultPickerSchema[2]?.type, 'text');
  assert.equal(defaultPickerSchema[3]?.type, 'number');
  assert.equal(defaultPickerSchema[4]?.type, 'number');
  assert.equal(defaultPickerSchema[5]?.type, 'number');
  assert.equal(defaultPickerSchema[6]?.type, 'select');
  assert.equal(defaultPickerSchema[7]?.type, 'checkbox');
});

test('conditional schema fields carry function-valued conditionals', () => {
  const thinkingField = defaultPickerSchema.find((f) => f.name === 'thinkingBudgetTokens');
  const rememberField = defaultPickerSchema.find((f) => f.name === 'rememberKey');

  const thinkingConditional = thinkingField?.conditional;
  assert.ok(typeof thinkingConditional === 'function');
  assert.equal(thinkingConditional(createDefaultPickerValues('anthropic')), true);
  assert.equal(thinkingConditional(createDefaultPickerValues('openai')), false);

  const rememberConditional = rememberField?.conditional;
  assert.ok(typeof rememberConditional === 'function');
  assert.equal(rememberConditional({ ...createDefaultPickerValues('openai'), storageMode: 'local' }), true);
  assert.equal(rememberConditional(createDefaultPickerValues('openai')), false);
});

test('createDefaultPickerValues returns correct defaults for openai', () => {
  const values = createDefaultPickerValues('openai');

  assert.equal(values.provider, 'openai');
  assert.equal(values.apiKey, '');
  assert.equal(values.model, 'gpt-5.4-mini');
  assert.equal(values.temperature, 0.7);
  assert.equal(values.maxTokens, 16000);
  assert.equal(values.storageMode, 'memory');
  assert.equal(values.rememberKey, false);
});

test('createDefaultPickerValues returns correct defaults for anthropic', () => {
  const values = createDefaultPickerValues('anthropic');

  assert.equal(values.provider, 'anthropic');
  assert.equal(values.model, 'claude-sonnet-4-6');
  assert.equal(values.temperature, 0.7);
  assert.equal(values.maxTokens, 16000);
});

test('createDefaultPickerValues returns correct defaults for openrouter', () => {
  const values = createDefaultPickerValues('openrouter');

  assert.equal(values.provider, 'openrouter');
  assert.equal(values.model, 'minimax/minimax-2.7');
  assert.equal(values.temperature, 0.7);
  assert.equal(values.maxTokens, 16000);
});

test('createDefaultProviderSettings returns correct openai settings', () => {
  const settings = createDefaultProviderSettings('openai');

  assert.equal(settings.provider, 'openai');
  assert.equal(settings.model, 'gpt-5.4-mini');
  assert.equal(settings.temperature, 0.7);
  assert.equal(settings.maxTokens, 16000);
});

test('createDefaultProviderSettings returns anthropic settings supporting thinkingBudgetTokens', () => {
  const settings = createDefaultProviderSettings('anthropic');

  assert.equal(settings.provider, 'anthropic');
  assert.equal(settings.model, 'claude-sonnet-4-6');

  const withThinking: ProviderSettings = { ...settings, thinkingBudgetTokens: 512 };

  assert.equal(withThinking.provider, 'anthropic');

  if (withThinking.provider === 'anthropic') {
    assert.equal(withThinking.thinkingBudgetTokens, 512);
  }
});

test('createDefaultProviderSecrets returns secrets with empty apiKey', () => {
  const secrets = createDefaultProviderSecrets('openai');

  assert.equal(secrets.provider, 'openai');
  assert.equal(secrets.apiKey, '');
});

test('validateProviderAccess returns error for null settings', () => {
  assert.match(validateProviderAccess(null, null) ?? '', /required/i);
});

test('validateProviderAccess returns error for null secrets', () => {
  const settings = createDefaultProviderSettings('openai');

  assert.match(validateProviderAccess(settings, null) ?? '', /required/i);
});

test('validateProviderAccess returns undefined for valid settings and secrets', () => {
  const settings = createDefaultProviderSettings('openrouter');
  const secrets: ProviderSecrets = { provider: 'openrouter', apiKey: 'test-key' };

  assert.equal(validateProviderAccess(settings, secrets), undefined);
});

test('validateProviderAccess returns provider mismatch error', () => {
  const settings = createDefaultProviderSettings('openai');
  const secrets: ProviderSecrets = { provider: 'anthropic', apiKey: 'test-key' };

  assert.match(validateProviderAccess(settings, secrets) ?? '', /same provider/i);
});

test('validateProviderAccess returns endpoint error for settings with endpoint', () => {
  const settings = { ...createDefaultProviderSettings('openai'), endpoint: 'https://example.test/v1' } as unknown as ProviderSettings;
  const secrets: ProviderSecrets = { provider: 'openai', apiKey: 'test-key' };

  assert.match(validateProviderAccess(settings, secrets) ?? '', /endpoint/i);
});

test('validateProviderAccess returns thinking budget error for non-anthropic providers', () => {
  const settings = { ...createDefaultProviderSettings('openai'), thinkingBudgetTokens: 512 } as ProviderSettings;
  const secrets: ProviderSecrets = { provider: 'openai', apiKey: 'test-key' };

  assert.match(validateProviderAccess(settings, secrets) ?? '', /Thinking budget/i);
});

test('validateProviderAccess returns API key required error for empty secrets', () => {
  const settings = createDefaultProviderSettings('openai');
  const secrets: ProviderSecrets = { provider: 'openai', apiKey: '' };

  assert.match(validateProviderAccess(settings, secrets) ?? '', /API key/i);
});

test('getFilteredModelOptions filters models by query', () => {
  const models = [
    { id: 'openai/gpt-5.4-mini', label: 'GPT 5.4 mini' },
    { id: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  ];

  const result = getFilteredModelOptions(models, 'sonnet', 'custom/model');

  assert.equal(result.length, 2);
  assert.equal(result[0]?.id, 'custom/model');
  assert.equal(result[1]?.id, 'anthropic/claude-sonnet-4-6');
});

test('getFilteredModelOptions preserves custom model as first entry', () => {
  const models = [{ id: 'openai/gpt-5.4-mini', label: 'GPT 5.4 mini' }];

  const result = getFilteredModelOptions(models, '', 'custom-unique-model');

  assert.equal(result[0]?.id, 'custom-unique-model');
  assert.equal(result[0]?.label, 'Current custom model');
});

test('getFilteredModelOptions returns empty results for no match with empty selected model', () => {
  const models = [{ id: 'openai/gpt-5.4-mini', label: 'GPT 5.4 mini' }];

  const result = getFilteredModelOptions(models, 'nonexistent', '');

  assert.equal(result.length, 0);
});

test('getFilteredModelOptions slices results to twenty max', () => {
  const models = Array.from({ length: 25 }, (_, i) => ({ id: `model-${i}`, label: `Model ${i}` }));

  const result = getFilteredModelOptions(models, '', '');

  assert.equal(result.length, 20);
});

test('mergePickerSchema returns base when override is undefined', () => {
  const base = [{ name: 'provider', type: 'select', label: 'Provider' }];

  const result = mergePickerSchema(base, undefined);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.name, 'provider');
});

test('mergePickerSchema merges matching fields and appends new ones', () => {
  const base = [
    { name: 'provider', type: 'select', label: 'Provider' },
    { name: 'model', type: 'text', label: 'Model' },
  ];
  const override = [
    { name: 'model', label: 'Custom Model Label' },
    { name: 'customField', type: 'text', label: 'Custom' },
  ];

  const result = mergePickerSchema(base, override);

  assert.equal(result.length, 3);
  assert.equal(result[0]?.name, 'model');
  assert.equal(result[0]?.label, 'Custom Model Label');
  assert.equal(result[0]?.type, 'text');
  assert.equal(result[1]?.name, 'customField');
  assert.equal(result[2]?.name, 'provider');
});

test('mergePickerSchema allows override of field properties', () => {
  const base = [{ name: 'temperature', type: 'number', label: 'Temperature', min: 0, max: 2 }];
  const override = [{ name: 'temperature', max: 1, step: 0.05 }];

  const result = mergePickerSchema(base, override);

  assert.equal(result[0]?.name, 'temperature');
  assert.equal(result[0]?.type, 'number');
  assert.equal(result[0]?.min, 0);
  assert.equal(result[0]?.max, 1);
  assert.equal(result[0]?.step, 0.05);
});

test('valuesToSettings converts AiPickerValues to correct openai ProviderSettings', () => {
  const values: AiPickerValues = {
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-5.4-mini',
    temperature: 0.5,
    maxTokens: 1000,
    storageMode: 'memory',
    rememberKey: false,
  };

  const settings = valuesToSettings(values);

  assert.equal(settings.provider, 'openai');
  assert.equal(settings.model, 'gpt-5.4-mini');
  assert.equal(settings.temperature, 0.5);
  assert.equal(settings.maxTokens, 1000);
});

test('valuesToSettings with anthropic includes thinkingBudgetTokens', () => {
  const values: AiPickerValues = {
    provider: 'anthropic',
    apiKey: 'test-key',
    model: 'claude-sonnet-4-6',
    temperature: 0.7,
    maxTokens: 2000,
    thinkingBudgetTokens: 512,
    storageMode: 'memory',
    rememberKey: false,
  };

  const settings = valuesToSettings(values);

  assert.equal(settings.provider, 'anthropic');

  if (settings.provider === 'anthropic') {
    assert.equal(settings.thinkingBudgetTokens, 512);
  }
});

test('valuesToSettings with openrouter returns OpenRouterProviderSettings', () => {
  const values: AiPickerValues = {
    provider: 'openrouter',
    apiKey: 'test-key',
    model: 'minimax/minimax-2.7',
    temperature: 0.3,
    maxTokens: 8000,
    storageMode: 'local',
    rememberKey: true,
  };

  const settings = valuesToSettings(values);

  assert.equal(settings.provider, 'openrouter');
  assert.equal(settings.model, 'minimax/minimax-2.7');
  assert.equal(settings.temperature, 0.3);
  assert.equal(settings.maxTokens, 8000);
});

test('valuesToSecrets extracts provider and apiKey', () => {
  const values: AiPickerValues = {
    provider: 'openai',
    apiKey: 'sk-test-key',
    model: 'gpt-5.4-mini',
    temperature: 0.7,
    maxTokens: 16000,
    storageMode: 'memory',
    rememberKey: false,
  };

  const secrets = valuesToSecrets(values);

  assert.equal(secrets.provider, 'openai');
  assert.equal(secrets.apiKey, 'sk-test-key');
});

test('settingsToValues combines settings, secrets, and preference into AiPickerValues', () => {
  const settings: ProviderSettings = createDefaultProviderSettings('openai');
  const secrets: ProviderSecrets = { provider: 'openai', apiKey: 'sk-test' };
  const preference: ProviderSecretPersistencePreference = { mode: 'local', rememberKey: true };

  const values = settingsToValues(settings, secrets, preference);

  assert.equal(values.provider, 'openai');
  assert.equal(values.apiKey, 'sk-test');
  assert.equal(values.model, 'gpt-5.4-mini');
  assert.equal(values.storageMode, 'local');
  assert.equal(values.rememberKey, true);
});

test('settingsToValues with anthropic includes thinkingBudgetTokens', () => {
  const settings: ProviderSettings = { provider: 'anthropic', model: 'claude-sonnet-4-6', temperature: 0.7, maxTokens: 16000, thinkingBudgetTokens: 1024 };
  const secrets: ProviderSecrets = { provider: 'anthropic', apiKey: 'sk-ant-test' };
  const preference: ProviderSecretPersistencePreference = { mode: 'session', rememberKey: false };

  const values = settingsToValues(settings, secrets, preference);

  assert.equal(values.thinkingBudgetTokens, 1024);
});

test('round-trip settings to values to settings preserves key fields', () => {
  const originalSettings: ProviderSettings = { provider: 'openai', model: 'gpt-5.4-mini', temperature: 0.5, maxTokens: 1000 };
  const secrets: ProviderSecrets = { provider: 'openai', apiKey: 'test-key' };
  const preference: ProviderSecretPersistencePreference = { mode: 'memory', rememberKey: false };

  const values = settingsToValues(originalSettings, secrets, preference);
  const roundTripped = valuesToSettings(values);

  assert.equal(roundTripped.provider, originalSettings.provider);
  assert.equal(roundTripped.model, originalSettings.model);
  assert.equal(roundTripped.temperature, originalSettings.temperature);
  assert.equal(roundTripped.maxTokens, originalSettings.maxTokens);
});

test('AiPickerPanel renders with default schema and values', () => {
  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));

  assert.match(html, /AI Provider Settings/);
});

test('AiPickerPanel renders provider select, API key input, and model field', () => {
  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));

  assert.match(html, /Provider/);
  assert.match(html, /API key/);
  assert.match(html, /Model/);
});

test('AiPickerPanel renders local storage warning when storageMode is local', () => {
  const values: AiPickerValues = { ...createDefaultPickerValues('openai'), storageMode: 'local' };

  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values,
    onChange: noopOnChange,
  }));

  assert.match(html, /Local storage keeps the key/);
});

test('AiPickerPanel does not render local storage warning when storageMode is memory', () => {
  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));

  assert.doesNotMatch(html, /Local storage keeps the key/);
});

test('AiPickerPanel hides thinkingBudgetTokens when provider is not anthropic', () => {
  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));

  assert.doesNotMatch(html, /Thinking budget tokens/);
});

test('AiPickerPanel shows thinkingBudgetTokens when provider is anthropic', () => {
  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('anthropic'),
    onChange: noopOnChange,
  }));

  assert.match(html, /Thinking budget tokens/);
});

test('AiPickerPanel renders custom field description text', () => {
  const schema = [
    { name: 'customDesc', type: 'text' as const, label: 'Custom', description: 'Custom helper description text' },
  ];

  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));

  assert.match(html, /Custom helper description text/);
});

test('AiPickerPopover renders trigger with provider label and model name', () => {
  const html = renderToStaticMarkup(createElement(AiPickerPopover, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));

  assert.match(html, /OpenAI/);
  assert.match(html, /gpt-5.4-mini/);
});

test('AiPicker with variant panel renders AiPickerPanel', () => {
  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: createDefaultProviderSettings('openai'),
    secrets: createDefaultProviderSecrets('openai'),
  }));

  assert.match(html, /AI Provider Settings/);
});

test('AiPicker with variant popover renders AiPickerPopover', () => {
  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'popover',
    settings: createDefaultProviderSettings('openai'),
    secrets: createDefaultProviderSecrets('openai'),
  }));

  assert.match(html, /OpenAI/);
  assert.match(html, /gpt-5.4-mini/);
});

test('AiPicker with custom schema override merges with default', () => {
  const customSchema = [{ name: 'temperature', label: 'Custom Temperature Label' }];

  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: createDefaultProviderSettings('openai'),
    secrets: createDefaultProviderSecrets('openai'),
    schema: customSchema,
  }));

  assert.match(html, /Custom Temperature Label/);
  assert.match(html, /Provider/);
});

test('AiPicker with completely custom schema works', () => {
  const customSchema = [{ name: 'customField', type: 'text', label: 'Custom Field Only' }];

  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: createDefaultProviderSettings('openai'),
    secrets: createDefaultProviderSecrets('openai'),
    schema: customSchema,
  }));

  assert.match(html, /Custom Field Only/);
});

test('public API exports all expected functions and components', () => {
  assert.equal(typeof AiPicker, 'function');
  assert.equal(typeof AiPickerPanel, 'function');
  assert.equal(typeof AiPickerPopover, 'function');
  assert.equal(typeof valuesToSettings, 'function');
  assert.equal(typeof valuesToSecrets, 'function');
  assert.equal(typeof settingsToValues, 'function');
  assert.equal(typeof createDefaultPickerValues, 'function');
  assert.equal(typeof createDefaultProviderSettings, 'function');
  assert.equal(typeof createDefaultProviderSecrets, 'function');
  assert.equal(typeof validateProviderAccess, 'function');
  assert.equal(typeof getFilteredModelOptions, 'function');
  assert.equal(typeof mergePickerSchema, 'function');
  assert.ok(Array.isArray(defaultPickerSchema));
  assert.ok(Array.isArray(defaultProviderConfigs));
});

test('public API exports types as type-only exports', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/index.ts'), 'utf8');

  const typeNames = [
    'AiPickerProps',
    'AiPickerProviderConfig',
    'AiPickerSchema',
    'AiPickerSchemaField',
    'AiPickerValues',
    'AiPickerVariant',
    'ProviderSecretPersistencePreference',
    'ProviderSecretStorageMode',
    'AIProvider',
    'ProviderModelCatalog',
    'ProviderModelCatalogEntry',
    'ProviderModelCatalogs',
    'ProviderSecrets',
    'ProviderSettings',
  ];

  assert.match(source, /export type \{/);

  for (const typeName of typeNames) {
    assert.match(source, new RegExp(typeName));
  }
});

test('resolveEffectiveCatalog ignores catalogs whose provider does not match the active provider', () => {
  const openaiCatalog: ProviderModelCatalog = { provider: 'openai', models: [{ id: 'gpt-5.4-mini' }], fetchedAt: 1 };
  const anthropicCatalog: ProviderModelCatalog = { provider: 'anthropic', models: [{ id: 'claude-sonnet-4-6' }], fetchedAt: 2 };

  assert.equal(resolveEffectiveCatalog('anthropic', openaiCatalog, { openai: openaiCatalog }, { openai: openaiCatalog }), undefined);
  assert.equal(resolveEffectiveCatalog('openai', undefined, { openai: anthropicCatalog }, { openai: anthropicCatalog }), undefined);
  assert.equal(resolveEffectiveCatalog('openai', openaiCatalog, { openai: anthropicCatalog }, { openai: anthropicCatalog }), openaiCatalog);
});

test('resolveEffectiveCatalog falls back to fetched catalogs keyed by provider', () => {
  const openaiCatalog: ProviderModelCatalog = { provider: 'openai', models: [], fetchedAt: 1 };
  const anthropicCatalog: ProviderModelCatalog = { provider: 'anthropic', models: [], fetchedAt: 2 };

  const catalog = resolveEffectiveCatalog('anthropic', undefined, undefined, { openai: openaiCatalog, anthropic: anthropicCatalog });

  assert.equal(catalog, anthropicCatalog);
});

test('AiPicker renders catalog metadata only when the catalog provider matches', () => {
  const anthropicSettings = createDefaultProviderSettings('anthropic');
  const anthropicSecrets = createDefaultProviderSecrets('anthropic');
  const openaiCatalog: ProviderModelCatalog = { provider: 'openai', models: [], fetchedAt: Date.now() };

  const staleHtml = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: anthropicSettings,
    secrets: anthropicSecrets,
    modelCatalog: openaiCatalog,
  }));
  assert.doesNotMatch(staleHtml, /Last refreshed/);
  assert.doesNotMatch(staleHtml, /Failed to refresh/);

  const freshHtml = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: anthropicSettings,
    secrets: anthropicSecrets,
    modelCatalog: { ...openaiCatalog, provider: 'anthropic' },
  }));
  assert.match(freshHtml, /Last refreshed/);
});

test('applyProviderSwitch clears the previous provider API key and resets the model', () => {
  const switched = applyProviderSwitch(
    { ...createDefaultPickerValues('openai'), apiKey: 'sk-openai-previous' },
    'anthropic',
    defaultProviderConfigs,
  );

  assert.equal(switched.provider, 'anthropic');
  assert.equal(switched.apiKey, '');
  assert.equal(switched.model, 'claude-sonnet-4-6');
});

test('applyProviderSwitch drops thinking budget tokens when leaving anthropic', () => {
  const switched = applyProviderSwitch(
    { ...createDefaultPickerValues('anthropic'), thinkingBudgetTokens: 512, apiKey: 'sk-ant-previous' },
    'openrouter',
    defaultProviderConfigs,
  );

  assert.equal(switched.provider, 'openrouter');
  assert.equal(switched.apiKey, '');
  assert.equal(switched.model, 'minimax/minimax-2.7');
  assert.equal(switched.thinkingBudgetTokens, undefined);
});

test('createErrorCatalog preserves previous models and fetchedAt while surfacing the error', () => {
  const previous: ProviderModelCatalog = { provider: 'openai', models: [{ id: 'gpt-5.4-mini' }], fetchedAt: 1234 };

  const catalog = createErrorCatalog('openai', previous, new Error('rate limited'));

  assert.equal(catalog.provider, 'openai');
  assert.equal(catalog.models.length, 1);
  assert.equal(catalog.models[0]?.id, 'gpt-5.4-mini');
  assert.equal(catalog.fetchedAt, 1234);
  assert.match(catalog.error ?? '', /rate limited/);
});

test('createErrorCatalog without a previous catalog yields empty models and a fresh timestamp', () => {
  const catalog = createErrorCatalog('anthropic', undefined, 'unauthorized');

  assert.equal(catalog.provider, 'anthropic');
  assert.deepEqual(catalog.models, []);
  assert.ok(catalog.fetchedAt > 0);
  assert.match(catalog.error ?? '', /unauthorized/);
});

test('splitPickerValues separates typed picker keys from custom schema keys', () => {
  const values: AiPickerValues = {
    ...createDefaultPickerValues('openai'),
    apiKey: 'sk-test',
    workspace: 'acme',
    tags: ['alpha'],
  };

  const { typed, customValues } = splitPickerValues(values);

  assert.equal(typed.provider, 'openai');
  assert.equal(typed.apiKey, 'sk-test');
  assert.equal('workspace' in typed, false);
  assert.deepEqual(customValues, { workspace: 'acme', tags: ['alpha'] });
});

test('custom schema keys survive the values round-trip alongside typed settings', () => {
  const original: AiPickerValues = { ...createDefaultPickerValues('openai'), apiKey: 'sk-keep', workspace: 'acme' };

  const { typed, customValues } = splitPickerValues(original);
  const merged: AiPickerValues = { ...typed, ...customValues };

  assert.equal(merged.workspace, 'acme');
  assert.equal(valuesToSettings(typed).model, original.model);
  assert.equal(valuesToSecrets(typed).apiKey, 'sk-keep');
  assert.equal(valuesToSecrets(typed).provider, 'openai');
});

test('AiPickerPanel binds custom text fields to their current values', () => {
  const schema = [{ name: 'workspace', type: 'text' as const, label: 'Workspace' }];

  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema,
    values: { ...createDefaultPickerValues('openai'), workspace: 'acme' },
    onChange: noopOnChange,
  }));

  assert.match(html, /value="acme"/);
});

test('AiPickerPanel binds custom checkbox fields to their current values', () => {
  const schema = [{ name: 'verbose', type: 'checkbox' as const, label: 'Verbose logging' }];

  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema,
    values: { ...createDefaultPickerValues('openai'), verbose: true },
    onChange: noopOnChange,
  }));

  assert.match(html, /checked/);
  assert.match(html, /Verbose logging/);
});

test('AiPickerPanel binds custom number fields to their current values', () => {
  const schema = [{ name: 'retries', type: 'number' as const, label: 'Retries' }];

  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema,
    values: { ...createDefaultPickerValues('openai'), retries: 3 },
    onChange: noopOnChange,
  }));

  assert.match(html, /value="3"/);
});

test('AiPicker with only settings controlled renders the provided settings', () => {
  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: { provider: 'anthropic', model: 'claude-custom-model', temperature: 0.5, maxTokens: 2000 },
  }));

  assert.match(html, /value="claude-custom-model"/);
  assert.match(html, /Thinking budget tokens/);
});

test('AiPicker with only secrets controlled renders the provided API key with new-password autocomplete', () => {
  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    secrets: { provider: 'openai', apiKey: 'sk-partial-control' },
  }));

  assert.match(html, /value="sk-partial-control"/);
  assert.match(html, /type="password"[^>]*autoComplete="new-password"/);
});

test('evaluatePickerConditional treats string conditionals as truthy field paths', () => {
  const values: AiPickerValues = { ...createDefaultPickerValues('openai'), rememberKey: true };

  assert.equal(evaluatePickerConditional(undefined, values), true);
  assert.equal(evaluatePickerConditional('rememberKey', values), true);
  assert.equal(evaluatePickerConditional('rememberKey', { ...values, rememberKey: false }), false);
  assert.equal(evaluatePickerConditional('missing.path', values), false);
});

test('evaluatePickerConditional resolves nested and array-indexed paths', () => {
  const values: AiPickerValues = {
    ...createDefaultPickerValues('openai'),
    nested: { enable: true },
    tags: ['alpha', ''],
  };

  assert.equal(getValueAtPickerPath(values, 'tags[0]'), 'alpha');
  assert.equal(evaluatePickerConditional('nested.enable', values), true);
  assert.equal(evaluatePickerConditional('nested.missing', values), false);
  assert.equal(evaluatePickerConditional('tags[0]', values), true);
  assert.equal(evaluatePickerConditional('tags[1]', values), false);
  assert.equal(evaluatePickerConditional('nested', values), true);
});

test('evaluatePickerConditional logs a descriptive error for malformed conditionals', () => {
  const originalError = console.error;
  const messages: string[] = [];
  console.error = (message: unknown) => {
    messages.push(String(message));
  };

  try {
    assert.equal(evaluatePickerConditional('(values) => values.provider === "anthropic"', createDefaultPickerValues('openai')), false);
    assert.equal(evaluatePickerConditional('storage mode', createDefaultPickerValues('openai')), false);
  } finally {
    console.error = originalError;
  }

  assert.equal(messages.length, 2);
  assert.match(messages[0] ?? '', /Invalid ai-picker conditional/);
  assert.match(messages[1] ?? '', /storage mode/);
});

test('evaluatePickerConditional calls function conditionals directly with the values', () => {
  const values = createDefaultPickerValues('openai');

  assert.equal(evaluatePickerConditional((candidate) => candidate.provider === 'openai', values), true);
  assert.equal(evaluatePickerConditional((candidate) => candidate.provider === 'anthropic', values), false);
});

test('AiPickerPanel evaluates string conditionals as field paths', () => {
  const schema = [
    { name: 'visibleNote', type: 'text' as const, label: 'Visible Note', conditional: 'rememberKey' },
    { name: 'hiddenNote', type: 'text' as const, label: 'Hidden Note', conditional: 'nested.enable' },
  ];

  const html = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema,
    values: { ...createDefaultPickerValues('openai'), rememberKey: true, nested: { enable: false } },
    onChange: noopOnChange,
  }));

  assert.match(html, /Visible Note/);
  assert.doesNotMatch(html, /Hidden Note/);
});

test('AiPickerPanel renders the clear stored keys affordance only when the handler is provided', () => {
  const withClear = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
    onClearStoredSecrets: () => undefined,
  }));
  assert.match(withClear, /Clear stored keys/);

  const withoutClear = renderToStaticMarkup(createElement(AiPickerPanel, {
    schema: defaultPickerSchema,
    values: createDefaultPickerValues('openai'),
    onChange: noopOnChange,
  }));
  assert.doesNotMatch(withoutClear, /Clear stored keys/);
});

test('AiPicker forwards onClearStoredSecrets to the rendered panel', () => {
  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'panel',
    settings: createDefaultProviderSettings('openai'),
    secrets: createDefaultProviderSecrets('openai'),
    onClearStoredSecrets: () => undefined,
  }));

  assert.match(html, /Clear stored keys/);
});

test('AiPicker honors custom providerConfigs for the popover trigger label', () => {
  const html = renderToStaticMarkup(createElement(AiPicker, {
    variant: 'popover',
    providerConfigs: [{ value: 'openai', label: 'Custom OpenAI Label', defaultModel: 'custom-default-model', requiresKey: true }],
  }));

  assert.match(html, /Custom OpenAI Label/);
});
