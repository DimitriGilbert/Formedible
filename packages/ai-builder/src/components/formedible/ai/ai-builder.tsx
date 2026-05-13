'use client';

import { useEffect, useRef, useState } from 'react';

import { AiFormRenderer } from '@/components/formedible/ai/ai-form-renderer';
import { ChatInterface } from '@/components/formedible/ai/chat-interface';
import { createDefaultProviderSecrets, createDefaultProviderSettings, ProviderSelection, validateProviderAccess } from '@/components/formedible/ai/provider-selection';
import { Button } from '@/components/ui/button';
import { getLastFormCode, persistConversations, persistProviderSettings, persistUiState, readPersistedAIBuilderState, upsertConversation } from '@/lib/formedible/ai-storage';
import type { AiConversation, AiMessage, AIBuilderMode, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
import type { FormedibleFormValues } from '@/lib/formedible/types';
import { cn } from '@/lib/utils';

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

export function resolveInitialProviderAccess(
  controlledProviderSettings?: ProviderSettings,
  controlledProviderSecrets?: ProviderSecrets,
): AIBuilderProviderAccess {
  const persistedState = readPersistedAIBuilderState(createDefaultProviderSettings(), controlledProviderSettings);
  const settings = persistedState.providerSettings;
  const secrets = controlledProviderSecrets && controlledProviderSecrets.provider === settings.provider
    ? controlledProviderSecrets
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
  const [conversations, setConversations] = useState<readonly AiConversation[]>(() => readPersistedAIBuilderState(createDefaultProviderSettings()).conversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(() => readPersistedAIBuilderState(createDefaultProviderSettings()).currentConversationId);
  const currentConversationIdRef = useRef<string | undefined>(currentConversationId);
  const providerSettings = controlledProviderSettings ?? internalProviderAccess.settings;
  const providerSecrets = controlledProviderSecrets ?? (internalProviderAccess.secrets.provider === providerSettings.provider ? internalProviderAccess.secrets : createDefaultProviderSecrets(providerSettings.provider));
  const currentConversation = conversations.find((conversation) => conversation.id === currentConversationId);
  const messages = currentConversation?.messages ?? [];
  const formCode = currentConversation?.formCode ?? getLastFormCode(messages);
  const providerValidationError = mode === 'client' ? validateProviderAccess(providerSettings, providerSecrets) : undefined;

  useEffect(() => {
    if (!controlledProviderSettings) {
      persistProviderSettings(internalProviderAccess.settings);
    }
  }, [controlledProviderSettings, internalProviderAccess.settings]);

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

  return (
    <section className={cn('grid min-h-[640px] gap-4 lg:grid-cols-[360px_1fr]', className)} data-conversation-id={currentConversationId ?? 'new'}>
      <div className="flex min-h-0 flex-col gap-4">
        <ProviderSelection settings={providerSettings} secrets={providerSecrets} onChange={updateProviderAccess} />
        {providerValidationError ? <p className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{providerValidationError}</p> : null}
        <div className="grid gap-2 rounded-lg border p-3">
          <Button type="button" variant="outline" onClick={startNewConversation}>New conversation</Button>
          {conversations.length > 0 ? (
            <div className="grid gap-1">
              {conversations.map((conversation) => (
                <Button key={conversation.id} type="button" variant={conversation.id === currentConversationId ? 'default' : 'ghost'} onClick={() => selectConversation(conversation.id)}>
                  {conversation.title}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        <ChatInterface
          providerSettings={providerSettings}
          providerSecrets={providerSecrets}
          mode={mode}
          messages={messages}
          onMessagesChange={updateMessages}
          onFormGenerated={updateFormCode}
          conversationId={currentConversationId}
          className="min-h-[420px]"
        />
      </div>
      <div className="min-h-0 rounded-lg border p-4">
        {formCode ? (
          <AiFormRenderer code={formCode} onSubmit={onFormSubmit} className="space-y-4" />
        ) : (
          <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-muted-foreground">Generated forms appear here.</div>
        )}
      </div>
    </section>
  );
}

export type { AiConversation, AIBuilderMode, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
export { STORAGE_KEYS } from '@/lib/formedible/ai-storage';
