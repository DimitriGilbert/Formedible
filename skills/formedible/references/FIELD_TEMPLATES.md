# Field Component Templates

Templates for creating new Formedible field types.

## Basic Field Template

Use this as starting point for simple field types:

```tsx
// packages/formedible/src/components/formedible/fields/my-field.tsx
import { type FieldApi } from "@tanstack/react-form";
import { BaseFieldWrapper } from "./base-field-wrapper";

export interface MyFieldConfig {
  // Add field-specific config here
  customOption?: string;
  maxLength?: number;
}

export interface MyFieldProps {
  fieldApi: FieldApi<any, any>;
  label?: string;
  description?: string;
  required?: boolean;
  fieldConfig?: MyFieldConfig;
  className?: string;
}

export function MyField({
  fieldApi,
  label,
  description,
  required,
  fieldConfig,
  className,
}: MyFieldProps) {
  return (
    <BaseFieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      required={required}
      className={className}
    >
      {(field) => (
        <input
          type="text"
          value={field.fieldApi.getValue() ?? ""}
          onChange={(e) => field.fieldApi.handleChange(e.target.value)}
          onFocus={() => field.fieldApi.eventHandlers.onFocus?.()}
          onBlur={() => field.fieldApi.eventHandlers.onBlur?.()}
          maxLength={fieldConfig?.maxLength}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
        />
      )}
    </BaseFieldWrapper>
  );
}
```

## Selection Field Template

For dropdown/select-style fields:

```tsx
import { normalizeOptions } from "@/lib/utils";

export function MySelectField({ fieldApi, options, ...props }: MySelectFieldProps) {
  const normalizedOptions = normalizeOptions(options);

  return (
    <BaseFieldWrapper {...props}>
      {(field) => (
        <select
          value={field.fieldApi.getValue() ?? ""}
          onChange={(e) => field.fieldApi.handleChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">Select...</option>
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </BaseFieldWrapper>
  );
}
```

## Boolean Field Template

For checkboxes and switches:

```tsx
export function MyCheckboxField({ fieldApi, label, ...props }: MyCheckboxFieldProps) {
  return (
    <BaseFieldWrapper {...props}>
      {(field) => (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={field.fieldApi.getValue() ?? false}
            onChange={(e) => field.fieldApi.handleChange(e.target.checked)}
            onFocus={() => field.fieldApi.eventHandlers.onFocus?.()}
            onBlur={() => field.fieldApi.eventHandlers.onBlur?.()}
            className="h-4 w-4 rounded border-input"
          />
          <span>{label}</span>
        </label>
      )}
    </BaseFieldWrapper>
  );
}
```

## Complex Field Template

For fields with multiple inputs or complex UI:

```tsx
import { useState } from "react";

export function MyComplexField({ fieldApi, fieldConfig, ...props }: MyComplexFieldProps) {
  const [localState, setLocalState] = useState(false);
  const value = fieldApi.getValue() ?? "";

  const handleChange = (newValue: string) => {
    fieldApi.handleChange(newValue);
    fieldApi.eventHandlers.onChange?.(newValue);
  };

  return (
    <BaseFieldWrapper {...props}>
      {(field) => (
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => field.fieldApi.eventHandlers.onFocus?.()}
            onBlur={() => field.fieldApi.eventHandlers.onBlur?.()}
            className="flex h-10 w-full rounded-md border border-input"
          />
          {fieldConfig?.showExtra && (
            <div className="text-sm text-muted-foreground">
              Additional UI here
            </div>
          )}
        </div>
      )}
    </BaseFieldWrapper>
  );
}
```

## Integration Steps

After creating a new field component:

### 1. Add Type Definition

```typescript
// packages/formedible/src/lib/formedible/types.ts

export interface FieldConfig {
  // ... existing props

  myFieldConfig?: {
    customOption?: string;
    maxLength?: number;
    showExtra?: boolean;
  };
}
```

### 2. Register Field Component

```typescript
// packages/formedible/src/lib/formedible/field-registry.tsx

import { MyField } from "@/components/formedible/fields/my-field";

export const FIELD_COMPONENTS = {
  // ... existing fields
  myField: MyField,
} as const;
```

### 3. Add to Registry

```json
// packages/formedible/registry.json
{
  "components": [
    {
      "name": "my-field",
      "registryDependencies": ["base-field-wrapper"],
      "files": [
        {
          "path": "src/components/formedible/fields/my-field.tsx",
          "content": "..."
        }
      ],
      "type": "components:formedible"
    }
  ]
}
```

### 4. Use in Form

```tsx
const { Form } = useFormedible({
  fields: [
    {
      name: "myField",
      type: "myField",
      label: "My Custom Field",
      myFieldConfig: {
        customOption: "value",
        maxLength: 100,
      },
    },
  ],
});
```

## Best Practices

1. **Always use BaseFieldWrapper** for consistent behavior
2. **Use eventHandlers** for analytics tracking
3. **Support dynamic options** with function form
4. **Handle undefined values** with `?? ""` or `?? false`
5. **Include proper TypeScript types**
6. **Follow existing patterns** - copy from similar fields
7. **Test with conditional rendering** and multi-page forms
8. **Support all common props** (label, description, required, className)
