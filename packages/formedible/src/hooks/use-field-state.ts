import { AnyFieldApi } from "@tanstack/react-form";

export interface UseFieldStateReturn {
  name: string;
  value: unknown;
  isDisabled: boolean;
  hasErrors: boolean;
  errors: string[];
  onBlur: () => void;
  onChange: (value: unknown) => void;
}

export function useFieldState(fieldApi: AnyFieldApi): UseFieldStateReturn {
  const name = fieldApi.name;
  const value = fieldApi.state.value;
  const isDisabled = fieldApi.form.state.isSubmitting;
  const isTouched = fieldApi.state.meta.isTouched;
  const errors = fieldApi.state.meta.errors || [];
  const hasErrors = isTouched && errors.length > 0;

  const onBlur = () => {
    fieldApi.handleBlur();
  };

  const onChange = (newValue: unknown) => {
    fieldApi.handleChange(newValue);
  };

  return {
    name,
    value,
    isDisabled,
    hasErrors,
    errors,
    onBlur,
    onChange,
  };
}