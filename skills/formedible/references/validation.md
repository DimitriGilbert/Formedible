# Validation reference

Import paths assume the installed copy. Validation order and messages below are the runtime behavior of `buildFieldValidators` / `buildFormValidators` in `components/ui/formedible/lib/validation.ts`.

## Where each rule belongs

| Rule | Option |
| --- | --- |
| Required, email/url format, maxLength, numeric min/max | field config (`required`, `type`, `maxLength`, `min`, `max`) |
| Whole-form schema (zod or any Standard Schema v1) | hook-level `schema` |
| One-field sync rule, or a field-local schema | field `validation` |
| Server-backed async check per field | hook-level `asyncValidation[fieldName]` |
| Multi-field rule | hook-level `crossFieldValidation[]` |
| Field-owned async on-change rule | field `inlineValidation` |

Per validation pass (change, blur, and submit), each field's message is the first non-undefined result of:

1. built-in constraints (`required` → `'{label} is required'`; `type: 'email'` → `'Please enter a valid email address'`; `type: 'url'` → `'Please enter a valid URL'`; `maxLength` → `'Must be at most N characters'`; numeric `min`/`max` → `'Must be at least/at most N'`)
2. field `validation`
3. the schema issue for that field
4. cross-field rules naming that field

Async passes run: the field-local schema first (field `validation` given as a Standard Schema), then `asyncValidation[fieldName]`, then field `inlineValidation`, then the async form schema.

## Built-in constraints

`required` runs first and rejects empty values (`undefined`, `null`, `''`, `[]`), and `false` for checkbox/switch. Format and range checks only run when a value exists.

```ts
const fields = [
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'bio', type: 'textarea', label: 'Short bio', maxLength: 280 },
  { name: 'salaryExpectation', type: 'number', label: 'Salary expectation', min: 0, max: 300000 },
];
```

## Form-level schema

Place the schema at the top level, beside `fields` — never inside `formOptions`. Schema issues map onto TanStack field errors on change, blur, and submit. Keep schema keys and field names identical; issues for currently hidden fields/pages/tabs are filtered out so invisible fields never block submit.

```tsx
import { z } from 'zod';

import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

const jobApplicationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  email: z.string().email('Enter a valid email address'),
  skills: z.array(z.string()).min(1, 'Pick at least one skill'),
  salaryExpectation: z.number().min(0, 'Salary must be zero or higher'),
});

type JobApplicationValues = z.infer<typeof jobApplicationSchema>;

export function JobApplicationForm() {
  const { Form } = useFormedible<JobApplicationValues>({
    schema: jobApplicationSchema,   // any Standard Schema v1 object works
    fields: [
      { name: 'firstName', type: 'text', label: 'First name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'skills', type: 'multiSelect', label: 'Skills', options: ['react', 'typescript'], required: true },
      { name: 'salaryExpectation', type: 'number', label: 'Salary expectation', min: 0 },
    ],
    formOptions: {
      defaultValues: { firstName: '', email: '', skills: [], salaryExpectation: 0 },
      onSubmit: ({ value }) => saveApplication(value),
    },
  });

  return <Form />;
}
```

## Field-level `validation`

Three accepted shapes. Return a string to show it; `null`/`undefined` passes; `false` falls back to `'Invalid value'` (or the object's `message`).

```ts
import { z } from 'zod';
import type { FormedibleFieldConfig } from '@/components/ui/formedible/lib/types';

type AccountValues = { username: string; email: string };

export const accountFields = [
  {
    name: 'username',
    type: 'text',
    label: 'Username',
    // 1. function: (value, values, context) where context = { value, values, fieldName }
    validation: (value: unknown) =>
      String(value ?? '').trim().toLowerCase() === 'admin' ? 'Username is reserved' : null,
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    // 2. object with validator + fallback message
    validation: {
      validator: (value: unknown) => String(value).endsWith('@corp.example') ? null : false,
      message: 'Use your corporate address',
    },
  },
  {
    name: 'department',
    type: 'text',
    label: 'Department',
    // 3. field-local Standard Schema
    validation: z.string().min(3, 'Department must be at least 3 characters'),
  },
] satisfies readonly FormedibleFieldConfig<AccountValues>[];
```

## `asyncValidation` — hook-level, keyed by field name

The validator receives `value`, current `values`, and an `AbortSignal`; wire the signal into fetch so newer keystrokes cancel older requests. `debounceMs` debounces the async pass. `loadingMessage` is typed config metadata only — nothing renders it.

```tsx
const { Form } = useFormedible<SignupValues>({
  fields: [
    { name: 'username', type: 'text', label: 'Username', required: true },
  ],
  asyncValidation: {
    username: {
      debounceMs: 250,
      validator: async (value, _values, signal) => {
        const username = String(value ?? '').trim();

        if (username.length < 3) {
          return null;
        }

        const response = await fetch(`/api/usernames/${encodeURIComponent(username)}`, { signal });
        const result = (await response.json()) as { readonly available: boolean };

        return result.available ? null : 'That username is taken';
      },
    },
  },
  formOptions: { defaultValues: { username: '' } },
});
```

## `crossFieldValidation` — multi-field rules

List every field the rule touches; the runtime derives `onChangeListenTo` from that list so editing `password` revalidates `confirmPassword`. `false` maps to `'Invalid field combination'`.

```tsx
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
  formOptions: { defaultValues: { password: '', confirmPassword: '' } },
});
```

## `inlineValidation` — field-owned async

Requires `enabled: true`. Same return contract as `asyncValidation`. When both exist for a field, `asyncValidation` runs first and its `debounceMs` wins.

```ts
{
  name: 'displayName',
  type: 'text',
  label: 'Display name',
  inlineValidation: {
    enabled: true,
    debounceMs: 125,
    showSuccess: true,                 // typed flag for custom renderers
    validator: async (value, _values, signal) => {
      const response = await fetch(`/api/display-names/${encodeURIComponent(String(value ?? ''))}`, { signal });
      const result = (await response.json()) as { readonly allowed: boolean };

      return result.allowed ? null : 'Display name not allowed';
    },
  },
}
```

## Invalid submits

- Submit always enters the TanStack lifecycle: fields are marked touched, submit-cause validation runs, inline errors appear even if the user never blurred.
- A validation summary lists every invalid field once a submit attempt failed. Clicking an entry jumps to the field (switching tab/page as needed) and scrolls/focuses it.
- `validationSummary: false` disables the summary and per-tab/page error badges; `validationSummary: { autoNavigate: true, showBadges: true }` tunes them (both default true).
- `formOptions.onSubmitInvalid({ value, formApi, meta })` is forwarded verbatim to TanStack Form and fires when a submit fails validation.
- `formOptions.canSubmitWhenInvalid: true` keeps the submit button enabled while invalid.
- `formOptions.asyncDebounceMs` debounces async schema passes.
