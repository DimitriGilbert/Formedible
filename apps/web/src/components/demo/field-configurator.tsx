'use client';
import React, { useCallback, useMemo } from 'react';
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

interface FieldConfiguratorProps {
  field: FormField;
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  availablePages: number[];
}

export const FieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  field,
  onUpdate,
  availablePages,
}) => {
  const updateField = useCallback((updates: Partial<FormField>) => {
    onUpdate(field.id, updates);
  }, [field.id, onUpdate]);

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

  // Advanced configuration fields
  const advancedFields = useMemo(() => [
    {
      name: 'group',
      type: 'text',
      label: 'Group',
      placeholder: 'e.g., personal, contact, preferences',
      description: 'Group related fields together',
      help: {
        text: 'Fields with the same group will be visually grouped',
        tooltip: 'Use groups to organize related fields'
      }
    },
    {
      name: 'section.title',
      type: 'text',
      label: 'Section Title',
      placeholder: 'e.g., Personal Information',
      description: 'Create a new section with this title',
    },
    {
      name: 'section.description',
      type: 'text',
      label: 'Section Description',
      placeholder: 'Brief description of this section',
    },
    {
      name: 'section.collapsible',
      type: 'switch',
      label: 'Collapsible Section',
      description: 'Allow users to collapse/expand this section',
    },
    {
      name: 'section.defaultExpanded',
      type: 'switch',
      label: 'Default Expanded',
      description: 'Section starts expanded',
      conditional: (values: any) => values['section.collapsible'],
    },
  ], []);

  // Help & validation fields
  const helpFields = useMemo(() => [
    {
      name: 'help.text',
      type: 'text',
      label: 'Help Text',
      placeholder: 'Additional help information',
      description: 'Shown below the field',
    },
    {
      name: 'help.tooltip',
      type: 'text',
      label: 'Tooltip',
      placeholder: 'Tooltip text on hover',
      description: 'Shows on hover/focus',
    },
    {
      name: 'help.position',
      type: 'select',
      label: 'Tooltip Position',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
      conditional: (values: any) => values['help.tooltip'],
    },
    {
      name: 'help.link.text',
      type: 'text',
      label: 'Help Link Text',
      placeholder: 'e.g., Learn more',
    },
    {
      name: 'help.link.url',
      type: 'text',
      label: 'Help Link URL',
      placeholder: 'https://example.com/help',
      conditional: (values: any) => values['help.link.text'],
    },
    {
      name: 'inlineValidation.enabled',
      type: 'switch',
      label: 'Enable Inline Validation',
      description: 'Show validation feedback as user types',
    },
    {
      name: 'inlineValidation.showSuccess',
      type: 'switch',
      label: 'Show Success State',
      description: 'Show checkmark when valid',
      conditional: (values: any) => values['inlineValidation.enabled'],
    },
    {
      name: 'inlineValidation.debounceMs',
      type: 'number',
      label: 'Validation Delay (ms)',
      placeholder: '300',
      description: 'Delay before validating',
      conditional: (values: any) => values['inlineValidation.enabled'],
    },
  ], []);

  // Field-specific configuration
  const getFieldSpecificConfig = useCallback(() => {
    switch (field.type) {
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
          {
            name: 'multiSelectConfig.creatable',
            type: 'switch',
            label: 'Allow Creating New Options',
            description: 'Users can add custom options',
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
          {
            name: 'ratingConfig.icon',
            type: 'select',
            label: 'Icon Type',
            options: [
              { value: 'star', label: 'Star' },
              { value: 'heart', label: 'Heart' },
              { value: 'thumbs', label: 'Thumbs Up' },
            ],
          },
          {
            name: 'ratingConfig.size',
            type: 'select',
            label: 'Icon Size',
            options: [
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
            ],
          },
          {
            name: 'ratingConfig.showValue',
            type: 'switch',
            label: 'Show Numeric Value',
            description: 'Display the rating number',
          },
        ];

      case 'colorPicker':
        return [
          {
            name: 'colorConfig.format',
            type: 'select',
            label: 'Color Format',
            options: [
              { value: 'hex', label: 'HEX (#FF0000)' },
              { value: 'rgb', label: 'RGB (rgb(255, 0, 0))' },
              { value: 'hsl', label: 'HSL (hsl(0, 100%, 50%))' },
            ],
          },
          {
            name: 'colorConfig.showPreview',
            type: 'switch',
            label: 'Show Color Preview',
            description: 'Display selected color preview',
          },
          {
            name: 'colorConfig.allowCustom',
            type: 'switch',
            label: 'Allow Custom Colors',
            description: 'Users can enter custom color values',
          },
          {
            name: 'colorConfig.presetColors',
            type: 'array',
            label: 'Preset Colors',
            arrayConfig: {
              itemType: 'text',
              itemLabel: 'Color',
              itemPlaceholder: '#FF0000',
              addButtonLabel: 'Add Color',
            },
            description: 'Predefined color options',
          },
        ];

      case 'phone':
        return [
          {
            name: 'phoneConfig.defaultCountry',
            type: 'select',
            label: 'Default Country',
            options: [
              { value: 'US', label: 'United States' },
              { value: 'CA', label: 'Canada' },
              { value: 'GB', label: 'United Kingdom' },
              { value: 'FR', label: 'France' },
              { value: 'DE', label: 'Germany' },
              { value: 'AU', label: 'Australia' },
              { value: 'JP', label: 'Japan' },
            ],
          },
          {
            name: 'phoneConfig.format',
            type: 'select',
            label: 'Phone Format',
            options: [
              { value: 'national', label: 'National ((555) 123-4567)' },
              { value: 'international', label: 'International (+1 555 123 4567)' },
            ],
          },
        ];

      case 'array':
        return [
          {
            name: 'arrayConfig.itemType',
            type: 'select',
            label: 'Item Type',
            options: [
              { value: 'text', label: 'Text' },
              { value: 'email', label: 'Email' },
              { value: 'number', label: 'Number' },
              { value: 'phone', label: 'Phone' },
              { value: 'url', label: 'URL' },
            ],
          },
          {
            name: 'arrayConfig.itemLabel',
            type: 'text',
            label: 'Item Label',
            placeholder: 'e.g., Email Address',
          },
          {
            name: 'arrayConfig.minItems',
            type: 'number',
            label: 'Minimum Items',
            placeholder: '0',
          },
          {
            name: 'arrayConfig.maxItems',
            type: 'number',
            label: 'Maximum Items',
            placeholder: '10',
          },
          {
            name: 'arrayConfig.addButtonLabel',
            type: 'text',
            label: 'Add Button Text',
            placeholder: 'Add Item',
          },
        ];

      case 'text':
      case 'email':
      case 'url':
        return [
          {
            name: 'datalist.options',
            type: 'array',
            label: 'Autocomplete Options',
            arrayConfig: {
              itemType: 'text',
              itemLabel: 'Option',
              addButtonLabel: 'Add Option',
            },
            description: 'Static autocomplete suggestions',
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
  }, [field.type]);

  // Convert nested object paths to flat form values
  const getFormValues = useCallback(() => {
    const values: any = {
      name: field.name,
      label: field.label,
      placeholder: field.placeholder || '',
      description: field.description || '',
      required: field.required || false,
      page: field.page?.toString() || '1',
      group: field.group || '',
    };

    // Handle nested objects
    if (field.section) {
      values['section.title'] = field.section.title || '';
      values['section.description'] = field.section.description || '';
      values['section.collapsible'] = field.section.collapsible || false;
      values['section.defaultExpanded'] = field.section.defaultExpanded || false;
    }

    if (field.help) {
      values['help.text'] = field.help.text || '';
      values['help.tooltip'] = field.help.tooltip || '';
      values['help.position'] = field.help.position || 'top';
      if (field.help.link) {
        values['help.link.text'] = field.help.link.text || '';
        values['help.link.url'] = field.help.link.url || '';
      }
    }

    if (field.inlineValidation) {
      values['inlineValidation.enabled'] = field.inlineValidation.enabled || false;
      values['inlineValidation.showSuccess'] = field.inlineValidation.showSuccess || false;
      values['inlineValidation.debounceMs'] = field.inlineValidation.debounceMs || 300;
    }

    // Handle field-specific configs
    if (field.options) {
      values.options = field.options.map(opt => typeof opt === 'string' ? opt : opt.value);
    }

    // Add field-specific config values
    const configs = ['arrayConfig', 'multiSelectConfig', 'colorConfig', 'ratingConfig', 'phoneConfig', 'datalist'];
    configs.forEach(configKey => {
      const config = (field as any)[configKey];
      if (config) {
        Object.keys(config).forEach(key => {
          values[`${configKey}.${key}`] = config[key];
        });
      }
    });

    return values;
  }, [field]);

  // Convert flat form values back to nested object
  const handleFormChange = useCallback(({ value }: any) => {
    const updates: Partial<FormField> = {
      name: value.name,
      label: value.label,
      placeholder: value.placeholder || undefined,
      description: value.description || undefined,
      required: value.required,
      page: parseInt(value.page) || 1,
      group: value.group || undefined,
    };

    // Handle section
    if (value['section.title']) {
      updates.section = {
        title: value['section.title'],
        description: value['section.description'] || undefined,
        collapsible: value['section.collapsible'] || false,
        defaultExpanded: value['section.defaultExpanded'] || false,
      };
    }

    // Handle help
    if (value['help.text'] || value['help.tooltip'] || value['help.link.text']) {
      updates.help = {
        text: value['help.text'] || undefined,
        tooltip: value['help.tooltip'] || undefined,
        position: value['help.position'] || 'top',
        link: value['help.link.text'] ? {
          text: value['help.link.text'],
          url: value['help.link.url'] || '',
        } : undefined,
      };
    }

    // Handle inline validation
    if (value['inlineValidation.enabled']) {
      updates.inlineValidation = {
        enabled: value['inlineValidation.enabled'],
        showSuccess: value['inlineValidation.showSuccess'],
        debounceMs: value['inlineValidation.debounceMs'] || 300,
      };
    }

    // Handle options
    if (value.options) {
      updates.options = value.options.map((opt: string) => ({ value: opt, label: opt }));
    }

    // Handle field-specific configs
    const configKeys = ['arrayConfig', 'multiSelectConfig', 'colorConfig', 'ratingConfig', 'phoneConfig', 'datalist'];
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

    updateField(updates);
  }, [updateField]);

  const allFields = [
    ...baseFields,
    ...getFieldSpecificConfig(),
    ...advancedFields,
    ...helpFields,
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
          {field.type === 'text' && '📝'}
          {field.type === 'email' && '📧'}
          {field.type === 'password' && '🔒'}
          {field.type === 'textarea' && '📄'}
          {field.type === 'number' && '🔢'}
          {field.type === 'select' && '📋'}
          {field.type === 'radio' && '⚪'}
          {field.type === 'multiSelect' && '☑️'}
          {field.type === 'checkbox' && '✅'}
          {field.type === 'switch' && '🔘'}
          {field.type === 'date' && '📅'}
          {field.type === 'slider' && '🎚️'}
          {field.type === 'rating' && '⭐'}
          {field.type === 'colorPicker' && '🎨'}
          {field.type === 'phone' && '📞'}
          {field.type === 'file' && '📎'}
          {field.type === 'array' && '📚'}
        </div>
        <div>
          <div className="font-medium">{field.label}</div>
          <div className="text-sm text-muted-foreground">{field.type}</div>
        </div>
      </div>
      
      <Form />
    </div>
  );
}; 