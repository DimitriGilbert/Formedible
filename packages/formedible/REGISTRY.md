 # Formedible shadcn/ui Registry

A powerful React hook for creating schema-driven forms with TanStack Form and shadcn/ui components.

## Installation

You can install the `use-formedible` hook using the shadcn CLI:

```bash
npx shadcn@latest add https://your-domain.com/r/use-formedible.json
```

For local development:

```bash
npx shadcn@latest add http://localhost:3000/r/use-formedible.json
```

## Prerequisites

Make sure you have the following dependencies installed:

```bash
npm install @tanstack/react-form @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-select @radix-ui/react-switch date-fns react-day-picker
```

And ensure you have the required shadcn/ui components:

```bash
npx shadcn@latest add button input textarea select checkbox switch label calendar popover
```

## Usage

```tsx
import { useFormedible } from "@/hooks/use-formedible";

interface FormData {
  name: string;
  email: string;
  message: string;
  subscribe: boolean;
}

export function ContactForm() {
  const { Form } = useFormedible<FormData>({
    fields: [
      {
        name: "name",
        type: "text",
        label: "Name",
        placeholder: "Enter your name",
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "Enter your email",
      },
      {
        name: "message",
        type: "textarea",
        label: "Message",
        placeholder: "Enter your message",
      },
      {
        name: "subscribe",
        type: "checkbox",
        label: "Subscribe to newsletter",
      },
    ],
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        message: "",
        subscribe: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
      },
    },
  });

  return <Form />;
}
```

## Advanced Usage

You can also use the hook with custom form rendering:

```tsx
export function CustomForm() {
  const { form, Form } = useFormedible<FormData>({
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
      },
    },
  });

  return (
    <Form>
      <form.Field name="name">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Name</label>
            <input
              id={field.name}
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors && (
              <div>{field.state.meta.errors.join(", ")}</div>
            )}
          </div>
        )}
      </form.Field>
      
      <form.Field name="email">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Email</label>
            <input
              id={field.name}
              type="email"
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors && (
              <div>{field.state.meta.errors.join(", ")}</div>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
      >
        {({ canSubmit, isSubmitting }) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </form.Subscribe>
    </Form>
  );
}
```

## Field Types

The hook supports the following field types:

- `text` - Text input
- `email` - Email input  
- `password` - Password input
- `url` - URL input
- `tel` - Telephone input
- `textarea` - Textarea
- `select` - Select dropdown
- `checkbox` - Checkbox
- `switch` - Switch toggle
- `number` - Number input
- `date` - Date picker

## Development Server

To serve this registry locally:

```bash
npm run dev
```

The registry will be available at `http://localhost:3000/r/use-formedible.json`

## Building

To build the registry:

```bash
npm run registry:build
```