'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';

export interface FieldWrapperProps extends BaseFieldProps {
  children: React.ReactNode;
  htmlFor?: string;
  showErrors?: boolean;
}

export interface FieldRenderProps {
  fieldApi: BaseFieldProps['fieldApi'];
  isDisabled: boolean;
  hasErrors: boolean;
  inputClassName: string;
}

export interface BaseFieldWrapperProps extends BaseFieldProps {
  htmlFor?: string;
  showErrors?: boolean;
  children: (props: FieldRenderProps) => React.ReactNode;
}

export const BaseFieldWrapper: React.FC<BaseFieldWrapperProps> = ({
  fieldApi,
  label,
  description,
  inputClassName,
  labelClassName,
  wrapperClassName,
  htmlFor,
  showErrors = true,
  children,
}) => {
  const { name, state } = fieldApi;
  const isDisabled = fieldApi.form.state.isSubmitting;
  const hasErrors = state.meta.isTouched && state.meta.errors.length > 0;
  
  const computedInputClassName = cn(
    inputClassName,
    hasErrors ? "border-destructive" : ""
  );

  const renderProps: FieldRenderProps = {
    fieldApi,
    isDisabled,
    hasErrors,
    inputClassName: computedInputClassName,
  };

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <Label 
          htmlFor={htmlFor || name} 
          className={cn("text-sm font-medium", labelClassName)}
        >
          {label}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {children(renderProps)}
      
      {showErrors && hasErrors && (
        <div className="text-xs text-destructive pt-1">
          {state.meta.errors.map((err: string | Error, index: number) => (
            <p key={index}>
              {typeof err === 'string' ? err : (err as Error)?.message || 'Invalid'}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple wrapper component for basic usage
export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  children,
  htmlFor,
  showErrors = true,
  ...fieldProps
}) => {
  return (
    <BaseFieldWrapper {...fieldProps} htmlFor={htmlFor} showErrors={showErrors}>
      {() => children}
    </BaseFieldWrapper>
  );
};