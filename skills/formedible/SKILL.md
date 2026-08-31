---
name: formedible
description: Use when building or configuring React forms with Formedible — installing formedible-core via shadcn, calling useFormedible, writing FormedibleFieldConfig field lists, zod/async/cross-field validation, multi-page or tabbed flows, draft persistence, form analytics, FormedibleParser JSON configs, or AI form generation with ai-builder/ai-picker.
---

# Formedible — consumer usage

Formedible renders fully typed React forms from a field-config array, on top of TanStack Form and shadcn-compatible UI. You own the source: the registry copies the hook, fields, and types into your app, and you edit them there.

Written against the `formedible-core` registry item (package `@formedible/formedible` version `0.0.0`, branch `re-codex`) on 2026-08-31. Every example here is verified against the source on that branch.

## Mental model

- **Config-driven**: one `useFormedible<TValues>(config)` call describes fields, validation, pages/tabs, persistence, and analytics. The returned `Form` component renders everything.
- **Source-owned**: install copies files to `components/ui/formedible/**` in the consumer app. Import from your local `@/components/ui/formedible/...` paths, never from a published package.
- **TanStack Form owns state**: the hook returns the underlying `form` instance (`form.state.values`, `form.reset()`, ...). Values are typed by `TValues`.
- **Standard Schema validation**: the top-level `schema` option accepts any Standard Schema v1 object — zod v4 is the documented choice.

## Steps

1. **Install** in the app that owns the UI components:

   ```bash
   pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
   ```

   It declares dependencies `@tanstack/react-form`, `zod`, `clsx`, `lucide-react`, `tailwind-merge` and pulls the shadcn `badge, button, checkbox, command, field, input, popover, radio-group, select, slider, switch, textarea` components. React 19 is the environment it is developed against. Done when `components/ui/formedible/hooks/use-formedible.tsx` exists in the app.

2. **Type the values** and keep one source of truth: `type Values = z.infer<typeof schema>` (or a hand-written interface extending `FormedibleFormValues`). Every field `name`, every `defaultValues` key, and every schema key must line up. Done when each field name in step 3 exists in `defaultValues`.

3. **Write the field config** — `readonly FormedibleFieldConfig<Values>[]`. Reach for the field-type reference below before inventing keys; every type's options live in `references/fields.md`. Done when the form renders every field.

4. **Wire submit in `formOptions.onSubmit`** and render `<x.Form />`. Done when submitting produces typed values in your handler.

```tsx
import { z } from 'zod';

import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const contactForm = useFormedible<ContactValues>({
    schema: contactSchema,
    fields: [
      { name: 'name', type: 'text', label: 'Full name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'message', type: 'textarea', label: 'Message' },
    ],
    formOptions: {
      defaultValues: { name: '', email: '', message: '' },
      onSubmit: async ({ value }) => {
        await fetch('/api/contact', { method: 'POST', body: JSON.stringify(value) });
      },
    },
  });

  return <contactForm.Form className="space-y-4" />;
}
```

## Import map (after install)

| Import | Source file |
| --- | --- |
| `useFormedible` | `@/components/ui/formedible/hooks/use-formedible` |
| `useMultiPage`, `getVisiblePageNumbers`, `conditionMatches` | `@/components/ui/formedible/hooks/use-multi-page` |
| `useFormTabs`, `normalizeTabs` | `@/components/ui/formedible/hooks/use-form-tabs` |
| `useFormPersistence`, `savePersistedFormPayload`, `loadPersistedFormPayload`, `clearPersistedFormPayload` | `@/components/ui/formedible/hooks/use-form-persistence` |
| `useFormAnalytics`, `createFormAnalyticsTracker` | `@/components/ui/formedible/hooks/use-form-analytics` |
| `Form`, `FieldRenderer` | `@/components/ui/formedible/form`, `.../field-renderer` |
| `getFieldComponent` | `@/components/ui/formedible/fields/field-registry` |
| `UseFormedibleOptions`, `FormedibleFieldConfig`, `FormedibleFieldType`, `FormedibleFormValues`, `FormedibleFieldRenderProps` (types) | `@/components/ui/formedible/lib/types` |

The hook returns: `Form`, `form`, `currentPage`, `totalPages`, `visiblePages`, `goToNextPage`, `goToPreviousPage`, `setCurrentPage`, `isFirstPage`, `isLastPage`, `progressValue`, `saveToStorage`, `loadFromStorage`, `clearStorage`.

## Field types

`text` `email` `password` `url` `tel` `textarea` `number` `select` `radio` `checkbox` `switch` `date` `slider` `rating` `phone` `file` `array` `object` `multiSelect` `combobox` `autocomplete` `multiCombobox` `color` `duration` `location` `masked` — plus aliases that normalize before lookup: `multiselect` → `multiSelect`, `multicombobox` → `multiCombobox`, `colorPicker` → `color`, `maskedInput` → `masked`. Omitted `type` renders text. Unknown type strings fall back to text unless registered in `defaultComponents`.

## Gotchas (verified against source)

- Submit work belongs in `formOptions.onSubmit`. The returned `Form` intercepts the native submit event and ignores an `onSubmit` prop you pass it.
- After a successful submit the form **resets to defaults and clears the persistence key**. Pass `resetOnSubmitSuccess: false` to keep submitted values.
- Mixing tabs and pages: tab filtering wins for fields (fields render by `tab` and `page` is ignored), but page navigation still renders whenever pages are configured — so a mixed config shows the tab bar AND Previous/Next/Submit, and the page buttons change `currentPage` without changing the visible fields. Configure one, not both.
- `type: 'email'` and `type: 'url'` carry built-in format checks; `emailConfig` is deprecated and ignored at runtime.
- `conditional: 'fieldName'` means "truthy value at that path"; a function receives current values. Both support nested paths like `address.city` or `items[0].name`.
- Dynamic text tokens `{{firstName}}` resolve in `label`, `description`, `placeholder`, `help` (plain string, `help.text`, `help.tooltip`), `section`, page, and tab copy.
- Build `defaultValues` once (module scope or `useMemo`); configs minting new objects every render fight the hook's defaultValues adoption gate.
- `optionSets` is typed compatibility metadata — no built-in renderer reads it. Use `options` (static array or function of values).
- `noValidate` defaults to true on the rendered form; browser validation UI stays out of the way.

## Branch references

Load the reference that matches the work, on demand:

- **Any field type or per-field option** (selects, multi-selects, arrays with object items, nested objects, sliders, phones, files, colors, durations, locations, masks, custom components/wrappers, help, datalist, sections): read `references/fields.md`.
- **Validation** (built-in constraints, zod/Standard Schema, field `validation`, `asyncValidation`, `crossFieldValidation`, `inlineValidation`, invalid-submit summary): read `references/validation.md`.
- **Flows and form-level features** (pages, tabs, conditional UI, progress, dynamic text, persistence/autosave, analytics callbacks, Form props, auto-submit, disabled/loading, labels): read `references/flows.md`.
- **Config from text or AI** (FormedibleParser, ```formedible fenced blocks, parser config and security rules, schema inference, AIBuilder, AiPicker, BYOK providers): read `references/parser-and-ai.md`.

## Verification bar

Every field name, schema key, and `defaultValues` key accounted for; every option key used exists in `FormedibleFieldConfig` or the matching nested config type in `packages/formedible/src/lib/formedible/types.ts`; no invented props.
