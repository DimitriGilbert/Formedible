'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { Button } from '@formedible/ui/components/button';
import { FieldStore, FieldStoreContext } from '@formedible/ui/components/formedible/builder/field-store';
import { defaultTabs } from '@formedible/ui/components/formedible/builder/default-tabs';
import { cn } from '@formedible/ui/lib/utils';
import { defaultFormMetadata } from '@formedible/ui/components/formedible/lib/builder-types';
import type { FormBuilderProps, FormMetadata, TabConfig } from '@formedible/ui/components/formedible/lib/builder-types';
import type { FormedibleFieldType } from '@formedible/ui/components/formedible/lib/types';

const emptyInitialFields: NonNullable<FormBuilderProps['initialFields']> = [];

function orderTabs(tabs: readonly TabConfig[]): readonly TabConfig[] {
  return [...tabs]
    .filter((tab) => tab.enabled !== false)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

export function FormBuilder({
  tabs = defaultTabs,
  defaultTab = 'builder',
  initialMetadata,
  initialFields,
  fieldStore: fieldStoreProp,
  onChange,
  onTabChange,
  onSubmit,
  className,
}: FormBuilderProps) {
  const sortedTabs = useMemo(() => orderTabs(tabs), [tabs]);
  const initialTab = sortedTabs.some((tab) => tab.id === defaultTab) ? defaultTab : sortedTabs[0]?.id ?? 'builder';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<FormMetadata>({
    ...defaultFormMetadata,
    ...initialMetadata,
    settings: {
      ...defaultFormMetadata.settings,
      ...initialMetadata?.settings,
    },
  });

  const fieldStoreRef = useRef<FieldStore | null>(null);

  if (fieldStoreRef.current === null) {
    fieldStoreRef.current = fieldStoreProp ?? new FieldStore();
  }

  const fieldStore = fieldStoreRef.current;
  const importedInitialFields = initialFields ?? emptyInitialFields;
  const subscribeToStore = useCallback((listener: () => void) => fieldStore.subscribe(listener), [fieldStore]);
  const getStoreSnapshot = useCallback(() => fieldStore.getAllFields(), [fieldStore]);
  const fields = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => importedInitialFields,
  );

  useEffect(() => {
    fieldStore.importFields(importedInitialFields);
  }, [fieldStore, importedInitialFields]);

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.(metadata, fields);
  }, [fields, metadata]);

  function updateMetadata(metadataUpdate: Partial<FormMetadata>): void {
    setMetadata((currentMetadata) => ({
      ...currentMetadata,
      ...metadataUpdate,
      settings: {
        ...currentMetadata.settings,
        ...metadataUpdate.settings,
      },
    }));
  }

  function addField(type: FormedibleFieldType): void {
    const fieldId = fieldStore.addField(type, metadata.pages[0]?.page ?? 1);
    setSelectedFieldId(fieldId);
  }

  function deleteField(fieldId: string): void {
    fieldStore.deleteField(fieldId);
    setSelectedFieldId((currentFieldId) => (currentFieldId === fieldId ? null : currentFieldId));
  }

  function duplicateField(fieldId: string): void {
    const duplicatedFieldId = fieldStore.duplicateField(fieldId);

    if (duplicatedFieldId !== null) {
      setSelectedFieldId(duplicatedFieldId);
    }
  }

  const activeTabConfig = sortedTabs.find((tab) => tab.id === activeTab) ?? sortedTabs[0];
  const ActiveTabComponent = activeTabConfig?.component;

  return (
    <FieldStoreContext.Provider value={fieldStore}>
      <div className={cn('flex min-h-[720px] flex-col rounded-xl border bg-background text-foreground', className)} data-builder-part="form-builder">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="mr-auto">
            <h1 className="text-xl font-semibold">{metadata.title}</h1>
            <p className="text-sm text-muted-foreground">{metadata.description}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => onSubmit?.(metadata, fields)}>
            Save Form
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-b p-3">
          {sortedTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <Button
                key={tab.id}
                type="button"
                variant={tab.id === activeTab ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveTab(tab.id);
                  onTabChange?.(tab.id);
                }}
              >
                {Icon !== undefined ? <Icon className="mr-2 size-4" /> : null}
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="flex-1 p-4">
          {ActiveTabComponent !== undefined ? (
            <ActiveTabComponent
              metadata={metadata}
              fields={fields}
              selectedFieldId={selectedFieldId}
              onMetadataChange={updateMetadata}
              onAddField={addField}
              onSelectField={setSelectedFieldId}
              onDeleteField={deleteField}
              onDuplicateField={duplicateField}
            />
          ) : null}
        </div>
      </div>
    </FieldStoreContext.Provider>
  );
}
