import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage, type DocsGuideLink, type DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/validation');

const githubRoot = 'https://github.com/DimitriGilbert/Formedible/blob/main';

const sourceReferences = {
  validationRuntime: {
    title: 'Validation runtime',
    description: 'buildFieldValidators, buildFormValidators, built-ins, async, inline, and cross-field mapping.',
    href: `${githubRoot}/packages/formedible/src/lib/formedible/validation.ts`,
  },
  useFormedibleHook: {
    title: 'useFormedible hook',
    description: 'Passes schema, crossFieldValidation, asyncValidation, and field config into TanStack Form.',
    href: `${githubRoot}/packages/formedible/src/hooks/use-formedible.tsx`,
  },
  validationTypes: {
    title: 'Validation types',
    description: 'FormedibleValidationResult, validation, asyncValidation, crossFieldValidation, and inlineValidation types.',
    href: `${githubRoot}/packages/formedible/src/lib/formedible/types.ts`,
  },
  validationPipelineTest: {
    title: 'Validation pipeline tests',
    description: 'Covers built-ins, field rules, schema mapping, async debounce, inline fallback, and cross-field listeners.',
    href: `${githubRoot}/tests/formedible/validation/validation-pipeline.test.tsx`,
  },
  basicFieldsTest: {
    title: 'Basic field tests',
    description: 'Checks rendered invalid state, maxLength attributes, and number min/max precedence.',
    href: `${githubRoot}/tests/formedible/basic-fields.test.tsx`,
  },
  surveyExample: {
    title: 'Survey example source',
    description: 'Live schema example with rating limits, enum answers, arrays, and dependent fields.',
    href: `${githubRoot}/apps/web/src/components/docs/examples/survey-form.tsx`,
  },
  jobExample: {
    title: 'Job application example source',
    description: 'Live schema example with email, required applicant fields, skills, dates, and salary min.',
    href: `${githubRoot}/apps/web/src/components/docs/examples/job-application-form.tsx`,
  },
  typedHookUsage: {
    title: 'typed-hook-usage code card',
    description: 'Docs code example showing top-level schema beside fields and formOptions.',
    href: `${githubRoot}/apps/web/src/features/docs/code-examples.ts`,
  },
} satisfies Record<string, DocsGuideLink>;

const relatedLinks = [
  {
    title: 'API',
    description: 'Hook options for schema, asyncValidation, crossFieldValidation, and field config.',
    href: '/docs/api',
  },
  {
    title: 'Fields',
    description: 'Field config keys for required, min, max, maxLength, validation, and inlineValidation.',
    href: '/docs/fields',
  },
  {
    title: 'Getting Started',
    description: 'Start with typed values and matching field names before adding validation rules.',
    href: '/docs/getting-started',
  },
  {
    title: 'Dynamic Survey Form',
    description: 'Open the live survey schema example.',
    href: '/docs/examples?example=survey',
  },
  {
    title: 'Job Application Form',
    description: 'Open the live job application schema example.',
    href: '/docs/examples?example=job',
  },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Validation overview',
    body: 'Field validators run on change, blur, and submit. Each pass checks built-ins, field.validation, schema, then cross-field rules; async checks run on change.',
    bullets: [
      'The hook calls buildFormValidators(config.schema, config.crossFieldValidation) and buildFieldValidators(field, config.schema, config.crossFieldValidation, config.asyncValidation).',
      'A returned string becomes the field message. null or undefined passes. false falls back to Invalid value, except cross-field rules fall back to Invalid field combination.',
      'The pipeline tests build validators directly, so these examples follow the tested runtime.',
    ],
    snippet: {
      title: 'Runtime order in buildFieldValidators',
      language: 'ts',
      code: `const validators = {
  onChange: ({ value, fieldApi }) =>
    validateBuiltInConstraints(field, value) ??
    runFieldValidation(field.validation, fieldName, value, fieldApi.form.state.values) ??
    schemaFieldMessage(fieldName, standardSchema, fieldApi.form) ??
    crossFieldMessage(fieldName, crossFieldValidation, fieldApi.form.state.values),
  onChangeAsync: async ({ value, fieldApi, signal }) => {
    // asyncValidation[fieldName], then field.inlineValidation, then async schema parsing
  },
};`,
    },
    references: [sourceReferences.validationRuntime, sourceReferences.useFormedibleHook, sourceReferences.validationPipelineTest],
  },
  {
    title: 'Built-in constraints',
    body: 'Put simple field-local checks on the field config. required handles empty values first; email, maxLength, min, and max run after a value exists.',
    bullets: [
      'required returns “{label} is required” when the value is empty.',
      'type: email returns “Please enter a valid email address” when the value is a non-empty invalid email string.',
      'maxLength checks strings. min and max check numbers. The job example uses min: 0 for salaryExpectation.',
    ],
    snippet: {
      title: 'Field config with built-in constraints',
      language: 'tsx',
      code: `type ApplicantValues = {
  email: string;
  bio: string;
  salaryExpectation: number;
};

const fields = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true,
  },
  {
    name: 'bio',
    type: 'textarea',
    label: 'Short bio',
    maxLength: 280,
  },
  {
    name: 'salaryExpectation',
    type: 'number',
    label: 'Salary expectation',
    min: 0,
    max: 300000,
  },
] satisfies readonly FormedibleFieldConfig<ApplicantValues>[];`,
    },
    references: [sourceReferences.validationRuntime, sourceReferences.validationPipelineTest, sourceReferences.basicFieldsTest, sourceReferences.jobExample],
  },
  {
    title: 'Form-level schema',
    body: 'Put the Standard Schema object on the top-level schema option. Keep formOptions for defaultValues and submit handlers.',
    bullets: [
      'buildFormValidators maps schema issues into TanStack Form field errors on change, blur, and submit.',
      'buildFieldValidators also asks the same schema for the current field message, so a field can show its schema error during normal field validation.',
      'The survey, job application, and typed-hook-usage examples all place schema beside fields.',
    ],
    snippet: {
      title: 'Top-level Zod schema',
      language: 'tsx',
      code: `import { z } from 'zod';

const jobApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  skills: z.array(z.string()).min(1, 'Pick at least one skill'),
  salaryExpectation: z.number().min(0, 'Salary must be zero or higher'),
});

type JobApplicationValues = z.infer<typeof jobApplicationSchema>;

const { Form } = useFormedible<JobApplicationValues>({
  schema: jobApplicationSchema,
  fields,
  formOptions: {
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      skills: [],
      salaryExpectation: 0,
    },
    onSubmit: ({ value }) => saveApplication(value),
  },
});`,
    },
    references: [sourceReferences.validationRuntime, sourceReferences.useFormedibleHook, sourceReferences.typedHookUsage, sourceReferences.surveyExample, sourceReferences.jobExample],
  },
  {
    title: 'Field-level validation',
    body: 'Put one-field sync rules on field.validation. Return a string, null, undefined, or false.',
    bullets: [
      'Function validation receives value, values, and a context object containing value, values, and fieldName.',
      'A direct field schema is also supported, for example z.string().min(3, “Username must be at least 3 characters”).',
      'Return a specific string when the UI should show specific copy. Return false only when the fallback or object message is good enough.',
    ],
    snippet: {
      title: 'validation on a field',
      language: 'tsx',
      code: `type AccountValues = {
  username: string;
  email: string;
};

const fields = [
  {
    name: 'username',
    type: 'text',
    label: 'Username',
    validation: (value, values, context) => {
      const username = String(value ?? '').trim().toLowerCase();

      if (username === 'admin') {
        return 'Username is reserved';
      }

      if (username === values.email.split('@')[0]) {
        return null;
      }

      return context.fieldName === 'username' ? null : false;
    },
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
  },
] satisfies readonly FormedibleFieldConfig<AccountValues>[];`,
    },
    references: [sourceReferences.validationTypes, sourceReferences.validationRuntime, sourceReferences.validationPipelineTest],
  },
  {
    title: 'Async validation',
    body: 'Put server-backed or delayed checks in asyncValidation, keyed by field name. The validator receives value, values, and AbortSignal.',
    bullets: [
      'Return a string for a server message, null or undefined to pass, or false to show Invalid value.',
      'Use signal in fetch so newer keystrokes can cancel older requests cleanly.',
      'loadingMessage is currently typed config metadata. The validator builder reads validator and debounceMs; no built-in renderer or runtime currently consumes loadingMessage.',
    ],
    snippet: {
      title: 'asyncValidation keyed by field name',
      language: 'tsx',
      code: `type SignupValues = {
  username: string;
  email: string;
};

const { Form } = useFormedible<SignupValues>({
  fields: [
    { name: 'username', type: 'text', label: 'Username', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
  ],
  asyncValidation: {
    username: {
      debounceMs: 250,
      loadingMessage: 'Checking username…',
      validator: async (value, values, signal) => {
        const username = String(value ?? '').trim();

        if (username.length < 3 || values.email.endsWith('@example.test')) {
          return null;
        }

        const response = await fetch('/api/usernames/' + encodeURIComponent(username), { signal });
        const result = (await response.json()) as { readonly available: boolean };

        return result.available ? null : false;
      },
    },
  },
  formOptions: {
    defaultValues: { username: '', email: '' },
  },
});`,
    },
    references: [sourceReferences.validationTypes, sourceReferences.validationRuntime, sourceReferences.validationPipelineTest],
  },
  {
    title: 'Cross-field validation',
    body: 'Put multi-field rules in crossFieldValidation. List every field the rule touches so sibling changes trigger validation.',
    bullets: [
      'The runtime derives onChangeListenTo from the fields list, so confirmPassword revalidates when password changes.',
      'Return a string for the clearest field error. Returning false maps to Invalid field combination.',
      'Keep these rules top-level so buildFormValidators and buildFieldValidators can both see them.',
    ],
    snippet: {
      title: 'crossFieldValidation with watched fields',
      language: 'tsx',
      code: `type PasswordValues = {
  password: string;
  confirmPassword: string;
};

const { Form } = useFormedible<PasswordValues>({
  fields: [
    { name: 'password', type: 'password', label: 'Password', required: true },
    { name: 'confirmPassword', type: 'password', label: 'Confirm password', required: true },
  ],
  crossFieldValidation: [
    {
      fields: ['password', 'confirmPassword'],
      validator: (values) => {
        if (values.password.length === 0 || values.confirmPassword.length === 0) {
          return null;
        }

        return values.password === values.confirmPassword ? null : 'Passwords do not match';
      },
    },
  ],
  formOptions: {
    defaultValues: { password: '', confirmPassword: '' },
  },
});`,
    },
    references: [sourceReferences.validationTypes, sourceReferences.validationRuntime, sourceReferences.validationPipelineTest],
  },
  {
    title: 'Inline validation',
    body: 'Put field-owned async on-change rules in inlineValidation. It uses the same return contract as asyncValidation.',
    bullets: [
      'enabled must be true before the runtime builds the inline async validator.',
      'When asyncValidation for the same field exists, that rule runs first and its debounceMs wins.',
      'inlineValidation.validator receives value, current values, and AbortSignal. Return false for the Invalid value fallback.',
    ],
    snippet: {
      title: 'inlineValidation on a field',
      language: 'tsx',
      code: `type ProfileValues = {
  displayName: string;
};

const fields = [
  {
    name: 'displayName',
    type: 'text',
    label: 'Display name',
    inlineValidation: {
      enabled: true,
      debounceMs: 125,
      showSuccess: true,
      validator: async (value, values, signal) => {
        const displayName = String(value ?? '').trim();

        if (displayName === values.displayName && displayName.length >= 2) {
          return null;
        }

        const response = await fetch('/api/display-names/' + encodeURIComponent(displayName), { signal });
        const result = (await response.json()) as { readonly allowed: boolean };

        return result.allowed ? null : false;
      },
    },
  },
] satisfies readonly FormedibleFieldConfig<ProfileValues>[];`,
    },
    references: [sourceReferences.validationTypes, sourceReferences.validationRuntime, sourceReferences.validationPipelineTest],
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/validation')({
  head: () => routeHead,
  component: ValidationRoute,
});

function ValidationRoute() {
  return (
    <DocsGuidePage
      eyebrow="Validation"
      title="Validation"
      description="Pick where the rule belongs: field config, top-level schema, field.validation, asyncValidation, crossFieldValidation, or inlineValidation. Each section links to source or tests."
      codeExampleIds={['typed-hook-usage']}
      related={relatedLinks}
      sections={sections}
    />
  );
}
