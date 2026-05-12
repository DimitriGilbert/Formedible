export type DocsCodeExampleId =
  | 'shadcn-install-surface'
  | 'typed-hook-usage'
  | 'builder-imports'
  | 'ai-builder-imports'
  | 'field-registry-extension';

export type DocsCodeExample = {
  readonly id: DocsCodeExampleId;
  readonly title: string;
  readonly description: string;
  readonly language: 'tsx' | 'ts' | 'bash';
  readonly code: string;
};

export const docsCodeExamples: Record<DocsCodeExampleId, DocsCodeExample> = {
  'shadcn-install-surface': {
    id: 'shadcn-install-surface',
    title: 'Clean-room app surface',
    description: 'Use the generated hook and copied components inside your app. No package runtime import is required.',
    language: 'tsx',
    code: `import { useFormedible } from '@/hooks/use-formedible';

type LeadFormValues = {
  email: string;
  companySize: '1-10' | '11-50' | '51-200' | '200+';
  interests: string[];
};

export function LeadCaptureForm() {
  const { Form } = useFormedible<LeadFormValues>({
    fields: [
      { name: 'email', type: 'email', label: 'Work email', required: true },
      {
        name: 'companySize',
        type: 'select',
        label: 'Company size',
        options: ['1-10', '11-50', '51-200', '200+'],
        required: true,
      },
      {
        name: 'interests',
        type: 'multiSelect',
        label: 'What should the form handle?',
        options: ['validation', 'multi-step', 'builder', 'AI generation'],
      },
    ],
    formOptions: {
      defaultValues: { email: '', companySize: '1-10', interests: [] },
      onSubmit: async ({ value }) => {
        await saveLead(value);
      },
    },
    submitLabel: 'Request a walkthrough',
  });

  return <Form aria-label="Lead capture" />;
}`,
  },
  'typed-hook-usage': {
    id: 'typed-hook-usage',
    title: 'Typed fields over TanStack Form',
    description: 'Formedible keeps TanStack Form close to the surface while rendering shadcn-compatible field UI.',
    language: 'tsx',
    code: `import { z } from 'zod';

import { useFormedible } from '@/hooks/use-formedible';

const onboardingSchema = z.object({
  name: z.string().min(2),
  plan: z.enum(['starter', 'team', 'enterprise']),
  needsMigration: z.boolean(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const { Form } = useFormedible<OnboardingValues>({
    fields: [
      { name: 'name', type: 'text', label: 'Workspace name', required: true },
      { name: 'plan', type: 'radio', label: 'Plan', options: ['starter', 'team', 'enterprise'] },
      { name: 'needsMigration', type: 'switch', label: 'Import an existing form system?' },
    ],
    formOptions: {
      defaultValues: { name: '', plan: 'team', needsMigration: false },
      validators: { onSubmit: onboardingSchema },
      onSubmit: async ({ value }) => {
        await createWorkspace(value);
      },
    },
  });

  return <Form />;
}`,
  },
  'builder-imports': {
    id: 'builder-imports',
    title: 'Builder shell path',
    description: 'The builder is an app component path, so consumers can compose it beside their own navigation and persistence layer.',
    language: 'tsx',
    code: `import { FormBuilder } from '@/components/formedible/builder/form-builder';

export function BuilderWorkspace() {
  return (
    <section aria-labelledby="builder-title" className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Builder</p>
        <h1 id="builder-title" className="text-3xl font-semibold tracking-tight">
          Compose fields, preview output, copy configuration.
        </h1>
      </div>
      <FormBuilder />
    </section>
  );
}`,
  },
  'ai-builder-imports': {
    id: 'ai-builder-imports',
    title: 'AI Builder shell path',
    description: 'AI-assisted generation stays reviewable because it produces the same field model used by hand-written forms.',
    language: 'tsx',
    code: `import { AIBuilder } from '@/components/formedible/ai/ai-builder';
import { ProviderSelection } from '@/components/formedible/ai/provider-selection';

export function AiBuilderWorkspace() {
  return (
    <main className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <ProviderSelection />
      <AIBuilder />
    </main>
  );
}`,
  },
  'field-registry-extension': {
    id: 'field-registry-extension',
    title: 'Extend the copied registry',
    description: 'Custom fields live in the consumer codebase and plug into the copied registry instead of patching a package.',
    language: 'tsx',
    code: `import { fieldRegistry } from '@/components/formedible/fields/field-registry';
import { CurrencyField } from '@/components/forms/currency-field';

export function registerCommerceFields() {
  fieldRegistry.register('currency', CurrencyField);
}`,
  },
};

export const featuredCodeExampleIds = [
  'shadcn-install-surface',
  'typed-hook-usage',
  'builder-imports',
  'ai-builder-imports',
  'field-registry-extension',
] satisfies readonly DocsCodeExampleId[];
