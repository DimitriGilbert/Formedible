# Formedible Builder

Formedible Builder is a React visual builder for creating Formedible form configs. It lets users add fields, edit field settings, preview the form, and copy generated code without leaving the page.

The package exports the builder shell plus the smaller pieces used by that shell: `FieldConfigurator`, `FormPreview`, `CodeGenerator`, `FieldStore`, tab helpers, and code generation helpers.

## Getting started

Mount `FormBuilder` in a client-rendered React component.

```tsx
'use client';

import { FormBuilder } from '@formedible/builder';
import type { FormField, FormMetadata } from '@formedible/builder';

export function BuilderPage() {
  function handleSubmit(metadata: FormMetadata, fields: readonly FormField[]): void {
    window.localStorage.setItem('formedible-builder-draft', JSON.stringify({ metadata, fields }));
  }

  return (
    <FormBuilder
      initialMetadata={{
        title: 'Contact form',
        description: 'Collect a name, email address, and message.',
      }}
      onSubmit={handleSubmit}
    />
  );
}
```

`FormBuilder` owns the active tab, selected field, form metadata, and field list. Field data is stored in `globalFieldStore`, so the builder tabs and the field configurator stay in sync.

## Features

- **18 field types** through `builderFieldTypes`: `text`, `email`, `password`, `textarea`, `number`, `select`, `radio`, `multiSelect`, `checkbox`, `switch`, `date`, `slider`, `rating`, `colorPicker`, `phone`, `file`, `array`, and `object`.
- **Live preview** through `FormPreview`, which renders the current fields with `useFormedible`.
- **Code generation** through `CodeGenerator`, `generateFormCode`, and `generateCodeFromParsedConfig`.
- **Tabs** through `defaultTabs`: Builder, Preview, and Code.
- **Field editing** through `FieldConfigurator`: label, name, placeholder, description, required state, page assignment, options, and numeric bounds.

## API

### `FormBuilderProps`

```ts
interface FormBuilderProps {
  readonly tabs?: readonly TabConfig[];
  readonly defaultTab?: string;
  readonly initialMetadata?: Partial<FormMetadata>;
  readonly initialFields?: readonly FormField[];
  readonly onChange?: (metadata: FormMetadata, fields: readonly FormField[]) => void;
  readonly onTabChange?: (tabId: string) => void;
  readonly onSubmit?: (metadata: FormMetadata, fields: readonly FormField[]) => void;
  readonly className?: string;
}
```

| Prop | Use |
| --- | --- |
| `tabs` | Replaces the default Builder, Preview, and Code tabs. Disabled tabs are filtered out and enabled tabs are sorted by `order`. |
| `defaultTab` | Initial tab id. If the id is not enabled, the first enabled tab is used. |
| `initialMetadata` | Partial metadata merged with `defaultFormMetadata`. Nested `settings` are merged too. |
| `initialFields` | Field list imported into `globalFieldStore` on mount or when the value changes. |
| `onChange` | Runs when metadata or fields change. |
| `onTabChange` | Runs after the user changes tabs. |
| `onSubmit` | Runs when the Save Form button is clicked. |
| `className` | Added to the root builder element. |

### `TabConfig`

```ts
interface TabConfig {
  readonly id: string;
  readonly label: string;
  readonly icon?: ComponentType<{ readonly className?: string }>;
  readonly component: ComponentType<TabContentProps>;
  readonly enabled?: boolean;
  readonly order?: number;
}
```

Each tab component receives `TabContentProps`: `metadata`, `fields`, `selectedFieldId`, `onMetadataChange`, `onAddField`, `onSelectField`, `onDeleteField`, and `onDuplicateField`.

```tsx
import { FormBuilder, defaultTabs } from '@formedible/builder';
import type { TabConfig, TabContentProps } from '@formedible/builder';

function NotesTab({ fields }: TabContentProps) {
  return <p>{fields.length} fields in this form.</p>;
}

const tabs: readonly TabConfig[] = [
  ...defaultTabs,
  {
    id: 'notes',
    label: 'Notes',
    component: NotesTab,
    enabled: true,
    order: 4,
  },
];

export function BuilderWithNotes() {
  return <FormBuilder tabs={tabs} defaultTab="builder" />;
}
```

## Tab helpers

The package exports ready-made tab configs and helper functions from `default-tabs.tsx`.

| Export | Result |
| --- | --- |
| `builderTab` | Builder tab with field add/select/duplicate/delete actions. |
| `previewTab` | Preview tab that renders `FormPreview`. |
| `codeTab` | Code tab that renders `CodeGenerator`. |
| `defaultTabs` | `[builderTab, previewTab, codeTab]`. |
| `getBuilderOnlyTabs()` | Builder tab only. |
| `getBuilderAndPreviewTabs()` | Builder and Preview tabs. |
| `getBuilderAndCodeTabs()` | Builder and Code tabs. |
| `createTabsWithOrder(tabIds)` | Returns default tabs in the requested id order. Unknown ids are ignored. |
| `createTabsWithDisabled(disabledTabIds)` | Returns default tabs with matching ids marked `enabled: false`. |

```tsx
import { FormBuilder, createTabsWithDisabled, createTabsWithOrder } from '@formedible/builder';

export function PreviewFirstBuilder() {
  return <FormBuilder tabs={createTabsWithOrder(['preview', 'builder', 'code'])} defaultTab="preview" />;
}

export function BuilderWithoutCode() {
  return <FormBuilder tabs={createTabsWithDisabled(['code'])} />;
}
```

## Code generation

Use `generateFormCode` when you already have builder metadata and fields. It returns `fullCode`, `formConfig`, and `schemaCode`.

```ts
import { generateFormCode } from '@formedible/builder';
import type { FormField, FormMetadata, GeneratedCodeResult } from '@formedible/builder';

export function buildSource(metadata: FormMetadata, fields: readonly FormField[]): GeneratedCodeResult {
  return generateFormCode({
    title: metadata.title,
    description: metadata.description,
    fields,
    pages: metadata.pages,
    tabs: metadata.tabs,
    settings: metadata.settings,
  });
}
```

Use `generateCodeFromParsedConfig` when the input is a `UseFormedibleOptions` config. The generated form code imports `z` from `zod` and `useFormedible` from `@/hooks/use-formedible`, then renders `<Form />`.

`CodeGenerator` is the UI wrapper around `generateFormCode`. It displays the generated `fullCode` for the current builder state.
