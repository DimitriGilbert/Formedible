import type { CompatibilityExample } from './example-manifest';

const flowSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/flow-form.tsx';

export const vacationFlowCompatibilityExample = {
  id: 'flow-form',
  group: 'advanced-field',
  sourceFile: flowSource,
  publicBehavior: [
    'compatibility examples preserve an eight-page vacation car rental flow with dynamic labels and page descriptions.',
    'The car type field is conditional on selecting a supported destination.',
    'Extras are searchable multiSelect values that depend semantically on the selected car type label.',
  ],
  schemaFields: {
    name: ['string', 'required'],
    destination: ['enum', 'required'],
    startDate: ['string', 'required'],
    endDate: ['string', 'required'],
    passengers: ['number', 'required'],
    carType: ['enum', 'required'],
    extras: ['array', 'optional'],
    contactEmail: ['string', 'email', 'required'],
  },
  fields: [
    { name: 'name', type: 'text', page: 1 },
    { name: 'destination', type: 'radio', page: 2, options: ['beach', 'mountains', 'city'], config: ['dynamicText:name'] },
    { name: 'startDate', type: 'date', page: 3, config: ['dynamicText:destination'] },
    { name: 'endDate', type: 'date', page: 4, config: ['dynamicText:destination'] },
    { name: 'passengers', type: 'number', page: 5, config: ['min:1', 'dynamicText:name'] },
    { name: 'carType', type: 'select', page: 6, conditional: 'destination is beach, mountains, or city', options: ['convertible', 'suv', 'compact', 'luxury'] },
    { name: 'extras', type: 'multiSelect', page: 7, options: ['gps', 'child_seat', 'roof_rack', 'wifi'], config: ['searchable', 'dynamicText:carType'] },
    { name: 'contactEmail', type: 'email', page: 8, config: ['dynamicText:name'] },
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
  optionsUsed: ['pages', 'progress.showSteps', 'progress.showPercentage', 'dynamic text tokens', 'field.conditional'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'name, destination, and carType tokens interpolate in labels and page descriptions',
    'carType is visible for beach, mountains, and city destinations',
    'passengers rejects values below one',
  ],
} satisfies CompatibilityExample;
