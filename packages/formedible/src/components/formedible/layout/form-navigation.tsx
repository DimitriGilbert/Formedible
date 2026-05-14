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
  readonly disabled?: boolean;
  readonly showSubmitButton?: boolean;
}

export function FormNavigation({ isFirstPage, isLastPage, previousLabel, nextLabel, submitLabel, onPrevious, onNext, disabled = false, showSubmitButton = true }: FormNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={onPrevious} disabled={disabled || isFirstPage}>
        {previousLabel}
      </Button>
      {isLastPage ? (
        showSubmitButton ? <Button type="submit" disabled={disabled}>{submitLabel}</Button> : undefined
      ) : (
        <Button type="button" onClick={onNext} disabled={disabled || isLastPage}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
