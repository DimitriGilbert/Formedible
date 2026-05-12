import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { joinFieldPath } from '@/lib/formedible/field-path';
import { normalizeFieldConfig } from '@/lib/formedible/normalize-field-config';
import { cn } from '@/lib/utils';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

function objectValue(value: unknown): FormedibleFormValues {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as FormedibleFormValues) : {};
}

export function ObjectField<TFormValues extends FormedibleFormValues>({ fieldConfig, field, renderField }: FormedibleFieldRenderProps<TFormValues>) {
  const fields = fieldConfig.objectConfig?.fields ?? fieldConfig.nestedFields ?? [];
  const columns = fieldConfig.objectConfig?.columns ?? 1;
  const layout = fieldConfig.objectConfig?.layout ?? 'stack';
  const localValues = objectValue(field.value);

  if (!renderField) {
    return <FieldWrapper fieldConfig={fieldConfig} field={field}>{undefined}</FieldWrapper>;
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div
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
    </FieldWrapper>
  );
}
