export type AIProvider = 'openai' | 'anthropic' | 'openrouter';

export type ProviderSecretStorageMode = 'memory' | 'session' | 'local';

export interface ProviderSecretPersistencePreference {
  readonly mode: ProviderSecretStorageMode;
  readonly rememberKey: boolean;
}

export interface ProviderModelSettings {
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface OpenAIProviderSettings extends ProviderModelSettings {
  readonly provider: 'openai';
  readonly model: string;
  readonly endpoint?: never;
  readonly baseURL?: never;
  readonly thinkingBudgetTokens?: never;
}

export interface AnthropicProviderSettings extends ProviderModelSettings {
  readonly provider: 'anthropic';
  readonly model: string;
  readonly endpoint?: never;
  readonly baseURL?: never;
  readonly thinkingBudgetTokens?: number;
}

export interface OpenRouterProviderSettings extends ProviderModelSettings {
  readonly provider: 'openrouter';
  readonly model: string;
  readonly endpoint?: never;
  readonly baseURL?: never;
  readonly thinkingBudgetTokens?: never;
}

export type ProviderSettings = OpenAIProviderSettings | AnthropicProviderSettings | OpenRouterProviderSettings;

export interface ProviderSecrets {
  readonly provider: AIProvider;
  readonly apiKey: string;
}

export interface ProviderModelCatalogEntry {
  readonly id: string;
  readonly label?: string;
  readonly createdAt?: string;
  readonly contextLength?: number;
  readonly inputPricePerMillionTokens?: string;
  readonly outputPricePerMillionTokens?: string;
}

export interface ProviderModelCatalog {
  readonly provider: AIProvider;
  readonly models: readonly ProviderModelCatalogEntry[];
  readonly fetchedAt: number;
  readonly error?: string;
}

export type ProviderModelCatalogs = Readonly<Partial<Record<AIProvider, ProviderModelCatalog>>>;

export type AiPickerVariant = 'popover' | 'panel';

export interface AiPickerProviderConfig {
  readonly value: AIProvider;
  readonly label: string;
  readonly defaultModel: string;
  readonly requiresKey: boolean;
}

export interface AiPickerValues {
  readonly provider: AIProvider;
  readonly apiKey: string;
  readonly model: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly thinkingBudgetTokens?: number;
  readonly storageMode: ProviderSecretStorageMode;
  readonly rememberKey: boolean;
  readonly [customField: string]: unknown;
}

/**
 * Conditionals mirror the core package's semantics: a string is a field path
 * evaluated for truthiness against the picker values (never compiled with
 * `new Function`), a function receives the values directly.
 */
export type AiPickerConditional = string | ((values: AiPickerValues) => boolean);

export interface AiPickerSchemaField {
  readonly name: string;
  readonly type?: string;
  readonly label?: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly defaultValue?: unknown;
  readonly conditional?: AiPickerConditional;
  readonly [customProp: string]: unknown;
}

export type AiPickerSchema = readonly AiPickerSchemaField[];

export interface AiPickerProps {
  readonly variant?: AiPickerVariant;
  readonly settings?: ProviderSettings;
  readonly secrets?: ProviderSecrets;
  readonly onChange?: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly schema?: AiPickerSchema;
  readonly modelCatalog?: ProviderModelCatalog;
  readonly modelCatalogs?: ProviderModelCatalogs;
  readonly isRefreshingModels?: boolean;
  readonly onRefreshModels?: () => void;
  readonly onFetchModels?: (provider: AIProvider, apiKey: string) => Promise<ProviderModelCatalog>;
  readonly providerConfigs?: readonly AiPickerProviderConfig[];
  readonly persistencePreference?: ProviderSecretPersistencePreference;
  readonly onPersistencePreferenceChange?: (preference: ProviderSecretPersistencePreference) => void;
  readonly onClearStoredSecrets?: () => void;
  readonly className?: string;
}
