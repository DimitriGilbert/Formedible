# @formedible/formedible

Core Formedible source lives here. This package owns the `useFormedible` hook, field renderers, layout components, validation helpers, persistence, analytics, and TypeScript contracts copied into user apps by the `formedible-core` registry item.

This package is private. The public install path is the registry item built from `packages/formedible/registry.json`.

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
```

## What gets installed

`packages/formedible/registry.json` defines one item: `formedible-core`. It copies source files to `@ui/formedible/...` targets and declares npm dependencies `@tanstack/react-form`, `clsx`, `lucide-react`, and `tailwind-merge`.

Main copied areas:

- `src/hooks/use-formedible.tsx` -> `@ui/formedible/hooks/use-formedible.tsx`
- `src/hooks/use-multi-page.ts` -> `@ui/formedible/hooks/use-multi-page.ts`
- `src/hooks/use-form-tabs.ts` -> `@ui/formedible/hooks/use-form-tabs.ts`
- `src/hooks/use-form-persistence.ts` -> `@ui/formedible/hooks/use-form-persistence.ts`
- `src/hooks/use-form-analytics.ts` -> `@ui/formedible/hooks/use-form-analytics.ts`
- `src/components/formedible/**` -> `@ui/formedible/**`
- `src/lib/formedible/**` -> `@ui/formedible/lib/**`

Generated public files live in `packages/formedible/public/r/registry.json` and `packages/formedible/public/r/formedible-core.json`.

## Public API names

There is no package root `src/index.ts` in this package. Users import the copied files directly. The stable names come from source exports:

| Name | Import after registry install | Source |
| --- | --- | --- |
| `useFormedible` | `@/components/ui/formedible/hooks/use-formedible` | `src/hooks/use-formedible.tsx` |
| `Form` / `FormProps` | `@/components/ui/formedible/form` | `src/components/formedible/form.tsx` |
| `FieldRenderer` | `@/components/ui/formedible/field-renderer` | `src/components/formedible/field-renderer.tsx` |
| `getFieldComponent` | `@/components/ui/formedible/fields/field-registry` | `src/components/formedible/fields/field-registry.tsx` |
| `useMultiPage`, `getVisiblePageNumbers`, `conditionMatches` | `@/components/ui/formedible/hooks/use-multi-page` | `src/hooks/use-multi-page.ts` |
| `useFormTabs`, `normalizeTabs` | `@/components/ui/formedible/hooks/use-form-tabs` | `src/hooks/use-form-tabs.ts` |
| `useFormPersistence`, `savePersistedFormPayload`, `loadPersistedFormPayload`, `clearPersistedFormPayload`, helpers | `@/components/ui/formedible/hooks/use-form-persistence` | `src/hooks/use-form-persistence.ts` |
| `useFormAnalytics`, `createFormAnalyticsTracker` | `@/components/ui/formedible/hooks/use-form-analytics` | `src/hooks/use-form-analytics.ts` |
| `UseFormedibleOptions`, `FormedibleFieldConfig`, `FormedibleFieldType`, `FormedibleFormValues`, `FormedibleFieldRenderProps` | `@/components/ui/formedible/lib/types` | `src/lib/formedible/types.ts` |

## Basic use

```tsx
import { z } from 'zod';

import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

const schema = z.object({
  email: z.string().email(),
  subscribe: z.boolean(),
});

type Values = z.infer<typeof schema>;

async function submitNewsletterSignup(value: Values) {
  await fetch('/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
}

export function NewsletterForm() {
  const newsletter = useFormedible<Values>({
    schema,
    fields: [
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'subscribe', type: 'checkbox', label: 'Subscribe to updates' },
    ],
    formOptions: {
      defaultValues: { email: '', subscribe: false },
      onSubmit: async ({ value }) => {
        await submitNewsletterSignup(value);
      },
    },
  });

  return <newsletter.Form className="space-y-4" />;
}
```

`useFormedible<TFormValues>()` takes `UseFormedibleOptions<TFormValues>`. `fields` and `formOptions.defaultValues` are required by the type. Optional features include `schema`, `crossFieldValidation`, `asyncValidation`, `pages`, `tabs`, `progress`, `persistence`, `analytics`, `defaultComponents`, `globalWrapper`, form labels, native form event hooks, `autoSubmitOnChange`, and disabled/loading state (`src/lib/formedible/types.ts:448`).

## Field types

`FormedibleFieldType` is defined in `src/lib/formedible/types.ts:6`. The renderer registry maps normalized types in `src/components/formedible/fields/field-registry.tsx:30`.

Supported inputs include:

`text`, `email`, `password`, `url`, `tel`, `textarea`, `number`, `select`, `radio`, `checkbox`, `switch`, `date`, `slider`, `rating`, `phone`, `file`, `array`, `object`, `multiSelect`, `combobox`, `autocomplete`, `multiCombobox`, `color`, `duration`, `location`, `masked`.

Compatibility aliases are typed too: `multiselect`, `multicombobox`, `colorPicker`, and `maskedInput`.

```ts
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type ProfileValues = {
  fullName: string;
  skills: string[];
  notifications: boolean;
};

export const profileFields = [
  { name: 'fullName', type: 'text', label: 'Full name' },
  {
    name: 'skills',
    type: 'multiSelect',
    label: 'Skills',
    options: ['React', 'TypeScript', 'Design systems'],
    multiSelectConfig: { searchable: true, creatable: true },
  },
  { name: 'notifications', type: 'switch', label: 'Enable notifications' },
] satisfies readonly FormedibleFieldConfig<ProfileValues>[];
```

## Pages, tabs, persistence, and analytics

```tsx
const fieldChanges: Array<{ fieldName: string; value: unknown; timestamp: number }> = [];

const onboarding = useFormedible({
  fields: [
    { name: 'name', type: 'text', label: 'Name', page: 1, tab: 'profile' },
    { name: 'company', type: 'text', label: 'Company', page: 2, conditional: 'name' },
  ],
  pages: [
    { page: 1, title: 'Profile' },
    { page: 2, title: 'Company', conditional: 'name' },
  ],
  tabs: [{ id: 'profile', label: 'Profile' }],
  progress: { showSteps: true, showPercentage: true },
  persistence: { key: 'onboarding-draft', storage: 'localStorage', restoreOnMount: true },
  analytics: {
    onFieldChange: (fieldName, value, timestamp) => {
      fieldChanges.push({ fieldName, value, timestamp });
    },
  },
  formOptions: {
    defaultValues: { name: '', company: '' },
  },
});
```

Source links:

- Pages: `src/hooks/use-multi-page.ts`
- Tabs: `src/hooks/use-form-tabs.ts`
- Persistence: `src/hooks/use-form-persistence.ts`
- Analytics: `src/hooks/use-form-analytics.ts`

## Package scripts

Exact scripts from `packages/formedible/package.json`:

```bash
pnpm --filter @formedible/formedible run check-types
pnpm --filter @formedible/formedible run build
pnpm --filter @formedible/formedible run build:registry
```

From the repo root, the common maintainer commands are:

```bash
pnpm run build:pkg
pnpm run sync-components
pnpm run check-types
```

## Source-backed docs and tests

- Docs: `/docs/getting-started`, `/docs/api`, `/docs/fields`, `/docs/validation`, `/docs/persistence`, `/docs/analytics`, `/docs/examples`.
- Live examples: `apps/web/src/components/docs/examples/index.tsx`.
- Field/rendering tests: `tests/formedible/basic-fields.test.tsx`, `tests/formedible/advanced-fields.test.tsx`, `tests/formedible/nested-fields.test.tsx`, `tests/formedible/section-rendering.test.tsx`.
- Validation tests: `tests/formedible/validation/validation-pipeline.test.tsx`.
- Type surface tests: `tests/formedible/tsconfig.types.json` and root `pnpm run test:formedible:types`.
