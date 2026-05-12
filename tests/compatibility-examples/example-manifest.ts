import {
  analyticsTrackingCompatibilityExample,
  conditionalPagesCompatibilityExample,
  persistenceCompatibilityExample,
  rentalCarFlowCompatibilityExample,
  surveyCompatibilityExample,
  tabbedCompatibilityExample,
} from './behavior-examples';
import {
  advancedFieldTypesCompatibilityExample,
  checkoutCompatibilityExample,
  contactCompatibilityExample,
  jobApplicationCompatibilityExample,
  registrationCompatibilityExample,
} from './core-examples';
import { vacationFlowCompatibilityExample } from './advanced-field-examples';
import {
  arrayFieldsCompatibilityExample,
  nestedConditionalObjectArrayCompatibilityExample,
} from './nested-examples';

export type CompatibilityExampleGroup = 'core' | 'behavior' | 'advanced-field' | 'nested';

export type SchemaRule =
  | 'array'
  | 'boolean'
  | 'date'
  | 'email'
  | 'enum'
  | 'file-like'
  | 'number'
  | 'object'
  | 'optional'
  | 'required'
  | 'string';

export type FieldOption = Readonly<{
  value: string;
  label: string;
}>;

export type FieldDescriptor = Readonly<{
  name: string;
  type: string;
  page?: number;
  tab?: string;
  options?: readonly FieldOption[] | readonly string[];
  optionSets?: Readonly<Record<string, readonly FieldOption[] | readonly string[]>>;
  config?: readonly string[];
  conditional?: string;
  nestedFields?: readonly FieldDescriptor[];
}>;

export type PageDescriptor = Readonly<{
  page: number;
  title: string;
  description?: string;
  conditional?: string;
}>;

export type CompatibilityExample = Readonly<{
  id: string;
  group: CompatibilityExampleGroup;
  sourceFile: string;
  publicBehavior: readonly string[];
  schemaFields: Readonly<Record<string, readonly SchemaRule[]>>;
  fields: readonly FieldDescriptor[];
  pages?: readonly PageDescriptor[];
  tabs?: readonly string[];
  optionsUsed: readonly string[];
  returnHelpersUsed: readonly string[];
  assertionsRequired: readonly string[];
}>;

export const compatibilityExamplesManifest = {
  contact: contactCompatibilityExample,
  registration: registrationCompatibilityExample,
  checkout: checkoutCompatibilityExample,
  jobApplication: jobApplicationCompatibilityExample,
  survey: surveyCompatibilityExample,
  conditionalPages: conditionalPagesCompatibilityExample,
  persistence: persistenceCompatibilityExample,
  tabbed: tabbedCompatibilityExample,
  arrayFields: arrayFieldsCompatibilityExample,
  nestedConditionalObjectArray: nestedConditionalObjectArrayCompatibilityExample,
  vacationFlow: vacationFlowCompatibilityExample,
  rentalCarFlow: rentalCarFlowCompatibilityExample,
  analyticsTracking: analyticsTrackingCompatibilityExample,
  advancedFieldTypes: advancedFieldTypesCompatibilityExample,
} satisfies Record<string, CompatibilityExample>;

export const compatibilityExampleIds = Object.keys(compatibilityExamplesManifest).sort();
