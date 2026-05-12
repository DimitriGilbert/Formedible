'use client';

import { useMemo } from 'react';

import { useFormedible } from '@/hooks/use-formedible';
import { cn } from '@/lib/utils';
import type { FormedibleFormValues, UseFormedibleOptions } from '@/lib/formedible/types';

export interface FormPreviewProps {
  readonly config: UseFormedibleOptions<FormedibleFormValues>;
  readonly onFormSubmit?: (values: FormedibleFormValues) => void;
  readonly className?: string;
}

export function FormPreview({ config, onFormSubmit, className }: FormPreviewProps) {
  const previewConfig = useMemo<UseFormedibleOptions<FormedibleFormValues>>(() => ({
    ...config,
    formOptions: {
      ...config.formOptions,
      defaultValues: config.formOptions.defaultValues,
      onSubmit: async ({ value }) => {
        onFormSubmit?.(value);
      },
    },
  }), [config, onFormSubmit]);
  const { Form } = useFormedible(previewConfig);

  if (config.fields.length === 0) {
    return (
      <div className={cn('rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground', className)} data-builder-part="form-preview-empty">
        Add fields to preview the form.
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-background p-4', className)} data-builder-part="form-preview">
      <Form />
    </div>
  );
}
