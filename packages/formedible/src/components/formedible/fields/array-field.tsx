'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';
import { TextField } from './text-field';
import { NumberField } from './number-field';
import { TextareaField } from './textarea-field';
import { SelectField } from './select-field';
import { CheckboxField } from './checkbox-field';
import { SwitchField } from './switch-field';
import { DateField } from './date-field';
import { SliderField } from './slider-field';
import { FileUploadField } from './file-upload-field';

// Map of field types to components
const fieldTypeComponents: Record<string, React.ComponentType<any>> = {
  text: TextField,
  email: TextField,
  password: TextField,
  url: TextField,
  tel: TextField,
  number: NumberField,
  textarea: TextareaField,
  select: SelectField,
  checkbox: CheckboxField,
  switch: SwitchField,
  date: DateField,
  slider: SliderField,
  file: FileUploadField,
};

export interface ArrayFieldSpecificProps extends BaseFieldProps {
  arrayConfig: {
    itemType: string;
    itemLabel?: string;
    itemPlaceholder?: string;
    itemValidation?: unknown;
    minItems?: number;
    maxItems?: number;
    addButtonLabel?: string;
    removeButtonLabel?: string;
    itemComponent?: React.ComponentType<any>;
    sortable?: boolean;
    defaultValue?: unknown;
    // Additional props to pass to item components
    itemProps?: Record<string, unknown>;
  };
}

export const ArrayField: React.FC<ArrayFieldSpecificProps> = ({
  fieldApi,
  arrayConfig,
  ...wrapperProps
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  
  if (!state) {
    console.error('ArrayField: fieldApi.state is undefined', fieldApi);
    return null;
  }
  
  const value = useMemo(() => (state.value as unknown[]) || [], [state.value]);
  
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
  } = arrayConfig || {};

  // Get the component for rendering items
  const ItemComponent = CustomItemComponent || fieldTypeComponents[itemType || 'text'] || TextField;

  const addItem = useCallback(() => {
    if (value.length >= maxItems) return;
    
    const newValue = [...value, defaultValue];
    handleChange(newValue);
  }, [value, maxItems, defaultValue, handleChange]);

  const removeItem = useCallback((index: number) => {
    if (value.length <= minItems) return;
    
    const newValue = value.filter((_, i) => i !== index);
    handleChange(newValue);
    handleBlur();
  }, [value, minItems, handleChange, handleBlur]);

  const updateItem = useCallback((index: number, newItemValue: unknown) => {
    const newValue = [...value];
    newValue[index] = newItemValue;
    handleChange(newValue);
  }, [value, handleChange]);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (!sortable) return;
    if (fromIndex === toIndex) return;
    
    const newValue = [...value];
    const [movedItem] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, movedItem);
    handleChange(newValue);
  }, [value, handleChange, sortable]);

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
      handleBlur: () => handleBlur(),
      form: fieldApi.form,
    };
  }, [name, value, updateItem, handleBlur, fieldApi.form]);

  const canAddMore = value.length < maxItems;
  const canRemove = value.length > minItems;

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled }) => (
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
                  <ItemComponent
                    fieldApi={createItemFieldApi(index)}
                    label={itemLabel ? `${itemLabel} ${index + 1}` : undefined}
                    placeholder={itemPlaceholder}
                    wrapperClassName="mb-0"
                    {...itemProps}
                    // Pass specific props based on item type
                    {...(itemType === 'select' && { options: itemProps.options || [] })}
                    {...(itemType === 'number' && { 
                      min: itemProps.min, 
                      max: itemProps.max, 
                      step: itemProps.step 
                    })}
                    {...(itemType === 'slider' && { 
                      min: itemProps.min, 
                      max: itemProps.max, 
                      step: itemProps.step 
                    })}
                    {...(itemType === 'file' && { 
                      accept: itemProps.accept,
                      multiple: itemProps.multiple 
                    })}
                    {...(itemType === 'date' && typeof itemProps.dateProps === 'object' && itemProps.dateProps ? itemProps.dateProps : {})}
                    {...(['text', 'email', 'password', 'url', 'tel'].includes(itemType) && {
                      type: itemType,
                      datalist: itemProps.datalist,
                    })}
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
      )}
    </BaseFieldWrapper>
  );
}; 