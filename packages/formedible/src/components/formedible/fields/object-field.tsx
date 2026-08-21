import { useState } from 'react';

import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Button } from '@/components/ui/button';
import { joinFieldPath } from '@/lib/formedible/field-path';
import { normalizeFieldConfig } from '@/lib/formedible/normalize-field-config';
import { cn } from '@/lib/utils';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

function objectValue(value: unknown): FormedibleFormValues {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as FormedibleFormValues) : {};
}

export function ObjectField<TFormValues extends FormedibleFormValues>({ fieldConfig, field, renderField }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.objectConfig;
  const fields = config?.fields ?? fieldConfig.nestedFields ?? [];
  const columns = config?.columns ?? 1;
  const layout = config?.layout ?? 'stack';
  const collapsible = config?.collapsible ?? false;
  const [isExpanded, setIsExpanded] = useState(config?.defaultExpanded !== false);
  const localValues = objectValue(field.value);

  if (!renderField) {
    return <FieldWrapper fieldConfig={fieldConfig} field={field}>{undefined}</FieldWrapper>;
  }

  const nestedFields = (
    <div
      id={`${field.id}-object-fields`}
      data-formedible-object-field={field.name}
      className={cn('space-y-4', layout === 'grid' && columns > 1 ? 'grid gap-4 space-y-0' : undefined)}
      style={layout === 'grid' && columns > 1 ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {fields.map((nestedField) => {
        const nestedConfig = normalizeFieldConfig<TFormValues>(nestedField);
        const nestedName = joinFieldPath(field.name, nestedConfig.name);

        return renderField(nestedConfig, {
          key: nestedName,
          name: nestedName,
          localValues,
        });
      })}
    </div>
  );

  const content = (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-3">
        {collapsible ? (
          <Button
            type="button"
            variant="ghost"
            data-formedible-object-toggle={field.name}
            aria-expanded={isExpanded}
            aria-controls={`${field.id}-object-fields`}
            disabled={fieldConfig.disabled}
            className="text-muted-foreground hover:text-foreground h-auto px-1.5 py-0.5 text-xs"
            onClick={() => setIsExpanded((previous) => !previous)}
          >
            {isExpanded ? config?.collapseLabel ?? 'Collapse' : config?.expandLabel ?? 'Expand'}
          </Button>
        ) : undefined}
        {!collapsible || isExpanded ? nestedFields : undefined}
      </div>
    </FieldWrapper>
  );

  if (config?.showCard) {
    return (
      <div data-formedible-object-card={field.name} className="rounded-lg border bg-card p-4 shadow-xs">
        {content}
      </div>
    );
  }

  return content;
}
