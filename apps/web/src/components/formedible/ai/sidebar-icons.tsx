"use client";

import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  History, 
  Settings, 
  Globe,
  FileText 
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarView = "history" | "settings" | "provider" | "parser";

interface SidebarIconsProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeView: SidebarView | null;
  onViewChange: (view: SidebarView | null) => void;
}

export function SidebarIcons({
  isCollapsed,
  onToggleCollapse,
  activeView,
  onViewChange,
}: SidebarIconsProps) {
  const handleIconClick = (view: SidebarView) => {
    if (activeView === view) {
      // If clicking the same icon, close the sidebar
      onViewChange(null);
    } else {
      // If clicking different icon, switch view
      onViewChange(view);
    }
  };

  return (
    <div className="flex flex-col w-12 bg-muted/20 border-r border-border">
      {/* Collapse/expand button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="h-12 w-12 rounded-none border-b border-border hover:bg-muted/40"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <span className="sr-only">
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </span>
      </Button>

      {/* Icon buttons */}
      <div className="flex flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleIconClick("history")}
          className={cn(
            "h-12 w-12 rounded-none hover:bg-muted/40",
            activeView === "history" && "bg-muted text-foreground"
          )}
        >
          <History className="h-4 w-4" />
          <span className="sr-only">History</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleIconClick("settings")}
          className={cn(
            "h-12 w-12 rounded-none hover:bg-muted/40",
            activeView === "settings" && "bg-muted text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleIconClick("provider")}
          className={cn(
            "h-12 w-12 rounded-none hover:bg-muted/40",
            activeView === "provider" && "bg-muted text-foreground"
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Provider</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleIconClick("parser")}
          className={cn(
            "h-12 w-12 rounded-none hover:bg-muted/40",
            activeView === "parser" && "bg-muted text-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="sr-only">Form Parser Settings</span>
        </Button>
      </div>
    </div>
  );
}