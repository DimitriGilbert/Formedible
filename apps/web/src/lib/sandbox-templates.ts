/**
 * Formedible Sandbox Templates for AI Builder
 * 
 * This module provides comprehensive sandbox templates that replicate real Formedible functionality
 * for the Sandpack live preview environment. Templates support all Formedible features including
 * multi-page forms, conditional logic, validation, and various field types.
 */

import type { SandboxFiles } from "./sandbox-code-injector";

/**
 * Dependencies for Formedible sandbox environment
 */
export const FORMEDIBLE_SANDBOX_DEPENDENCIES = {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "@tanstack/react-form": "^1.19.2",
  "lucide-react": "^0.263.1",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "zod": "^3.22.0",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-select": "^2.2.5",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-radio-group": "^1.3.7",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-tabs": "^1.1.12",
  "class-variance-authority": "^0.7.1",
  "sonner": "^2.0.7"
};

/**
 * Base App.tsx template for Formedible sandbox
 */
export const FORMEDIBLE_APP_TEMPLATE = `import React from 'react';
import { createRoot } from 'react-dom/client';
import FormComponent from './FormComponent';
import { Toaster } from 'sonner';
import './styles.css';

interface FormData {
  [key: string]: unknown;
}

function App() {
  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    
    // Show success notification
    if (typeof window !== 'undefined' && window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'FORM_SUBMIT',
        data: data,
        timestamp: Date.now()
      }, '*');
    }
  };

  const handleFormError = (error: Error) => {
    console.error('Form error:', error);
    
    // Notify parent component of error
    if (typeof window !== 'undefined' && window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'FORM_ERROR',
        error: error.message,
        timestamp: Date.now()
      }, '*');
    }
  };

  const handleFormChange = (data: FormData) => {
    console.log('Form changed:', data);
    
    // Optional: notify parent of form changes for real-time preview
    if (typeof window !== 'undefined' && window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'FORM_CHANGE',
        data: data,
        timestamp: Date.now()
      }, '*');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Form Preview</h1>
            <p className="text-gray-600 mt-1">Generated with Formedible AI Builder</p>
          </div>
          <div className="p-6">
            <FormComponent 
              onSubmit={handleFormSubmit} 
              onError={handleFormError}
              onChange={handleFormChange}
            />
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
}`;

/**
 * useFormedible hook implementation for sandbox environment
 */
export const USE_FORMEDIBLE_HOOK_TEMPLATE = `import React, { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFormApi, AnyFieldApi } from "@tanstack/react-form";
import { cn } from "./utils";
import type {
  FormedibleFormApi,
  FieldComponentProps,
  BaseFieldProps,
  FieldConfig,
  FormProps,
  UseFormedibleOptions,
} from "./types";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";
import { TextField } from "./components/fields/text-field";
import { TextareaField } from "./components/fields/textarea-field";
import { SelectField } from "./components/fields/select-field";
import { CheckboxField } from "./components/fields/checkbox-field";
import { NumberField } from "./components/fields/number-field";
import { RadioField } from "./components/fields/radio-field";

// Field components registry
const defaultFieldComponents: Record<string, React.ComponentType<any>> = {
  text: TextField,
  email: TextField,
  password: TextField,
  url: TextField,
  textarea: TextareaField,
  select: SelectField,
  checkbox: CheckboxField,
  number: NumberField,
  radio: RadioField,
};

const DefaultProgressComponent: React.FC<{
  value: number;
  currentPage: number;
  totalPages: number;
  className?: string;
}> = ({ value, currentPage, totalPages, className }) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex justify-between text-sm text-gray-600">
      <span>Step {currentPage} of {totalPages}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

export function useFormedible<TFormValues extends Record<string, unknown>>(
  options: UseFormedibleOptions<TFormValues>
) {
  const {
    fields = [],
    submitLabel = "Submit",
    nextLabel = "Next",
    previousLabel = "Previous",
    formClassName,
    fieldClassName,
    labelClassName,
    buttonClassName,
    submitButtonClassName,
    pages,
    progress,
    defaultComponents,
    formOptions,
    onPageChange,
    disabled,
    loading,
    showSubmitButton = true,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const fieldComponents = { ...defaultFieldComponents, ...defaultComponents };

  // Group fields by pages
  const fieldsByPage = useMemo(() => {
    const grouped: { [page: number]: FieldConfig[] } = {};
    fields.forEach((field) => {
      const page = field.page || 1;
      if (!grouped[page]) grouped[page] = [];
      grouped[page].push(field);
    });
    return grouped;
  }, [fields]);

  const totalPages = Math.max(...Object.keys(fieldsByPage).map(Number), 1);
  const hasPages = totalPages > 1;
  const progressValue = hasPages ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100;

  const form = useForm(formOptions || {});

  const getCurrentPageFields = () => {
    return fieldsByPage[currentPage] || [];
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage, "next");
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage, "previous");
    }
  };

  const isLastPage = currentPage === totalPages;
  const isFirstPage = currentPage === 1;

  const renderField = React.useCallback((fieldConfig: FieldConfig) => {
    const { name, type, label, placeholder, options, validation } = fieldConfig;

    return (
      <form.Field
        key={name}
        name={name as keyof TFormValues & string}
        validators={
          validation
            ? {
                onChange: ({ value }) => {
                  const result = validation.safeParse(value);
                  return result.success
                    ? undefined
                    : result.error.issues[0]?.message || "Invalid value";
                },
              }
            : undefined
        }
      >
        {(field) => {
          const FieldComponent = fieldComponents[type] || TextField;
          const baseProps = {
            fieldApi: field as unknown as AnyFieldApi,
            label,
            placeholder,
            wrapperClassName: fieldClassName,
            labelClassName,
            disabled: disabled || loading || field.form.state.isSubmitting,
          };

          let props: FieldComponentProps = { ...baseProps };

          if (type === "select" && options) {
            const normalizedOptions = options.map((opt) =>
              typeof opt === "string" ? { value: opt, label: opt } : opt
            );
            props = { ...props, options: normalizedOptions };
          } else if (type === "radio" && options) {
            const normalizedOptions = options.map((opt) =>
              typeof opt === "string" ? { value: opt, label: opt } : opt
            );
            props = { ...props, options: normalizedOptions };
          }

          return <FieldComponent {...props} />;
        }}
      </form.Field>
    );
  }, [fieldComponents, fieldClassName, labelClassName, disabled, loading]);

  const Form: React.FC<FormProps> = ({ className, children, onSubmit, ...formProps }) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (onSubmit) {
        onSubmit(e);
      } else if (isLastPage) {
        form.handleSubmit();
      } else {
        goToNextPage();
      }
    };

    const formClass = cn("space-y-6", formClassName, className);
    const currentFields = getCurrentPageFields();

    const renderProgress = () => {
      if (!hasPages || !progress) return null;
      const ProgressComponent = progress.component || DefaultProgressComponent;
      return (
        <ProgressComponent
          value={progressValue}
          currentPage={currentPage}
          totalPages={totalPages}
          className={progress.className}
        />
      );
    };

    const renderNavigation = () => {
      if (!showSubmitButton) return null;
      
      if (!hasPages) {
        return (
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {(state) => (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!state.canSubmit || state.isSubmitting || disabled || loading}
                  className={cn("px-8", submitButtonClassName)}
                >
                  {loading ? "Loading..." : state.isSubmitting ? "Submitting..." : submitLabel}
                </Button>
              </div>
            )}
          </form.Subscribe>
        );
      }

      return (
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {(state) => (
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousPage}
                disabled={isFirstPage || disabled || loading}
                className={cn(isFirstPage ? "invisible" : "", buttonClassName)}
              >
                {previousLabel}
              </Button>
              <Button
                type="submit"
                disabled={(!state.canSubmit || state.isSubmitting || disabled || loading) && isLastPage}
                className={cn("px-8", isLastPage ? submitButtonClassName : buttonClassName)}
              >
                {loading && isLastPage
                  ? "Loading..."
                  : state.isSubmitting && isLastPage
                  ? "Submitting..."
                  : isLastPage
                  ? submitLabel
                  : nextLabel}
              </Button>
            </div>
          )}
        </form.Subscribe>
      );
    };

    return (
      <form onSubmit={handleSubmit} className={formClass} {...formProps}>
        {children || (
          <>
            {renderProgress()}
            <div className="space-y-4">
              {currentFields.map((field) => renderField(field))}
            </div>
            {renderNavigation()}
          </>
        )}
      </form>
    );
  };

  return {
    form,
    Form,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    isFirstPage,
    isLastPage,
    progressValue,
  };
}`;

/**
 * Basic types file for sandbox environment
 */
export const FORMEDIBLE_TYPES_TEMPLATE = `import React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { FormApi } from "@tanstack/form-core";
import { z } from "zod";

export type FormedibleFormApi<TFormData = Record<string, unknown>> = FormApi<
  TFormData,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>;

export interface BaseFieldProps {
  fieldApi: AnyFieldApi;
  label?: string;
  placeholder?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export interface FieldComponentProps extends BaseFieldProps {
  options?: Array<{ value: string; label: string }> | string[];
  [key: string]: unknown;
}

export interface FieldConfig {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: string[] | Array<{ value: string; label: string }>;
  validation?: z.ZodSchema<unknown>;
  page?: number;
  [key: string]: unknown;
}

export interface FormProps {
  className?: string;
  children?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  [key: string]: unknown;
}

export interface UseFormedibleOptions<TFormValues> {
  fields?: FieldConfig[];
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  formClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  buttonClassName?: string;
  submitButtonClassName?: string;
  pages?: Array<{ page: number; title?: string; description?: string }>;
  progress?: {
    component?: React.ComponentType<any>;
    className?: string;
  };
  defaultComponents?: {
    [key: string]: React.ComponentType<FieldComponentProps>;
  };
  formOptions?: Partial<{
    defaultValues: TFormValues;
    onSubmit: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => unknown | Promise<unknown>;
  }>;
  onPageChange?: (page: number, direction: "next" | "previous") => void;
  disabled?: boolean;
  loading?: boolean;
  showSubmitButton?: boolean;
}`;

/**
 * Utility functions for sandbox environment
 */
export const FORMEDIBLE_UTILS_TEMPLATE = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;

/**
 * UI Components - Button
 */
export const BUTTON_COMPONENT_TEMPLATE = `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`;

/**
 * UI Components - Progress
 */
export const PROGRESS_COMPONENT_TEMPLATE = `import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "../../utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }`;

/**
 * Basic field components - Text Field
 */
export const TEXT_FIELD_TEMPLATE = `import React from "react";
import { cn } from "../../utils";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { BaseFieldProps } from "../../types";

export interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "password" | "url" | "tel";
}

export function TextField({ fieldApi, label, placeholder, wrapperClassName, labelClassName, disabled, type = "text" }: TextFieldProps) {
  const { name, value, errors, handleChange, handleBlur } = fieldApi;

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label && (
        <Label htmlFor={name} className={cn("text-sm font-medium", labelClassName)}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(errors.length > 0 && "border-destructive")}
      />
      {errors.length > 0 && (
        <p className="text-sm text-destructive">{errors[0]}</p>
      )}
    </div>
  );
}`;

/**
 * Basic Input component
 */
export const INPUT_COMPONENT_TEMPLATE = `import * as React from "react"
import { cn } from "../../utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`;

/**
 * Basic Label component
 */
export const LABEL_COMPONENT_TEMPLATE = `import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }`;

/**
 * Comprehensive CSS styles for Formedible forms
 */
export const FORMEDIBLE_STYLES_TEMPLATE = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* CSS Variables for consistent theming */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
  line-height: 1.6;
}

/* Utility classes for styling */
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }

.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }

.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.text-gray-600 { color: #6b7280; }
.text-gray-700 { color: #374151; }
.text-gray-900 { color: #111827; }

.bg-white { background-color: #ffffff; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-indigo-50 { background-color: #eef2ff; }

.border { border-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-b { border-bottom-width: 1px; }

.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }

.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }

.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }

.min-h-screen { min-height: 100vh; }
.max-w-4xl { max-width: 56rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

.flex { display: flex; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.items-center { align-items: center; }

.overflow-hidden { overflow: hidden; }

.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }

.from-gray-50 { --tw-gradient-from: #f9fafb; --tw-gradient-to: rgb(249 250 251 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
.to-gray-100 { --tw-gradient-to: #f3f4f6; }
.from-blue-50 { --tw-gradient-from: #eff6ff; --tw-gradient-to: rgb(239 246 255 / 0); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
.to-indigo-50 { --tw-gradient-to: #eef2ff; }

/* Form specific styles */
.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.field-group {
  margin-bottom: 1.5rem;
}

.field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  font-size: 1rem;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.field-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button styles */
.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: hsl(var(--primary) / 0.9);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  padding: 0.75rem 1.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background-color: hsl(var(--accent));
}

/* Error states */
.error-message {
  color: hsl(var(--destructive));
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.field-error {
  border-color: hsl(var(--destructive));
}

/* Progress bar */
.progress-bar {
  width: 100%;
  height: 0.5rem;
  background-color: hsl(var(--secondary));
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-fill {
  height: 100%;
  background-color: hsl(var(--primary));
  transition: width 0.3s ease-in-out;
}

/* Loading states */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

.spinner {
  border: 2px solid hsl(var(--secondary));
  border-top: 2px solid hsl(var(--primary));
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }
  
  .field-input,
  .btn-primary,
  .btn-secondary {
    font-size: 0.875rem;
    padding: 0.625rem 1rem;
  }
  
  .max-w-4xl {
    max-width: 100%;
    margin: 0 1rem;
  }
}

/* Focus visible for accessibility */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Selection styles */
::selection {
  background-color: hsl(var(--primary) / 0.2);
}`;

/**
 * TypeScript configuration for sandbox
 */
export const TSCONFIG_TEMPLATE = `{
  "compilerOptions": {
    "target": "es2018",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`;

/**
 * Package.json template with all required dependencies
 */
export const PACKAGE_JSON_TEMPLATE = JSON.stringify({
  name: "formedible-sandbox",
  version: "1.0.0",
  dependencies: FORMEDIBLE_SANDBOX_DEPENDENCIES,
  main: "/App.tsx",
  devDependencies: {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}, null, 2);

/**
 * Template variations for different form types
 */
export interface TemplateVariation {
  name: string;
  description: string;
  complexity: "basic" | "intermediate" | "advanced";
  formComponent: string;
  exampleFields: any[];
}

/**
 * Basic single-page form template
 */
export const BASIC_FORM_TEMPLATE: TemplateVariation = {
  name: "Basic Form",
  description: "Simple single-page form with basic validation",
  complexity: "basic",
  formComponent: `import React from 'react';
import { useFormedible } from './hooks/use-formedible';
import { z } from 'zod';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormComponentProps {
  onSubmit?: (data: FormData) => void;
  onError?: (error: Error) => void;
  onChange?: (data: FormData) => void;
}

export default function FormComponent({ onSubmit, onError, onChange }: FormComponentProps) {
  const { Form, form } = useFormedible<FormData>({
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your full name',
        validation: z.string().min(2, 'Name must be at least 2 characters'),
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email address',
        validation: z.string().email('Please enter a valid email address'),
      },
      {
        name: 'message',
        type: 'textarea',
        label: 'Message',
        placeholder: 'Enter your message',
        validation: z.string().min(10, 'Message must be at least 10 characters'),
      },
    ],
    formOptions: {
      onSubmit: async ({ value }) => {
        try {
          onSubmit?.(value);
        } catch (error) {
          onError?.(error as Error);
        }
      },
      onChange: ({ value }) => {
        onChange?.(value);
      },
    },
  });

  return (
    <Form />
  );
}`,
  exampleFields: [
    { name: 'name', type: 'text', label: 'Full Name', placeholder: 'Enter your full name' },
    { name: 'email', type: 'email', label: 'Email Address', placeholder: 'Enter your email address' },
    { name: 'message', type: 'textarea', label: 'Message', placeholder: 'Enter your message' },
  ]
};

/**
 * Multi-page form template
 */
export const MULTI_PAGE_FORM_TEMPLATE: TemplateVariation = {
  name: "Multi-Page Form",
  description: "Multi-step form with progress indicator and validation",
  complexity: "intermediate",
  formComponent: `import React from 'react';
import { useFormedible } from './hooks/use-formedible';
import { z } from 'zod';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  experience: string;
  skills: string[];
}

interface FormComponentProps {
  onSubmit?: (data: FormData) => void;
  onError?: (error: Error) => void;
  onChange?: (data: FormData) => void;
}

export default function FormComponent({ onSubmit, onError, onChange }: FormComponentProps) {
  const { Form, form, currentPage, totalPages } = useFormedible<FormData>({
    fields: [
      // Page 1: Personal Information
      {
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        placeholder: 'Enter your first name',
        page: 1,
        validation: z.string().min(2, 'First name must be at least 2 characters'),
      },
      {
        name: 'lastName',
        type: 'text',
        label: 'Last Name',
        placeholder: 'Enter your last name',
        page: 1,
        validation: z.string().min(2, 'Last name must be at least 2 characters'),
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email address',
        page: 1,
        validation: z.string().email('Please enter a valid email address'),
      },
      {
        name: 'phone',
        type: 'tel',
        label: 'Phone Number',
        placeholder: 'Enter your phone number',
        page: 1,
        validation: z.string().min(10, 'Please enter a valid phone number'),
      },
      // Page 2: Professional Information
      {
        name: 'company',
        type: 'text',
        label: 'Company',
        placeholder: 'Enter your company name',
        page: 2,
        validation: z.string().min(2, 'Company name must be at least 2 characters'),
      },
      {
        name: 'role',
        type: 'select',
        label: 'Current Role',
        placeholder: 'Select your role',
        page: 2,
        options: [
          { value: 'developer', label: 'Software Developer' },
          { value: 'designer', label: 'UI/UX Designer' },
          { value: 'manager', label: 'Project Manager' },
          { value: 'analyst', label: 'Business Analyst' },
          { value: 'other', label: 'Other' },
        ],
        validation: z.string().min(1, 'Please select a role'),
      },
      {
        name: 'experience',
        type: 'select',
        label: 'Years of Experience',
        placeholder: 'Select experience level',
        page: 2,
        options: [
          { value: '0-1', label: '0-1 years' },
          { value: '2-5', label: '2-5 years' },
          { value: '6-10', label: '6-10 years' },
          { value: '10+', label: '10+ years' },
        ],
        validation: z.string().min(1, 'Please select experience level'),
      },
      // Page 3: Skills (using checkboxes)
      {
        name: 'skills',
        type: 'checkbox',
        label: 'Technical Skills',
        placeholder: 'Select your skills',
        page: 3,
        options: [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue.js' },
          { value: 'angular', label: 'Angular' },
          { value: 'node', label: 'Node.js' },
          { value: 'python', label: 'Python' },
          { value: 'java', label: 'Java' },
        ],
        validation: z.array(z.string()).min(1, 'Please select at least one skill'),
      },
    ],
    pages: [
      { page: 1, title: 'Personal Information', description: 'Tell us about yourself' },
      { page: 2, title: 'Professional Background', description: 'Share your work experience' },
      { page: 3, title: 'Technical Skills', description: 'Select your areas of expertise' },
    ],
    progress: {
      className: 'mb-6',
    },
    formOptions: {
      onSubmit: async ({ value }) => {
        try {
          onSubmit?.(value);
        } catch (error) {
          onError?.(error as Error);
        }
      },
      onChange: ({ value }) => {
        onChange?.(value);
      },
    },
  });

  return <Form />;
}`,
  exampleFields: [
    { name: 'firstName', type: 'text', label: 'First Name', page: 1 },
    { name: 'lastName', type: 'text', label: 'Last Name', page: 1 },
    { name: 'email', type: 'email', label: 'Email Address', page: 1 },
    { name: 'company', type: 'text', label: 'Company', page: 2 },
    { name: 'role', type: 'select', label: 'Current Role', page: 2 },
    { name: 'skills', type: 'checkbox', label: 'Technical Skills', page: 3 },
  ]
};

/**
 * Advanced form with conditional logic template
 */
export const ADVANCED_CONDITIONAL_FORM_TEMPLATE: TemplateVariation = {
  name: "Advanced Conditional Form",
  description: "Complex form with conditional fields, dynamic validation, and multiple field types",
  complexity: "advanced",
  formComponent: `import React from 'react';
import { useFormedible } from './hooks/use-formedible';
import { z } from 'zod';

interface FormData {
  userType: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  industry?: string;
  employees?: string;
  personalInterests?: string[];
  budget?: number;
  timeline?: string;
  additionalRequirements?: string;
}

interface FormComponentProps {
  onSubmit?: (data: FormData) => void;
  onError?: (error: Error) => void;
  onChange?: (data: FormData) => void;
}

export default function FormComponent({ onSubmit, onError, onChange }: FormComponentProps) {
  const { Form, form } = useFormedible<FormData>({
    fields: [
      {
        name: 'userType',
        type: 'radio',
        label: 'I am a...',
        options: [
          { value: 'individual', label: 'Individual' },
          { value: 'business', label: 'Business Owner' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
        validation: z.string().min(1, 'Please select user type'),
      },
      {
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        placeholder: 'Enter your first name',
        validation: z.string().min(2, 'First name must be at least 2 characters'),
      },
      {
        name: 'lastName',
        type: 'text',
        label: 'Last Name',
        placeholder: 'Enter your last name',
        validation: z.string().min(2, 'Last name must be at least 2 characters'),
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'Enter your email address',
        validation: z.string().email('Please enter a valid email address'),
      },
      // Business-specific fields (conditional)
      {
        name: 'companyName',
        type: 'text',
        label: 'Company Name',
        placeholder: 'Enter your company name',
        conditional: (values) => values.userType === 'business' || values.userType === 'enterprise',
        validation: z.string().min(2, 'Company name must be at least 2 characters').optional(),
      },
      {
        name: 'industry',
        type: 'select',
        label: 'Industry',
        placeholder: 'Select your industry',
        conditional: (values) => values.userType === 'business' || values.userType === 'enterprise',
        options: [
          { value: 'technology', label: 'Technology' },
          { value: 'finance', label: 'Finance' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'education', label: 'Education' },
          { value: 'retail', label: 'Retail' },
          { value: 'manufacturing', label: 'Manufacturing' },
          { value: 'other', label: 'Other' },
        ],
        validation: z.string().min(1, 'Please select an industry').optional(),
      },
      {
        name: 'employees',
        type: 'select',
        label: 'Number of Employees',
        placeholder: 'Select company size',
        conditional: (values) => values.userType === 'enterprise',
        options: [
          { value: '1-10', label: '1-10 employees' },
          { value: '11-50', label: '11-50 employees' },
          { value: '51-200', label: '51-200 employees' },
          { value: '201-1000', label: '201-1000 employees' },
          { value: '1000+', label: '1000+ employees' },
        ],
        validation: z.string().min(1, 'Please select company size').optional(),
      },
      // Individual-specific fields
      {
        name: 'personalInterests',
        type: 'checkbox',
        label: 'Personal Interests',
        conditional: (values) => values.userType === 'individual',
        options: [
          { value: 'technology', label: 'Technology' },
          { value: 'design', label: 'Design' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'business', label: 'Business' },
          { value: 'education', label: 'Education' },
          { value: 'health', label: 'Health & Wellness' },
        ],
        validation: z.array(z.string()).min(1, 'Please select at least one interest').optional(),
      },
      // Common fields for all user types
      {
        name: 'budget',
        type: 'number',
        label: 'Budget Range',
        placeholder: 'Enter your budget in USD',
        validation: z.number().min(1, 'Budget must be greater than 0').optional(),
      },
      {
        name: 'timeline',
        type: 'select',
        label: 'Project Timeline',
        placeholder: 'When do you need this completed?',
        options: [
          { value: 'asap', label: 'As soon as possible' },
          { value: '1-month', label: 'Within 1 month' },
          { value: '3-months', label: 'Within 3 months' },
          { value: '6-months', label: 'Within 6 months' },
          { value: 'flexible', label: 'Flexible timeline' },
        ],
        validation: z.string().min(1, 'Please select a timeline'),
      },
      {
        name: 'additionalRequirements',
        type: 'textarea',
        label: 'Additional Requirements',
        placeholder: 'Tell us more about your specific needs...',
        validation: z.string().optional(),
      },
    ],
    formOptions: {
      onSubmit: async ({ value }) => {
        try {
          // Simulate API call
          console.log('Submitting form:', value);
          await new Promise(resolve => setTimeout(resolve, 1000));
          onSubmit?.(value);
        } catch (error) {
          onError?.(error as Error);
        }
      },
      onChange: ({ value }) => {
        onChange?.(value);
      },
    },
  });

  return <Form />;
}`,
  exampleFields: [
    { name: 'userType', type: 'radio', label: 'User Type' },
    { name: 'firstName', type: 'text', label: 'First Name' },
    { name: 'companyName', type: 'text', label: 'Company Name', conditional: true },
    { name: 'industry', type: 'select', label: 'Industry', conditional: true },
    { name: 'personalInterests', type: 'checkbox', label: 'Personal Interests', conditional: true },
    { name: 'budget', type: 'number', label: 'Budget Range' },
  ]
};

/**
 * Get all available templates
 */
export const TEMPLATE_VARIATIONS: TemplateVariation[] = [
  BASIC_FORM_TEMPLATE,
  MULTI_PAGE_FORM_TEMPLATE,
  ADVANCED_CONDITIONAL_FORM_TEMPLATE,
];

/**
 * Create a complete Formedible sandbox with all necessary files
 */
export function createFormedibleSandbox(
  formComponent: string = BASIC_FORM_TEMPLATE.formComponent,
  templateType: "basic" | "intermediate" | "advanced" = "basic"
): SandboxFiles {
  // CRITICAL: Process the form component through extractFormComponent to handle JSON safely
  const { extractFormComponent } = require('./sandbox-code-injector');
  const safeFormComponent = extractFormComponent(formComponent);
  
  return {
    "/App.tsx": {
      code: FORMEDIBLE_APP_TEMPLATE
    },
    "/FormComponent.tsx": {
      code: safeFormComponent
    },
    "/hooks/use-formedible.tsx": {
      code: USE_FORMEDIBLE_HOOK_TEMPLATE
    },
    "/types.ts": {
      code: FORMEDIBLE_TYPES_TEMPLATE
    },
    "/utils.ts": {
      code: FORMEDIBLE_UTILS_TEMPLATE
    },
    "/components/ui/button.tsx": {
      code: BUTTON_COMPONENT_TEMPLATE
    },
    "/components/ui/progress.tsx": {
      code: PROGRESS_COMPONENT_TEMPLATE
    },
    "/components/ui/input.tsx": {
      code: INPUT_COMPONENT_TEMPLATE
    },
    "/components/ui/label.tsx": {
      code: LABEL_COMPONENT_TEMPLATE
    },
    "/components/fields/text-field.tsx": {
      code: TEXT_FIELD_TEMPLATE
    },
    "/styles.css": {
      code: FORMEDIBLE_STYLES_TEMPLATE
    },
    "/package.json": {
      code: PACKAGE_JSON_TEMPLATE,
      hidden: true
    },
    "/tsconfig.json": {
      code: TSCONFIG_TEMPLATE,
      hidden: true
    }
  };
}

/**
 * Get template by complexity level
 */
export function getTemplateByComplexity(complexity: "basic" | "intermediate" | "advanced"): TemplateVariation {
  return TEMPLATE_VARIATIONS.find(template => template.complexity === complexity) || BASIC_FORM_TEMPLATE;
}

/**
 * Generate form component code from field configuration
 */
export function generateFormComponentFromFields(
  fields: any[],
  formConfig?: { 
    multiPage?: boolean; 
    hasConditional?: boolean; 
    title?: string;
    description?: string;
  }
): string {
  const { multiPage = false, hasConditional = false, title = "Generated Form", description } = formConfig || {};

  const fieldsCode = fields.map(field => {
    const validation = field.validation ? 
      `validation: z.string().min(1, 'This field is required'),` : '';
    const options = field.options ? 
      `options: ${JSON.stringify(field.options)},` : '';
    const conditional = field.conditional ? 
      `conditional: (values) => ${field.conditional},` : '';
    
    return `      {
        name: '${field.name}',
        type: '${field.type}',
        label: '${field.label || field.name}',
        placeholder: '${field.placeholder || ''}',
        ${field.page ? `page: ${field.page},` : ''}
        ${validation}
        ${options}
        ${conditional}
      }`;
  }).join(',\n');

  const pagesConfig = multiPage && fields.some(f => f.page) ? `
    pages: [
      ${[...new Set(fields.filter(f => f.page).map(f => f.page))].sort().map(pageNum => 
        `{ page: ${pageNum}, title: 'Step ${pageNum}', description: 'Please fill out this step' }`
      ).join(',\n      ')}
    ],
    progress: {
      className: 'mb-6',
    },` : '';

  return `import React from 'react';
import { useFormedible } from './hooks/use-formedible';
import { z } from 'zod';

interface FormData {
  ${fields.map(field => `${field.name}: ${field.type === 'number' ? 'number' : field.type === 'checkbox' ? 'string[]' : 'string'};`).join('\n  ')}
}

interface FormComponentProps {
  onSubmit?: (data: FormData) => void;
  onError?: (error: Error) => void;
  onChange?: (data: FormData) => void;
}

export default function FormComponent({ onSubmit, onError, onChange }: FormComponentProps) {
  const { Form } = useFormedible<FormData>({
    fields: [
${fieldsCode}
    ],${pagesConfig}
    formOptions: {
      onSubmit: async ({ value }) => {
        try {
          console.log('Form submitted:', value);
          onSubmit?.(value);
        } catch (error) {
          onError?.(error as Error);
        }
      },
      onChange: ({ value }) => {
        onChange?.(value);
      },
    },
  });

  return (
    <div className="space-y-6">
      ${title ? `<div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">${title}</h2>
        ${description ? `<p className="text-gray-600 mt-2">${description}</p>` : ''}
      </div>` : ''}
      <Form />
    </div>
  );
}`;
}