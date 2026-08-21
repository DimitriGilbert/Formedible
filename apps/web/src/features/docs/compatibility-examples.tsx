import { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';
import type { FormedibleSubmitContext, UseFormedibleOptions } from '@formedible/ui/components/formedible/lib/types';

type DocsFormValues = Record<string, unknown>;

type DocsInteractionRecord = {
  readonly event: string;
  readonly details: DocsFormValues;
};

let latestDocsInteraction: DocsInteractionRecord | null = null;

function rememberDocsInteraction(record: DocsInteractionRecord) {
  latestDocsInteraction = record;

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem('formedible-docs-last-interaction', JSON.stringify(record));
    } catch {
      latestDocsInteraction = record;
    }
  }
}

export interface DocsCompatibilityExample {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly options: UseFormedibleOptions<DocsFormValues>;
}

function isTruthyValue(values: DocsFormValues, fieldName: string): boolean {
  return Boolean(values[fieldName]);
}

function matchesValue(values: DocsFormValues, fieldName: string, expectedValue: unknown): boolean {
  return values[fieldName] === expectedValue;
}

function hasValue(values: DocsFormValues, fieldName: string): boolean {
  const value = values[fieldName];

  return value !== undefined && value !== null && value !== '';
}

function handleExampleSubmit(context: FormedibleSubmitContext<DocsFormValues>) {
  rememberDocsInteraction({ event: 'example-submit', details: context.value });
}

function handleAnalyticsEvent(event: string, details: DocsFormValues) {
  rememberDocsInteraction({ event, details: { ...details, previousEvent: latestDocsInteraction?.event ?? 'none' } });
}

export function DocsExampleForm({ example }: { readonly example: DocsCompatibilityExample }) {
  const { Form } = useFormedible(example.options);

  return <Form aria-label={`${example.title} example`} />;
}

export const docsCompatibilityExamples = [
  {
    id: 'contact-form',
    title: 'Contact Form',
    summary: 'Single-page contact form with searchable subject, creatable categories, and urgent flag.',
    options: {
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
        {
          name: 'subject',
          type: 'combobox',
          label: 'Subject',
          options: [
            { value: 'general', label: 'General Inquiry' },
            { value: 'support', label: 'Technical Support' },
            { value: 'sales', label: 'Sales Question' },
            { value: 'billing', label: 'Billing Question' },
            { value: 'feature', label: 'Feature Request' },
          ],
          comboboxConfig: { searchable: true, searchPlaceholder: 'Search subjects...', noOptionsText: 'No subject found' },
        },
        { name: 'message', type: 'textarea', label: 'Message', rows: 5, required: true },
        {
          name: 'categories',
          type: 'multiCombobox',
          label: 'Categories',
          options: ['bug', 'feature', 'documentation', 'performance', 'security'],
          multiComboboxConfig: { searchable: true, creatable: true, maxSelections: 3 },
        },
        { name: 'urgent', type: 'checkbox', label: 'Mark as urgent' },
      ],
      formOptions: {
        defaultValues: { name: '', email: '', subject: 'general', message: '', categories: [], urgent: false },
        onSubmit: handleExampleSubmit,
      },
      submitLabel: 'Send message',
    },
  },
  {
    id: 'registration-form',
    title: 'Registration Form',
    summary: 'Three-page registration flow with dynamic page copy and progress indicators.',
    options: {
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', page: 1, required: true },
        { name: 'lastName', type: 'text', label: 'Last name', page: 1, required: true },
        { name: 'birthDate', type: 'date', label: 'Birth date', page: 1, required: true },
        { name: 'email', type: 'email', label: 'Email', page: 2, required: true },
        { name: 'phone', type: 'phone', label: 'Phone', page: 2, required: true },
        { name: 'address', type: 'textarea', label: 'Address', page: 2, required: true },
        { name: 'newsletter', type: 'switch', label: 'Newsletter', page: 3 },
        { name: 'notifications', type: 'switch', label: 'Product notifications', page: 3 },
        { name: 'plan', type: 'radio', label: 'Plan', page: 3, options: ['basic', 'pro', 'enterprise'], required: true },
      ],
      pages: [
        { page: 1, title: 'Personal Information', description: 'Tell us about yourself' },
        { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}}?' },
        { page: 3, title: 'Preferences', description: 'Customize your experience' },
      ],
      progress: { showSteps: true, showPercentage: true },
      formOptions: {
        defaultValues: { firstName: '', lastName: '', birthDate: '', email: '', phone: '', address: '', newsletter: false, notifications: true, plan: 'basic' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'checkout-form',
    title: 'Checkout Form',
    summary: 'Checkout flow with conditional card details and shipping choices.',
    options: {
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', page: 1, required: true },
        { name: 'lastName', type: 'text', label: 'Last name', page: 1, required: true },
        { name: 'email', type: 'email', label: 'Email', page: 1, required: true },
        { name: 'address', type: 'text', label: 'Address', page: 1, required: true },
        { name: 'city', type: 'text', label: 'City', page: 1, required: true },
        { name: 'zipCode', type: 'text', label: 'ZIP code', page: 1, required: true },
        { name: 'paymentMethod', type: 'radio', label: 'Payment method', page: 2, options: ['card', 'paypal', 'apple_pay'], required: true },
        { name: 'cardNumber', type: 'text', label: 'Card number', page: 2, conditional: (values) => matchesValue(values, 'paymentMethod', 'card') },
        { name: 'expiryDate', type: 'text', label: 'Expiry date', page: 2, conditional: (values) => matchesValue(values, 'paymentMethod', 'card') },
        { name: 'shippingMethod', type: 'radio', label: 'Shipping method', page: 3, options: ['standard', 'express', 'overnight'], required: true },
        { name: 'giftMessage', type: 'textarea', label: 'Gift message', page: 3 },
      ],
      pages: [
        { page: 1, title: 'Shipping Address', description: 'Where should we send your order?' },
        { page: 2, title: 'Payment', description: 'How would you like to pay?' },
        { page: 3, title: 'Review & Submit', description: 'Review your order' },
      ],
      progress: { showSteps: true },
      formOptions: {
        defaultValues: { firstName: '', lastName: '', email: '', address: '', city: '', zipCode: '', paymentMethod: 'card', cardNumber: '', expiryDate: '', shippingMethod: 'standard', giftMessage: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'job-application-form',
    title: 'Job Application Form',
    summary: 'Application flow with searchable skills, availability, and salary expectation.',
    options: {
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', page: 1, required: true },
        { name: 'lastName', type: 'text', label: 'Last name', page: 1, required: true },
        { name: 'email', type: 'email', label: 'Email', page: 1, required: true },
        { name: 'phone', type: 'phone', label: 'Phone', page: 1, required: true },
        { name: 'skills', type: 'multiSelect', label: 'Skills', page: 2, options: ['javascript', 'typescript', 'react', 'node', 'python', 'java', 'sql', 'aws'], multiSelectConfig: { searchable: true, creatable: true, maxSelections: 10 }, required: true },
        { name: 'startDate', type: 'date', label: 'Start date', page: 2, required: true },
        { name: 'salaryExpectation', type: 'number', label: 'Salary expectation', page: 2, min: 0, step: 1000, required: true },
        { name: 'whyInterested', type: 'textarea', label: 'Why are you interested?', page: 3, required: true },
        { name: 'additionalInfo', type: 'textarea', label: 'Additional information', page: 3 },
      ],
      pages: [
        { page: 1, title: 'Personal Information' },
        { page: 2, title: 'Skills & Availability' },
        { page: 3, title: 'Additional Questions' },
      ],
      progress: { showSteps: true, showPercentage: true },
      formOptions: {
        defaultValues: { firstName: '', lastName: '', email: '', phone: '', skills: [], startDate: '', salaryExpectation: 0, whyInterested: '', additionalInfo: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'survey-form-dynamic-options',
    title: 'Survey Form With Dynamic Options',
    summary: 'Survey with conditional follow-up fields and country-specific state options.',
    options: {
      fields: [
        { name: 'satisfaction', type: 'rating', label: 'Satisfaction', ratingConfig: { max: 5, showValue: true }, required: true },
        { name: 'recommend', type: 'radio', label: 'Would you recommend us?', options: ['yes', 'maybe', 'no'], required: true },
        { name: 'improvements', type: 'textarea', label: 'What should improve?', conditional: (values) => Number(values.satisfaction ?? 0) < 4 },
        { name: 'referralSource', type: 'select', label: 'Referral source', options: ['friend', 'social', 'search', 'ad', 'other'], conditional: (values) => matchesValue(values, 'recommend', 'yes') },
        { name: 'otherSource', type: 'text', label: 'Other source', conditional: (values) => matchesValue(values, 'referralSource', 'other') },
        { name: 'features', type: 'multiSelect', label: 'Favorite features', options: ['forms', 'validation', 'analytics', 'integrations', 'api'], multiSelectConfig: { maxSelections: 3 } },
        { name: 'country', type: 'select', label: 'Country', options: ['us', 'ca', 'uk', 'au'] },
        { name: 'state', type: 'select', label: 'State or province', conditional: (values) => hasValue(values, 'country'), options: (values) => ({ us: ['ca', 'ny', 'tx', 'fl'], ca: ['on', 'qc', 'bc', 'ab'], uk: ['england', 'scotland', 'wales', 'ni'], au: ['nsw', 'vic', 'qld', 'wa'] })[String(values.country)] ?? [] },
      ],
      formOptions: {
        defaultValues: { satisfaction: 5, recommend: 'yes', improvements: '', referralSource: '', otherSource: '', features: [], country: 'us', state: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'conditional-pages-form',
    title: 'Conditional Pages Form',
    summary: 'Application flow where individual, business, and premium pages appear conditionally.',
    options: {
      fields: [
        { name: 'applicationType', type: 'radio', label: 'Application type', page: 1, options: ['individual', 'business'], required: true },
        { name: 'firstName', type: 'text', label: 'First name', page: 2, conditional: (values) => matchesValue(values, 'applicationType', 'individual') },
        { name: 'lastName', type: 'text', label: 'Last name', page: 2, conditional: (values) => matchesValue(values, 'applicationType', 'individual') },
        { name: 'dateOfBirth', type: 'date', label: 'Date of birth', page: 2, conditional: (values) => matchesValue(values, 'applicationType', 'individual') },
        { name: 'personalId', type: 'text', label: 'Personal ID', page: 2, conditional: (values) => matchesValue(values, 'applicationType', 'individual') },
        { name: 'companyName', type: 'text', label: 'Company name', page: 3, conditional: (values) => matchesValue(values, 'applicationType', 'business') },
        { name: 'businessType', type: 'select', label: 'Business type', page: 3, options: ['llc', 'corporation', 'partnership', 'sole_proprietorship'], conditional: (values) => matchesValue(values, 'applicationType', 'business') },
        { name: 'taxId', type: 'text', label: 'Tax ID', page: 3, conditional: (values) => matchesValue(values, 'applicationType', 'business') },
        { name: 'employeeCount', type: 'number', label: 'Employee count', page: 3, min: 1, conditional: (values) => matchesValue(values, 'applicationType', 'business') },
        { name: 'needsPremium', type: 'checkbox', label: 'Needs premium features', page: 4 },
        { name: 'premiumFeatures', type: 'multiSelect', label: 'Premium features', page: 5, options: ['analytics', 'support', 'integrations', 'whitelabel', 'sla'], multiSelectConfig: { searchable: true, maxSelections: 5 }, conditional: (values) => isTruthyValue(values, 'needsPremium') },
        { name: 'premiumBudget', type: 'radio', label: 'Premium budget', page: 5, options: ['basic', 'standard', 'premium'], conditional: (values) => isTruthyValue(values, 'needsPremium') },
        { name: 'email', type: 'email', label: 'Email', page: 6, required: true },
        { name: 'phone', type: 'phone', label: 'Phone', page: 6, required: true },
        { name: 'preferredContact', type: 'radio', label: 'Preferred contact', page: 6, options: ['email', 'phone', 'both'], required: true },
      ],
      pages: [
        { page: 1, title: 'Application Type' },
        { page: 2, title: 'Personal Information', conditional: (values) => matchesValue(values, 'applicationType', 'individual') },
        { page: 3, title: 'Business Information', conditional: (values) => matchesValue(values, 'applicationType', 'business') },
        { page: 4, title: 'Premium Features' },
        { page: 5, title: 'Premium Options', conditional: (values) => isTruthyValue(values, 'needsPremium') },
        { page: 6, title: 'Contact Information' },
      ],
      progress: { showSteps: true, showPercentage: true },
      formOptions: {
        defaultValues: { applicationType: 'individual', firstName: '', lastName: '', dateOfBirth: '', personalId: '', companyName: '', businessType: '', taxId: '', employeeCount: 1, needsPremium: false, premiumFeatures: [], premiumBudget: 'basic', email: '', phone: '', preferredContact: 'email' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'persistence-form',
    title: 'Persistence Form',
    summary: 'Project inquiry form with localStorage persistence and excluded agreement field.',
    options: {
      fields: [
        { name: 'name', type: 'text', label: 'Name', page: 1, section: 'Contact Information', required: true },
        { name: 'email', type: 'email', label: 'Email', page: 1, required: true },
        { name: 'phone', type: 'phone', label: 'Phone', page: 1, required: true },
        { name: 'company', type: 'text', label: 'Company', page: 1, required: true },
        { name: 'jobTitle', type: 'text', label: 'Job title', page: 1, required: true },
        { name: 'projectType', type: 'multiSelect', label: 'Project type', page: 2, options: ['web-dev', 'mobile-app', 'ecommerce', 'api', 'consulting'], multiSelectConfig: { searchable: true, maxSelections: 3 }, required: true },
        { name: 'timeline', type: 'select', label: 'Timeline', page: 2, options: ['ASAP', '1-3 months', '3-6 months', '6+ months', 'Flexible'], required: true },
        { name: 'budget', type: 'radio', label: 'Budget', page: 2, options: ['<25k', '25k-75k', '75k-150k', '150k+'], required: true },
        { name: 'description', type: 'textarea', label: 'Description', page: 3, rows: 6, maxLength: 1000, required: true },
        { name: 'agreeToTerms', type: 'checkbox', label: 'I agree to the terms', page: 3, required: true },
      ],
      pages: [
        { page: 1, title: 'Contact Information' },
        { page: 2, title: 'Project Requirements' },
        { page: 3, title: 'Final Details' },
      ],
      persistence: { key: 'demo-project-inquiry-form-compat', storage: 'localStorage', debounceMs: 1500, exclude: ['agreeToTerms'], restoreOnMount: true },
      formOptions: {
        defaultValues: { name: '', email: '', phone: '', company: '', jobTitle: '', projectType: [], timeline: '', budget: '', description: '', agreeToTerms: false },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'tabbed-form',
    title: 'Tabbed Form',
    summary: 'Settings form grouped by personal, preferences, and settings tabs.',
    options: {
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', tab: 'personal', required: true },
        { name: 'lastName', type: 'text', label: 'Last name', tab: 'personal', required: true },
        { name: 'email', type: 'email', label: 'Email', tab: 'personal', required: true },
        { name: 'phone', type: 'phone', label: 'Phone', tab: 'personal', required: true },
        { name: 'theme', type: 'select', label: 'Theme', tab: 'preferences', options: ['light', 'dark', 'auto'], required: true },
        { name: 'language', type: 'select', label: 'Language', tab: 'preferences', options: ['en', 'es', 'fr', 'de'], required: true },
        { name: 'notifications', type: 'switch', label: 'Notifications', tab: 'preferences' },
        { name: 'newsletter', type: 'switch', label: 'Newsletter', tab: 'preferences' },
        { name: 'privacy', type: 'radio', label: 'Privacy', tab: 'settings', options: ['public', 'private', 'friends'], required: true },
        { name: 'marketing', type: 'checkbox', label: 'Marketing', tab: 'settings' },
        { name: 'analytics', type: 'checkbox', label: 'Analytics', tab: 'settings' },
        { name: 'location', type: 'text', label: 'Location', tab: 'settings' },
      ],
      tabs: [
        { id: 'personal', label: 'Personal' },
        { id: 'preferences', label: 'Preferences' },
        { id: 'settings', label: 'Settings' },
      ],
      formOptions: {
        defaultValues: { firstName: '', lastName: '', email: '', phone: '', theme: 'auto', language: 'en', notifications: true, newsletter: false, privacy: 'private', marketing: false, analytics: true, location: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'array-fields-form',
    title: 'Array Fields Form',
    summary: 'Object and scalar array fields for team members, contact methods, and emergency contacts.',
    options: {
      fields: [
        {
          name: 'teamMembers',
          type: 'array',
          label: 'Team members',
          arrayConfig: {
            itemType: 'object',
            minItems: 1,
            maxItems: 10,
            sortable: true,
            defaultValue: { name: '', email: '', role: 'developer', skills: '', startDate: '' },
            objectConfig: {
              fields: [
                { name: 'name', type: 'text', label: 'Name', required: true },
                { name: 'email', type: 'email', label: 'Email', required: true },
                { name: 'role', type: 'select', label: 'Role', options: ['developer', 'designer', 'manager', 'qa'], required: true },
                { name: 'skills', type: 'text', label: 'Skills' },
                { name: 'startDate', type: 'date', label: 'Start date', required: true },
              ],
            },
          },
        },
        { name: 'contactMethods', type: 'array', label: 'Contact methods', arrayConfig: { itemType: 'email', minItems: 1, maxItems: 5, defaultValue: '' } },
        {
          name: 'emergencyContacts',
          type: 'array',
          label: 'Emergency contacts',
          arrayConfig: {
            itemType: 'object',
            minItems: 0,
            maxItems: 3,
            defaultValue: { name: '', relationship: '', phone: '', isPrimary: false },
            objectConfig: {
              fields: [
                { name: 'name', type: 'text', label: 'Name', required: true },
                { name: 'relationship', type: 'text', label: 'Relationship', required: true },
                { name: 'phone', type: 'phone', label: 'Phone', required: true },
                { name: 'isPrimary', type: 'checkbox', label: 'Primary contact' },
              ],
            },
          },
        },
      ],
      formOptions: {
        defaultValues: { teamMembers: [{ name: '', email: '', role: 'developer', skills: '', startDate: '' }], contactMethods: [''], emergencyContacts: [] },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'nested-conditional-object-in-array-form',
    title: 'Nested Conditional Object-In-Array Form',
    summary: 'Room array with a nested equipment textarea controlled by each room item.',
    options: {
      fields: [
        {
          name: 'roomDetails',
          type: 'array',
          label: 'Room details',
          arrayConfig: {
            itemType: 'object',
            minItems: 1,
            maxItems: 20,
            sortable: true,
            defaultValue: { equipementRoom: false, equipementListRoom: '' },
            objectConfig: {
              collapsible: true,
              layout: 'grid',
              columns: 2,
              fields: [
                { name: 'equipementRoom', type: 'switch', label: 'Equipment in room' },
                { name: 'equipementListRoom', type: 'textarea', label: 'Equipment list', maxLength: 1000, conditional: (values) => isTruthyValue(values, 'equipementRoom') },
              ],
            },
          },
        },
      ],
      formOptions: {
        defaultValues: { roomDetails: [{ equipementRoom: false, equipementListRoom: '' }] },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'flow-form',
    title: 'Flow Form',
    summary: 'Vacation rental flow with dynamic labels, conditional vehicle selection, and extras.',
    options: {
      fields: [
        { name: 'name', type: 'text', label: 'Your name', page: 1, required: true },
        { name: 'destination', type: 'radio', label: 'Where are you going, {{name}}?', page: 2, options: ['beach', 'mountains', 'city'], required: true },
        { name: 'startDate', type: 'date', label: 'Start date for {{destination}}', page: 3, required: true },
        { name: 'endDate', type: 'date', label: 'End date for {{destination}}', page: 4, required: true },
        { name: 'passengers', type: 'number', label: 'Passengers for {{name}}', page: 5, min: 1, required: true },
        { name: 'carType', type: 'select', label: 'Car type for {{destination}}', page: 6, options: ['convertible', 'suv', 'compact', 'luxury'], conditional: (values) => ['beach', 'mountains', 'city'].includes(String(values.destination)), required: true },
        { name: 'extras', type: 'multiSelect', label: 'Extras for your {{carType}}', page: 7, options: ['gps', 'child_seat', 'roof_rack', 'wifi'], multiSelectConfig: { searchable: true } },
        { name: 'contactEmail', type: 'email', label: 'Contact email for {{name}}', page: 8, required: true },
      ],
      pages: [
        { page: 1, title: "Let's get started" },
        { page: 2, title: 'Destination', description: 'Hi {{name}}! Where are you going?' },
        { page: 3, title: 'Trip Start Date', description: 'When does your adventure to the {{destination}} begin?' },
        { page: 4, title: 'Trip End Date', description: 'When will you return from {{destination}}?' },
        { page: 5, title: 'Passengers', description: 'How many people are traveling with you, {{name}}?' },
        { page: 6, title: 'Choose Your Car', description: 'Pick the perfect ride for {{destination}}' },
        { page: 7, title: 'Extras', description: 'Add selected extras to make your {{carType}} more comfortable' },
        { page: 8, title: 'Contact Info', description: 'Where should we send your booking details, {{name}}?' },
      ],
      progress: { showSteps: true, showPercentage: true },
      formOptions: {
        defaultValues: { name: '', destination: 'beach', startDate: '', endDate: '', passengers: 1, carType: 'convertible', extras: [], contactEmail: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'rental-car-flow-form',
    title: 'Rental Car Flow With Dynamic Text',
    summary: 'Nineteen-page rental flow with dynamic copy and conditional navigation pages.',
    options: {
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', page: 1, required: true },
        { name: 'destination', type: 'text', label: 'Where are you heading, {{firstName}}?', page: 2, required: true },
        { name: 'tripPurpose', type: 'radio', label: 'Purpose for visiting {{destination}}', page: 3, options: ['business', 'vacation', 'weekend_getaway', 'family_visit', 'other'], required: true },
        { name: 'pickupDate', type: 'date', label: 'Pickup date', page: 4, required: true },
        { name: 'returnDate', type: 'date', label: 'Return date', page: 5, required: true },
        { name: 'passengerCount', type: 'slider', label: 'Passenger count', page: 6, sliderConfig: { min: 1, max: 8, step: 1, showValue: true }, required: true },
        { name: 'luggageAmount', type: 'radio', label: 'Luggage amount', page: 7, options: ['minimal', 'moderate', 'heavy'], required: true },
        { name: 'carCategory', type: 'select', label: 'Car category for {{destination}}', page: 8, options: ['economy', 'compact', 'midsize', 'full_size', 'luxury', 'suv', 'convertible'], required: true },
        { name: 'fuelPreference', type: 'radio', label: 'Fuel preference', page: 9, options: ['gas', 'hybrid', 'electric'], required: true },
        { name: 'hasSpecialNeeds', type: 'switch', label: 'Special requirements?', page: 10 },
        { name: 'specialRequirements', type: 'textarea', label: 'Special requirements for {{firstName}}', page: 11, rows: 4, maxLength: 500, conditional: (values) => isTruthyValue(values, 'hasSpecialNeeds') },
        { name: 'budgetRange', type: 'radio', label: 'Budget range', page: 12, options: ['under_50', '50_100', '100_150', '150_plus'], required: true },
        { name: 'needsInsurance', type: 'switch', label: 'Need insurance?', page: 13 },
        { name: 'insuranceType', type: 'radio', label: 'Insurance type', page: 14, options: ['basic', 'premium', 'comprehensive'], conditional: (values) => isTruthyValue(values, 'needsInsurance') },
        { name: 'wantsGPS', type: 'switch', label: 'Add GPS?', page: 15 },
        { name: 'wantsChildSeat', type: 'switch', label: 'Add child seat?', page: 16 },
        { name: 'childSeatCount', type: 'slider', label: 'Child seat count', page: 17, sliderConfig: { min: 1, max: 4, step: 1, showValue: true }, conditional: (values) => isTruthyValue(values, 'wantsChildSeat') },
        { name: 'phone', type: 'phone', label: 'Phone', page: 18, phoneConfig: { defaultCountry: 'US', format: 'national' }, required: true },
        { name: 'email', type: 'email', label: 'Email for {{firstName}}', page: 19, required: true },
      ],
      pages: Array.from({ length: 19 }, (_, index) => ({ page: index + 1, title: `Rental Step ${index + 1}` })),
      nextLabel: 'Continue',
      previousLabel: 'Back',
      submitLabel: 'Reserve car',
      formClassName: 'max-w-2xl',
      formOptions: {
        defaultValues: { firstName: '', destination: '', tripPurpose: 'vacation', pickupDate: '', returnDate: '', passengerCount: 2, luggageAmount: 'moderate', carCategory: 'compact', fuelPreference: 'hybrid', hasSpecialNeeds: false, specialRequirements: '', budgetRange: '50_100', needsInsurance: false, insuranceType: 'basic', wantsGPS: true, wantsChildSeat: false, childSeatCount: 1, phone: '', email: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'analytics-tracking-form',
    title: 'Analytics Tracking Form',
    summary: 'Lead form wired to form start, focus, blur, page, completion, and abandonment callbacks.',
    options: {
      fields: [
        { name: 'email', type: 'email', label: 'Email', page: 1, required: true },
        { name: 'companySize', type: 'select', label: 'Company size', page: 1, options: ['1-10', '11-50', '51-200', '200+'], required: true },
        { name: 'interests', type: 'multiSelect', label: 'Interests', page: 2, options: ['web-dev', 'mobile', 'ecommerce', 'analytics', 'automation'], required: true },
        { name: 'budget', type: 'radio', label: 'Budget', page: 2, options: ['<10k', '10k-50k', '50k-100k', '100k+'], required: true },
        { name: 'timeline', type: 'select', label: 'Timeline', page: 3, options: ['ASAP', '1-3 months', '3-6 months', '6+ months'], required: true },
        { name: 'description', type: 'textarea', label: 'Description', page: 3, rows: 4, maxLength: 500, required: true },
      ],
      pages: [
        { page: 1, title: 'Company Info' },
        { page: 2, title: 'Project Details' },
        { page: 3, title: 'Timeline & Details' },
      ],
      analytics: {
        onFormStart: (timestamp) => handleAnalyticsEvent('form-start', { timestamp }),
        onFieldFocus: (fieldName, timestamp) => handleAnalyticsEvent('field-focus', { fieldName, timestamp }),
        onFieldBlur: (fieldName, timeSpent) => handleAnalyticsEvent('field-blur', { fieldName, timeSpent }),
        onPageChange: (fromPage, toPage, timeSpent, pageValidationState) => handleAnalyticsEvent('page-change', { fromPage, toPage, timeSpent, pageValidationState }),
        onFormComplete: (timeSpent, formData) => handleAnalyticsEvent('form-complete', { timeSpent, formData }),
        onFormAbandon: (completionPercentage, context) => handleAnalyticsEvent('form-abandon', { completionPercentage, context }),
      },
      formOptions: {
        defaultValues: { email: '', companySize: '1-10', interests: [], budget: '<10k', timeline: 'ASAP', description: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
  {
    id: 'advanced-field-types-form',
    title: 'Advanced Field Types Form',
    summary: 'Advanced fields covering rating, phone, color, location, duration, sliders, file, and password.',
    options: {
      fields: [
        { name: 'satisfaction', type: 'rating', label: 'Satisfaction', ratingConfig: { max: 5, allowHalf: true, icon: 'star', size: 'lg', showValue: true }, required: true },
        { name: 'overallRating', type: 'rating', label: 'Overall rating', ratingConfig: { max: 5, icon: 'heart', size: 'md', showValue: true }, required: true },
        { name: 'phoneNumber', type: 'phone', label: 'Phone number', phoneConfig: { defaultCountry: 'US', format: 'international' }, required: true },
        { name: 'favoriteColor', type: 'colorPicker', label: 'Favorite color', colorConfig: { format: 'hex', showPreview: true, presetColors: ['#111827', '#2563eb', '#dc2626'], allowCustom: true }, required: true },
        { name: 'workLocation', type: 'location', label: 'Work location', locationConfig: { enableSearch: true, enableGeolocation: true, enableManualEntry: true, showMap: true } },
        { name: 'workDuration', type: 'duration', label: 'Work duration', durationConfig: { format: 'hm', maxHours: 24, showLabels: true } },
        { name: 'skills', type: 'multiSelect', label: 'Skills', options: ['javascript', 'typescript', 'react', 'vue', 'angular', 'nodejs', 'python', 'java'], multiSelectConfig: { searchable: true, creatable: true, maxSelections: 8 }, required: true },
        { name: 'experienceLevel', type: 'slider', label: 'Experience level', sliderConfig: { min: 1, max: 10, step: 1, showTooltip: true, showValue: true }, required: true },
        { name: 'performanceLevel', type: 'slider', label: 'Performance level', sliderConfig: { min: 0, max: 100, step: 10, valueLabelSuffix: '%' }, required: true },
        { name: 'birthDate', type: 'date', label: 'Birth date', dateConfig: { maxDate: new Date(), minDate: new Date('1900-01-01') }, required: true },
        { name: 'resume', type: 'file', label: 'Resume', fileConfig: { accept: '.pdf,.doc,.docx', multiple: false, maxSize: 5_242_880, maxFiles: 1 } },
        { name: 'aboutMe', type: 'textarea', label: 'About me', rows: 6, maxLength: 1000, required: true },
        { name: 'password', type: 'password', label: 'Password', required: true },
        { name: 'workEmail', type: 'email', label: 'Work email', required: true },
      ],
      formOptions: {
        defaultValues: { satisfaction: 4, overallRating: 5, phoneNumber: '', favoriteColor: '#2563eb', workLocation: undefined, workDuration: undefined, skills: [], experienceLevel: 5, performanceLevel: 70, birthDate: '', resume: undefined, aboutMe: '', password: '', workEmail: '' },
        onSubmit: handleExampleSubmit,
      },
    },
  },
] satisfies readonly DocsCompatibilityExample[];
