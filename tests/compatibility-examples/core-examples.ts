import type { CompatibilityExample } from './example-manifest';

const contactSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/contact-form.tsx';
const registrationSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/registration-form.tsx';
const checkoutSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/checkout-form.tsx';
const jobApplicationSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/job-application-form.tsx';
const advancedFieldTypesSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/advanced-field-types-form.tsx';

export const contactCompatibilityExample = {
  id: 'contact-form',
  group: 'core',
  sourceFile: contactSource,
  publicBehavior: [
    'compatibility examples preserve a single-page contact form with text, email, textarea, combobox, multicombobox, and checkbox fields.',
    'Subject options remain searchable, and categories remain searchable, creatable, and capped at three selections.',
    'Default values initialize subject to general, categories to an empty list, and urgent to false.',
  ],
  schemaFields: {
    name: ['string', 'required'],
    email: ['string', 'email', 'required'],
    subject: ['enum', 'required'],
    message: ['string', 'required'],
    categories: ['array', 'optional'],
    urgent: ['boolean'],
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email' },
    {
      name: 'subject',
      type: 'combobox',
      options: [
        { value: 'general', label: 'General Inquiry' },
        { value: 'support', label: 'Technical Support' },
        { value: 'sales', label: 'Sales Question' },
        { value: 'billing', label: 'Billing Question' },
        { value: 'feature', label: 'Feature Request' },
      ],
      config: ['searchable', 'placeholder', 'searchPlaceholder', 'noOptionsText'],
    },
    { name: 'message', type: 'textarea' },
    {
      name: 'categories',
      type: 'multicombobox',
      options: [
        { value: 'bug', label: 'Bug Report' },
        { value: 'feature', label: 'Feature Request' },
        { value: 'documentation', label: 'Documentation' },
        { value: 'performance', label: 'Performance Issue' },
        { value: 'security', label: 'Security Concern' },
      ],
      config: ['searchable', 'creatable', 'maxSelections:3'],
    },
    { name: 'urgent', type: 'checkbox' },
  ],
  optionsUsed: ['submitLabel', 'collapseLabel', 'expandLabel', 'formOptions.defaultValues'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'contact form exposes six named fields without relying on array-index lookup',
    'subject accepts original visible options including billing and feature options even though schema enum only lists general, support, and sales',
    'category selection is creatable and limits selected values to three',
  ],
} satisfies CompatibilityExample;

export const registrationCompatibilityExample = {
  id: 'registration-form',
  group: 'core',
  sourceFile: registrationSource,
  publicBehavior: [
    'compatibility examples preserve a three-page registration flow grouped into personal information, contact details, and preferences.',
    'The second page description supports interpolation of firstName.',
    'Progress can show both steps and percentage.',
  ],
  schemaFields: {
    firstName: ['string', 'required'],
    lastName: ['string', 'required'],
    birthDate: ['date', 'required'],
    email: ['string', 'email', 'required'],
    phone: ['string', 'required'],
    address: ['string', 'required'],
    newsletter: ['boolean'],
    notifications: ['boolean'],
    plan: ['enum', 'required'],
  },
  fields: [
    { name: 'firstName', type: 'text', page: 1 },
    { name: 'lastName', type: 'text', page: 1 },
    { name: 'birthDate', type: 'date', page: 1 },
    { name: 'email', type: 'email', page: 2 },
    { name: 'phone', type: 'phone', page: 2 },
    { name: 'address', type: 'textarea', page: 2 },
    { name: 'newsletter', type: 'switch', page: 3 },
    { name: 'notifications', type: 'switch', page: 3 },
    {
      name: 'plan',
      type: 'radio',
      page: 3,
      options: [
        { value: 'basic', label: 'Basic - Free' },
        { value: 'pro', label: 'Pro - $9/month' },
        { value: 'enterprise', label: 'Enterprise - $29/month' },
      ],
    },
  ],
  pages: [
    { page: 1, title: 'Personal Information', description: 'Tell us about yourself' },
    { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}}?' },
    { page: 3, title: 'Preferences', description: 'Customize your experience' },
  ],
  optionsUsed: ['pages', 'progress.showSteps', 'progress.showPercentage', 'formOptions.defaultValues'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'visible page count is three when no page condition removes a page',
    'firstName token is replaced in the contact details page description',
    'plan defaults to basic and exposes basic, pro, and enterprise choices',
  ],
} satisfies CompatibilityExample;

export const checkoutCompatibilityExample = {
  id: 'checkout-form',
  group: 'core',
  sourceFile: checkoutSource,
  publicBehavior: [
    'compatibility examples preserve a three-page checkout flow for shipping, payment, and review.',
    'Card number and expiry date are visible only when paymentMethod is card.',
    'Progress can show steps without percentage.',
  ],
  schemaFields: {
    firstName: ['string', 'required'],
    lastName: ['string', 'required'],
    email: ['string', 'email', 'required'],
    address: ['string', 'required'],
    city: ['string', 'required'],
    zipCode: ['string', 'required'],
    paymentMethod: ['enum', 'required'],
    cardNumber: ['string', 'optional'],
    expiryDate: ['string', 'optional'],
    shippingMethod: ['enum', 'required'],
    giftMessage: ['string', 'optional'],
  },
  fields: [
    { name: 'firstName', type: 'text', page: 1 },
    { name: 'lastName', type: 'text', page: 1 },
    { name: 'email', type: 'email', page: 1 },
    { name: 'address', type: 'text', page: 1 },
    { name: 'city', type: 'text', page: 1 },
    { name: 'zipCode', type: 'text', page: 1 },
    {
      name: 'paymentMethod',
      type: 'radio',
      page: 2,
      options: [
        { value: 'card', label: 'Credit/Debit Card' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'apple_pay', label: 'Apple Pay' },
      ],
    },
    { name: 'cardNumber', type: 'text', page: 2, conditional: 'paymentMethod is card' },
    { name: 'expiryDate', type: 'text', page: 2, conditional: 'paymentMethod is card' },
    {
      name: 'shippingMethod',
      type: 'radio',
      page: 3,
      options: [
        { value: 'standard', label: 'Standard (5-7 days) - Free' },
        { value: 'express', label: 'Express (2-3 days) - $9.99' },
        { value: 'overnight', label: 'Overnight - $24.99' },
      ],
    },
    { name: 'giftMessage', type: 'textarea', page: 3 },
  ],
  pages: [
    { page: 1, title: 'Shipping Address', description: 'Where should we send your order?' },
    { page: 2, title: 'Payment', description: 'How would you like to pay?' },
    { page: 3, title: 'Review & Submit', description: 'Review your order' },
  ],
  optionsUsed: ['pages', 'progress.showSteps', 'formOptions.defaultValues', 'field.conditional'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'cardNumber and expiryDate are hidden for paypal and apple_pay payment methods',
    'cardNumber and expiryDate are visible for card payment method',
    'shippingMethod defaults to standard',
  ],
} satisfies CompatibilityExample;

export const jobApplicationCompatibilityExample = {
  id: 'job-application-form',
  group: 'core',
  sourceFile: jobApplicationSource,
  publicBehavior: [
    'compatibility examples preserve a three-page job application flow.',
    'Technical skills use a searchable and creatable multiSelect capped at ten selections.',
    'Salary expectation is a number input with minimum zero and step one thousand.',
  ],
  schemaFields: {
    firstName: ['string', 'required'],
    lastName: ['string', 'required'],
    email: ['string', 'email', 'required'],
    phone: ['string', 'required'],
    skills: ['array', 'required'],
    startDate: ['date', 'required'],
    salaryExpectation: ['number', 'required'],
    whyInterested: ['string', 'required'],
    additionalInfo: ['string', 'optional'],
  },
  fields: [
    { name: 'firstName', type: 'text', page: 1 },
    { name: 'lastName', type: 'text', page: 1 },
    { name: 'email', type: 'email', page: 1 },
    { name: 'phone', type: 'phone', page: 1 },
    {
      name: 'skills',
      type: 'multiSelect',
      page: 2,
      options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'react', label: 'React' },
        { value: 'node', label: 'Node.js' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'sql', label: 'SQL' },
        { value: 'aws', label: 'AWS' },
      ],
      config: ['searchable', 'creatable', 'maxSelections:10'],
    },
    { name: 'startDate', type: 'date', page: 2 },
    { name: 'salaryExpectation', type: 'number', page: 2, config: ['min:0', 'step:1000'] },
    { name: 'whyInterested', type: 'textarea', page: 3 },
    { name: 'additionalInfo', type: 'textarea', page: 3 },
  ],
  pages: [
    { page: 1, title: 'Personal Information' },
    { page: 2, title: 'Skills & Availability' },
    { page: 3, title: 'Additional Questions' },
  ],
  optionsUsed: ['pages', 'progress.showSteps', 'progress.showPercentage', 'multiSelectConfig'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'skills requires at least one selected value',
    'skills supports searching, creating, and up to ten selected values',
    'salaryExpectation rejects negative values',
  ],
} satisfies CompatibilityExample;

export const advancedFieldTypesCompatibilityExample = {
  id: 'advanced-field-types-form',
  group: 'core',
  sourceFile: advancedFieldTypesSource,
  publicBehavior: [
    'compatibility examples preserve advanced field coverage without copying custom React visualization implementation.',
    'Location search remains configurable as an async public behavior but network behavior is represented as expected data shape only.',
    'Slider fields preserve marks, value mappings, gradient configuration, suffixes, and custom visualization slots as configuration evidence.',
  ],
  schemaFields: {
    satisfaction: ['number', 'required'],
    phoneNumber: ['string', 'required'],
    favoriteColor: ['string', 'required'],
    workLocation: ['object', 'optional'],
    workDuration: ['object', 'optional'],
    skills: ['array', 'required'],
    experienceLevel: ['number', 'required'],
    energyRating: ['number', 'required'],
    performanceLevel: ['number', 'required'],
    speedometer: ['number', 'required'],
    birthDate: ['date', 'required'],
    resume: ['file-like', 'optional'],
    aboutMe: ['string', 'required'],
    password: ['string', 'required'],
    workEmail: ['string', 'email', 'required'],
    overallRating: ['number', 'required'],
  },
  fields: [
    { name: 'satisfaction', type: 'rating', config: ['max:5', 'allowHalf', 'icon:star', 'size:lg', 'showValue'] },
    { name: 'overallRating', type: 'rating', config: ['max:5', 'icon:heart', 'size:md', 'showValue'] },
    { name: 'phoneNumber', type: 'phone', config: ['defaultCountry:US', 'format:international'] },
    { name: 'favoriteColor', type: 'colorPicker', config: ['format:hex', 'showPreview', 'presetColors', 'allowCustom'] },
    { name: 'workLocation', type: 'location', config: ['openstreetmap', 'enableSearch', 'enableGeolocation', 'enableManualEntry', 'showMap'] },
    { name: 'workDuration', type: 'duration', config: ['format:hm', 'maxHours:24', 'showLabels'] },
    {
      name: 'skills',
      type: 'multiSelect',
      options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue.js' },
        { value: 'angular', label: 'Angular' },
        { value: 'nodejs', label: 'Node.js' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
      ],
      config: ['searchable', 'creatable', 'maxSelections:8'],
    },
    { name: 'experienceLevel', type: 'slider', config: ['min:1', 'max:10', 'step:1', 'marks', 'showTooltip', 'showValue'] },
    { name: 'energyRating', type: 'slider', config: ['min:1', 'max:5', 'valueMapping:E-D-C-B-A', 'visualizationComponentSlot'] },
    { name: 'performanceLevel', type: 'slider', config: ['min:0', 'max:100', 'step:10', 'gradientColors', 'valueLabelSuffix:%'] },
    { name: 'speedometer', type: 'slider', config: ['min:0', 'max:200', 'step:10', 'valueMapping', 'visualizationComponentSlot', 'valueLabelSuffix:km/h'] },
    { name: 'birthDate', type: 'date', config: ['format:MM/dd/yyyy', 'maxDate:today', 'minDate:1900-01-01'] },
    { name: 'resume', type: 'file', config: ['accept:.pdf,.doc,.docx', 'multiple:false', 'maxSize:5242880', 'maxFiles:1'] },
    { name: 'aboutMe', type: 'textarea', config: ['rows:6', 'resize:vertical', 'maxLength:1000', 'showWordCount'] },
    { name: 'password', type: 'password', config: ['showToggle', 'strengthMeter', 'minStrength:3'] },
    { name: 'workEmail', type: 'email' },
  ],
  optionsUsed: ['ratingConfig', 'phoneConfig', 'colorConfig', 'locationConfig', 'durationConfig', 'sliderConfig', 'dateConfig', 'fileConfig', 'textareaConfig', 'passwordConfig'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'advanced field types include rating, phone, colorPicker, location, duration, multiSelect, slider, date, file, textarea, password, and email',
    'location search results are expected to map to id, lat, lng, address, city, state, country, postalCode, and relevance fields',
    'resume accepts a file-like optional value without preserving old untyped runtime behavior',
  ],
} satisfies CompatibilityExample;
