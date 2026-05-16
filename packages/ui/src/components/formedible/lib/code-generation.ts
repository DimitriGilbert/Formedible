import type { ReactNode } from 'react';

import type {
  FormedibleFieldConfig,
  FormedibleFormValues,
  UseFormedibleOptions,
} from '@formedible/ui/components/formedible/lib/types';
import type { BuilderFieldValidationConfig } from '@formedible/ui/components/formedible/lib/builder-config-types';
import type { FormPage, FormSettings, FormTab } from '@formedible/ui/components/formedible/lib/builder-types';

export interface CodeGenerationOptions {
  readonly title?: string;
  readonly description?: string;
  readonly fields: readonly FormedibleFieldConfig<FormedibleFormValues>[];
  readonly pages?: readonly FormPage[];
  readonly tabs?: readonly FormTab[];
  readonly settings?: Partial<FormSettings>;
}

export interface GeneratedCodeResult {
  readonly fullCode: string;
  readonly formConfig: string;
  readonly schemaCode: string;
}

interface SerializedPageConfig {
  readonly page: number;
  readonly title: string;
  readonly description?: string;
}

interface SerializedTabConfig {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

function reactNodeToCode(value: ReactNode): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function stringLiteral(value: string): string {
  return JSON.stringify(value);
}

function fieldSchemaCode(field: FormedibleFieldConfig<FormedibleFormValues>): string {
  const label = reactNodeToCode(field.label) || field.name;
  const builderValidation = getBuilderValidation(field);
  let schema = 'z.string()';

  if (field.type === 'email') {
    schema = 'z.string().email()';
  }

  if (field.type === 'url') {
    schema = 'z.string().url()';
  }

  if (field.type === 'number' || field.type === 'slider' || field.type === 'rating') {
    schema = 'z.number()';
  }

  if (field.type === 'checkbox' || field.type === 'switch') {
    schema = 'z.boolean()';
  }

  if (field.type === 'multiSelect' || field.type === 'multiselect' || field.type === 'array') {
    schema = 'z.array(z.string())';
  }

  if (field.type === 'object') {
    schema = 'z.object({}).passthrough()';
  }

  if (builderValidation?.minLength !== undefined && schema.startsWith('z.string()')) {
    schema = `${schema}.min(${builderValidation.minLength})`;
  }

  if (builderValidation?.maxLength !== undefined && schema.startsWith('z.string()')) {
    schema = `${schema}.max(${builderValidation.maxLength})`;
  }

  if (builderValidation?.pattern !== undefined && schema.startsWith('z.string()')) {
    schema = `${schema}.regex(new RegExp(${stringLiteral(builderValidation.pattern)}))`;
  }

  if (builderValidation?.min !== undefined && schema.startsWith('z.number()')) {
    schema = `${schema}.min(${builderValidation.min})`;
  }

  if (builderValidation?.max !== undefined && schema.startsWith('z.number()')) {
    schema = `${schema}.max(${builderValidation.max})`;
  }

  if (builderValidation?.minItems !== undefined && schema.startsWith('z.array(')) {
    schema = `${schema}.min(${builderValidation.minItems})`;
  }

  if (builderValidation?.maxItems !== undefined && schema.startsWith('z.array(')) {
    schema = `${schema}.max(${builderValidation.maxItems})`;
  }

  if (field.required === true && schema.startsWith('z.string()')) {
    return `${schema}.min(1, ${stringLiteral(builderValidation?.requiredMessage ?? `${label} is required`)})`;
  }

  if (field.required === true && schema === 'z.boolean()') {
    return `${schema}.refine((value) => value === true, { message: ${stringLiteral(builderValidation?.requiredMessage ?? `${label} is required`)} })`;
  }

  return field.required === true ? schema : `${schema}.optional()`;
}

function getBuilderValidation(field: FormedibleFieldConfig<FormedibleFormValues>): BuilderFieldValidationConfig | undefined {
  const validation = field.builderValidation;
  return typeof validation === 'object' && validation !== null && !Array.isArray(validation) ? validation as BuilderFieldValidationConfig : undefined;
}

function serializeField(field: FormedibleFieldConfig<FormedibleFormValues>): Record<string, unknown> {
  const serialized: Record<string, unknown> = {
    name: field.name,
    type: field.type ?? 'text',
    label: reactNodeToCode(field.label) || field.name,
  };

  const optionalKeys = [
    'description',
    'placeholder',
    'defaultValue',
    'required',
    'disabled',
    'page',
    'tab',
    'section',
    'help',
    'options',
    'datalist',
    'min',
    'max',
    'step',
    'rows',
    'maxLength',
    'mask',
    'textareaConfig',
    'passwordConfig',
    'numberConfig',
    'dateConfig',
    'sliderConfig',
    'ratingConfig',
    'multiSelectConfig',
    'comboboxConfig',
    'autocompleteConfig',
    'maskedInputConfig',
    'multiComboboxConfig',
    'colorConfig',
    'phoneConfig',
    'durationConfig',
    'locationConfig',
    'fileConfig',
    'arrayConfig',
    'objectConfig',
  ] as const;

  for (const key of optionalKeys) {
    const value = field[key];

    if (value !== undefined && typeof value !== 'function') {
      serialized[key] = key === 'description' ? reactNodeToCode(value as ReactNode) : value;
    }
  }

  return serialized;
}

function serializePages(pages: readonly FormPage[] | undefined): readonly SerializedPageConfig[] | undefined {
  if (pages === undefined || pages.length <= 1) {
    return undefined;
  }

  return pages.map((page) => ({
    page: page.page,
    title: page.title,
    description: page.description,
  }));
}

function serializeTabs(tabs: readonly FormTab[] | undefined): readonly SerializedTabConfig[] | undefined {
  if (tabs === undefined || tabs.length <= 1) {
    return undefined;
  }

  return tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    description: tab.description,
  }));
}

export function generateFormCode(options: CodeGenerationOptions): GeneratedCodeResult {
  const schemaFields = options.fields.map((field) => `  ${field.name}: ${fieldSchemaCode(field)}`).join(',\n');
  const schemaCode = `z.object({${schemaFields.length > 0 ? `\n${schemaFields}\n` : ''}})`;
  const configObject: Record<string, unknown> = {
    fields: options.fields.map(serializeField),
    formOptions: {
      defaultValues: {},
      onSubmit: 'FORMEDIBLE_SUBMIT_HANDLER',
    },
  };

  if (options.title !== undefined && options.title.length > 0) {
    configObject.title = options.title;
  }

  if (options.description !== undefined && options.description.length > 0) {
    configObject.description = options.description;
  }

  const pages = serializePages(options.pages);

  if (pages !== undefined) {
    configObject.pages = pages;
  }

  const tabs = serializeTabs(options.tabs);

  if (tabs !== undefined) {
    configObject.tabs = tabs;
  }

  if (options.settings?.submitLabel !== undefined) {
    configObject.submitLabel = options.settings.submitLabel;
  }

  if (options.settings?.nextLabel !== undefined) {
    configObject.nextLabel = options.settings.nextLabel;
  }

  if (options.settings?.previousLabel !== undefined) {
    configObject.previousLabel = options.settings.previousLabel;
  }

  if (options.settings?.showProgress === true) {
    configObject.progress = { showSteps: true, showPercentage: true };
  }

  const formConfig = JSON.stringify(configObject, null, 2)
    .replace('"FORMEDIBLE_SUBMIT_HANDLER"', 'async ({ value }) => {\n      window.dispatchEvent(new CustomEvent(\'formedible-submit\', { detail: value }));\n    }');
  const fullCode = `import { z } from 'zod';\n\nimport { useFormedible } from '@formedible/ui/components/formedible/hooks/use-formedible';\n\nexport function MyForm() {\n  const schema = ${schemaCode};\n  const { Form } = useFormedible({\n    ...${formConfig},\n    schema,\n  });\n\n  return <Form />;\n}\n`;

  return {
    fullCode,
    formConfig,
    schemaCode,
  };
}

export function generateCodeFromParsedConfig(config: UseFormedibleOptions<FormedibleFormValues>): GeneratedCodeResult {
  return generateFormCode({
    title: typeof config.title === 'string' ? config.title : undefined,
    description: typeof config.description === 'string' ? config.description : undefined,
    fields: config.fields,
    pages: config.pages?.map((page) => ({
      page: page.page,
      title: reactNodeToCode(page.title) || `Page ${page.page}`,
      description: reactNodeToCode(page.description),
    })),
    tabs: config.tabs?.flatMap((tab) => {
      if (typeof tab === 'string') {
        return [];
      }

      return [{
        id: tab.id,
        label: reactNodeToCode(tab.label) || tab.id,
        description: reactNodeToCode(tab.description),
      }];
    }),
    settings: {
      submitLabel: reactNodeToCode(config.submitLabel),
      nextLabel: reactNodeToCode(config.nextLabel),
      previousLabel: reactNodeToCode(config.previousLabel),
      showProgress: config.progress !== undefined,
    },
  });
}
