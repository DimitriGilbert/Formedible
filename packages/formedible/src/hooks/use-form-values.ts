import { useEffect, useState } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";

export interface UseFormValuesReturn {
  formValues: Record<string, unknown>;
}

/**
 * Hook to subscribe to form values changes.
 * Useful for fields that need to react to changes in other fields (e.g., dynamic date restrictions).
 */
export function useFormValues(fieldApi: AnyFieldApi): UseFormValuesReturn {
  const [formValues, setFormValues] = useState(
    fieldApi.form?.state?.values || {}
  );

  useEffect(() => {
    if (!fieldApi.form) return;

    const unsubscribe = fieldApi.form.store.subscribe((state) => {
      setFormValues((state as any).values);
    });

    return unsubscribe;
  }, [fieldApi.form]);

  return { formValues };
}
