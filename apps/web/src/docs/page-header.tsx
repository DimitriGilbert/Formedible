import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
  readonly className?: string;
};

export function PageHeader({ eyebrow, title, description, children, className }: PageHeaderProps) {
  return (
    <header className={cn('relative isolate overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:p-10', className)}>
      <div className="absolute right-[-8rem] top-[-10rem] size-80 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-[-7rem] left-1/3 size-64 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="max-w-4xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/90">{eyebrow}</p>
          <h1 className="max-w-5xl text-balance text-5xl font-black tracking-[-0.07em] text-foreground sm:text-6xl lg:text-7xl">{title}</h1>
          <p className="max-w-3xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">{description}</p>
        </div>
        {children ? <div className="relative">{children}</div> : null}
      </div>
    </header>
  );
}
