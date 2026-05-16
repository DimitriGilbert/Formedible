import type { ReactNode } from 'react';

import { Badge } from '@formedible/ui/components/badge';
import { Button } from '@formedible/ui/components/button';
import { cn } from '@formedible/ui/lib/utils';

export interface FormTabItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly errorCount?: number;
}

export interface FormTabsProps {
  readonly tabs: readonly FormTabItem[];
  readonly activeTab: string;
  readonly onTabChange: (tabId: string) => void;
  readonly children: ReactNode;
}

export function FormTabs({ tabs, activeTab, onTabChange, children }: FormTabsProps) {
  return (
    <div className="space-y-4" data-tabs-root="true">
      <div className="grid gap-2" role="tablist" style={{ gridTemplateColumns: `repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            variant={tab.id === activeTab ? 'default' : 'outline'}
            className={cn('justify-start')}
            role="tab"
            aria-selected={tab.id === activeTab}
            data-tabs-trigger="true"
            onClick={() => onTabChange(tab.id)}
          >
            <span className="truncate">{tab.label}</span>
            {tab.errorCount && tab.errorCount > 0 ? (
              <Badge variant="secondary" className="ml-2" aria-label={`${tab.errorCount} invalid ${tab.errorCount === 1 ? 'field' : 'fields'}`}>
                {tab.errorCount}
              </Badge>
            ) : undefined}
          </Button>
        ))}
      </div>
      {children}
    </div>
  );
}
