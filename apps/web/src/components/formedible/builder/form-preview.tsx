'use client';
import React, { useMemo } from 'react';
import { useFormedible } from '@/hooks/use-formedible';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseFormedibleOptions } from '@/lib/formedible/parser-types';

// Remove duplicate interface - using FormConfiguration from form-preview-base.tsx

interface FormPreviewProps {
  config: UseFormedibleOptions<Record<string, unknown>>;
  className?: string;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  config,
  className,
}) => {
  const fields = config.fields || [];

  // Convert form configuration to formedible configuration
  const formedibleConfig = useMemo(() => {
    if (fields.length === 0) {
      return {
        fields: [],
        schema: z.object({})
      };
    }

    try {
      const schemaFields: Record<string, any> = {};

      fields.forEach((field) => {
        let fieldSchema: z.ZodTypeAny;

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
            fieldSchema = z.object({}).passthrough();
            break;
          default:
            fieldSchema = z.string();
        }

        if (field.required) {
          if (field.type === "number" || field.type === "slider" || field.type === "rating") {
            // For numbers, required means not null/undefined
          } else if (field.type === "checkbox" || field.type === "switch") {
            fieldSchema = fieldSchema.refine((val: unknown) => val === true, {
              message: `${field.label || field.name} is required`,
            });
          } else if ('min' in fieldSchema && typeof fieldSchema.min === "function") {
            fieldSchema = fieldSchema.min(1, `${field.label || field.name} is required`);
          }
        } else {
          fieldSchema = fieldSchema.optional();
        }

        schemaFields[field.name] = fieldSchema;
      });

      return {
        schema: z.object(schemaFields),
        fields: fields.map((field) => {
          const mappedField: any = {
            name: field.name,
            type: field.type,
            label: field.label || field.name,
            page: field.page || 1,
          };

          if (field.placeholder) mappedField.placeholder = field.placeholder;
          if (field.description) mappedField.description = field.description;
          if (field.defaultValue !== undefined) mappedField.defaultValue = field.defaultValue;
          if (field.group) mappedField.group = field.group;
          if (field.section) mappedField.section = field.section;
          if (field.help) mappedField.help = field.help;
          if (field.inlineValidation) mappedField.inlineValidation = field.inlineValidation;
          if (field.options) mappedField.options = field.options;
          if (field.arrayConfig) mappedField.arrayConfig = field.arrayConfig;
          if (field.objectConfig) mappedField.objectConfig = field.objectConfig;
          if (field.datalist) mappedField.datalist = field.datalist;
          if (field.multiSelectConfig) mappedField.multiSelectConfig = field.multiSelectConfig;
          if (field.colorConfig) mappedField.colorConfig = field.colorConfig;
          if (field.ratingConfig) mappedField.ratingConfig = field.ratingConfig;
          if (field.phoneConfig) mappedField.phoneConfig = field.phoneConfig;
          if (field.min !== undefined) mappedField.min = field.min;
          if (field.max !== undefined) mappedField.max = field.max;
          if (field.step !== undefined) mappedField.step = field.step;

          return mappedField;
        }),
        pages: (config.pages && config.pages.length > 1) ? config.pages : [],
        submitLabel: config.submitLabel || "Submit",
        nextLabel: config.nextLabel || "Next",
        previousLabel: config.previousLabel || "Previous",
        progress: config.progress,
        formOptions: {
          onSubmit: async ({ value }: { value: Record<string, unknown> }) => {
            console.log('Preview form submitted:', value);
            
            // Format the form data for display
            const formatValue = (val: unknown): string => {
              if (val === null || val === undefined) return 'null';
              if (typeof val === 'boolean') return val.toString();
              if (typeof val === 'number') return val.toString();
              if (typeof val === 'string') return val;
              if (Array.isArray(val)) {
                return val.map(item => 
                  typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
                ).join('\n');
              }
              if (typeof val === 'object') {
                return JSON.stringify(val, null, 2);
              }
              return String(val);
            };
            
            const formattedData = Object.entries(value)
              .map(([key, val]) => `${key}: ${formatValue(val)}`)
              .join('\n');
            
            alert(`✅ Form submitted successfully!\n\nForm Data:\n${formattedData}`);
          },
        },
      };
    } catch (error) {
      console.error('Error converting form configuration:', error);
      return {
        fields: [],
        schema: z.object({})
      };
    }
  }, [fields, config]);

  // Create the form using formedible - call hook at top level
  const formResult = useFormedible(formedibleConfig);

  // Handle configuration errors or empty fields
  if (!formResult || !formResult.Form || fields.length === 0) {
    if (fields.length === 0) {
      return (
        <Card className={cn("bg-muted/30", className)}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">No Fields Added</h3>
            <p className="text-muted-foreground">
              Add some fields from the sidebar to see your form preview
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className={cn("bg-muted/30", className)}>
        <CardContent className="py-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error generating the form preview. Please check your field configurations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { Form } = formResult;

  return (
    <Card className={cn("bg-muted/30", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div>
            <div>{config.title || 'Untitled Form'}</div>
            {config.description && (
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {config.description}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? 's' : ''}
            {(config.pages && config.pages.length > 1) && ` • ${config.pages.length} pages`}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Form stats */}
          <div className={`grid gap-2 p-1.5 bg-muted/50 border rounded-lg ${(config.pages && config.pages.length > 1) ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{fields.length}</div>
              <div className="text-xs text-muted-foreground">Fields</div>
            </div>
            {(config.pages && config.pages.length > 1) && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{config.pages.length}</div>
                <div className="text-xs text-muted-foreground">Pages</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {fields.filter(f => f.required).length}
              </div>
              <div className="text-xs text-muted-foreground">Required</div>
            </div>
          </div>

          {/* Live form preview */}
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 bg-background">
            <div className="text-xs text-muted-foreground mb-1 text-center">
              ✨ Live Preview - This form is fully functional!
            </div>
            <Form />
          </div>

          {/* Field breakdown */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Field Types Used</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(fields.map(f => f.type))).map(type => {
                const count = fields.filter(f => f.type === type).length;
                const icons: Record<string, string> = {
                  text: '📝', email: '📧', password: '🔒', textarea: '📄',
                  number: '🔢', select: '📋', radio: '⚪', multiSelect: '☑️',
                  checkbox: '✅', switch: '🔘', date: '📅', slider: '🎚️',
                  rating: '⭐', colorPicker: '🎨', phone: '📞', file: '📎',
                  array: '📚'
                };
                
                return (
                  <div
                    key={type}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                  >
                    <span>{icons[type] || '📝'}</span>
                    <span>{type}</span>
                    {count > 1 && (
                      <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced features used */}
          {(fields.some(f => f.section) || 
            fields.some(f => f.group) ||
            fields.some(f => f.help) ||
            fields.some(f => (f as any).inlineValidationEnabled)) && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">Advanced Features</h4>
              <div className="flex flex-wrap gap-2">
                {fields.some(f => f.section) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    📑 Sections
                  </div>
                )}
                {fields.some(f => f.group) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                    🏷️ Field Groups
                  </div>
                )}
                {fields.some(f => f.help) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/50 text-foreground rounded text-xs">
                    ❓ Help & Tooltips
                  </div>
                )}
                {fields.some(f => f.inlineValidation && typeof f.inlineValidation === 'object' && (f.inlineValidation as any).enabled) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                    ⚡ Inline Validation
                  </div>
                )}
                {config.progress && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                    📊 Progress Indicator
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};