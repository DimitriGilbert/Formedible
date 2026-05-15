# Formedible

Formedible is a React form kit shipped through shadcn registry JSON. The core install copies `useFormedible`, field components, layout pieces, validation helpers, persistence, analytics, and types into your app so you can own the code.

## Install and render a form

Run this from the app package that owns `components.json` and the `@/` alias:

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
```

Then import the copied hook from your UI path:

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

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
}
```

Core facts from source:

- `formedible-core` is declared in `packages/formedible/registry.json` and generated at `packages/formedible/public/r/formedible-core.json`.
- The public item depends on `@tanstack/react-form`, `clsx`, `lucide-react`, and `tailwind-merge`.
- It also installs shadcn primitives used by the fields: `badge`, `button`, `checkbox`, `field`, `input`, `radio-group`, `select`, `slider`, `switch`, and `textarea`.
- The hook returns `Form`, the TanStack form instance, page navigation state, and persistence helpers from `packages/formedible/src/hooks/use-formedible.tsx`.

## Docs and live examples

Public docs are hosted at `https://formedible.dev`.

| What | URL | Source |
| --- | --- | --- |
| Getting started | <https://formedible.dev/docs/getting-started> | `apps/web/src/routes/docs/getting-started.tsx` |
| API | <https://formedible.dev/docs/api> | `apps/web/src/routes/docs/api.tsx` |
| Fields | <https://formedible.dev/docs/fields> | `apps/web/src/routes/docs/fields.tsx` |
| Validation | <https://formedible.dev/docs/validation> | `apps/web/src/routes/docs/validation.tsx` |
| Examples browser | <https://formedible.dev/docs/examples> | `apps/web/src/routes/docs/examples.tsx` |
| Contact example | <https://formedible.dev/docs/examples?example=contact> | `apps/web/src/components/docs/examples/contact-form.tsx` |
| Registration example | <https://formedible.dev/docs/examples?example=registration> | `apps/web/src/components/docs/examples/registration-form.tsx` |
| Arrays example | <https://formedible.dev/docs/examples?example=arrays> | `apps/web/src/components/docs/examples/array-fields-form.tsx` |
| Persistence example | <https://formedible.dev/docs/examples?example=persistence> | `apps/web/src/components/docs/examples/persistence-form.tsx` |
| Analytics example | <https://formedible.dev/docs/examples?example=analytics> | `apps/web/src/components/docs/examples/analytics-tracking-form.tsx` |

Example IDs are registered in `apps/web/src/components/docs/examples/index.tsx`: `contact`, `registration`, `survey`, `checkout`, `job`, `tabbed`, `flow`, `rental-flow`, `analytics`, `persistence`, `arrays`, `conditional-object-array`, `conditional-pages`, and `advanced-fields`.

## Packages

| Package | Role | Useful source |
| --- | --- | --- |
| `@formedible/formedible` | Core hook, field components, layout, validation, persistence, analytics, public registry item. | `packages/formedible/src/`, `packages/formedible/registry.json` |
| `@formedible/formedible-parser` | Parser package for Formedible config input; syncs core pieces into its source. | `packages/formedible-parser/src/`, `packages/formedible-parser/registry.json` |
| `@formedible/builder` | Visual builder package with preview/code-generation surface. | `packages/builder/src/`, `packages/builder/registry.json` |
| `@formedible/ai-builder` | AI builder package using TanStack AI providers, parser integration, chat, and live rendering. | `packages/ai-builder/src/`, `packages/ai-builder/registry.json` |
| `@formedible/ui` | Internal synced UI package consumed by the docs app. Not a user install target. | `packages/ui/src/components/formedible/` |
| `@formedible/env` | Shared environment helpers for the web app. | `packages/env/src/` |
| `@formedible/config` | Shared TypeScript config package. | `packages/config/` |
| `web` | TanStack Start docs app, live examples, builder routes, and registry host. | `apps/web/src/` |

## Maintainer workflow for core changes

Do core work in the owner package first. Do not patch synced Formedible files directly in the web app, builder packages, parser package, or UI mirror.

```bash
# 1. Edit core source
$EDITOR packages/formedible/src/

# 2. Build the core package; sync reads from the package source and registry shape
pnpm run build:pkg

# 3. Sync registry-listed source into mirrors and dependent packages
node scripts/quick-sync.js
# or
pnpm run sync-components

# 4. Verify all packages and type test projects
pnpm run check-types

# 5. Build the workspace before release-style changes
pnpm run build
```

`scripts/quick-sync.js` copies files listed in each package `registry.json`. Its default routes are:

- `packages/formedible` → `packages/ui/src/components` using registry targets.
- `packages/formedible` → `packages/formedible-parser/src`, `packages/builder/src`, `packages/ai-builder/src`.
- `packages/formedible-parser` → `packages/ui/src/components`, `packages/builder/src`, `packages/ai-builder/src`.
- `packages/builder` → `packages/ui/src/components`, `packages/ai-builder/src`.
- `packages/ai-builder` → `packages/ui/src/components`.

`scripts/build-registries.js` removes generated JSON under each public registry package, runs `pnpm --dir <package> build:registry`, then validates the generated files.

## Common commands

| Command | What it runs |
| --- | --- |
| `pnpm run build` | Turbo build for the workspace. |
| `pnpm run build:pkg` | `@formedible/formedible` build. |
| `pnpm run build:parser` | Parser package build. |
| `pnpm run build:builder` | Builder package build. |
| `pnpm run build:ai-builder` | AI builder package build. |
| `pnpm run build:web` | Docs app build. |
| `pnpm run build:registries` | Generate and validate public registry JSON. |
| `pnpm run sync-components` | Run `scripts/quick-sync.js`. |
| `pnpm run check-types` | Turbo type checks plus compatibility, architecture, sync, consumer-smoke, and Formedible type projects. |
| `pnpm run test:sync` | Sync tests and boundary validator. |
| `pnpm run test:consumer-smoke` | Consumer install smoke tests for generated registry output. |
| `pnpm run test:e2e` | Build docs app, compile e2e tests, then run them. |

The root also has `dev` and `dev:web`, but they are not needed for README or source checks.

## Monorepo map

```text
apps/web/                    Docs site, examples, builder routes, registry hosting
packages/formedible/          Core Formedible source and formedible-core registry item
packages/formedible-parser/   Parser package and registry item
packages/builder/             Visual builder package and registry item
packages/ai-builder/          AI builder package and registry item
packages/ui/                  Internal synced UI mirror for the docs app
packages/env/                 Shared env helpers
packages/config/              Shared config
scripts/                      Sync, registry, validation, and release scripts
tests/                        Type, sync, architecture, consumer, and e2e checks
```

## Registry and source links

- Core registry manifest: `packages/formedible/registry.json`
- Generated core registry item: `packages/formedible/public/r/formedible-core.json`
- Hook source: `packages/formedible/src/hooks/use-formedible.tsx`
- Public types: `packages/formedible/src/lib/formedible/types.ts`
- Examples index: `apps/web/src/components/docs/examples/index.tsx`
- Sync script: `scripts/quick-sync.js`
- Registry build script: `scripts/build-registries.js`
