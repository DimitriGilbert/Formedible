"use client";
import React, { useState, useEffect, useRef } from "react";
import { SimpleFieldConfigurator } from "./simple-field-configurator";

interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
  page?: number;
  group?: string;
  section?: {
    title: string;
    description?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  };
  help?: {
    text?: string;
    tooltip?: string;
    position?: "top" | "bottom" | "left" | "right";
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: any;
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
}

interface IsolatedFieldConfiguratorProps {
  fieldId: string;
  getField: (id: string) => FormField | undefined;
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  availablePages: number[];
}

export const IsolatedFieldConfigurator: React.FC<IsolatedFieldConfiguratorProps> = ({
  fieldId,
  getField,
  onUpdate,
  availablePages,
}) => {
  const [localField, setLocalField] = useState<FormField | undefined>(undefined);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFieldIdRef = useRef<string>();

  // Only update local field when fieldId changes, not when field data changes
  useEffect(() => {
    if (fieldId !== lastFieldIdRef.current) {
      const field = getField(fieldId);
      setLocalField(field);
      lastFieldIdRef.current = fieldId;
    }
  }, [fieldId, getField]);

  const handleLocalUpdate = (fieldId: string, updates: Partial<FormField>) => {
    if (!localField) return;

    // Update local state immediately for responsive UI
    const updatedField = { ...localField, ...updates };
    setLocalField(updatedField);

    // Debounce the parent update to prevent excessive re-renders
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(fieldId, updates);
    }, 300); // 300ms debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  if (!localField) {
    return <div>Field not found</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-6">Configure Field</h3>
      <SimpleFieldConfigurator
        fieldId={fieldId}
        getField={() => localField}
        onUpdate={handleLocalUpdate}
        availablePages={availablePages}
      />
    </div>
  );
};