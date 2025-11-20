"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BaseFieldProps, ObjectFieldProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { NestedFieldRenderer } from "./shared-field-renderer";
import { resolveDynamicText } from "@/lib/formedible/template-interpolation";
import { useFormValues } from "@/hooks/use-form-values";

export const ObjectField: React.FC<ObjectFieldProps> = ({
  fieldApi,
  objectConfig,
  disabled,
  form,
  ...wrapperProps
}) => {
  const [isExpanded, setIsExpanded] = React.useState(
    objectConfig?.defaultExpanded !== false
  );

  // Subscribe to form values for dynamic text resolution
  const { formValues: subscribedValues } = useFormValues(fieldApi);

  // Create a properly typed mockFieldApi that includes the form property
  const createMockFieldApi = (fieldName: string, fieldValue: unknown) => {
    return {
      name: `${fieldApi.name}.${fieldName}`,
      form: fieldApi.form, // Include the form property to fix the bug
      state: {
        ...fieldApi.state,
        value: fieldValue,
        meta: {
          ...fieldApi.state.meta,
          errors: [], // Reset errors for subfield
          isTouched: false, // Reset touched state for subfield
        },
      },
      handleChange: (value: unknown) => {
        const currentValue = fieldApi.state?.value || {};
        fieldApi.handleChange({
          ...currentValue,
          [fieldName]: value,
        });
      },
      handleBlur: fieldApi.handleBlur,
    };
  };

  const renderField = (subFieldConfig: any) => {
    const fieldValue = fieldApi.state?.value?.[subFieldConfig.name] || "";
    const mockFieldApi = createMockFieldApi(
      subFieldConfig.name,
      fieldValue
    ) as unknown as BaseFieldProps["fieldApi"];

    return (
      <div key={subFieldConfig.name}>
        <NestedFieldRenderer
          fieldConfig={subFieldConfig}
          fieldApi={mockFieldApi}
          form={form}
          currentValues={
            (fieldApi.state?.value || {}) as Record<string, unknown>
          }
        />
      </div>
    );
  };

  const getLayoutClasses = () => {
    const layout = objectConfig?.layout || "vertical";
    const columns = objectConfig?.columns || 2;

    switch (layout) {
      case "horizontal":
        return "flex flex-wrap gap-4";
      case "grid":
        return `grid grid-cols-1 md:grid-cols-${columns} gap-4`;
      default:
        return "space-y-4";
    }
  };

  const content = (
    <FieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      <div className="space-y-4">
        {/* Object title and description */}
        {(objectConfig?.title || objectConfig?.description) && (
          <div className="space-y-1">
            {objectConfig?.title && (
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {resolveDynamicText(objectConfig.title, subscribedValues)}
                </h4>
                {objectConfig?.collapsible && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded
                      ? resolveDynamicText(
                          objectConfig?.collapseLabel || "Collapse",
                          subscribedValues
                        )
                      : resolveDynamicText(
                          objectConfig?.expandLabel || "Expand",
                          subscribedValues
                        )}
                  </button>
                )}
              </div>
            )}
            {objectConfig?.description && (
              <p className="text-xs text-muted-foreground">
                {resolveDynamicText(objectConfig.description, subscribedValues)}
              </p>
            )}
          </div>
        )}

        {/* Fields */}
        {(!objectConfig?.collapsible || isExpanded) && (
          <>
            {objectConfig?.title && <div className="border-t my-4" />}
            <div className={getLayoutClasses()}>
              {objectConfig?.fields?.map(renderField)}
            </div>
          </>
        )}

        {/* Show field errors */}
        {fieldApi.state?.meta?.errors &&
          fieldApi.state?.meta?.errors.length > 0 && (
            <div className="text-sm text-destructive">
              {fieldApi.state?.meta?.errors.join(", ")}
            </div>
          )}
      </div>
    </FieldWrapper>
  );

  // Wrap in card if specified
  if (objectConfig?.showCard) {
    return (
      <Card className="w-full">
        {(objectConfig?.title || objectConfig?.description) && (
          <CardHeader className="pb-3">
            {objectConfig?.title && (
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {resolveDynamicText(objectConfig.title, subscribedValues)}
                </CardTitle>
                {objectConfig?.collapsible && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded
                      ? resolveDynamicText(
                          objectConfig?.collapseLabel || "Collapse",
                          subscribedValues
                        )
                      : resolveDynamicText(
                          objectConfig?.expandLabel || "Expand",
                          subscribedValues
                        )}
                  </button>
                )}
              </div>
            )}
            {objectConfig?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {resolveDynamicText(objectConfig.description, subscribedValues)}
              </p>
            )}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          {(!objectConfig?.collapsible || isExpanded) && (
            <>
              <div className={getLayoutClasses()}>
                {objectConfig?.fields?.map(renderField)}
              </div>
            </>
          )}

          {/* Show field errors */}
          {fieldApi.state?.meta?.errors &&
            fieldApi.state?.meta?.errors.length > 0 && (
              <div className="text-sm text-destructive mt-4">
                {fieldApi.state?.meta?.errors.join(", ")}
              </div>
            )}
        </CardContent>
      </Card>
    );
  }

  return content;
};
