# Formedible From-Scratch Rewrite Plan

## What This Is

A complete rewrite of Formedible. NOT a refactor. We throw away every line and start fresh.

This plan targets a **new repository**, not this current npm workspace. The new repository will be scaffolded by the user with **Better-T-Stack** and will use **pnpm** as the package manager. This current repo is only a reference implementation and a source of compatibility fixtures.

**The identity**: Formedible is a **thin shadcn component library on top of TanStack Form**. You declare fields, it renders them. That's it. It is NOT a form library.

**The contract**: 100% backward compatibility with the existing `FieldConfig` and `UseFormedibleOptions` schemas as inputs to `useFormedible`. Existing form definitions must work unchanged and render the same functional form.

**What is not sacred**: old internal file structure, old renderer exports, old field component public exports, copied package internals, debug return helpers, custom validation state, and any implementation detail that only exists because the current codebase accreted tech debt.

---

## Clean-Room Repo Rules

### New Repo, Not In-Place Refactor

The rewrite happens in a fresh Better-T-Stack pnpm monorepo scaffolded by the user. Do not implement this plan by editing the current repo package-by-package. That will invite refactor thinking and preserve the wrong shapes.

Current repo usage is limited to:
- extracting schemas and examples into compatibility fixtures
- reading behavior to understand expected form rendering
- porting small audited algorithms where the behavior is valuable
- comparing parser/builder/AI output shapes

### pnpm Dependency Policy

Use pnpm workspaces with a single source of truth for dependency versions. Prefer `catalogs`, workspace-level dependency policy, or overrides so shared dependencies are not scattered across package manifests.

Required shared versions must be identical across packages:
- `@tanstack/react-form`
- `react`
- `react-dom`
- `zod`
- shadcn/Radix dependencies used by synced components
- shared utility dependencies used by copied shadcn files

Any new dependency must be justified by a concrete component or package need and added through the workspace-level dependency policy. No package-local version drift.

### No Old File Copying

Do not copy old implementation files into the new repo.

Forbidden to copy:
- old `use-formedible.tsx`
- old `types.ts`
- old `shared-field-renderer.tsx`
- old `field-registry.tsx`
- old synced component trees
- old package structures

Allowed ports are narrow behavior ports only, rewritten into the new architecture and covered by compatibility tests:
- template interpolation behavior
- parser sanitization rules
- Zod expression parsing cases
- code generation behavior
- field-specific domain logic such as location search/rendering, color formatting, duration arithmetic, and array sorting

---

## What Changes

### The Sync Script (KEEP — It's a shadcn component)

This is a **shadcn component library**. Shadcn components are files you own, installed by copying into your project — not npm packages you import. The sync script is the correct architecture for this.

What changes is **what gets synced**. Currently the sync copies god files (2,286-line `use-formedible.tsx`, 1,402-line `types.ts`, duplicate registries). After the rewrite, the sync copies clean, small, well-organized modules (~100-150 lines each). The sync script itself gets simpler because the source tree is sane.

The sync flow stays:
```
packages/formedible/src/          → canonical shadcn source
    sync-to → packages/builder/src/components/formedible/
    sync-to → packages/ai-builder/src/components/formedible/
    sync-to → packages/formedible-parser/src/components/formedible/
    sync-to → apps/web/src/components/formedible/
```

Logic-only code (parser class, builder store, AI integration) also syncs as shadcn files — they just live in their own directories within the consumer packages, same as the UI components.

### The God File (ELIMINATE)

`use-formedible.tsx` (2,286 lines) is dead. The new `useFormedible` hook will be ~150 lines. It creates a TanStack form and returns a `Form` component plus the small stable API defined in this plan. Every other concern it currently handles moves to its own module.

### The God Types File (ELIMINATE)

`types.ts` (1,402 lines) is dead. Types split by domain. No more single file with 88 interfaces.

### Duplicate Field Registries (ELIMINATE)

There are currently TWO registries with INCONSISTENT keys (`multiselect` vs `multiSelect`, `color` vs `colorPicker`). One registry. One source of truth.

### Duplicate SharedFieldRenderer / NestedFieldRenderer (ELIMINATE)

These are 90% identical (~200 lines of duplication in one file). Gone. One `FieldRenderer` component.

### Custom InlineValidationWrapper (ELIMINATE)

The current code has a custom `inline-validation-wrapper.tsx` (175 lines) that reinvents debounced async validation. TanStack Form has this built in via `validators.onChangeAsync` + `asyncDebounceMs`. We use TanStack's native validation instead of rolling our own.

### Custom Cross-Field Validation State (ELIMINATE)

The current code manages custom `crossFieldErrors` state, a `validateCrossFields` callback, and a subscription that triggers on value change. TanStack Form has form-level `validators.onChange` that natively accesses all field values. We map `crossFieldValidation` config to TanStack's form-level validators. Zero custom state.

### Custom Async Validation State (ELIMINATE)

The current code manages custom `asyncValidationStates` state, abort controllers, and debounce timeouts. TanStack Form has `validators.onChangeAsync` + `asyncDebounceMs` per field. We map `asyncValidation` config to TanStack's native async validators. Zero custom state.

### The Copy-Paste Boilerplate in Every Field (ELIMINATE)

Every field repeats the same 10 lines of state extraction (`name`, `value`, `isDisabled`, `hasErrors`, `onBlur`, computed className). A shared `useFieldState()` hook replaces all of it.

### Dead Props (IMPLEMENT PROPERLY)

`schema`, `title`, `description`, `resetOnSubmitSuccess` are declared in the current interface but never actually used. In the rewrite, they get real implementations:
- `schema` — used for form-level Zod validation (passed to TanStack Form's `validators`)
- `title` — rendered as a form heading
- `description` — rendered as form description text
- `resetOnSubmitSuccess` — resets form values to defaults after successful submission only when explicitly true

### Keep `Form` Behavior, Shrink The Internals

The current implementation exposes a `Form` component from `useFormedible`, and that public behavior should keep working the same way for consumers.

The rewrite should reduce the size and responsibility of the current implementation. Internal rendering logic may be extracted into smaller modules, but the plan must not invent a new consumer-facing `Form` contract just to satisfy internal purity preferences.

---

## Architecture Overview

```
packages/formedible/src/
├── index.ts                          # Public API exports
├── types/
│   ├── index.ts                      # Re-exports all types
│   ├── field-config.ts               # FieldConfig, DynamicText, FieldOption
│   ├── form-config.ts                # UseFormedibleOptions, FormProps, PageConfig, TabConfig
│   ├── field-props.ts                # BaseFieldProps + per-type props (compact)
│   ├── analytics.ts                  # FormAnalytics, PageAnalyticsState, etc.
│   ├── persistence.ts                # PersistenceConfig
│   ├── validation.ts                 # CrossFieldValidation, AsyncValidation, InlineValidationConfig
│   └── layout.ts                     # LayoutConfig, SectionConfig, GridConfig
├── hooks/
│   ├── use-formedible.ts             # Main hook (~150 lines)
│   ├── use-field-state.ts            # Shared field state extraction (~30 lines)
│   ├── use-form-persistence.ts       # Persistence hook (~60 lines)
│   ├── use-form-analytics.ts         # Analytics hook (~150 lines)
│   ├── use-multi-page.ts             # Multi-page navigation (~120 lines)
│   └── use-form-tabs.ts              # Tab management (~60 lines)
├── components/
│   ├── form.tsx                      # Form component (~100 lines)
│   ├── field-renderer.tsx            # Maps FieldConfig → form.Field → component (~120 lines)
│   ├── conditional-field.tsx         # Conditional visibility wrapper (~30 lines)
│   ├── section-renderer.tsx          # Section/group rendering (~120 lines)
│   ├── content-renderer.tsx          # Page/tab content orchestration (~100 lines)
│   ├── progress.tsx                  # Multi-page progress bar (~40 lines)
│   ├── navigation.tsx                # Prev/Next/Submit buttons (~60 lines)
│   ├── fields/                       # 20 distinct field components + registry + wrapper + help
│   │   ├── index.ts                  # Re-exports all fields + registry
│   │   ├── field-registry.ts         # type → component map (one map, one truth)
│   │   ├── field-wrapper.tsx         # Label + description + errors (~40 lines)
│   │   ├── field-help.tsx            # Help text + tooltip (~40 lines)
│   │   ├── text-field.tsx
│   │   ├── textarea-field.tsx
│   │   ├── number-field.tsx
│   │   ├── select-field.tsx
│   │   ├── multi-select-field.tsx
│   │   ├── combobox-field.tsx
│   │   ├── multicombobox-field.tsx
│   │   ├── checkbox-field.tsx
│   │   ├── switch-field.tsx
│   │   ├── radio-field.tsx
│   │   ├── slider-field.tsx
│   │   ├── rating-field.tsx
│   │   ├── date-field.tsx
│   │   ├── file-upload-field.tsx
│   │   ├── color-picker-field.tsx
│   │   ├── phone-field.tsx
│   │   ├── duration-picker-field.tsx
│   │   ├── location-picker-field.tsx
│   │   ├── array-field.tsx
│   │   └── object-field.tsx
│   └── layout/
│       ├── form-grid.tsx
│       ├── form-tabs.tsx
│       ├── form-accordion.tsx
│       └── form-stepper.tsx
├── lib/
│   ├── utils.ts                      # cn()
│   ├── resolve-dynamic-text.ts       # Template interpolation (~100 lines)
│   ├── normalize-options.ts          # Option normalization (~20 lines)
│   └── colors.ts                     # Color utilities
└── testing/
    └── index.ts                      # Test utilities
```

**Target total: ~3,000-4,000 lines** (down from ~12,000 in the current formedible package)

---

## Module Design

### 1. `useFormedible` — The Main Hook (~150 lines)

**Responsibility**: Create a TanStack form, return the current-compatible Form surface + navigation API.

```typescript
export function useFormedible<TFormValues>(options: UseFormedibleOptions<TFormValues>) {
  // 1. Build TanStack form validators from our config
  const formValidators = useMemo(() => buildFormValidators(options), [options])
  const fieldValidators = useMemo(() => buildFieldValidators(options), [options])

  // 2. Create TanStack form via useForm()
  const form = useForm({
    defaultValues: options.formOptions?.defaultValues,
    onSubmit: options.formOptions?.onSubmit,
    onSubmitInvalid: options.formOptions?.onSubmitInvalid,
    validators: formValidators, // cross-field validation mapped here
  })

  // 3. Merge field component registry with user overrides
  const fieldComponents = useMemo(() => ({
    ...defaultFieldComponents,
    ...options.defaultComponents,
  }), [options.defaultComponents])

  // 4. Multi-page state (only if pages are used)
  const multiPage = useMultiPage(options, form)

  // 5. Tab state (only if tabs are used)
  const tabs = useFormTabs(options, form)

  // 6. Persistence (only if configured)
  const persistence = useFormPersistence(options.persistence, form)

  // 7. Analytics (only if configured)
  const analytics = useFormAnalytics(options.analytics, form, multiPage, tabs)

  // 8. Return
  return {
    form,
    Form: (props) => (
      <FormComponent
        form={form}
        options={options}
        fieldComponents={fieldComponents}
        fieldValidators={fieldValidators}
        multiPage={multiPage}
        tabs={tabs}
        analytics={analytics}
        {...props}
      />
    ),
    ...multiPage.api,      // currentPage, totalPages, goToNextPage, etc.
    ...persistence.api,    // saveToStorage, loadFromStorage, clearStorage
  }
}
```

**What changed**: The hook no longer contains a giant rendering implementation, subscriptions, or ad hoc event plumbing. It orchestrates sub-hooks and preserves the current-compatible `Form` usage surface.

### 2. `FormComponent` — Internal Form Shell (~100 lines)

**Responsibility**: Render the `<form>` element, delegate content rendering.

```typescript
function FormComponent({ form, options, fieldComponents, multiPage, tabs, analytics, ...props }) {
  return (
    <form
      ref={htmlFormRef}
      className={cn(options.formClassName, props.className)}
      onSubmit={form.handleSubmit}
      noValidate
    >
      {multiPage.active ? (
        <MultiPageContent form={form} options={options} multiPage={multiPage} fieldComponents={fieldComponents} analytics={analytics} />
      ) : tabs.active ? (
        <TabbedContent form={form} options={options} tabs={tabs} fieldComponents={fieldComponents} analytics={analytics} />
      ) : (
        <FlatContent form={form} options={options} fieldComponents={fieldComponents} analytics={analytics} />
      )}
    </form>
  )
}
```

**What changed**: The huge implementation is broken into a small shell plus delegated renderers. This internal split does not require changing how consumers use the returned `Form`.

### 3. `FieldRenderer` — The Core Mapping (~120 lines)

**Responsibility**: Take a `FieldConfig`, render a `form.Field` with the right component.

```typescript
function FieldRenderer({ form, fieldConfig: rawFieldConfig, fieldComponents, globalConfig }) {
  const fieldConfig = normalizeFieldConfig(rawFieldConfig)
  const Component = fieldComponents[fieldConfig.type]
  if (!Component) return null

  const resolvedLabel = resolveDynamicText(fieldConfig.label, form)
  const resolvedPlaceholder = resolveDynamicText(fieldConfig.placeholder, form)
  const resolvedDescription = resolveDynamicText(fieldConfig.description, form)

  return (
    <form.Field
      name={fieldConfig.name}
      defaultValue={fieldConfig.defaultValue}
      validators={fieldConfig.validation ? {
        onChange: ({ value }) => {
          const result = fieldConfig.validation.safeParse(value)
          return result.success ? undefined : result.error.issues[0]?.message
        }
      } : undefined}
    >
      {(fieldApi) => (
        <ConditionalField fieldConfig={fieldConfig} form={form}>
          <Component
            fieldApi={fieldApi}
            label={resolvedLabel}
            placeholder={resolvedPlaceholder}
            description={resolvedDescription}
            {...extractTypeSpecificProps(fieldConfig)}
            {...globalConfig}
          />
        </ConditionalField>
      )}
    </form.Field>
  )
}
```

**What changed**: No 300-line if-else chain. Component lookup is a single map access. Type-specific props extracted via a data-driven approach (see Field Props Mapping below).

### 4. `useFieldState` — Shared Field Hook (~30 lines)

**Responsibility**: Eliminate the 10-line boilerplate repeated in every field.

```typescript
export function useFieldState(fieldApi: AnyFieldApi) {
  const value = fieldApi.state.value
  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false
  const hasErrors = fieldApi.state.meta.isTouched && fieldApi.state.meta.errors.length > 0
  const errors = hasErrors ? fieldApi.state.meta.errors : []

  const onBlur = useCallback(() => fieldApi.handleBlur(), [fieldApi])
  const onChange = useCallback((val: any) => fieldApi.handleChange(val), [fieldApi])

  return { value, isDisabled, hasErrors, errors, onBlur, onChange }
}
```

**What changed**: Every field component now starts with `const { value, isDisabled, hasErrors, errors, onBlur, onChange } = useFieldState(fieldApi)` instead of 10 lines of boilerplate.

### 5. Field Components — Thin Wrappers

Each field component is a **thin shadcn wrapper** that:
1. Calls `useFieldState(fieldApi)`
2. Renders the shadcn component
3. Wraps in `FieldWrapper` for label/description/errors

**Example — Checkbox field (~30 lines, down from 62)**:
```typescript
export function CheckboxField({ fieldApi, label, description, wrapperClassName, labelClassName }: BaseFieldProps) {
  const { value, isDisabled, onBlur, onChange } = useFieldState(fieldApi)

  return (
    <FieldWrapper fieldApi={fieldApi} label={undefined} description={description} wrapperClassName={wrapperClassName}>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={value ?? false}
          onCheckedChange={onChange}
          onBlur={onBlur}
          disabled={isDisabled}
        />
        {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      </div>
    </FieldWrapper>
  )
}
```

### 6. Field Props Mapping — Data-Driven

Instead of a 300-line if-else chain mapping field types to props, use a config object:

```typescript
// Receives normalized field configs only. Raw aliases are resolved before this.
const TYPE_PROPS_MAP: Record<string, string[]> = {
  text:      ['type', 'datalist', 'maxLength', 'minLength', 'pattern', 'autoComplete', 'maskedInputConfig'],
  textarea:  ['textareaConfig', 'rows'],
  number:    ['min', 'max', 'step', 'numberConfig'],
  select:    ['options', 'placeholder'],
  multiSelect: ['options', 'placeholder', 'multiSelectConfig'],
  combobox:  ['options', 'placeholder', 'comboboxConfig'],
  multiCombobox: ['options', 'placeholder', 'multiComboboxConfig'],
  radio:     ['options'],
  slider:    ['sliderConfig'],
  date:      ['dateConfig'],
  rating:    ['ratingConfig'],
  phone:     ['phoneConfig'],
  color:     ['colorConfig'],
  file:      ['fileConfig', 'accept', 'multiple'],
  array:     ['arrayConfig'],
  object:    ['objectConfig'],
  duration:  ['durationConfig'],
  location:  ['locationConfig'],
}

function extractTypeSpecificProps(fieldConfig: FieldConfig): Record<string, unknown> {
  const propKeys = TYPE_PROPS_MAP[fieldConfig.type] ?? []
  const result: Record<string, unknown> = {}
  for (const key of propKeys) {
    if (fieldConfig[key] !== undefined) {
      result[key] = fieldConfig[key]
    }
  }
  return result
}
```

**What changed**: Adding a new field type means adding one entry to the map. No 300-line render function to modify.

### 7. Field Registry — Single Source of Truth

```typescript
import { TextField } from './text-field'
import { TextareaField } from './textarea-field'
import { NumberField } from './number-field'
import { SelectField } from './select-field'
import { MultiSelectField } from './multi-select-field'
import { ComboboxField } from './combobox-field'
import { MultiComboboxField } from './multicombobox-field'
import { CheckboxField } from './checkbox-field'
import { SwitchField } from './switch-field'
import { RadioField } from './radio-field'
import { SliderField } from './slider-field'
import { RatingField } from './rating-field'
import { DateField } from './date-field'
import { FileUploadField } from './file-upload-field'
import { ColorPickerField } from './color-picker-field'
import { PhoneField } from './phone-field'
import { LocationPickerField } from './location-picker-field'
import { DurationPickerField } from './duration-picker-field'
import { ArrayField } from './array-field'
import { ObjectField } from './object-field'

export const FIELD_TYPES = {
  // Text inputs — email/password/url/tel are TextField with type prop
  text: TextField,
  email: TextField,
  password: TextField,
  url: TextField,
  tel: TextField,
  masked: TextField,                // TextField with maskedInputConfig
  maskedInput: TextField,           // observed docs/parser alias

  // Distinct field components
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  multiSelect: MultiSelectField,    // canonical camelCase
  multiselect: MultiSelectField,    // backward compat alias (field-registry.tsx)
  combobox: ComboboxField,
  autocomplete: ComboboxField,      // alias — same as combobox
  multiCombobox: MultiComboboxField,
  multicombobox: MultiComboboxField, // backward compat alias (field-registry.tsx)
  checkbox: CheckboxField,
  switch: SwitchField,
  radio: RadioField,
  slider: SliderField,
  date: DateField,
  rating: RatingField,
  phone: PhoneField,
  color: ColorPickerField,          // canonical
  colorPicker: ColorPickerField,    // observed docs/builder alias
  file: FileUploadField,
  array: ArrayField,
  object: ObjectField,
  duration: DurationPickerField,
  location: LocationPickerField,
} as const

export type FieldType = keyof typeof FIELD_TYPES
```

### 8. Sub-Hooks Design

#### `useFormPersistence` (~60 lines)
- Takes `persistence` config and `form` API
- Returns `{ saveToStorage, loadFromStorage, clearStorage }`
- Auto-restores on mount if `restoreOnMount` is true
- Auto-saves via form store subscription with debounce

#### `useFormAnalytics` (~150 lines)
- Takes `FormAnalytics` config, `form` API, page/tab state
- Returns tracker callbacks
- Manages `AnalyticsContext` ref with session timing
- Tracks field interactions, page/tab changes, form lifecycle
- All tracking is no-ops when analytics config is not provided

#### `useMultiPage` (~120 lines)
- Takes `pages`, `fields`, `form` API
- Groups fields by page, tracks visible pages (conditionals)
- Returns `{ active, api: { currentPage, totalPages, visiblePages, goToNextPage, goToPreviousPage, setCurrentPage, isFirstPage, isLastPage, progressValue } }`
- Page validation on navigation

#### `useFormTabs` (~60 lines)
- Takes `tabs`, `fields`, `form` API
- Groups fields by tab, manages active tab state
- Returns `{ active, api: { activeTab, setActiveTab, fieldsByTab } }`

---

## Sync Architecture (shadcn Pattern)

### Source Ownership

Synced files are copied artifacts. Never edit them directly.

Ownership:
- `packages/formedible/src` owns the core form renderer, field configs, normalization, validation, field components, layout, and shared UI dependencies
- `packages/formedible-parser/src` owns parser logic only
- `packages/builder/src` owns builder logic only
- `packages/ai-builder/src` owns AI builder logic only
- the docs/demo app owns docs and examples only

Any fix to synced core behavior starts in the owning source package, then build, sync, and run full type/fixture verification.

### Before — Sync works but syncs garbage
```
formedible/src/  ──sync──→  builder/src/       (copies 2K-line god file + everything)
                 ──sync──→  ai-builder/src/    (copies 2K-line god file + everything)
                 ──sync──→  parser/src/        (copies 2K-line god file + everything)
                 ──sync──→  web/src/           (copies 2K-line god file + everything)

parser/src/      ──sync──→  builder/src/       (copies parser logic)
                 ──sync──→  ai-builder/src/    (copies parser logic)
                 ──sync──→  web/src/           (copies parser logic)

builder/src/     ──sync──→  ai-builder/src/    (copies builder logic)
                 ──sync──→  web/src/           (copies builder logic)

ai-builder/src/  ──sync──→  web/src/           (copies AI logic)
```
The sync is correct — this is how shadcn works. But it syncs bloated, duplicated god files.

### After — Same sync, clean source files
```
formedible/src/  ──sync──→  builder, ai-builder, parser, web   (components, hooks, types, lib)
parser/src/      ──sync──→  builder, ai-builder, web           (parser logic only)
builder/src/     ──sync──→  ai-builder, web                    (builder logic only)
ai-builder/src/  ──sync──→  web                                (AI logic only)
```

Same sync mechanism, same routes. The difference: source files are small, focused modules instead of 2,000-line god files.

---

## Backward Compatibility Contract

The compatibility contract is about **schemas and high-level package entrypoints**, not preserving old internals.

### Must Work Unchanged

1. **`FieldConfig` schema** — all 30+ properties, same names, same types, same semantics
2. **`UseFormedibleOptions` schema** — all options, same names, same behavior
3. **`useFormedible()` hook call signature** — same args; intentionally cleaner return shape
4. **`<Form className="..." />`** — renders the form, same as before
5. **All observed field type strings** — derived from current docs, examples, parser outputs, builder outputs, and AI builder outputs
6. **Dynamic text** — `{{fieldName}}` interpolation in labels, descriptions, placeholders, section titles
7. **Multi-page forms** — `pages`, `progress`, navigation
8. **Tab forms** — `tabs`, tab routing
9. **Conditional fields** — `conditional: (values) => boolean`
10. **Conditional sections** — `conditionalSections`
11. **Array fields** — with nested objects, sorting, min/max
12. **Object fields** — with nested field configs
13. **Form analytics** — all callbacks (`onFieldFocus`, `onFieldBlur`, etc.)
14. **Form persistence** — localStorage/sessionStorage with debounce
15. **Cross-field validation** — `crossFieldValidation` array (implemented via TanStack Form's `validators.onChange` at form level)
16. **Async validation** — `asyncValidation` per-field (implemented via TanStack Form's `validators.onChangeAsync` + `asyncDebounceMs`)
17. **Inline validation** — `inlineValidation` per-field config (implemented via TanStack Form's native async validators, no custom wrapper)
18. **Auto-submit** — `autoSubmitOnChange` with debounce
19. **Parser schema format** — JSON/object literal/Zod expression strings
20. **Builder API** — `FormBuilder`, `FieldConfigurator`, `FormPreview` component props
21. **AI Builder API** — `AIBuilder`, `AiFormRenderer`, `parseAiToFormedible`
22. **Form personalization options** — labels, button components/classes, disabled/loading states, form classes, field classes, global wrappers, and form-level event handlers
23. **HTML `<Form />` props** — form attributes and event props passed to the returned `Form` component

### Compatibility Aliases

Aliases must be derived from actual current schemas and docs, not a hand-maintained guess.

Known aliases include:
- `multiSelect` AND `multiselect`
- `multiCombobox` AND `multicombobox`
- `color` AND `colorPicker`
- `masked` AND `maskedInput`

The canonical names in the new registry are `camelCase` (`multiSelect`, `multiCombobox`, `color`). The `lowercase` aliases map to the same components.

Config aliases are compatibility surfaces too:
- `maskedInputConfig` and `maskedConfig` feed the same internal masked config
- `colorConfig` feeds both `color` and `colorPicker`
- `multiSelectConfig` feeds both `multiSelect` and `multiselect`
- `multiComboboxConfig` feeds both `multiCombobox` and `multicombobox`

### Normalization Boundary

Add a dedicated `normalizeFieldConfig()` layer before rendering.

Rules:
- Raw user schemas are accepted unchanged.
- Normalized configs drive internal rendering.
- The original config object is not mutated.
- All type aliases and config aliases are resolved before field lookup.
- Tests must prove every observed spelling still renders.

### New `useFormedible` Return Contract

The hook return shape should be intentionally small and stable:

```typescript
{
  form,
  Form,
  currentPage?,
  totalPages?,
  goToNextPage?,
  goToPreviousPage?,
  setCurrentPage?,
  activeTab?,
  setActiveTab?,
  saveToStorage?,
  loadFromStorage?,
  clearStorage?
}
```

Do not preserve old debug/helper return values unless a new design explicitly needs them:
- `crossFieldErrors`
- `asyncValidationStates`
- `validateAsync`
- `triggerAsyncValidation`
- analytics context internals
- any other state that only exposed implementation details

Cross-field, async, and inline validation must still render field errors correctly through the normal field error UI.

---

## Eliminated Redundancy Summary

| What | Current | New | Reduction |
|------|---------|-----|-----------|
| Main hook (`use-formedible`) | 2,286 lines (god file) | ~150 lines (orchestrator) | **93%** |
| Types (`types.ts`) | 1,402 lines (88 interfaces in one file) | ~800 lines across 7 files | **43%** |
| Field boilerplate (per field) | ~10-15 lines duplicated × 20 fields | `useFieldState()` hook, 0 duplication | **100%** |
| `SharedFieldRenderer` / `NestedFieldRenderer` | 377 lines (90% duplicated) | 1 `FieldRenderer` (~120 lines) | **68%** |
| Two registries with inconsistent keys | 2 files, different key names | 1 registry, alias support | **50%** |
| Option normalization | Duplicated in 6 files | 1 `normalizeOptions()` utility | **83%** |
| Section/group rendering | Duplicated in 2 places (~100 lines each) | 1 `SectionRenderer` (~120 lines) | **40%** |
| Error checking pattern | Duplicated in 4 places | 1 `hasFieldErrors()` utility | **75%** |
| Form store subscription | Duplicated in 4+ files | Hook pattern, centralized | **75%** |
| Custom InlineValidationWrapper | 175 lines reinventing async validation | TanStack Form native `onChangeAsync` | **100%** |
| Custom cross-field validation state | ~80 lines + subscription | TanStack Form form-level `validators` | **100%** |
| Custom async validation state | ~100 lines + abort controllers + debounce | TanStack Form `onChangeAsync` per field | **100%** |
| Autocomplete field component | 314 lines, duplicates combobox | Alias → ComboboxField | **100%** |
| Masked input field component | 270 lines, duplicates text input | Alias → TextField with maskedInputConfig | **100%** |
| Cross-package sync | Syncs 2K-line god files + entire trees | Syncs clean ~100-line modules | **Smaller sync footprint** |
| **Total formedible package** | **~12,000 lines** | **~4,000 lines** | **~67%** |
---

## Implementation Order

### Phase 0: User Scaffold + Workspace Package Surfaces
1. User scaffolds the new repo with Better-T-Stack and pnpm
2. Configure pnpm workspaces and shared dependency catalogs/overrides
3. Create the workspace package surfaces for `packages/formedible`, `packages/formedible-parser`, `packages/builder`, and `packages/ai-builder`
4. Ensure each package surface has a minimal valid manifest, tsconfig, and buildable source entrypoint; `apps/web` comes from scaffold
5. Extract every current `useFormedible({ ... })` schema from docs/examples into compatibility fixtures
6. Extract parser input/output examples and parser-generated schemas into fixtures
7. Extract builder and AI builder high-level API examples into fixtures
8. Generate the observed field type alias list from fixtures and docs
9. Define the golden compatibility test harness before implementing renderer behavior

### Phase 1: Core Foundation
1. Scaffold new `packages/formedible/src/` with the directory structure above
2. Implement `types/` — split type files with exact same interfaces
3. Implement `lib/utils.ts`, `lib/resolve-dynamic-text.ts`, `lib/normalize-options.ts`
4. Implement `lib/normalize-field-config.ts`
5. Implement `hooks/use-field-state.ts`
6. Implement `components/fields/field-wrapper.tsx`
7. Implement all field components as thin shadcn wrappers
8. Implement `components/fields/field-registry.ts` with aliases generated/verified from fixtures
9. Implement `components/fields/index.ts`

### Phase 2: Form Engine
1. Implement `components/conditional-field.tsx`
2. Implement `components/field-renderer.tsx`
3. Implement `components/section-renderer.tsx`
4. Implement `components/content-renderer.tsx`
5. Implement `components/progress.tsx` and `components/navigation.tsx`
6. Implement layout components (`form-grid`, `form-tabs`, `form-accordion`, `form-stepper`)
7. Implement sub-hooks (`use-form-persistence`, `use-form-analytics`, `use-multi-page`, `use-form-tabs`)
8. Implement `hooks/use-formedible.ts` (the orchestrator)
9. Implement `components/form.tsx`
10. Wire `index.ts` public API

### Phase 3: Verify Compatibility
1. Run golden schema fixtures from the current repo
2. Test every observed field type and alias renders correctly
3. Test multi-page, tabs, conditionals, conditional sections, and layout
4. Test dynamic text interpolation
5. Test validation pipeline and error placement
6. Test analytics callbacks
7. Test persistence
8. Test array/object fields with nested configs
9. Test submit values match the current schema value shape
10. Run full package type checks after sync

### Phase 4: Parser Package
1. New `packages/formedible-parser/` — shadcn-synced from formedible core
2. Port parser logic (sanitization, Zod expression handling, validation)
3. Port `parser-config-schema.ts`
4. Verify parser output matches old format
5. Add parser-to-builder/ai-builder/web sync routes

### Phase 5: Builder Package
1. New `packages/builder/` — shadcn-synced from formedible + formedible-parser
2. Port `FieldStore`, `BuilderContext`, `FormBuilder` component
3. Port `FieldConfigurator`, `FormPreview`, code generation
4. Port tab system
5. Add builder-to-ai-builder/web sync routes

### Phase 6: AI Builder Package
1. New `packages/ai-builder/` — shadcn-synced from formedible + formedible-parser + builder
2. Port AI provider management, chat interface
3. Port `AiFormRenderer`, `parseAiToFormedible`
4. Port conversation persistence
5. Add ai-builder-to-web sync routes

### Phase 7: Web App & Cleanup
1. Port docs/examples only after compatibility fixtures pass
2. Remove stale docs for old debug return helpers
3. Verify all docs pages render correctly
4. Update repo instructions for pnpm, sync ownership, and fixture workflow
5. Update package scripts

---

## Key Design Decisions

### 1. `form.Field` is the render boundary

Every field goes through `form.Field` with a render prop. This is TanStack Form's intended pattern. No mock FieldApi objects for nested fields — use `form.Field` with bracket notation for arrays and dot notation for objects.

### 2. Component registry is a plain object

Not a class, not a context, not a module-level mutable map. A simple `Record<string, ComponentType>` that gets merged once in the hook. Users override via `defaultComponents`.

### 3. Sub-hooks are conditional

`useFormPersistence` returns no-ops when `persistence` is undefined. `useFormAnalytics` returns no-op trackers when `analytics` is undefined. `useMultiPage` returns `{ active: false }` when `pages` is undefined. Zero overhead when features aren't used.

### 4. Fields are pure presentational components

Field components receive `fieldApi`, `label`, `description`, and type-specific props. They call `useFieldState(fieldApi)` and render. No subscription logic, no side effects, no form-level awareness.

### 5. TanStack Form owns all state

Form values, validation, touched, dirty, errors — all managed by TanStack Form's store. Formedible never duplicates state. The only local state is UI state (current page, active tab, analytics context).

### 6. The parser is a separate sync source

The `FormedibleParser` class (1,750 lines) does not belong in the core form component. It's a tool (for AI, for builders). It lives in `formedible-parser` and syncs to builder/ai-builder/web just like formedible core syncs everywhere.

### 7. shadcn/ui components sync alongside Formedible

The shadcn UI components (Input, Select, Checkbox, etc.) live in each package's `components/ui/` directory — synced just like the Formedible components. This is the shadcn way. You own the files. The sync script handles both the Formedible components and their shadcn dependencies.

### 8. Keep the index signature on FieldConfig

The current `FieldConfig` has `[key: string]: unknown` — this is how consumers pass arbitrary props to custom field components. It stays for backward compat. It's not ideal for type safety, but compat > purity.

### 9. Validation is one pipeline

All validation sources feed one validator-building layer and one rendered error display path. Do not reintroduce separate custom error state for each feature.

Validation precedence:
1. Built-in field constraints from `required`, `min`, `max`, `validationConfig`, and related config
2. Field-level `validation` Zod schema
3. Top-level `schema` Zod validation
4. `crossFieldValidation`
5. `asyncValidation` and `inlineValidation`

All errors for a field render in that field's normal error area. Cross-field validation attaches to each configured field unless a future config explicitly supports a target field.

### 10. Nested fields use real TanStack paths

No mock FieldApi objects for nested fields.

Required path behavior:
- object subfield: `address.city`
- array primitive item: `emails[0]`
- array object subfield: `teamMembers[0].email`
- deeper nesting: `array[0].object.child`

Nested conditionals inside object/array items receive the local item/object values, matching current schemas such as `conditional: values => values.equipementRoom === true`.

Top-level Zod schema errors for nested paths should render beside the correct nested field where possible, not only beside the parent array/object.

### 11. High-level package APIs stay stable

Parser, builder, and AI builder keep their high-level entrypoints while their internals are disposable.

Preserve:
- parser: `FormedibleParser`, parser config exports, supported field type info
- builder: `FormBuilder`, `FieldConfigurator`, `FormPreview`, default tabs, public builder prop types
- AI builder: `AIBuilder`, `AiFormRenderer`, `parseAiToFormedible`, provider selection, public prop/result types

Do not preserve copied internal field exports, duplicated renderer internals, or old synced implementation details.

---

## File Size Soft Targets

These are **guidelines, not hard limits**. The goal is to avoid god files. If a component legitimately needs more lines to work correctly, it gets more lines. Functionality never gets cut to meet a line count.

| File | Soft Target | Notes |
|------|-------------|-------|
| `hooks/use-formedible.ts` | ~150 | Orchestrator only. If it grows, extract more sub-hooks. |
| `components/form.tsx` | ~100 | Form shell. Delegates everything. |
| `components/field-renderer.tsx` | ~120 | FieldConfig → component mapping. |
| `components/content-renderer.tsx` | ~100 | Page/tab/flat content routing. |
| `components/section-renderer.tsx` | ~120 | Section + group rendering. |
| `components/conditional-field.tsx` | ~30 | Simple wrapper. |
| Field components | ~100-200 | Simple fields (checkbox, switch) ~30 lines. Complex fields (location, array) as big as they need. |
| Sub-hooks | ~100-150 | If a hook exceeds this, consider splitting. |
| Type files | ~200-250 | Split by domain. |

**Rule of thumb**: If a file passes 300 lines, ask whether it has multiple responsibilities. If yes, split. If no, leave it alone.

---

## What Existing Code We Keep (Logic, Not Structure)

These pieces contain real logic that we port (not copy-paste, but rewrite clean):

1. **Template interpolation** (`resolveDynamicText`) — port from `template-interpolation.ts`
2. **Field component rendering** — port the shadcn wiring from each field component
3. **Parser sanitization** — port the dangerous-pattern detection from `FormedibleParser`
4. **Zod expression parsing** — port the `z.string().min()` etc. parsing logic
5. **Code generation** — port `generateFormCode()` from `code-generation.ts`
6. **FieldStore** — port the CRUD + subscription store from `field-store.ts`
7. **Location picker** — port the maps/search/geocoding logic (as big as it needs to be)
8. **Color picker** — port the color format handling (282 lines)
9. **Duration picker** — port the time arithmetic (243 lines)
10. **Array field** — port the `@dnd-kit` sortable integration (388 lines)

### Fields merged/aliased (no separate component file)

These field type strings still work (100% compat) but no longer have their own component files — they map to other components in the registry:
- **email, password, url, tel, masked, maskedInput** → all alias for `TextField` with different type/config props
- **autocomplete** → alias for `ComboboxField` (same component)
- **multiselect** → alias for `multiSelect` (same `MultiSelectField` component)
- **multicombobox** → alias for `multiCombobox` (same `MultiComboboxField` component)
- **colorPicker** → alias for `color` (same `ColorPickerField` component)

The exact alias count is generated from current fixtures. Do not rely on a manually maintained field-type count.

---

## Migration Strategy

### For consumers using `useFormedible`

**Zero schema changes.** Existing `UseFormedibleOptions` and `FieldConfig[]` inputs work as-is and render the same functional form. The returned helper/debug state is intentionally cleaned up according to the new return contract above.

### For consumers using the parser

**Zero changes.** The parser accepts the same input format and produces the same output shape.

### For consumers using the builder

**Zero changes.** `FormBuilder`, `FieldConfigurator`, `FormPreview` all work the same.

### Testing approach

1. Extract all `FieldConfig` arrays and `useFormedible` option objects from existing docs/examples — these are the compatibility test cases
2. Each fixture must render the same functional form with no schema changes
3. Parser tests: feed existing parser input strings, verify equivalent output
4. Builder tests: verify high-level `FormBuilder`, `FieldConfigurator`, and `FormPreview` behavior
5. AI builder tests: verify `AIBuilder`, `AiFormRenderer`, and `parseAiToFormedible` behavior
6. Docs tests: docs must not reference removed debug/helper return values

### Required Golden Fixtures

The compatibility suite must include fixtures for:
- every observed field type spelling and alias
- every observed config alias
- form personalization options and form event handlers
- schema-level Zod validation
- field-level Zod validation
- `validationConfig`
- cross-field validation
- async validation
- inline validation
- multi-page navigation and progress
- tabbed forms
- conditional fields
- conditional sections
- persistence save/load/clear
- analytics callbacks
- auto-submit
- custom field components through `component` and `defaultComponents`
- `globalWrapper` and per-field `wrapper`
- array/object nested values

Nested fixtures must cover:
- `object.child`
- `array[0]`
- `array[0].child`
- `array[0].object.child`

Nested fixture assertions:
- updates write to the correct submitted value shape
- Zod nested errors attach to the correct field
- local conditionals inside array/object items receive local values
- dynamic text inside nested fields resolves from the intended scope
- sorting array items preserves values and field identity correctly
