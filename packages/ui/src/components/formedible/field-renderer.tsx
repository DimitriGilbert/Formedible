import type { AnyFieldApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';

import { labelToText, resolveFieldOptions } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { getFieldComponent } from '@formedible/ui/components/formedible/fields/field-registry';
import type { FormedibleFieldComponentProps, FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

interface FieldRendererProps<TFormValues extends FormedibleFormValues> extends FormedibleFieldRenderProps<TFormValues> {
  readonly fieldApi: AnyFieldApi;
}

function readStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readBooleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function resolveFlatLabel(label: ReactNode): string | undefined {
  return typeof label === 'string' ? label : undefined;
}

/**
 * Normalized field types whose legacy components always received a flat
 * `options` array (empty when the field declares no options), matching the
 * legacy runtime contract for select-like custom components.
 */
const optionPropFieldTypes: ReadonlySet<string> = new Set(['select', 'radio', 'multiSelect', 'combobox', 'multiCombobox']);

/**
 * Builds the dual-shape props delivered to custom field components: the legacy
 * flat props (resolved label/placeholder/options, config objects) alongside the
 * render-props shape (`field`, `fieldConfig`, `renderField`, ...).
 */
function buildFieldComponentProps<TFormValues extends FormedibleFormValues>(props: FieldRendererProps<TFormValues>): FormedibleFieldComponentProps<TFormValues> {
  const { fieldConfig, field, fieldApi } = props;
  const resolvedOptions: FormedibleFieldComponentProps<TFormValues>['options'] = fieldConfig.options === undefined
    ? (optionPropFieldTypes.has(fieldConfig.type) ? [] : undefined)
    : resolveFieldOptions(fieldConfig, field.formValues).map((option) => ({
      value: option.value,
      label: labelToText(option.label),
      ...(option.disabled !== undefined ? { disabled: option.disabled } : {}),
    }));

  return {
    fieldApi,
    field,
    fieldConfig,
    renderField: props.renderField,
    defaultComponent: props.defaultComponent,
    globalWrapper: props.globalWrapper,
    label: resolveFlatLabel(fieldConfig.label),
    placeholder: fieldConfig.placeholder,
    description: resolveFlatLabel(fieldConfig.description),
    disabled: fieldConfig.disabled || Boolean(fieldApi.form.state.isSubmitting),
    required: fieldConfig.required,
    options: resolvedOptions,
    min: fieldConfig.min,
    max: fieldConfig.max,
    step: fieldConfig.step,
    rows: fieldConfig.rows,
    maxLength: fieldConfig.maxLength,
    accept: readStringValue(fieldConfig.accept) ?? fieldConfig.fileConfig?.accept,
    multiple: readBooleanValue(fieldConfig.multiple) ?? fieldConfig.fileConfig?.multiple,
    className: fieldConfig.className,
    inputClassName: fieldConfig.inputClassName,
    wrapperClassName: fieldConfig.className,
    labelClassName: readStringValue(fieldConfig.labelClassName),
    arrayConfig: fieldConfig.arrayConfig,
    objectConfig: fieldConfig.objectConfig,
    datalist: fieldConfig.datalist,
    textareaConfig: fieldConfig.textareaConfig,
    passwordConfig: fieldConfig.passwordConfig,
    numberConfig: fieldConfig.numberConfig,
    dateConfig: fieldConfig.dateConfig,
    sliderConfig: fieldConfig.sliderConfig,
    ratingConfig: fieldConfig.ratingConfig,
    multiSelectConfig: fieldConfig.multiSelectConfig,
    comboboxConfig: fieldConfig.comboboxConfig,
    autocompleteConfig: fieldConfig.autocompleteConfig,
    maskedInputConfig: fieldConfig.maskedInputConfig,
    multiComboboxConfig: fieldConfig.multiComboboxConfig,
    colorConfig: fieldConfig.colorConfig,
    phoneConfig: fieldConfig.phoneConfig,
    durationConfig: fieldConfig.durationConfig,
    locationConfig: fieldConfig.locationConfig,
    fileConfig: fieldConfig.fileConfig,
  };
}

export function FieldRenderer<TFormValues extends FormedibleFormValues>(props: FieldRendererProps<TFormValues>) {
  const FieldComponent = props.fieldConfig.component ?? props.defaultComponent ?? getFieldComponent<TFormValues>(props.fieldConfig.type);
  const FieldWrapper = props.fieldConfig.wrapper;
  const GlobalWrapper = props.globalWrapper;
  const fieldElement = <FieldComponent {...buildFieldComponentProps(props)} />;
  const wrappedField = FieldWrapper ? (
    <FieldWrapper fieldConfig={props.fieldConfig} field={props.field}>
      {fieldElement}
    </FieldWrapper>
  ) : (
    fieldElement
  );

  return GlobalWrapper ? (
    <GlobalWrapper fieldConfig={props.fieldConfig} field={props.field}>
      {wrappedField}
    </GlobalWrapper>
  ) : (
    wrappedField
  );
}
