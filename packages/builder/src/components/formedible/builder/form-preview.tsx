'use client';
import React, { useMemo } from 'react';
import { useFormedible } from '@/hooks/use-formedible';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    allowPageNavigation?: boolean;
    resetOnSubmit?: boolean;
  };
}

interface FormPreviewProps {
  config: FormConfiguration;
  className?: string;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  config,
  className,
}) => {
  // Convert form configuration to formedible configuration
  const formedibleConfig = useMemo(() => {
    if (config.fields.length === 0) {
      return {
        fields: [],
        schema: z.object({})
      };
    }

    try {
      const schemaFields: Record<string, any> = {};

      config.fields.forEach((field) => {
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
        schema: z.object(schemaFields),
        fields: config.fields.map((field) => ({
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
        pages: config.pages && config.pages.length > 1 ? config.pages : [],
        submitLabel: config.settings.submitLabel,
        nextLabel: config.settings.nextLabel,
        previousLabel: config.settings.previousLabel,
        progress: config.settings.showProgress
          ? { showSteps: true, showPercentage: true }
          : undefined,
        formOptions: {
          onSubmit: async ({ value }: any) => {
            console.log('Preview form submitted:', value);
            alert('Form submitted successfully! Check the console for form data.');
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
  }, [config]);

  // Create the form using formedible - call hook at top level
  const formResult = useFormedible(formedibleConfig);

  // Handle configuration errors or empty fields
  if (!formResult || !formResult.Form || config.fields.length === 0) {
    if (config.fields.length === 0) {
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
        <CardContent className="py-6">
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
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div>{config.title}</div>
            {config.description && (
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {config.description}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {config.fields.length} field{config.fields.length !== 1 ? 's' : ''}
            {config.pages.length > 1 && ` • ${config.pages.length} pages`}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Form stats */}
          <div className={`grid gap-4 p-4 bg-muted/50 border rounded-lg ${config.pages.length > 1 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{config.fields.length}</div>
              <div className="text-xs text-muted-foreground">Fields</div>
            </div>
            {config.pages.length > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{config.pages.length}</div>
                <div className="text-xs text-muted-foreground">Pages</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {config.fields.filter(f => f.required).length}
              </div>
              <div className="text-xs text-muted-foreground">Required</div>
            </div>
          </div>

          {/* Live form preview */}
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 bg-background">
            <div className="text-xs text-muted-foreground mb-4 text-center">
              ✨ Live Preview - This form is fully functional!
            </div>
            <Form />
          </div>

          {/* Field breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Field Types Used</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(config.fields.map(f => f.type))).map(type => {
                const count = config.fields.filter(f => f.type === type).length;
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
          {(config.fields.some(f => f.section) || 
            config.fields.some(f => f.group) ||
            config.fields.some(f => f.help) ||
            config.fields.some(f => f.inlineValidation?.enabled)) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Advanced Features</h4>
              <div className="flex flex-wrap gap-2">
                {config.fields.some(f => f.section) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    📑 Sections
                  </div>
                )}
                {config.fields.some(f => f.group) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs">
                    🏷️ Field Groups
                  </div>
                )}
                {config.fields.some(f => f.help) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/50 text-foreground rounded text-xs">
                    ❓ Help & Tooltips
                  </div>
                )}
                {config.fields.some(f => f.inlineValidation?.enabled) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                    ⚡ Inline Validation
                  </div>
                )}
                {config.settings.showProgress && (
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