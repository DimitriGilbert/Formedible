'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Plus, Eye, Code, Settings, Download, Upload, Trash2, Copy, Move, Edit, FileText } from 'lucide-react';
import { z } from 'zod';
import { FieldConfigurator } from './field-configurator';
import { FormPreview } from './form-preview';

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
    position?: 'top' | 'bottom' | 'left' | 'right';
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
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'password', label: 'Password', icon: '🔒' },
  { value: 'textarea', label: 'Textarea', icon: '📄' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'select', label: 'Select', icon: '📋' },
  { value: 'radio', label: 'Radio Group', icon: '⚪' },
  { value: 'multiSelect', label: 'Multi-Select', icon: '☑️' },
  { value: 'checkbox', label: 'Checkbox', icon: '✅' },
  { value: 'switch', label: 'Switch', icon: '🔘' },
  { value: 'date', label: 'Date Picker', icon: '📅' },
  { value: 'slider', label: 'Slider', icon: '🎚️' },
  { value: 'rating', label: 'Rating', icon: '⭐' },
  { value: 'colorPicker', label: 'Color Picker', icon: '🎨' },
  { value: 'phone', label: 'Phone Number', icon: '📞' },
  { value: 'file', label: 'File Upload', icon: '📎' },
  { value: 'array', label: 'Array Field', icon: '📚' },
];

export const FormBuilder: React.FC = () => {
  const [formConfig, setFormConfig] = useState<FormConfiguration>({
    title: 'My Form',
    description: 'A form built with Formedible',
    fields: [],
    pages: [{ page: 1, title: 'Page 1', description: 'First page' }],
    settings: {
      submitLabel: 'Submit',
      nextLabel: 'Next',
      previousLabel: 'Previous',
      showProgress: true,
      allowPageNavigation: false,
      resetOnSubmit: false,
    },
  });

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('builder');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Add a new field
  const addField = useCallback((type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: `field_${formConfig.fields.length + 1}`,
      type,
      label: `${FIELD_TYPES.find(t => t.value === type)?.label || type} Field`,
      required: false,
      page: selectedPageId || 1,
    };

    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setSelectedFieldId(newField.id);
  }, [formConfig.fields.length, selectedPageId]);

  // Update a field
  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  }, []);

  // Delete a field
  const deleteField = useCallback((fieldId: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId),
    }));
    setSelectedFieldId(null);
  }, []);

  // Duplicate a field
  const duplicateField = useCallback((fieldId: string) => {
    const field = formConfig.fields.find(f => f.id === fieldId);
    if (field) {
      const newField: FormField = {
        ...field,
        id: `field_${Date.now()}`,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
      };
      setFormConfig(prev => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
      setSelectedFieldId(newField.id);
    }
  }, [formConfig.fields]);

  // Generate formedible configuration
  const generateFormedibleConfig = useCallback(() => {
    const schemaFields: Record<string, any> = {};
    
    formConfig.fields.forEach(field => {
      let fieldSchema = z.string();
      
      if (field.required) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      } else {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaFields[field.name] = fieldSchema;
    });

    return {
      schema: z.object(schemaFields),
      fields: formConfig.fields.map(field => ({
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
      pages: formConfig.pages,
      submitLabel: formConfig.settings.submitLabel,
      nextLabel: formConfig.settings.nextLabel,
      previousLabel: formConfig.settings.previousLabel,
      progress: formConfig.settings.showProgress ? { showSteps: true, showPercentage: true } : undefined,
      formOptions: {
        onSubmit: async ({ value }: any) => {
          console.log('Form submitted:', value);
          alert('Form submitted! Check console for values.');
        },
      },
    };
  }, [formConfig]);

  // Export configuration as JSON
  const exportConfig = useCallback(() => {
    const config = generateFormedibleConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formConfig.title.toLowerCase().replace(/\\s+/g, '-')}-form.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formConfig, generateFormedibleConfig]);

  // Import configuration from JSON
  const importConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          
          // Convert imported config back to form configuration
          const importedFields: FormField[] = (config.fields || []).map((field: any, index: number) => ({
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
          }));

          setFormConfig({
            title: 'Imported Form',
            description: 'Imported from JSON',
            fields: importedFields,
            pages: config.pages || [{ page: 1, title: 'Page 1', description: '' }],
            settings: {
              submitLabel: config.submitLabel || 'Submit',
              nextLabel: config.nextLabel || 'Next',
              previousLabel: config.previousLabel || 'Previous',
              showProgress: !!config.progress,
              allowPageNavigation: false,
              resetOnSubmit: false,
            },
          });
        } catch (error) {
          alert('Error importing configuration. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Generate code preview
  const generateCode = useCallback(() => {
    const config = generateFormedibleConfig();
    return `import { useFormedible } from '@/hooks/use-formedible';
import { z } from 'zod';

const formConfig = ${JSON.stringify(config, null, 2)};

export const MyForm = () => {
  const { Form } = useFormedible(formConfig);
  
  return <Form />;
};`;
  }, [generateFormedibleConfig]);

  const selectedField = formConfig.fields.find(f => f.id === selectedFieldId);

  return (
    <div className="w-full min-h-[800px] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Formedible Builder</h1>
            <div className="text-sm text-muted-foreground">
              Build forms with forms! 🚀
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportConfig}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={importConfig}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar - Field Types */}
        <div className="w-64 border-r bg-muted/20 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium mb-4">Field Types</h3>
            <div className="grid grid-cols-1 gap-2">
              {FIELD_TYPES.map((fieldType) => (
                <Button
                  key={fieldType.value}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto p-3"
                  onClick={() => addField(fieldType.value)}
                >
                  <span className="mr-2 text-base">{fieldType.icon}</span>
                  <span className="text-sm">{fieldType.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="builder" className="h-full m-0">
                <div className="h-full flex min-h-0">
                  {/* Form Structure */}
                  <div className="flex-1 p-6 overflow-y-auto min-h-0">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Form Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Form Title</label>
                            <input
                              type="text"
                              value={formConfig.title}
                              onChange={(e) => setFormConfig(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                              value={formConfig.description || ''}
                              onChange={(e) => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Page Management */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Pages ({formConfig.pages.length})
                            {selectedPageId && (
                              <span className="text-sm font-normal text-primary">
                                Page {selectedPageId} selected
                              </span>
                            )}
                            <Button
                              size="sm"
                              onClick={() => {
                                const newPageNumber = Math.max(...formConfig.pages.map(p => p.page)) + 1;
                                setFormConfig(prev => ({
                                  ...prev,
                                  pages: [...prev.pages, {
                                    page: newPageNumber,
                                    title: `Page ${newPageNumber}`,
                                    description: ''
                                  }]
                                }));
                                setEditingPageId(newPageNumber);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Page
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {formConfig.pages.map((page, index) => (
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
                                  <div className="p-3 space-y-3">
                                    <div>
                                      <label className="text-sm font-medium">Page Title</label>
                                      <input
                                        type="text"
                                        value={page.title}
                                        onChange={(e) => setFormConfig(prev => ({
                                          ...prev,
                                          pages: prev.pages.map(p => 
                                            p.page === page.page 
                                              ? { ...p, title: e.target.value }
                                              : p
                                          )
                                        }))}
                                        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                        autoFocus
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Description (optional)</label>
                                      <textarea
                                        value={page.description || ''}
                                        onChange={(e) => setFormConfig(prev => ({
                                          ...prev,
                                          pages: prev.pages.map(p => 
                                            p.page === page.page 
                                              ? { ...p, description: e.target.value }
                                              : p
                                          )
                                        }))}
                                        className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                                        rows={2}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => setEditingPageId(null)}
                                      >
                                        Done
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingPageId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center space-x-3">
                                      <FileText className={cn(
                                        "h-4 w-4",
                                        selectedPageId === page.page ? "text-primary" : "text-muted-foreground"
                                      )} />
                                      <div>
                                        <div className={cn(
                                          "font-medium",
                                          selectedPageId === page.page && "text-primary"
                                        )}>
                                          {page.title}
                                        </div>
                                        {page.description && (
                                          <div className="text-sm text-muted-foreground">{page.description}</div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                          {formConfig.fields.filter(f => (f.page || 1) === page.page).length} fields
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPageId(page.page);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      {formConfig.pages.length > 1 && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete ${page.title}? Fields on this page will be moved to Page 1.`)) {
                                              setFormConfig(prev => {
                                                const filteredPages = prev.pages.filter(p => p.page !== page.page);
                                                const renumberedPages = filteredPages.map((p, index) => ({
                                                  ...p,
                                                  page: index + 1
                                                }));
                                                
                                                const updatedFields = prev.fields.map(f => {
                                                  if ((f.page || 1) === page.page) {
                                                    return { ...f, page: 1 };
                                                  }
                                                  if ((f.page || 1) > page.page) {
                                                    return { ...f, page: (f.page || 1) - 1 };
                                                  }
                                                  return f;
                                                });
                                                
                                                return {
                                                  ...prev,
                                                  pages: renumberedPages,
                                                  fields: updatedFields
                                                };
                                              });
                                              if (selectedPageId === page.page) {
                                                setSelectedPageId(null);
                                              }
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
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
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {selectedPageId ? (
                              <>
                                {formConfig.pages.find(p => p.page === selectedPageId)?.title} Fields
                                <span className="text-sm font-normal text-muted-foreground">
                                  ({formConfig.fields.filter(f => (f.page || 1) === selectedPageId).length} fields)
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
                            <p className="text-sm text-muted-foreground">
                              New fields will be added to this page. Click the page again to deselect.
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const fieldsToShow = selectedPageId 
                              ? formConfig.fields.filter(f => (f.page || 1) === selectedPageId)
                              : formConfig.fields;
                            
                            if (fieldsToShow.length === 0) {
                              return (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>
                                    {selectedPageId 
                                      ? `No fields on this page yet. Add some from the sidebar!`
                                      : `No fields yet. Add some from the sidebar!`
                                    }
                                  </p>
                                </div>
                              );
                            }

                            if (selectedPageId) {
                              // Show only selected page fields in a simple list
                              return (
                                <div className="space-y-2">
                                  {fieldsToShow.map((field, index) => (
                                    <div
                                      key={field.id}
                                      className={cn(
                                        "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                                        selectedFieldId === field.id
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/50"
                                      )}
                                      onClick={() => setSelectedFieldId(field.id)}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <span className="text-lg">
                                          {FIELD_TYPES.find(t => t.value === field.type)?.icon || '📝'}
                                        </span>
                                        <div>
                                          <div className="font-medium">{field.label}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {field.type} • {field.name}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            duplicateField(field.id);
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteField(field.id);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              // Show all fields grouped by page
                              return (
                                <div className="space-y-4">
                                  {formConfig.pages.map(page => {
                                    const pageFields = formConfig.fields.filter(f => (f.page || 1) === page.page);
                                    return (
                                      <div key={page.page}>
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium text-sm">{page.title}</span>
                                          <span className="text-xs text-muted-foreground">({pageFields.length} fields)</span>
                                        </div>
                                        <div className="space-y-2 ml-6">
                                          {pageFields.length === 0 ? (
                                            <div className="text-sm text-muted-foreground italic">No fields on this page</div>
                                          ) : (
                                            pageFields.map((field, index) => (
                                              <div
                                                key={field.id}
                                                className={cn(
                                                  "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                                                  selectedFieldId === field.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                )}
                                                onClick={() => setSelectedFieldId(field.id)}
                                              >
                                                <div className="flex items-center space-x-3">
                                                  <span className="text-lg">
                                                    {FIELD_TYPES.find(t => t.value === field.type)?.icon || '📝'}
                                                  </span>
                                                  <div>
                                                    <div className="font-medium">{field.label}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                      {field.type} • {field.name}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      duplicateField(field.id);
                                                    }}
                                                  >
                                                    <Copy className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      deleteField(field.id);
                                                    }}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
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
                    <div className="w-80 border-l bg-muted/20 overflow-y-auto min-h-0">
                      <div className="p-4">
                        <h3 className="font-medium mb-4">Configure Field</h3>
                        <FieldConfigurator
                          field={selectedField}
                          onUpdate={updateField}
                          availablePages={formConfig.pages.map(p => p.page)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0 p-6 overflow-y-auto min-h-0">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Live Preview</h2>
                    <div className="flex items-center space-x-2">
                      {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={previewMode === mode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPreviewMode(mode)}
                        >
                          {mode === 'desktop' && '🖥️'}
                          {mode === 'tablet' && '📱'}
                          {mode === 'mobile' && '📱'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className={cn(
                    "mx-auto transition-all",
                    previewMode === 'mobile' ? 'max-w-sm' : 
                    previewMode === 'tablet' ? 'max-w-md' : 'max-w-2xl'
                  )}>
                    <FormPreview config={formConfig} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code" className="h-full m-0 p-6 overflow-y-auto min-h-0">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Generated Code</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generateCode())}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{generateCode()}</code>
                  </pre>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};