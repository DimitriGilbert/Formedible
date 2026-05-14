'use client';

import { useSyncExternalStore } from 'react';

import { Button } from '@formedible/ui/components/button';
import { Checkbox } from '@formedible/ui/components/checkbox';
import { Field, FieldDescription, FieldLabel } from '@formedible/ui/components/field';
import { Input } from '@formedible/ui/components/input';
import { Textarea } from '@formedible/ui/components/textarea';
import { cn } from '@formedible/ui/lib/utils';
import { globalFieldStore } from '@/components/formedible/builder/field-store';
import type { FormField } from '@/lib/formedible/builder-types';

export interface FieldConfiguratorProps {
  readonly fieldId: string;
  readonly initialField: FormField;
  readonly availablePages?: readonly number[];
  readonly onFieldChange?: (field: FormField) => void;
  readonly className?: string;
}

export function FieldConfigurator({
  fieldId,
  initialField,
  availablePages = [1],
  onFieldChange,
  className,
}: FieldConfiguratorProps) {
  const field = useSyncExternalStore(
    (listener) => globalFieldStore.subscribeToFieldUpdates(fieldId, listener),
    () => globalFieldStore.getField(fieldId) ?? initialField,
    () => initialField,
  );

  function updateField(fieldUpdate: Partial<FormField>): void {
    const updatedField = globalFieldStore.updateField(fieldId, fieldUpdate) ?? globalFieldStore.replaceField(fieldId, {
      ...field,
      ...fieldUpdate,
    });
    onFieldChange?.(updatedField);
  }

  const optionsText = Array.isArray(field.options)
    ? field.options.map((option) => (typeof option === 'string' ? option : option.value)).join('\n')
    : '';

  return (
    <div className={cn('space-y-4 rounded-lg border bg-card p-4 text-card-foreground', className)} data-builder-part="field-configurator">
      <div>
        <h2 className="text-lg font-semibold">Configure Field</h2>
        <p className="text-sm text-muted-foreground">Update the selected field metadata and behavior.</p>
      </div>

      <Field>
        <FieldLabel htmlFor={`${fieldId}-label`}>Label</FieldLabel>
        <Input
          id={`${fieldId}-label`}
          value={String(field.label)}
          onChange={(event) => updateField({ label: event.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${fieldId}-name`}>Name</FieldLabel>
        <Input
          id={`${fieldId}-name`}
          value={field.name}
          onChange={(event) => updateField({ name: event.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${fieldId}-placeholder`}>Placeholder</FieldLabel>
        <Input
          id={`${fieldId}-placeholder`}
          value={field.placeholder ?? ''}
          onChange={(event) => updateField({ placeholder: event.currentTarget.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${fieldId}-description`}>Description</FieldLabel>
        <Textarea
          id={`${fieldId}-description`}
          value={String(field.description ?? '')}
          onChange={(event) => updateField({ description: event.currentTarget.value })}
        />
      </Field>

      <Field className="flex flex-row items-center gap-3">
        <Checkbox
          id={`${fieldId}-required`}
          checked={field.required === true}
          onCheckedChange={(checked) => updateField({ required: checked === true })}
        />
        <FieldLabel htmlFor={`${fieldId}-required`}>Required</FieldLabel>
      </Field>

      {availablePages.length > 1 ? (
        <Field>
          <FieldLabel>Page</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {availablePages.map((page) => (
              <Button
                key={page}
                type="button"
                variant={(field.page ?? 1) === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateField({ page })}
              >
                Page {page}
              </Button>
            ))}
          </div>
        </Field>
      ) : null}

      {field.type === 'select' || field.type === 'radio' || field.type === 'multiSelect' ? (
        <Field>
          <FieldLabel htmlFor={`${fieldId}-options`}>Options</FieldLabel>
          <Textarea
            id={`${fieldId}-options`}
            value={optionsText}
            onChange={(event) => updateField({ options: event.currentTarget.value.split('\n').filter((option) => option.length > 0) })}
          />
          <FieldDescription>One option per line.</FieldDescription>
        </Field>
      ) : null}

      {field.type === 'number' || field.type === 'slider' || field.type === 'rating' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor={`${fieldId}-min`}>Min</FieldLabel>
            <Input
              id={`${fieldId}-min`}
              type="number"
              value={field.min ?? ''}
              onChange={(event) => updateField({ min: event.currentTarget.valueAsNumber })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-max`}>Max</FieldLabel>
            <Input
              id={`${fieldId}-max`}
              type="number"
              value={field.max ?? ''}
              onChange={(event) => updateField({ max: event.currentTarget.valueAsNumber })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-step`}>Step</FieldLabel>
            <Input
              id={`${fieldId}-step`}
              type="number"
              value={field.step ?? ''}
              onChange={(event) => updateField({ step: event.currentTarget.valueAsNumber })}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
