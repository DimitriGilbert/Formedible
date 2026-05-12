'use client';

import { useEffect, useState } from 'react';

import { useFormedible } from '@/hooks/use-formedible';
import { parseAiToFormedible } from '@/lib/formedible/ai-parser';
import type { AiFormParseResult, AiParserConfig } from '@/lib/formedible/ai-types';
import type { FormedibleFormValues, UseFormedibleOptions } from '@/lib/formedible/types';

export interface AiFormRendererProps {
  readonly code: string;
  readonly isStreaming?: boolean;
  readonly onParseComplete?: (result: AiFormParseResult) => void;
  readonly onSubmit?: (formData: FormedibleFormValues) => void | Promise<void>;
  readonly className?: string;
  readonly parserConfig?: AiParserConfig;
}

function EmptyForm({ className, message }: { readonly className?: string; readonly message: string }) {
  return <div className={className}>{message}</div>;
}

function ParsedForm({ className, options }: { readonly className?: string; readonly options: UseFormedibleOptions<FormedibleFormValues> }) {
  const { Form } = useFormedible(options);

  return <Form className={className} />;
}

export function AiFormRenderer({ code, isStreaming, onParseComplete, onSubmit, className, parserConfig }: AiFormRendererProps) {
  const [parseResult, setParseResult] = useState<AiFormParseResult>(() => parseAiToFormedible(code, parserConfig));

  useEffect(() => {
    if (isStreaming) {
      return;
    }

    const nextResult = parseAiToFormedible(code, parserConfig);
    setParseResult(nextResult);
    onParseComplete?.(nextResult);
  }, [code, isStreaming, onParseComplete, parserConfig]);

  if (isStreaming) {
    return <EmptyForm className={className} message="Waiting for the generated form..." />;
  }

  if (!parseResult.success) {
    return <EmptyForm className={className} message={parseResult.error ?? 'Generated form could not be parsed.'} />;
  }

  const options: UseFormedibleOptions<FormedibleFormValues> = {
    ...parseResult.formOptions,
    formOptions: {
      ...parseResult.formOptions.formOptions,
      onSubmit: async ({ value }) => {
        await parseResult.formOptions.formOptions.onSubmit?.({ value });
        await onSubmit?.(value);
      },
    },
  };

  return <ParsedForm className={className} options={options} />;
}

export { parseAiToFormedible } from '@/lib/formedible/ai-parser';
export type { AiFormParseResult, AiParserConfig } from '@/lib/formedible/ai-types';
