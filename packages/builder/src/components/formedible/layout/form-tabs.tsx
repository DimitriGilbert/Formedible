import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormTabItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
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
            {tab.label}
          </Button>
        ))}
      </div>
      {children}
    </div>
  );
}
