import type { FocusEvent, FormEvent, KeyboardEvent } from 'react';

import type { UseFormedibleOptions } from '../../../packages/formedible/src/lib/formedible/types';

interface CompatibilityOptionsValues extends Record<string, unknown> {
  firstName: string;
  email: string;
  needsPremium: boolean;
  interests: string[];
}

const optionsWithCompatibilityExamplesShape = {
  schema: { publicInputSurfaceOnly: true },
  fields: [
    { name: 'firstName', type: 'text', page: 1, tab: 'personal', section: 'Contact Information' },
    { name: 'email', type: 'email', page: 1, section: { title: 'Contact Details', description: 'How can we reach you?' } },
    { name: 'email', type: 'email', page: 2, conditional: 'firstName has a value' },
    { name: 'needsPremium', type: 'switch', page: 3 },
    { name: 'interests', type: 'multiSelect', options: ['web-dev', 'analytics'], maxSelections: 3 },
  ],
  pages: [
    { page: 1, title: 'Personal Information', description: 'Tell us about yourself' },
    { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}}?' },
    { page: 3, title: 'Premium Options', conditional: 'needsPremium is true' },
  ],
  tabs: ['personal', { id: 'settings', label: 'Settings' }],
  progress: { showSteps: true, showPercentage: true },
  persistence: {
    key: 'compatibility examples persistence',
    storage: 'localStorage',
    debounceMs: 1500,
    exclude: ['needsPremium'],
    restoreOnMount: true,
  },
  analytics: {
    onFormStart: (timestamp) => timestamp.toFixed(),
    onFieldFocus: (fieldName, timestamp) => `${fieldName.toUpperCase()}:${timestamp}`,
    onFieldBlur: (fieldName, timeSpent) => `${fieldName.toUpperCase()}:${timeSpent}`,
    onFieldChange: (fieldName, value, timestamp) => ({ fieldName, value, timestamp }),
    onFieldComplete: (fieldName, isValid, timeSpent) => ({ fieldName, isValid, timeSpent }),
    onFieldError: (fieldName, errors, timestamp) => ({ fieldName, errors, timestamp }),
    onPageChange: (fromPage, toPage, timeSpent, validationState) => fromPage + toPage + timeSpent + (validationState?.completionPercentage ?? 0),
    onFormComplete: (timeSpent, formData) => ({ formData, timeSpent }),
    onFormAbandon: (completionPercentage, context) => ({ completionPercentage, context }),
    onFormReset: (timestamp, reason) => ({ timestamp, reason }),
  },
  onPageChange: (page, direction) => `${direction}:${page}`,
  autoSubmitOnChange: true,
  autoSubmitDebounceMs: 25,
  disabled: false,
  loading: false,
  showSubmitButton: true,
  onFormReset: (event: FormEvent, formApi) => ({ event, values: formApi.state.values }),
  onFormInput: (event: FormEvent, formApi) => ({ event, values: formApi.state.values }),
  onFormInvalid: (event: FormEvent, formApi) => ({ event, values: formApi.state.values }),
  onFormKeyDown: (event: KeyboardEvent, formApi) => ({ key: event.key, values: formApi.state.values }),
  onFormKeyUp: (event: KeyboardEvent, formApi) => ({ key: event.key, values: formApi.state.values }),
  onFormFocus: (event: FocusEvent, formApi) => ({ event, values: formApi.state.values }),
  onFormBlur: (event: FocusEvent, formApi) => ({ event, values: formApi.state.values }),
  submitLabel: 'Send',
  nextLabel: 'Continue',
  previousLabel: 'Back',
  collapseLabel: 'Collapse',
  expandLabel: 'Expand',
  formClassName: 'space-y-4',
  formOptions: {
    defaultValues: {
      firstName: '',
      email: '',
      needsPremium: false,
      interests: [],
    },
    onSubmit: async ({ value }) => {
      value.email.toUpperCase();
    },
    onChange: ({ value, formApi }) => {
      value.firstName.toUpperCase();
      formApi?.state.values.email.toUpperCase();
    },
    onBlur: ({ value }) => {
      value.email.toUpperCase();
    },
    onFocus: ({ value }) => {
      value.interests.join(',');
    },
    onReset: ({ value }) => {
      value.needsPremium.valueOf();
    },
  },
} satisfies UseFormedibleOptions<CompatibilityOptionsValues>;

const supersededAnalyticsCallbacks = {
  fields: [],
  formOptions: {
    defaultValues: {
      firstName: '',
      email: '',
      needsPremium: false,
      interests: [],
    },
  },
  analytics: {
    // @ts-expect-error Superseded: no package runtime currently emits page completion analytics.
    onPageComplete: () => undefined,
    // @ts-expect-error Superseded: no package runtime currently emits page abandonment analytics.
    onPageAbandon: () => undefined,
    // @ts-expect-error Superseded: use rendered validation errors or TanStack Form state instead.
    onPageValidationError: () => undefined,
    // @ts-expect-error Superseded: tab-specific analytics are not wired to current tab runtime.
    onTabChange: () => undefined,
    // @ts-expect-error Superseded: tab-specific analytics are not wired to current tab runtime.
    onTabComplete: () => undefined,
    // @ts-expect-error Superseded: tab-specific analytics are not wired to current tab runtime.
    onTabAbandon: () => undefined,
    // @ts-expect-error Superseded: tab-specific analytics are not wired to current tab runtime.
    onTabValidationError: () => undefined,
    // @ts-expect-error Superseded: tab-specific analytics are not wired to current tab runtime.
    onTabFirstVisit: () => undefined,
    // @ts-expect-error Superseded: render performance is not measured by the package runtime.
    onRenderPerformance: () => undefined,
    // @ts-expect-error Superseded: validation performance is not measured by the package runtime.
    onValidationPerformance: () => undefined,
    // @ts-expect-error Superseded: submission performance is not measured by the package runtime.
    onSubmissionPerformance: () => undefined,
  },
} satisfies UseFormedibleOptions<CompatibilityOptionsValues>;

const intentionallyRemovedFormOptions = {
  fields: [],
  formOptions: {
    defaultValues: {
      firstName: '',
      email: '',
      needsPremium: false,
      interests: [],
    },
    // @ts-expect-error Removed debug/validation helper: invalid submission state is superseded by TanStack Form validation state and rendered errors.
    onSubmitInvalid: () => undefined,
  },
} satisfies UseFormedibleOptions<CompatibilityOptionsValues>;

export { intentionallyRemovedFormOptions, optionsWithCompatibilityExamplesShape, supersededAnalyticsCallbacks };
