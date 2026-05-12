import type { CompatibilityExample } from './example-manifest';

const arrayFieldsSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/array-fields-form.tsx';
const nestedConditionalSource =
  'old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/conditional-in-obj.tsx';

export const arrayFieldsCompatibilityExample = {
  id: 'array-fields-form',
  group: 'nested',
  sourceFile: arrayFieldsSource,
  publicBehavior: [
    'compatibility examples preserve array fields for object arrays and scalar email arrays.',
    'Team members are sortable objects with nested fields and a default team member value.',
    'Emergency contacts are object array items capped at three entries.',
  ],
  schemaFields: {
    teamMembers: ['array', 'required'],
    'teamMembers.name': ['string', 'required'],
    'teamMembers.email': ['string', 'email', 'required'],
    'teamMembers.role': ['enum', 'required'],
    'teamMembers.skills': ['array'],
    'teamMembers.startDate': ['date', 'required'],
    contactMethods: ['array', 'required'],
    emergencyContacts: ['array'],
    'emergencyContacts.name': ['string', 'required'],
    'emergencyContacts.relationship': ['string', 'required'],
    'emergencyContacts.phone': ['string', 'required'],
    'emergencyContacts.isPrimary': ['boolean'],
  },
  fields: [
    {
      name: 'teamMembers',
      type: 'array',
      config: ['itemType:object', 'minItems:1', 'maxItems:10', 'sortable', 'defaultValue'],
      nestedFields: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'role', type: 'select', options: ['developer', 'designer', 'manager', 'qa'] },
        { name: 'skills', type: 'text' },
        { name: 'startDate', type: 'text' },
      ],
    },
    {
      name: 'contactMethods',
      type: 'array',
      config: ['itemType:email', 'minItems:1', 'maxItems:5', 'defaultValue:emptyString'],
    },
    {
      name: 'emergencyContacts',
      type: 'array',
      config: ['itemType:object', 'minItems:0', 'maxItems:3', 'defaultValue'],
      nestedFields: [
        { name: 'name', type: 'text' },
        { name: 'relationship', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'isPrimary', type: 'text' },
      ],
    },
  ],
  optionsUsed: ['arrayConfig', 'arrayConfig.objectConfig.fields', 'section', 'formOptions.defaultValues'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'teamMembers requires at least one item and allows at most ten items',
    'contactMethods requires at least one valid email item and allows at most five items',
    'emergencyContacts allows at most three items',
    'nested fields are addressed by field names and not by array index',
  ],
} satisfies CompatibilityExample;

export const nestedConditionalObjectArrayCompatibilityExample = {
  id: 'nested-conditional-object-in-array-form',
  group: 'nested',
  sourceFile: nestedConditionalSource,
  publicBehavior: [
    'compatibility examples preserve a nested conditional textarea inside an object array item.',
    'Each room item has an equipment switch and an equipment list textarea that appears only for that item when the switch is true.',
    'The object array supports collapsible item configuration, grid layout, and card visibility options.',
  ],
  schemaFields: {
    roomDetails: ['array', 'optional'],
    'roomDetails.equipementRoom': ['boolean'],
    'roomDetails.equipementListRoom': ['string', 'optional'],
  },
  fields: [
    {
      name: 'roomDetails',
      type: 'array',
      config: ['itemType:object', 'minItems:1', 'maxItems:20', 'sortable', 'defaultValue', 'objectConfig.collapsible', 'objectConfig.layout:grid', 'objectConfig.columns:2'],
      nestedFields: [
        { name: 'equipementRoom', type: 'switch' },
        {
          name: 'equipementListRoom',
          type: 'textarea',
          conditional: 'current room item equipementRoom is true',
          config: ['maxLength:1000'],
        },
      ],
    },
  ],
  optionsUsed: ['arrayConfig', 'arrayConfig.objectConfig', 'nested field conditional', 'nested validation'],
  returnHelpersUsed: ['Form'],
  assertionsRequired: [
    'roomDetails accepts between one and twenty room items when present',
    'equipementListRoom is visible for a room item only when that same item has equipementRoom set to true',
    'nested conditional evaluation uses the item object value and not a top-level field lookup',
  ],
} satisfies CompatibilityExample;
