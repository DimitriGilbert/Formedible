import { PaperclipIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import { useRef } from 'react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

export function FileUploadField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.fileConfig;
  const inputRef = useRef<HTMLInputElement>(null);
  const files = getFiles(field.value);

  function setFiles(nextFiles: readonly File[]) {
    const limitedFiles = config?.maxFiles === undefined ? nextFiles : nextFiles.slice(0, config.maxFiles);
    const maxSize = config?.maxSize;
    const acceptedFiles = maxSize === undefined ? limitedFiles : limitedFiles.filter((file) => file.size <= maxSize);
    field.onChange(config?.multiple ? acceptedFiles : acceptedFiles[0] ?? null);
    config?.onFilesChange?.(acceptedFiles);
    field.onBlur();
  }

  function removeFile(file: File) {
    const nextFiles = files.filter((entry) => entry !== file);
    field.onChange(config?.multiple ? nextFiles : null);
    config?.onFileRemove?.(file);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    field.onBlur();
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-2">
        <Input
          ref={inputRef}
          id={field.id}
          name={field.name}
          type="file"
          accept={config?.accept}
          multiple={config?.multiple}
          disabled={fieldConfig.disabled}
          className="hidden"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <PaperclipIcon className="size-5 shrink-0 text-primary" />
                  <span className="truncate" title={file.name}>{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" disabled={fieldConfig.disabled} aria-label="Remove file" onClick={() => removeFile(file)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={fieldConfig.disabled}
            className={cn('flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-background p-4 transition-colors hover:border-primary hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50', fieldConfig.inputClassName)}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloudIcon className="mb-2 size-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Click or drag and drop a file</span>
            {config?.accept && <span className="mt-1 text-xs text-muted-foreground/80">Accepted types: {config.accept}</span>}
          </Button>
        )}
      </div>
    </FieldWrapper>
  );
}

function getFiles(value: unknown): readonly File[] {
  if (typeof File === 'undefined') {
    return [];
  }

  if (value instanceof File) {
    return [value];
  }

  return Array.isArray(value) ? value.filter((entry): entry is File => entry instanceof File) : [];
}
