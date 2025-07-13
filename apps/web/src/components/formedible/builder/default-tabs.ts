import { Settings, Eye, Code } from "lucide-react";
import { BuilderTabContent } from "./tabs/BuilderTabContent";
import { PreviewTabContent } from "./tabs/PreviewTabContent";
import { CodeTabContent } from "./tabs/CodeTabContent";
import type { TabConfig } from "./types";

export const builderTab: TabConfig = {
  id: "builder",
  label: "Builder",
  icon: Settings,
  component: BuilderTabContent,
  enabled: true,
  order: 1,
};

export const previewTab: TabConfig = {
  id: "preview",
  label: "Preview",
  icon: Eye,
  component: PreviewTabContent,
  enabled: true,
  order: 2,
};

export const codeTab: TabConfig = {
  id: "code",
  label: "Code",
  icon: Code,
  component: CodeTabContent,
  enabled: true,
  order: 3,
};

export const defaultTabs: TabConfig[] = [
  builderTab,
  previewTab,
  codeTab,
];

// Helper functions for common tab configurations
export const getBuilderOnlyTabs = (): TabConfig[] => [builderTab];

export const getBuilderAndPreviewTabs = (): TabConfig[] => [builderTab, previewTab];

export const getBuilderAndCodeTabs = (): TabConfig[] => [builderTab, codeTab];

export const getPreviewAndCodeTabs = (): TabConfig[] => [previewTab, codeTab];

// Factory function to create custom tab orders
export const createTabsWithOrder = (tabIds: string[]): TabConfig[] => {
  const tabMap = new Map([
    ["builder", builderTab],
    ["preview", previewTab],
    ["code", codeTab],
  ]);

  return tabIds
    .map(id => tabMap.get(id))
    .filter((tab): tab is TabConfig => tab !== undefined)
    .map((tab, index) => ({ ...tab, order: index + 1 }));
};

// Factory function to disable specific tabs
export const createTabsWithDisabled = (disabledIds: string[]): TabConfig[] => {
  return defaultTabs.map(tab => ({
    ...tab,
    enabled: !disabledIds.includes(tab.id),
  }));
};