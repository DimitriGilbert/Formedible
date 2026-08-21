# @formedible/builder

This package contains the visual Formedible builder: field configuration, preview, generated code, field store, and tabs. It uses core Formedible code and exports its public API from `src/index.ts`.

Public install item:

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/form-builder.json
```

The registry item is `form-builder` in `packages/builder/registry.json`. It depends on `https://formedible.dev/r/formedible-core.json` and copies builder files to `@ui/formedible/builder/*`, plus shared builder libs under `@ui/formedible/lib/*`.

## Public exports

`packages/builder/src/index.ts` re-exports these names:

### Components and state

- `FormBuilder`
- `FieldConfigurator`
- `FormPreview`
- `CodeGenerator`
- `FieldStore`
- `FieldStoreContext`
- `globalFieldStore`
- `useFieldStore`

### Tabs

- `builderTab`
- `previewTab`
- `codeTab`
- `defaultTabs`
- `createTabsWithDisabled`
- `createTabsWithOrder`
- `getBuilderAndCodeTabs`
- `getBuilderAndPreviewTabs`
- `getBuilderOnlyTabs`

### Code generation and metadata

- `defaultFormMetadata`
- `builderFieldTypes`
- `generateFormCode`
- `generateCodeFromParsedConfig`

### Types

- `BuilderFieldTypeDefinition`
- `FormBuilderProps`
- `FormField`
- `FormMetadata`
- `FormPage`
- `FormSettings`
- `FormTab`
- `TabConfig`
- `TabContentProps`
- `CodeGenerationOptions`
- `GeneratedCodeResult`

## Use after registry install

```tsx
import { FormBuilder } from '@/components/ui/formedible/builder';
import type { FormField, FormMetadata } from '@/components/ui/formedible/builder';

const builderDrafts: Array<{ metadata: FormMetadata; fields: FormField[] }> = [];

async function saveBuilderSubmission(metadata: FormMetadata, fields: FormField[]) {
  await fetch('/api/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata, fields }),
  });
}

export function BuilderWorkspace() {
  return (
    <FormBuilder
      initialMetadata={{
        title: 'Signup form',
        description: 'Collect account details',
      }}
      onChange={(metadata, fields) => {
        builderDrafts.push({ metadata, fields });
      }}
      onSubmit={async (metadata, fields) => {
        await saveBuilderSubmission(metadata, fields);
      }}
    />
  );
}
```

`FormBuilderProps` is defined in `src/lib/formedible/builder-types.ts:86`. It accepts `tabs`, `defaultTab`, `initialMetadata`, `initialFields`, `fieldStore`, `onChange`, `onTabChange`, `onSubmit`, and `className`.

## Field store scoping and re-imports

Each `FormBuilder` mount creates its own `FieldStore` instance, so rendering two builders side by side never lets one instance wipe the other's fields. `FieldConfigurator` reads that store from `FieldStoreContext` when rendered inside `FormBuilder`, and falls back to the exported `globalFieldStore` when rendered standalone.

To share one store across instances, opt in with the `fieldStore` prop:

```tsx
import { FormBuilder, globalFieldStore } from '@/components/ui/formedible/builder';

export function SharedStoreWorkspace() {
  return (
    <>
      <FormBuilder fieldStore={globalFieldStore} />
      <FormBuilder fieldStore={globalFieldStore} />
    </>
  );
}
```

The `fieldStore` prop is captured on first render; changing it later has no effect. Shared stores re-import `initialFields` on every mount, so instances passing different `initialFields` will keep overwriting each other.

`initialFields` is structurally compared against the current fields before re-importing: re-renders that pass an inline array with identical content skip the import and never reset in-progress edits or notify subscribers. Use `store.clear()` plus a changed `initialFields` payload to reset deliberately.

`FieldStore` also guarantees unique field names: `addField` picks the first unused `field_N` name, `duplicateField` appends `_copy` and then `_copy_2`, `_copy_3`, and so on, and `updateField`/`replaceField` throw a descriptive `Error` when a rename would collide with another field's name (the builder UI catches the throw, logs it, and keeps the previous name).

## Custom tab composition

```tsx
import {
  FormBuilder,
  getBuilderAndPreviewTabs,
  createTabsWithDisabled,
} from '@/components/ui/formedible/builder';

const tabs = createTabsWithDisabled(getBuilderAndPreviewTabs(), ['preview']);

export function LockedPreviewBuilder() {
  return <FormBuilder tabs={tabs} defaultTab="builder" />;
}
```

The tab contract is `TabConfig` in `src/lib/formedible/builder-types.ts:77`. Each tab has an `id`, `label`, optional `icon`, React `component`, optional `enabled`, and optional `order`.

## Generate code without rendering the builder

```ts
import { generateFormCode } from '@/components/ui/formedible/builder';

const result = generateFormCode({
  title: 'Contact',
  description: 'Contact the team',
  fields: [
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'message', type: 'textarea', label: 'Message', required: true },
  ],
  settings: {
    submitLabel: 'Send',
    nextLabel: 'Next',
    previousLabel: 'Back',
    showProgress: true,
  },
});

export const generatedContactForm = {
  schemaCode: result.schemaCode,
  formConfig: result.formConfig,
  fullCode: result.fullCode,
};
```

`generateFormCode` returns `GeneratedCodeResult` with `fullCode`, `formConfig`, and `schemaCode` (`src/lib/formedible/code-generation.ts:21`). `generateCodeFromParsedConfig` adapts a parsed `UseFormedibleOptions<FormedibleFormValues>` into the same output (`src/lib/formedible/code-generation.ts:200`).

## Builder field model

The builder's editable field type list is `builderFieldTypes` (`src/lib/formedible/builder-types.ts:10`). It currently exposes text, email, password, textarea, number, select, radio, multiSelect, checkbox, switch, date, slider, rating, colorPicker, phone, file, array, and object.

`FormField` extends core `FormedibleFieldConfig<FormedibleFormValues>` and adds required `id`, `name`, `label`, and `type` (`src/lib/formedible/builder-types.ts:31`).

## Package scripts

Exact scripts from `packages/builder/package.json`:

```bash
pnpm --filter @formedible/builder run check-types
pnpm --filter @formedible/builder run test
pnpm --filter @formedible/builder run build
pnpm --filter @formedible/builder run build:registry
pnpm --filter @formedible/builder run sync
```

Root equivalents used most often:

```bash
pnpm run build:builder
pnpm run check-types:builder
pnpm run check-types
```

## Docs and tests

- Docs route: `/docs/builder`.
- Interactive route: `/builder`.
- Source entrypoint: `packages/builder/src/index.ts`.
- Main types: `packages/builder/src/lib/formedible/builder-types.ts`.
- Code generation: `packages/builder/src/lib/formedible/code-generation.ts`.
- Tests: `packages/builder/src/builder.test.tsx`, `packages/builder/src/lib/formedible/field-store.test.ts`.
