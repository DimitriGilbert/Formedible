import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Textarea } from '@/components/ui/textarea';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

export function TextareaField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const value = typeof field.value === 'string' ? field.value : '';
  const rows = fieldConfig.rows ?? fieldConfig.textareaConfig?.rows;
  const maxLength = fieldConfig.maxLength ?? fieldConfig.textareaConfig?.maxLength;
  const cols = fieldConfig.textareaConfig?.cols;
  const resize = fieldConfig.textareaConfig?.resize;
  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/u).length;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Textarea
        id={field.id}
        name={field.name}
        value={value}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        rows={rows}
        cols={cols}
        maxLength={maxLength}
        style={resize === undefined ? undefined : { resize }}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
      />
      {fieldConfig.textareaConfig?.showWordCount ? (
        <p className="text-muted-foreground text-xs">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
          {maxLength === undefined ? null : ` / ${maxLength} characters max`}
        </p>
      ) : null}
    </FieldWrapper>
  );
}
