# Formedible

Formedible is the core shadcn registry surface for building React forms with TanStack Form. It gives you one hook, `useFormedible`, plus the field renderer and built-in field components that turn a typed field config into a working form.

This package is source for a shadcn install, not a published runtime npm package. Consumers copy the files into their app and own the result.

## Installation

Install the core registry item with shadcn:

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
```

For local testing from this repo, build the registry first and install the generated file:

```bash
pnpm --dir packages/formedible build:registry
pnpm dlx shadcn@latest add "$(pwd)/packages/formedible/public/r/formedible-core.json" --yes --overwrite
```

The registry copies the hook, form layout, field renderer, built-in field components, Formedible types, validation helpers, and small utility files into the consumer app under the `@ui/formedible/...` target paths declared in `registry.json`.

## What you use

`useFormedible` is the entry point:

```ts
function useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(
  config: UseFormedibleOptions<TFormValues>,
): {
  Form: (props: FormProps) => ReactNode;
  form: ReturnType<typeof useForm>;
  currentPage: number;
  totalPages: number;
  visiblePages: readonly number[];
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setCurrentPage: (page: number) => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  progressValue: number;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  clearStorage: () => void;
}
```

Typical usage:

```tsx
import { useFormedible } from '@ui/formedible/hooks/use-formedible';

interface ContactFormValues extends Record<string, unknown> {
  name: string;
  email: string;
  message: string;
}

interface ContactFormProps {
  readonly onSubmitContact: (value: ContactFormValues) => Promise<void>;
}

export function ContactForm({ onSubmitContact }: ContactFormProps) {
  const { Form } = useFormedible<ContactFormValues>({
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'message', type: 'textarea', label: 'Message', textareaConfig: { rows: 5 } },
    ],
    formOptions: {
      defaultValues: { name: '', email: '', message: '' },
      onSubmit: async ({ value }) => {
        await onSubmitContact(value);
      },
    },
  });

  return <Form />;
}
```

`UseFormedibleOptions<TFormValues>` requires `fields` and `formOptions`. Optional config adds schema validation, cross-field validation, async validation, pages, tabs, progress, persistence, analytics, component overrides, wrappers, form labels, form DOM event handlers, auto-submit, disabled/loading state, and submit-button control.

## Field types

Field type names are the public string literals from `FormedibleFieldType`. A few legacy aliases normalize to the current renderer name.

### Text input

- `text`
- `email`
- `password`
- `url`
- `tel`
- `textarea`
- `number`
- `masked`
- `maskedInput` alias for `masked`

### Choice and boolean

- `select`
- `radio`
- `checkbox`
- `switch`
- `multiSelect`
- `multiselect` alias for `multiSelect`
- `combobox`
- `autocomplete`
- `multiCombobox`
- `multicombobox` alias for `multiCombobox`

### Date, numeric scale, and visual value

- `date`
- `slider`
- `rating`
- `color`
- `colorPicker` alias for `color`
- `duration`

### Rich data

- `phone`
- `file`
- `array`
- `object`
- `location`

## Key features

- Typed config: `fields`, `defaultValues`, validation callbacks, and submit handlers can share the same `TFormValues` shape.
- Built-in renderer: the field registry maps normalized field types to the included React components, with `component`, `wrapper`, `defaultComponents`, and `globalWrapper` escape hatches.
- Validation pipeline: field-level validators, Standard Schema or Zod-style schemas, cross-field validation, and async field validation.
- Form structure: single-page forms, page-based flows, tabs, progress UI, sections, and conditional fields.
- Persistence: local storage or session storage with debouncing, field exclusions, restore-on-mount, and manual save/load/clear helpers.
- Analytics hooks: form start, field focus/blur/change/complete/error, page change, form complete, form abandon, and reset callbacks.
- Advanced field config: masks, password toggle and strength meter, textarea word count, async autocomplete, multi-select limits, color presets, duration formats, location callbacks, and file constraints.

## API docs

See [`/docs/api`](../../apps/web/src/routes/docs/api.tsx) for the full option tables and callback contracts.
