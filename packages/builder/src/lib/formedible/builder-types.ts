import type { ComponentType, ReactNode } from 'react';

import type { FieldStore } from '@/components/formedible/builder/field-store';
import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues } from '@/components/formedible/lib/types';

export interface BuilderFieldTypeDefinition {
  readonly value: FormedibleFieldType;
  readonly label: string;
}

export const builderFieldTypes: readonly BuilderFieldTypeDefinition[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
  { value: 'url', label: 'URL' },
  { value: 'tel', label: 'Telephone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio Group' },
  { value: 'multiSelect', label: 'Multi-Select' },
  { value: 'combobox', label: 'Combobox' },
  { value: 'autocomplete', label: 'Autocomplete' },
  { value: 'multiCombobox', label: 'Multi-Combobox' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'switch', label: 'Switch' },
  { value: 'date', label: 'Date' },
  { value: 'slider', label: 'Slider' },
  { value: 'rating', label: 'Rating' },
  { value: 'color', label: 'Color Picker' },
  { value: 'phone', label: 'Phone' },
  { value: 'duration', label: 'Duration' },
  { value: 'location', label: 'Location' },
  { value: 'masked', label: 'Masked Input' },
  { value: 'file', label: 'File Upload' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
];

export interface FormField extends FormedibleFieldConfig<FormedibleFormValues> {
  readonly id: string;
  readonly name: string;
  readonly label: ReactNode;
  readonly type: FormedibleFieldType;
}

export interface FormPage {
  readonly page: number;
  readonly title: string;
  readonly description?: string;
}

export interface FormTab {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface FormSettings {
  readonly submitLabel: string;
  readonly nextLabel: string;
  readonly previousLabel: string;
  readonly showProgress: boolean;
}

export interface FormMetadata {
  readonly title: string;
  readonly description: string;
  readonly pages: readonly FormPage[];
  readonly tabs: readonly FormTab[];
  readonly layoutType: 'pages' | 'tabs';
  readonly settings: FormSettings;
}

export interface TabContentProps {
  readonly metadata: FormMetadata;
  readonly fields: readonly FormField[];
  readonly selectedFieldId: string | null;
  readonly onMetadataChange: (metadata: Partial<FormMetadata>) => void;
  readonly onAddField: (type: FormedibleFieldType) => void;
  readonly onSelectField: (fieldId: string | null) => void;
  readonly onDeleteField: (fieldId: string) => void;
  readonly onDuplicateField: (fieldId: string) => void;
}

export interface TabConfig {
  readonly id: string;
  readonly label: string;
  readonly icon?: ComponentType<{ readonly className?: string }>;
  readonly component: ComponentType<TabContentProps>;
  readonly enabled?: boolean;
  readonly order?: number;
}

export interface FormBuilderProps {
  readonly tabs?: readonly TabConfig[];
  readonly defaultTab?: string;
  readonly initialMetadata?: Partial<FormMetadata>;
  readonly initialFields?: readonly FormField[];
  /**
   * Field store backing this builder. Defaults to a per-instance `FieldStore` created on
   * first render; pass the exported `globalFieldStore` to share one store across mounts.
   * The value is captured on first render and later changes are ignored.
   */
  readonly fieldStore?: FieldStore;
  readonly onChange?: (metadata: FormMetadata, fields: readonly FormField[]) => void;
  readonly onTabChange?: (tabId: string) => void;
  readonly onSubmit?: (metadata: FormMetadata, fields: readonly FormField[]) => void;
  readonly className?: string;
}

export const defaultFormMetadata: FormMetadata = {
  title: 'My Form',
  description: 'A form built with Formedible',
  pages: [{ page: 1, title: 'Page 1', description: 'First page' }],
  tabs: [{ id: 'general', label: 'General', description: 'General fields' }],
  layoutType: 'pages',
  settings: {
    submitLabel: 'Submit',
    nextLabel: 'Next',
    previousLabel: 'Previous',
    showProgress: true,
  },
};
