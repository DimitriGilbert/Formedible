# Dynamic Text Implementation Plan for Formedible

## EXISTING ANALYSIS

### What Already Exists ✅

1. **Template Interpolation System** (`template-interpolation.ts`)

   - `extractTemplateDependencies()` - extracts field dependencies
   - `interpolateTemplate()` - resolves {{fieldName}} syntax
   - `resolveDynamicText()` - handles strings and functions
   - `getDynamicTextDependencies()` - gets optimization targets
   - Full formatter support (uppercase, currency, date, etc.)

2. **DynamicTextRenderer Component** (`dynamic-text-renderer.tsx`)
   - Performance-optimized with dependency-based subscriptions
   - Uses optimized selectors for minimal re-renders
   - Supports both template strings and functions
   - Already handles fallbacks and edge cases

### What's Missing ❌

1. **Type Definitions** in `types.ts`

   - No `DynamicText` type exported
   - No `OptionalDynamicText` type exported
   - FieldConfig still uses `string` for labels/descriptions

2. **Integration** in `use-formedible.tsx`
   - renderField doesn't use DynamicTextRenderer
   - Still treats labels/descriptions as static strings
   - Missing dynamic text resolution in field rendering

## MINIMAL IMPLEMENTATION REQUIRED

### Step 1: Add Missing Types to `types.ts`

```typescript
// Add these types:
export type DynamicText =
  | string
  | ((values: Record<string, unknown>) => string);
export type OptionalDynamicText = DynamicText | undefined;

// Update FieldConfig interface:
export interface FieldConfig {
  // Change from string? to DynamicText?
  label?: DynamicText;
  placeholder?: DynamicText;
  description?: DynamicText;
  // ... rest unchanged
}
```

### Step 2: Update `use-formedible.tsx` renderField

Replace static label/description rendering with DynamicTextRenderer:

```typescript
// In renderField function, replace:
const baseProps = {
  fieldApi: field,
  label, // static string
  description, // static string
  // ...
};

// With:
const resolvedLabel = label ? (
  <DynamicTextRenderer
    text={label}
    form={form}
    templateOptions={templateOptions}
  >
    {(text) => text}
  </DynamicTextRenderer>
) : undefined;

const resolvedDescription = description ? (
  <DynamicTextRenderer
    text={description}
    form={form}
    templateOptions={templateOptions}
  >
    {(text) => text}
  </DynamicTextRenderer>
) : undefined;

const baseProps = {
  fieldApi: field,
  label: resolvedLabel,
  description: resolvedDescription,
  // ...
};
```

## PERFORMANCE OPTIMIZATION ALREADY IMPLEMENTED

The existing DynamicTextRenderer already uses:

- `getDynamicTextDependencies()` to extract field dependencies
- Optimized subscription that only listens to specific fields
- Shallow equality to prevent unnecessary re-renders
- Early returns for static text

## TOTAL WORK REQUIRED

1. **Add 3 lines** to `types.ts` for type exports
2. **Update FieldConfig interface** (3 field type changes)
3. **Modify renderField function** in `use-formedible.tsx` (replace static label/description with DynamicTextRenderer)

## ESTIMATED EFFORT

- **5 minutes** to add types
- **10 minutes** to integrate DynamicTextRenderer in renderField
- **5 minutes** for testing

**Total: 20 minutes of actual work**

## FILES TO MODIFY

1. `/packages/formedible/src/lib/formedible/types.ts` (ADD types)
2. `/packages/formedible/src/hooks/use-formedible.tsx` (USE DynamicTextRenderer)

## FILES ALREADY COMPLETE ✅

1. `/packages/formedible/src/lib/formedible/template-interpolation.ts`
2. `/packages/formedible/src/components/formedible/dynamic-text-renderer.tsx`

## quick doc for subscriptions

I’ve got you. Here’s a clear, practical guide to subscriptions in the latest TanStack Form (v1+), with patterns you can use right now for high-performance React forms.

Key takeaway: You don’t need a <Subscribe> component anymore. You either subscribe via the store (low-level) or use the React-friendly hooks that select exactly what you need.

1. The three ways to “subscribe”

- form.useStore(selector)

  - React hook that re-renders your component when the selected slice changes.
  - Best for most React components.

  Example:
  const values = form.useStore((state) => state.values);
  const isSubmitting = form.useStore((state) => state.isSubmitting);

- form.store.subscribe(listener)

  - Low-level subscription. The listener receives the entire form state (FormState).
  - You control what to do with it, typically updating local useState/useRef.
  - No selector parameter here. You must pick the slice you want inside the listener.

  Example:
  React.useEffect(() => {
  const unsub = form.store.subscribe((state) => {
  // state is the full FormState
  doSomethingWith(state.values);
  });
  return unsub;
  }, [form]);

- form.subscribe(selector, listener) — only if your FormApi exposes this

  - Some setups expose a convenience method form.subscribe that accepts a selector and listener (depends on your FormApi typing; if it’s not there, use form.useStore or form.store.subscribe).
  - If available, it avoids re-renders except when the selected slice changes, similar to useStore but not a React hook.

  Example (only if supported):
  React.useEffect(() => {
  if (!form.subscribe) return;
  const unsub = form.subscribe(
  (state) => state.values,
  (values) => setValues(values)
  );
  return unsub;
  }, [form]);

2. What does “subscribe” get you?

- Fine-grained updates: Only re-render or update when the slice you selected changes.
- Perf wins: Avoids prop-drilling or whole-form renders.
- Works great for conditional UI, large forms, and async validations.

3. Choosing the right pattern

- Want React reactivity with minimal fuss? use form.useStore(selector).
- Want to avoid React re-renders until you want them? Use form.store.subscribe in useEffect and push to a ref or debounced state.
- Want a <Subscribe>-style syntax? Wrap useStore in your own small component (demo below).

4. Practical patterns and examples

A. Conditional field rendering with useStore (React hook)

- Renders this field only if a condition is met, updates when values change.

function ConditionalField({ form, fieldConfig, render }) {
const values = form.useStore((s) => s.values);
const shouldRender = fieldConfig.conditional
? fieldConfig.conditional(values)
: true;
if (!shouldRender) return null;
return render(values);
}

B. Manual subscribe with useEffect (no re-render until you decide)

- You can debounce updates or only update when a sub-path changes.

function SubscribedValuesView({ form }) {
const [values, setValues] = React.useState(() => form.state.values);

React.useEffect(() => {
const unsub = form.store.subscribe((state) => {
// Full state received here
const nextValues = (state as any).values;
setValues(nextValues);
});
return unsub;
}, [form]);

return <pre>{JSON.stringify(values, null, 2)}</pre>;
}

C. Subscribe to a specific slice with shallow compare (custom)

- If your form.store supports derived selectors internally, use useStore. For manual subscribe, do your own shallowCompare to avoid unnecessary updates.

function shallowEqual(a: any, b: any) {
if (Object.is(a, b)) return true;
if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
const ak = Object.keys(a);
const bk = Object.keys(b);
if (ak.length !== bk.length) return false;
for (const k of ak) {
if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], b[k])) {
return false;
}
}
return true;
}

function useSubscribedSlice<T>(
form: any,
selector: (state: any) => T,
initial?: T
) {
const [slice, setSlice] = React.useState<T>(() =>
initial !== undefined ? initial : selector(form.state)
);

React.useEffect(() => {
let prev = selector(form.state);
setSlice(prev);
const unsub = form.store.subscribe((state: any) => {
const next = selector(state);
if (!shallowEqual(prev, next)) {
prev = next;
setSlice(next);
}
});
return unsub;
}, [form, selector]);

return slice;
}

// Usage
function MyComponent({ form }) {
const canSubmit = useSubscribedSlice(form, (s) => s.canSubmit);
const emailError = useSubscribedSlice(form, (s) => s.errors?.email);
return (

<div>
<button disabled={!canSubmit}>Submit</button>
{emailError?.length ? <div>{emailError[0]?.message}</div> : null}
</div>
);
}

D. Recreating a <Subscribe> component ( ergonomic sugar )

- Provide a component that takes selector and children.

function FormSubscribe<T>({
form,
selector,
children,
}: {
form: any;
selector: (state: any) => T;
children: (selected: T) => React.ReactNode;
}) {
const selected = form.useStore(selector);
return <>{children(selected)}</>;
}

// Usage
<FormSubscribe form={form} selector={(s) => s.values}>
{(values) => <pre>{JSON.stringify(values, null, 2)}</pre>}
</FormSubscribe>

E. Subscribing to a specific field’s state

- TanStack Form provides field-level APIs. If you have fieldApi, you can subscribe per field.

function FieldValue({ fieldApi }: { fieldApi: any }) {
const value = fieldApi.useStore((s: any) => s.value);
const errors = fieldApi.useStore((s: any) => s.errors);
return (

<div>
<div>Value: {String(value)}</div>
{errors?.length ? <div>Error: {errors[0]?.message}</div> : null}
</div>
);
}

F. Conditional sections without re-render storms

- Subscribe to only what you need for each region.

function ConditionalSection({
form,
condition,
children,
}: {
form: any;
condition: (values: any) => boolean;
children: React.ReactNode;
}) {
const values = form.useStore((s: any) => s.values);
if (!condition(values)) return null;
return <>{children}</>;
}

G. Debouncing and batching with manual subscribe

- Useful if your values update rapidly (e.g., typed inputs) and you don’t want to re-render constantly.

function DebouncedValues({ form, delay = 150 }: { form: any; delay?: number }) {
const [values, setValues] = React.useState(() => form.state.values);
const timer = React.useRef<number | null>(null);

React.useEffect(() => {
const unsub = form.store.subscribe((state: any) => {
const next = state.values;
if (timer.current) window.clearTimeout(timer.current);
timer.current = window.setTimeout(() => {
setValues(next);
}, delay);
});
return () => {
if (timer.current) window.clearTimeout(timer.current);
unsub();
};
}, [form, delay]);

return <pre>{JSON.stringify(values, null, 2)}</pre>;
}

5. Common pitfalls and how to avoid them

- Don’t pass generics to form.store.subscribe
  - It does not accept generics or a selector. The listener parameter receives the full state. Extract .values yourself.
- Avoid subscribing to too-large slices with useStore
  - If you select state.values directly, the component re-renders whenever any value changes. If that’s too broad, select a sub-path: (s) => s.values.user or (s) => s.values.email.
- Don’t mutate state in subscribe
  - Listeners must be pure; only read state and push to your component state or refs.
- Memoize selectors where necessary
  - If you derive data from values, use memoization to avoid recomputing on every render.
- Put subscriptions in stable components
  - Subscribing in fast-mount/unmount children can cause churn. Prefer placing subscriptions in stable parents and passing derived props down.

6. Migrating from <form.Subscribe>

- Old pattern:
  <form.Subscribe selector={(state) => state.values}>
  {(values) => <div>{JSON.stringify(values)}</div>}
  </form.Subscribe>

- New options:

  - React hook:
    const values = form.useStore((s) => s.values);
    return <div>{JSON.stringify(values)}</div>;

  - Manual subscribe:
    React.useEffect(() => {
    const unsub = form.store.subscribe((state) => {
    setValues((state as any).values);
    });
    return unsub;
    }, [form]);

7. Recommended patterns per scenario

- Conditional rendering per field: use form.useStore((s) => s.values) locally in that field’s component. If values is too broad, pick the sub-object you care about.
- Analytics, perf tracking, logging: use form.store.subscribe in a top-level effect and push events to your analytics system.
- Rendering a massive list of fields: use useStore with specific slices and memoize field components. Consider React.memo and selecting only the exact pieces used by each field.

8. Minimal reference implementations

useFormSubscribe hook (manual subscribe with equality check)
function useFormSubscribe<T>(
form: any,
selector: (state: any) => T,
isEqual: (a: T, b: T) => boolean = Object.is
) {
const [selected, setSelected] = React.useState<T>(() => selector(form.state));
React.useEffect(() => {
let prev = selector(form.state);
setSelected(prev);
const unsub = form.store.subscribe((state: any) => {
const next = selector(state);
if (!isEqual(prev, next)) {
prev = next;
setSelected(next);
}
});
return unsub;
}, [form, selector, isEqual]);
return selected;
}

Field-level subscribe component
function FieldSubscribe({
fieldApi,
children,
}: {
fieldApi: any;
children: (state: any) => React.ReactNode;
}) {
const state = fieldApi.useStore((s: any) => s);
return <>{children(state)}</>;
}

9. Troubleshooting

- Error: Expected 0 type arguments, but got 1 for subscribe
  - Remove generics and selector; pass only a listener function. Extract state.values inside.
- Error: Property 'values' does not exist on type ListenerValue<...>
  - You’re likely using the two-arg subscribe signature. Switch to a single listener subscribe and read state.values inside.
- Fields still re-render too much
  - Narrow your selector (e.g., select s.values.user.email instead of s.values).
  - Use React.memo on field components.
  - Consider manual subscribe plus shallow equality.

10. TL;DR recipes

- Easiest: const v = form.useStore((s) => s.values);
- Ultra perf: subscribe once, derive what you need, update local state/ref:
  React.useEffect(() => {
  const unsub = form.store.subscribe((state) => {
  ref.current = state.values; // or debounced setState
  });
  return unsub;
  }, [form]);

If you share your exact FormApi typing (or a repo link), I can tailor the subscription utilities to your exact types so you don’t need any casts.
