'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { AiPicker } from '@formedible/ui/components/formedible/ai-picker';
import { AiFormRenderer } from '@formedible/ui/components/formedible/ai/ai-form-renderer';
import { ChatInterface } from '@formedible/ui/components/formedible/ai/chat-interface';
import { createDefaultProviderSecrets, createDefaultProviderSettings, validateProviderAccess } from '@formedible/ui/components/formedible/ai/provider-selection';
import { SidebarContent } from '@formedible/ui/components/formedible/ai/sidebar-content';
import { SidebarIcons, type SidebarView } from '@formedible/ui/components/formedible/ai/sidebar-icons';
import { Button } from '@formedible/ui/components/button';
import { fetchProviderModels } from '@formedible/ui/components/formedible/lib/ai-model-catalog';
import { clearStoredProviderSecrets, createConversationId, exportConversation, getLastFormCode, persistConversations, persistProviderModelCatalog, persistProviderSecrets, persistProviderSettings, persistUiState, readPersistedAIBuilderState, readProviderModelCatalogs, readStoredProviderSecrets, upsertConversation } from '@formedible/ui/components/formedible/lib/ai-storage';
import type { ProviderSecretPersistencePreference } from '@formedible/ui/components/formedible/lib/ai-storage';
import type { AIProvider, AiConversation, AiMessage, AiParserConfig, AIBuilderMode, ProviderModelCatalog, ProviderModelCatalogs, ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';
import { defaultParserConfig, generateSystemPrompt, mergeParserConfig } from '@formedible/ui/components/formedible/lib/parser-config-schema';
import type { ParserConfig } from '@formedible/ui/components/formedible/lib/parser-config-schema';
import type { FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

export const AI_BUILDER_DEFAULT_MODE: AIBuilderMode = 'client';

export interface AIBuilderProps {
  readonly className?: string;
  readonly mode?: AIBuilderMode;
  readonly providerSettings?: ProviderSettings;
  readonly providerSecrets?: ProviderSecrets;
  readonly onProviderSettingsChange?: (providerSettings: ProviderSettings) => void;
  readonly onProviderSecretsChange?: (providerSecrets: ProviderSecrets) => void;
  readonly onFormGenerated?: (formCode: string) => void;
  readonly onFormSubmit?: (formData: FormedibleFormValues) => void | Promise<void>;
}

export interface AIBuilderProviderAccess {
  readonly settings: ProviderSettings;
  readonly secrets: ProviderSecrets;
}

function readProviderSecretPersistencePreference(): ProviderSecretPersistencePreference {
  return readStoredProviderSecrets('session')?.preference ?? readStoredProviderSecrets('local')?.preference ?? { mode: 'memory', rememberKey: false };
}

function toAiParserConfig(config: ParserConfig): AiParserConfig {
  return {
    strictValidation: config.strictValidation,
    inferDefaultValues: config.enableSchemaInference,
    ...(config.selectFields ? { allowedFieldTypes: config.systemPromptFields } : {}),
  };
}

function hasStreamingMessage(conversations: readonly AiConversation[]): boolean {
  return conversations.some((conversation) => conversation.messages.some((message) => message.status === 'streaming'));
}

function shouldPersistMessages(messages: readonly AiMessage[]): boolean {
  return messages.length > 0 && messages.every((message) => message.status !== 'streaming');
}

export interface ConversationSelectionContext {
  readonly draftConversationId: string;
  readonly currentConversationId: string | undefined;
}

export interface TargetedConversationUpdate {
  readonly conversations: readonly AiConversation[];
  readonly conversationId: string;
  readonly selectedConversationId: string | undefined;
}

export interface ConversationDeletionUpdate {
  readonly conversations: readonly AiConversation[];
  readonly currentConversationId: string | undefined;
}

function findConversationForMessages(previousConversations: readonly AiConversation[], targetConversationId: string, firstMessageId: string | undefined): AiConversation | undefined {
  return previousConversations.find((conversation) => conversation.id === targetConversationId)
    ?? previousConversations.find((conversation) => firstMessageId !== undefined && conversation.messages[0]?.id === firstMessageId);
}

export function applyMessagesToConversation(
  previousConversations: readonly AiConversation[],
  targetConversationId: string,
  nextMessages: readonly AiMessage[],
  selection: ConversationSelectionContext,
): TargetedConversationUpdate | undefined {
  const firstMessageId = nextMessages[0]?.id;
  const existingConversation = findConversationForMessages(previousConversations, targetConversationId, firstMessageId);

  if (existingConversation) {
    const result = upsertConversation(previousConversations, existingConversation.id, nextMessages);

    return { conversations: result.conversations, conversationId: result.conversationId, selectedConversationId: undefined };
  }

  if (targetConversationId !== selection.draftConversationId) {
    return undefined;
  }

  const result = upsertConversation(previousConversations, targetConversationId, nextMessages);

  return {
    conversations: result.conversations,
    conversationId: result.conversationId,
    selectedConversationId: selection.currentConversationId === undefined ? result.conversationId : undefined,
  };
}

export function removeConversationFromList(
  previousConversations: readonly AiConversation[],
  conversationId: string,
  currentConversationId: string | undefined,
): ConversationDeletionUpdate {
  const conversations = previousConversations.filter((conversation) => conversation.id !== conversationId);
  const nextCurrentConversationId = currentConversationId === conversationId ? conversations.at(-1)?.id : currentConversationId;

  return { conversations, currentConversationId: nextCurrentConversationId };
}

export function applyFormCodeToConversation(
  previousConversations: readonly AiConversation[],
  conversationId: string,
  formCode: string,
  updatedAt: number,
): readonly AiConversation[] | undefined {
  if (!previousConversations.some((conversation) => conversation.id === conversationId)) {
    return undefined;
  }

  return previousConversations.map((conversation) => (conversation.id === conversationId ? { ...conversation, formCode, updatedAt } : conversation));
}

export function resolveInitialProviderAccess(
  controlledProviderSettings?: ProviderSettings,
  controlledProviderSecrets?: ProviderSecrets,
): AIBuilderProviderAccess {
  const persistedState = readPersistedAIBuilderState(createDefaultProviderSettings(), controlledProviderSettings);
  const settings = persistedState.providerSettings;
  const storedSecrets = readStoredProviderSecrets('session')?.secrets ?? readStoredProviderSecrets('local')?.secrets;
  const secrets = controlledProviderSecrets && controlledProviderSecrets.provider === settings.provider
    ? controlledProviderSecrets
    : storedSecrets && storedSecrets.provider === settings.provider
      ? storedSecrets
    : createDefaultProviderSecrets(settings.provider);

  return { settings, secrets };
}

export function AIBuilder({
  className,
  mode = AI_BUILDER_DEFAULT_MODE,
  providerSettings: controlledProviderSettings,
  providerSecrets: controlledProviderSecrets,
  onProviderSettingsChange,
  onProviderSecretsChange,
  onFormGenerated,
  onFormSubmit,
}: AIBuilderProps) {
  const [internalProviderAccess, setInternalProviderAccess] = useState<AIBuilderProviderAccess>(() => resolveInitialProviderAccess(controlledProviderSettings, controlledProviderSecrets));
  const [providerSecretPersistence, setProviderSecretPersistence] = useState<ProviderSecretPersistencePreference>(() => readProviderSecretPersistencePreference());
  const [parserConfig, setParserConfig] = useState<ParserConfig>(() => mergeParserConfig(defaultParserConfig));
  const [modelCatalogs, setModelCatalogs] = useState<ProviderModelCatalogs>(() => readProviderModelCatalogs());
  const [refreshingProvider, setRefreshingProvider] = useState<AIProvider | undefined>(undefined);
  const [conversations, setConversations] = useState<readonly AiConversation[]>(() => readPersistedAIBuilderState(createDefaultProviderSettings()).conversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(() => readPersistedAIBuilderState(createDefaultProviderSettings()).currentConversationId);
  const [draftConversationId, setDraftConversationId] = useState<string>(() => createConversationId());
  const [activeSidebarView, setActiveSidebarView] = useState<SidebarView | null>('history');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentConversationIdRef = useRef<string | undefined>(currentConversationId);
  const draftConversationIdRef = useRef<string>(draftConversationId);
  const conversationsRef = useRef<readonly AiConversation[]>(conversations);
  const providerSettings = controlledProviderSettings ?? internalProviderAccess.settings;
  const providerSecrets = controlledProviderSecrets ?? (internalProviderAccess.secrets.provider === providerSettings.provider ? internalProviderAccess.secrets : createDefaultProviderSecrets(providerSettings.provider));
  const currentConversation = conversations.find((conversation) => conversation.id === currentConversationId);
  const messages = currentConversation?.messages ?? [];
  const formCode = currentConversation?.formCode ?? getLastFormCode(messages);
  const providerValidationError = mode === 'client' ? validateProviderAccess(providerSettings, providerSecrets) : undefined;
  const systemPrompt = useMemo(() => generateSystemPrompt(parserConfig), [parserConfig]);
  const aiParserConfig = useMemo(() => toAiParserConfig(parserConfig), [parserConfig]);

  useEffect(() => {
    if (!controlledProviderSettings) {
      persistProviderSettings(internalProviderAccess.settings);
    }
  }, [controlledProviderSettings, internalProviderAccess.settings]);

  useEffect(() => {
    if (!controlledProviderSecrets) {
      persistProviderSecrets(internalProviderAccess.secrets, providerSecretPersistence);
    }
  }, [controlledProviderSecrets, internalProviderAccess.secrets, providerSecretPersistence]);

  useEffect(() => {
    if (controlledProviderSecrets || internalProviderAccess.secrets.provider === providerSettings.provider) {
      return;
    }

    setInternalProviderAccess((previousAccess) => ({
      ...previousAccess,
      secrets: createDefaultProviderSecrets(providerSettings.provider),
    }));
  }, [controlledProviderSecrets, internalProviderAccess.secrets.provider, providerSettings.provider]);

  useEffect(() => {
    if (providerValidationError || modelCatalogs[providerSettings.provider] || providerSecrets.apiKey.trim().length === 0 || refreshingProvider) {
      return;
    }

    void refreshProviderModels();
  }, [modelCatalogs, providerSecrets.apiKey, providerSettings.provider, providerValidationError, refreshingProvider]);

  useEffect(() => {
    if (hasStreamingMessage(conversations)) {
      return;
    }

    persistConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
    persistUiState(currentConversationId ? { currentConversationId } : {});
  }, [currentConversationId]);

  function updateProviderAccess(nextSettings: ProviderSettings, nextSecrets: ProviderSecrets) {
    setInternalProviderAccess({ settings: nextSettings, secrets: nextSecrets });
    onProviderSettingsChange?.(nextSettings);
    onProviderSecretsChange?.(nextSecrets);
  }

  function updateProviderSecretPersistence(nextPreference: ProviderSecretPersistencePreference) {
    setProviderSecretPersistence(nextPreference);
  }

  function clearProviderSecrets() {
    clearStoredProviderSecrets();
    updateProviderAccess(providerSettings, createDefaultProviderSecrets(providerSettings.provider));
  }

  async function refreshProviderModels() {
    const provider = providerSettings.provider;
    setRefreshingProvider(provider);

    try {
      const catalog = await fetchProviderModels({ provider, apiKey: providerSecrets.apiKey });
      updateProviderModelCatalog(catalog);
    } finally {
      setRefreshingProvider((previousProvider) => (previousProvider === provider ? undefined : previousProvider));
    }
  }

  function updateProviderModelCatalog(catalog: ProviderModelCatalog) {
    setModelCatalogs((previousCatalogs) => ({ ...previousCatalogs, [catalog.provider]: catalog }));
    persistProviderModelCatalog(catalog);
  }

  function commitConversations(nextConversations: readonly AiConversation[]) {
    conversationsRef.current = nextConversations;
    setConversations(nextConversations);
  }

  function selectConversationId(conversationId: string | undefined) {
    currentConversationIdRef.current = conversationId;
    setCurrentConversationId(conversationId);
  }

  function rotateDraftConversationId() {
    const nextDraftConversationId = createConversationId();
    draftConversationIdRef.current = nextDraftConversationId;
    setDraftConversationId(nextDraftConversationId);
  }

  function updateMessages(conversationId: string, nextMessages: readonly AiMessage[]) {
    const result = applyMessagesToConversation(conversationsRef.current, conversationId, nextMessages, {
      draftConversationId: draftConversationIdRef.current,
      currentConversationId: currentConversationIdRef.current,
    });

    if (!result) {
      return;
    }

    commitConversations(result.conversations);

    if (result.selectedConversationId !== undefined) {
      selectConversationId(result.selectedConversationId);
    }

    if (draftConversationIdRef.current === conversationId) {
      rotateDraftConversationId();
    }

    if (shouldPersistMessages(nextMessages)) {
      persistConversations(result.conversations);
    }
  }

  function updateFormCode(conversationId: string, nextFormCode: string) {
    const nextConversations = applyFormCodeToConversation(conversationsRef.current, conversationId, nextFormCode, Date.now());

    if (nextConversations) {
      commitConversations(nextConversations);
    }

    onFormGenerated?.(nextFormCode);
  }

  function startNewConversation() {
    rotateDraftConversationId();
    selectConversationId(undefined);
  }

  function deleteConversation(conversationId: string) {
    const result = removeConversationFromList(conversationsRef.current, conversationId, currentConversationIdRef.current);

    commitConversations(result.conversations);
    selectConversationId(result.currentConversationId);
  }

  function downloadConversation(conversation: AiConversation) {
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      return;
    }

    const exportedConversation = exportConversation(conversation);
    const fileName = `${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'formedible-conversation'}.json`;
    const blob = new Blob([JSON.stringify(exportedConversation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function toggleSidebarCollapse() {
    setIsSidebarCollapsed((previousValue) => !previousValue);
  }

  return (
    <section className={cn('flex h-full min-h-0 overflow-hidden rounded-lg border bg-background', className)} data-conversation-id={currentConversationId ?? 'new'}>
      <SidebarIcons isCollapsed={isSidebarCollapsed} activeView={activeSidebarView} onToggleCollapse={toggleSidebarCollapse} onViewChange={setActiveSidebarView} />
      <SidebarContent
        activeView={activeSidebarView}
        isCollapsed={isSidebarCollapsed}
        conversations={conversations}
        currentConversation={currentConversation}
        currentConversationId={currentConversationId}
          providerSettings={providerSettings}
          providerSecrets={providerSecrets}
          providerSecretPersistence={providerSecretPersistence}
          modelCatalogs={modelCatalogs}
          refreshingProvider={refreshingProvider}
          parserConfig={parserConfig}
          onProviderAccessChange={updateProviderAccess}
          onProviderSecretPersistenceChange={updateProviderSecretPersistence}
          onClearProviderSecrets={clearProviderSecrets}
          onRefreshProviderModels={refreshProviderModels}
          onParserConfigChange={setParserConfig}
        onSelectConversation={selectConversationId}
        onDeleteConversation={deleteConversation}
        onNewConversation={startNewConversation}
        onExportConversation={downloadConversation}
      />
      <div className="grid min-h-0 min-w-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
          {isSidebarCollapsed ? <AiPicker variant="panel" settings={providerSettings} secrets={providerSecrets} modelCatalog={modelCatalogs[providerSettings.provider]} isRefreshingModels={refreshingProvider === providerSettings.provider} onRefreshModels={refreshProviderModels} persistencePreference={providerSecretPersistence} onPersistencePreferenceChange={updateProviderSecretPersistence} onClearStoredSecrets={clearProviderSecrets} onChange={updateProviderAccess} /> : null}
          {providerValidationError ? <p className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{providerValidationError}</p> : null}
          <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
            <p className="truncate text-sm text-muted-foreground">{currentConversation ? currentConversation.title : 'New conversation'}</p>
            <Button type="button" variant="outline" size="sm" onClick={startNewConversation}>New conversation</Button>
          </div>
          <ChatInterface
            providerSettings={providerSettings}
            providerSecrets={providerSecrets}
            mode={mode}
            messages={messages}
            conversationId={currentConversationId ?? draftConversationId}
            onMessagesChange={updateMessages}
            onFormGenerated={updateFormCode}
            systemPrompt={systemPrompt}
            parserConfig={aiParserConfig}
            className="min-h-0 flex-1"
          />
        </div>
        <div className="min-h-0 min-w-0 overflow-auto rounded-lg border p-4">
          {formCode ? (
            <AiFormRenderer code={formCode} parserConfig={aiParserConfig} onSubmit={onFormSubmit} className="space-y-4" />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-muted-foreground">Generated forms appear here.</div>
          )}
        </div>
      </div>
    </section>
  );
}

export type { AiConversation, AIBuilderMode, ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';
export { STORAGE_KEYS } from '@formedible/ui/components/formedible/lib/ai-storage';
