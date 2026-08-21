'use client';

import type {
  AIProvider,
  AiConversation,
  AiConversationExport,
  AiConversationMetadata,
  AiJsonValue,
  AiMessage,
  AiMessageRole,
  AiMessageStatus,
  AiParseError,
  ProviderModelCatalog,
  ProviderModelCatalogEntry,
  ProviderModelCatalogs,
  GeneratedFormSnapshot,
  ProviderSecrets,
  ProviderSettings,
} from '@formedible/ui/components/formedible/lib/ai-types';
import { createStreamEventSummary, parseSafeGenerationMetadata, parseSafeJsonRecord, parseSafeJsonRecordAllowEmpty, parseSafeJsonValue, parseSafeMessageParts, parseSafeStreamEvents, parseStreamEventSummary, redactSecretString, redactUnknown } from '@formedible/ui/components/formedible/lib/ai-safe-persistence';
import type { ParsedFieldConfig, ParsedFormConfig } from '@formedible/ui/components/formedible/lib/parser-types';
import type { FormedibleFieldOption, FormedibleFieldType } from '@formedible/ui/components/formedible/lib/types';

export const AI_STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  providerSettings: 'formedible-ai-builder-provider-settings',
  providerSecrets: 'formedible-ai-builder-provider-secrets',
  modelCatalogs: 'formedible-ai-builder-model-catalogs',
  conversations: 'formedible-ai-builder-conversations',
  uiState: 'formedible-ai-builder-ui-state',
} as const;

export type StorageArea = 'local' | 'session';

/**
 * Conversation redaction split: the persistence path writes to this origin's own
 * localStorage, so formConfig must round-trip verbatim for restored forms to keep
 * working (only message text secrets stay redacted). The export path leaves the
 * origin entirely, so it keeps full redaction including formConfig.
 */
export type ConversationSanitizeMode = 'persistence' | 'export';

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

export function writeJson<TValue>(key: string, value: TValue, area: StorageArea = 'local'): boolean {
  if (!canUseStorage(area)) {
    return false;
  }

  try {
    getStorage(area).setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    reportStorageWriteFailure(key, area, error);
    return false;
  }
}

const reportedStorageWriteFailures = new Set<string>();

function reportStorageWriteFailure(key: string, area: StorageArea, error: unknown): void {
  const failureId = `${area}:${key}`;

  if (reportedStorageWriteFailures.has(failureId)) {
    return;
  }

  reportedStorageWriteFailures.add(failureId);

  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const quotaHint = isQuotaExceededError(error)
    ? ' The browser storage quota was exceeded; clear old conversations to free space.'
    : '';
  console.error(`[formedible] Failed to write storage key "${key}" (${area} storage): ${detail}.${quotaHint} The latest state was not persisted and will be lost on reload.`);
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false;
  }

  return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22;
}

export function persistProviderSettings(providerSettings: ProviderSettings): void {
  writeJson(STORAGE_KEYS.providerSettings, createEnvelope(providerSettings));
}

export function persistProviderModelCatalog(catalog: ProviderModelCatalog): void {
  const catalogs = readProviderModelCatalogs();
  writeJson(STORAGE_KEYS.modelCatalogs, createEnvelope({ ...catalogs, [catalog.provider]: catalog }));
}

export function readProviderModelCatalogs(): ProviderModelCatalogs {
  return readJson(STORAGE_KEYS.modelCatalogs, {}, (value) => parseEnvelope(value, parseProviderModelCatalogs) ?? parseProviderModelCatalogs(value));
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

export function createConversationId(): string {
  return `conversation_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function createConversation(messages: readonly AiMessage[], formCode?: string, existingConversation?: AiConversation, reservedConversationId?: string): AiConversation {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const now = Date.now();
  const conversationId = existingConversation?.id ?? reservedConversationId ?? createConversationId();
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
  const firstMessageId = nextMessages[0]?.id;
  const existingConversation = previousConversations.find((conversationEntry) => conversationEntry.id === activeConversationId)
    ?? previousConversations.find((conversationEntry) => firstMessageId !== undefined && conversationEntry.messages[0]?.id === firstMessageId);

  if (existingConversation) {
    const nextConversation = createConversation(nextMessages, getLastFormCode(nextMessages) || existingConversation.formCode, existingConversation);

    return {
      conversationId: nextConversation.id,
      conversations: previousConversations.map((conversationEntry) => (conversationEntry.id === nextConversation.id ? nextConversation : conversationEntry)),
    };
  }

  const nextConversation = createConversation(nextMessages, getLastFormCode(nextMessages), undefined, activeConversationId);

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
  return readJson(STORAGE_KEYS.conversations, [], (value) => parseConversationsEnvelope(value, 'persistence') ?? parseConversations(value, 'persistence'));
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

function parseConversationsEnvelope(value: unknown, mode: ConversationSanitizeMode): readonly AiConversation[] | undefined {
  return parseEnvelope(value, (data) => parseConversations(data, mode));
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

function parseProviderModelCatalogs(value: unknown): ProviderModelCatalogs {
  if (!isRecord(value)) {
    return {};
  }

  const entries: [AIProvider, ProviderModelCatalog][] = [];

  for (const provider of supportedProviders) {
    const catalog = parseProviderModelCatalog(value[provider], provider);

    if (catalog) {
      entries.push([provider, catalog]);
    }
  }

  return Object.fromEntries(entries) as ProviderModelCatalogs;
}

function parseProviderModelCatalog(value: unknown, provider: AIProvider): ProviderModelCatalog | undefined {
  if (!isRecord(value) || value.provider !== provider) {
    return undefined;
  }

  const fetchedAt = parseNumber(value.fetchedAt);
  const models = parseProviderModelCatalogEntries(value.models);

  if (fetchedAt === undefined) {
    return undefined;
  }

  return {
    provider,
    models,
    fetchedAt,
    ...(typeof value.error === 'string' ? { error: value.error } : {}),
  };
}

function parseProviderModelCatalogEntries(value: unknown): readonly ProviderModelCatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const model = parseProviderModelCatalogEntry(entry);
    return model ? [model] : [];
  });
}

function parseProviderModelCatalogEntry(value: unknown): ProviderModelCatalogEntry | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return undefined;
  }

  const contextLength = parseOptionalNumber(value.contextLength);

  return {
    id: value.id,
    ...(typeof value.label === 'string' ? { label: value.label } : {}),
    ...(typeof value.createdAt === 'string' ? { createdAt: value.createdAt } : {}),
    ...(contextLength === undefined ? {} : { contextLength }),
    ...(typeof value.inputPricePerMillionTokens === 'string' ? { inputPricePerMillionTokens: value.inputPricePerMillionTokens } : {}),
    ...(typeof value.outputPricePerMillionTokens === 'string' ? { outputPricePerMillionTokens: value.outputPricePerMillionTokens } : {}),
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

function parseConversations(value: unknown, mode: ConversationSanitizeMode): readonly AiConversation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const conversation = parseConversation(entry, mode);
    return conversation ? [conversation] : [];
  });
}

function parseConversation(value: unknown, mode: ConversationSanitizeMode): AiConversation | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.title !== 'string') {
    return undefined;
  }

  const messages = parseMessages(value.messages, mode);
  const createdAt = parseNumber(value.createdAt) ?? Date.now();
  const updatedAt = parseNumber(value.updatedAt) ?? createdAt;
  const generatedForms = parseGeneratedForms(value.generatedForms, mode);
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

function parseMessages(value: unknown, mode: ConversationSanitizeMode): readonly AiMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const message = parseMessage(entry, mode);
    return message ? [message] : [];
  });
}

function parseMessage(value: unknown, mode: ConversationSanitizeMode): AiMessage | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || !isAiMessageRole(value.role) || typeof value.content !== 'string') {
    return undefined;
  }

  const parts = parseSafeMessageParts(value.parts);
  const eventSummary = parseStreamEventSummary(value.eventSummary) ?? createStreamEventSummary(parseSafeStreamEvents(value.events));
  const parseErrors = parseParseErrors(value.parseErrors);
  const formConfig = parseParsedFormConfig(value.formConfig, mode);
  const generation = parseSafeGenerationMetadata(value.generation);

  return {
    id: value.id,
    role: value.role,
    content: redactSecretString(value.content),
    ...(typeof value.rawContent === 'string' ? { rawContent: redactSecretString(value.rawContent) } : {}),
    ...(typeof value.thinking === 'string' ? { thinking: redactSecretString(value.thinking) } : {}),
    ...(parts.length === 0 ? {} : { parts }),
    ...(eventSummary ? { eventSummary } : {}),
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

function parseGeneratedForms(value: unknown, mode: ConversationSanitizeMode): readonly GeneratedFormSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const generatedForm = parseGeneratedForm(entry, mode);
    return generatedForm ? [generatedForm] : [];
  });
}

function parseGeneratedForm(value: unknown, mode: ConversationSanitizeMode): GeneratedFormSnapshot | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.conversationId !== 'string' || typeof value.messageId !== 'string' || typeof value.formCode !== 'string') {
    return undefined;
  }

  if (value.status !== 'extracted' && value.status !== 'parsed' && value.status !== 'parse-error') {
    return undefined;
  }

  const createdAt = parseNumber(value.createdAt) ?? Date.now();
  const formConfig = parseParsedFormConfig(value.formConfig, mode);
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

function parseParsedFormConfig(value: unknown, mode: ConversationSanitizeMode): ParsedFormConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fields = parseFieldConfigs(value.fields, mode);

  if (fields.length === 0) {
    return undefined;
  }

  const parsedFormOptions = parseFormOptions(value.formOptions, mode);
  const formOptions = parsedFormOptions ?? { defaultValues: {} };
  const pages = parsePages(value.pages);
  const tabs = parseTabs(value.tabs);
  const progress = parseProgress(value.progress);
  const persistence = parsePersistence(value.persistence, mode);
  const schema = parseStrictJsonValue(value.schema, mode);
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
    ...(typeof value.autoSubmitOnChange === 'boolean' ? { autoSubmitOnChange: value.autoSubmitOnChange } : {}),
    ...(parseNumber(value.autoSubmitDebounceMs) === undefined ? {} : { autoSubmitDebounceMs: parseNumber(value.autoSubmitDebounceMs) }),
    ...(typeof value.disabled === 'boolean' ? { disabled: value.disabled } : {}),
    ...(typeof value.loading === 'boolean' ? { loading: value.loading } : {}),
    ...(typeof value.showSubmitButton === 'boolean' ? { showSubmitButton: value.showSubmitButton } : {}),
  } satisfies ParsedFormConfig;

  return config;
}

function parseFieldConfigs(value: unknown, mode: ConversationSanitizeMode): readonly ParsedFieldConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const field = parseFieldConfig(entry, mode);
    return field ? [field] : [];
  });
}

function parseFieldConfig(value: unknown, mode: ConversationSanitizeMode): ParsedFieldConfig | undefined {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return undefined;
  }

  const options = parseFieldOptions(value.options);
  const optionSets = parseOptionSets(value.optionSets);
  const nestedFields = parseFieldConfigs(value.nestedFields, mode);
  const arrayConfig = parseArrayConfig(value.arrayConfig, mode);
  const objectConfig = parseObjectConfig(value.objectConfig, mode);
  const section = parseFieldSection(value.section);
  const textareaConfig = parseTextareaConfig(value.textareaConfig);
  const passwordConfig = parsePasswordConfig(value.passwordConfig);
  const numberConfig = parseNumberConfig(value.numberConfig);
  const datalist = parseFieldOptions(value.datalist);
  const help = parseHelpConfig(value.help);
  const autocompleteConfig = parseAutocompleteConfig(value.autocompleteConfig);
  const maskedInputConfig = parseMaskedInputConfig(value.maskedInputConfig);
  const colorConfig = parseColorConfig(value.colorConfig);
  const dateConfig = parseDateConfig(value.dateConfig);
  const sliderConfig = parseSliderConfig(value.sliderConfig);
  const ratingConfig = parseRatingConfig(value.ratingConfig);
  const multiSelectConfig = parseMultiSelectConfig(value.multiSelectConfig);
  const comboboxConfig = parseComboboxConfig(value.comboboxConfig);
  const multiComboboxConfig = parseMultiComboboxConfig(value.multiComboboxConfig);
  const phoneConfig = parsePhoneConfig(value.phoneConfig);
  const durationConfig = parseDurationConfig(value.durationConfig);
  const locationConfig = parseLocationConfig(value.locationConfig);
  const fileConfig = parseFileConfig(value.fileConfig);
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
    ...(section ? { section } : {}),
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
    ...(typeof value.mask === 'string' ? { mask: value.mask } : {}),
    ...(textareaConfig ? { textareaConfig } : {}),
    ...(passwordConfig ? { passwordConfig } : {}),
    ...(numberConfig ? { numberConfig } : {}),
    ...(datalist.length === 0 ? {} : { datalist }),
    ...(help === undefined ? {} : { help }),
    ...(autocompleteConfig ? { autocompleteConfig } : {}),
    ...(maskedInputConfig ? { maskedInputConfig } : {}),
    ...(colorConfig ? { colorConfig } : {}),
    ...(dateConfig ? { dateConfig } : {}),
    ...(sliderConfig ? { sliderConfig } : {}),
    ...(ratingConfig ? { ratingConfig } : {}),
    ...(multiSelectConfig ? { multiSelectConfig } : {}),
    ...(comboboxConfig ? { comboboxConfig } : {}),
    ...(multiComboboxConfig ? { multiComboboxConfig } : {}),
    ...(phoneConfig ? { phoneConfig } : {}),
    ...(durationConfig ? { durationConfig } : {}),
    ...(locationConfig ? { locationConfig } : {}),
    ...(fileConfig ? { fileConfig } : {}),
  } satisfies ParsedFieldConfig;

  return field;
}

function parseTextareaConfig(value: unknown): ParsedFieldConfig['textareaConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(parseNumber(value.rows) === undefined ? {} : { rows: parseNumber(value.rows) }),
    ...(parseNumber(value.cols) === undefined ? {} : { cols: parseNumber(value.cols) }),
    ...(parseNumber(value.maxLength) === undefined ? {} : { maxLength: parseNumber(value.maxLength) }),
    ...(isTextareaResize(value.resize) ? { resize: value.resize } : {}),
    ...(typeof value.showWordCount === 'boolean' ? { showWordCount: value.showWordCount } : {}),
  } satisfies NonNullable<ParsedFieldConfig['textareaConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parsePasswordConfig(value: unknown): ParsedFieldConfig['passwordConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(typeof value.showToggle === 'boolean' ? { showToggle: value.showToggle } : {}),
    ...(typeof value.strengthMeter === 'boolean' ? { strengthMeter: value.strengthMeter } : {}),
    ...(parseNumber(value.minStrength) === undefined ? {} : { minStrength: parseNumber(value.minStrength) }),
  } satisfies NonNullable<ParsedFieldConfig['passwordConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseNumberConfig(value: unknown): ParsedFieldConfig['numberConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(parseNumber(value.min) === undefined ? {} : { min: parseNumber(value.min) }),
    ...(parseNumber(value.max) === undefined ? {} : { max: parseNumber(value.max) }),
    ...(parseNumber(value.step) === undefined ? {} : { step: parseNumber(value.step) }),
  } satisfies NonNullable<ParsedFieldConfig['numberConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseHelpConfig(value: unknown): ParsedFieldConfig['help'] | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(typeof value.tooltip === 'string' ? { tooltip: value.tooltip } : {}),
    ...(typeof value.text === 'string' ? { text: value.text } : {}),
  } satisfies Exclude<NonNullable<ParsedFieldConfig['help']>, string>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseAutocompleteConfig(value: unknown): ParsedFieldConfig['autocompleteConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const options = parseFieldOptions(value.options);
  const config = {
    ...(options.length === 0 ? {} : { options }),
    ...(parseNumber(value.debounceMs) === undefined ? {} : { debounceMs: parseNumber(value.debounceMs) }),
    ...(parseNumber(value.minChars) === undefined ? {} : { minChars: parseNumber(value.minChars) }),
    ...(parseNumber(value.maxResults) === undefined ? {} : { maxResults: parseNumber(value.maxResults) }),
    ...(typeof value.allowCustom === 'boolean' ? { allowCustom: value.allowCustom } : {}),
    ...(typeof value.placeholder === 'string' ? { placeholder: value.placeholder } : {}),
    ...(typeof value.noOptionsText === 'string' ? { noOptionsText: value.noOptionsText } : {}),
    ...(typeof value.loadingText === 'string' ? { loadingText: value.loadingText } : {}),
  } satisfies NonNullable<ParsedFieldConfig['autocompleteConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseMaskedInputConfig(value: unknown): ParsedFieldConfig['maskedInputConfig'] | undefined {
  if (!isRecord(value) || typeof value.mask !== 'string') {
    return undefined;
  }

  return {
    mask: value.mask,
    ...(typeof value.placeholder === 'string' ? { placeholder: value.placeholder } : {}),
    ...(typeof value.showMask === 'boolean' ? { showMask: value.showMask } : {}),
    ...(typeof value.guide === 'boolean' ? { guide: value.guide } : {}),
    ...(typeof value.keepCharPositions === 'boolean' ? { keepCharPositions: value.keepCharPositions } : {}),
  } satisfies NonNullable<ParsedFieldConfig['maskedInputConfig']>;
}

function parseColorConfig(value: unknown): ParsedFieldConfig['colorConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const presetColors = parseStringArray(value.presetColors);
  const config = {
    ...(isColorFormat(value.format) ? { format: value.format } : {}),
    ...(typeof value.showPreview === 'boolean' ? { showPreview: value.showPreview } : {}),
    ...(presetColors.length === 0 ? {} : { presetColors }),
    ...(typeof value.allowCustom === 'boolean' ? { allowCustom: value.allowCustom } : {}),
  } satisfies NonNullable<ParsedFieldConfig['colorConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseDateConfig(value: unknown): ParsedFieldConfig['dateConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const minDate = parseDateConfigBoundary(value.minDate);
  const maxDate = parseDateConfigBoundary(value.maxDate);
  const config = {
    ...(minDate === undefined ? {} : { minDate }),
    ...(maxDate === undefined ? {} : { maxDate }),
    ...(typeof value.format === 'string' ? { format: value.format } : {}),
  } satisfies NonNullable<ParsedFieldConfig['dateConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseDateConfigBoundary(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  return undefined;
}

function parseSliderConfig(value: unknown): ParsedFieldConfig['sliderConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const valueMapping = parseSliderValueMapping(value.valueMapping);
  const marks = parseSliderMarks(value.marks);
  const config = {
    ...(parseNumber(value.min) === undefined ? {} : { min: parseNumber(value.min) }),
    ...(parseNumber(value.max) === undefined ? {} : { max: parseNumber(value.max) }),
    ...(parseNumber(value.step) === undefined ? {} : { step: parseNumber(value.step) }),
    ...(valueMapping.length === 0 ? {} : { valueMapping }),
    ...(typeof value.valueLabelPrefix === 'string' ? { valueLabelPrefix: value.valueLabelPrefix } : {}),
    ...(typeof value.valueLabelSuffix === 'string' ? { valueLabelSuffix: value.valueLabelSuffix } : {}),
    ...(parseNumber(value.valueDisplayPrecision) === undefined ? {} : { valueDisplayPrecision: parseNumber(value.valueDisplayPrecision) }),
    ...(typeof value.showRawValue === 'boolean' ? { showRawValue: value.showRawValue } : {}),
    ...(typeof value.showValue === 'boolean' ? { showValue: value.showValue } : {}),
    ...(marks.length === 0 ? {} : { marks }),
  } satisfies NonNullable<ParsedFieldConfig['sliderConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseSliderValueMapping(value: unknown): NonNullable<NonNullable<ParsedFieldConfig['sliderConfig']>['valueMapping']> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const sliderValue = parseNumber(entry.sliderValue);
    const displayValue = parseSerializableReactNode(entry.displayValue);

    if (sliderValue === undefined || displayValue === undefined) {
      return [];
    }

    return [{
      sliderValue,
      displayValue,
      ...(parseSerializableReactNode(entry.label) === undefined ? {} : { label: parseSerializableReactNode(entry.label) }),
    }];
  });
}

function parseSliderMarks(value: unknown): NonNullable<NonNullable<ParsedFieldConfig['sliderConfig']>['marks']> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const markValue = parseNumber(entry.value);
    const label = parseSerializableReactNode(entry.label);

    if (markValue === undefined || label === undefined) {
      return [];
    }

    return [{ value: markValue, label }];
  });
}

function parseRatingConfig(value: unknown): ParsedFieldConfig['ratingConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(parseNumber(value.max) === undefined ? {} : { max: parseNumber(value.max) }),
    ...(typeof value.allowHalf === 'boolean' ? { allowHalf: value.allowHalf } : {}),
    ...(isRatingIcon(value.icon) ? { icon: value.icon } : {}),
    ...(isRatingSize(value.size) ? { size: value.size } : {}),
    ...(typeof value.showValue === 'boolean' ? { showValue: value.showValue } : {}),
  } satisfies NonNullable<ParsedFieldConfig['ratingConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseMultiSelectConfig(value: unknown): ParsedFieldConfig['multiSelectConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(parseNumber(value.maxSelections) === undefined ? {} : { maxSelections: parseNumber(value.maxSelections) }),
    ...(typeof value.searchable === 'boolean' ? { searchable: value.searchable } : {}),
    ...(typeof value.creatable === 'boolean' ? { creatable: value.creatable } : {}),
    ...(typeof value.placeholder === 'string' ? { placeholder: value.placeholder } : {}),
    ...(typeof value.noOptionsText === 'string' ? { noOptionsText: value.noOptionsText } : {}),
  } satisfies NonNullable<ParsedFieldConfig['multiSelectConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseComboboxConfig(value: unknown): ParsedFieldConfig['comboboxConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(typeof value.searchable === 'boolean' ? { searchable: value.searchable } : {}),
    ...(typeof value.placeholder === 'string' ? { placeholder: value.placeholder } : {}),
    ...(typeof value.searchPlaceholder === 'string' ? { searchPlaceholder: value.searchPlaceholder } : {}),
    ...(typeof value.noOptionsText === 'string' ? { noOptionsText: value.noOptionsText } : {}),
  } satisfies NonNullable<ParsedFieldConfig['comboboxConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseMultiComboboxConfig(value: unknown): ParsedFieldConfig['multiComboboxConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const multiSelectConfig = parseMultiSelectConfig(value);
  const comboboxConfig = parseComboboxConfig(value);
  const config = {
    ...(multiSelectConfig ?? {}),
    ...(comboboxConfig ?? {}),
  } satisfies NonNullable<ParsedFieldConfig['multiComboboxConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parsePhoneConfig(value: unknown): ParsedFieldConfig['phoneConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const allowedCountries = parseStringArray(value.allowedCountries);
  const config = {
    ...(typeof value.defaultCountry === 'string' ? { defaultCountry: value.defaultCountry } : {}),
    ...(isPhoneFormat(value.format) ? { format: value.format } : {}),
    ...(allowedCountries.length === 0 ? {} : { allowedCountries }),
    ...(typeof value.placeholder === 'string' ? { placeholder: value.placeholder } : {}),
  } satisfies NonNullable<ParsedFieldConfig['phoneConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseDurationConfig(value: unknown): ParsedFieldConfig['durationConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(isDurationFormat(value.format) ? { format: value.format } : {}),
    ...(parseNumber(value.maxHours) === undefined ? {} : { maxHours: parseNumber(value.maxHours) }),
    ...(parseNumber(value.maxMinutes) === undefined ? {} : { maxMinutes: parseNumber(value.maxMinutes) }),
    ...(parseNumber(value.maxSeconds) === undefined ? {} : { maxSeconds: parseNumber(value.maxSeconds) }),
    ...(typeof value.showLabels === 'boolean' ? { showLabels: value.showLabels } : {}),
  } satisfies NonNullable<ParsedFieldConfig['durationConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseLocationConfig(value: unknown): ParsedFieldConfig['locationConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const defaultLocation = parseLocationValue(value.defaultLocation);
  const searchOptions = parseLocationSearchOptions(value.searchOptions);
  const config = {
    ...(defaultLocation ? { defaultLocation } : {}),
    ...(typeof value.enableSearch === 'boolean' ? { enableSearch: value.enableSearch } : {}),
    ...(typeof value.enableGeolocation === 'boolean' ? { enableGeolocation: value.enableGeolocation } : {}),
    ...(typeof value.enableManualEntry === 'boolean' ? { enableManualEntry: value.enableManualEntry } : {}),
    ...(typeof value.showMap === 'boolean' ? { showMap: value.showMap } : {}),
    ...(typeof value.searchPlaceholder === 'string' ? { searchPlaceholder: value.searchPlaceholder } : {}),
    ...(searchOptions ? { searchOptions } : {}),
  } satisfies NonNullable<ParsedFieldConfig['locationConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseLocationValue(value: unknown): NonNullable<NonNullable<ParsedFieldConfig['locationConfig']>['defaultLocation']> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const lat = parseNumber(value.lat);
  const lng = parseNumber(value.lng);

  if (lat === undefined || lng === undefined) {
    return undefined;
  }

  return {
    lat,
    lng,
    ...(typeof value.address === 'string' ? { address: value.address } : {}),
    ...(typeof value.city === 'string' ? { city: value.city } : {}),
    ...(typeof value.state === 'string' ? { state: value.state } : {}),
    ...(typeof value.country === 'string' ? { country: value.country } : {}),
  };
}

function parseLocationSearchOptions(value: unknown): NonNullable<NonNullable<ParsedFieldConfig['locationConfig']>['searchOptions']> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(parseNumber(value.debounceMs) === undefined ? {} : { debounceMs: parseNumber(value.debounceMs) }),
    ...(parseNumber(value.minQueryLength) === undefined ? {} : { minQueryLength: parseNumber(value.minQueryLength) }),
    ...(parseNumber(value.maxResults) === undefined ? {} : { maxResults: parseNumber(value.maxResults) }),
  } satisfies NonNullable<NonNullable<ParsedFieldConfig['locationConfig']>['searchOptions']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseFileConfig(value: unknown): ParsedFieldConfig['fileConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const config = {
    ...(typeof value.accept === 'string' ? { accept: value.accept } : {}),
    ...(typeof value.multiple === 'boolean' ? { multiple: value.multiple } : {}),
    ...(parseNumber(value.maxSize) === undefined ? {} : { maxSize: parseNumber(value.maxSize) }),
    ...(parseNumber(value.maxFiles) === undefined ? {} : { maxFiles: parseNumber(value.maxFiles) }),
  } satisfies NonNullable<ParsedFieldConfig['fileConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseFieldSection(value: unknown): ParsedFieldConfig['section'] | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (!isRecord(value) || typeof value.title !== 'string') {
    return undefined;
  }

  return {
    title: value.title,
    ...(typeof value.description === 'string' ? { description: value.description } : {}),
  };
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

function parseObjectConfig(value: unknown, mode: ConversationSanitizeMode): ParsedFieldConfig['objectConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fields = parseFieldConfigs(value.fields, mode);
  const config = {
    ...(fields.length === 0 ? {} : { fields }),
    ...(value.layout === 'stack' || value.layout === 'grid' ? { layout: value.layout } : {}),
    ...(parseNumber(value.columns) === undefined ? {} : { columns: parseNumber(value.columns) }),
  } satisfies NonNullable<ParsedFieldConfig['objectConfig']>;

  return Object.keys(config).length === 0 ? undefined : config;
}

function parseArrayConfig(value: unknown, mode: ConversationSanitizeMode): ParsedFieldConfig['arrayConfig'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const objectConfig = parseObjectConfig(value.objectConfig, mode);
  const defaultValue = mode === 'persistence' ? parsePlainJsonValue(value.defaultValue) : parseSafeJsonValue(value.defaultValue);
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

function parseFormOptions(value: unknown, mode: ConversationSanitizeMode): ParsedFormConfig['formOptions'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const defaultValues = mode === 'persistence'
    ? parsePlainJsonRecordAllowEmpty(value.defaultValues)
    : parseSafeJsonRecordAllowEmpty(value.defaultValues);
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

function parsePersistence(value: unknown, mode: ConversationSanitizeMode): ParsedFormConfig['persistence'] | undefined {
  if (!isRecord(value) || typeof value.key !== 'string') {
    return undefined;
  }

  const exclude = parseStringArray(value.exclude);
  const persistence = {
    ...(mode === 'persistence' ? { key: value.key } : { key: '[REDACTED]' }),
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
  return sanitizeConversation(conversation, 'persistence');
}

function sanitizeConversationForExport(conversation: AiConversation): AiConversation {
  return sanitizeConversation(conversation, 'export');
}

function sanitizeConversation(conversation: AiConversation, mode: ConversationSanitizeMode): AiConversation {
  const parsedConversation = parseConversation(conversation, mode);
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

function parseStrictJsonValue(value: unknown, mode: ConversationSanitizeMode): AiJsonValue | undefined {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return mode === 'persistence' ? value : redactSecretString(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    const entries: AiJsonValue[] = [];

    for (const entry of value) {
      const parsedEntry = parseStrictJsonValue(entry, mode);

      if (parsedEntry === undefined) {
        return undefined;
      }

      entries.push(parsedEntry);
    }

    return entries;
  }

  if (!isPlainJsonRecord(value)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    if (mode === 'export' && isSecretJsonKey(key)) {
      entries.push([key, '[REDACTED]']);
      continue;
    }

    const parsedEntry = parseStrictJsonValue(entryValue, mode);

    if (parsedEntry === undefined) {
      return undefined;
    }

    entries.push([key, parsedEntry]);
  }

  return Object.fromEntries(entries);
}

function parsePlainJsonValue(value: unknown): AiJsonValue | undefined {
  if (value === null || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    const entries: AiJsonValue[] = [];

    for (const entry of value) {
      const parsedEntry = parsePlainJsonValue(entry);

      if (parsedEntry !== undefined) {
        entries.push(parsedEntry);
      }
    }

    return entries;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    const parsedEntry = parsePlainJsonValue(entryValue);

    if (parsedEntry !== undefined) {
      entries.push([key, parsedEntry]);
    }
  }

  return Object.fromEntries(entries);
}

function parsePlainJsonRecordAllowEmpty(value: unknown): Readonly<Record<string, AiJsonValue>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries: [string, AiJsonValue][] = [];

  for (const [key, entryValue] of Object.entries(value)) {
    const parsedEntry = parsePlainJsonValue(entryValue);

    if (parsedEntry !== undefined) {
      entries.push([key, parsedEntry]);
    }
  }

  return Object.fromEntries(entries);
}

function isPlainJsonRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function isSecretJsonKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();
  return normalizedKey === 'key'
    || normalizedKey.includes('apikey')
    || normalizedKey.includes('api_key')
    || normalizedKey.includes('secret')
    || normalizedKey.includes('token')
    || normalizedKey.includes('authorization')
    || normalizedKey.includes('password')
    || normalizedKey.includes('bearer')
    || normalizedKey.includes('credential');
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

function isTextareaResize(value: unknown): value is NonNullable<NonNullable<ParsedFieldConfig['textareaConfig']>['resize']> {
  return value === 'none' || value === 'both' || value === 'horizontal' || value === 'vertical' || value === 'block' || value === 'inline';
}

function isColorFormat(value: unknown): value is NonNullable<NonNullable<ParsedFieldConfig['colorConfig']>['format']> {
  return value === 'hex' || value === 'rgb' || value === 'hsl';
}

function isRatingIcon(value: unknown): value is NonNullable<NonNullable<ParsedFieldConfig['ratingConfig']>['icon']> {
  return value === 'star' || value === 'heart' || value === 'thumbs';
}

function isRatingSize(value: unknown): value is NonNullable<NonNullable<ParsedFieldConfig['ratingConfig']>['size']> {
  return value === 'sm' || value === 'md' || value === 'lg';
}

function isPhoneFormat(value: unknown): value is NonNullable<NonNullable<ParsedFieldConfig['phoneConfig']>['format']> {
  return value === 'national' || value === 'international';
}

function isDurationFormat(value: unknown): value is NonNullable<NonNullable<ParsedFieldConfig['durationConfig']>['format']> {
  return value === 'hms' || value === 'hm' || value === 'ms' || value === 'hours' || value === 'minutes' || value === 'seconds';
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

function parseSerializableReactNode(value: unknown): string | number | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return parseNumber(value);
}

function parseStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}
