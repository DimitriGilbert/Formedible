import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/builder');

const relatedLinks = [
  { title: 'API', description: 'Hook options, field config, tabs, pages, persistence, analytics, and form props.', href: '/docs/api' },
  { title: 'AI Builder', description: 'Prompt-assisted form drafts that feed the same builder and field model.', href: '/docs/ai-builder' },
  { title: 'Getting Started', description: 'Install the copied app surface and render your first Formedible form.', href: '/docs/getting-started' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Public exports',
    body: 'The builder package root exports the visual builder, the tab helpers, the external field store, and the code-generation functions. Treat that file as the import contract.',
    bullets: [
      'FormBuilder, FieldConfigurator, FormPreview, and CodeGenerator are root exports.',
      'FieldStore and globalFieldStore are also root exports, so store behavior is not only an internal detail.',
      'generateFormCode and generateCodeFromParsedConfig are exported from the same root file.',
    ],
    snippet: {
      title: 'packages/builder/src/index.ts',
      language: 'ts',
      code: `export { FormBuilder } from '@/components/formedible/builder/form-builder';
export { FieldStore, globalFieldStore } from '@/components/formedible/builder/field-store';
export {
  createTabsWithDisabled,
  createTabsWithOrder,
  defaultTabs,
  getBuilderAndCodeTabs,
  getBuilderAndPreviewTabs,
  getBuilderOnlyTabs,
} from '@/components/formedible/builder/default-tabs';
export { generateCodeFromParsedConfig, generateFormCode } from '@/lib/formedible/code-generation';`,
    },
  },
  {
    title: 'FormBuilder props and rendering path',
    body: 'FormBuilder sorts enabled tabs, imports provided initial fields into the global field store, calls onChange after metadata or field updates, and calls onSubmit from the Save Form button.',
    bullets: [
      'tabs defaults to defaultTabs and defaultTab defaults to builder.',
      'initialMetadata is merged over defaultFormMetadata, including nested settings.',
      'initialFields is passed to globalFieldStore.importFields in an effect.',
      'The active tab component receives metadata, fields, selectedFieldId, and handlers for add/select/delete/duplicate.',
    ],
    snippet: {
      title: 'packages/builder/src/components/formedible/builder/form-builder.tsx',
      language: 'tsx',
      code: `export function FormBuilder({
  tabs = defaultTabs,
  defaultTab = 'builder',
  initialMetadata,
  initialFields,
  onChange,
  onTabChange,
  onSubmit,
  className,
}: FormBuilderProps) {
  const fields = useSyncExternalStore(
    (listener) => globalFieldStore.subscribe(listener),
    () => globalFieldStore.getAllFields(),
    () => importedInitialFields,
  );

  useEffect(() => {
    globalFieldStore.importFields(importedInitialFields);
  }, [importedInitialFields]);

  useEffect(() => {
    onChange?.(metadata, fields);
  }, [fields, metadata, onChange]);

  return <Button type="button" variant="outline" onClick={() => onSubmit?.(metadata, fields)}>Save Form</Button>;
}`,
    },
  },
  {
    title: 'Tab system',
    body: 'The default tab module defines three TabConfig objects and helper functions that return slices or ordered copies of those objects.',
    bullets: [
      'defaultTabs is [builderTab, previewTab, codeTab].',
      'getBuilderOnlyTabs, getBuilderAndPreviewTabs, and getBuilderAndCodeTabs return fixed arrays.',
      'createTabsWithOrder maps caller-provided ids to default tabs and rewrites order from the array index.',
      'createTabsWithDisabled preserves default order and sets enabled to false for matching ids.',
    ],
    snippet: {
      title: 'packages/builder/src/components/formedible/builder/default-tabs.tsx',
      language: 'ts',
      code: `export const defaultTabs: readonly TabConfig[] = [builderTab, previewTab, codeTab];

export function getBuilderOnlyTabs(): readonly TabConfig[] {
  return [builderTab];
}

export function createTabsWithOrder(tabIds: readonly string[]): readonly TabConfig[] {
  const tabsById = new Map(defaultTabs.map((tab) => [tab.id, tab]));

  return tabIds
    .map((tabId) => tabsById.get(tabId))
    .filter((tab): tab is TabConfig => tab !== undefined)
    .map((tab, index) => ({ ...tab, order: index + 1 }));
}

export function createTabsWithDisabled(disabledTabIds: readonly string[]): readonly TabConfig[] {
  return defaultTabs.map((tab) => ({ ...tab, enabled: !disabledTabIds.includes(tab.id) }));
}`,
    },
  },
  {
    title: 'Field store',
    body: 'FieldStore owns fields by id, keeps a separate order array, rebuilds a readonly snapshot, and notifies structure or field-level listeners after changes.',
    bullets: [
      'addField generates ids like field_1 and creates a default name, label, required flag, and page.',
      'updateField patches a field, rebuilds the snapshot, notifies structure listeners, and notifies listeners for that field id.',
      'deleteField removes the field id from fieldOrder and clears fieldListeners for that id.',
      'importFields resets the store and advances nextId from imported ids such as field_12.',
    ],
    snippet: {
      title: 'packages/builder/src/components/formedible/builder/field-store.ts',
      language: 'ts',
      code: `export class FieldStore {
  private fields: Record<string, FormField> = {};
  private fieldOrder: string[] = [];
  private fieldSnapshot: readonly FormField[] = [];
  private structureListeners = new Set<StructureListener>();
  private fieldListeners = new Map<string, Set<FieldListener>>();

  updateField(fieldId: string, fieldUpdate: Partial<FormField>): FormField | undefined {
    const currentField = this.fields[fieldId];
    if (currentField === undefined) return undefined;

    const updatedField: FormField = { ...currentField, ...fieldUpdate, id: fieldId };
    this.fields[fieldId] = updatedField;
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();
    this.notifyFieldListeners(fieldId, updatedField);
    return updatedField;
  }

  subscribe(listener: StructureListener): () => void {
    this.structureListeners.add(listener);
    return () => { this.structureListeners.delete(listener); };
  }
}`,
    },
  },
  {
    title: 'Code generation',
    body: 'generateFormCode returns three strings: a complete component, the serialized config object, and the schema expression. The submit handler in the generated config dispatches a formedible-submit event.',
    bullets: [
      'GeneratedCodeResult has fullCode, formConfig, and schemaCode properties.',
      'Field schema mapping covers strings, number-like fields, boolean fields, arrays, and object fields.',
      'Pages and tabs are omitted when their arrays are missing or have only one entry.',
      'showProgress true writes progress: { showSteps: true, showPercentage: true } into formConfig.',
    ],
    snippet: {
      title: 'Copyable generateFormCode usage',
      language: 'ts',
      code: `import { generateFormCode } from '@/components/ui/formedible/builder';

const generated = generateFormCode({
  title: 'Account intake',
  fields: [
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'age', type: 'number', label: 'Age' },
    { name: 'newsletter', type: 'checkbox', label: 'Subscribe' },
  ],
  settings: {
    submitLabel: 'Create account',
    showProgress: true,
  },
});

const fullCode = generated.fullCode;
const formConfig = generated.formConfig;
const schemaCode = generated.schemaCode;

export { fullCode, formConfig, schemaCode };`,
    },
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/builder')({
  head: () => routeHead,
  component: BuilderRoute,
});

function BuilderRoute() {
  return (
    <DocsGuidePage
      eyebrow="Builder"
      title="Mount the visual builder as a first-party app surface."
      description="Compose fields, preview the rendered form, and generate source from the same model used by useFormedible. The builder stays in your app, beside your review and save flow."
      codeExampleIds={['builder-imports']}
      sections={sections}
      related={relatedLinks}
    />
  );
}
