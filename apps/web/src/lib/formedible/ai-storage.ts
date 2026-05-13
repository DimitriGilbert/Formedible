'use client';

import type {
  AIProvider,
  AiConversation,
  AiConversationExport,
  AiConversationMetadata,
  AiMessage,
  AiMessageRole,
  AiMessageStatus,
  AiParseError,
  GeneratedFormSnapshot,
  ProviderSecrets,
  ProviderSettings,
} from '@/lib/formedible/ai-types';
import { parseSafeGenerationMetadata, parseSafeJsonRecord, parseSafeJsonRecordAllowEmpty, parseSafeJsonValue, parseSafeMessageParts, parseSafeStreamEvents, redactSecretString, redactUnknown } from '@/lib/formedible/ai-safe-persistence';
import type { ParsedFieldConfig, ParsedFormConfig } from '@/lib/formedible/parser-types';
import type { FormedibleFieldOption, FormedibleFieldType } from '@/lib/formedible/types';

export const AI_STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  providerSettings: 'formedible-ai-builder-provider-settings',
  providerSecrets: 'formedible-ai-builder-provider-secrets',
  conversations: 'formedible-ai-builder-conversations',
  uiState: 'formedible-ai-builder-ui-state',
} as const;

export type StorageArea = 'local' | 'session';

export type ProviderSecretStorageMode = 'memory' | 'session' | 'local';

export interface PersistedUiState {
  readonly currentConversationId?: string;
}

export interface PersistedAIBuilderState {
  readonly providerSettings: ProviderSettings;
  readonly conversations: readonly AiConversation[];
  readonly currentConversationId?: string;
}

export interface ProviderSecretPersistencePreference {
  readonly mode: ProviderSecretStorageMode;
  readonly rememberKey: boolean;
}

export interface StoredProviderSecrets {
  readonly version: typeof AI_STORAGE_VERSION;
  readonly preference: ProviderSecretPersistencePreference;
  readonly secrets?: ProviderSecrets;
}

interface StorageEnvelope<TValue> {
  readonly version: typeof AI_STORAGE_VERSION;
  readonly data: TValue;
}

export interface ConversationUpdateResult {
  readonly conversations: readonly AiConversation[];
  readonly conversationId: string;
}

const supportedProviders = ['openai', 'anthropic', 'openrouter'] as const;
const supportedRoles = ['user', 'assistant', 'system'] as const;
const supportedStatuses = ['idle', 'submitted', 'streaming', 'completed', 'error', 'aborted'] as const;
const supportedFieldTypes = [
  'text',
  'email',
  'password',
  'url',
  'tel',
  'textarea',
  'number',
  'select',
  'radio',
  'checkbox',
  'switch',
  'date',
  'slider',
  'rating',
  'phone',
  'file',
  'array',
  'object',
  'multiSelect',
  'multiselect',
  'combobox',
  'autocomplete',
  'multiCombobox',
  'multicombobox',
  'color',
  'colorPicker',
  'duration',
  'location',
  'masked',
  'maskedInput',
] as const satisfies readonly FormedibleFieldType[];

export function canUseStorage(area: StorageArea = 'local'): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return typeof getStorage(area) !== 'undefined';
  } catch {
    return false;
  }
}

export function readJson<TValue>(key: string, fallback: TValue, parseValue: (value: unknown) => TValue, area: StorageArea = 'local'): TValue {
  if (!canUseStorage(area)) {
    return fallback;
  }

  try {
    const storedValue = getStorage(area).getItem(key);

    if (!storedValue) {
      return fallback;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return parseValue(parsedValue);
  } catch {
    return fallback;
  }
}

export function writeJson<TValue>(key: string, value: TValue, area: StorageArea = 'local'): void {
  if (!canUseStorage(area)) {
    return;
  }

  try {
    getStorage(area).setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function persistProviderSettings(providerSettings: ProviderSettings): void {
  writeJson(STORAGE_KEYS.providerSettings, createEnvelope(providerSettings));
}

export function persistConversations(conversations: readonly AiConversation[]): void {
  writeJson(STORAGE_KEYS.conversations, createEnvelope(conversations.map(sanitizeConversationForPersistence)));
}

export function persistUiState(uiState: PersistedUiState): void {
  writeJson(STORAGE_KEYS.uiState, createEnvelope(uiState));
}

export function readPersistedAIBuilderState(defaultProviderSettings: ProviderSettings, controlledProviderSettings?: ProviderSettings): PersistedAIBuilderState {
  const providerSettings = controlledProviderSettings ?? readProviderSettings(defaultProviderSettings);
  const conversations = readConversations();
  const uiState = readUiState();

  return withOptionalCurrentConversationId({
    providerSettings,
    conversations,
  }, uiState.currentConversationId);
}

export function persistProviderSecrets(secrets: ProviderSecrets, preference: ProviderSecretPersistencePreference): void {
  clearStoredProviderSecrets();

  if (preference.mode === 'memory') {
    return;
  }

  const storedSecrets: StoredProviderSecrets = preference.rememberKey
    ? { version: AI_STORAGE_VERSION, preference, secrets }
    : { version: AI_STORAGE_VERSION, preference };

  writeJson(STORAGE_KEYS.providerSecrets, storedSecrets, preference.mode);
}

export function readStoredProviderSecrets(area: Exclude<StorageArea, never> = 'session'): StoredProviderSecrets | undefined {
  return readJson(STORAGE_KEYS.providerSecrets, undefined, parseStoredProviderSecrets, area);
}

export function clearStoredProviderSecrets(): void {
  removeStorageItem(STORAGE_KEYS.providerSecrets, 'session');
  removeStorageItem(STORAGE_KEYS.providerSecrets, 'local');
}

export function clearConversations(): void {
  removeStorageItem(STORAGE_KEYS.conversations, 'local');
  removeStorageItem(STORAGE_KEYS.uiState, 'local');
}

export function exportConversation(conversation: AiConversation): AiConversationExport {
  return {
    version: AI_STORAGE_VERSION,
    conversation: sanitizeConversationForExport(conversation),
    exportedAt: Date.now(),
  };
}

export function createConversation(messages: readonly AiMessage[], formCode?: string, existingConversation?: AiConversation): AiConversation {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const now = Date.now();
  const conversationId = existingConversation?.id ?? `conversation_${now}_${Math.random().toString(36).slice(2)}`;
  const nextFormCode = formCode || existingConversation?.formCode;
  const generatedForms = createGeneratedFormSnapshots(conversationId, messages);
  const nextConversation = {
    id: conversationId,
    title: existingConversation?.title || firstUserMessage?.content.slice(0, 48) || 'New AI form',
    messages,
    createdAt: existingConversation?.createdAt ?? now,
    updatedAt: now,
    ...(generatedForms.length === 0 ? {} : { generatedForms }),
    ...(generatedForms.at(-1)?.id ? { activeGeneratedFormId: generatedForms.at(-1)?.id } : {}),
  } satisfies Omit<AiConversation, 'formCode'>;

  return nextFormCode ? { ...nextConversation, formCode: nextFormCode } : nextConversation;
}

export function upsertConversation(
  previousConversations: readonly AiConversation[],
  activeConversationId: string | undefined,
  nextMessages: readonly AiMessage[],
): ConversationUpdateResult {
  const existingConversation = previousConversations.find((conversationEntry) => conversationEntry.id === activeConversationId);
  const nextConversation = createConversation(nextMessages, getLastFormCode(nextMessages) || existingConversation?.formCode, existingConversation);

  if (existingConversation) {
    return {
      conversationId: nextConversation.id,
      conversations: previousConversations.map((conversationEntry) => (conversationEntry.id === nextConversation.id ? nextConversation : conversationEntry)),
    };
  }

  return {
    conversationId: nextConversation.id,
    conversations: [...previousConversations, nextConversation],
  };
}

export function getLastFormCode(messages: readonly AiMessage[]): string {
  const messageWithForm = [...messages].reverse().find((message) => message.formCode);
  return messageWithForm?.formCode ?? '';
}

function createGeneratedFormSnapshots(conversationId: string, messages: readonly AiMessage[]): readonly GeneratedFormSnapshot[] {
  return messages.flatMap((message, index) => {
    if (message.role !== 'assistant' || !message.formCode) {
      return [];
    }

    const hasParseErrors = (message.parseErrors?.length ?? 0) > 0;
    const status: GeneratedFormSnapshot['status'] = hasParseErrors ? 'parse-error' : message.formConfig ? 'parsed' : 'extracted';

    return [{
      id: `${conversationId}_form_${index}`,
      conversationId,
      messageId: message.id,
      formCode: message.formCode,
      ...(message.formConfig ? { formConfig: message.formConfig } : {}),
      ...(message.parseErrors ? { parseErrors: message.parseErrors } : {}),
      status,
      createdAt: message.updatedAt ?? message.timestamp ?? message.createdAt ?? Date.now(),
      ...(message.provider ? { provider: message.provider } : {}),
      ...(message.model ? { model: message.model } : {}),
    }];
  });
}

function readProviderSettings(defaultProviderSettings: ProviderSettings): ProviderSettings {
  return readJson(STORAGE_KEYS.providerSettings, defaultProviderSettings, (value) => parseProviderSettingsEnvelope(value) ?? parseProviderSettings(value) ?? defaultProviderSettings);
}

function readConversations(): readonly AiConversation[] {
  return readJson(STORAGE_KEYS.conversations, [], (value) => parseConversationsEnvelope(value) ?? parseConversations(value));
}

function readUiState(): PersistedUiState {
  return readJson(STORAGE_KEYS.uiState, {}, (value) => parseUiStateEnvelope(value) ?? parseUiState(value));
}

function createEnvelope<TValue>(data: TValue): StorageEnvelope<TValue> {
  return {
    version: AI_STORAGE_VERSION,
    data,
  };
}

function parseProviderSettingsEnvelope(value: unknown): ProviderSettings | undefined {
  return parseEnvelope(value, parseProviderSettings);
}

function parseConversationsEnvelope(value: unknown): readonly AiConversation[] | undefined {
  return parseEnvelope(value, parseConversations);
}

function parseUiStateEnvelope(value: unknown): PersistedUiState | undefined {
  return parseEnvelope(value, parseUiState);
}

function parseEnvelope<TValue>(value: unknown, parseData: (data: unknown) => TValue | undefined): TValue | undefined {
  if (!isRecord(value) || value.version !== AI_STORAGE_VERSION) {
    return undefined;
  }

  return parseData(value.data);
}

function parseProviderSettings(value: unknown): ProviderSettings | undefined {
  if (!isRecord(value) || !isAIProvider(value.provider) || typeof value.model !== 'string') {
    return undefined;
  }

  if ('endpoint' in value || 'baseURL' in value) {
    return undefined;
  }

  const temperature = parseOptionalNumber(value.temperature);
  const maxTokens = parseOptionalNumber(value.maxTokens);
  const thinkingBudgetTokens = parseOptionalNumber(value.thinkingBudgetTokens);

  if (value.provider !== 'anthropic' && thinkingBudgetTokens !== undefined) {
    return undefined;
  }

  const sharedSettings = {
    model: value.model,
    ...(temperature === undefined ? {} : { temperature }),
    ...(maxTokens === undefined ? {} : { maxTokens }),
  };

  if (value.provider === 'openai') {
    return {
      provider: value.provider,
      ...sharedSettings,
    };
  }

  if (value.provider === 'anthropic') {
    return {
      provider: value.provider,
      ...sharedSettings,
      ...(thinkingBudgetTokens === undefined ? {} : { thinkingBudgetTokens }),
    };
  }

  return {
    provider: value.provider,
    ...sharedSettings,
  };
}

function parseProviderSecrets(value: unknown): ProviderSecrets | undefined {
  if (!isRecord(value) || !isAIProvider(value.provider) || typeof value.apiKey !== 'string') {
    return undefined;
  }

  return {
    provider: value.provider,
    apiKey: value.apiKey,
  };
}

function parseStoredProviderSecrets(value: unknown): StoredProviderSecrets | undefined {
  if (!isRecord(value) || value.version !== AI_STORAGE_VERSION) {
    return undefined;
  }

  const preference = parseProviderSecretPersistencePreference(value.preference);

  if (!preference) {
    return undefined;
  }

  const secrets = parseProviderSecrets(value.secrets);

  if (preference.rememberKey && secrets) {
    return { version: AI_STORAGE_VERSION, preference, secrets };
  }

  return { version: AI_STORAGE_VERSION, preference };
}

function parseProviderSecretPersistencePreference(value: unknown): ProviderSecretPersistencePreference | undefined {
  if (!isRecord(value) || !isProviderSecretStorageMode(value.mode) || typeof value.rememberKey !== 'boolean') {
    return undefined;
  }

  return {
    mode: value.mode,
    rememberKey: value.rememberKey,
  };
}

function parseConversations(value: unknown): readonly AiConversation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const conversation = parseConversation(entry);
    return conversation ? [conversation] : [];
  });
}

function parseConversation(value: unknown): AiConversation | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') {
    return undefined;
  }

  const messages = parseMessages(value.messages);
  const createdAt = parseNumber(value.createdAt) ?? Date.now();
  const updatedAt = parseNumber(value.updatedAt) ?? createdAt;
  const generatedForms = parseGeneratedForms(value.generatedForms);
  const metadata = parseConversationMetadata(value.metadata);
  const baseConversation = {
    id: value.id,
    title: redactSecretString(value.title),
    messages,
    createdAt,
    updatedAt,
  } satisfies Omit<AiConversation, 'activeGeneratedFormId' | 'formCode' | 'generatedForms' | 'metadata'>;

  return {
    ...baseConversation,
    ...(generatedForms.length === 0 ? {} : { generatedForms }),
    ...(typeof value.activeGeneratedFormId === 'string' ? { activeGeneratedFormId: value.activeGeneratedFormId } : {}),
    ...(typeof value.formCode === 'string' ? { formCode: value.formCode } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function parseMessages(value: unknown): readonly AiMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const message = parseMessage(entry);
    return message ? [message] : [];
  });
}

function parseMessage(value: unknown): AiMessage | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || !isAiMessageRole(value.role) || typeof value.content !== 'string') {
    return undefined;
  }

  const parts = parseSafeMessageParts(value.parts);
  const events = parseSafeStreamEvents(value.events);
  const parseErrors = parseParseErrors(value.parseErrors);
  const formConfig = parseParsedFormConfig(value.formConfig);
  const generation = parseSafeGenerationMetadata(value.generation);

  return {
    id: value.id,
    role: value.role,
    content: redactSecretString(value.content),
    ...(typeof value.rawContent === 'string' ? { rawContent: redactSecretString(value.rawContent) } : {}),
    ...(typeof value.thinking === 'string' ? { thinking: redactSecretString(value.thinking) } : {}),
    ...(parts.length === 0 ? {} : { parts }),
    ...(events.length === 0 ? {} : { events }),
    ...(typeof value.formCode === 'string' ? { formCode: value.formCode } : {}),
    ...(formConfig ? { formConfig } : {}),
    ...(parseErrors.length === 0 ? {} : { parseErrors }),
    ...(parseNumber(value.timestamp) === undefined ? {} : { timestamp: parseNumber(value.timestamp) }),
    ...(parseNumber(value.createdAt) === undefined ? {} : { createdAt: parseNumber(value.createdAt) }),
    ...(parseNumber(value.updatedAt) === undefined ? {} : { updatedAt: parseNumber(value.updatedAt) }),
    ...(isAIProvider(value.provider) ? { provider: value.provider } : {}),
    ...(typeof value.model === 'string' ? { model: value.model } : {}),
    ...(generation ? { generation } : {}),
    ...(isAiMessageStatus(value.status) ? { status: value.status } : {}),
  };
}

function parseGeneratedForms(value: unknown): readonly GeneratedFormSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const generatedForm = parseGeneratedForm(entry);
    return generatedForm ? [generatedForm] : [];
  });
}

function parseGeneratedForm(value: unknown): GeneratedFormSnapshot | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.conversationId !== 'string' || typeof value.messageId !== 'string' || typeof value.formCode !== 'string') {
    return undefined;
  }

  if (value.status !== 'extracted' && value.status !== 'parsed' && value.status !== 'parse-error') {
    return undefined;
  }

  const createdAt = parseNumber(value.createdAt) ?? Date.now();
  const formConfig = parseParsedFormConfig(value.formConfig);
  const parseErrors = parseParseErrors(value.parseErrors);
  const metadata = parseSafeJsonRecord(value.metadata);

  return {
    id: value.id,
    conversationId: value.conversationId,
    messageId: value.messageId,
    formCode: value.formCode,
    ...(formConfig ? { formConfig } : {}),
    ...(parseErrors.length === 0 ? {} : { parseErrors }),
    status: value.status,
    createdAt,
    ...(isAIProvider(value.provider) ? { provider: value.provider } : {}),
    ...(typeof value.model === 'string' ? { model: value.model } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function parseParsedFormConfig(value: unknown): ParsedFormConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fields = parseFieldConfigs(value.fields);

  if (fields.length === 0) {
    return undefined;
  }

  const parsedFormOptions = parseFormOptions(value.formOptions);
  const formOptions = parsedFormOptions ?? { defaultValues: {} };
  const pages = parsePages(value.pages);
  const tabs = parseTabs(value.tabs);
  const progress = parseProgress(value.progress);
  const persistence = parsePersistence(value.persistence);
  const schema = parseSafeJsonValue(value.schema);
  const config = {
    fields,
    formOptions,
    ...(typeof value.title === 'string' ? { title: value.title } : {}),
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
    ...(schema === undefined ? {} : { schema }),
    ...(pages.length === 0 ? {} : { pages }),
    ...(tabs.length === 0 ? {} : { tabs }),
    ...(progress ? { progress } : {}),
    ...(persistence ? { persistence } : {}),
    ...(typeof value.submitLabel === 'string' ? { submitLabel: value.submitLabel } : {}),
    ...(typeof value.nextLabel === 'string' ? { nextLabel: value.nextLabel } : {}),
    ...(typeof value.previousLabel === 'string' ? { previousLabel: value.previousLabel } : {}),
    ...(typeof value.collapseLabel === 'string' ? { collapseLabel: value.collapseLabel } : {}),
    ...(typeof value.expandLabel === 'string' ? { expandLabel: value.expandLabel } : {}),
    ...(typeof value.formClassName === 'string' ? { formClassName: value.formClassName } : {}),
  } satisfies ParsedFormConfig;

  return config;
}

function parseFieldConfigs(value: unknown): readonly ParsedFieldConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const field = parseFieldConfig(entry);
    return field ? [field] : [];
  });
}

function parseFieldConfig(value: unknown): ParsedFieldConfig | undefined {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return undefined;
  }

  const options = parseFieldOptions(value.options);
  const optionSets = parseOptionSets(value.optionSets);
  const nestedFields = parseFieldConfigs(value.nestedFields);
  const arrayConfig = parseArrayConfig(value.arrayConfig);
  const objectConfig = parseObjectConfig(value.objectConfig);
  const field = {
    name: value.name,
    ...(isFormedibleFieldType(value.type) ? { type: value.type } : {}),
    ...(typeof value.label === 'string' ? { label: value.label } : {}),
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
    ...(typeof value.placeholder === 'string' ? { placeholder: value.placeholder } : {}),
    ...(typeof value.dynamicPlaceholder === 'boolean' ? { dynamicPlaceholder: value.dynamicPlaceholder } : {}),
    ...(typeof value.disabled === 'boolean' ? { disabled: value.disabled } : {}),
    ...(typeof value.required === 'boolean' ? { required: value.required } : {}),
    ...(typeof value.className === 'string' ? { className: value.className } : {}),
    ...(typeof value.inputClassName === 'string' ? { inputClassName: value.inputClassName } : {}),
    ...(parseNumber(value.page) === undefined ? {} : { page: parseNumber(value.page) }),
    ...(typeof value.tab === 'string' ? { tab: value.tab } : {}),
    ...(typeof value.section === 'string' ? { section: value.section } : {}),
    ...(typeof value.conditional === 'string' ? { conditional: value.conditional } : {}),
    ...(options.length === 0 ? {} : { options }),
    ...(optionSets ? { optionSets } : {}),
    ...(nestedFields.length === 0 ? {} : { nestedFields }),
    ...(arrayConfig ? { arrayConfig } : {}),
    ...(objectConfig ? { objectConfig } : {}),
    ...(parseNumber(value.min) === undefined ? {} : { min: parseNumber(value.min) }),
    ...(parseNumber(value.max) === undefined ? {} : { max: parseNumber(value.max) }),
    ...(parseNumber(value.step) === undefined ? {} : { step: parseNumber(value.step) }),
    ...(parseNumber(value.rows) === undefined ? {} : { rows: parseNumber(value.rows) }),
    ...(parseNumber(value.maxLength) === undefined ? {} : { maxLength: parseNumber(value.maxLength) }),
  } satisfies ParsedFieldConfig;

  return field;
}

function parseFieldOptions(value: unknown): readonly FormedibleFieldOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const options: FormedibleFieldOption[] = [];

  for (const entry of value) {
    if (typeof entry === 'string') {
      options.push(entry);
      continue;
    }

    if (!isRecord(entry) || typeof entry.value !== 'string' || typeof entry.label !== 'string') {
      continue;
    }

    options.push({
      value: entry.value,
      label: entry.label,
      ...(typeof entry.disabled === 'boolean' ? { disabled: entry.disabled } : {}),
      ...(typeof entry.description === 'string' ? { description: entry.description } : {}),
    });
  }

  return options;
}

function parseOptionSets(value: unknown): Readonly<Record<string, readonly FormedibleFieldOption[]>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries: [string, readonly FormedibleFieldOption[]][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    const options = parseFieldOptions(entryValue);

    if (options.length > 0) {
      entries.push([key, options]);
    }
  }

  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function parseObjectConfig(value: unknown): ParsedFieldConfig['objectConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fields = parseFieldConfigs(value.fields);
  const config = {
    ...(fields.length === 0 ? {} : { fields }),
    ...(value.layout === 'stack' || value.layout === 'grid' ? { layout: value.layout } : {}),
    ...(parseNumber(value.columns) === undefined ? {} : { columns: parseNumber(value.columns) }),
  } satisfies NonNullable<ParsedFieldConfig['objectConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseArrayConfig(value: unknown): ParsedFieldConfig['arrayConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const objectConfig = parseObjectConfig(value.objectConfig);
  const defaultValue = parseSafeJsonValue(value.defaultValue);
  const config = {
    ...(isArrayItemType(value.itemType) ? { itemType: value.itemType } : {}),
    ...(parseNumber(value.minItems) === undefined ? {} : { minItems: parseNumber(value.minItems) }),
    ...(parseNumber(value.maxItems) === undefined ? {} : { maxItems: parseNumber(value.maxItems) }),
    ...(typeof value.sortable === 'boolean' ? { sortable: value.sortable } : {}),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(objectConfig ? { objectConfig } : {}),
  } satisfies NonNullable<ParsedFieldConfig['arrayConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseFormOptions(value: unknown): ParsedFormConfig['formOptions'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const defaultValues = parseSafeJsonRecordAllowEmpty(value.defaultValues);
  const formOptions = {
    defaultValues: defaultValues ?? {},
  } satisfies ParsedFormConfig['formOptions'];

  return formOptions;
}

function parsePages(value: unknown): NonNullable<ParsedFormConfig['pages']> {
  if (!Array.isArray(value)) {
    return [];
  }

  const pages: NonNullable<ParsedFormConfig['pages']>[number][] = [];

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.title !== 'string') {
      continue;
    }

    const page = parseNumber(entry.page);

    if (page === undefined) {
      continue;
    }

    pages.push({
      page,
      title: entry.title,
      ...(typeof entry.description === 'string' ? { description: entry.description } : {}),
      ...(typeof entry.conditional === 'string' ? { conditional: entry.conditional } : {}),
    });
  }

  return pages;
}

function parseTabs(value: unknown): NonNullable<ParsedFormConfig['tabs']> {
  if (!Array.isArray(value)) {
    return [];
  }

  const tabs: NonNullable<ParsedFormConfig['tabs']>[number][] = [];

  for (const entry of value) {
    if (typeof entry === 'string') {
      tabs.push(entry);
      continue;
    }

    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.label !== 'string') {
      continue;
    }

    tabs.push({
      id: entry.id,
      label: entry.label,
      ...(typeof entry.description === 'string' ? { description: entry.description } : {}),
      ...(typeof entry.conditional === 'string' ? { conditional: entry.conditional } : {}),
    });
  }

  return tabs;
}

function parseProgress(value: unknown): ParsedFormConfig['progress'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const progress = {
    ...(typeof value.showSteps === 'boolean' ? { showSteps: value.showSteps } : {}),
    ...(typeof value.showPercentage === 'boolean' ? { showPercentage: value.showPercentage } : {}),
  } satisfies NonNullable<ParsedFormConfig['progress']>;

  return Object.keys(progress).length === 0 ? undefined : progress;
}

function parsePersistence(value: unknown): ParsedFormConfig['persistence'] | undefined {
  if (!isRecord(value) || typeof value.key !== 'string') {
    return undefined;
  }

  const exclude = parseStringArray(value.exclude);
  const persistence = {
    key: '[REDACTED]',
    ...(value.storage === 'localStorage' || value.storage === 'sessionStorage' ? { storage: value.storage } : {}),
    ...(parseNumber(value.debounceMs) === undefined ? {} : { debounceMs: parseNumber(value.debounceMs) }),
    ...(exclude.length === 0 ? {} : { exclude }),
    ...(typeof value.restoreOnMount === 'boolean' ? { restoreOnMount: value.restoreOnMount } : {}),
  } satisfies NonNullable<ParsedFormConfig['persistence']>;

  return persistence;
}

function parseParseErrors(value: unknown): readonly AiParseError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.message !== 'string') {
      return [];
    }

    return [{
      message: redactSecretString(entry.message),
      ...(typeof entry.code === 'string' ? { code: redactSecretString(entry.code) } : {}),
      ...(typeof entry.field === 'string' ? { field: redactSecretString(entry.field) } : {}),
      ...(parseNumber(entry.line) === undefined ? {} : { line: parseNumber(entry.line) }),
      ...(parseNumber(entry.column) === undefined ? {} : { column: parseNumber(entry.column) }),
      ...(parseSafeJsonValue(entry.details) === undefined ? {} : { details: redactUnknown(entry.details) }),
    }];
  });
}

function parseConversationMetadata(value: unknown): AiConversationMetadata | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const values = parseSafeJsonRecord(value.values);

  return {
    ...(typeof value.title === 'string' ? { title: redactSecretString(value.title) } : {}),
    ...(typeof value.description === 'string' ? { description: redactSecretString(value.description) } : {}),
    ...(isAIProvider(value.activeProvider) ? { activeProvider: value.activeProvider } : {}),
    ...(typeof value.activeModel === 'string' ? { activeModel: value.activeModel } : {}),
    ...(values ? { values } : {}),
  };
}

function parseUiState(value: unknown): PersistedUiState {
  if (!isRecord(value) || typeof value.currentConversationId !== 'string') {
    return {};
  }

  return { currentConversationId: value.currentConversationId };
}

function sanitizeConversationForPersistence(conversation: AiConversation): AiConversation {
  return sanitizeConversation(conversation);
}

function sanitizeConversationForExport(conversation: AiConversation): AiConversation {
  return sanitizeConversation(conversation);
}

function sanitizeConversation(conversation: AiConversation): AiConversation {
  const parsedConversation = parseConversation(conversation);
  return parsedConversation ?? {
    id: conversation.id,
    title: conversation.title,
    messages: [],
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function withOptionalCurrentConversationId(state: Omit<PersistedAIBuilderState, 'currentConversationId'>, currentConversationId: string | undefined): PersistedAIBuilderState {
  return currentConversationId ? { ...state, currentConversationId } : state;
}

function removeStorageItem(key: string, area: StorageArea): void {
  if (!canUseStorage(area)) {
    return;
  }

  try {
    getStorage(area).removeItem(key);
  } catch {
    return;
  }
}

function getStorage(area: StorageArea): Storage {
  return area === 'local' ? window.localStorage : window.sessionStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && supportedProviders.some((provider) => provider === value);
}

function isAiMessageRole(value: unknown): value is AiMessageRole {
  return typeof value === 'string' && supportedRoles.some((role) => role === value);
}

function isAiMessageStatus(value: unknown): value is AiMessageStatus {
  return typeof value === 'string' && supportedStatuses.some((status) => status === value);
}

function isFormedibleFieldType(value: unknown): value is FormedibleFieldType {
  return typeof value === 'string' && supportedFieldTypes.some((fieldType) => fieldType === value);
}

function isArrayItemType(value: unknown): value is FormedibleFieldType | 'string' | 'email' {
  return value === 'string' || isFormedibleFieldType(value);
}

function isProviderSecretStorageMode(value: unknown): value is ProviderSecretStorageMode {
  return value === 'memory' || value === 'session' || value === 'local';
}

function parseNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function parseOptionalNumber(value: unknown): number | undefined {
  return value === undefined ? undefined : parseNumber(value);
}

function parseStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}
