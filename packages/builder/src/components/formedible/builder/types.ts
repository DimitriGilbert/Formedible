import React from "react";
import { z } from "zod";

// Form Field Types
export interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  page?: number;
  tab?: string;
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
    position?: "top" | "bottom" | "left" | "right";
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  validation?: {
    customMessages?: {
      required?: string;
      [key: string]: string | undefined;
    };
  };
  options?: Array<{ value: string; label: string }>;
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: any;
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
}

// Form Metadata Types
export interface FormPage {
  page: number;
  title: string;
  description?: string;
}

export interface FormTab {
  id: string;
  label: string;
  description?: string;
}

export interface FormSettings {
  submitLabel: string;
  nextLabel: string;
  previousLabel: string;
  showProgress: boolean;
}

export interface FormMetadata {
  title: string;
  description: string;
  pages: FormPage[];
  tabs: FormTab[];
  layoutType: "pages" | "tabs";
  settings: FormSettings;
}

// Form Configuration
export interface FormConfig {
  title: string;
  description: string;
  schema: z.ZodSchema<any>;
  settings: FormSettings;
  fields: FormField[];
  pages?: FormPage[];
  tabs?: FormTab[];
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  progress?: {
    showSteps: boolean;
    showPercentage: boolean;
  };
  formOptions: {
    onSubmit: (data: { value: any }) => Promise<void> | void;
  };
}

// Tab System Types
export interface TabContentProps {
  // Form state and operations - NON-REACTIVE
  getFormMetadata: () => FormMetadata;
  onFormMetadataChange: (metadata: Partial<FormMetadata>) => void;
  
  // Field operations
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onAddField: (type: string) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (fieldId: string) => void;
  
  // UI state
  selectedPageId: number | null;
  selectedTabId: string | null;
  setSelectedPageId: (pageId: number | null) => void;
  setSelectedTabId: (tabId: string | null) => void;
  editingPageId: number | null;
  setEditingPageId: (pageId: number | null) => void;
  editingTabId: string | null;
  setEditingTabId: (tabId: string | null) => void;
  previewMode: "desktop" | "tablet" | "mobile";
  setPreviewMode: (mode: "desktop" | "tablet" | "mobile") => void;
  
  // Data access
  getAllFields: () => FormField[];
  getFieldsByPage: (page: number) => FormField[];
  getFieldsByTab: (tabId: string) => FormField[];
  getFormConfig: () => FormConfig;
  
  // Import/Export
  exportConfig: () => void;
  importConfig: () => void;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<TabContentProps>;
  enabled?: boolean;
  order?: number;
}

// Builder Context Type
export interface BuilderContextType extends TabContentProps {
  // Additional context-specific methods can be added here
  forceRerender: () => void;
}

// Field Operations
export interface FieldOperations {
  addField: (type: string, page?: number) => string;
  deleteField: (fieldId: string) => void;
  duplicateField: (fieldId: string) => string | null;
  updateField: (fieldId: string, updates: Partial<FormField>) => void;
  getField: (fieldId: string) => FormField | null;
  getAllFields: () => FormField[];
  getFieldsByPage: (page: number) => FormField[];
  getFieldsByTab: (tabId: string) => FormField[];
  importFields: (fields: Partial<FormField>[]) => void;
  subscribe: (callback: () => void) => () => void;
  subscribeToFieldUpdates: (fieldId: string, callback: (field: FormField) => void) => () => void;
}

// Component Props
export interface FormBuilderProps {
  tabs?: TabConfig[];
  defaultTab?: string;
  enabledTabs?: string[];
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export interface TabContainerProps {
  tabs: TabConfig[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

// Field Type Definitions
export interface FieldType {
  value: string;
  label: string;
  icon: string;
}

export const FIELD_TYPES: FieldType[] = [
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