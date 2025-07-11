"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, HelpCircle, Settings, Palette, Star, Phone, Upload, List } from "lucide-react";

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
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    addLabel?: string;
    removeLabel?: string;
  };
  datalist?: string[];
  multiSelectConfig?: {
    placeholder?: string;
    searchable?: boolean;
    maxSelections?: number;
  };
  colorConfig?: {
    format?: "hex" | "rgb" | "hsl";
    presets?: string[];
  };
  ratingConfig?: {
    max?: number;
    allowHalf?: boolean;
    icon?: string;
  };
  phoneConfig?: {
    defaultCountry?: string;
    format?: "national" | "international";
  };
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
  };
}

interface FieldConfiguratorProps {
  fieldId: string;
  initialField: FormField;
  onFieldChange: (fieldId: string, field: FormField) => void;
  availablePages?: number[];
}

export const FieldConfigurator: React.FC<FieldConfiguratorProps> = ({
  fieldId,
  initialField,
  onFieldChange,
  availablePages = [1],
}) => {
  const [field, setField] = useState<FormField>(initialField);

  const updateField = (updates: Partial<FormField>) => {
    const updatedField = { ...field, ...updates };
    setField(updatedField);
    onFieldChange(fieldId, updatedField);
  };

  const needsOptions = ['select', 'radio', 'multiSelect'].includes(field.type);
  const needsArrayConfig = field.type === 'array';
  const needsColorConfig = field.type === 'colorPicker';
  const needsRatingConfig = field.type === 'rating';
  const needsPhoneConfig = field.type === 'phone';
  const needsMultiSelectConfig = field.type === 'multiSelect';

  // Options management
  const addOption = () => {
    const currentOptions = field.options || [];
    updateField({
      options: [...currentOptions, { value: `option_${currentOptions.length + 1}`, label: `Option ${currentOptions.length + 1}` }]
    });
  };

  const updateOption = (index: number, updates: { value?: string; label?: string }) => {
    const currentOptions = field.options || [];
    const newOptions = currentOptions.map((option, i) => 
      i === index ? { ...option, ...updates } : option
    );
    updateField({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const currentOptions = field.options || [];
    updateField({ options: currentOptions.filter((_, i) => i !== index) });
  };

  // Datalist management
  const addDatalistItem = () => {
    const currentDatalist = field.datalist || [];
    updateField({
      datalist: [...currentDatalist, `Item ${currentDatalist.length + 1}`]
    });
  };

  const updateDatalistItem = (index: number, value: string) => {
    const currentDatalist = field.datalist || [];
    const newDatalist = currentDatalist.map((item, i) => 
      i === index ? value : item
    );
    updateField({ datalist: newDatalist });
  };

  const removeDatalistItem = (index: number) => {
    const currentDatalist = field.datalist || [];
    updateField({ datalist: currentDatalist.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-4">
        <h3 className="font-semibold text-lg">Configure Field</h3>
        <p className="text-sm text-muted-foreground">
          Configure the properties for this {field.type} field
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="field-label">Field Label</Label>
            <Input
              id="field-label"
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>

          <div>
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              value={field.name}
              onChange={(e) => updateField({ name: e.target.value })}
              placeholder="Enter field name"
            />
          </div>

          <div>
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={field.placeholder || ""}
              onChange={(e) => updateField({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
            />
          </div>

          <div>
            <Label htmlFor="field-description">Description</Label>
            <Textarea
              id="field-description"
              value={field.description || ""}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="Enter field description"
            />
          </div>

          <div>
            <Label htmlFor="field-page">Page</Label>
            <Select
              value={String(field.page || 1)}
              onValueChange={(value) => updateField({ page: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePages.map((page) => (
                  <SelectItem key={page} value={String(page)}>
                    Page {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="field-group">Group (Optional)</Label>
            <Input
              id="field-group"
              value={field.group || ""}
              onChange={(e) => updateField({ group: e.target.value })}
              placeholder="Group name for organizing fields"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={field.required || false}
              onCheckedChange={(checked) => updateField({ required: !!checked })}
            />
            <Label htmlFor="field-required">Required field</Label>
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          {needsOptions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Field Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button onClick={addOption} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-3">
                  {(field.options || []).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option.value}
                        onChange={(e) => updateOption(index, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Input
                        value={option.label}
                        onChange={(e) => updateOption(index, { label: e.target.value })}
                        placeholder="Label"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(!field.options || field.options.length === 0) && (
                    <p className="text-sm text-muted-foreground">No options added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {field.type === 'text' && (
            <Card>
              <CardHeader>
                <CardTitle>Datalist (Autocomplete)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Suggestions</Label>
                  <Button onClick={addDatalistItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {(field.datalist || []).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={item}
                        onChange={(e) => updateDatalistItem(index, e.target.value)}
                        placeholder="Suggestion text"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDatalistItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {needsMultiSelectConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Multi-Select Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Placeholder</Label>
                  <Input
                    value={field.multiSelectConfig?.placeholder || ""}
                    onChange={(e) => updateField({
                      multiSelectConfig: { ...field.multiSelectConfig, placeholder: e.target.value }
                    })}
                    placeholder="Select options..."
                  />
                </div>
                <div>
                  <Label>Max Selections</Label>
                  <Input
                    type="number"
                    value={field.multiSelectConfig?.maxSelections || ""}
                    onChange={(e) => updateField({
                      multiSelectConfig: { ...field.multiSelectConfig, maxSelections: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.multiSelectConfig?.searchable || false}
                    onCheckedChange={(checked) => updateField({
                      multiSelectConfig: { ...field.multiSelectConfig, searchable: !!checked }
                    })}
                  />
                  <Label>Searchable</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {needsColorConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Picker Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Format</Label>
                  <Select
                    value={field.colorConfig?.format || "hex"}
                    onValueChange={(value) => updateField({
                      colorConfig: { ...field.colorConfig, format: value as "hex" | "rgb" | "hsl" }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hex">HEX (#ffffff)</SelectItem>
                      <SelectItem value="rgb">RGB (255, 255, 255)</SelectItem>
                      <SelectItem value="hsl">HSL (0, 0%, 100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {needsRatingConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Maximum Rating</Label>
                  <Input
                    type="number"
                    value={field.ratingConfig?.max || 5}
                    onChange={(e) => updateField({
                      ratingConfig: { ...field.ratingConfig, max: parseInt(e.target.value) || 5 }
                    })}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.ratingConfig?.allowHalf || false}
                    onCheckedChange={(checked) => updateField({
                      ratingConfig: { ...field.ratingConfig, allowHalf: !!checked }
                    })}
                  />
                  <Label>Allow half ratings</Label>
                </div>
              </CardContent>
            </Card>
          )}

          {needsPhoneConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Country</Label>
                  <Input
                    value={field.phoneConfig?.defaultCountry || "US"}
                    onChange={(e) => updateField({
                      phoneConfig: { ...field.phoneConfig, defaultCountry: e.target.value }
                    })}
                    placeholder="US"
                  />
                </div>
                <div>
                  <Label>Format</Label>
                  <Select
                    value={field.phoneConfig?.format || "national"}
                    onValueChange={(value) => updateField({
                      phoneConfig: { ...field.phoneConfig, format: value as "national" | "international" }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {needsArrayConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Array Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Minimum Items</Label>
                  <Input
                    type="number"
                    value={field.arrayConfig?.minItems || ""}
                    onChange={(e) => updateField({
                      arrayConfig: { ...field.arrayConfig, minItems: parseInt(e.target.value) || undefined }
                    })}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Maximum Items</Label>
                  <Input
                    type="number"
                    value={field.arrayConfig?.maxItems || ""}
                    onChange={(e) => updateField({
                      arrayConfig: { ...field.arrayConfig, maxItems: parseInt(e.target.value) || undefined }
                    })}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Add Button Label</Label>
                  <Input
                    value={field.arrayConfig?.addLabel || "Add Item"}
                    onChange={(e) => updateField({
                      arrayConfig: { ...field.arrayConfig, addLabel: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Remove Button Label</Label>
                  <Input
                    value={field.arrayConfig?.removeLabel || "Remove"}
                    onChange={(e) => updateField({
                      arrayConfig: { ...field.arrayConfig, removeLabel: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'password') && (
                <>
                  <div>
                    <Label>Minimum Length</Label>
                    <Input
                      type="number"
                      value={field.validation?.minLength || ""}
                      onChange={(e) => updateField({
                        validation: { ...field.validation, minLength: parseInt(e.target.value) || undefined }
                      })}
                      placeholder="No minimum"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Maximum Length</Label>
                    <Input
                      type="number"
                      value={field.validation?.maxLength || ""}
                      onChange={(e) => updateField({
                        validation: { ...field.validation, maxLength: parseInt(e.target.value) || undefined }
                      })}
                      placeholder="No maximum"
                      min="1"
                    />
                  </div>
                </>
              )}
              
              {(field.type === 'number' || field.type === 'slider') && (
                <>
                  <div>
                    <Label>Minimum Value</Label>
                    <Input
                      type="number"
                      value={field.validation?.min || ""}
                      onChange={(e) => updateField({
                        validation: { ...field.validation, min: parseInt(e.target.value) || undefined }
                      })}
                      placeholder="No minimum"
                    />
                  </div>
                  <div>
                    <Label>Maximum Value</Label>
                    <Input
                      type="number"
                      value={field.validation?.max || ""}
                      onChange={(e) => updateField({
                        validation: { ...field.validation, max: parseInt(e.target.value) || undefined }
                      })}
                      placeholder="No maximum"
                    />
                  </div>
                </>
              )}

              {field.type === 'text' && (
                <div>
                  <Label>Pattern (Regex)</Label>
                  <Input
                    value={field.validation?.pattern || ""}
                    onChange={(e) => updateField({
                      validation: { ...field.validation, pattern: e.target.value }
                    })}
                    placeholder="e.g., ^[A-Za-z]+$"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Regular expression pattern for validation
                  </p>
                </div>
              )}

              <div>
                <Label>Custom Validation Message</Label>
                <Textarea
                  value={field.validation?.custom || ""}
                  onChange={(e) => updateField({
                    validation: { ...field.validation, custom: e.target.value }
                  })}
                  placeholder="Custom error message"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Help Text</Label>
                <Textarea
                  value={field.help?.text || ""}
                  onChange={(e) => updateField({
                    help: { ...field.help, text: e.target.value }
                  })}
                  placeholder="Additional help text for users"
                />
              </div>
              <div>
                <Label>Tooltip</Label>
                <Input
                  value={field.help?.tooltip || ""}
                  onChange={(e) => updateField({
                    help: { ...field.help, tooltip: e.target.value }
                  })}
                  placeholder="Short tooltip text"
                />
              </div>
              <div>
                <Label>Help Position</Label>
                <Select
                  value={field.help?.position || "bottom"}
                  onValueChange={(value) => updateField({
                    help: { ...field.help, position: value as "top" | "bottom" | "left" | "right" }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Help Link URL</Label>
                <Input
                  value={field.help?.link?.url || ""}
                  onChange={(e) => updateField({
                    help: { 
                      ...field.help, 
                      link: { 
                        ...field.help?.link, 
                        url: e.target.value,
                        text: field.help?.link?.text || "Learn more"
                      }
                    }
                  })}
                  placeholder="https://example.com/help"
                />
              </div>
              <div>
                <Label>Help Link Text</Label>
                <Input
                  value={field.help?.link?.text || ""}
                  onChange={(e) => updateField({
                    help: { 
                      ...field.help, 
                      link: { 
                        ...field.help?.link, 
                        text: e.target.value,
                        url: field.help?.link?.url || ""
                      }
                    }
                  })}
                  placeholder="Learn more"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={field.section?.title || ""}
                  onChange={(e) => updateField({
                    section: { ...field.section, title: e.target.value }
                  })}
                  placeholder="Section title"
                />
              </div>
                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={field.section?.description || ""}
                    onChange={(e) => updateField({
                      section: { 
                        title: field.section?.title || "",
                        description: e.target.value,
                        collapsible: field.section?.collapsible,
                        defaultExpanded: field.section?.defaultExpanded
                      }
                    })}
                    placeholder="Section description"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.section?.collapsible || false}
                    onCheckedChange={(checked) => updateField({
                      section: { 
                        title: field.section?.title || "",
                        description: field.section?.description,
                        collapsible: !!checked,
                        defaultExpanded: field.section?.defaultExpanded
                      }
                    })}
                  />
                  <Label>Collapsible section</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.section?.defaultExpanded !== false}
                    onCheckedChange={(checked) => updateField({
                      section: { 
                        title: field.section?.title || "",
                        description: field.section?.description,
                        collapsible: field.section?.collapsible,
                        defaultExpanded: !!checked
                      }
                    })}
                  />
                  <Label>Expanded by default</Label>
                </div>            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inline Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.inlineValidation?.enabled || false}
                  onCheckedChange={(checked) => updateField({
                    inlineValidation: { ...field.inlineValidation, enabled: !!checked }
                  })}
                />
                <Label>Enable inline validation</Label>
              </div>
              <div>
                <Label>Debounce (ms)</Label>
                <Input
                  type="number"
                  value={field.inlineValidation?.debounceMs || 300}
                  onChange={(e) => updateField({
                    inlineValidation: { ...field.inlineValidation, debounceMs: parseInt(e.target.value) || 300 }
                  })}
                  min="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.inlineValidation?.showSuccess || false}
                  onCheckedChange={(checked) => updateField({
                    inlineValidation: { ...field.inlineValidation, showSuccess: !!checked }
                  })}
                />
                <Label>Show success indicator</Label>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4 border-t">
            <Label className="text-sm font-mono">Field Type: {field.type}</Label>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};