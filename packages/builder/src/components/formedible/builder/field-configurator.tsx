'use client';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
  validation?: any;
  page?: number;
  group?: string;
  section?: {
    title: string;
    description?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  };
  help?: {
    text?: string;
    tooltip?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: any;
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
}

// STABLE PROPS - NEVER CHANGE!
interface FieldConfiguratorProps {
  fieldId: string; // Only the ID - NEVER the full object
  getField: (id: string) => FormField | undefined; // Stable function reference
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void; // Stable function reference
  availablePages: number[]; // This can change but rarely
}

const FIELD_TYPES = [
  { value: "text", label: "Text Input", icon: "📝" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "password", label: "Password", icon: "🔒" },
  { value: "textarea", label: "Textarea", icon: "📄" },
  { value: "number", label: "Number", icon: "🔢" },
  { value: "select", label: "Select", icon: "📋" },
  { value: "radio", label: "Radio Group", icon: "⚪" },
  { value: "multiSelect", label: "Multi-Select", icon: "☑️" },
  { value: "checkbox", label: "Checkbox", icon: "✅" },
  { value: "switch", label: "Switch", icon: "🔘" },
  { value: "date", label: "Date Picker", icon: "📅" },
  { value: "slider", label: "Slider", icon: "🎚️" },
  { value: "rating", label: "Rating", icon: "⭐" },
  { value: "colorPicker", label: "Color Picker", icon: "🎨" },
  { value: "phone", label: "Phone Number", icon: "📞" },
  { value: "file", label: "File Upload", icon: "📎" },
  { value: "array", label: "Array Field", icon: "📚" },
];

// INTERNAL COMPONENT - NEVER RE-RENDERS UNLESS fieldId CHANGES
const FieldConfiguratorInternal: React.FC<FieldConfiguratorProps> = ({
  fieldId,
  getField,
  onUpdate,
  availablePages,
}) => {
  // Get initial field data ONCE
  const initialField = getField(fieldId);
  
  // LOCAL STATE - completely independent from parent
  const [localField, setLocalField] = useState<FormField>(() => 
    initialField || {
      id: fieldId,
      name: '',
      type: 'text',
      label: '',
    } as FormField
  );

  // Only sync when fieldId changes (new field selected)
  useEffect(() => {
    const field = getField(fieldId);
    if (field) {
      setLocalField(field);
    }
  }, [fieldId, getField]);

  // Base configuration fields
  const baseFields = useMemo(() => [
    {
      name: 'name',
      type: 'text',
      label: 'Field Name',
      placeholder: 'e.g., firstName, email',
      validation: z.string().min(1, 'Field name is required'),
      help: {
        text: 'Unique identifier for this field',
        tooltip: 'Used as the key in form data'
      }
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      placeholder: 'e.g., First Name, Email Address',
      validation: z.string().min(1, 'Label is required'),
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

  // Field-specific configuration
  const getFieldSpecificConfig = useCallback(() => {
    switch (localField.type) {
      case 'select':
      case 'radio':
        return [
          {
            name: 'options',
            type: 'array',
            label: 'Options',
            arrayConfig: {
              itemType: 'text',
              itemLabel: 'Option',
              itemPlaceholder: 'Option value',
              minItems: 1,
              addButtonLabel: 'Add Option',
              removeButtonLabel: 'Remove',
            },
            validation: z.array(z.string()).min(1, 'At least one option is required'),
          },
        ];

      case 'multiSelect':
        return [
          {
            name: 'options',
            type: 'array',
            label: 'Options',
            arrayConfig: {
              itemType: 'text',
              itemLabel: 'Option',
              minItems: 1,
              addButtonLabel: 'Add Option',
            },
            validation: z.array(z.string()).min(1, 'At least one option is required'),
          },
          {
            name: 'multiSelectConfig.maxSelections',
            type: 'number',
            label: 'Max Selections',
            placeholder: '5',
            description: 'Maximum number of selections allowed',
          },
          {
            name: 'multiSelectConfig.searchable',
            type: 'switch',
            label: 'Searchable',
            description: 'Allow users to search options',
          },
        ];

      case 'rating':
        return [
          {
            name: 'ratingConfig.max',
            type: 'number',
            label: 'Maximum Rating',
            placeholder: '5',
            description: 'Highest rating value',
          },
          {
            name: 'ratingConfig.allowHalf',
            type: 'switch',
            label: 'Allow Half Ratings',
            description: 'Enable half-star ratings',
          },
        ];

      case 'number':
      case 'slider':
        return [
          {
            name: 'min',
            type: 'number',
            label: 'Minimum Value',
            placeholder: '0',
          },
          {
            name: 'max',
            type: 'number',
            label: 'Maximum Value',
            placeholder: '100',
          },
          {
            name: 'step',
            type: 'number',
            label: 'Step',
            placeholder: '1',
            description: 'Increment/decrement step',
          },
        ];

      default:
        return [];
    }
  }, [localField.type]);

  // Convert field to form values
  const getFormValues = useCallback(() => {
    const values: any = {
      name: localField.name,
      label: localField.label,
      placeholder: localField.placeholder || '',
      description: localField.description || '',
      required: localField.required || false,
      page: localField.page?.toString() || '1',
    };

    // Handle field-specific configs
    if (localField.options) {
      values.options = localField.options.map((opt: any) => typeof opt === 'string' ? opt : opt.value);
    }

    // Add field-specific config values
    const configs = ['multiSelectConfig', 'ratingConfig'];
    configs.forEach(configKey => {
      const config = (localField as any)[configKey];
      if (config) {
        Object.keys(config).forEach(key => {
          values[`${configKey}.${key}`] = config[key];
        });
      }
    });

    return values;
  }, [localField]);

  // Handle form changes - update local state AND parent
  const handleFormChange = useCallback(({ value }: any) => {
    const updates: Partial<FormField> = {
      name: value.name,
      label: value.label,
      placeholder: value.placeholder || undefined,
      description: value.description || undefined,
      required: value.required,
      page: parseInt(value.page) || 1,
    };

    // Handle options
    if (value.options) {
      updates.options = value.options.map((opt: string) => ({ value: opt, label: opt }));
    }

    // Handle field-specific configs
    const configKeys = ['multiSelectConfig', 'ratingConfig'];
    configKeys.forEach(configKey => {
      const configValues: any = {};
      let hasValues = false;

      Object.keys(value).forEach(key => {
        if (key.startsWith(`${configKey}.`)) {
          const subKey = key.replace(`${configKey}.`, '');
          configValues[subKey] = value[key];
          hasValues = true;
        }
      });

      if (hasValues) {
        (updates as any)[configKey] = configValues;
      }
    });

    // Update local state immediately
    setLocalField(prev => ({ ...prev, ...updates }));
    
    // Update parent
    onUpdate(fieldId, updates);
  }, [fieldId, onUpdate]);

  const allFields = [
    ...baseFields,
    ...getFieldSpecificConfig(),
  ];

  const { Form } = useFormedible({
    fields: allFields,
    formOptions: {
      defaultValues: getFormValues(),
      onChange: handleFormChange,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 pb-4 border-b">
        <div className="text-lg">
          {FIELD_TYPES.find(t => t.value === localField.type)?.icon || '📝'}
        </div>
        <div>
          <div className="font-medium">{localField.label}</div>
          <div className="text-sm text-muted-foreground">{localField.type}</div>
        </div>
      </div>
      
      <Form />
    </div>
  );
};

// MEMOIZED COMPONENT - ONLY RE-RENDERS WHEN fieldId CHANGES
export const FieldConfigurator = React.memo(FieldConfiguratorInternal, (prevProps, nextProps) => {
  // ONLY re-render if fieldId changes
  return prevProps.fieldId === nextProps.fieldId;
});