'use client';

import { useEffect, useRef, useState } from 'react';

import { AiFormRenderer } from '@/components/formedible/ai/ai-form-renderer';
import { ChatInterface } from '@/components/formedible/ai/chat-interface';
import { createDefaultProviderSecrets, createDefaultProviderSettings, ProviderSelection, validateProviderAccess } from '@/components/formedible/ai/provider-selection';
import { Button } from '@/components/ui/button';
import type { AiConversation, AiMessage, AIBuilderMode, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
import type { FormedibleFormValues } from '@/lib/formedible/types';
import { cn } from '@/lib/utils';

export const STORAGE_KEYS = {
  providerSettings: 'formedible-ai-builder-provider-settings',
  conversations: 'formedible-ai-builder-conversations',
  uiState: 'formedible-ai-builder-ui-state',
} as const;

export const AI_BUILDER_DEFAULT_MODE: AIBuilderMode = 'client';

interface PersistedUiState {
  readonly currentConversationId?: string;
}

export interface PersistedAIBuilderState {
  readonly providerSettings: ProviderSettings;
  readonly conversations: readonly AiConversation[];
  readonly currentConversationId?: string;
}

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

export function canUseStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function readJson<TValue>(key: string, fallback: TValue): TValue {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as TValue) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<TValue>(key: string, value: TValue) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function readPersistedAIBuilderState(controlledProviderSettings?: ProviderSettings): PersistedAIBuilderState {
  return {
    providerSettings: controlledProviderSettings ?? readJson(STORAGE_KEYS.providerSettings, createDefaultProviderSettings()),
    conversations: readJson(STORAGE_KEYS.conversations, [] as readonly AiConversation[]),
    currentConversationId: readJson<PersistedUiState>(STORAGE_KEYS.uiState, {}).currentConversationId,
  };
}

export interface ConversationUpdateResult {
  readonly conversations: readonly AiConversation[];
  readonly conversationId: string;
}

export function createConversation(messages: readonly AiMessage[], formCode?: string, existingConversation?: AiConversation): AiConversation {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const now = Date.now();

  return {
    id: existingConversation?.id ?? `conversation_${now}_${Math.random().toString(36).slice(2)}`,
    title: existingConversation?.title || firstUserMessage?.content.slice(0, 48) || 'New AI form',
    messages,
    formCode,
    createdAt: existingConversation?.createdAt ?? now,
    updatedAt: now,
  };
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

function getLastFormCode(messages: readonly AiMessage[]): string {
  const messageWithForm = [...messages].reverse().find((message) => message.formCode);
  return messageWithForm?.formCode ?? '';
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
  const [internalProviderSettings, setInternalProviderSettings] = useState<ProviderSettings>(() => readPersistedAIBuilderState(controlledProviderSettings).providerSettings);
  const [internalProviderSecrets, setInternalProviderSecrets] = useState<ProviderSecrets>(() => createDefaultProviderSecrets(controlledProviderSettings?.provider));
  const [conversations, setConversations] = useState<readonly AiConversation[]>(() => readPersistedAIBuilderState().conversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(() => readPersistedAIBuilderState().currentConversationId);
  const currentConversationIdRef = useRef<string | undefined>(currentConversationId);
  const providerSettings = controlledProviderSettings ?? internalProviderSettings;
  const providerSecrets = controlledProviderSecrets ?? internalProviderSecrets;
  const currentConversation = conversations.find((conversation) => conversation.id === currentConversationId);
  const messages = currentConversation?.messages ?? [];
  const formCode = currentConversation?.formCode ?? getLastFormCode(messages);
  const providerValidationError = mode === 'client' ? validateProviderAccess(providerSettings, providerSecrets) : undefined;

  useEffect(() => {
    if (!controlledProviderSettings) {
      writeJson(STORAGE_KEYS.providerSettings, internalProviderSettings);
    }
  }, [controlledProviderSettings, internalProviderSettings]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.conversations, conversations);
  }, [conversations]);

  useEffect(() => {
    currentConversationIdRef.current = currentConversationId;
    writeJson(STORAGE_KEYS.uiState, { currentConversationId });
  }, [currentConversationId]);

  function updateProviderAccess(nextSettings: ProviderSettings, nextSecrets: ProviderSecrets) {
    setInternalProviderSettings(nextSettings);
    setInternalProviderSecrets(nextSecrets);
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
