# Formedible

> A powerful React hook for creating schema-driven forms with TanStack Form and shadcn/ui components

[![npm](https://img.shields.io/npm/v/formedible)](https://www.npmjs.com/package/formedible)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/DimitriGilbert/Formedible)](https://github.com/DimitriGilbert/Formedible)

Formedible is a thin wrapper around TanStack Form that provides a declarative API for building complex forms with shadcn/ui components. It features schema validation, multi-page support, component overrides, custom wrappers, and rich field types.

## 🚀 Quick Start

### 📋 Prerequisites

Ensure you have the required shadcn/ui installed.

### 📦 Installation

via shadcn CLI

```bash
npx shadcn@latest add https://dimitrigilbert.github.io/Formedible/r/use-formedible.json
```

## 🎯 Core Features

- **🛡️ Schema Validation**: Built-in Zod schema validation with real-time error handling
- **⚡ Component Override**: Replace any field component with custom implementations  
- **🎨 Custom Wrappers**: Add animations, special styling, or extra functionality to fields
- **📄 Multi-Page Forms**: Built-in pagination with customizable progress indicators
- **🔀 Conditional Fields**: Show/hide fields based on form state
- **📱 Rich Field Types**: 10+ field types out of the box
- **🎭 Zero Config**: Works with TanStack Form's native typing system
- **🔧 Flexible**: Use auto-generated fields or full custom components

## 📚 Basic Usage

### 1. Define Your Schema and Form Options

```tsx
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  newsletter: z.boolean().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;
```

### 2. Simple Form with Auto-Generated Fields

```tsx
export function ContactForm() {
  const { Form } = useFormedible<ContactFormValues>({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "Enter your name" },
      { name: "email", type: "email", label: "Email", placeholder: "your@email.com" },
      { name: "message", type: "textarea", label: "Message", placeholder: "Your message..." },
      { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
    ],
    submitLabel: "Send Message",
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        message: "",
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle form submission
      },
    },
  });

  return <Form />;
}
```

### 3. Custom Form with Manual Field Rendering

```tsx
export function CustomContactForm() {
  const { form, Form } = useFormedible<ContactFormValues>({
    schema: contactSchema,
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        message: "",
        newsletter: false,
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
          <TextField
            fieldApi={field}
            label="Full Name"
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
            placeholder="your@email.com"
          />
        )}
      </form.Field>

      <form.Field name="message">
        {(field) => (
          <TextareaField
            fieldApi={field}
            label="Message"
            placeholder="Your message..."
          />
        )}
      </form.Field>

      <form.Field name="newsletter">
        {(field) => (
          <CheckboxField
            fieldApi={field}
            label="Subscribe to newsletter"
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        )}
      </form.Subscribe>
    </Form>
  );
}
```

## 🎨 Advanced Features

### Multi-Page Forms with Progress

```tsx
const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be 18 or older"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  notifications: z.boolean(),
});

export function RegistrationForm() {
  const { Form } = useFormedible({
    schema: registrationSchema,
    fields: [
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "email", type: "email", label: "Email", page: 2 },
      { name: "age", type: "number", label: "Age", min: 18, max: 120, page: 2 },
      { name: "bio", type: "textarea", label: "Bio", page: 3 },
      { name: "notifications", type: "switch", label: "Enable notifications", page: 3 },
    ],
    pages: [
      { page: 1, title: "Personal Info", description: "Tell us about yourself" },
      { page: 2, title: "Contact Details", description: "How can we reach you?" },
      { page: 3, title: "Preferences", description: "Customize your experience" },
    ],
    progress: { showSteps: true, showPercentage: true },
    nextLabel: "Continue →",
    previousLabel: "← Back",
    submitLabel: "Complete Registration",
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        age: 18,
        bio: "",
        notifications: true,
      },
      onSubmit: async ({ value }) => {
        console.log("Registration completed:", value);
      },
    },
    onPageChange: (page, direction) => {
      console.log(`Navigated to page ${page} via ${direction}`);
    },
  });

  return <Form />;
}
```

### Custom Components and Wrappers

```tsx
// Custom animated wrapper
const AnimatedWrapper: React.FC<{ children: React.ReactNode; field: FieldConfig }> = ({ 
  children 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-2"
  >
    {children}
  </motion.div>
);

// Custom field component
const CustomTextField: React.FC<any> = ({ fieldApi, label, ...props }) => (
  <div className="relative">
    <Input {...props} className="peer" />
    <Label className="absolute left-3 top-3 text-muted-foreground transition-all peer-focus:-top-1 peer-focus:text-xs">
      {label}
    </Label>
  </div>
);

export function EnhancedForm() {
  const { Form } = useFormedible({
    fields: [
      { 
        name: "email", 
        type: "email", 
        label: "Email",
        component: CustomTextField, // Override field component
        wrapper: AnimatedWrapper,   // Custom wrapper
      },
    ],
    globalWrapper: AnimatedWrapper, // Apply to all fields
    formOptions: {
      defaultValues: { email: "" },
      onSubmit: async ({ value }) => console.log(value),
    },
  });

  return <Form />;
}
```

### Conditional Fields

```tsx
export function ConditionalForm() {
  const { Form } = useFormedible({
    fields: [
      { name: "hasJob", type: "checkbox", label: "I have a job" },
      { 
        name: "jobTitle", 
        type: "text", 
        label: "Job Title",
        conditional: (values) => values.hasJob === true // Only show if hasJob is true
      },
      { 
        name: "company", 
        type: "text", 
        label: "Company",
        conditional: (values) => values.hasJob === true
      },
    ],
    formOptions: {
      defaultValues: { hasJob: false, jobTitle: "", company: "" },
      onSubmit: async ({ value }) => console.log(value),
    },
  });

  return <Form />;
}
```

## 🔧 API Reference

### `useFormedible<TFormValues>(options)`

Returns an object with:
- `form`: The TanStack Form instance
- `Form`: React component that renders the form
- `currentPage`: Current page number (multi-page forms)
- `totalPages`: Total number of pages
- `goToNextPage()`: Navigate to next page
- `goToPreviousPage()`: Navigate to previous page
- `setCurrentPage(page)`: Jump to specific page
- `isFirstPage`: Boolean if on first page
- `isLastPage`: Boolean if on last page
- `progressValue`: Progress percentage (0-100)

### Options

```typescript
interface UseFormedibleOptions<TFormValues> {
  // Core options
  fields?: FieldConfig[];                    // Field configurations for auto-rendering
  schema?: z.ZodSchema<TFormValues>;         // Zod schema for validation
  formOptions?: TanStackFormOptions;         // TanStack Form options
  
  // UI Customization
  submitLabel?: string;                      // Submit button text (default: "Submit")
  nextLabel?: string;                        // Next button text (default: "Next")
  previousLabel?: string;                    // Previous button text (default: "Previous")
  formClassName?: string;                    // CSS classes for form element
  fieldClassName?: string;                   // CSS classes for field wrappers
  
  // Multi-page support
  pages?: PageConfig[];                      // Page configurations
  progress?: ProgressConfig;                 // Progress indicator config
  onPageChange?: (page: number, direction: 'next' | 'previous') => void;
  
  // Component overrides
  defaultComponents?: {                      // Override default field components
    [fieldType: string]: React.ComponentType<any>;
  };
  globalWrapper?: React.ComponentType<{      // Wrapper applied to all fields
    children: React.ReactNode; 
    field: FieldConfig;
  }>;
}
```

### Field Configuration

```typescript
interface FieldConfig {
  name: string;                              // Field name (required)
  type: string;                              // Field type (required)
  label?: string;                            // Field label
  placeholder?: string;                      // Field placeholder
  description?: string;                      // Field description/help text
  
  // Type-specific options
  options?: string[] | Array<{value: string; label: string}>; // For select fields
  min?: number;                              // For number/date fields
  max?: number;                              // For number/date fields
  step?: number;                             // For number fields
  accept?: string;                           // For file fields
  multiple?: boolean;                        // For file/select fields
  
  // Advanced options
  component?: React.ComponentType<any>;      // Custom field component
  wrapper?: React.ComponentType<{            // Custom field wrapper
    children: React.ReactNode; 
    field: FieldConfig;
  }>;
  page?: number;                             // Page number (multi-page forms)
  validation?: z.ZodSchema<any>;             // Field-specific validation
  conditional?: (values: any) => boolean;    // Conditional rendering logic
  dependencies?: string[];                   // Field dependencies (future use)
}
```

### Supported Field Types

| Type | Component | Description |
|------|-----------|-------------|
| `text` | `TextField` | Text input (supports email, password, url, tel) |
| `email` | `TextField` | Email input with validation |
| `password` | `TextField` | Password input |
| `url` | `TextField` | URL input |
| `tel` | `TextField` | Telephone input |
| `textarea` | `TextareaField` | Multi-line text input |
| `select` | `SelectField` | Dropdown selection |
| `checkbox` | `CheckboxField` | Boolean checkbox |
| `switch` | `SwitchField` | Toggle switch |
| `number` | `NumberField` | Number input with min/max/step |
| `date` | `DateField` | Date picker with calendar |
| `slider` | `SliderField` | Range slider input |
| `file` | `FileUploadField` | File upload with drag & drop |

## 🎭 Component Architecture

### Field Component Interface

All field components implement the `BaseFieldProps` interface:

```typescript
interface BaseFieldProps {
  fieldApi: AnyFieldApi;                     // TanStack Form field API
  label?: string;                            // Field label
  description?: string;                      // Help text
  placeholder?: string;                      // Placeholder text
  inputClassName?: string;                   // Input element classes
  labelClassName?: string;                   // Label element classes  
  wrapperClassName?: string;                 // Wrapper div classes
}
```

### Creating Custom Field Components

```tsx
import { BaseFieldProps } from "@/lib/formedible/types";

interface CustomFieldProps extends BaseFieldProps {
  customProp?: string;
}

export const CustomField: React.FC<CustomFieldProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  customProp,
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  
  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <Label htmlFor={name} className={cn("text-sm font-medium", labelClassName)}>
          {label}
        </Label>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      
      {/* Your custom input implementation */}
      <CustomInput
        id={name}
        value={state.value || ''}
        onChange={(value) => handleChange(value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(inputClassName, state.meta.errors.length ? "border-destructive" : "")}
        disabled={fieldApi.form.state.isSubmitting}
        {...(customProp && { customProp })}
      />
      
      {/* Error display */}
      {state.meta.isTouched && state.meta.errors.length > 0 && (
        <div className="text-xs text-destructive pt-1">
          {state.meta.errors.map((err: any, index: number) => (
            <p key={index}>{String(err)}</p>
          ))}
        </div>
      )}
    </div>
  );
};

// Usage
const { Form } = useFormedible({
  fields: [
    { 
      name: "customField", 
      type: "custom", 
      label: "Custom Field",
      component: CustomField,
      customProp: "value"
    }
  ],
  defaultComponents: {
    custom: CustomField
  }
});
```

## 🚀 Examples

### Real-world Contact Form

```tsx
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().optional(),
  subject: z.enum(["general", "support", "sales", "partnership"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
  urgent: z.boolean().default(false),
  newsletter: z.boolean().default(false),
});

export function ContactForm() {
  const { Form } = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
      { name: "email", type: "email", label: "Email Address", placeholder: "john@company.com" },
      { name: "company", type: "text", label: "Company", placeholder: "Acme Inc." },
      { 
        name: "subject", 
        type: "select", 
        label: "Subject",
        options: [
          { value: "general", label: "General Inquiry" },
          { value: "support", label: "Technical Support" },
          { value: "sales", label: "Sales Question" },
          { value: "partnership", label: "Partnership" }
        ]
      },
      { name: "message", type: "textarea", label: "Message", placeholder: "How can we help you?" },
      { name: "urgent", type: "checkbox", label: "This is urgent" },
      { name: "newsletter", type: "checkbox", label: "Subscribe to our newsletter" },
    ],
    submitLabel: "Send Message",
    formClassName: "max-w-lg mx-auto space-y-6 p-6",
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        company: "",
        subject: "general" as const,
        message: "",
        urgent: false,
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(value),
          });
          
          if (response.ok) {
            alert("Message sent successfully!");
          } else {
            throw new Error("Failed to send message");
          }
        } catch (error) {
          alert("Error sending message. Please try again.");
        }
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
        <Card>
          <CardContent className="p-6">
            <Form />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## 📦 Registry Information

This component is distributed as a shadcn/ui registry item:

- **Registry URL**: `https://dimitrigilbert.github.io/Formedible/r/use-formedible.json`
- **Type**: `registry:hook`
- **Categories**: `form`, `hook`
- **Dependencies**: TanStack Form, Zod, Radix UI components
- **Registry Dependencies**: All required shadcn/ui components

### Files Included

- `hooks/use-formedible.tsx` - Main hook
- `components/fields/text-field.tsx` - Text input component
- `components/fields/textarea-field.tsx` - Textarea component  
- `components/fields/select-field.tsx` - Select dropdown component
- `components/fields/checkbox-field.tsx` - Checkbox component
- `components/fields/switch-field.tsx` - Switch toggle component
- `components/fields/number-field.tsx` - Number input component
- `components/fields/date-field.tsx` - Date picker component

## 🤝 Comparison with Raw TanStack Form

### Before (Raw TanStack Form)
```tsx
const form = useForm({
  defaultValues: { name: "", email: "" },
  onSubmit: async ({ value }) => console.log(value),
});

return (
  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <form.Field name="name">
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor={field.name}>Name</Label>
          <Input
            id={field.name}
            value={field.state.value || ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
          {field.state.meta.errors && (
            <div className="text-red-500 text-sm">
              {field.state.meta.errors.join(", ")}
            </div>
          )}
        </div>
      )}
    </form.Field>
    {/* Repeat for each field... */}
    <Button type="submit">Submit</Button>
  </form>
);
```

### After (With Formedible)
```tsx
const { Form } = useFormedible({
  fields: [
    { name: "name", type: "text", label: "Name" },
    { name: "email", type: "email", label: "Email" },
  ],
  formOptions: {
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => console.log(value),
  },
});

return <Form />;
```

## 🛠️ Development

### Local Development Setup

```bash
git clone https://github.com/DimitriGilbert/Formedible
cd Formedible
npm install
npm run dev
```

The registry will be available at `http://localhost:3000/r/use-formedible.json`

### Building the Registry

```bash
npm run registry:build
```

### Testing Components

```bash
npm run test
```

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with love using:
- [TanStack Form](https://tanstack.com/form) - Powerful form state management
- [shadcn/ui](https://ui.shadcn.com) - Beautiful, accessible components
- [Zod](https://zod.dev) - TypeScript-first schema validation
- [Radix UI](https://radix-ui.com) - Low-level accessible components

---

**Formedible** makes form building in React a delightful experience. From simple contact forms to complex multi-step wizards, it provides the perfect balance of simplicity and power. 