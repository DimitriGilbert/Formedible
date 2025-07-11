"use client";
import React, { useState, useCallback, useMemo } from "react";
import { useFormedible } from "@/hooks/use-formedible";
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
  Edit,
  FileText,
} from "lucide-react";
import { z } from "zod";
import { CodeBlock } from "@/components/ui/code-block";
import { SimpleFieldConfigurator } from "./simple-field-configurator";
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
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: any;
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
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
  // Form data state
  const [formTitle, setFormTitle] = useState<string>("My Form");
  const [formDescription, setFormDescription] = useState<string>("A form built with Formedible");
  const [fields, setFields] = useState<FormField[]>([]);
  const [pages, setPages] = useState<Array<{ page: number; title: string; description?: string }>>([
    { page: 1, title: "Page 1", description: "First page" }
  ]);
  const [settings, setSettings] = useState({
    submitLabel: "Submit",
    nextLabel: "Next",
    previousLabel: "Previous",
    showProgress: true,
    allowPageNavigation: false,
    resetOnSubmit: false,
  });

  // UI state
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Form configuration form
  const configFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
  });

  const { Form: ConfigForm } = useFormedible({
    schema: configFormSchema,
    fields: [
      {
        name: "title",
        type: "text",
        label: "Form Title",
        placeholder: "Enter form title",
      },
      {
        name: "description",
        type: "textarea",
        label: "Description",
        placeholder: "Enter form description",
      },
    ],
    formOptions: {
      defaultValues: {
        title: formTitle,
        description: formDescription || "",
      },
      onChange: ({ value }) => {
        if (value.title !== formTitle) {
          setFormTitle(value.title);
        }
        if (value.description !== formDescription) {
          setFormDescription(value.description || "");
        }
      },
    },
    showSubmitButton: false,
  });

  // Page editing form
  const pageFormSchema = z.object({
    title: z.string().min(1, "Page title is required"),
    description: z.string().optional(),
  });

  const { Form: PageForm } = useFormedible({
    schema: pageFormSchema,
    fields: [
      {
        name: "title",
        type: "text",
        label: "Page Title",
        placeholder: "Enter page title",
      },
      {
        name: "description",
        type: "textarea",
        label: "Description (optional)",
        placeholder: "Enter page description",
      },
    ],
    formOptions: {
      defaultValues: editingPageId ? {
        title: pages.find(p => p.page === editingPageId)?.title || "",
        description: pages.find(p => p.page === editingPageId)?.description || "",
      } : { title: "", description: "" },
      onChange: ({ value }) => {
        if (editingPageId) {
          setPages(prev => prev.map(p =>
            p.page === editingPageId
              ? { ...p, title: value.title, description: value.description }
              : p
          ));
        }
      },
    },
    showSubmitButton: false,
  });

  // Add a new field
  const addField = useCallback((type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      type,
      label: `${FIELD_TYPES.find((t) => t.value === type)?.label || type} Field`,
      required: false,
      page: selectedPageId || 1,
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, [fields.length, selectedPageId]);

  // Update a field
  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  }, []);

  // Get field by ID
  const getField = useCallback((id: string) => {
    return fields.find(f => f.id === id);
  }, [fields]);

  // Delete a field
  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    setSelectedFieldId(null);
  }, []);

  // Duplicate a field
  const duplicateField = useCallback((fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      const newField: FormField = {
        ...field,
        id: `field_${Date.now()}`,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
      };
      setFields(prev => [...prev, newField]);
      setSelectedFieldId(newField.id);
    }
  }, [fields]);

  // Generate form configuration
  const formConfig = useMemo(() => {
    const schemaFields: Record<string, any> = {};

    fields.forEach((field) => {
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
        default:
          fieldSchema = z.string();
      }

      if (field.required) {
        if (field.type === "number" || field.type === "slider" || field.type === "rating") {
          // For numbers, required means not null/undefined
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
      title: formTitle,
      description: formDescription,
      schema: z.object(schemaFields),
      settings,
      fields: fields.map((field) => ({
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
      pages: pages,
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
  }, [formTitle, formDescription, fields, pages, settings]);

  // Export configuration
  const exportConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(formConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formTitle.toLowerCase().replace(/\s+/g, "-")}-form.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formTitle, formConfig]);

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
          const importedFields: FormField[] = (config.fields || []).map(
            (field: any, idx: number) => ({
              id: `field_${Date.now()}_${idx}`,
              name: field.name,
              type: field.type,
              label: field.label,
              placeholder: field.placeholder,
              description: field.description,
              required: false,
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

          setFormTitle("Imported Form");
          setFormDescription("Imported from JSON");
          setFields(importedFields);
          setPages(config.pages || [{ page: 1, title: "Page 1", description: "" }]);
          setSettings({
            submitLabel: config.submitLabel || "Submit",
            nextLabel: config.nextLabel || "Next",
            previousLabel: config.previousLabel || "Previous",
            showProgress: !!config.progress,
            allowPageNavigation: false,
            resetOnSubmit: false,
          });
        } catch (_error) {
          alert("Error importing configuration. Please check the file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Generate code
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
            <h1 className="text-2xl font-bold">Formedible Builder</h1>
            <div className="text-foreground">Build forms with forms! 🚀</div>
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
                        <CardContent className="space-y-2 p-4">
                          <ConfigForm />
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
                                    <PageForm />
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
                                          {fields.filter((f) => (f.page || 1) === page.page).length} fields
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

                                              const updatedFields = fields.map((f) => {
                                                if ((f.page || 1) === page.page) {
                                                  return { ...f, page: 1 };
                                                }
                                                if ((f.page || 1) > page.page) {
                                                  return { ...f, page: (f.page || 1) - 1 };
                                                }
                                                return f;
                                              });
                                              setFields(updatedFields);
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
                                  ({fields.filter((f) => (f.page || 1) === selectedPageId).length} fields)
                                </span>
                              </>
                            ) : (
                              <>
                                All Fields ({fields.length})
                                {fields.length === 0 && (
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
                          {(() => {
                            const fieldsToShow = selectedPageId
                              ? fields.filter((f) => (f.page || 1) === selectedPageId)
                              : fields;

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
                              return (
                                <div className="space-y-4">
                                  {fieldsToShow.map((field) => (
                                    <div
                                      key={field.id}
                                      className={cn(
                                        "flex items-center justify-between p-6 border rounded-lg cursor-pointer transition-colors hover:shadow-md",
                                        selectedFieldId === field.id
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/50"
                                      )}
                                      onClick={() => setSelectedFieldId(field.id)}
                                    >
                                      <div className="flex items-center space-x-4">
                                        <span className="text-2xl">
                                          {FIELD_TYPES.find((t) => t.value === field.type)?.icon || "📝"}
                                        </span>
                                        <div>
                                          <div className="font-medium text-lg">{field.label}</div>
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
                              return (
                                <div className="space-y-8">
                                  {pages.map((page) => {
                                    const pageFields = fields.filter((f) => (f.page || 1) === page.page);
                                    return (
                                      <div key={page.page}>
                                        <div className="flex items-center gap-3 mb-4">
                                          <FileText className="h-5 w-5 text-muted-foreground" />
                                          <span className="font-medium text-lg">{page.title}</span>
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
                                            pageFields.map((field) => (
                                              <div
                                                key={field.id}
                                                className={cn(
                                                  "flex items-center justify-between p-6 border rounded-lg cursor-pointer transition-colors hover:shadow-md",
                                                  selectedFieldId === field.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                )}
                                                onClick={() => setSelectedFieldId(field.id)}
                                              >
                                                <div className="flex items-center space-x-4">
                                                  <span className="text-2xl">
                                                    {FIELD_TYPES.find((t) => t.value === field.type)?.icon || "📝"}
                                                  </span>
                                                  <div>
                                                    <div className="font-medium text-lg">{field.label}</div>
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
                  {selectedFieldId && (
                    <div className="w-96 border-l bg-card overflow-y-auto min-h-0">
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-6">Configure Field</h3>
                        <SimpleFieldConfigurator
                          fieldId={selectedFieldId}
                          getField={getField}
                          onUpdate={updateField}
                          availablePages={pages.map((p) => p.page)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0 p-8 overflow-y-auto min-h-0">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Live Preview</h2>
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
                    <FormPreview config={formConfig} />
                  </div>
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