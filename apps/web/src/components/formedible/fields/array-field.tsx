'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { BaseFieldProps, ArrayFieldProps } from '@/lib/formedible/types';
import { FieldWrapper } from './base-field-wrapper';
import { NestedFieldRenderer } from './shared-field-renderer';

export const ArrayField: React.FC<ArrayFieldProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  arrayConfig,
}) => {
  const name = fieldApi.name;
  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;
  
  const value = useMemo(() => (fieldApi.state?.value as unknown[]) || [], [fieldApi.state?.value]);
  
  const {
    itemType,
    itemLabel,
    itemPlaceholder,
    minItems = 0,
    maxItems = 10,
    addButtonLabel = "Add Item",
    removeButtonLabel = "Remove",
    itemComponent: CustomItemComponent,
    sortable = false,
    defaultValue = '',
    itemProps = {},
    objectConfig,
  } = arrayConfig || {};

  // Create field config for each item
  const createItemFieldConfig = useCallback((index: number) => {
    const baseConfig: any = {
      name: `${name}[${index}]`,
      type: itemType || 'text',
      label: itemLabel ? `${itemLabel} ${index + 1}` : undefined,
      placeholder: itemPlaceholder,
      component: CustomItemComponent,
      ...itemProps,
    };

    // Add object config if item type is object
    if (itemType === 'object' && objectConfig) {
      baseConfig.objectConfig = objectConfig;
    }

    return baseConfig;
  }, [name, itemType, itemLabel, itemPlaceholder, CustomItemComponent, itemProps, objectConfig]);

  const addItem = useCallback(() => {
    if (value.length >= maxItems) return;
    
    const newValue = [...value, defaultValue];
    fieldApi.handleChange(newValue);
  }, [value, maxItems, defaultValue, fieldApi]);

  const removeItem = useCallback((index: number) => {
    if (value.length <= minItems) return;
    
    const newValue = value.filter((_, i) => i !== index);
    fieldApi.handleChange(newValue);
    fieldApi.handleBlur();
  }, [value, minItems, fieldApi]);

  const updateItem = useCallback((index: number, newItemValue: unknown) => {
    const newValue = [...value];
    newValue[index] = newItemValue;
    fieldApi.handleChange(newValue);
  }, [value, fieldApi]);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (!sortable) return;
    if (fromIndex === toIndex) return;
    
    const newValue = [...value];
    const [movedItem] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, movedItem);
    fieldApi.handleChange(newValue);
  }, [value, fieldApi, sortable]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);



  // Create a mock field API for each item
  const createItemFieldApi = useCallback((index: number) => {
    return {
      name: `${name}[${index}]`,
      state: {
        value: value[index],
        meta: {
          errors: [],
          isTouched: false,
          isValidating: false,
        },
      },
      handleChange: (newValue: unknown) => updateItem(index, newValue),
      handleBlur: () => fieldApi.handleBlur(),
      form: fieldApi.form,
    };
  }, [name, value, updateItem, fieldApi]);

  const canAddMore = value.length < maxItems;
  const canRemove = value.length > minItems;

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <div className="space-y-4">
        <div className="space-y-3">
          {value.map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 border rounded-lg bg-card"
                onDragOver={sortable ? (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                } : undefined}
                onDrop={sortable ? (e) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== index) {
                    moveItem(draggedIndex, index);
                  }
                } : undefined}
              >
                {sortable && (
                  <button
                    type="button"
                    className="mt-2 p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      setDraggedIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                    }}
                    disabled={isDisabled}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                
                <div className="flex-1">
                  <NestedFieldRenderer
                    fieldConfig={createItemFieldConfig(index)}
                    fieldApi={createItemFieldApi(index) as any}
                    form={fieldApi.form}
                    currentValues={fieldApi.form?.state?.values || {}}
                  />
                </div>
                
                {canRemove && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="mt-2 h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title={removeButtonLabel}
                    disabled={isDisabled}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {value.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="text-sm">No items added yet</p>
                <p className="text-xs mt-1">Click &quot;{addButtonLabel}&quot; to add your first item</p>
              </div>
            )}
          </div>
          
          {canAddMore && (
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
              disabled={isDisabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              {addButtonLabel}
            </Button>
          )}
          
          {minItems > 0 && value.length < minItems && (
            <p className="text-xs text-muted-foreground">
              Minimum {minItems} item{minItems !== 1 ? 's' : ''} required
            </p>
          )}
        </div>
    </FieldWrapper>
  );
}; 