'use client';
import React, { useMemo } from 'react';
import { useFormedible } from '@/hooks/use-formedible';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
    allowPageNavigation: boolean;
    resetOnSubmit: boolean;
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
      return {
        fields: config.fields.map(field => {
          const fieldConfig: any = {
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
          };

          // Add validation if field is required
          if (field.required) {
            switch (field.type) {
              case 'text':
              case 'email':
              case 'password':
              case 'textarea':
                fieldConfig.validation = z.string().min(1, `${field.label} is required`);
                break;
              case 'number':
              case 'slider':
              case 'rating':
                fieldConfig.validation = z.number().min(0, `${field.label} is required`);
                break;
              case 'select':
              case 'radio':
                fieldConfig.validation = z.string().min(1, `Please select ${field.label}`);
                break;
              case 'multiSelect':
                fieldConfig.validation = z.array(z.string()).min(1, `Please select at least one ${field.label}`);
                break;
              case 'checkbox':
              case 'switch':
                fieldConfig.validation = z.boolean().refine(val => val === true, `${field.label} is required`);
                break;
              case 'date':
                fieldConfig.validation = z.date();
                break;
              case 'array':
                fieldConfig.validation = z.array(z.string()).min(1, `At least one ${field.label} is required`);
                break;
              case 'colorPicker':
                fieldConfig.validation = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a color');
                break;
              case 'phone':
                fieldConfig.validation = z.string().min(10, 'Please enter a valid phone number');
                break;
              case 'file':
                fieldConfig.validation = z.any().refine(val => val && val.length > 0, `${field.label} is required`);
                break;
            }
          }

          // Add options for select/radio/multiSelect fields
          if (['select', 'radio', 'multiSelect'].includes(field.type) && field.options) {
            fieldConfig.options = field.options;
          }

          // Add field-specific configurations
          if (field.arrayConfig) fieldConfig.arrayConfig = field.arrayConfig;
          if (field.datalist) fieldConfig.datalist = field.datalist;
          if (field.multiSelectConfig) fieldConfig.multiSelectConfig = field.multiSelectConfig;
          if (field.colorConfig) fieldConfig.colorConfig = field.colorConfig;
          if (field.ratingConfig) fieldConfig.ratingConfig = field.ratingConfig;
          if (field.phoneConfig) fieldConfig.phoneConfig = field.phoneConfig;

          return fieldConfig;
        }),
        pages: config.pages.length > 1 ? config.pages : undefined,
        submitLabel: config.settings.submitLabel,
        nextLabel: config.settings.nextLabel,
        previousLabel: config.settings.previousLabel,
        progress: config.settings.showProgress ? { 
          showSteps: true, 
          showPercentage: true 
        } : undefined,
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

  // Handle empty state early
  if (config.fields.length === 0) {
    return (
      <Card className={className}>
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

  // Handle configuration errors
  if (!formResult) {
    return (
      <Card className={className}>
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
    <Card className={className}>
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
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{config.fields.length}</div>
              <div className="text-xs text-muted-foreground">Fields</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{config.pages.length}</div>
              <div className="text-xs text-muted-foreground">Pages</div>
            </div>
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
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    📑 Sections
                  </div>
                )}
                {config.fields.some(f => f.group) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    🏷️ Field Groups
                  </div>
                )}
                {config.fields.some(f => f.help) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    ❓ Help & Tooltips
                  </div>
                )}
                {config.fields.some(f => f.inlineValidation?.enabled) && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                    ⚡ Inline Validation
                  </div>
                )}
                {config.settings.showProgress && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
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