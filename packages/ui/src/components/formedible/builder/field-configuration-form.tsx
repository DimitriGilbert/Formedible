'use client';

import { useMemo } from 'react';

import { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';
import type { FormedibleFormValues, UseFormedibleOptions } from '@formedible/ui/components/formedible/lib/types';
import type { FormField, FormMetadata } from '@formedible/ui/components/formedible/lib/builder-types';
import { getFieldConfigFormDefinition } from '@formedible/ui/components/formedible/lib/builder-config-registry';

export interface FieldConfigurationFormProps {
  readonly field: FormField;
  readonly availablePages: readonly number[];
  readonly metadata?: FormMetadata;
  readonly onFieldUpdate: (fieldUpdate: Partial<FormField>) => void;
}

export function FieldConfigurationForm({ field, availablePages, metadata, onFieldUpdate }: FieldConfigurationFormProps) {
  const definition = getFieldConfigFormDefinition(field.type);
  const context = useMemo(() => ({ availablePages, metadata }), [availablePages, metadata]);
  const config = useMemo<UseFormedibleOptions<FormedibleFormValues>>(() => {
    const defaultValues = definition.defaultValues(field, context);

    return {
      fields: definition.fields(context),
      formOptions: {
        defaultValues,
        onChange: ({ value }) => {
          onFieldUpdate(definition.toFieldUpdate(value, field));
        },
        onSubmit: async ({ value }) => {
          onFieldUpdate(definition.toFieldUpdate(value, field));
        },
      },
      showSubmitButton: false,
    };
  }, [context, definition, field, onFieldUpdate]);
  const { Form } = useFormedible(config);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{definition.title}</h2>
        <p className="text-sm text-muted-foreground">{definition.description}</p>
      </div>
      <div className="space-y-4">
        <Form />
      </div>
    </div>
  );
}
