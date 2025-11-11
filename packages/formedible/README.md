# Formedible

> **The Ultimate React Form Library** - A powerful, type-safe, schema-driven form library that makes complex form building effortless.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![TanStack Form](https://img.shields.io/badge/TanStack_Form-v1-orange)](https://tanstack.com/form)
[![Zod](https://img.shields.io/badge/Zod-4.0-green)](https://zod.dev)

**Formedible** is a comprehensive form library for React built on top of **TanStack Form** and **Zod**. It provides a declarative, configuration-based API for creating everything from basic contact forms to complex multi-step wizards with enterprise-grade features.

## 🎯 What Makes Formedible Special?

Formedible is designed as a **shadcn-compatible package**, following the shadcn philosophy of "copy the code into your project" rather than being a traditional npm dependency. This gives you:

- ✅ **Full Control** - The code lives in your project, customize it however you want
- ✅ **No Version Lock-in** - No dependency hell, you own the code
- ✅ **Type Safety** - Full TypeScript support with your exact configuration
- ✅ **Zero Bundle Impact** - Only bundle what you actually use

## ⚡ Key Features

### 🎨 **25+ Built-in Field Components**
From basic inputs to advanced components: text, email, password, textarea, select, checkbox, switch, radio, number, date, slider, rating, phone, color picker, file upload, multi-select, combobox, autocomplete, location picker, duration picker, masked input, array fields, and nested object fields.

### 🔒 **Schema-First Validation**
Full Zod integration with runtime type safety, automatic error messages, and composable schemas.

### 📄 **Multi-Page Forms**
Built-in pagination with progress tracking, validation per page, and customizable navigation.

### 🎭 **Conditional Logic**
Show/hide fields and sections based on form state with dynamic options that update in real-time.

### 🧠 **Advanced Validation**
- Sync and async validation with debouncing
- Cross-field validation (e.g., password confirmation)
- Real-time inline validation with success indicators
- Server-side validation support

### 📊 **Form Analytics**
Built-in tracking for user behavior, field interactions, page changes, completion rates, and abandonment analytics.

### 💾 **Form Persistence**
Auto-save to localStorage/sessionStorage with restoration, exclude sensitive fields, and debounced saves.

### 🎨 **Flexible Layouts**
Multiple layout options: Grid, Tabs, Accordion, Stepper, and custom layouts with wrapper components.

### 🚀 **Dynamic Text System**
Template strings with `{{fieldName}}` syntax for dynamic labels, descriptions, placeholders, and page titles.

## 📦 Installation

### Via shadcn CLI (Recommended)

```bash
npx shadcn@latest add formedible.dev/r/use-formedible.json
```

This will:
- Install the `useFormedible` hook
- Add all 25+ field components to your project
- Install required dependencies (@tanstack/react-form, zod, date-fns, etc.)
- Set up TypeScript definitions

### Manual Installation

If you prefer to install manually:

```bash
# Install peer dependencies
npm install @tanstack/react-form zod react react-dom

# Copy the components from the registry
# See registry.json for the complete list of files
```

## 🏃‍♂️ Quick Start

### Basic Contact Form

```tsx
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function ContactForm() {
  const { Form } = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },
      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
      { name: "message", type: "textarea", label: "Message", placeholder: "Your message..." },
    ],
    formOptions: {
      defaultValues: { name: "", email: "", message: "" },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle submission
      },
    },
  });

  return <Form />;
}
```

### Multi-Step Registration Form

```tsx
const registrationSchema = z.object({
  // Personal Info (Page 1)
  firstName: z.string().min(1),
  lastName: z.string().min(1),

  // Contact Details (Page 2)
  email: z.string().email(),
  phone: z.string().min(10),

  // Preferences (Page 3)
  notifications: z.boolean(),
  newsletter: z.boolean(),
});

export function RegistrationWizard() {
  const { Form } = useFormedible({
    schema: registrationSchema,
    fields: [
      // Page 1
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },

      // Page 2
      { name: "email", type: "email", label: "Email", page: 2 },
      { name: "phone", type: "phone", label: "Phone Number", page: 2 },

      // Page 3
      { name: "notifications", type: "switch", label: "Enable Notifications", page: 3 },
      { name: "newsletter", type: "checkbox", label: "Subscribe to Newsletter", page: 3 },
    ],
    pages: [
      { page: 1, title: "Personal Information", description: "Tell us about yourself" },
      { page: 2, title: "Contact Details", description: "How can we reach you {{firstName}}?" },
      { page: 3, title: "Preferences", description: "Customize your experience" },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        firstName: "", lastName: "", email: "", phone: "",
        notifications: true, newsletter: false,
      },
      onSubmit: async ({ value }) => {
        await submitRegistration(value);
      },
    },
  });

  return <Form />;
}
```

## 🎨 Available Field Types

| Field Type | Component | Description |
|-----------|-----------|-------------|
| `text` | TextField | Text input with subtypes (email, password, url, tel) |
| `textarea` | TextareaField | Multi-line text with word count |
| `number` | NumberField | Number input with min/max/step |
| `date` | DateField | Date picker with calendar and restrictions |
| `select` | SelectField | Dropdown selection |
| `combobox` | ComboboxField | Searchable dropdown with command palette |
| `multiSelect` | MultiSelectField | Multiple selection dropdown |
| `checkbox` | CheckboxField | Boolean checkbox |
| `switch` | SwitchField | Toggle switch |
| `radio` | RadioField | Radio button group |
| `slider` | SliderField | Range slider with custom visualizations |
| `rating` | RatingField | Star/heart/thumb rating component |
| `phone` | PhoneField | International phone input |
| `colorPicker` | ColorPickerField | Color picker with preview |
| `file` | FileUploadField | File upload with drag & drop |
| `array` | ArrayField | Dynamic array of fields with sorting |
| `object` | ObjectField | Nested object fields |
| `autocomplete` | AutocompleteField | Text input with suggestions |
| `location` | LocationPickerField | Map-based location picker |
| `duration` | DurationPickerField | Time duration input |
| `masked` | MaskedInputField | Formatted text input |
| `multicombobox` | MultiComboboxField | Multi-select combobox |

## 🧠 Advanced Features

### Conditional Fields

```tsx
fields: [
  { name: "userType", type: "select", options: ["individual", "business"] },
  {
    name: "companyName",
    type: "text",
    conditional: (values) => values.userType === "business"
  },
]
```

### Dynamic Options

```tsx
fields: [
  { name: "country", type: "select", options: ["us", "ca", "uk"] },
  {
    name: "state",
    type: "select",
    options: (values) => {
      if (values.country === "us") return ["CA", "NY", "TX"];
      if (values.country === "ca") return ["ON", "QC", "BC"];
      return [];
    }
  },
]
```

### Cross-Field Validation

```tsx
crossFieldValidation: [
  {
    fields: ["password", "confirmPassword"],
    validator: (values) => {
      if (values.password !== values.confirmPassword) {
        return "Passwords do not match";
      }
      return null;
    },
  },
]
```

### Async Validation

```tsx
asyncValidation: {
  username: {
    validator: async (value) => {
      const response = await fetch(`/api/check-username/${value}`);
      const { available } = await response.json();
      return available ? null : "Username is already taken";
    },
    debounceMs: 500,
  },
}
```

### Form Analytics

```tsx
analytics: {
  onFormStart: (timestamp) => console.log("Form started"),
  onPageChange: (from, to, timeSpent) => console.log(`Page ${from} → ${to}`),
  onFormComplete: (timeSpent, data) => console.log("Completed", timeSpent),
  onFieldError: (fieldName, errors) => console.log("Error", fieldName, errors),
}
```

### Form Persistence

```tsx
persistence: {
  key: "registration-form",
  storage: "localStorage",
  debounceMs: 1000,
  exclude: ["password"], // Don't persist sensitive fields
  restoreOnMount: true,
}
```

## 🏗️ Architecture

Formedible follows **TanStack Form v1 best practices**:

1. **Subscription Optimization** - Uses targeted selectors to minimize re-renders
2. **Conditional Rendering** - Efficient conditional field rendering
3. **Validation Patterns** - Proper sync and async validation with debouncing
4. **State Management** - Leverages TanStack Form's granular reactivity
5. **Performance** - Optimized subscription patterns prevent unnecessary re-renders

## 📖 Documentation

For complete documentation, visit: [formedible.dev/docs](https://formedible.dev/docs)

- [Getting Started](https://formedible.dev/docs/getting-started)
- [Field Types](https://formedible.dev/docs/fields)
- [Advanced Features](https://formedible.dev/docs/advanced-features)
- [API Reference](https://formedible.dev/docs/api)
- [Examples](https://formedible.dev/docs/examples)

## 🔧 Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Project Structure

```
packages/formedible/
├── src/
│   ├── hooks/
│   │   ├── use-formedible.tsx      # Main hook (2286 lines)
│   │   ├── use-field-state.ts
│   │   └── use-dropdown.ts
│   ├── components/
│   │   ├── formedible/
│   │   │   ├── fields/             # 25+ field components
│   │   │   └── layout/             # Layout components
│   │   └── ui/                     # shadcn/ui base components
│   ├── lib/
│   │   └── formedible/
│   │       ├── types.ts            # Type definitions (1403 lines)
│   │       ├── template-interpolation.ts
│   │       └── utils/
│   └── testing/
│       └── form-tester.tsx         # Testing utilities
├── registry.json                   # shadcn registry
└── package.json
```

## 🆚 Comparison with Alternatives

| Feature | Formedible | React Hook Form | Formik |
|---------|------------|-----------------|--------|
| Built-in Components | ✅ 25+ | ❌ | ❌ |
| Multi-page Forms | ✅ Built-in | ⚠️ Manual | ⚠️ Manual |
| Async Validation | ✅ Built-in | ✅ | ✅ |
| Form Analytics | ✅ Built-in | ❌ | ❌ |
| Form Persistence | ✅ Built-in | ❌ | ❌ |
| TypeScript Support | ✅ Full | ✅ Full | ⚠️ Good |
| Bundle Size | ⚠️ ~45KB | ✅ Small | ⚠️ Medium |
| Learning Curve | ✅ Easy | ⚠️ Medium | ⚠️ Medium |

## 🤝 Contributing

This is part of a monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes in `packages/formedible/`
4. Run tests: `npm run test:pkg`
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

Built on top of:
- [TanStack Form](https://tanstack.com/form) - Powerful form state management
- [Zod](https://zod.dev) - TypeScript-first schema validation
- [shadcn/ui](https://ui.shadcn.com) - Beautiful, accessible components
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components

## 🔗 Related Packages

- [@formedible/builder](../builder) - Visual form builder with drag-and-drop
- [@formedible/ai-builder](../ai-builder) - AI-powered form generation
- [@formedible/parser](../formedible-parser) - Safe form definition parser

---

**Formedible** - Making React forms delightful. 🚀
