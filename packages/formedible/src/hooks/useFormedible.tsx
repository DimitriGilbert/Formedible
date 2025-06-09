"use client";
import React from "react";
import { useForm } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/fields/TextField";
import { TextareaField } from "@/components/fields/TextareaField";
import { SelectField } from "@/components/fields/SelectField";
import { CheckboxField } from "@/components/fields/CheckboxField";
import { SwitchField } from "@/components/fields/SwitchField";
import { NumberField } from "@/components/fields/NumberField";
import { DateField } from "@/components/fields/DateField";

interface FormProps {
  className?: string;
  children?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
}

interface FieldConfig {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  description?: string;
  options?: string[];
}

interface UseFormedibleOptions<TFormValues> {
  fields?: FieldConfig[];
  submitLabel?: string;
  formClassName?: string;
  fieldClassName?: string;
  formOptions: any; // Use any to avoid complex TanStack Form typing
}

export function useFormedible<TFormValues extends Record<string, any>>(
  options: UseFormedibleOptions<TFormValues>
) {
  const {
    fields = [],
    submitLabel = "Submit",
    formClassName,
    fieldClassName,
    formOptions: tsFormOptions,
  } = options;

  const form = useForm(tsFormOptions);

  const Form: React.FC<FormProps> = ({ className, children, onSubmit }) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onSubmit) {
        onSubmit(e);
      } else {
        form.handleSubmit();
      }
    };

    const formClass = cn("space-y-4", formClassName, className);

    const renderField = (fieldConfig: FieldConfig) => {
      const { name, type, label, placeholder, description, options } =
        fieldConfig;

      return (
        <form.Field key={name} name={name as string}>
          {(fieldApi) => {
            const props = {
              fieldApi,
              label,
              placeholder,
              description,
              wrapperClassName: fieldClassName,
            };

            switch (type) {
              case "text":
              case "email":
              case "password":
              case "url":
                return <TextField {...props} type={type} />;
              case "textarea":
                return <TextareaField {...props} />;
              case "select":
                return <SelectField {...props} options={options || []} />;
              case "checkbox":
                return <CheckboxField {...props} />;
              case "switch":
                return <SwitchField {...props} />;
              case "number":
                return <NumberField {...props} />;
              case "date":
                return <DateField {...props} />;
              default:
                return <TextField {...props} />;
            }
          }}
        </form.Field>
      );
    };

    return (
      <form onSubmit={handleSubmit} className={formClass}>
        {children || (
          <>
            {fields.map(renderField)}
            <form.Subscribe
              selector={(state: any) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }: any) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : submitLabel}
                </button>
              )}
            </form.Subscribe>
          </>
        )}
      </form>
    );
  };

  return {
    form,
    Form,
  };
}
