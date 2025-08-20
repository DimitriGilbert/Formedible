"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Copy, Edit, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { FieldConfigurator } from "../field-configurator";
import { globalFieldStore } from "../field-store";
import type { TabContentProps, FormField } from "@/lib/formedible/builder-types";
import { FIELD_TYPES } from "@/lib/formedible/builder-types";

// FieldList Component with grid layout (2 per row)
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
    <div className="grid grid-cols-2 gap-4">
      {displayFields.map((field) => (
      <div
        key={field.id}
        className={cn(
          "flex flex-col p-4 rounded-lg cursor-pointer transition-colors hover:shadow-md border bg-muted/30",
          selectedFieldId === field.id
            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
            : "border-border hover:bg-muted/50"
        )}
        onClick={() => onSelectField(field.id)}
      >
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-xl">
            {FIELD_TYPES.find((t) => t.value === field.type)?.icon || "📝"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{field.label}</div>
            <div className="text-sm text-muted-foreground truncate">
              {field.type} • {field.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {field.tab ? `Tab ${field.tab}` : `Page ${field.page || 1}`}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateField(field.id);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteField(field.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    ))}
  </div>
  );
};

FieldList.displayName = 'FieldList';

// Collapsible Section Component
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}> = ({ title, children, defaultOpen = true, className }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        className="flex items-center justify-between cursor-pointer py-2 hover:text-primary transition-colors border-b border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-xl font-semibold">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5" />
        ) : (
          <ChevronDown className="h-5 w-5" />
        )}
      </div>
      {isOpen && (
        <div className="space-y-4">
          {children}
        </div>
      )}
      {/* Dashed separator line at bottom - only when open */}
      {isOpen && (
        <div className="flex justify-center">
          <div className="w-2/3 border-b border-dashed border-border/60" />
        </div>
      )}
    </div>
  );
};

// FieldTypeSidebar Component
const FieldTypeSidebar: React.FC<{
  onAddField: (type: string) => void;
  selectedPage: number | null;
  selectedTab: string | null;
  layoutType: "pages" | "tabs";
}> = ({ onAddField, selectedPage, selectedTab, layoutType }) => (
  <div className="w-72 overflow-y-auto">
    <div className="p-6 bg-card border-r">
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

// ConfiguratorPanel Component
const ConfiguratorPanel: React.FC<{
  selectedFieldId: string | null;
  availablePages: number[];
}> = ({ selectedFieldId, availablePages }) => {
  const [currentField, setCurrentField] = useState<FormField | null>(null);

  // Update field data when selectedFieldId changes
  React.useEffect(() => {
    if (selectedFieldId) {
      const field = globalFieldStore.getField(selectedFieldId);
      setCurrentField(field || null);
    } else {
      setCurrentField(null);
    }
  }, [selectedFieldId]);

  if (!selectedFieldId || !currentField) return null;

  return (
    <div className="w-96 overflow-y-auto min-h-0">
      <div className="bg-card border-l">
        <FieldConfigurator
          fieldId={selectedFieldId}
          initialField={currentField}
          availablePages={availablePages}
        />
      </div>
    </div>
  );
};

export const BuilderTabContent: React.FC<TabContentProps> = ({
  getFormMetadata,
  onFormMetadataChange,
  selectedFieldId,
  onSelectField,
  onAddField,
  onDeleteField,
  onDuplicateField,
  selectedPageId,
  selectedTabId,
  setSelectedPageId,
  setSelectedTabId,
  editingPageId,
  setEditingPageId,
  editingTabId,
  setEditingTabId,
  getAllFields,
  getFieldsByPage,
  getFieldsByTab,
}) => {
  // Get current form metadata when needed (non-reactive)
  const formMetadata = getFormMetadata();
  
  // Get fields to show based on current selection
  const allFields = getAllFields();
  const fieldsToShow = formMetadata.layoutType === "pages" 
    ? (selectedPageId ? getFieldsByPage(selectedPageId) : allFields)
    : (selectedTabId ? getFieldsByTab(selectedTabId) : allFields);

  const availablePages = formMetadata.pages.map(p => p.page);

  return (
    <div className="h-full flex min-h-0">
      {/* Sidebar - Field Types */}
      <FieldTypeSidebar 
        onAddField={onAddField} 
        selectedPage={selectedPageId} 
        selectedTab={selectedTabId}
        layoutType={formMetadata.layoutType}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto min-h-0">
        <div className="mx-auto space-y-4">
          {/* Form Configuration */}
          <CollapsibleSection title="Form Configuration">
            <div className="space-y-4">
              <div>
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  defaultValue={formMetadata.title}
                  onChange={(e) => onFormMetadataChange({ title: e.target.value })}
                  placeholder="Enter form title"
                />
              </div>
              <div>
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  defaultValue={formMetadata.description}
                  onChange={(e) => onFormMetadataChange({ description: e.target.value })}
                  placeholder="Enter form description"
                />
              </div>
              <div>
                <Label htmlFor="layout-type">Layout Type</Label>
                <select
                  id="layout-type"
                  defaultValue={formMetadata.layoutType}
                  onChange={(e) => onFormMetadataChange({ layoutType: e.target.value as "pages" | "tabs" })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pages">Multi-Page Form</option>
                  <option value="tabs">Tabbed Form</option>
                </select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Form Settings */}
          <CollapsibleSection title="Form Settings">
            <div className="space-y-4">
              <div>
                <Label htmlFor="submit-label">Submit Button Label</Label>
                <Input
                  id="submit-label"
                  defaultValue={formMetadata.settings.submitLabel}
                  onChange={(e) => onFormMetadataChange({ 
                    settings: { ...formMetadata.settings, submitLabel: e.target.value } 
                  })}
                  placeholder="Submit"
                />
              </div>
              <div>
                <Label htmlFor="next-label">Next Button Label</Label>
                <Input
                  id="next-label"
                  defaultValue={formMetadata.settings.nextLabel}
                  onChange={(e) => onFormMetadataChange({ 
                    settings: { ...formMetadata.settings, nextLabel: e.target.value } 
                  })}
                  placeholder="Next"
                />
              </div>
              <div>
                <Label htmlFor="previous-label">Previous Button Label</Label>
                <Input
                  id="previous-label"
                  defaultValue={formMetadata.settings.previousLabel}
                  onChange={(e) => onFormMetadataChange({ 
                    settings: { ...formMetadata.settings, previousLabel: e.target.value } 
                  })}
                  placeholder="Previous"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-progress"
                  defaultChecked={formMetadata.settings.showProgress}
                  onCheckedChange={(checked) => onFormMetadataChange({ 
                    settings: { ...formMetadata.settings, showProgress: !!checked } 
                  })}
                />
                <Label htmlFor="show-progress">Show progress indicator</Label>
              </div>
            </div>
          </CollapsibleSection>

          {/* Page Management */}
          {formMetadata.layoutType === "pages" && (
            <CollapsibleSection 
              title={`Pages (${formMetadata.pages.length})`}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                {selectedPageId && (
                  <span className="text-sm text-primary">
                    Page {selectedPageId} selected
                  </span>
                )}
                <Button
                  onClick={() => {
                    const newPageNumber = Math.max(...formMetadata.pages.map((p) => p.page)) + 1;
                    const newPages = [...formMetadata.pages, {
                      page: newPageNumber,
                      title: `Page ${newPageNumber}`,
                      description: "",
                    }];
                    onFormMetadataChange({ pages: newPages });
                    setEditingPageId(newPageNumber);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Page
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {formMetadata.pages.map((page) => (
                  <div
                    key={page.page}
                    className={cn(
                      "border rounded-lg transition-all cursor-pointer bg-muted/30",
                      selectedPageId === page.page
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/50",
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
                              const updatedPages = formMetadata.pages.map(p => 
                                p.page === page.page ? { ...p, title: e.target.value } : p
                              );
                              onFormMetadataChange({ pages: updatedPages });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            defaultValue={page.description || ""}
                            onChange={(e) => {
                              const updatedPages = formMetadata.pages.map(p => 
                                p.page === page.page ? { ...p, description: e.target.value } : p
                              );
                              onFormMetadataChange({ pages: updatedPages });
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
                      <div className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <FileText
                            className={cn(
                              "h-5 w-5 mt-0.5",
                              selectedPageId === page.page
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "font-medium text-base truncate",
                                selectedPageId === page.page && "text-primary"
                              )}
                            >
                              {page.title}
                            </div>
                            {page.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2">{page.description}</div>
                            )}
                             <div className="text-xs text-muted-foreground mt-1">
                               {getFieldsByPage(page.page).length} fields
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPageId(page.page);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {formMetadata.pages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Delete ${page.title}? Fields on this page will be moved to Page 1.`
                                  )
                                ) {
                                  const updatedPages = formMetadata.pages
                                    .filter((p) => p.page !== page.page)
                                    .map((p, index) => ({ ...p, page: index + 1 }));
                                  onFormMetadataChange({ pages: updatedPages });
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
            </CollapsibleSection>
          )}

          {/* Tab Management */}
          {formMetadata.layoutType === "tabs" && (
            <CollapsibleSection 
              title={`Tabs (${formMetadata.tabs.length})`}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                {selectedTabId && (
                  <span className="text-sm text-primary">
                    Tab {selectedTabId} selected
                  </span>
                )}
                <Button
                  onClick={() => {
                    const newTabId = `tab_${Date.now()}`;
                    const newTabs = [...formMetadata.tabs, {
                      id: newTabId,
                      label: `Tab ${formMetadata.tabs.length + 1}`,
                      description: "",
                    }];
                    onFormMetadataChange({ tabs: newTabs });
                    setEditingTabId(newTabId);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tab
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  {formMetadata.tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={cn(
                        "border rounded-lg transition-all cursor-pointer bg-muted/30",
                        selectedTabId === tab.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:bg-muted/50",
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
                                const updatedTabs = formMetadata.tabs.map(t => 
                                  t.id === tab.id ? { ...t, label: e.target.value } : t
                                );
                                onFormMetadataChange({ tabs: updatedTabs });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              defaultValue={tab.description || ""}
                              onChange={(e) => {
                                const updatedTabs = formMetadata.tabs.map(t => 
                                  t.id === tab.id ? { ...t, description: e.target.value } : t
                                );
                                onFormMetadataChange({ tabs: updatedTabs });
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
                                 {getFieldsByTab(tab.id).length} fields
                               </div>
                            </div>
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
                            {formMetadata.tabs.length > 1 && (
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      `Delete ${tab.label}? Fields in this tab will be moved to the first tab.`
                                    )
                                  ) {
                                    const updatedTabs = formMetadata.tabs.filter(t => t.id !== tab.id);
                                    onFormMetadataChange({ tabs: updatedTabs });
                                    if (selectedTabId === tab.id) {
                                      setSelectedTabId(null);
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
            </CollapsibleSection>
          )}

          {/* Fields List */}
          <CollapsibleSection 
            title={
              formMetadata.layoutType === "pages" && selectedPageId 
                ? `${formMetadata.pages.find((p) => p.page === selectedPageId)?.title} Fields (${fieldsToShow.length})`
                : formMetadata.layoutType === "tabs" && selectedTabId 
                ? `${formMetadata.tabs.find((t) => t.id === selectedTabId)?.label} Fields (${fieldsToShow.length})`
                : `All Fields (${allFields.length})`
            }
            className="space-y-4"
          >
            {(selectedPageId || selectedTabId) && (
              <p className="text-sm text-muted-foreground">
                {formMetadata.layoutType === "pages" 
                  ? "New fields will be added to this page. Click the page again to deselect."
                  : "New fields will be added to this tab. Click the tab again to deselect."}
              </p>
            )}
            <div>
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
                  key={`${selectedPageId}-${selectedTabId}-${fieldsToShow.length}`}
                  fields={fieldsToShow}
                  selectedFieldId={selectedFieldId}
                  onSelectField={onSelectField}
                  onDeleteField={onDeleteField}
                  onDuplicateField={onDuplicateField}
                />
              )}
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* Field Configuration Panel */}
      <ConfiguratorPanel
        selectedFieldId={selectedFieldId}
        availablePages={availablePages}
      />
    </div>
  );
};