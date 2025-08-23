"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormedible } from '@/hooks/use-formedible';
import { cn } from '@/lib/utils';
import type { UseFormedibleOptions } from '@/lib/formedible/parser-types';

interface FormPreviewProps {
  config: UseFormedibleOptions<Record<string, unknown>>;
  className?: string;
}

export const FormPreview: React.FC<FormPreviewProps> = ({
  config,
  className,
}) => {
  const fields = config.fields || [];

  // Use the parsed config directly - no stupid rebuilding!
  const formedibleConfig = useMemo(() => {
    if (!config.fields || config.fields.length === 0) {
      return {
        fields: [],
        formOptions: {
          onSubmit: async () => {
            alert('No fields to submit');
          }
        }
      };
    }

    return {
      ...config,  // Use the parsed config directly!
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
                typeof item === 'object' ? JSON.stringify(item) : String(item)
              ).join(', ');
            }
            if (typeof val === 'object') {
              return JSON.stringify(val, null, 2);
            }
            return String(val);
          };

          const formattedData = Object.entries(value).map(([key, val]) => 
            `${key}: ${formatValue(val)}`
          ).join('\n');
          
          alert(`Form submitted successfully!\n\n${formattedData}`);
        }
      }
    };
  }, [config]);

  const formResult = useFormedible(formedibleConfig);

  // Handle no form result or empty fields
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
          <div className="text-center text-muted-foreground">
            There was an error generating the form preview.
          </div>
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
            {(config.tabs && config.tabs.length > 1) && ` • ${config.tabs.length} tabs`}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 bg-background">
          <div className="text-xs text-muted-foreground mb-1 text-center">
            ✨ Live Preview - This form is fully functional!
          </div>
          <Form />
        </div>
      </CardContent>
    </Card>
  );
};