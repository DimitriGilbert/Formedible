'use client';

import { useEffect, useRef, useState } from 'react';

import { AiFormRenderer } from '@formedible/ui/components/formedible/ai/ai-form-renderer';
import { AgentSettings } from '@formedible/ui/components/formedible/ai/agent-settings';
import { ChatInterface } from '@formedible/ui/components/formedible/ai/chat-interface';
import { createDefaultProviderSecrets, createDefaultProviderSettings, ProviderSelection, validateProviderAccess } from '@formedible/ui/components/formedible/ai/provider-selection';
import { SidebarContent } from '@formedible/ui/components/formedible/ai/sidebar-content';
import { SidebarIcons, type SidebarView } from '@formedible/ui/components/formedible/ai/sidebar-icons';
import { Button } from '@formedible/ui/components/button';
import { clearStoredProviderSecrets, exportConversation, getLastFormCode, persistConversations, persistProviderSecrets, persistProviderSettings, persistUiState, readPersistedAIBuilderState, readStoredProviderSecrets, upsertConversation } from '@formedible/ui/components/formedible/lib/ai-storage';
import type { ProviderSecretPersistencePreference } from '@formedible/ui/components/formedible/lib/ai-storage';
import type { AiConversation, AiMessage, AiParserConfig, AIBuilderMode, ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';
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
  const [conversations, setConversations] = useState<readonly AiConversation[]>(() => readPersistedAIBuilderState(createDefaultProviderSettings()).conversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(() => readPersistedAIBuilderState(createDefaultProviderSettings()).currentConversationId);
  const [activeSidebarView, setActiveSidebarView] = useState<SidebarView | null>('history');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentConversationIdRef = useRef<string | undefined>(currentConversationId);
  const providerSettings = controlledProviderSettings ?? internalProviderAccess.settings;
  const providerSecrets = controlledProviderSecrets ?? (internalProviderAccess.secrets.provider === providerSettings.provider ? internalProviderAccess.secrets : createDefaultProviderSecrets(providerSettings.provider));
  const currentConversation = conversations.find((conversation) => conversation.id === currentConversationId);
  const messages = currentConversation?.messages ?? [];
  const formCode = currentConversation?.formCode ?? getLastFormCode(messages);
  const providerValidationError = mode === 'client' ? validateProviderAccess(providerSettings, providerSecrets) : undefined;
  const systemPrompt = generateSystemPrompt(parserConfig);
  const aiParserConfig = toAiParserConfig(parserConfig);

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

  function updateMessages(nextMessages: readonly AiMessage[]) {
    setConversations((previousConversations) => {
      const result = upsertConversation(previousConversations, currentConversationIdRef.current, nextMessages);
      currentConversationIdRef.current = result.conversationId;
      setCurrentConversationId(result.conversationId);

      return result.conversations;
    });
  }

  function updateFormCode(nextFormCode: string) {
    const activeConversationId = currentConversationIdRef.current;
    setConversations((previousConversations) => previousConversations.map((conversationEntry) => (conversationEntry.id === activeConversationId ? { ...conversationEntry, formCode: nextFormCode, updatedAt: Date.now() } : conversationEntry)));
    onFormGenerated?.(nextFormCode);
  }

  function startNewConversation() {
    currentConversationIdRef.current = undefined;
    setCurrentConversationId(undefined);
  }

  function selectConversation(conversationId: string) {
    currentConversationIdRef.current = conversationId;
    setCurrentConversationId(conversationId);
  }

  function deleteConversation(conversationId: string) {
    setConversations((previousConversations) => {
      const nextConversations = previousConversations.filter((conversation) => conversation.id !== conversationId);

      if (currentConversationIdRef.current === conversationId) {
        const nextCurrentConversationId = nextConversations.at(-1)?.id;
        currentConversationIdRef.current = nextCurrentConversationId;
        setCurrentConversationId(nextCurrentConversationId);
      }

      return nextConversations;
    });
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
    <section className={cn('flex min-h-[640px] overflow-hidden rounded-lg border bg-background', className)} data-conversation-id={currentConversationId ?? 'new'}>
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
          parserConfig={parserConfig}
          onProviderAccessChange={updateProviderAccess}
          onProviderSecretPersistenceChange={updateProviderSecretPersistence}
          onClearProviderSecrets={clearProviderSecrets}
          onParserConfigChange={setParserConfig}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={startNewConversation}
        onExportConversation={downloadConversation}
      />
      <div className="grid min-w-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <div className="flex min-h-0 flex-col gap-4">
          {isSidebarCollapsed ? <div className="grid gap-3"><ProviderSelection settings={providerSettings} secrets={providerSecrets} persistencePreference={providerSecretPersistence} onChange={updateProviderAccess} onPersistencePreferenceChange={updateProviderSecretPersistence} onClearStoredSecrets={clearProviderSecrets} /><AgentSettings settings={providerSettings} secrets={providerSecrets} onChange={updateProviderAccess} /></div> : null}
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
            onMessagesChange={updateMessages}
            onFormGenerated={updateFormCode}
            conversationId={currentConversationId}
            systemPrompt={systemPrompt}
            parserConfig={aiParserConfig}
            className="min-h-[420px]"
          />
        </div>
        <div className="min-h-0 rounded-lg border p-4">
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
