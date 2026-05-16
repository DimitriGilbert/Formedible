declare module '@/components/formedible/hooks/use-formedible' {
  export function useFormedible<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues>(
    options: import('../../formedible/src/lib/formedible/types').UseFormedibleOptions<TFormValues>,
  ): { readonly Form: import('react').ComponentType };
}

declare module '@/components/formedible/lib/types' {
  export type FormedibleFieldConfig<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').FormedibleFieldConfig<TFormValues>;
  export type FormedibleFieldOption = import('../../formedible/src/lib/formedible/types').FormedibleFieldOption;
  export type FormedibleFieldType = import('../../formedible/src/lib/formedible/types').FormedibleFieldType;
  export type FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues;
  export type FormediblePageConfig<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').FormediblePageConfig<TFormValues>;
  export type FormedibleTabConfig<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').FormedibleTabConfig<TFormValues>;
  export type UseFormedibleOptions<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').UseFormedibleOptions<TFormValues>;
}
