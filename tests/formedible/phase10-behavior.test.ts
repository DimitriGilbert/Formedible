import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

import { getFieldBlurTime } from '../../packages/formedible/src/hooks/use-form-analytics';
import { getVisiblePageNumbers } from '../../packages/formedible/src/hooks/use-multi-page';
import { normalizeTabs } from '../../packages/formedible/src/hooks/use-form-tabs';
import {
  clearPersistedFormPayload,
  createPersistedFormPayload,
  getConfiguredStorage,
  loadPersistedFormPayload,
  parsePersistedFormPayload,
  savePersistedFormPayload,
  withoutPersistedFields,
} from '../../packages/formedible/src/hooks/use-form-persistence';
import { resolveDynamicText } from '../../packages/formedible/src/lib/formedible/dynamic-text';
import type { FormedibleAnalyticsConfig, FormedibleFormValues, FormediblePageConfig, NormalizedFieldConfig } from '../../packages/formedible/src/lib/formedible/types';
import {
  analyticsTrackingCompatibilityExample,
  conditionalPagesCompatibilityExample,
  persistenceCompatibilityExample,
  rentalCarFlowCompatibilityExample,
  tabbedCompatibilityExample,
} from '../compatibility-examples/behavior-examples';
import { keptUseFormedibleReturnFields, removedUseFormedibleReturnFields } from '../compatibility-examples/use-formedible-return-contract';

function field(name: string, page: number, conditional?: (values: FormedibleFormValues) => boolean): NormalizedFieldConfig<FormedibleFormValues> {
  return { name, page, conditional, type: 'text', disabled: false, required: false };
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys()).at(index) ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

test('conditional pages example keeps individual, business, premium, and contact navigation paths', () => {
  const fields = [
    field('applicationType', 1),
    field('firstName', 2, (values) => values.applicationType === 'individual'),
    field('companyName', 3, (values) => values.applicationType === 'business'),
    field('needsPremium', 4),
    field('premiumFeatures', 5, (values) => values.needsPremium === true),
    field('email', 6),
  ];
  const pages = conditionalPagesCompatibilityExample.pages.map((pageConfig) => ({
    page: pageConfig.page,
    title: pageConfig.title,
    conditional:
      pageConfig.page === 2
        ? (values: FormedibleFormValues) => values.applicationType === 'individual'
        : pageConfig.page === 3
          ? (values: FormedibleFormValues) => values.applicationType === 'business'
          : pageConfig.page === 5
            ? (values: FormedibleFormValues) => values.needsPremium === true
            : undefined,
  })) satisfies FormediblePageConfig<FormedibleFormValues>[];

  assert.deepEqual(getVisiblePageNumbers(fields, pages, { applicationType: 'individual', needsPremium: false }), [1, 2, 4, 6]);
  assert.deepEqual(getVisiblePageNumbers(fields, pages, { applicationType: 'business', needsPremium: false }), [1, 3, 4, 6]);
  assert.deepEqual(getVisiblePageNumbers(fields, pages, { applicationType: 'business', needsPremium: true }), [1, 3, 4, 5, 6]);
});

test('persistence example excludes agreeToTerms from saved payloads', () => {
  const persisted = withoutPersistedFields(
    { name: 'Ada', email: 'ada@example.com', agreeToTerms: true },
    persistenceCompatibilityExample.assertionsRequired.includes('agreeToTerms is excluded from persisted payloads') ? ['agreeToTerms'] : [],
  );

  assert.deepEqual(persisted, { name: 'Ada', email: 'ada@example.com' });
});

test('persistence payload saves values, timestamp, and current page while respecting excluded fields', () => {
  const originalNow = Date.now;

  Date.now = () => 1234;
  try {
    assert.deepEqual(createPersistedFormPayload({ name: 'Ada', email: 'ada@example.com', agreeToTerms: true }, 3, ['agreeToTerms']), {
      values: { name: 'Ada', email: 'ada@example.com' },
      timestamp: 1234,
      currentPage: 3,
    });
  } finally {
    Date.now = originalNow;
  }
});

test('persistence helpers save, load, clear, reject malformed payloads, and restore currentPage metadata', () => {
  const storage = createMemoryStorage();
  const payload = { values: { name: 'Ada' }, timestamp: 2222, currentPage: 2 };

  savePersistedFormPayload(storage, 'formedible:test', payload);
  assert.deepEqual(loadPersistedFormPayload(storage, 'formedible:test'), payload);

  storage.setItem('formedible:bad-json', '{');
  storage.setItem('formedible:bad-shape', JSON.stringify({ name: 'Ada' }));
  assert.equal(parsePersistedFormPayload('{'), undefined);
  assert.equal(loadPersistedFormPayload(storage, 'formedible:bad-json'), undefined);
  assert.equal(loadPersistedFormPayload(storage, 'formedible:bad-shape'), undefined);

  clearPersistedFormPayload(storage, 'formedible:test');
  assert.equal(loadPersistedFormPayload(storage, 'formedible:test'), undefined);
});

test('persistence storage selection is SSR-safe and defaults to sessionStorage', () => {
  const originalWindow = globalThis.window;
  const localStorage = createMemoryStorage();
  const sessionStorage = createMemoryStorage();

  Reflect.deleteProperty(globalThis, 'window');
  assert.equal(getConfiguredStorage({ key: 'formedible:ssr' }), undefined);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage, sessionStorage },
  });

  try {
    assert.equal(getConfiguredStorage({ key: 'formedible:default' }), sessionStorage);
    assert.equal(getConfiguredStorage({ key: 'formedible:local', storage: 'localStorage' }), localStorage);
    assert.equal(getConfiguredStorage({ key: 'formedible:session', storage: 'sessionStorage' }), sessionStorage);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  }
});

test('tabbed example groups fields by configured tab ids', () => {
  const fields = tabbedCompatibilityExample.fields.map((descriptor) => ({
    name: descriptor.name,
    tab: descriptor.tab,
    type: 'text',
    disabled: false,
    required: false,
  })) satisfies NormalizedFieldConfig<FormedibleFormValues>[];

  assert.deepEqual(
    normalizeTabs(tabbedCompatibilityExample.tabs, fields).map((tab) => tab.id),
    ['personal', 'preferences', 'settings'],
  );
  assert.deepEqual(fields.filter((item) => item.tab === 'personal').map((item) => item.name), ['firstName', 'lastName', 'email', 'phone']);
});

test('rental car flow dynamic text and conditional navigation match compatibility evidence', () => {
  const fields = rentalCarFlowCompatibilityExample.fields.map((descriptor) =>
    field(
      descriptor.name,
      descriptor.page ?? 1,
      descriptor.name === 'specialRequirements'
        ? (values) => values.hasSpecialNeeds === true
        : descriptor.name === 'insuranceType'
          ? (values) => values.needsInsurance === true
          : descriptor.name === 'childSeatCount'
            ? (values) => values.wantsChildSeat === true
            : undefined,
    ),
  );

  assert.equal(resolveDynamicText('Hello {{firstName}}, enjoy {{destination}}!', { firstName: 'Mina', destination: 'Lisbon' }), 'Hello Mina, enjoy Lisbon!');
  assert.equal(rentalCarFlowCompatibilityExample.publicBehavior.some((behavior) => behavior.includes('nineteen-page')), true);
  assert.equal(getVisiblePageNumbers(fields, undefined, { hasSpecialNeeds: false, needsInsurance: false, wantsChildSeat: false }).includes(11), false);
  assert.equal(getVisiblePageNumbers(fields, undefined, { hasSpecialNeeds: true, needsInsurance: true, wantsChildSeat: true }).includes(17), true);
});

test('analytics tracking example keeps the six approved callbacks and return contract removes validation debug helpers', () => {
  assert.deepEqual(analyticsTrackingCompatibilityExample.optionsUsed, [
    'analytics.onFormStart',
    'analytics.onFieldFocus',
    'analytics.onFieldBlur',
    'analytics.onPageChange',
    'analytics.onFormComplete',
    'analytics.onFormAbandon',
  ]);

  assert.deepEqual(keptUseFormedibleReturnFields, [
    'form',
    'Form',
    'currentPage',
    'totalPages',
    'visiblePages',
    'goToNextPage',
    'goToPreviousPage',
    'setCurrentPage',
    'isFirstPage',
    'isLastPage',
    'progressValue',
    'saveToStorage',
    'loadFromStorage',
    'clearStorage',
  ]);
  assert.deepEqual(removedUseFormedibleReturnFields, ['crossFieldErrors', 'asyncValidationStates', 'validateCrossFields', 'validateFieldAsync']);
});

test('analytics callbacks accept original positional arguments and field blur time is focus-derived', () => {
  const calls: string[] = [];
  const analytics = {
    onFormStart: (timestamp) => calls.push(`start:${timestamp}`),
    onFieldFocus: (fieldName, timestamp) => calls.push(`focus:${fieldName}:${timestamp}`),
    onFieldBlur: (fieldName, timeSpent) => calls.push(`blur:${fieldName}:${timeSpent}`),
    onPageChange: (fromPage, toPage, timeSpent, pageValidationState) =>
      calls.push(`page:${fromPage}:${toPage}:${timeSpent}:${pageValidationState?.hasErrors}:${pageValidationState?.completionPercentage}`),
    onFormComplete: (timeSpent, formData) => calls.push(`complete:${timeSpent}:${formData.email}`),
    onFormAbandon: (completionPercentage, context) => calls.push(`abandon:${completionPercentage}:${context?.currentPage}:${context?.lastActiveField}`),
  } satisfies FormedibleAnalyticsConfig<{ email: string }>;

  analytics.onFormStart?.(1000);
  analytics.onFieldFocus?.('email', 1100);
  analytics.onFieldBlur?.('email', getFieldBlurTime(1100, 1500));
  analytics.onPageChange?.(1, 2, 700, { hasErrors: false, completionPercentage: 50 });
  analytics.onFormComplete?.(900, { email: 'ada@example.com' });
  analytics.onFormAbandon?.(50, { currentPage: 2, lastActiveField: 'email' });

  assert.deepEqual(calls, [
    'start:1000',
    'focus:email:1100',
    'blur:email:400',
    'page:1:2:700:false:50',
    'complete:900:ada@example.com',
    'abandon:50:2:email',
  ]);
  assert.equal(getFieldBlurTime(undefined, 1500), 0);
});

test('authored install-surface imports use consumer-safe aliases and no extension suffixes', () => {
  const sourceRoot = join(process.cwd(), 'packages/formedible/src');
  const authoredFiles = [
    'hooks/use-formedible.tsx',
    'hooks/use-multi-page.ts',
    'hooks/use-form-tabs.ts',
    'hooks/use-form-persistence.ts',
    'hooks/use-form-analytics.ts',
    'components/formedible/layout/form-layout.tsx',
    'components/formedible/layout/form-navigation.tsx',
    'components/formedible/layout/form-progress.tsx',
    'components/formedible/layout/form-tabs.tsx',
    'lib/formedible/dynamic-text.ts',
  ];

  for (const fileName of authoredFiles) {
    const source = readFileSync(join(sourceRoot, fileName), 'utf8');

    assert.doesNotMatch(source, /from ['"]\.\.?\//);
    assert.doesNotMatch(source, /from ['"][^'"]+\.(?:js|mjs)['"]/);
  }
});
