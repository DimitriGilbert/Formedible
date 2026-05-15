import type { ComponentType } from 'react';

import { AdvancedFieldTypesFormExample, advancedFieldTypesFormCode } from '@/components/docs/examples/advanced-field-types-form';
import { AnalyticsTrackingFormExample, analyticsTrackingFormCode } from '@/components/docs/examples/analytics-tracking-form';
import { ArrayFieldsFormExample, arrayFieldsFormCode } from '@/components/docs/examples/array-fields-form';
import { CheckoutFormExample, checkoutFormCode } from '@/components/docs/examples/checkout-form';
import ConditionalObjectInArrayForm from '@/components/docs/examples/conditional-in-obj';
import { ConditionalPagesFormExample, conditionalPagesFormCode } from '@/components/docs/examples/conditional-pages-form';
import { ContactFormExample, contactFormCode } from '@/components/docs/examples/contact-form';
import { VacationCarRentalFormExample, vacationCarRentalFormCode } from '@/components/docs/examples/flow-form';
import { JobApplicationFormExample, jobApplicationFormCode } from '@/components/docs/examples/job-application-form';
import { PersistenceFormExample, persistenceFormCode } from '@/components/docs/examples/persistence-form';
import { RegistrationFormExample, registrationFormCode } from '@/components/docs/examples/registration-form';
import { RentalCarFlowCode, RentalCarFlowForm } from '@/components/docs/examples/rental-car-flow-form';
import { SurveyFormExample, surveyFormCode } from '@/components/docs/examples/survey-form';
import { TabbedFormExample, tabbedFormCode } from '@/components/docs/examples/tabbed-form';

export type MigratedDocsExampleCategory = 'Basic examples' | 'Advanced examples';

export type MigratedDocsExample = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: MigratedDocsExampleCategory;
  readonly Component: ComponentType;
  readonly code: string;
  readonly codeTitle: string;
  readonly codeDescription: string;
};

const conditionalObjectInArrayCode = `export default function MyForm() {
  const { Form } = useFormedible({
    schema: MySchema,
    fields: [
      {
        section: { title: "🛋️ Pièces du logement" },
        name: "roomDetails",
        type: "array",
        label: "Ajouter une pièce",
        arrayConfig: {
          itemType: "object",
          minItems: 1,
          maxItems: 20,
          sortable: true,
          objectConfig: {
            collapsible: true,
            layout: "grid",
            columns: 2,
            fields: [
              { name: "equipementRoom", type: "switch", label: "Équipement spécifique *" },
              {
                name: "equipementListRoom",
                type: "textarea",
                label: "Liste des équipements",
                conditional: (values) => values?.equipementRoom === true,
              },
            ],
          },
        },
      },
    ],
  });

  return <Form />;
}`;

export const migratedDocsExamples = [
  {
    id: 'contact',
    title: 'Contact Form',
    description: 'A contact form with combobox subject selection, creatable categories, validation, and an urgent flag.',
    category: 'Basic examples',
    Component: ContactFormExample,
    code: contactFormCode,
    codeTitle: 'Contact Form Implementation',
    codeDescription: 'Subject combobox, multi-combobox categories, validation, and toast submit handling.',
  },
  {
    id: 'registration',
    title: 'Multi-Step Registration',
    description: 'A multi-page registration form with progress tracking, dynamic page copy, and mixed field types.',
    category: 'Basic examples',
    Component: RegistrationFormExample,
    code: registrationFormCode,
    codeTitle: 'Multi-Step Registration Form',
    codeDescription: 'Personal info, contact details, and preferences across three pages.',
  },
  {
    id: 'survey',
    title: 'Dynamic Survey Form',
    description: 'A survey with conditional questions, rating input, multi-select features, and country-dependent options.',
    category: 'Basic examples',
    Component: SurveyFormExample,
    code: surveyFormCode,
    codeTitle: 'Dynamic Survey With Conditional Logic',
    codeDescription: 'Conditional fields, dynamic options, rating, and feature selection.',
  },
  {
    id: 'checkout',
    title: 'E-commerce Checkout',
    description: 'A checkout flow with shipping, conditional payment fields, and shipping choices across pages.',
    category: 'Basic examples',
    Component: CheckoutFormExample,
    code: checkoutFormCode,
    codeTitle: 'E-commerce Checkout Flow',
    codeDescription: 'Shipping address, payment method, conditional card details, and delivery options.',
  },
  {
    id: 'job',
    title: 'Job Application Form',
    description: 'A job application flow with searchable/creatable skills, availability, salary, and open-ended questions.',
    category: 'Basic examples',
    Component: JobApplicationFormExample,
    code: jobApplicationFormCode,
    codeTitle: 'Advanced Job Application Form',
    codeDescription: 'Multi-page application with skills, availability, salary, and written answers.',
  },
  {
    id: 'tabbed',
    title: 'Tabbed Form Layout',
    description: 'A settings-style form organized into personal, preferences, and settings tabs.',
    category: 'Basic examples',
    Component: TabbedFormExample,
    code: tabbedFormCode,
    codeTitle: 'Tabbed Form Implementation',
    codeDescription: 'Related fields grouped into navigable tabs.',
  },
  {
    id: 'flow',
    title: 'Vacation Car Rental Flow',
    description: 'An eight-step one-field-per-page flow with dynamic labels and personalized copy.',
    category: 'Advanced examples',
    Component: VacationCarRentalFormExample,
    code: vacationCarRentalFormCode,
    codeTitle: 'Vacation Car Rental Flow',
    codeDescription: 'Dynamic text across a compact flow form.',
  },
  {
    id: 'rental-flow',
    title: 'Rental Car Flow Form',
    description: 'A full rental car finder with dynamic text, conditional navigation, badges, and a submitted state.',
    category: 'Advanced examples',
    Component: RentalCarFlowForm,
    code: RentalCarFlowCode,
    codeTitle: 'Rental Car Flow Form',
    codeDescription: 'A 19-step personalized rental flow.',
  },
  {
    id: 'analytics',
    title: 'Analytics & Tracking Form',
    description: 'A form wired to start, field focus, blur, page change, completion, and abandon analytics callbacks.',
    category: 'Advanced examples',
    Component: AnalyticsTrackingFormExample,
    code: analyticsTrackingFormCode,
    codeTitle: 'Analytics & Tracking Implementation',
    codeDescription: 'Complete analytics callback wiring with memoized handlers.',
  },
  {
    id: 'persistence',
    title: 'Form Persistence & Auto-Save',
    description: 'A project inquiry form that autosaves to localStorage, restores progress, and excludes agreement fields.',
    category: 'Advanced examples',
    Component: PersistenceFormExample,
    code: persistenceFormCode,
    codeTitle: 'Form Persistence Implementation',
    codeDescription: 'Persistence, restoration, debounce, and selective field exclusion.',
  },
  {
    id: 'arrays',
    title: 'Dynamic Array Fields',
    description: 'Dynamic arrays with nested objects, scalar arrays, sortable team members, and emergency contacts.',
    category: 'Advanced examples',
    Component: ArrayFieldsFormExample,
    code: arrayFieldsFormCode,
    codeTitle: 'Array Fields Implementation',
    codeDescription: 'Nested array/object configuration with add, remove, and sortable behavior.',
  },
  {
    id: 'conditional-object-array',
    title: 'Conditional Object-In-Array Form',
    description: 'A copied real-estate room-details example with conditional nested fields inside array object items.',
    category: 'Advanced examples',
    Component: ConditionalObjectInArrayForm,
    code: conditionalObjectInArrayCode,
    codeTitle: 'Conditional Object-In-Array Implementation',
    codeDescription: 'Nested object array fields with per-item conditional equipment details.',
  },
  {
    id: 'conditional-pages',
    title: 'Conditional Pages',
    description: 'A flow where entire pages appear or disappear based on application type and premium options.',
    category: 'Advanced examples',
    Component: ConditionalPagesFormExample,
    code: conditionalPagesFormCode,
    codeTitle: 'Conditional Pages Implementation',
    codeDescription: 'Conditional page visibility with adaptive progress/navigation.',
  },
  {
    id: 'advanced-fields',
    title: 'Advanced Field Types',
    description: 'A showcase of advanced fields including ratings, phone, color, duration, location, file, and custom slider visualization.',
    category: 'Advanced examples',
    Component: AdvancedFieldTypesFormExample,
    code: advancedFieldTypesFormCode,
    codeTitle: 'Advanced Field Types Implementation',
    codeDescription: 'Advanced field types plus custom DPE/speedometer slider visualization components.',
  },
] satisfies readonly MigratedDocsExample[];
