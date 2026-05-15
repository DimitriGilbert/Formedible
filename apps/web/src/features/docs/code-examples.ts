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
    code: `import { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';

type LeadFormValues = {
  email: string;
  companySize: '1-10' | '11-50' | '51-200' | '200+';
  interests: string[];
};

const savedLeadRequests: LeadFormValues[] = [];

function saveLead(values: LeadFormValues) {
  savedLeadRequests.push(values);
}

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
      onSubmit: ({ value }) => {
        saveLead(value);
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

import { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';

const onboardingSchema = z.object({
  name: z.string().min(2),
  plan: z.enum(['starter', 'team', 'enterprise']),
  needsMigration: z.boolean(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

type WorkspaceRecord = OnboardingValues & {
  slug: string;
};

const workspaceRecords: WorkspaceRecord[] = [];

function createWorkspace(values: OnboardingValues): WorkspaceRecord {
  const workspace = {
    ...values,
    slug: values.name.trim().toLowerCase().replace(/\\s+/g, '-'),
  };

  workspaceRecords.push(workspace);
  return workspace;
}

export function OnboardingForm() {
  const { Form } = useFormedible<OnboardingValues>({
    fields: [
      { name: 'name', type: 'text', label: 'Workspace name', required: true },
      { name: 'plan', type: 'radio', label: 'Plan', options: ['starter', 'team', 'enterprise'] },
      { name: 'needsMigration', type: 'switch', label: 'Import an existing form system?' },
    ],
    schema: onboardingSchema,
    formOptions: {
      defaultValues: { name: '', plan: 'team', needsMigration: false },
      onSubmit: ({ value }) => {
        createWorkspace(value);
      },
    },
  });

  return <Form />;
}`,
  },
  'builder-imports': {
    id: 'builder-imports',
    title: 'Builder shell path',
    description: 'The builder installs into the shadcn UI package, so consumers can compose it beside their own navigation and persistence layer.',
    language: 'tsx',
    code: `import { FormBuilder } from '@formedible/ui/components/formedible/builder/form-builder';

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
    code: `import { useState } from 'react';

import { AIBuilder } from '@formedible/ui/components/formedible/ai/ai-builder';
import { createDefaultProviderSecrets, createDefaultProviderSettings, ProviderSelection } from '@formedible/ui/components/formedible/ai/provider-selection';

export function AiBuilderWorkspace() {
  const [providerSettings, setProviderSettings] = useState(() => createDefaultProviderSettings('openrouter'));
  const [providerSecrets, setProviderSecrets] = useState(() => createDefaultProviderSecrets('openrouter'));

  return (
    <main className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <ProviderSelection settings={providerSettings} secrets={providerSecrets} onChange={(settings, secrets) => {
        setProviderSettings(settings);
        setProviderSecrets(secrets);
      }} />
      <AIBuilder
        providerSettings={providerSettings}
        providerSecrets={providerSecrets}
        onProviderSettingsChange={setProviderSettings}
        onProviderSecretsChange={setProviderSecrets}
      />
    </main>
  );
}`,
  },
  'field-registry-extension': {
    id: 'field-registry-extension',
    title: 'Customize the copied registry',
    description: 'The registry is copied into your app, so customize supported field types by editing the local mapping directly.',
    language: 'tsx',
    code: `import type { ReactNode } from 'react';

import { NumberField } from '@formedible/ui/components/formedible/fields/number-field';
import { TextField } from '@formedible/ui/components/formedible/fields/text-field';
import type { FormedibleFieldRenderProps, FormedibleFormValues, NormalizedFieldType } from '@formedible/ui/components/formedible/lib/types';

type FieldComponent = <TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) => ReactNode;

const fieldRegistry: Partial<Record<NormalizedFieldType, FieldComponent>> = {
  number: NumberField,
  text: TextField,
};

export function getFieldComponent<TFormValues extends FormedibleFormValues>(
  type: NormalizedFieldType,
): (props: FormedibleFieldRenderProps<TFormValues>) => ReactNode {
  return fieldRegistry[type] ?? TextField;
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
