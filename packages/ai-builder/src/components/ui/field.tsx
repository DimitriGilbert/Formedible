import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="field" className={cn('grid gap-2', className)} {...props} />;
}

function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return <label data-slot="field-label" className={cn('text-sm font-medium leading-none', className)} {...props} />;
}

function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="field-description" className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function FieldError({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="field-error" className={cn('text-sm font-medium text-destructive', className)} {...props} />;
}

export { Field, FieldDescription, FieldError, FieldLabel };
