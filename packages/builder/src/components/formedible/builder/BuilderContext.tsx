"use client";
import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { z } from "zod";
import { globalFieldStore } from "./field-store";
import type {
  BuilderContextType,
  FormMetadata,
  FormField,
  FormConfig,
  TabContentProps,
} from "./types";

const BuilderContext = createContext<BuilderContextType | null>(null);

export const useBuilderContext = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilderContext must be used within a BuilderProvider");
  }
  return context;
};

interface BuilderProviderProps {
  children: React.ReactNode;
  initialMetadata?: Partial<FormMetadata>;
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({
  children,
  initialMetadata = {},
}) => {
  // Form metadata state (minimal, non-rerendering) - USING REF TO AVOID RE-RENDERS
  const formMetaRef = useRef<FormMetadata>({
    title: "My Form",
    description: "A form built with Formedible",
    pages: [{ page: 1, title: "Page 1", description: "First page" }],
    tabs: [{ id: "general", label: "General", description: "General information" }],
    layoutType: "pages",
    settings: {
      submitLabel: "Submit",
      nextLabel: "Next",
      previousLabel: "Previous",
      showProgress: true,
    },
    ...initialMetadata,
  });

  // UI state (minimal, only for display)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Force rerender for structure changes
  const [, forceUpdateState] = useState({});
  const forceRerender = useCallback(() => forceUpdateState({}), []);

  // Subscribe to global field store changes
  React.useEffect(() => {
    const unsubscribe = globalFieldStore.subscribe(forceRerender);
    return unsubscribe;
  }, [forceRerender]);

  // Form metadata operations - DON'T TRIGGER RE-RENDERS
  const onFormMetadataChange = useCallback((updates: Partial<FormMetadata>) => {
    Object.assign(formMetaRef.current, updates);
  }, []);

  // Get current form metadata (non-reactive)
  const getFormMetadata = useCallback(() => formMetaRef.current, []);

  // Field operations
  const onAddField = useCallback((type: string) => {
    const newFieldId = globalFieldStore.addField(type, selectedPageId || 1);
    const field = globalFieldStore.getField(newFieldId);
    if (field && formMetaRef.current.layoutType === "tabs" && selectedTabId) {
      globalFieldStore.updateField(newFieldId, { ...field, tab: selectedTabId });
    }
    setSelectedFieldId(newFieldId);
  }, [selectedPageId, selectedTabId]);

  const onSelectField = useCallback((fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  }, []);

  const onDeleteField = useCallback((fieldId: string) => {
    globalFieldStore.deleteField(fieldId);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const onDuplicateField = useCallback((fieldId: string) => {
    const newFieldId = globalFieldStore.duplicateField(fieldId);
    if (newFieldId) {
      setSelectedFieldId(newFieldId);
    }
  }, []);

  // Data access operations
  const getAllFields = useCallback(() => globalFieldStore.getAllFields(), []);
  const getFieldsByPage = useCallback((page: number) => globalFieldStore.getFieldsByPage(page), []);
  const getFieldsByTab = useCallback((tabId: string) => globalFieldStore.getFieldsByTab(tabId), []);

  // Generate form configuration
  const getFormConfig = useCallback((): FormConfig => {
    const currentFields = globalFieldStore.getAllFields();
    const schemaFields: Record<string, any> = {};

    currentFields.forEach((field) => {
      let fieldSchema: any;

      switch (field.type) {
        case "number":
        case "slider":
        case "rating":
          fieldSchema = z.number();
          break;
        case "checkbox":
        case "switch":
          fieldSchema = z.boolean();
          break;
        case "date":
          fieldSchema = z.string();
          break;
        case "multiSelect":
        case "array":
          fieldSchema = z.array(z.string());
          break;
        case "object":
          fieldSchema = z.object({});
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.required) {
        if (field.type === "number" || field.type === "slider" || field.type === "rating") {
          // For numbers, required means not null/undefined
        } else if (field.type === "checkbox" || field.type === "switch") {
          fieldSchema = fieldSchema.refine((val: boolean) => val === true, {
            message: field.validation?.customMessages?.required || `${field.label} is required`,
          });
        } else if (typeof fieldSchema.min === "function") {
          fieldSchema = fieldSchema.min(1, field.validation?.customMessages?.required || `${field.label} is required`);
        }
      } else {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.name] = fieldSchema;
    });

    return {
      title: formMetaRef.current.title,
      description: formMetaRef.current.description,
      schema: z.object(schemaFields),
      settings: formMetaRef.current.settings,
      fields: currentFields.map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        page: field.page || 1,
        tab: field.tab,
        group: field.group,
        section: field.section,
        help: field.help,
        inlineValidation: field.inlineValidation,
        ...(field.options && { options: field.options }),
        ...(field.arrayConfig && { arrayConfig: field.arrayConfig }),
        ...(field.datalist && { datalist: field.datalist }),
        ...(field.multiSelectConfig && { multiSelectConfig: field.multiSelectConfig }),
        ...(field.colorConfig && { colorConfig: field.colorConfig }),
        ...(field.ratingConfig && { ratingConfig: field.ratingConfig }),
        ...(field.phoneConfig && { phoneConfig: field.phoneConfig }),
      })),
      pages: formMetaRef.current.layoutType === "pages" && formMetaRef.current.pages.length > 1 ? formMetaRef.current.pages : [],
      tabs: formMetaRef.current.layoutType === "tabs" ? formMetaRef.current.tabs : undefined,
      submitLabel: formMetaRef.current.settings.submitLabel,
      nextLabel: formMetaRef.current.settings.nextLabel,
      previousLabel: formMetaRef.current.settings.previousLabel,
      progress: formMetaRef.current.settings.showProgress
        ? { showSteps: true, showPercentage: true }
        : undefined,
      formOptions: {
        onSubmit: async ({ value }: any) => {
          console.log("Form submitted:", value);
          alert("Form submitted! Check console for values.");
        },
      },
    };
  }, []);

  // Export configuration
  const exportConfig = useCallback(() => {
    const formConfig = {
      title: formMetaRef.current.title,
      description: formMetaRef.current.description,
      fields: globalFieldStore.getAllFields().map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        required: field.required,
        page: field.page || 1,
        tab: field.tab,
        group: field.group,
        section: field.section,
        help: field.help,
        inlineValidation: field.inlineValidation,
        options: field.options,
        arrayConfig: field.arrayConfig,
        datalist: field.datalist,
        multiSelectConfig: field.multiSelectConfig,
        colorConfig: field.colorConfig,
        ratingConfig: field.ratingConfig,
        phoneConfig: field.phoneConfig,
      })),
      pages: formMetaRef.current.pages,
      tabs: formMetaRef.current.tabs,
      layoutType: formMetaRef.current.layoutType,
      settings: formMetaRef.current.settings,
    };

    const blob = new Blob([JSON.stringify(formConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formMetaRef.current.title.toLowerCase().replace(/\\s+/g, "-")}-form.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import configuration
  const importConfig = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          
          // Import fields
          globalFieldStore.importFields(config.fields || []);

          // Update form config - DIRECT ASSIGNMENT TO AVOID RE-RENDERS
          Object.assign(formMetaRef.current, {
            title: config.title || "Imported Form",
            description: config.description || "Imported from JSON",
            pages: config.pages || [{ page: 1, title: "Page 1", description: "" }],
            tabs: config.tabs || [{ id: "general", label: "General", description: "General information" }],
            layoutType: config.layoutType || "pages",
            settings: {
              submitLabel: config.settings?.submitLabel || config.submitLabel || "Submit",
              nextLabel: config.settings?.nextLabel || config.nextLabel || "Next",
              previousLabel: config.settings?.previousLabel || config.previousLabel || "Previous",
              showProgress: config.settings?.showProgress ?? (!!config.progress),
            }
          });
          
          setSelectedFieldId(null);
          forceRerender();
        } catch (error) {
          alert("Error importing configuration. Please check the file format.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [forceRerender]);

  const contextValue: BuilderContextType = {
    // Form metadata - NON-REACTIVE
    getFormMetadata,
    onFormMetadataChange,

    // Field operations
    selectedFieldId,
    onSelectField,
    onAddField,
    onDeleteField,
    onDuplicateField,

    // UI state
    selectedPageId,
    selectedTabId,
    setSelectedPageId,
    setSelectedTabId,
    editingPageId,
    setEditingPageId,
    editingTabId,
    setEditingTabId,
    previewMode,
    setPreviewMode,

    // Data access
    getAllFields,
    getFieldsByPage,
    getFieldsByTab,
    getFormConfig,

    // Import/Export
    exportConfig,
    importConfig,

    // Context-specific
    forceRerender,
  };

  return (
    <BuilderContext.Provider value={contextValue}>
      {children}
    </BuilderContext.Provider>
  );
};