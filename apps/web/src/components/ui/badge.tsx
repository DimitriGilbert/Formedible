import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = ComponentProps<'span'> & {
  readonly variant?: 'default' | 'secondary';
};

const variantClasses = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
} as const;

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', variantClasses[variant], className)} {...props} />;
}

export { Badge };
