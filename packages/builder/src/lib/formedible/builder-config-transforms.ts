import type { ReactNode } from 'react';

import type { FormedibleFieldOption, FormedibleFormValues } from '@/components/formedible/lib/types';
import type { FormField } from '@/lib/formedible/builder-types';
import type { BuilderFieldValidationConfig } from '@/lib/formedible/builder-config-types';

export interface BuilderOptionValue {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly description?: string;
}

export interface BuilderFieldWithValidation extends FormField {
  readonly builderValidation?: BuilderFieldValidationConfig;
}

export function reactNodeToBuilderText(value: ReactNode | undefined): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

export function stringValue(values: FormedibleFormValues, key: string): string {
  const value = values[key];
  return typeof value === 'string' ? value : '';
}

export function optionalStringValue(values: FormedibleFormValues, key: string): string | undefined {
  const value = stringValue(values, key).trim();
  return value.length > 0 ? value : undefined;
}

export function booleanValue(values: FormedibleFormValues, key: string): boolean {
  return values[key] === true;
}

export function optionalNumberValue(values: FormedibleFormValues, key: string): number | undefined {
  const value = values[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function stringArrayValue(values: FormedibleFormValues, key: string): readonly string[] {
  const value = values[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function optionsToBuilderOptions(options: FormField['options']): readonly BuilderOptionValue[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option) => {
    if (typeof option === 'string') {
      return { label: option, value: option };
    }

    return {
      label: reactNodeToBuilderText(option.label) || option.value,
      value: option.value,
      disabled: option.disabled,
      description: reactNodeToBuilderText(option.description),
    };
  });
}

export function builderOptionsToOptions(value: unknown): readonly FormedibleFieldOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const optionValue = typeof item.value === 'string' ? item.value.trim() : '';
      const optionLabel = typeof item.label === 'string' ? item.label.trim() : '';
      const description = typeof item.description === 'string' && item.description.trim().length > 0 ? item.description.trim() : undefined;

      return {
        value: optionValue || optionLabel,
        label: optionLabel || optionValue,
        disabled: item.disabled === true,
        description,
      };
    })
    .filter((option) => option.value.length > 0 || reactNodeToBuilderText(option.label).length > 0);
}

export function baseDefaultValues(field: FormField, page: number): FormedibleFormValues {
  const fieldWithValidation = field as BuilderFieldWithValidation;
  const section = typeof field.section === 'object' && field.section !== null ? field.section : undefined;

  return {
    label: reactNodeToBuilderText(field.label),
    name: field.name,
    description: reactNodeToBuilderText(field.description),
    placeholder: field.placeholder ?? '',
    required: field.required === true,
    disabled: field.disabled === true,
    page: String(field.page ?? page),
    tab: field.tab ?? '',
    sectionTitle: typeof field.section === 'string' ? field.section : reactNodeToBuilderText(section?.title),
    sectionDescription: reactNodeToBuilderText(section?.description),
    requiredMessage: fieldWithValidation.builderValidation?.requiredMessage ?? '',
    minLength: fieldWithValidation.builderValidation?.minLength,
    maxLength: fieldWithValidation.builderValidation?.maxLength,
    pattern: fieldWithValidation.builderValidation?.pattern ?? '',
    validationMin: fieldWithValidation.builderValidation?.min,
    validationMax: fieldWithValidation.builderValidation?.max,
    minItems: fieldWithValidation.builderValidation?.minItems,
    maxItems: fieldWithValidation.builderValidation?.maxItems,
  };
}

export function baseFieldUpdate(values: FormedibleFormValues): Partial<FormField> {
  const sectionTitle = optionalStringValue(values, 'sectionTitle');
  const sectionDescription = optionalStringValue(values, 'sectionDescription');
  const pageText = stringValue(values, 'page');
  const page = Number.parseInt(pageText, 10);
  const builderValidation = validationFromValues(values);
  const update: Partial<BuilderFieldWithValidation> = {
    label: stringValue(values, 'label'),
    name: stringValue(values, 'name'),
    description: optionalStringValue(values, 'description'),
    placeholder: optionalStringValue(values, 'placeholder'),
    required: booleanValue(values, 'required'),
    disabled: booleanValue(values, 'disabled'),
    page: Number.isSafeInteger(page) ? page : undefined,
    tab: optionalStringValue(values, 'tab'),
    section: sectionTitle === undefined ? undefined : sectionDescription === undefined ? sectionTitle : { title: sectionTitle, description: sectionDescription },
    builderValidation,
  };

  return update;
}

function validationFromValues(values: FormedibleFormValues): BuilderFieldValidationConfig | undefined {
  const validation: BuilderFieldValidationConfig = {
    requiredMessage: optionalStringValue(values, 'requiredMessage'),
    minLength: optionalNumberValue(values, 'minLength'),
    maxLength: optionalNumberValue(values, 'maxLength'),
    pattern: optionalStringValue(values, 'pattern'),
    min: optionalNumberValue(values, 'validationMin'),
    max: optionalNumberValue(values, 'validationMax'),
    minItems: optionalNumberValue(values, 'minItems'),
    maxItems: optionalNumberValue(values, 'maxItems'),
  };

  return Object.values(validation).some((value) => value !== undefined) ? validation : undefined;
}
