import { cn } from '@formedible/ui/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1400px]', className)}>
      {children}
    </div>
  );
}
