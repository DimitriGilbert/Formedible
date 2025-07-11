"use client";
import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { Plus, Trash2, Copy, Edit, FileText, Eye, Code, Settings, Download, Upload } from "lucide-react";
import { FieldConfigurator } from "./field-configurator";
import { FormPreview } from "./form-preview";
import { CodeBlock } from "@/components/ui/code-block";

interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
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
    position?: "top" | "bottom" | "left" | "right";
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  options?: Array<{ value: string; label: string }>;
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: {
    placeholder?: string;
    searchable?: boolean;
    maxSelections?: number;
    creatable?: boolean;
  };
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
  sliderConfig?: any;
  numberConfig?: any;
  dateConfig?: any;
  fileConfig?: any;
  textareaConfig?: any;
  passwordConfig?: any;
  emailConfig?: any;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
    includes?: string;
    startsWith?: string;
    endsWith?: string;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    transform?: string;
    refine?: string;
    customMessages?: Record<string, string>;
  };
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

// Isolated field store - NO PARENT RE-RENDERS
const useFieldStore = () => {
  const [fields, setFields] = useState<Record<string, FormField>>({});
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);

  const addField = useCallback((type: string, selectedPage?: number) => {
    const id = `field_${Date.now()}`;
    const newField: FormField = {
      id,
      name: `field_${Object.keys(fields).length + 1}`,
      type,
      label: `${FIELD_TYPES.find((t) => t.value === type)?.label || type} Field`,
      required: false,
      page: selectedPage || 1,
    };
    
    setFields(prev => ({ ...prev, [id]: newField }));
    setFieldOrder(prev => [...prev, id]);
    return id;
  }, [fields]);

  const updateField = useCallback((fieldId: string, updatedField: FormField) => {
    setFields(prev => ({ ...prev, [fieldId]: updatedField }));
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => {
      const newFields = { ...prev };
      delete newFields[fieldId];
      return newFields;
    });
    setFieldOrder(prev => prev.filter(id => id !== fieldId));
  }, []);

  const duplicateField = useCallback((fieldId: string) => {
    const field = fields[fieldId];
    if (field) {
      const id = `field_${Date.now()}`;
      const newField: FormField = {
        ...field,
        id,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
      };
      setFields(prev => ({ ...prev, [id]: newField }));
      setFieldOrder(prev => [...prev, id]);
      return id;
    }
    return null;
  }, [fields]);

  const getField = useCallback((fieldId: string) => fields[fieldId], [fields]);
  
  const getAllFields = useCallback(() => fieldOrder.map(id => fields[id]).filter(Boolean), [fields, fieldOrder]);

  const getFieldsByPage = useCallback((page: number) => 
    fieldOrder.map(id => fields[id]).filter(field => field && (field.page || 1) === page), 
    [fields, fieldOrder]
  );

  return {
    addField,
    updateField,
    deleteField,
    duplicateField,
    getField,
    getAllFields,
    getFieldsByPage,
    fieldOrder
  };
};

// Stable field list component - NEVER RE-RENDERS PARENT
const FieldList: React.FC<{
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (id: string) => void;
}> = React.memo(({ fields, selectedFieldId, onSelectField, onDeleteField, onDuplicateField }) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div
          key={field.id}
          className={cn(
            "flex items-center justify-between p-6 border rounded-lg cursor-pointer transition-colors hover:shadow-md",
            selectedFieldId === field.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onSelectField(field.id)}
        >
          <div className="flex items-center space-x-4">
            <span className="text-2xl">
              {FIELD_TYPES.find((t) => t.value === field.type)?.icon || "📝"}
            </span>
            <div>
              <div className="font-medium text-lg">{field.label}</div>
              <div className="text-muted-foreground">
                {field.type} • {field.name} • Page {field.page || 1}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateField(field.id);
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteField(field.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
});

FieldList.displayName = "FieldList";

// Stable sidebar component - NEVER RE-RENDERS PARENT
const FieldTypeSidebar: React.FC<{
  onAddField: (type: string) => void;
  selectedPage: number | null;
}> = React.memo(({ onAddField, selectedPage }) => {
  return (
    <div className="w-72 border-r bg-card overflow-y-auto">
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-6">Field Types</h3>
        {selectedPage && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-primary font-medium">
              Adding to Page {selectedPage}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3">
          {FIELD_TYPES.map((fieldType) => (
            <Button
              key={fieldType.value}
              variant="outline"
              size="default"
              className="justify-start h-auto p-4"
              onClick={() => onAddField(fieldType.value)}
            >
              <span className="mr-3 text-lg">{fieldType.icon}</span>
              <span>{fieldType.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});

FieldTypeSidebar.displayName = "FieldTypeSidebar";

// Stable configurator panel - ONLY RE-RENDERS WHEN FIELD ID CHANGES
const ConfiguratorPanel: React.FC<{
  selectedFieldId: string | null;
  getField: (id: string) => FormField | undefined;
  onUpdateField: (fieldId: string, field: FormField) => void;
  availablePages: number[];
}> = React.memo(({ selectedFieldId, getField, onUpdateField, availablePages }) => {
  if (!selectedFieldId) return null;

  const field = getField(selectedFieldId);
  if (!field) return null;

  return (
    <div className="w-96 border-l bg-card overflow-y-auto min-h-0">
      <FieldConfigurator
        key={selectedFieldId} // Force new instance when field changes
        fieldId={selectedFieldId}
        initialField={field}
        onFieldChange={onUpdateField}
        availablePages={availablePages}
      />
    </div>
  );
});

ConfiguratorPanel.displayName = "ConfiguratorPanel";

export const FormBuilder: React.FC = () => {
  // Form state
  const [formTitle, setFormTitle] = useState<string>("My Form");
  const [formDescription, setFormDescription] = useState<string>("A form built with Formedible");
  const [pages, setPages] = useState<Array<{ page: number; title: string; description?: string }>>([
    { page: 1, title: "Page 1", description: "First page" }
  ]);
  const [settings, setSettings] = useState({
    submitLabel: "Submit",
    nextLabel: "Next",
    previousLabel: "Previous",
    showProgress: true,
  });

  // UI state
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const fieldStore = useFieldStore();

  const handleAddField = useCallback((type: string) => {
    const newFieldId = fieldStore.addField(type, selectedPageId || 1);
    setSelectedFieldId(newFieldId);
  }, [fieldStore, selectedPageId]);

  const handleSelectField = useCallback((fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  }, []);

  const handleDeleteField = useCallback((fieldId: string) => {
    fieldStore.deleteField(fieldId);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [fieldStore, selectedFieldId]);

  const handleDuplicateField = useCallback((fieldId: string) => {
    const newFieldId = fieldStore.duplicateField(fieldId);
    if (newFieldId) {
      setSelectedFieldId(newFieldId);
    }
  }, [fieldStore]);

  // Export configuration
  const exportConfig = useCallback(() => {
    const formConfig = {
      title: formTitle,
      description: formDescription,
      fields: fieldStore.getAllFields().map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        required: field.required,
        page: field.page || 1,
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
      pages: pages,
      settings: settings,
    };

    const blob = new Blob([JSON.stringify(formConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formTitle.toLowerCase().replace(/\s+/g, "-")}-form.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formTitle, formDescription, fieldStore, pages, settings]);

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
          
          // Clear existing fields
          fieldStore.fieldOrder.forEach(id => fieldStore.deleteField(id));
          
          // Import fields
          (config.fields || []).forEach((field: any, idx: number) => {
            const newFieldId = fieldStore.addField(field.type, field.page || 1);
            const newField: FormField = {
              id: newFieldId,
              name: field.name,
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              description: field.description,
              required: field.required || false,
              page: field.page || 1,
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
              sliderConfig: field.sliderConfig,
              numberConfig: field.numberConfig,
              dateConfig: field.dateConfig,
              fileConfig: field.fileConfig,
              textareaConfig: field.textareaConfig,
              passwordConfig: field.passwordConfig,
              emailConfig: field.emailConfig,
              validation: field.validation,
            };
            fieldStore.updateField(newFieldId, newField);
          });

          // Update form config
          setFormTitle(config.title || "Imported Form");
          setFormDescription(config.description || "Imported from JSON");
          setPages(config.pages || [{ page: 1, title: "Page 1", description: "" }]);
          setSettings({
            submitLabel: config.settings?.submitLabel || config.submitLabel || "Submit",
            nextLabel: config.settings?.nextLabel || config.nextLabel || "Next",
            previousLabel: config.settings?.previousLabel || config.previousLabel || "Previous",
            showProgress: config.settings?.showProgress ?? (!!config.progress),
          });
          
          setSelectedFieldId(null);
        } catch (error) {
          alert("Error importing configuration. Please check the file format.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [fieldStore, setFormTitle, setFormDescription, setPages, setSettings]);

  const allFields = fieldStore.getAllFields();
  const fieldsToShow = selectedPageId 
    ? fieldStore.getFieldsByPage(selectedPageId)
    : allFields;

  // Generate form configuration - EXACTLY like original
  const formConfig = useMemo(() => {
    const schemaFields: Record<string, any> = {};

    allFields.forEach((field) => {
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
      title: formTitle,
      description: formDescription,
      schema: z.object(schemaFields),
      settings,
      fields: allFields.map((field) => ({
        name: field.name,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        page: field.page || 1,
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
      pages: pages.length > 1 ? pages : [],
      submitLabel: settings.submitLabel,
      nextLabel: settings.nextLabel,
      previousLabel: settings.previousLabel,
      progress: settings.showProgress
        ? { showSteps: true, showPercentage: true }
        : undefined,
      formOptions: {
        onSubmit: async ({ value }: any) => {
          console.log("Form submitted:", value);
          alert("Form submitted! Check console for values.");
        },
      },
    };
  }, [formTitle, formDescription, allFields, pages, settings]);

  // Generate code - EXACTLY like original
  const generateCode = useMemo(() => {
    return `import { useFormedible } from 'formedible';
import { z } from 'zod';

const formConfig = ${JSON.stringify(formConfig, null, 2)};

export const MyForm = () => {
  const { Form } = useFormedible(formConfig);
  
  return <Form />;
};`;
  }, [formConfig]);

  return (
    <div className="w-full min-h-[800px] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Form Builder 2.0</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="secondary" onClick={exportConfig}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="secondary" onClick={importConfig}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Field Types */}
        <FieldTypeSidebar onAddField={handleAddField} selectedPage={selectedPageId} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none h-14 bg-card p-0">
              <TabsTrigger value="builder" className="flex items-center gap-2 h-full px-6">
                <Settings className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 h-full px-6">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2 h-full px-6">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="builder" className="h-full m-0">
                <div className="h-full flex min-h-0">
                  {/* Form Structure */}
                  <div className="flex-1 p-4 overflow-y-auto min-h-0">
                    <div className="mx-auto space-y-4">
                      {/* Form Configuration */}
                      <Card className="hover:shadow-lg transition-shadow py-3 gap-2">
                        <CardHeader>
                          <CardTitle className="text-xl">Form Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                          <div>
                            <Label htmlFor="form-title">Form Title</Label>
                            <Input
                              id="form-title"
                              value={formTitle}
                              onChange={(e) => setFormTitle(e.target.value)}
                              placeholder="Enter form title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="form-description">Description</Label>
                            <Textarea
                              id="form-description"
                              value={formDescription}
                              onChange={(e) => setFormDescription(e.target.value)}
                              placeholder="Enter form description"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Form Settings */}
                      <Card className="hover:shadow-lg transition-shadow py-3 gap-2">
                        <CardHeader>
                          <CardTitle className="text-xl">Form Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4">
                          <div>
                            <Label htmlFor="submit-label">Submit Button Label</Label>
                            <Input
                              id="submit-label"
                              value={settings.submitLabel}
                              onChange={(e) => setSettings(prev => ({ ...prev, submitLabel: e.target.value }))}
                              placeholder="Submit"
                            />
                          </div>
                          <div>
                            <Label htmlFor="next-label">Next Button Label</Label>
                            <Input
                              id="next-label"
                              value={settings.nextLabel}
                              onChange={(e) => setSettings(prev => ({ ...prev, nextLabel: e.target.value }))}
                              placeholder="Next"
                            />
                          </div>
                          <div>
                            <Label htmlFor="previous-label">Previous Button Label</Label>
                            <Input
                              id="previous-label"
                              value={settings.previousLabel}
                              onChange={(e) => setSettings(prev => ({ ...prev, previousLabel: e.target.value }))}
                              placeholder="Previous"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show-progress"
                              checked={settings.showProgress}
                              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showProgress: !!checked }))}
                            />
                            <Label htmlFor="show-progress">Show progress indicator</Label>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Page Management */}
                      <Card className="hover:shadow-lg transition-shadow gap-2">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-xl">
                            Pages ({pages.length})
                            {selectedPageId && (
                              <span className="text-sm font-normal text-primary">
                                Page {selectedPageId} selected
                              </span>
                            )}
                            <Button
                              onClick={() => {
                                const newPageNumber = Math.max(...pages.map((p) => p.page)) + 1;
                                setPages(prev => [
                                  ...prev,
                                  {
                                    page: newPageNumber,
                                    title: `Page ${newPageNumber}`,
                                    description: "",
                                  },
                                ]);
                                setEditingPageId(newPageNumber);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Page
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                          <div className="space-y-2">
                            {pages.map((page) => (
                              <div
                                key={page.page}
                                className={cn(
                                  "border rounded-lg transition-all cursor-pointer",
                                  selectedPageId === page.page
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/50",
                                  editingPageId === page.page && "ring-2 ring-primary/20"
                                )}
                                onClick={() => {
                                  if (editingPageId === page.page) return;
                                  setSelectedPageId(selectedPageId === page.page ? null : page.page);
                                }}
                              >
                                {editingPageId === page.page ? (
                                  <div className="p-8 space-y-6">
                                    <div>
                                      <Label>Page Title</Label>
                                      <Input
                                        value={page.title}
                                        onChange={(e) => {
                                          setPages(prev => prev.map(p =>
                                            p.page === page.page
                                              ? { ...p, title: e.target.value }
                                              : p
                                          ));
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea
                                        value={page.description || ""}
                                        onChange={(e) => {
                                          setPages(prev => prev.map(p =>
                                            p.page === page.page
                                              ? { ...p, description: e.target.value }
                                              : p
                                          ));
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Button onClick={() => setEditingPageId(null)}>Done</Button>
                                      <Button variant="outline" onClick={() => setEditingPageId(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-8">
                                    <div className="flex items-center space-x-4">
                                      <FileText
                                        className={cn(
                                          "h-5 w-5",
                                          selectedPageId === page.page
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                        )}
                                      />
                                      <div>
                                        <div
                                          className={cn(
                                            "font-medium text-lg",
                                            selectedPageId === page.page && "text-primary"
                                          )}
                                        >
                                          {page.title}
                                        </div>
                                        {page.description && (
                                          <div className="text-muted-foreground">{page.description}</div>
                                        )}
                                        <div className="text-sm text-muted-foreground">
                                          {fieldStore.getFieldsByPage(page.page).length} fields
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPageId(page.page);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      {pages.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              confirm(
                                                `Delete ${page.title}? Fields on this page will be moved to Page 1.`
                                              )
                                            ) {
                                              const filteredPages = pages.filter((p) => p.page !== page.page);
                                              const renumberedPages = filteredPages.map((p, idx) => ({
                                                ...p,
                                                page: idx + 1,
                                              }));
                                              setPages(renumberedPages);
                                              if (selectedPageId === page.page) {
                                                setSelectedPageId(null);
                                              }
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Fields List */}
                      <Card className="hover:shadow-lg transition-shadow gap-2">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-xl">
                            {selectedPageId ? (
                              <>
                                {pages.find((p) => p.page === selectedPageId)?.title} Fields
                                <span className="text-sm font-normal text-muted-foreground">
                                  ({fieldsToShow.length} fields)
                                </span>
                              </>
                            ) : (
                              <>
                                All Fields ({allFields.length})
                                {allFields.length === 0 && (
                                  <span className="text-sm font-normal text-muted-foreground">
                                    Add fields from the sidebar →
                                  </span>
                                )}
                              </>
                            )}
                          </CardTitle>
                          {selectedPageId && (
                            <p className="text-muted-foreground">
                              New fields will be added to this page. Click the page again to deselect.
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                          {fieldsToShow.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-lg">
                                {selectedPageId
                                  ? `No fields on this page yet. Add some from the sidebar!`
                                  : `No fields yet. Add some from the sidebar!`}
                              </p>
                            </div>
                          ) : (
                            <FieldList
                              fields={fieldsToShow}
                              selectedFieldId={selectedFieldId}
                              onSelectField={handleSelectField}
                              onDeleteField={handleDeleteField}
                              onDuplicateField={handleDuplicateField}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Field Configuration Panel */}
                  <ConfiguratorPanel
                    selectedFieldId={selectedFieldId}
                    getField={fieldStore.getField}
                    onUpdateField={fieldStore.updateField}
                    availablePages={pages.map(p => p.page)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0 p-8 overflow-y-auto min-h-0">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Live Preview</h2>
                      <p className="text-muted-foreground">See how your form will look and behave</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {(["desktop", "tablet", "mobile"] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={previewMode === mode ? "default" : "outline"}
                          onClick={() => setPreviewMode(mode)}
                        >
                          {mode === "desktop" && "🖥️"}
                          {mode === "tablet" && "📱"}
                          {mode === "mobile" && "📱"}
                          <span className="ml-2 capitalize">{mode}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "mx-auto transition-all",
                      previewMode === "mobile"
                        ? "max-w-sm"
                        : previewMode === "tablet"
                        ? "max-w-md"
                        : "max-w-4xl"
                    )}
                  >
                  <FormPreview config={formConfig} />                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code" className="h-full m-0 p-8 overflow-y-auto min-h-0">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold">Generated Code</h2>
                    <p className="text-muted-foreground text-lg">
                      Copy this code to use your form in your application
                    </p>
                  </div>
                  <CodeBlock
                    code={generateCode}
                    language="tsx"
                    title="MyForm.tsx"
                    showCopyButton={true}
                    showLineNumbers={true}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};