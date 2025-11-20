"use client";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { ArrayFieldProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { NestedFieldRenderer } from "./shared-field-renderer";
import { useFieldState } from "@/hooks/use-field-state";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable item component
interface SortableItemProps {
  id: string;
  index: number;
  children: React.ReactNode;
  isDisabled?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
  removeButtonLabel?: string;
  sortable?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  index,
  children,
  isDisabled = false,
  onRemove,
  canRemove = true,
  removeButtonLabel = "Remove",
  sortable = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !sortable || isDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-3 border rounded-lg bg-card ${
        isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
      } ${!sortable || isDisabled ? "" : "hover:shadow-sm transition-shadow"}`}
    >
      {sortable && (
        <button
          type="button"
          className="mt-2 p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing touch-manipulation"
          disabled={isDisabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <div className="flex-1">{children}</div>

      {canRemove && onRemove && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="mt-2 h-8 w-8 p-0 text-destructive hover:text-destructive"
          title={removeButtonLabel}
          disabled={isDisabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const ArrayField: React.FC<ArrayFieldProps> = ({
  fieldApi,
  label,
  description,
  inputClassName,
  labelClassName,
  wrapperClassName,
  arrayConfig,
}) => {
  const { name, value: fieldValue, isDisabled, onChange, onBlur } = useFieldState(fieldApi);

  const value = useMemo(
    () => (fieldValue as unknown[]) || [],
    [fieldValue]
  );

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
    defaultValue = "",
    itemProps = {},
    objectConfig,
  } = arrayConfig || {};

  // Create field config for each item
  const createItemFieldConfig = useCallback(
    (index: number) => {
      const baseConfig: any = {
        name: `${name}[${index}]`,
        type: itemType || "text",
        label: itemLabel ? `${itemLabel} ${index + 1}` : undefined,
        placeholder: itemPlaceholder,
        component: CustomItemComponent,
        ...itemProps,
      };

      // Add object config if item type is object
      if (itemType === "object" && objectConfig) {
        baseConfig.objectConfig = objectConfig;
      }

      return baseConfig;
    },
    [
      name,
      itemType,
      itemLabel,
      itemPlaceholder,
      CustomItemComponent,
      itemProps,
      objectConfig,
    ]
  );

  const addItem = useCallback(() => {
    if (value.length >= maxItems) return;

    const newValue = [...value, defaultValue];
    onChange(newValue);
  }, [value, maxItems, defaultValue, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      if (value.length <= minItems) return;

      const newValue = value.filter((_, i) => i !== index);
      onChange(newValue);
      onBlur();
    },
    [value, minItems, onChange, onBlur]
  );

  const updateItem = useCallback(
    (index: number, newItemValue: unknown) => {
      const newValue = [...value];
      newValue[index] = newItemValue;
      onChange(newValue);
    },
    [value, onChange]
  );

  // DnD Kit state and handlers
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Create sensors with touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create unique IDs for each array item
  const itemIds = useMemo(
    () => value.map((_, index) => `array-item-${index}`),
    [value]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Extract index from ID
    const index = parseInt(active.id.toString().split('-').pop() || '0');
    setDraggedItemIndex(index);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && sortable) {
      const oldIndex = itemIds.indexOf(active.id.toString());
      const newIndex = itemIds.indexOf(over!.id.toString());

      if (oldIndex !== -1 && newIndex !== -1) {
        const newValue = arrayMove(value, oldIndex, newIndex);
        onChange(newValue);
      }
    }

    setActiveId(null);
    setDraggedItemIndex(null);
  }, [itemIds, value, onChange, sortable]);

  // Create a mock field API for each item
  const createItemFieldApi = useCallback(
    (index: number) => {
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
    },
    [name, value, updateItem, fieldApi]
  );

  const canAddMore = value.length < maxItems;
  const canRemove = value.length > minItems;

  // Render the dragged item for overlay
  const renderDraggedItem = useCallback(() => {
    if (draggedItemIndex === null) return null;
    
    return (
      <div className="flex items-start gap-2 p-3 border rounded-lg bg-card shadow-lg opacity-90">
        {sortable && (
          <div className="mt-2 p-1 rounded">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <NestedFieldRenderer
            fieldConfig={createItemFieldConfig(draggedItemIndex)}
            fieldApi={createItemFieldApi(draggedItemIndex) as any}
            form={fieldApi.form}
            currentValues={
              (value[draggedItemIndex] || {}) as Record<string, unknown>
            }
          />
        </div>
        {canRemove && (
          <div className="mt-2 h-8 w-8 p-0" />
        )}
      </div>
    );
  }, [
    draggedItemIndex, 
    sortable, 
    createItemFieldConfig, 
    createItemFieldApi, 
    fieldApi.form, 
    value, 
    canRemove
  ]);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={itemIds}
            strategy={verticalListSortingStrategy}
            disabled={!sortable || isDisabled}
          >
            <div className="space-y-3">
              {value.map((_, index) => (
                <SortableItem
                  key={`array-item-${index}`}
                  id={`array-item-${index}`}
                  index={index}
                  isDisabled={isDisabled}
                  onRemove={canRemove ? () => removeItem(index) : undefined}
                  canRemove={canRemove}
                  removeButtonLabel={removeButtonLabel}
                  sortable={sortable}
                >
                  <NestedFieldRenderer
                    fieldConfig={createItemFieldConfig(index)}
                    fieldApi={createItemFieldApi(index) as any}
                    form={fieldApi.form}
                    currentValues={
                      (value[index] || {}) as Record<string, unknown>
                    }
                  />
                </SortableItem>
              ))}

              {value.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs mt-1">
                    Click &quot;{addButtonLabel}&quot; to add your first item
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeId ? renderDraggedItem() : null}
          </DragOverlay>
        </DndContext>

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
            Minimum {minItems} item{minItems !== 1 ? "s" : ""} required
          </p>
        )}
      </div>
    </FieldWrapper>
  );
};
