import { useEffect, useRef } from 'react';

import type { FormedibleAnalyticsConfig, FormedibleFormValues } from '@/lib/formedible/types';

export interface FormAnalyticsPageValidationState {
  readonly hasErrors: boolean;
  readonly completionPercentage: number;
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

export function getFieldBlurTime(focusedAt: number | undefined, timestamp: number) {
  return focusedAt === undefined ? 0 : timestamp - focusedAt;
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

  function trackFieldBlur(fieldName: string) {
    const timestamp = Date.now();
    const timeSpent = getFieldBlurTime(focusedAtRef.current[fieldName], timestamp);

    analyticsRef.current?.onFieldBlur?.(fieldName, timeSpent);
    delete focusedAtRef.current[fieldName];
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

  return { trackFieldFocus, trackFieldBlur, trackFormComplete, trackPageChange };
}
