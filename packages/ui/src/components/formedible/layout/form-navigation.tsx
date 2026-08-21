import type { ReactNode } from 'react';

import { Button } from '@formedible/ui/components/button';

export interface FormNavigationProps {
  readonly isFirstPage: boolean;
  readonly isLastPage: boolean;
  readonly previousLabel: ReactNode;
  readonly nextLabel: ReactNode;
  readonly submitLabel: ReactNode;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly disabled?: boolean;
  /** Reactive TanStack canSubmit state; the submit button disables while the form cannot submit. */
  readonly canSubmit?: boolean;
  /** Class applied to the navigation buttons (Previous/Next). */
  readonly buttonClassName?: string;
  /** Class applied to the submit button. */
  readonly submitButtonClassName?: string;
  readonly showSubmitButton?: boolean;
}

export function FormNavigation({
  isFirstPage,
  isLastPage,
  previousLabel,
  nextLabel,
  submitLabel,
  onPrevious,
  onNext,
  disabled = false,
  canSubmit = true,
  buttonClassName,
  submitButtonClassName,
  showSubmitButton = true,
}: FormNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={onPrevious} disabled={disabled || isFirstPage} className={buttonClassName}>
        {previousLabel}
      </Button>
      {isLastPage ? (
        showSubmitButton ? <Button type="submit" disabled={disabled || !canSubmit} className={submitButtonClassName}>{submitLabel}</Button> : undefined
      ) : (
        <Button type="button" onClick={onNext} disabled={disabled || isLastPage} className={buttonClassName}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
