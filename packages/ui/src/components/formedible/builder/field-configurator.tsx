'use client';

import { useSyncExternalStore } from 'react';

import { FieldConfigurationForm } from '@formedible/ui/components/formedible/builder/field-configuration-form';
import { useFieldStore } from '@formedible/ui/components/formedible/builder/field-store';
import { cn } from '@formedible/ui/lib/utils';
import type { FormMetadata } from '@formedible/ui/components/formedible/lib/builder-types';
import type { FormField } from '@formedible/ui/components/formedible/lib/builder-types';

export interface FieldConfiguratorProps {
  readonly fieldId: string;
  readonly initialField: FormField;
  readonly availablePages?: readonly number[];
  readonly metadata?: FormMetadata;
  readonly onFieldChange?: (field: FormField) => void;
  readonly className?: string;
}

export function FieldConfigurator({
  fieldId,
  initialField,
  availablePages = [1],
  metadata,
  onFieldChange,
  className,
}: FieldConfiguratorProps) {
  const fieldStore = useFieldStore();

  const field = useSyncExternalStore(
    (listener) => fieldStore.subscribeToFieldUpdates(fieldId, listener),
    () => fieldStore.getField(fieldId) ?? initialField,
    () => initialField,
  );

  function updateField(fieldUpdate: Partial<FormField>): void {
    let updatedField: FormField | undefined;

    try {
      updatedField = fieldStore.updateField(fieldId, fieldUpdate);
    } catch (error) {
      console.error('[Formedible builder] field update rejected:', error);
      return;
    }

    if (updatedField === undefined) {
      return;
    }

    onFieldChange?.(updatedField);
  }

  return (
    <div className={cn('space-y-4 rounded-lg border bg-card p-4 text-card-foreground', className)} data-builder-part="field-configurator">
      <FieldConfigurationForm key={field.id} field={field} availablePages={availablePages} metadata={metadata} onFieldUpdate={updateField} />
    </div>
  );
}
