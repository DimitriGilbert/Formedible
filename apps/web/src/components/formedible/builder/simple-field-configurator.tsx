'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

export const SimpleFieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  fieldId,
  getField,
  onUpdate,
  availablePages,
}) => {
  // Always call hooks at the top level
  const field = getField(fieldId);
  
  // Local state for form values
  const [localValues, setLocalValues] = useState(() => ({
    name: field?.name || '',
    label: field?.label || '',
    placeholder: field?.placeholder || '',
    description: field?.description || '',
    required: field?.required || false,
    page: field?.page || 1,
  }));

  // Update local values when field changes
  useEffect(() => {
    if (field) {
      setLocalValues({
        name: field.name || '',
        label: field.label || '',
        placeholder: field.placeholder || '',
        description: field.description || '',
        required: field.required || false,
        page: field.page || 1,
      });
    }
  }, [field]);

  // Schema for validation
  const configSchema = useMemo(() => z.object({
    name: z.string().min(1, 'Field name is required'),
    label: z.string().min(1, 'Label is required'),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    required: z.boolean(),
    page: z.number(),
  }), []);

  // Form fields configuration
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

  // Handle form changes
  const handleChange = useCallback(({ value }: { value: any }) => {
    setLocalValues(value);
    // Update the field immediately
    onUpdate(fieldId, {
      name: value.name,
      label: value.label,
      placeholder: value.placeholder,
      description: value.description,
      required: value.required,
      page: value.page,
    });
  }, [fieldId, onUpdate]);

  // Create the form
  const { Form } = useFormedible({
    schema: configSchema,
    fields: formFields,
    formOptions: {
      defaultValues: localValues,
      onChange: handleChange,
    },
    showSubmitButton: false,
  });

  // Render nothing if no field
  if (!field) {
    return <div className="text-muted-foreground">No field selected</div>;
  }

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