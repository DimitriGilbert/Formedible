"use client";
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Plus,
  Eye,
  Code,
  Settings,
  Download,
  Upload,
  Trash2,
  Copy,
  Move,
  Edit,
  FileText,
} from "lucide-react";
import { z } from "zod";
import { CodeBlock } from "@/components/ui/code-block";
import { FieldConfigurator } from "./field-configurator";
import { FormPreview } from "./form-preview";

// Types for the form builder
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
    position?: "top" | "bottom" | "left" | "right";
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  // Field-specific configs
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: any;
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
}

interface FormConfiguration {
  title: string;
  description?: string;
  fields: FormField[];
  pages: Array<{
    page: number;
    title: string;
    description?: string;
  }>;
  settings: {
    submitLabel: string;
    nextLabel: string;
    previousLabel: string;
    showProgress: boolean;
    allowPageNavigation: boolean;
    resetOnSubmit: boolean;
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

export const FormBuilder: React.FC = () => {
  const [formConfig, setFormConfig] = useState<FormConfiguration>({
    title: "My Form",
    description: "A form built with Formedible",
    fields: [],
    pages: [{ page: 1, title: "Page 1", description: "First page" }],
    settings: {
      submitLabel: "Submit",
      nextLabel: "Next",
      previousLabel: "Previous",
      showProgress: true,
      allowPageNavigation: false,
      resetOnSubmit: false,
    },
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // Add a new field
  const addField = useCallback(
    (type: string) => {
      const newField: FormField = {
        id: `field_${Date.now()}`,
        name: `field_${formConfig.fields.length + 1}`,
        type,
        label: `${
          FIELD_TYPES.find((t) => t.value === type)?.label || type
        } Field`,
        required: false,
        page: selectedPageId || 1,
      };

      setFormConfig((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));

      setSelectedFieldId(newField.id);
    },
    [formConfig.fields.length, selectedPageId]
  );

  // Update a field
  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFormConfig((prev) => ({
        ...prev,
        fields: prev.fields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
      }));
    },
    []
  );

  // Delete a field
  const deleteField = useCallback((fieldId: string) => {
    setFormConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
    setSelectedFieldId(null);
  }, []);

  // Duplicate a field
  const duplicateField = useCallback(
    (fieldId: string) => {
      const field = formConfig.fields.find((f) => f.id === fieldId);
      if (field) {
        const newField: FormField = {
          ...field,
          id: `field_${Date.now()}`,
          name: `${field.name}_copy`,
          label: `${field.label} (Copy)`,
        };
        setFormConfig((prev) => ({
          ...prev,
          fields: [...prev.fields, newField],
        }));
        setSelectedFieldId(newField.id);
      }
    },
    [formConfig.fields]
  );

  // Generate formedible configuration
  const generateFormedibleConfig = useCallback(() => {
    const schemaFields: Record<string, any> = {};

    formConfig.fields.forEach((field) => {
      let fieldSchema: any;

      // Create appropriate schema based on field type
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
          fieldSchema = z.string(); // or z.date() if you parse the string
          break;
        case "multiSelect":
        case "array":
          fieldSchema = z.array(z.string());
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.required) {
        if (
          field.type === "number" ||
          field.type === "slider" ||
          field.type === "rating"
        ) {
          // For numbers, required means not null/undefined
          fieldSchema = fieldSchema;
        } else if (field.type === "checkbox" || field.type === "switch") {
          fieldSchema = fieldSchema.refine((val: boolean) => val === true, {
            message: `${field.label} is required`,
          });
        } else if (typeof fieldSchema.min === "function") {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        }
      } else {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.name] = fieldSchema;
    });
    return {
      schema: z.object(schemaFields),
      fields: formConfig.fields.map((field) => ({
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
        ...(field.multiSelectConfig && {
          multiSelectConfig: field.multiSelectConfig,
        }),
        ...(field.colorConfig && { colorConfig: field.colorConfig }),
        ...(field.ratingConfig && { ratingConfig: field.ratingConfig }),
        ...(field.phoneConfig && { phoneConfig: field.phoneConfig }),
      })),
      pages: formConfig.pages,
      submitLabel: formConfig.settings.submitLabel,
      nextLabel: formConfig.settings.nextLabel,
      previousLabel: formConfig.settings.previousLabel,
      progress: formConfig.settings.showProgress
        ? { showSteps: true, showPercentage: true }
        : undefined,
      formOptions: {
        onSubmit: async ({ value }: any) => {
          console.log("Form submitted:", value);
          alert("Form submitted! Check console for values.");
        },
      },
    };
  }, [formConfig]);

  // Export configuration as JSON
  const exportConfig = useCallback(() => {
    const config = generateFormedibleConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formConfig.title
      .toLowerCase()
      .replace(/\s+/g, "-")}-form.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formConfig, generateFormedibleConfig]);

  // Import configuration from JSON
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

          // Convert imported config back to form configuration
          const importedFields: FormField[] = (config.fields || []).map(
            (field: any, index: number) => ({
              id: `field_${Date.now()}_${index}`,
              name: field.name,
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              description: field.description,
              required: false, // Will be determined by schema
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
            })
          );

          setFormConfig({
            title: "Imported Form",
            description: "Imported from JSON",
            fields: importedFields,
            pages: config.pages || [
              { page: 1, title: "Page 1", description: "" },
            ],
            settings: {
              submitLabel: config.submitLabel || "Submit",
              nextLabel: config.nextLabel || "Next",
              previousLabel: config.previousLabel || "Previous",
              showProgress: !!config.progress,
              allowPageNavigation: false,
              resetOnSubmit: false,
            },
          });
        } catch (error) {
          alert("Error importing configuration. Please check the file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Generate code preview
  const generateCode = useCallback(() => {
    const config = generateFormedibleConfig();
    return `import { useFormedible } from 'formedible';
import { z } from 'zod';

const formConfig = ${JSON.stringify(config, null, 2)};

export const MyForm = () => {
  const { Form } = useFormedible(formConfig);
  
  return <Form />;
};`;
  }, [generateFormedibleConfig]);

  const selectedField = formConfig.fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="w-full min-h-[800px] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Formedible Builder</h1>
            <div className="text-foreground">
              Build forms with forms! 🚀
            </div>
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
        <div className="w-72 border-r bg-card overflow-y-auto">
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-6">Field Types</h3>
            <div className="grid grid-cols-1 gap-3">
              {FIELD_TYPES.map((fieldType) => (
                <Button
                  key={fieldType.value}
                  variant="outline"
                  size="default"
                  className="justify-start h-auto p-4"
                  onClick={() => addField(fieldType.value)}
                >
                  <span className="mr-3 text-lg">{fieldType.icon}</span>
                  <span>{fieldType.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="w-full justify-start border-b rounded-none h-14 bg-card p-0">
              <TabsTrigger
                value="builder"
                className="flex items-center gap-2 h-full px-6"
              >
                <Settings className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex items-center gap-2 h-full px-6"
              >
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="flex items-center gap-2 h-full px-6"
              >
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
                      <Card className="hover:shadow-lg transition-shadow py-3 gap-2">
                        <CardHeader>
                          <CardTitle className="text-xl">Form Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                          <div>
                            <label className="text-sm font-medium block">
                              Form Title
                            </label>
                            <input
                              type="text"
                              value={formConfig.title}
                              onChange={(e) =>
                                setFormConfig((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 border border-input rounded-md bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium block">
                              Description
                            </label>
                            <textarea
                              value={formConfig.description || ""}
                              onChange={(e) =>
                                setFormConfig((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 border border-input rounded-md bg-background"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Page Management */}
                      <Card className="hover:shadow-lg transition-shadow gap-2">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-xl">
                            Pages ({formConfig.pages.length})
                            {selectedPageId && (
                              <span className="text-sm font-normal text-primary">
                                Page {selectedPageId} selected
                              </span>
                            )}
                            <Button
                              onClick={() => {
                                const newPageNumber =
                                  Math.max(
                                    ...formConfig.pages.map((p) => p.page)
                                  ) + 1;
                                setFormConfig((prev) => ({
                                  ...prev,
                                  pages: [
                                    ...prev.pages,
                                    {
                                      page: newPageNumber,
                                      title: `Page ${newPageNumber}`,
                                      description: "",
                                    },
                                  ],
                                }));
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
                            {formConfig.pages.map((page, index) => (
                              <div
                                key={page.page}
                                className={cn(
                                  "border rounded-lg transition-all cursor-pointer",
                                  selectedPageId === page.page
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border hover:border-primary/50",
                                  editingPageId === page.page &&
                                    "ring-2 ring-primary/20"
                                )}
                                onClick={() => {
                                  if (editingPageId === page.page) return;
                                  setSelectedPageId(
                                    selectedPageId === page.page
                                      ? null
                                      : page.page
                                  );
                                }}
                              >
                                {editingPageId === page.page ? (
                                  <div className="p-8 space-y-6">
                                    <div>
                                      <label className="text-sm font-medium block">
                                        Page Title
                                      </label>
                                      <input
                                        type="text"
                                        value={page.title}
                                        onChange={(e) =>
                                          setFormConfig((prev) => ({
                                            ...prev,
                                            pages: prev.pages.map((p) =>
                                              p.page === page.page
                                                ? {
                                                    ...p,
                                                    title: e.target.value,
                                                  }
                                                : p
                                            ),
                                          }))
                                        }
                                        className="w-full px-4 py-3 border border-input rounded-md bg-background"
                                        autoFocus
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium block">
                                        Description (optional)
                                      </label>
                                      <textarea
                                        value={page.description || ""}
                                        onChange={(e) =>
                                          setFormConfig((prev) => ({
                                            ...prev,
                                            pages: prev.pages.map((p) =>
                                              p.page === page.page
                                                ? {
                                                    ...p,
                                                    description: e.target.value,
                                                  }
                                                : p
                                            ),
                                          }))
                                        }
                                        className="w-full px-4 py-3 border border-input rounded-md bg-background"
                                        rows={2}
                                      />
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <Button
                                        onClick={() => setEditingPageId(null)}
                                      >
                                        Done
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => setEditingPageId(null)}
                                      >
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
                                            selectedPageId === page.page &&
                                              "text-primary"
                                          )}
                                        >
                                          {page.title}
                                        </div>
                                        {page.description && (
                                          <div className="text-muted-foreground">
                                            {page.description}
                                          </div>
                                        )}
                                        <div className="text-sm text-muted-foreground">
                                          {
                                            formConfig.fields.filter(
                                              (f) => (f.page || 1) === page.page
                                            ).length
                                          }{" "}
                                          fields
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
                                      {formConfig.pages.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              confirm(
                                                `Delete ${page.title}? Fields on this page will be moved to Page 1.`
                                              )
                                            ) {
                                              setFormConfig((prev) => {
                                                const filteredPages =
                                                  prev.pages.filter(
                                                    (p) => p.page !== page.page
                                                  );
                                                const renumberedPages =
                                                  filteredPages.map(
                                                    (p, index) => ({
                                                      ...p,
                                                      page: index + 1,
                                                    })
                                                  );

                                                const updatedFields =
                                                  prev.fields.map((f) => {
                                                    if (
                                                      (f.page || 1) ===
                                                      page.page
                                                    ) {
                                                      return { ...f, page: 1 };
                                                    }
                                                    if (
                                                      (f.page || 1) > page.page
                                                    ) {
                                                      return {
                                                        ...f,
                                                        page: (f.page || 1) - 1,
                                                      };
                                                    }
                                                    return f;
                                                  });

                                                return {
                                                  ...prev,
                                                  pages: renumberedPages,
                                                  fields: updatedFields,
                                                };
                                              });
                                              if (
                                                selectedPageId === page.page
                                              ) {
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
                                {
                                  formConfig.pages.find(
                                    (p) => p.page === selectedPageId
                                  )?.title
                                }{" "}
                                Fields
                                <span className="text-sm font-normal text-muted-foreground">
                                  (
                                  {
                                    formConfig.fields.filter(
                                      (f) => (f.page || 1) === selectedPageId
                                    ).length
                                  }{" "}
                                  fields)
                                </span>
                              </>
                            ) : (
                              <>
                                All Fields ({formConfig.fields.length})
                                {formConfig.fields.length === 0 && (
                                  <span className="text-sm font-normal text-muted-foreground">
                                    Add fields from the sidebar →
                                  </span>
                                )}
                              </>
                            )}
                          </CardTitle>
                          {selectedPageId && (
                            <p className="text-muted-foreground">
                              New fields will be added to this page. Click the
                              page again to deselect.
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                          {(() => {
                            const fieldsToShow = selectedPageId
                              ? formConfig.fields.filter(
                                  (f) => (f.page || 1) === selectedPageId
                                )
                              : formConfig.fields;

                            if (fieldsToShow.length === 0) {
                              return (
                                <div className="text-center py-12 text-muted-foreground">
                                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p className="text-lg">
                                    {selectedPageId
                                      ? `No fields on this page yet. Add some from the sidebar!`
                                      : `No fields yet. Add some from the sidebar!`}
                                  </p>
                                </div>
                              );
                            }

                            if (selectedPageId) {
                              // Show only selected page fields in a simple list
                              return (
                                <div className="space-y-4">
                                  {fieldsToShow.map((field, index) => (
                                    <div
                                      key={field.id}
                                      className={cn(
                                        "flex items-center justify-between p-6 border rounded-lg cursor-pointer transition-colors hover:shadow-md",
                                        selectedFieldId === field.id
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/50"
                                      )}
                                      onClick={() =>
                                        setSelectedFieldId(field.id)
                                      }
                                    >
                                      <div className="flex items-center space-x-4">
                                        <span className="text-2xl">
                                          {FIELD_TYPES.find(
                                            (t) => t.value === field.type
                                          )?.icon || "📝"}
                                        </span>
                                        <div>
                                          <div className="font-medium text-lg">
                                            {field.label}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {field.type} • {field.name}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            duplicateField(field.id);
                                          }}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteField(field.id);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              // Show all fields grouped by page
                              return (
                                <div className="space-y-8">
                                  {formConfig.pages.map((page) => {
                                    const pageFields = formConfig.fields.filter(
                                      (f) => (f.page || 1) === page.page
                                    );
                                    return (
                                      <div key={page.page}>
                                        <div className="flex items-center gap-3 mb-4">
                                          <FileText className="h-5 w-5 text-muted-foreground" />
                                          <span className="font-medium text-lg">
                                            {page.title}
                                          </span>
                                          <span className="text-sm text-muted-foreground">
                                            ({pageFields.length} fields)
                                          </span>
                                        </div>
                                        <div className="space-y-4 ml-8">
                                          {pageFields.length === 0 ? (
                                            <div className="text-muted-foreground italic">
                                              No fields on this page
                                            </div>
                                          ) : (
                                            pageFields.map((field, index) => (
                                              <div
                                                key={field.id}
                                                className={cn(
                                                  "flex items-center justify-between p-6 border rounded-lg cursor-pointer transition-colors hover:shadow-md",
                                                  selectedFieldId === field.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                )}
                                                onClick={() =>
                                                  setSelectedFieldId(field.id)
                                                }
                                              >
                                                <div className="flex items-center space-x-4">
                                                  <span className="text-2xl">
                                                    {FIELD_TYPES.find(
                                                      (t) =>
                                                        t.value === field.type
                                                    )?.icon || "📝"}
                                                  </span>
                                                  <div>
                                                    <div className="font-medium text-lg">
                                                      {field.label}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                      {field.type} •{" "}
                                                      {field.name}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <Button
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      duplicateField(field.id);
                                                    }}
                                                  >
                                                    <Copy className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      deleteField(field.id);
                                                    }}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Field Configuration Panel */}
                  {selectedField && (
                    <div className="w-96 border-l bg-card overflow-y-auto min-h-0">
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-6">Configure Field</h3>
                        <FieldConfigurator
                          field={selectedField}
                          onUpdate={updateField}
                          availablePages={formConfig.pages.map((p) => p.page)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="preview"
                className="h-full m-0 p-8 overflow-y-auto min-h-0"
              >
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Live Preview</h2>
                    <div className="flex items-center space-x-3">
                      {(["desktop", "tablet", "mobile"] as const).map(
                        (mode) => (
                          <Button
                            key={mode}
                            variant={
                              previewMode === mode ? "default" : "outline"
                            }
                            onClick={() => setPreviewMode(mode)}
                          >
                            {mode === "desktop" && "🖥️"}
                            {mode === "tablet" && "📱"}
                            {mode === "mobile" && "📱"}
                            <span className="ml-2 capitalize">{mode}</span>
                          </Button>
                        )
                      )}
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
                    <FormPreview config={formConfig} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="code"
                className="h-full m-0 p-8 overflow-y-auto min-h-0"
              >
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold">Generated Code</h2>
                    <p className="text-muted-foreground text-lg">
                      Copy this code to use your form in your application
                    </p>
                  </div>
                  <CodeBlock
                    code={generateCode()}
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