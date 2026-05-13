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
    <header className={cn('py-20', className)}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold text-primary">{eyebrow}</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">{title}</h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
    </header>
  );
}
