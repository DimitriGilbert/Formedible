# Formedible Debugging Guide

Quick reference for debugging common Formedible issues.

## Diagnostics Commands

```bash
# Check if package is built
ls -la packages/formedible/dist

# Sync components to web app
node scripts/quick-sync.js

# Rebuild everything
npm run build

# Check registry.json
cat packages/formedible/registry.json | grep "your-field-name"
```

## Common Issues & Solutions

### Issue: Field not rendering

**Symptoms:** Field doesn't appear in the form

**Checks:**
1. Field is registered in `field-registry.tsx`
2. Field type in config matches registry key exactly
3. Field is exported from index
4. Component exists in correct path

**Fix:**
```typescript
// Check field-registry.tsx
export const FIELD_COMPONENTS = {
  myField: MyField, // Must match type: "myField"
} as const;

// Check usage
{ name: "myField", type: "myField" } // Must match registry
```

### Issue: Dynamic options not updating

**Symptoms:** Select options don't change when dependent field changes

**Checks:**
1. Options function receives `values` parameter
2. Function is not memoized incorrectly
3. Dependencies are extracted correctly

**Fix:**
```tsx
// ❌ Wrong - static options
options: [{ value: "a", label: "A" }]

// ✅ Correct - dynamic options
options: (values) => {
  if (values.category === "tech") return techOptions;
  return [];
}
```

### Issue: Validation not showing

**Symptoms:** Errors don't display when validation fails

**Checks:**
1. Zod schema field names match form field names exactly
2. Validation mode is set (default: onSubmit)
3. Error meta is being accessed correctly

**Fix:**
```typescript
// Check schema matches fields
const schema = z.object({
  emailAddress: z.string().email(), // ❌ Wrong name
  email: z.string().email(), // ✅ Correct - matches field name
});

// Check field config
{ name: "email", type: "email" } // ✅ Matches schema
```

### Issue: Multi-page navigation not working

**Symptoms:** Next/Previous buttons don't work or show wrong fields

**Checks:**
1. Page numbers are sequential starting from 1
2. All fields on a page have the same page number
3. Pages array matches page numbers
4. `visiblePages` is being computed correctly

**Fix:**
```tsx
// ✅ Correct - pages start at 1
fields: [
  { name: "name", page: 1 },
  { name: "email", page: 1 },
  { name: "company", page: 2 },
]

pages: [
  { page: 1, title: "Personal" },
  { page: 2, title: "Company" },
]
```

### Issue: Analytics not firing

**Symptoms:** Analytics callbacks not being triggered

**Checks:**
1. Analytics config is set on useFormedible
2. Event handlers use `fieldApi.eventHandlers`
3. Analytics callbacks are configured for the events you need

**Fix:**
```tsx
// ✅ Use eventHandlers for field events
fieldApi.eventHandlers.onFocus?.()
fieldApi.eventHandlers.onBlur?.()
fieldApi.eventHandlers.onChange?.(value)

// ✅ Configure analytics
analytics: {
  onFieldFocus: (fieldName, timestamp) => {
    console.log("Focused:", fieldName);
  },
}
```

### Issue: Persistence not saving

**Symptoms:** Form data not saved to localStorage

**Checks:**
1. Storage key is unique
2. Browser has localStorage available
3. No sensitive fields in exclude array
4. restoreOnMount is set if auto-restore needed

**Fix:**
```tsx
persistence: {
  key: "unique-form-key", // ✅ Unique across forms
  storage: "localStorage",
  exclude: ["password"], // ✅ Exclude sensitive fields
  restoreOnMount: true, // ✅ Auto-restore on load
}
```

### Issue: Conditional fields always hidden

**Symptoms:** Conditional fields never show even when condition is met

**Checks:**
1. Conditional function returns boolean (not undefined)
2. Function receives `values` parameter
3. Referenced fields have values when checking

**Fix:**
```tsx
// ❌ Wrong - returns undefined
conditional: (values) => {
  if (values.type === "premium") return true;
}

// ✅ Correct - returns boolean
conditional: (values) => values.type === "premium"
```

### Issue: Template strings not interpolating

**Symptoms:** `{{fieldName}}` shows as literal text instead of value

**Checks:**
1. Template syntax is correct: `{{fieldName}}`
2. Field being referenced exists and has a value
3. Field is in dependencies list (automatic for most cases)

**Fix:**
```tsx
// ✅ Correct syntax
{
  name: "email",
  description: "Contact {{firstName}} at {{email}}", // ✅ Valid
}
```

### Issue: Cross-field validation not running

**Symptoms:** Cross-field errors never show

**Checks:**
1. All fields in validation exist
2. Validator function returns string (error) or null
3. Validation is triggered (onSubmit, onChange, etc.)

**Fix:**
```tsx
crossFieldValidation: [
  {
    fields: ["password", "confirmPassword"], // ✅ Both fields exist
    validator: (values) => {
      if (values.password !== values.confirmPassword) {
        return "Passwords do not match"; // ✅ Returns error string
      }
      return null; // ✅ Returns null when valid
    },
  },
]
```

### Issue: Async validation stuck loading

**Symptoms:** Loading state never clears

**Checks:**
1. Validator function returns a value (never undefined)
2. Debounce is not too long
3. No network errors in console

**Fix:**
```tsx
asyncValidation: {
  username: {
    validator: async (value) => {
      if (!value) return null; // ✅ Handle empty case

      try {
        const response = await fetch(`/api/check/${value}`);
        const data = await response.json();
        return data.available ? null : "Taken"; // ✅ Always return
      } catch {
        return "Failed to check"; // ✅ Handle errors
      }
    },
    debounceMs: 500, // ✅ Reasonable debounce
  },
}
```

### Issue: TypeScript errors on form values

**Symptoms:** Type errors when accessing form values

**Checks:**
1. Generic type parameter matches schema
2. DefaultValues match schema type
3. Schema is properly inferred

**Fix:**
```tsx
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type FormValues = z.infer<typeof schema>;

const { Form } = useFormedible<FormValues>({ // ✅ Generic type
  schema,
  formOptions: {
    defaultValues: {
      name: "", // ✅ Matches schema
      age: 0, // ✅ Matches schema
    },
    onSubmit: async ({ value }) => {
      console.log(value.name); // ✅ Type-safe access
    },
  },
});
```

## Debug Mode

Enable debug logging in useFormedible:

```tsx
const { Form } = useFormedible({
  // ... config
  // Add temporary logging
  formOptions: {
    onSubmit: async ({ value, formApi }) => {
      console.log("Form value:", value);
      console.log("Form state:", formApi.state);
      console.log("Field meta:", formApi.getFieldMeta("fieldName"));
    },
  },
});
```

## Performance Debugging

Check for unnecessary re-renders:

```tsx
// Add React DevTools Profiler
// Look for fields re-rendering when unrelated fields change

// Common cause: Not using TanStack Form selectors
// ❌ Bad - subscribes to entire state
<form.Subscribe>
  {(state) => <div>{state.canSubmit}</div>}
</form.Subscribe>

// ✅ Good - subscribes only to canSubmit
<form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit })}>
  {({ canSubmit }) => <div>{canSubmit}</div>}
</form.Subscribe>
```

## Getting Field Info

Inspect field state and metadata:

```tsx
// In your component
const form = useFormedible({ /* config */ });

// Log field info
console.log("Field value:", form.form.getFieldValue("fieldName"));
console.log("Field meta:", form.form.getFieldMeta("fieldName"));
console.log("Field errors:", form.form.getFieldInfo("fieldName").validationMeta.errors);
```

## Browser Console Commands

Open browser console and run:

```javascript
// Check localStorage
console.log(JSON.parse(localStorage.getItem("your-form-key")));

// Check form state (add this temporarily to component)
useEffect(() => {
  console.log("Form state:", form.state);
}, [form.state]);
```
