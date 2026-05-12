import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface FormProgressProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly value: number;
  readonly showSteps?: boolean;
  readonly showPercentage?: boolean;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
}

export function FormProgress({ currentPage, totalPages, value, showSteps, showPercentage, title, description }: FormProgressProps) {
  return (
    <div className="space-y-2">
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : undefined}
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : undefined}
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        {showSteps ? <span>Step {currentPage} of {totalPages}</span> : <span />}
        {showPercentage ? <span>{Math.round(value)}%</span> : undefined}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
        <div className={cn('h-full rounded-full bg-primary transition-all')} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
