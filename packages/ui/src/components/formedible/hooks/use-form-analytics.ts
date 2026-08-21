import { useEffect, useRef } from 'react';

import type { FormedibleAnalyticsConfig, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

export interface FormAnalyticsPageValidationState {
  readonly hasErrors: boolean;
  readonly completionPercentage: number;
}

export interface FormAnalyticsTabValidationState {
  readonly hasErrors: boolean;
  readonly completionPercentage: number;
}

/** Tab analytics surface consumed by `useFormTabs` to fire legacy tab callbacks. */
export interface FormAnalyticsTabTracker {
  readonly trackTabChange: (fromTab: string, toTab: string, timeSpentMs: number, tabValidationState?: FormAnalyticsTabValidationState) => void;
  readonly trackTabFirstVisit: (tabId: string, timestamp: number) => void;
}

export interface FormAnalyticsAbandonContext {
  readonly completionPercentage: number;
  readonly currentPage?: number;
  readonly currentTab?: string;
  readonly lastActiveField?: string;
}

export interface FormAnalyticsRuntimeOptions {
  readonly getPageValidationState?: (pageNumber: number) => FormAnalyticsPageValidationState;
  readonly getAbandonContext?: () => FormAnalyticsAbandonContext;
}

export interface FormAnalyticsTrackerOptions {
  readonly now?: () => number;
}

export function getFieldBlurTime(focusedAt: number | undefined, timestamp: number) {
  return focusedAt === undefined ? 0 : timestamp - focusedAt;
}

export function createFormAnalyticsTracker<TFormValues extends FormedibleFormValues>(
  analytics: FormedibleAnalyticsConfig<TFormValues> | undefined,
  options: FormAnalyticsTrackerOptions = {},
) {
  const now = options.now ?? Date.now;

  return {
    trackFieldChange(fieldName: Extract<keyof TFormValues, string> | string, value: unknown) {
      analytics?.onFieldChange?.(fieldName, value, now());
    },
    trackFieldComplete(fieldName: Extract<keyof TFormValues, string> | string, isValid: boolean, timeSpent: number) {
      analytics?.onFieldComplete?.(fieldName, isValid, timeSpent);
    },
    trackFieldError(fieldName: Extract<keyof TFormValues, string> | string, errors: readonly string[]) {
      analytics?.onFieldError?.(fieldName, errors, now());
    },
    trackFormReset(reason?: string) {
      analytics?.onFormReset?.(now(), reason);
    },
  };
}

export function useFormAnalytics<TFormValues extends FormedibleFormValues>(
  analytics: FormedibleAnalyticsConfig<TFormValues> | undefined,
  options: FormAnalyticsRuntimeOptions = {},
) {
  const analyticsRef = useRef(analytics);
  const optionsRef = useRef(options);
  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);
  const focusedAtRef = useRef<Record<string, number>>({});
  const lastActiveFieldRef = useRef<string | undefined>(undefined);

  analyticsRef.current = analytics;
  optionsRef.current = options;

  useEffect(() => {
    analyticsRef.current?.onFormStart?.(startedAtRef.current);

    return () => {
      if (!completedRef.current) {
        const abandonContext = optionsRef.current.getAbandonContext?.() ?? { completionPercentage: 0 };
        const callbackContext: { currentPage?: number; currentTab?: string; lastActiveField?: string } = {};

        if (abandonContext.currentPage !== undefined) {
          callbackContext.currentPage = abandonContext.currentPage;
        }

        if (abandonContext.currentTab !== undefined) {
          callbackContext.currentTab = abandonContext.currentTab;
        }

        if ((abandonContext.lastActiveField ?? lastActiveFieldRef.current) !== undefined) {
          callbackContext.lastActiveField = abandonContext.lastActiveField ?? lastActiveFieldRef.current;
        }

        analyticsRef.current?.onFormAbandon?.(abandonContext.completionPercentage, callbackContext);
      }
    };
  }, []);

  function trackFieldFocus(fieldName: string) {
    const timestamp = Date.now();

    lastActiveFieldRef.current = fieldName;
    focusedAtRef.current[fieldName] = timestamp;
    analyticsRef.current?.onFieldFocus?.(fieldName, timestamp);
  }

  function trackFieldBlur(fieldName: string, options: { readonly isValid: boolean; readonly errors?: readonly string[] } = { isValid: true }) {
    const timestamp = Date.now();
    const timeSpent = getFieldBlurTime(focusedAtRef.current[fieldName], timestamp);

    analyticsRef.current?.onFieldBlur?.(fieldName, timeSpent);
    if (options.errors && options.errors.length > 0) {
      analyticsRef.current?.onFieldError?.(fieldName, options.errors, timestamp);
    }
    analyticsRef.current?.onFieldComplete?.(fieldName, options.isValid, timeSpent);
    delete focusedAtRef.current[fieldName];
  }

  function trackFieldChange(fieldName: string, value: unknown) {
    analyticsRef.current?.onFieldChange?.(fieldName, value, Date.now());
  }

  function trackFormComplete(formData: TFormValues) {
    const timeSpent = Date.now() - startedAtRef.current;

    completedRef.current = true;
    analyticsRef.current?.onFormComplete?.(timeSpent, formData);
  }

  function trackPageChange(context: { readonly fromPage: number; readonly toPage: number; readonly timeSpent: number }) {
    analyticsRef.current?.onPageChange?.(
      context.fromPage,
      context.toPage,
      context.timeSpent,
      optionsRef.current.getPageValidationState?.(context.fromPage),
    );
  }

  function trackTabChange(fromTab: string, toTab: string, timeSpentMs: number, tabValidationState?: FormAnalyticsTabValidationState) {
    analyticsRef.current?.onTabChange?.(fromTab, toTab, timeSpentMs, tabValidationState);
  }

  function trackTabFirstVisit(tabId: string, timestamp: number) {
    analyticsRef.current?.onTabFirstVisit?.(tabId, timestamp);
  }

  function trackSubmissionPerformance(processingTimeMs: number) {
    // Legacy parity: submissionTime is the total time since form start and
    // validationTime was never updated on the legacy runtime (always 0).
    analyticsRef.current?.onSubmissionPerformance?.(Date.now() - startedAtRef.current, 0, processingTimeMs);
  }

  function trackFormReset(reason?: string) {
    analyticsRef.current?.onFormReset?.(Date.now(), reason);
  }

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldChange,
    trackFormComplete,
    trackFormReset,
    trackPageChange,
    trackTabChange,
    trackTabFirstVisit,
    trackSubmissionPerformance,
  };
}
