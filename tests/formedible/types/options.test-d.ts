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
    onFormStart: () => undefined,
    onFieldFocus: (fieldName) => fieldName.toUpperCase(),
    onFieldBlur: (fieldName) => fieldName.toUpperCase(),
    onPageChange: ({ fromPage, toPage, timeSpent }) => fromPage + toPage + timeSpent,
    onFormComplete: ({ formData, timeSpent }) => ({ formData, timeSpent }),
    onFormAbandon: ({ formData, timeSpent }) => ({ formData, timeSpent }),
  },
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
  },
} satisfies UseFormedibleOptions<CompatibilityOptionsValues>;

export { optionsWithCompatibilityExamplesShape };
