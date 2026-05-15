import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/builder');

const relatedLinks = [
  { title: 'API', description: 'Hook options, field config, tabs, pages, persistence, analytics, and form props.', href: '/docs/api' },
  { title: 'AI Builder', description: 'Generate draft forms, then send them through the parser and field model.', href: '/docs/ai-builder' },
  { title: 'Getting Started', description: 'Install the copied files and render your first Formedible form.', href: '/docs/getting-started' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Public exports',
    body: 'Import builder pieces from the package root. It exports the visual builder, tab helpers, field store, and code-generation functions.',
    bullets: [
      'FormBuilder, FieldConfigurator, FormPreview, and CodeGenerator are root exports.',
      'FieldStore and globalFieldStore are root exports.',
      'generateFormCode and generateCodeFromParsedConfig are exported from the same root file.',
    ],
    snippet: {
      title: 'packages/builder/src/index.ts',
      language: 'ts',
      code: `export { FormBuilder } from '@/components/ui/formedible/builder/form-builder';
export { FieldStore, globalFieldStore } from '@/components/ui/formedible/builder/field-store';
export {
  createTabsWithDisabled,
  createTabsWithOrder,
  defaultTabs,
  getBuilderAndCodeTabs,
  getBuilderAndPreviewTabs,
  getBuilderOnlyTabs,
} from '@/components/ui/formedible/builder/default-tabs';
export { generateCodeFromParsedConfig, generateFormCode } from '@/components/ui/formedible/lib/code-generation';`,
    },
  },
  {
    title: 'FormBuilder props and rendering path',
    body: 'FormBuilder wires the tab UI to the global field store. It imports initial fields, reports changes, and calls onSubmit from Save Form.',
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
    body: 'The default tab module defines builder, preview, and code tabs. Helper functions return fixed, ordered, or disabled copies.',
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
    body: 'FieldStore keeps fields by id plus a separate order array. After each change, it rebuilds the readonly snapshot and notifies listeners.',
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
    body: 'generateFormCode returns a full component string, a serialized config string, and a schema string. The generated submit handler dispatches a formedible-submit event.',
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
      title="Mount the visual builder inside your app."
      description="Compose fields, preview the form, and generate code from the same model used by useFormedible. Keep the builder next to your review and save flow."
      codeExampleIds={['builder-imports']}
      sections={sections}
      related={relatedLinks}
    />
  );
}
