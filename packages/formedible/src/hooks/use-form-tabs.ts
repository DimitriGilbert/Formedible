import { useEffect, useMemo, useRef, useState } from 'react';

import type { FormAnalyticsTabTracker, FormAnalyticsTabValidationState } from '@/hooks/use-form-analytics';
import { isTabVisible } from '@/lib/formedible/field-visibility';
import type { FormedibleFormValues, FormedibleTabConfig, NormalizedFieldConfig } from '@/lib/formedible/types';

export interface NormalizedFormTab<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly id: string;
  readonly label: FormedibleTabConfig<TFormValues>['label'];
  readonly description?: FormedibleTabConfig<TFormValues>['description'];
  readonly conditional?: FormedibleTabConfig<TFormValues>['conditional'];
}

export interface UseFormTabsOptions<TFormValues extends FormedibleFormValues> {
  readonly fields: readonly NormalizedFieldConfig<TFormValues>[];
  readonly tabs?: readonly (string | FormedibleTabConfig<TFormValues>)[];
  readonly values: TFormValues;
  /** Legacy tab analytics callbacks fired on tab switch and first tab visit. */
  readonly analytics?: FormAnalyticsTabTracker;
  /** Resolves the legacy completion state reported for the tab being left. */
  readonly getTabValidationState?: (tabId: string) => FormAnalyticsTabValidationState;
}

export function normalizeTabs<TFormValues extends FormedibleFormValues>(
  tabs: readonly (string | FormedibleTabConfig<TFormValues>)[] | undefined,
  fields: readonly NormalizedFieldConfig<TFormValues>[],
): NormalizedFormTab<TFormValues>[] {
  if (tabs && tabs.length > 0) {
    return tabs.map((tab) => (typeof tab === 'string' ? { id: tab, label: tab } : tab));
  }

  return Array.from(new Set(fields.map((field) => field.tab).filter((tab): tab is string => tab !== undefined))).map((tab) => ({ id: tab, label: tab }));
}

export function useFormTabs<TFormValues extends FormedibleFormValues>({
  fields,
  tabs,
  values,
  analytics,
  getTabValidationState,
}: UseFormTabsOptions<TFormValues>) {
  const normalizedTabs = useMemo(() => normalizeTabs(tabs, fields), [fields, tabs]);
  const visibleTabs = useMemo(
    () => normalizedTabs.filter((tab) => isTabVisible(tab, fields, values)),
    [fields, normalizedTabs, values],
  );
  const [activeTab, setActiveTab] = useState(() => visibleTabs.at(0)?.id ?? normalizedTabs.at(0)?.id ?? 'default');
  const tabStartTimesRef = useRef<Record<string, number>>({});
  const visitedTabsRef = useRef<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? activeTab);
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (activeTab === '' || tabStartTimesRef.current[activeTab] !== undefined) {
      return;
    }

    const timestamp = Date.now();

    tabStartTimesRef.current[activeTab] = timestamp;

    if (!visitedTabsRef.current.has(activeTab)) {
      visitedTabsRef.current = new Set([...visitedTabsRef.current, activeTab]);
      analytics?.trackTabFirstVisit(activeTab, timestamp);
    }
  }, [activeTab, analytics]);

  function changeTab(nextTabId: string) {
    const timestamp = Date.now();

    if (activeTab !== '' && activeTab !== nextTabId) {
      const fromTabStartTime = tabStartTimesRef.current[activeTab];

      analytics?.trackTabChange(
        activeTab,
        nextTabId,
        fromTabStartTime === undefined ? 0 : timestamp - fromTabStartTime,
        getTabValidationState?.(activeTab),
      );
    }

    if (nextTabId !== '' && tabStartTimesRef.current[nextTabId] === undefined) {
      tabStartTimesRef.current[nextTabId] = timestamp;
    }

    if (nextTabId !== '' && !visitedTabsRef.current.has(nextTabId)) {
      visitedTabsRef.current = new Set([...visitedTabsRef.current, nextTabId]);
      analytics?.trackTabFirstVisit(nextTabId, timestamp);
    }

    setActiveTab(nextTabId);
  }

  return { activeTab, setActiveTab, changeTab, visibleTabs };
}
