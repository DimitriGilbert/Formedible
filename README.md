# Formedible

Source-owned React forms built on TanStack Form.

[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Form](https://img.shields.io/badge/TanStack%20Form-1.27-FF4154?logo=react&logoColor=white)](https://tanstack.com/form)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=0B1220)](https://react.dev/)

## What it does

Formedible is a source-owned React form library: install it into your app, keep the files in your repo, and edit the fields like the rest of your UI. It uses TanStack Form for state and validation while giving you rendered fields, layout, navigation, and submit handling out of the box. The core surface includes 22+ field types, multi-page flows, tabs, analytics, persistence, dynamic text, and typed configuration. The monorepo also ships a visual builder, AI-assisted form generation, and a parser that turns text or structured config into the same field model.

## Quick start

Install the core Formedible surface with shadcn:

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
```

Use the copied hook in your app:

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

type ContactValues = {
  email: string;
  topic: 'sales' | 'support';
};

export function ContactForm() {
  const { Form } = useFormedible<ContactValues>({
    fields: [
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'topic', type: 'radio', label: 'Topic', options: ['sales', 'support'] },
    ],
    formOptions: {
      defaultValues: { email: '', topic: 'sales' },
      onSubmit: ({ value }) => {
        void value;
      },
    },
    submitLabel: 'Send',
  });

  return <Form aria-label="Contact" />;
}
```

## Features

- 22+ field types, including text, email, number, select, checkbox, switch, radio, date, slider, rating, combobox, multi-select, file upload, arrays, and objects.
- TanStack Form state with typed values, schema validation, field rules, async validation, and cross-field checks.
- Multi-page forms with progress, navigation, page callbacks, and validation state.
- Tabbed forms with visible tab filtering and per-tab field grouping.
- Draft persistence through localStorage or sessionStorage.
- Analytics callbacks for field changes, page changes, completion, abandonment, validation errors, and submit errors.
- Dynamic labels, descriptions, input hints, sections, pages, and tabs from current form values.
- Visual builder, AI builder, and parser packages that share the same field configuration model.

## Packages

| Package | Role |
| --- | --- |
| `@formedible/formedible` | Core shadcn registry surface: hook, field components, layouts, persistence, analytics, validation helpers, and shared types. |
| `@formedible/builder` | Visual form builder with field configuration, live preview, default tabs, field store, and code generation. |
| `@formedible/ai-builder` | AI-assisted builder with provider selection, chat UI, parser integration, safe persistence, and live rendering. |
| `@formedible/formedible-parser` | Parser for Formedible definitions from JSON, object literals, and Zod-style expressions. |

## Documentation

Read the docs at [formedible.dev/docs](https://formedible.dev/docs). In this repo, the docs routes live under `apps/web/src/routes/docs`.

## Monorepo structure

```text
formedible/
├── apps/
│   └── web/                    # TanStack Start docs, demos, builder routes, and registry host
├── packages/
│   ├── formedible/             # Core Formedible source copied by the registry
│   ├── builder/                # Visual builder source and registry block
│   ├── ai-builder/             # AI builder source and registry block
│   ├── formedible-parser/      # Parser source and registry block
│   ├── ui/                     # Shared web app UI package
│   ├── env/                    # Environment helpers
│   └── config/                 # Shared TypeScript and tooling config
├── scripts/                    # Sync and maintenance scripts
└── tests/                      # Type, architecture, sync, smoke, and behavior tests
```

## Development commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run check-types
```

- `pnpm install` installs workspace dependencies.
- `pnpm run dev` runs Turbo development tasks for the workspace.
- `pnpm run build` builds the workspace through Turbo.
- `pnpm run check-types` checks package, app, compatibility, architecture, sync, and consumer smoke types.
