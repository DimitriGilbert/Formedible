"use client";
import React, { useState, useRef } from "react";
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
import { globalFieldStore, type FormField } from "./field-store";

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

// FIELD LIST THAT SUBSCRIBES TO REAL-TIME FIELD UPDATES!
const FieldList: React.FC<{
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onDeleteField: (id: string) => void;
  onDuplicateField: (id: string) => void;
}> = ({ fields, selectedFieldId, onSelectField, onDeleteField, onDuplicateField }) => {
  const [displayFields, setDisplayFields] = useState(fields);

  // Subscribe to field updates for all visible fields
  React.useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to each field's updates
    fields.forEach(field => {
      const unsubscribe = globalFieldStore.subscribeToFieldUpdates(field.id, (updatedField) => {
        setDisplayFields(prevFields => 
          prevFields.map(f => f.id === updatedField.id ? updatedField : f)
        );
      });
      unsubscribers.push(unsubscribe);
    });

    // Update display fields when fields prop changes
    setDisplayFields(fields);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [fields]);

  return (
    <div className="space-y-4">
      {displayFields.map((field) => (
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
              {field.type} • {field.name} • {field.tab ? `Tab ${field.tab}` : `Page ${field.page || 1}`}
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
};

FieldList.displayName = 'FieldList';

const FieldTypeSidebar: React.FC<{
  onAddField: (type: string) => void;
  selectedPage: number | null;
  selectedTab: string | null;
  layoutType: "pages" | "tabs";
}> = ({ onAddField, selectedPage, selectedTab, layoutType }) => (
  <div className="w-72 border-r bg-card overflow-y-auto">
    <div className="p-6">
      <h3 className="font-semibold text-lg mb-6">Field Types</h3>
      {layoutType === "pages" && selectedPage && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">
            Adding to Page {selectedPage}
          </p>
        </div>
      )}
      {layoutType === "tabs" && selectedTab && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">
            Adding to Tab {selectedTab}
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

const ConfiguratorPanel: React.FC<{
  selectedFieldId: string | null;
  availablePages: number[];
}> = ({ selectedFieldId, availablePages }) => {
  if (!selectedFieldId) return null;

  // Direct store access - NO PARENT STATE
  const field = globalFieldStore.getField(selectedFieldId);
  if (!field) return null;

  return (
    <div className="w-96 border-l bg-card overflow-y-auto min-h-0">
      <FieldConfigurator
        key={selectedFieldId}
        fieldId={selectedFieldId}
        initialField={field}
        availablePages={availablePages}
      />
    </div>
  );
};

export const FormBuilder: React.FC = () => {
  // Form metadata state (minimal, non-rerendering)
  const formMetaRef = useRef({
    title: "My Form",
    description: "A form built with Formedible",
    pages: [{ page: 1, title: "Page 1", description: "First page" }] as Array<{ page: number; title: string; description?: string }>,
    tabs: [{ id: "general", label: "General", description: "General information" }] as Array<{ id: string; label: string; description?: string }>,
    layoutType: "pages" as "pages" | "tabs",
    settings: {
      submitLabel: "Submit",
      nextLabel: "Next",
      previousLabel: "Previous",
      showProgress: true,
    }
  });

  // UI state (minimal, only for display)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  // ONLY SUBSCRIBE TO STRUCTURE CHANGES (add/delete) - NOT FIELD UPDATES!
  const [, forceUpdate] = useState({});
  const forceRerender = () => forceUpdate({});

  React.useEffect(() => {
    const unsubscribe = globalFieldStore.subscribe(forceRerender); // Only structure changes
    return unsubscribe;
  }, []);

  const handleAddField = (type: string) => {
    const newFieldId = globalFieldStore.addField(type, selectedPageId || 1);
    const field = globalFieldStore.getField(newFieldId);
    if (field && formMetaRef.current.layoutType === "tabs" && selectedTabId) {
      globalFieldStore.updateField(newFieldId, { ...field, tab: selectedTabId });
    }
    setSelectedFieldId(newFieldId);
  };

  const handleSelectField = (fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  };

  const handleDeleteField = (fieldId: string) => {
    globalFieldStore.deleteField(fieldId);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleDuplicateField = (fieldId: string) => {
    const newFieldId = globalFieldStore.duplicateField(fieldId);
    if (newFieldId) {
      setSelectedFieldId(newFieldId);
    }
  };

  // Export configuration - grab data directly
  const exportConfig = () => {
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
    a.download = `${formMetaRef.current.title.toLowerCase().replace(/\s+/g, "-")}-form.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import configuration
  const importConfig = () => {
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

          // Update form config
          formMetaRef.current = {
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
          };
          
          setSelectedFieldId(null);
          // Field data will update automatically via subscription
        } catch (error) {
          alert("Error importing configuration. Please check the file format.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Direct store access - NO PARENT STATE FOR FIELD DATA
  const allFields = globalFieldStore.getAllFields();
  const fieldsToShow = formMetaRef.current.layoutType === "pages" 
    ? (selectedPageId ? globalFieldStore.getFieldsByPage(selectedPageId) : allFields)
    : (selectedTabId ? globalFieldStore.getFieldsByTab(selectedTabId) : allFields);

  const availablePages = formMetaRef.current.pages.map(p => p.page);

  // Generate form configuration - ON DEMAND for preview/code tabs
  const getFormConfig = () => {
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
  };

  // Generate code - ON DEMAND
  const getGeneratedCode = () => {
    const formConfig = getFormConfig();
    return `import { useFormedible } from 'formedible';
import { z } from 'zod';

const formConfig = ${JSON.stringify(formConfig, null, 2)};

export const MyForm = () => {
  const { Form } = useFormedible(formConfig);
  
  return <Form />;
};`;
  };

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
        <FieldTypeSidebar 
          onAddField={handleAddField} 
          selectedPage={selectedPageId} 
          selectedTab={selectedTabId}
          layoutType={formMetaRef.current.layoutType}
        />

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
                              defaultValue={formMetaRef.current.title}
                              onChange={(e) => { formMetaRef.current.title = e.target.value; }}
                              placeholder="Enter form title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="form-description">Description</Label>
                            <Textarea
                              id="form-description"
                              defaultValue={formMetaRef.current.description}
                              onChange={(e) => { formMetaRef.current.description = e.target.value; }}
                              placeholder="Enter form description"
                            />
                          </div>
                          <div>
                            <Label htmlFor="layout-type">Layout Type</Label>
                            <select
                              id="layout-type"
                              defaultValue={formMetaRef.current.layoutType}
                              onChange={(e) => { formMetaRef.current.layoutType = e.target.value as "pages" | "tabs"; }}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="pages">Multi-Page Form</option>
                              <option value="tabs">Tabbed Form</option>
                            </select>
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
                              defaultValue={formMetaRef.current.settings.submitLabel}
                              onChange={(e) => { formMetaRef.current.settings.submitLabel = e.target.value; }}
                              placeholder="Submit"
                            />
                          </div>
                          <div>
                            <Label htmlFor="next-label">Next Button Label</Label>
                            <Input
                              id="next-label"
                              defaultValue={formMetaRef.current.settings.nextLabel}
                              onChange={(e) => { formMetaRef.current.settings.nextLabel = e.target.value; }}
                              placeholder="Next"
                            />
                          </div>
                          <div>
                            <Label htmlFor="previous-label">Previous Button Label</Label>
                            <Input
                              id="previous-label"
                              defaultValue={formMetaRef.current.settings.previousLabel}
                              onChange={(e) => { formMetaRef.current.settings.previousLabel = e.target.value; }}
                              placeholder="Previous"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="show-progress"
                              defaultChecked={formMetaRef.current.settings.showProgress}
                              onCheckedChange={(checked) => { formMetaRef.current.settings.showProgress = !!checked; }}
                            />
                            <Label htmlFor="show-progress">Show progress indicator</Label>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Page Management */}
                      {formMetaRef.current.layoutType === "pages" && (
                        <Card className="hover:shadow-lg transition-shadow gap-2">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-xl">
                            Pages ({formMetaRef.current.pages.length})
                            {selectedPageId && (
                              <span className="text-sm font-normal text-primary">
                                Page {selectedPageId} selected
                              </span>
                            )}
                            <Button
                              onClick={() => {
                                const newPageNumber = Math.max(...formMetaRef.current.pages.map((p) => p.page)) + 1;
                                formMetaRef.current.pages.push({
                                  page: newPageNumber,
                                  title: `Page ${newPageNumber}`,
                                  description: "",
                                });
                                 setEditingPageId(newPageNumber);
                                 // Field data will update automatically via subscription
                               }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Page
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 p-4">
                          <div className="space-y-2">
                            {formMetaRef.current.pages.map((page) => (
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
                                        defaultValue={page.title}
                                        onChange={(e) => {
                                          const pageIndex = formMetaRef.current.pages.findIndex(p => p.page === page.page);
                                          if (pageIndex !== -1) {
                                            formMetaRef.current.pages[pageIndex].title = e.target.value;
                                          }
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea
                                        defaultValue={page.description || ""}
                                        onChange={(e) => {
                                          const pageIndex = formMetaRef.current.pages.findIndex(p => p.page === page.page);
                                          if (pageIndex !== -1) {
                                            formMetaRef.current.pages[pageIndex].description = e.target.value;
                                          }
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
                                           {globalFieldStore.getFieldsByPage(page.page).length} fields
                                         </div>                                      </div>
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
                                      {formMetaRef.current.pages.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (
                                              confirm(
                                                `Delete ${page.title}? Fields on this page will be moved to Page 1.`
                                              )
                                            ) {
                                                formMetaRef.current.pages = formMetaRef.current.pages
                                                .filter((p) => p.page !== page.page)
                                                .map((p, index) => ({ ...p, page: index + 1 }));
                                              if (selectedPageId === page.page) {
                                                setSelectedPageId(null);
                                              }
                                              // Field data will update automatically via subscription
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
                      )}

                      {/* Tab Management */}
                      {formMetaRef.current.layoutType === "tabs" && (
                        <Card className="hover:shadow-lg transition-shadow gap-2">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between text-xl">
                              Tabs ({formMetaRef.current.tabs.length})
                              {selectedTabId && (
                                <span className="text-sm font-normal text-primary">
                                  Tab {selectedTabId} selected
                                </span>
                              )}
                              <Button
                                onClick={() => {
                                  const newTabId = `tab_${Date.now()}`;
                                  formMetaRef.current.tabs.push({
                                    id: newTabId,
                                    label: `Tab ${formMetaRef.current.tabs.length + 1}`,
                                    description: "",
                                  });
                                   setEditingTabId(newTabId);
                                   // Field data will update automatically via subscription
                                 }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Tab
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 p-4">
                            <div className="space-y-2">
                              {formMetaRef.current.tabs.map((tab) => (
                                <div
                                  key={tab.id}
                                  className={cn(
                                    "border rounded-lg transition-all cursor-pointer",
                                    selectedTabId === tab.id
                                      ? "border-primary bg-primary/5 shadow-sm"
                                      : "border-border hover:border-primary/50",
                                    editingTabId === tab.id && "ring-2 ring-primary/20"
                                  )}
                                  onClick={() => {
                                    if (editingTabId === tab.id) return;
                                    setSelectedTabId(tab.id);
                                  }}
                                >
                                  {editingTabId === tab.id ? (
                                    <div className="p-8 space-y-6">
                                      <div>
                                        <Label>Tab Label</Label>
                                        <Input
                                          defaultValue={tab.label}
                                          onChange={(e) => {
                                            const tabIndex = formMetaRef.current.tabs.findIndex(t => t.id === tab.id);
                                            if (tabIndex !== -1) {
                                              formMetaRef.current.tabs[tabIndex].label = e.target.value;
                                            }
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label>Description</Label>
                                        <Textarea
                                          defaultValue={tab.description || ""}
                                          onChange={(e) => {
                                            const tabIndex = formMetaRef.current.tabs.findIndex(t => t.id === tab.id);
                                            if (tabIndex !== -1) {
                                              formMetaRef.current.tabs[tabIndex].description = e.target.value;
                                            }
                                          }}
                                        />
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Button onClick={() => setEditingTabId(null)}>Done</Button>
                                        <Button variant="outline" onClick={() => setEditingTabId(null)}>
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
                                            selectedTabId === tab.id
                                              ? "text-primary"
                                              : "text-muted-foreground"
                                          )}
                                        />
                                        <div>
                                          <div
                                            className={cn(
                                              "font-medium text-lg",
                                              selectedTabId === tab.id && "text-primary"
                                            )}
                                          >
                                            {tab.label}
                                          </div>
                                          {tab.description && (
                                            <div className="text-muted-foreground">{tab.description}</div>
                                          )}
                                           <div className="text-sm text-muted-foreground">
                                             {globalFieldStore.getFieldsByTab(tab.id).length} fields
                                           </div>                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingTabId(tab.id);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        {formMetaRef.current.tabs.length > 1 && (
                                          <Button
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (
                                                confirm(
                                                  `Delete ${tab.label}? Fields in this tab will be moved to the first tab.`
                                                )
                                              ) {
                                                formMetaRef.current.tabs = formMetaRef.current.tabs.filter(t => t.id !== tab.id);
                                                if (selectedTabId === tab.id) {
                                                  setSelectedTabId(null);
                                                }
                                                // Field data will update automatically via subscription
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
                      )}

                      {/* Fields List */}
                      <Card className="hover:shadow-lg transition-shadow gap-2">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-xl">
                            {formMetaRef.current.layoutType === "pages" && selectedPageId ? (
                              <>
                                {formMetaRef.current.pages.find((p) => p.page === selectedPageId)?.title} Fields
                                <span className="text-sm font-normal text-muted-foreground">
                                  ({fieldsToShow.length} fields)
                                </span>
                              </>
                            ) : formMetaRef.current.layoutType === "tabs" && selectedTabId ? (
                              <>
                                {formMetaRef.current.tabs.find((t) => t.id === selectedTabId)?.label} Fields
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
                          {(selectedPageId || selectedTabId) && (
                            <p className="text-muted-foreground">
                              {formMetaRef.current.layoutType === "pages" 
                                ? "New fields will be added to this page. Click the page again to deselect."
                                : "New fields will be added to this tab. Click the tab again to deselect."}
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
                                  : selectedTabId
                                  ? `No fields in this tab yet. Add some from the sidebar!`
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
                    availablePages={availablePages}
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
                  <FormPreview config={getFormConfig()} />                  </div>
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
                    code={getGeneratedCode()}
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