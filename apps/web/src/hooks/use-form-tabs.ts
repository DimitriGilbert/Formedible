import { useEffect, useMemo, useState } from 'react';

import { conditionMatches } from '@/hooks/use-multi-page';
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

export function useFormTabs<TFormValues extends FormedibleFormValues>({ fields, tabs, values }: UseFormTabsOptions<TFormValues>) {
  const normalizedTabs = useMemo(() => normalizeTabs(tabs, fields), [fields, tabs]);
  const visibleTabs = useMemo(
    () => normalizedTabs.filter((tab) => conditionMatches(tab.conditional, values) && fields.some((field) => field.tab === tab.id && conditionMatches(field.conditional, values))),
    [fields, normalizedTabs, values],
  );
  const [activeTab, setActiveTab] = useState(() => visibleTabs.at(0)?.id ?? normalizedTabs.at(0)?.id ?? 'default');

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? activeTab);
    }
  }, [activeTab, visibleTabs]);

  return { activeTab, setActiveTab, visibleTabs };
}
