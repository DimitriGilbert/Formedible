---
name: formedible
description: Expert knowledge for Formedible - A React form library built on TanStack Form with 22+ field types, multi-page forms, analytics, and type-safe validation
---

# Formedible Skill

Use this skill when:
- Creating or modifying Formedible forms
- Adding new field types to Formedible
- Debugging Formedible form issues
- Implementing advanced form features (conditional logic, dynamic options, cross-field validation)
- Working with form analytics, persistence, or multi-page/tabb layouts

## Quick Reference

### Basic Form Structure

```tsx
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const { Form } = useFormedible({
  schema,
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

### Field Type Quick Reference

| Type | Component | Use Case | Key Config |
|------|-----------|----------|------------|
| `text` | TextField | Text input | email, password, url, tel subtypes |
| `textarea` | TextareaField | Multi-line | rows, maxLength, showWordCount |
| `number` | NumberField | Numeric | min, max, step, precision |
| `email` | EmailField | Email validation | inlineValidation |
| `password` | PasswordField | Password with toggle | showStrengthIndicator |
| `date` | DateField | Date/time picker | dateConfig (disablePastDates, disabledDaysOfWeek) |
| `select` | SelectField | Dropdown | options (static or dynamic function) |
| `combobox` | ComboboxField | Searchable dropdown | comboboxConfig (searchable, placeholder) |
| `multicombobox` | MultiComboboxField | Multi-select searchable | comboboxConfig |
| `multiSelect` | MultiSelectField | Multi-select dropdown | multiSelectConfig (maxSelections, searchable) |
| `radio` | RadioField | Radio buttons | layout (horizontal/vertical) |
| `checkbox` | CheckboxField | Boolean checkbox | custom styling |
| `switch` | SwitchField | Toggle switch | smooth animations |
| `slider` | SliderField | Range slider | sliderConfig (min, max, step, valueMapping) |
| `rating` | RatingField | Star/heart/thumb rating | ratingConfig (icon, max, allowHalf) |
| `phone` | PhoneField | International phone | phoneConfig (format, defaultCountry) |
| `colorPicker` | ColorPickerField | Color selection | colorConfig (format, presetColors) |
| `file` | FileUploadField | File upload | fileConfig (maxSize, maxFiles, accept) |
| `array` | ArrayField | Dynamic field arrays | arrayConfig (itemType, minItems, maxItems, sortable) |
| `object` | ObjectField | Nested objects | objectConfig (fields, collapsible) |
| `autocomplete` | AutocompleteField | Autocomplete | autocompleteConfig (options, allowCustom, debounceMs) |
| `location` | LocationPickerField | Location/map | locationConfig (provider, apiKey) |
| `duration` | DurationPickerField | Time duration | durationConfig (format) |
| `masked` | MaskedInputField | Formatted input | maskedInputConfig (mask) |

## Core Concepts

### Dynamic Options

Options can be static arrays or functions that receive current form values:

```tsx
fields: [
  {
    name: "country",
    type: "select",
    options: [
      { value: "us", label: "United States" },
      { value: "ca", label: "Canada" },
    ],
  },
  {
    name: "state",
    type: "select",
    options: (values) => {
      if (values.country === "us") return usStates;
      if (values.country === "ca") return caProvinces;
      return [];
    },
  },
]
```

### Dynamic Text with Template Strings

Use `{{fieldName}}` syntax in labels, descriptions, titles:

```tsx
fields: [
  { name: "firstName", type: "text", label: "First Name", page: 1 },
  {
    name: "email",
    type: "email",
    label: "Email Address",
    description: "We'll contact you at {{firstName}}",
    page: 2,
  },
]

pages: [
  { page: 1, title: "Personal Information" },
  { page: 2, title: "Contact Details for {{firstName}}" },
]
```

For complex logic, use functions:

```tsx
{
  name: "greeting",
  type: "text",
  label: (values) => `Hello, ${values.firstName || "there"}!`,
}
```

### Conditional Field Rendering

```tsx
{
  name: "companyName",
  type: "text",
  label: "Company Name",
  conditional: (values) => values.userType === "business",
}
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
      return available ? null : "Username is taken";
    },
    debounceMs: 500,
  },
}
```

### Multi-Page Forms

```tsx
fields: [
  { name: "name", type: "text", page: 1 },
  { name: "email", type: "email", page: 1 },
  { name: "company", type: "text", page: 2 },
]

pages: [
  { page: 1, title: "Personal Info", description: "Tell us about yourself" },
  { page: 2, title: "Company Info", description: "Your organization" },
]

progress: {
  showSteps: true,
  showPercentage: true,
}
```

### Analytics Tracking

```tsx
analytics: {
  onFormStart: (timestamp) => console.log("Form started", timestamp),
  onPageChange: (from, to, timeSpent) => console.log(`Page ${from} → ${to}`),
  onFieldFocus: (fieldName, timestamp) => console.log("Field focused", fieldName),
  onFieldBlur: (fieldName, timeSpent) => console.log("Field completed", fieldName, timeSpent),
  onFormComplete: (timeSpent, data) => console.log("Form completed", { timeSpent, data }),
  onFormAbandon: (completion, context) => console.log("Form abandoned", completion),
}
```

### Form Persistence

```tsx
persistence: {
  key: "contact-form-draft",
  storage: "localStorage", // or "sessionStorage"
  debounceMs: 1000,
  exclude: ["password", "creditCard"], // Don't persist sensitive fields
  restoreOnMount: true,
}
```

## Architecture Patterns

### Field Component Structure

All field components follow this pattern:

```tsx
interface FieldComponentProps {
  fieldApi: FieldApi; // TanStack Form field API
  label?: string;
  description?: string;
  required?: boolean;
  // Field-specific props
}

export function MyField({ fieldApi, label, ...props }: FieldComponentProps) {
  const { getValue, setValue, getMeta, handleChange } = fieldApi;

  return (
    <div>
      <label>{label}</label>
      <input
        value={getValue()}
        onChange={(e) => handleChange(e.target.value)}
      />
      {getMeta().errors.map(error => (
        <span key={error}>{error}</span>
      ))}
    </div>
  );
}
```

### Event Handlers via fieldApi.eventHandlers

All fields have access to enhanced event handlers:

```tsx
fieldApi.eventHandlers.onFocus
fieldApi.eventHandlers.onBlur
fieldApi.eventHandlers.onChange
fieldApi.eventHandlers.onKeyDown
fieldApi.eventHandlers.onKeyUp
```

These include analytics tracking automatically when configured.

### Working with BaseFieldWrapper

Most field components use `BaseFieldWrapper` for consistent behavior:

```tsx
import { BaseFieldWrapper } from "./base-field-wrapper";

export function MyField(props: FieldComponentProps) {
  return (
    <BaseFieldWrapper {...props}>
      {(field) => (
        <input
          value={field.fieldApi.getValue()}
          onChange={(e) => field.fieldApi.handleChange(e.target.value)}
        />
      )}
    </BaseFieldWrapper>
  );
}
```

## Adding New Field Types

When adding a new field type:

1. Create component in `packages/formedible/src/components/formedible/fields/`
2. Use `BaseFieldWrapper` for consistency
3. Add field-specific config interface to `types.ts`
4. Register in `field-registry.tsx`
5. Add to registry.json in packages/formedible/

See [FIELD_TEMPLATES.md](references/FIELD_TEMPLATES.md) for templates.

## Critical Workflow Rules

**PACKAGES ARE THE SOURCE OF TRUTH**

1. **NEVER EDIT WEB APP FILES DIRECTLY**
   - ❌ Edit `/apps/web/src/components/formedible/...`
   - ✅ Edit `/packages/formedible/src/components/formedible/...`

2. **WORKFLOW:**
   - Edit package files → Build package → Run `scripts/quick-sync.js` → Build web app → Run `npm run sync-components`

3. **NEVER touch public/r/*.json files** - These are strictly forbidden

4. **Always use package manager** - Never manually edit package.json

## Build/Test Commands (FROM ROOT)

- `npm run build:pkg` - Build formedible package
- `npm run build:web` - Build web app
- `scripts/quick-sync.js` - Sync components to web app
- `npm run sync-components` - Sync using shadcn CLI

## Common Issues & Solutions

### Dynamic options not updating
- Ensure the function receives `values` parameter
- Check field dependencies are extracted correctly

### Validation not showing
- Ensure Zod schema matches field names
- Check `validation` config on individual fields

### Multi-page navigation issues
- Verify page numbers on fields match page definitions
- Check `pages` array is properly defined

### Analytics not firing
- Verify analytics config is set on useFormedible
- Check event handlers use `fieldApi.eventHandlers`

## File Structure Reference

```
packages/formedible/src/
├── components/formedible/
│   ├── fields/           # 22 field components
│   ├── layout/           # FormGrid, FormTabs, FormAccordion, FormStepper
│   ├── form.tsx          # Main Form component
│   └── ui/               # Radix UI primitives
├── hooks/
│   └── use-formedible.tsx  # Main hook
├── lib/formedible/
│   ├── types.ts          # All TypeScript interfaces
│   ├── template-interpolation.ts
│   ├── field-registry.tsx
│   └── utils.ts
└── testing/
    └── index.ts          # Form testing utilities
```

## Advanced Configuration

### Sectioned Forms

```tsx
{
  name: "address",
  type: "object",
  objectConfig: {
    fields: [
      { name: "street", type: "text", label: "Street" },
      { name: "city", type: "text", label: "City" },
    ],
    collapsible: true,
    collapsed: false,
  },
}
```

### Array Fields with Nested Objects

```tsx
{
  name: "teamMembers",
  type: "array",
  arrayConfig: {
    itemType: "object",
    itemLabel: "Team Member",
    minItems: 1,
    maxItems: 10,
    sortable: true,
    fields: [
      { name: "name", type: "text", label: "Name" },
      { name: "role", type: "select", options: [...] },
    ],
  },
}
```

### Tabbed Layouts

```tsx
tabs: [
  {
    id: "personal",
    label: "Personal Info",
    fields: ["name", "email", "phone"],
  },
  {
    id: "professional",
    label: "Professional",
    fields: ["company", "role", "experience"],
  },
]
```

## Type Safety Best Practices

Always infer types from Zod schema:

```tsx
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type FormValues = z.infer<typeof schema>;

const { Form } = useFormedible<FormValues>({
  schema,
  formOptions: {
    defaultValues: {
      name: "",  // Fully typed
      age: 0,    // Fully typed
    },
  },
});
```
