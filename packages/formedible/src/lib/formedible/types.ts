import type { ReactNode } from 'react';

export type FormedibleFieldType = 'text';

export interface FormedibleFieldConfig<TFormValues extends Record<string, string> = Record<string, string>> {
  readonly name: Extract<keyof TFormValues, string>;
  readonly type?: FormedibleFieldType;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
}

export interface NormalizedFieldConfig<TFormValues extends Record<string, string> = Record<string, string>> {
  readonly name: Extract<keyof TFormValues, string>;
  readonly type: FormedibleFieldType;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder?: string;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
}

export interface FormedibleSubmitContext<TFormValues extends Record<string, string>> {
  readonly value: TFormValues;
}

export interface FormedibleFormOptions<TFormValues extends Record<string, string>> {
  readonly defaultValues: TFormValues;
  readonly onSubmit?: (context: FormedibleSubmitContext<TFormValues>) => void | Promise<void>;
}

export interface UseFormedibleOptions<TFormValues extends Record<string, string> = Record<string, string>> {
  readonly fields: readonly FormedibleFieldConfig<TFormValues>[];
  readonly formOptions: FormedibleFormOptions<TFormValues>;
}

export interface FormedibleTextController {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly error?: string;
  readonly onBlur: () => void;
  readonly onChange: (value: string) => void;
}

export interface FormedibleFieldRenderProps<TFormValues extends Record<string, string> = Record<string, string>> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleTextController;
}
