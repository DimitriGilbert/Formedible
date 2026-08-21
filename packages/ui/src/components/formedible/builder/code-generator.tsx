'use client';

import { useMemo } from 'react';

import { generateFormCode } from '@formedible/ui/components/formedible/lib/code-generation';
import { cn } from '@formedible/ui/lib/utils';
import type { FormField, FormMetadata } from '@formedible/ui/components/formedible/lib/builder-types';

export interface CodeGeneratorProps {
  readonly metadata: FormMetadata;
  readonly fields: readonly FormField[];
  readonly className?: string;
}

export function CodeGenerator({ metadata, fields, className }: CodeGeneratorProps) {
  const generatedCode = useMemo(() => {
    try {
      return generateFormCode({
        title: metadata.title,
        description: metadata.description,
        fields,
        pages: metadata.pages,
        tabs: metadata.tabs,
        settings: metadata.settings,
      }).fullCode;
    } catch (error) {
      console.error('Failed to generate form code:', error);
      return error instanceof Error ? `// ${error.message}` : '// Failed to generate form code';
    }
  }, [metadata, fields]);

  return (
    <div className={cn('space-y-3', className)} data-builder-part="code-generator">
      <div>
        <h2 className="text-lg font-semibold">Generated Code</h2>
        <p className="text-sm text-muted-foreground">Copy this shadcn-installed Formedible source into your app.</p>
      </div>
      <pre className="max-h-[520px] overflow-auto rounded-lg border bg-muted p-4 text-sm">
        <code>{generatedCode}</code>
      </pre>
    </div>
  );
}
