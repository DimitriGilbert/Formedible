import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/getting-started');
const githubRoot = 'https://github.com/DimitriGilbert/Formedible/blob/main';

const installSnippet = `pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json`;

const firstFormSnippet = `import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

type ContactValues = {
  name: string;
  email: string;
  message: string;
};

async function saveContact(values: ContactValues): Promise<void> {
  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(values),
  });
}

export function ContactForm() {
  const contactForm = useFormedible<ContactValues>({
    fields: [
      { name: 'name', type: 'text', label: 'Name' },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'message', type: 'textarea', label: 'Message' },
    ],
    formOptions: {
      defaultValues: { name: '', email: '', message: '' },
      onSubmit: async ({ value }) => {
        await saveContact(value);
      },
    },
  });

  return <contactForm.Form className="space-y-4" />;
}`;

const validationSnippet = `import { z } from 'zod';

import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactValues = z.infer<typeof contactSchema>;

async function saveContact(values: ContactValues): Promise<void> {
  await fetch('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(values),
  });
}

export function ContactForm() {
  const contactForm = useFormedible({
    schema: contactSchema,
    fields: [
      { name: 'name', type: 'text', label: 'Full name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'message', type: 'textarea', label: 'Message' },
    ],
    formOptions: {
      defaultValues: { name: '', email: '', message: '' },
      onSubmit: async ({ value }) => {
        await saveContact(value);
      },
    },
  });

  return <contactForm.Form className="space-y-4" />;
}`;

const customFieldSnippet = `import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';
import type { FormedibleFieldRenderProps } from '@/components/ui/formedible/lib/types';

function CompactTextField({ fieldConfig, field }: FormedibleFieldRenderProps) {
  const value = typeof field.value === 'string' ? field.value : '';

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{fieldConfig.label}</span>
      <input
        id={field.id}
        name={field.name}
        value={value}
        placeholder={fieldConfig.placeholder}
        className="h-9 rounded-md border px-3"
        aria-invalid={field.error ? true : undefined}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
      />
      {field.error ? <span className="text-xs text-destructive">{field.error}</span> : null}
    </label>
  );
}

export function ProfileForm() {
  const profileForm = useFormedible({
    fields: [
      { name: 'displayName', type: 'text', label: 'Display name', component: CompactTextField },
    ],
    formOptions: { defaultValues: { displayName: '' } },
  });

  return <profileForm.Form className="space-y-4" />;
}`;

export const Route = createFileRoute('/docs/getting-started')({
  head: () => routeHead,
  component: GettingStartedRoute,
});

function GettingStartedRoute() {
  return (
    <DocsGuidePage
      eyebrow="Start here"
      title="Install Formedible and render your first form."
      description="Run one shadcn command, add a small useFormedible config, and submit real values. You can tune the copied fields after the first form works."
      codeExampleIds={['shadcn-install-surface', 'typed-hook-usage']}
      related={[
        { title: 'Fields', description: 'Pick field types and options for the next input.', href: '/docs/fields' },
        { title: 'Validation', description: 'Add schema, field, async, and cross-field validation.', href: '/docs/validation' },
        { title: 'API', description: 'Read the full UseFormedibleOptions shape.', href: '/docs/api' },
        { title: 'Examples', description: 'Open live forms for contact, registration, arrays, persistence, and analytics.', href: '/docs/examples' },
      ]}
      sections={[
        {
          title: 'Install the component',
          body: 'Run this from the app that owns your shadcn setup. It copies the hook, field components, validation helpers, and types into your UI directory.',
          bullets: [
            'Run the command in your web app package.',
            'Import the copied hook from your local UI path.',
            'Commit the copied files so your team can edit them.',
          ],
          snippet: {
            title: 'Install formedible-core',
            language: 'bash',
            code: installSnippet,
          },
          references: [
            { title: 'Registry manifest', description: 'Declares formedible-core, dependencies, shadcn components, and copied files.', href: `${githubRoot}/packages/formedible/registry.json` },
            { title: 'Public registry item', description: 'The JSON used by the install command.', href: `${githubRoot}/packages/formedible/public/r/formedible-core.json` },
          ],
        },
        {
          title: 'Create a form',
          body: 'Start with fields, default values, and an onSubmit handler. The hook returns a Form component you can render anywhere in your route or component.',
          bullets: [
            'Keep field names aligned with your value keys.',
            'Set every default value up front.',
            'Call your real submit function inside onSubmit.',
          ],
          snippet: {
            title: 'First working form',
            language: 'tsx',
            code: firstFormSnippet,
          },
          references: [
            { title: 'useFormedible runtime', description: 'Wires defaultValues, onSubmit, validators, fields, and the returned Form component.', href: `${githubRoot}/packages/formedible/src/hooks/use-formedible.tsx` },
            { title: 'Consumer smoke route', description: 'Imports useFormedible from the installed UI package and renders a generated form.', href: `${githubRoot}/tests/consumer-smoke/utils/generated-form-route.ts` },
          ],
        },
        {
          title: 'Add schema validation',
          body: 'Put your Zod schema on the top-level schema option. Formedible sends it through the validation pipeline before submit.',
          bullets: [
            'Keep schema keys and field names the same.',
            'Use schema at the top level, not formOptions.validators.',
            'Keep built-in required and email checks on the field config when useful.',
          ],
          snippet: {
            title: 'Top-level schema',
            language: 'tsx',
            code: validationSnippet,
          },
          references: [
            { title: 'Validation pipeline', description: 'Builds form and field validators from schema, field validation, async validation, and cross-field rules.', href: `${githubRoot}/packages/formedible/src/lib/formedible/validation.ts` },
            { title: 'Contact example schema', description: 'Uses z.object with the top-level schema option.', href: `${githubRoot}/apps/web/src/components/docs/examples/contact-form.tsx` },
          ],
        },
        {
          title: 'Customize the copied fields',
          body: 'Once the form submits, change one field with component or edit the copied field files for app-wide behavior. The registry install is source you own.',
          bullets: [
            'Use component for one field override.',
            'Use defaultComponents for a type-wide override.',
            'Edit the copied field registry when you want a permanent local default.',
          ],
          snippet: {
            title: 'One field override',
            language: 'tsx',
            code: customFieldSnippet,
          },
          references: [
            { title: 'Field renderer', description: 'Chooses field component, default component, then registry component.', href: `${githubRoot}/packages/formedible/src/components/formedible/field-renderer.tsx` },
            { title: 'Field types', description: 'Defines component, wrapper, field config, and render prop types.', href: `${githubRoot}/packages/formedible/src/lib/formedible/types.ts` },
            { title: 'Code examples', description: 'Contains the registry extension example used by the docs rail.', href: `${githubRoot}/apps/web/src/features/docs/code-examples.ts` },
          ],
        },
        {
          title: 'Where to go next',
          body: 'Use the focused docs when you add a new field, validation rule, or runtime option. Open a live example when you want to copy a known-working shape.',
          bullets: [
            'Fields: choose text, select, arrays, objects, and custom field options.',
            'Validation: add schema, field, async, or cross-field rules.',
            'API: check persistence, analytics, pages, tabs, labels, and wrappers.',
          ],
          references: [
            { title: 'Fields docs', description: 'Field types, options, arrays, objects, and custom fields.', href: '/docs/fields' },
            { title: 'Validation docs', description: 'Schema, field, async, and cross-field validation.', href: '/docs/validation' },
            { title: 'API docs', description: 'UseFormedibleOptions and field config reference.', href: '/docs/api' },
            { title: 'Contact example', description: 'Small schema-backed contact form.', href: '/docs/examples?example=contact' },
            { title: 'Registration example', description: 'Multi-page registration form.', href: '/docs/examples?example=registration' },
            { title: 'Arrays example', description: 'Nested array and object fields.', href: '/docs/examples?example=arrays' },
            { title: 'Persistence example', description: 'Restore in-progress values.', href: '/docs/examples?example=persistence' },
            { title: 'Analytics example', description: 'Track field and form events.', href: '/docs/examples?example=analytics' },
          ],
        },
      ]}
    />
  );
}
