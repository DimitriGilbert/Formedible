'use client';
import React, { useMemo, useCallback } from 'react';
import { useFormedible } from '@/hooks/use-formedible';
import { z } from 'zod';

interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  page?: number;
  group?: string;
}

interface FieldConfiguratorProps {
  fieldId: string;
  getField: (id: string) => FormField | undefined;
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  availablePages: number[];
}

const configSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean(),
  page: z.number(),
});

export const SimpleFieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  fieldId,
  getField,
  onUpdate,
  availablePages,
}) => {
  const field = getField(fieldId);

  // Form fields configuration - stable reference
  const formFields = useMemo(() => [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      placeholder: 'e.g., firstName, email',
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      placeholder: 'e.g., First Name, Email Address',
    },
    {
      name: 'placeholder',
      type: 'text',
      label: 'Placeholder',
      placeholder: 'e.g., Enter your name...',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Optional description or help text',
    },
    {
      name: 'required',
      type: 'switch',
      label: 'Required Field',
      description: 'Make this field mandatory',
    },
    {
      name: 'page',
      type: 'select',
      label: 'Page',
      options: availablePages.map(p => ({ value: p.toString(), label: `Page ${p}` })),
      description: 'Which page should this field appear on?',
    },
  ], [availablePages]);

  // Default values - stable reference
  const defaultValues = useMemo(() => ({
    name: field?.name || '',
    label: field?.label || '',
    placeholder: field?.placeholder || '',
    description: field?.description || '',
    required: field?.required || false,
    page: field?.page || 1,
  }), [field?.name, field?.label, field?.placeholder, field?.description, field?.required, field?.page]);

  // Handle form changes - stable reference
  const handleChange = useCallback(({ value }: { value: any }) => {
    onUpdate(fieldId, {
      name: value.name,
      label: value.label,
      placeholder: value.placeholder,
      description: value.description,
      required: value.required,
      page: value.page,
    });
  }, [fieldId, onUpdate]);

  // Render nothing if no field
  if (!field) {
    return <div className="text-muted-foreground">No field selected</div>;
  }

  // Create the form with stable references - MOVED INSIDE RENDER
  const { Form } = useFormedible({
    schema: configSchema,
    fields: formFields,
    formOptions: {
      defaultValues,
      onChange: handleChange,
    },
    showSubmitButton: false,
  });

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h4 className="font-medium">Field Configuration</h4>
        <p className="text-sm text-muted-foreground">
          Configure the properties for this {field.type} field
        </p>
      </div>
      <Form />
    </div>
  );
};