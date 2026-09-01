import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { arrayItemFieldPath, joinFieldPath, objectScopeValues } from '@formedible/ui/components/formedible/lib/field-path';
import { normalizeFieldConfig, normalizeNestedFieldConfig } from '@formedible/ui/components/formedible/lib/normalize-field-config';
import { cn } from '@formedible/ui/lib/utils';
import type { FormedibleFieldConfig, FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

function arrayValue(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function defaultItemValue<TFormValues extends FormedibleFormValues>(fieldConfig: FormedibleFieldRenderProps<TFormValues>['fieldConfig']) {
  if (fieldConfig.arrayConfig && 'defaultValue' in fieldConfig.arrayConfig) {
    return fieldConfig.arrayConfig.defaultValue;
  }

  if (fieldConfig.arrayConfig?.itemType === 'object') {
    return {};
  }

  if (fieldConfig.arrayConfig?.itemType === 'number') {
    return 0;
  }

  if (fieldConfig.arrayConfig?.itemType === 'checkbox' || fieldConfig.arrayConfig?.itemType === 'switch') {
    return false;
  }

  return '';
}

function primitiveItemField<TFormValues extends FormedibleFormValues>(fieldConfig: FormedibleFieldRenderProps<TFormValues>['fieldConfig']): FormedibleFieldConfig<TFormValues> {
  const itemType = fieldConfig.arrayConfig?.itemType;

  return {
    name: fieldConfig.name,
    type: itemType === 'string' ? 'text' : itemType === 'email' ? 'email' : itemType,
    label: undefined,
    placeholder: typeof fieldConfig.arrayConfig?.itemPlaceholder === 'string' ? fieldConfig.arrayConfig.itemPlaceholder : fieldConfig.placeholder,
  };
}

export function reorderArrayItems(items: readonly unknown[], fromIndex: number, toIndex: number): readonly unknown[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const currentItem = nextItems[fromIndex];
  nextItems[fromIndex] = nextItems[toIndex];
  nextItems[toIndex] = currentItem;

  return nextItems;
}

export function ArrayField<TFormValues extends FormedibleFormValues>({ fieldConfig, field, renderField }: FormedibleFieldRenderProps<TFormValues>) {
  const items = arrayValue(field.value);
  const minItems = fieldConfig.arrayConfig?.minItems ?? 0;
  const maxItems = fieldConfig.arrayConfig?.maxItems;
  const sortable = fieldConfig.arrayConfig?.sortable ?? false;
  const itemLabel = typeof fieldConfig.arrayConfig?.itemLabel === 'string' ? fieldConfig.arrayConfig.itemLabel : 'Item';
  const addButtonLabel = typeof fieldConfig.arrayConfig?.addButtonLabel === 'string' ? fieldConfig.arrayConfig.addButtonLabel : `Add ${itemLabel}`;
  const removeButtonLabel = typeof fieldConfig.arrayConfig?.removeButtonLabel === 'string' ? fieldConfig.arrayConfig.removeButtonLabel : 'Remove';
  const canAdd = maxItems === undefined || items.length < maxItems;
  // Loop invariants hoisted out of the item map: the item-shape config is fixed
  // per field, so both the normalized nested configs (memoized per config
  // identity) and the primitive item template are computed once per render,
  // not once per item per render.
  const isObjectItem = fieldConfig.arrayConfig?.itemType === 'object';
  const normalizedObjectFields = (fieldConfig.arrayConfig?.objectConfig?.fields ?? []).map((nestedField) => normalizeNestedFieldConfig<TFormValues>(nestedField));
  const objectLayout = fieldConfig.arrayConfig?.objectConfig?.layout ?? 'stack';
  const objectColumns = fieldConfig.arrayConfig?.objectConfig?.columns ?? 1;
  const primitiveItemConfig = normalizeFieldConfig<TFormValues>(primitiveItemField(fieldConfig));

  if (!renderField) {
    return <FieldWrapper fieldConfig={fieldConfig} field={field}>{undefined}</FieldWrapper>;
  }

  function updateItems(nextItems: readonly unknown[]) {
    field.onChange([...nextItems]);
  }

  function addItem() {
    if (canAdd) {
      updateItems([...items, defaultItemValue(fieldConfig)]);
    }
  }

  function removeItem(index: number) {
    if (items.length > minItems) {
      updateItems(items.filter((_item, itemIndex) => itemIndex !== index));
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    updateItems(reorderArrayItems(items, index, targetIndex));
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div data-formedible-array-field={field.name} className="space-y-3">
        {items.map((item, index) => {
          const itemPath = arrayItemFieldPath(field.name, index);

          return (
            <div key={itemPath} data-formedible-array-item={itemPath} className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{`${itemLabel} ${index + 1}`}</div>
                <div className="flex gap-1">
                  {sortable ? (
                    <>
                      <Button variant="ghost" size="icon" aria-label={`Move ${itemLabel} ${index + 1} up`} disabled={index === 0} onClick={() => moveItem(index, -1)}>
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Move ${itemLabel} ${index + 1} down`} disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>
                        <ArrowDown aria-hidden="true" className="size-4" />
                      </Button>
                    </>
                  ) : undefined}
                  <Button variant="ghost" size="icon" aria-label={`${removeButtonLabel} ${index + 1}`} disabled={items.length <= minItems} onClick={() => removeItem(index)}>
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </div>
              {isObjectItem ? (
                <div
                  className={cn('space-y-4', objectLayout === 'grid' && objectColumns > 1 ? 'grid gap-4 space-y-0' : undefined)}
                  style={objectLayout === 'grid' && objectColumns > 1 ? { gridTemplateColumns: `repeat(${objectColumns}, minmax(0, 1fr))` } : undefined}
                >
                  {normalizedObjectFields.map((nestedConfig) => {
                    const nestedName = joinFieldPath(itemPath, nestedConfig.name);

                    return renderField(nestedConfig, {
                      key: nestedName,
                      name: nestedName,
                      localValues: objectScopeValues(item),
                    });
                  })}
                </div>
              ) : (
                renderField(primitiveItemConfig, {
                  key: itemPath,
                  name: itemPath,
                  localValues: { value: item },
                })
              )}
            </div>
          );
        })}
        <Button variant="outline" size="sm" disabled={!canAdd} onClick={addItem}>
          <Plus aria-hidden="true" className="size-4" />
          {addButtonLabel}
        </Button>
      </div>
    </FieldWrapper>
  );
}
