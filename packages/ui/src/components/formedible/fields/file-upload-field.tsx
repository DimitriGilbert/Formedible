import { PaperclipIcon, UploadCloudIcon, XIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFileRejection, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

const rejectionReasonLabels = {
  maxSize: 'exceeds the maximum file size',
  maxFiles: 'exceeds the maximum number of files',
} as const;

export function FileUploadField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.fileConfig;
  const accept = fieldConfig.accept ?? config?.accept;
  const multiple = fieldConfig.multiple ?? config?.multiple ?? false;
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejections, setRejections] = useState<readonly FormedibleFileRejection[]>([]);
  const files = getFiles(field.value);

  function setFiles(nextFiles: readonly File[]) {
    const maxFiles = config?.maxFiles;
    const maxSize = config?.maxSize;
    const acceptedFiles: File[] = [];
    const nextRejections: FormedibleFileRejection[] = [];

    nextFiles.forEach((file, index) => {
      if (maxFiles !== undefined && index >= maxFiles) {
        nextRejections.push({ file, reason: 'maxFiles' });
        return;
      }

      if (maxSize !== undefined && file.size > maxSize) {
        nextRejections.push({ file, reason: 'maxSize' });
        return;
      }

      acceptedFiles.push(file);
    });

    setRejections(nextRejections);
    if (nextRejections.length > 0) {
      config?.onFilesRejected?.(nextRejections);
    }

    field.onChange(multiple ? acceptedFiles : acceptedFiles[0] ?? null);
    config?.onFilesChange?.(acceptedFiles);
    field.onBlur();
  }

  function removeFile(file: File) {
    const nextFiles = files.filter((entry) => entry !== file);
    field.onChange(multiple ? nextFiles : null);
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
          accept={accept}
          multiple={multiple}
          disabled={fieldConfig.disabled}
          className="hidden"
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5">
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
            {accept && <span className="mt-1 text-xs text-muted-foreground/80">Accepted types: {accept}</span>}
          </Button>
        )}
        {rejections.length > 0 && (
          <div role="alert" data-slot="file-rejections" className="space-y-1 text-sm text-destructive">
            {rejections.map((rejection, index) => (
              <div key={index}>
                {rejection.file.name} was not uploaded ({rejectionReasonLabels[rejection.reason]}).
              </div>
            ))}
          </div>
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
