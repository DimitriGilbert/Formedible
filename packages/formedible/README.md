# Formedible

A thin wrapper around TanStack Form with Shadcn/UI components.

## Installation

```bash
npm install formedible @tanstack/react-form zod
```

## Basic Usage

### 1. Define your form options (like clientFormOpts pattern)

```tsx
import { formOptions } from '@tanstack/react-form';
import { z } from 'zod';

const myFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  projectType: z.enum(['showcase', 'ecommerce', 'app']),
});

type MyFormValues = z.infer<typeof myFormSchema>;

const myFormOpts = formOptions({
  defaultValues: {
    name: '',
    email: '',
    projectType: 'showcase' as const,
  } as MyFormValues,
  validators: {
    onChange: myFormSchema,
  },
  onSubmit: async ({ value }) => {
    console.log('Form submitted:', value);
    // Handle your form submission here
  },
});
```

### 2. Use the `useFormedible` hook

```tsx
import { useFormedible } from 'formedible';

export const MyForm: React.FC = () => {
  const { form, Form } = useFormedible({
    formOptions: myFormOpts,
    fields: [
      { name: 'name', type: 'text', label: 'Name', placeholder: 'Enter your name' },
      { name: 'email', type: 'email', label: 'Email', placeholder: 'Enter your email' },
      { name: 'projectType', type: 'select', label: 'Project Type', options: ['showcase', 'ecommerce', 'app'] },
    ],
    submitLabel: 'Submit Form',
    formClassName: 'max-w-md mx-auto space-y-4',
  });

  return <Form />;
};
```

### 3. Or use with custom children for full control

```tsx
export const CustomForm: React.FC = () => {
  const { form, Form } = useFormedible({
    formOptions: myFormOpts,
  });

  return (
    <Form>
      <form.Field name="name">
        {(field) => (
          <TextField
            fieldApi={field}
            label="Name"
            placeholder="Enter your name"
          />
        )}
      </form.Field>
      
      <form.Field name="email">
        {(field) => (
          <TextField
            fieldApi={field}
            type="email"
            label="Email"
            placeholder="Enter your email"
          />
        )}
      </form.Field>
      
      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

## API Reference

### `useFormedible(options)`

Returns an object with:
- `form`: The TanStack Form instance
- `Form`: A React component that renders the form

#### Options

- `formOptions` (required): TanStack Form options (use `formOptions()` helper)
- `fields` (optional): Array of field configurations for auto-rendering
- `submitLabel` (optional): Label for the submit button (default: "Submit")
- `formClassName` (optional): CSS classes for the form element
- `fieldClassName` (optional): CSS classes for each field wrapper

#### Field Configuration

Each field in the `fields` array can have:
- `name` (required): Field name matching your form schema
- `type` (required): Field type ('text', 'email', 'textarea', 'select', etc.)
- `label` (optional): Field label
- `placeholder` (optional): Field placeholder
- `description` (optional): Field description
- `options` (optional): Options for select fields

## Key Features

- **Thin wrapper**: Just a simple interface over TanStack Form
- **No complex types**: Uses TanStack Form's native typing
- **Flexible**: Use auto-generated fields or full custom components
- **Shadcn/UI**: Built-in integration with Shadcn components
- **Zero overhead**: Direct access to the underlying form instance

## Comparison with the original ClientForm

Instead of writing all the boilerplate:

```tsx
// Before: Lots of boilerplate
const form = useForm(clientFormOpts);
return (
  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <form.Field name="projectName">
      {(field) => (
        <TextField form={form} name="projectName" label="..." />
      )}
    </form.Field>
    // ... more fields
    <Button type="submit">Submit</Button>
  </form>
);
```

Now you can simply write:

```tsx
// After: Clean and simple
const { form, Form } = useFormedible({
  formOptions: clientFormOpts,
  fields: [
    { name: 'projectName', type: 'text', label: 'Project Name' },
    // ... more fields
  ],
});
return <Form />;
``` 