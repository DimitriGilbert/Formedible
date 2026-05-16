import { Code, Eye, Settings } from 'lucide-react';

import { Button } from '@formedible/ui/components/button';
import { CodeGenerator } from '@formedible/ui/components/formedible/builder/code-generator';
import { FieldConfigurator } from '@formedible/ui/components/formedible/builder/field-configurator';
import { FormPreview } from '@formedible/ui/components/formedible/builder/form-preview';
import { globalFieldStore } from '@formedible/ui/components/formedible/builder/field-store';
import { builderFieldTypes } from '@formedible/ui/components/formedible/lib/builder-types';
import type { TabConfig, TabContentProps } from '@formedible/ui/components/formedible/lib/builder-types';

function BuilderTabContent({ fields, selectedFieldId, metadata, onAddField, onSelectField, onDeleteField, onDuplicateField }: TabContentProps) {
  const selectedField = selectedFieldId === null ? undefined : fields.find((field) => field.id === selectedFieldId);
  const availablePages = metadata.pages.map((page) => page.page);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" data-builder-part="builder-tab">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Fields</h2>
          <p className="text-sm text-muted-foreground">Add, select, duplicate, and delete form fields.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {builderFieldTypes.map((fieldType) => (
            <Button
              key={fieldType.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddField(fieldType.value)}
            >
              {fieldType.label}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className="rounded-lg border bg-card p-3 text-card-foreground"
              data-selected={field.id === selectedFieldId ? 'true' : 'false'}
            >
              <button type="button" className="block w-full text-left" onClick={() => onSelectField(field.id)}>
                <span className="block font-medium">{field.label}</span>
                <span className="block text-xs text-muted-foreground">{field.name} · {field.type}</span>
              </button>
              <div className="mt-3 flex gap-2">
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onDuplicateField(field.id)}>
                  Duplicate
                </button>
                <button type="button" className="text-xs text-destructive hover:underline" onClick={() => onDeleteField(field.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedField !== undefined ? (
        <FieldConfigurator fieldId={selectedField.id} initialField={selectedField} availablePages={availablePages} metadata={metadata} />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Select a field to configure it.</div>
      )}
    </div>
  );
}

function PreviewTabContent({ metadata, fields }: TabContentProps) {
  return (
    <FormPreview
      config={{
        fields,
        pages: metadata.layoutType === 'pages'
          ? metadata.pages.map((page) => ({ page: page.page, title: page.title, description: page.description }))
          : undefined,
        tabs: metadata.layoutType === 'tabs'
          ? metadata.tabs.map((tab) => ({ id: tab.id, label: tab.label, description: tab.description }))
          : undefined,
        submitLabel: metadata.settings.submitLabel,
        nextLabel: metadata.settings.nextLabel,
        previousLabel: metadata.settings.previousLabel,
        progress: metadata.settings.showProgress ? { showSteps: true, showPercentage: true } : undefined,
        formOptions: {
          defaultValues: Object.fromEntries(fields.map((field) => [field.name, previewDefaultValue(field)])),
        },
      }}
    />
  );
}

function previewDefaultValue(field: TabContentProps['fields'][number]): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.type === 'checkbox' || field.type === 'switch') {
    return false;
  }

  if (field.type === 'number' || field.type === 'slider' || field.type === 'rating') {
    return field.min ?? 0;
  }

  if (field.type === 'multiSelect' || field.type === 'multiCombobox' || field.type === 'array') {
    return [];
  }

  if (field.type === 'object') {
    return {};
  }

  if (field.type === 'file' || field.type === 'location') {
    return null;
  }

  return '';
}

function CodeTabContent({ metadata, fields }: TabContentProps) {
  return <CodeGenerator metadata={metadata} fields={fields} />;
}

export const builderTab: TabConfig = {
  id: 'builder',
  label: 'Builder',
  icon: Settings,
  component: BuilderTabContent,
  enabled: true,
  order: 1,
};

export const previewTab: TabConfig = {
  id: 'preview',
  label: 'Preview',
  icon: Eye,
  component: PreviewTabContent,
  enabled: true,
  order: 2,
};

export const codeTab: TabConfig = {
  id: 'code',
  label: 'Code',
  icon: Code,
  component: CodeTabContent,
  enabled: true,
  order: 3,
};

export const defaultTabs: readonly TabConfig[] = [builderTab, previewTab, codeTab];

export function getBuilderOnlyTabs(): readonly TabConfig[] {
  return [builderTab];
}

export function getBuilderAndPreviewTabs(): readonly TabConfig[] {
  return [builderTab, previewTab];
}

export function getBuilderAndCodeTabs(): readonly TabConfig[] {
  return [builderTab, codeTab];
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
}

export { globalFieldStore };
