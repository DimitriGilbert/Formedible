"use client";
import React from 'react';
import type { FormedibleFormApi, DynamicText, OptionalDynamicText } from '@/lib/formedible/types';
import type { FormState } from '@tanstack/form-core';
import { 
  resolveDynamicText, 
  getDynamicTextDependencies,
  type TemplateOptions 
} from '@/lib/formedible/template-interpolation';

export interface DynamicTextRendererProps<TFormValues extends Record<string, unknown>> {
  text: OptionalDynamicText;
  form: FormedibleFormApi<TFormValues>;
  templateOptions?: TemplateOptions;
  fallback?: string;
  className?: string;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  children?: (resolvedText: string) => React.ReactNode;
}

/**
 * Component that renders dynamic text with form value subscriptions
 * Optimizes re-renders by only subscribing to the specific fields referenced in the template
 */
export const DynamicTextRenderer = <TFormValues extends Record<string, unknown>>({
  text,
  form,
  templateOptions,
  fallback = '',
  className,
  as: Component = 'span',
  children
}: DynamicTextRendererProps<TFormValues>) => {
  // Early return for static text or no text
  if (!text) {
    const fallbackText = fallback || '';
    return children ? <>{children(fallbackText)}</> : <Component className={className}>{fallbackText}</Component>;
  }

  // For static strings without template syntax, render directly
  if (typeof text === 'string' && !text.includes('{{')) {
    return children ? <>{children(text)}</> : <Component className={className}>{text}</Component>;
  }

  // Get field dependencies for optimized subscription
  const dependencies = getDynamicTextDependencies(text);
  
  // If no dependencies found (like with functions), subscribe to all form values
  const useOptimizedSubscription = dependencies.length > 0;

  if (useOptimizedSubscription) {
    // Optimized subscription - only re-render when dependent fields change
    return (
      <form.Subscribe
        selector={(state) => {
          const values = state.values;
          const relevantValues: Record<string, unknown> = {};
          
          // Only include values for fields this text depends on
          for (const dep of dependencies) {
            if (dep in values) {
              relevantValues[dep] = values[dep];
            }
          }
          
          return relevantValues;
        }}
      >
        {(relevantValues: Record<string, unknown>) => {
          // Merge with full form values for complete context
          const fullValues = form.state.values;
          const mergedValues = { ...fullValues, ...relevantValues };
          
          const resolvedText = resolveDynamicText(text, mergedValues, templateOptions) || fallback;
          
          return children ? (
            <>{children(resolvedText)}</>
          ) : (
            <Component className={className}>{resolvedText}</Component>
          );
        }}
      </form.Subscribe>
    );
  }

  // Fallback to full form subscription for functions or complex cases
  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values: Record<string, unknown>) => {
        const resolvedText = resolveDynamicText(text, values, templateOptions) || fallback;
        
        return children ? (
          <>{children(resolvedText)}</>
        ) : (
          <Component className={className}>{resolvedText}</Component>
        );
      }}
    </form.Subscribe>
  );
};

/**
 * Hook for using dynamic text resolution in custom components
 */
export function useDynamicText<TFormValues extends Record<string, unknown>>(
  text: OptionalDynamicText,
  form: FormedibleFormApi<TFormValues>,
  templateOptions?: TemplateOptions
): string {
  const [resolvedText, setResolvedText] = React.useState<string>('');
  
  React.useEffect(() => {
    if (!text) {
      setResolvedText('');
      return;
    }

    // For static strings, set immediately
    if (typeof text === 'string' && !text.includes('{{')) {
      setResolvedText(text);
      return;
    }

    // Set up subscription for dynamic text
    const unsubscribe = form.store.subscribe(() => {
      const values = form.state.values;
      const resolved = resolveDynamicText(text, values, templateOptions) || '';
      setResolvedText(resolved);
    });

    // Initial resolution
    const values = form.state.values;
    const resolved = resolveDynamicText(text, values, templateOptions) || '';
    setResolvedText(resolved);

    return unsubscribe;
  }, [text, form, templateOptions]);

  return resolvedText;
}

/**
 * Higher-order component for adding dynamic text capabilities to existing components
 */
export function withDynamicText<TFormValues extends Record<string, unknown>, P extends { title?: string; label?: string; description?: string }>(
  WrappedComponent: React.ComponentType<P>
) {
  return React.forwardRef<React.ComponentRef<typeof WrappedComponent>, P & { 
    form?: FormedibleFormApi<TFormValues>;
    templateOptions?: TemplateOptions;
    dynamicTitle?: OptionalDynamicText;
    dynamicLabel?: OptionalDynamicText;
    dynamicDescription?: OptionalDynamicText;
  }>((props, ref) => {
    const {
      form,
      templateOptions,
      dynamicTitle,
      dynamicLabel,
      dynamicDescription,
      title: staticTitle,
      label: staticLabel,
      description: staticDescription,
      ...restProps
    } = props;

    // Use dynamic text if provided and form is available, otherwise fall back to static
    const resolvedTitle = form && dynamicTitle ? 
      useDynamicText(dynamicTitle, form, templateOptions) : 
      staticTitle;
      
    const resolvedLabel = form && dynamicLabel ? 
      useDynamicText(dynamicLabel, form, templateOptions) : 
      staticLabel;
      
    const resolvedDescription = form && dynamicDescription ? 
      useDynamicText(dynamicDescription, form, templateOptions) : 
      staticDescription;

    const componentProps = {
      ...restProps,
      title: resolvedTitle,
      label: resolvedLabel,
      description: resolvedDescription,
    } as P;

    return (
      <WrappedComponent
        ref={ref}
        {...componentProps}
      />
    );
  });
}