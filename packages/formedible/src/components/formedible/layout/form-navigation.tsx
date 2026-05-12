import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export interface FormNavigationProps {
  readonly isFirstPage: boolean;
  readonly isLastPage: boolean;
  readonly previousLabel: ReactNode;
  readonly nextLabel: ReactNode;
  readonly submitLabel: ReactNode;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}

export function FormNavigation({ isFirstPage, isLastPage, previousLabel, nextLabel, submitLabel, onPrevious, onNext }: FormNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={onPrevious} disabled={isFirstPage}>
        {previousLabel}
      </Button>
      {isLastPage ? (
        <Button type="submit">{submitLabel}</Button>
      ) : (
        <Button type="button" onClick={onNext}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
