"use client";
import React from "react";
import { CodeGenerator } from "../code-generator";
import type { TabContentProps } from "../types";

export const CodeTabContent: React.FC<TabContentProps> = ({
  getFormMetadata,
  getAllFields,
}) => {
  // Get current form metadata and fields when rendering
  const formMetadata = getFormMetadata();
  const fields = getAllFields();

  return (
    <div className="h-full m-0 p-8 overflow-y-auto min-h-0">
      <div className="max-w-6xl mx-auto">
        <CodeGenerator
          formTitle={formMetadata.title}
          formDescription={formMetadata.description}
          fields={fields}
          pages={formMetadata.pages}
          settings={formMetadata.settings}
        />
      </div>
    </div>
  );
};