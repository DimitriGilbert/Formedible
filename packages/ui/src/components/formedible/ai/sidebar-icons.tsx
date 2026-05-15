'use client';

import { Bug, ChevronLeft, ChevronRight, FileText, Globe, History, SlidersHorizontal } from 'lucide-react';

import { Button } from '@formedible/ui/components/button';
import { cn } from '@formedible/ui/lib/utils';

export type SidebarView = 'history' | 'provider' | 'model' | 'parser' | 'debug';

export interface SidebarIconsProps {
  readonly isCollapsed: boolean;
  readonly activeView: SidebarView | null;
  readonly onToggleCollapse: () => void;
  readonly onViewChange: (view: SidebarView | null) => void;
}

const sidebarItems = [
  { view: 'history', label: 'Conversation history', icon: History },
  { view: 'provider', label: 'Provider settings', icon: Globe },
  { view: 'model', label: 'Model settings', icon: SlidersHorizontal },
  { view: 'parser', label: 'Parser settings', icon: FileText },
  { view: 'debug', label: 'Raw and debug output', icon: Bug },
] as const;

export function SidebarIcons({ isCollapsed, activeView, onToggleCollapse, onViewChange }: SidebarIconsProps) {
  function handleViewClick(view: SidebarView): void {
    onViewChange(activeView === view ? null : view);
  }

  return (
    <nav className="flex w-12 shrink-0 flex-col border-r bg-muted/20" aria-label="AI builder sidebar">
      <Button type="button" variant="ghost" size="icon" onClick={onToggleCollapse} className="h-12 w-12 rounded-none border-b" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {isCollapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
      </Button>
      <div className="flex flex-col">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          return (
            <Button
              key={item.view}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleViewClick(item.view)}
              className={cn('h-12 w-12 rounded-none hover:bg-muted/50', isActive && 'bg-muted text-foreground')}
              aria-pressed={isActive}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
