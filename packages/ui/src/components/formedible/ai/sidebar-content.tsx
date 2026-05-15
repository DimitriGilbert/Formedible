'use client';

import { RawOutputPanel } from '@formedible/ui/components/formedible/ai/raw-output-panel';
import { AgentSettings } from '@formedible/ui/components/formedible/ai/agent-settings';
import { ConversationHistory } from '@formedible/ui/components/formedible/ai/conversation-history';
import { ParserSettings } from '@formedible/ui/components/formedible/ai/parser-settings';
import type { SidebarView } from '@formedible/ui/components/formedible/ai/sidebar-icons';
import { ProviderSelection } from '@formedible/ui/components/formedible/ai/provider-selection';
import type { AIBuilderProviderAccess } from '@formedible/ui/components/formedible/ai/ai-builder';
import type { ProviderSecretPersistencePreference } from '@formedible/ui/components/formedible/lib/ai-storage';
import type { AiConversation, ProviderSecrets, ProviderSettings } from '@formedible/ui/components/formedible/lib/ai-types';
import type { ParserConfig } from '@formedible/ui/components/formedible/lib/parser-config-schema';
import { cn } from '@formedible/ui/lib/utils';

export interface SidebarContentProps {
  readonly activeView: SidebarView | null;
  readonly isCollapsed: boolean;
  readonly conversations: readonly AiConversation[];
  readonly currentConversation?: AiConversation;
  readonly currentConversationId?: string;
  readonly providerSettings: ProviderSettings;
  readonly providerSecrets: ProviderSecrets;
  readonly providerSecretPersistence: ProviderSecretPersistencePreference;
  readonly parserConfig: ParserConfig;
  readonly onProviderAccessChange: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly onProviderSecretPersistenceChange: (preference: ProviderSecretPersistencePreference) => void;
  readonly onClearProviderSecrets: () => void;
  readonly onParserConfigChange: (config: ParserConfig) => void;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onDeleteConversation: (conversationId: string) => void;
  readonly onNewConversation: () => void;
  readonly onExportConversation: (conversation: AiConversation) => void;
  readonly className?: string;
}

function DebugPanel({ conversation }: { readonly conversation?: AiConversation }) {
  const latestAssistantMessage = [...(conversation?.messages ?? [])].reverse().find((message) => message.role === 'assistant');

  return (
    <section className="rounded-lg border bg-background p-3" aria-labelledby="ai-builder-debug-title">
      <h2 id="ai-builder-debug-title" className="text-sm font-semibold">Raw and debug output</h2>
      <p className="mt-1 text-xs text-muted-foreground">Inspect the latest assistant response, parser output, stream events, and redacted metadata.</p>
      {latestAssistantMessage ? (
        <RawOutputPanel message={latestAssistantMessage} className="mt-3" />
      ) : (
        <div className="mt-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground">No assistant output is available for this conversation.</div>
      )}
    </section>
  );
}

function ProviderPanel({ providerSettings, providerSecrets, providerSecretPersistence, onProviderAccessChange, onProviderSecretPersistenceChange, onClearProviderSecrets }: Pick<SidebarContentProps, 'providerSettings' | 'providerSecrets' | 'providerSecretPersistence' | 'onProviderAccessChange' | 'onProviderSecretPersistenceChange' | 'onClearProviderSecrets'>) {
  const access: AIBuilderProviderAccess = { settings: providerSettings, secrets: providerSecrets };

  return <ProviderSelection settings={access.settings} secrets={access.secrets} persistencePreference={providerSecretPersistence} onChange={onProviderAccessChange} onPersistencePreferenceChange={onProviderSecretPersistenceChange} onClearStoredSecrets={onClearProviderSecrets} />;
}

function ModelPanel({ providerSettings, providerSecrets, onProviderAccessChange }: Pick<SidebarContentProps, 'providerSettings' | 'providerSecrets' | 'onProviderAccessChange'>) {
  return <AgentSettings settings={providerSettings} secrets={providerSecrets} onChange={onProviderAccessChange} />;
}

export function SidebarContent({ activeView, isCollapsed, conversations, currentConversation, currentConversationId, providerSettings, providerSecrets, providerSecretPersistence, parserConfig, onProviderAccessChange, onProviderSecretPersistenceChange, onClearProviderSecrets, onParserConfigChange, onSelectConversation, onDeleteConversation, onNewConversation, onExportConversation, className }: SidebarContentProps) {
  if (isCollapsed || !activeView) {
    return null;
  }

  return (
    <aside className={cn('w-80 shrink-0 overflow-hidden border-r bg-background/80', className)} aria-label="AI builder settings">
      <div className="h-full min-h-0 overflow-auto p-2">
        {activeView === 'history' ? (
          <ConversationHistory
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
            onNewConversation={onNewConversation}
            onExportConversation={onExportConversation}
            className="h-full"
          />
        ) : null}
        {activeView === 'provider' ? <ProviderPanel providerSettings={providerSettings} providerSecrets={providerSecrets} providerSecretPersistence={providerSecretPersistence} onProviderAccessChange={onProviderAccessChange} onProviderSecretPersistenceChange={onProviderSecretPersistenceChange} onClearProviderSecrets={onClearProviderSecrets} /> : null}
        {activeView === 'model' ? <ModelPanel providerSettings={providerSettings} providerSecrets={providerSecrets} onProviderAccessChange={onProviderAccessChange} /> : null}
        {activeView === 'parser' ? <ParserSettings config={parserConfig} onChange={onParserConfigChange} /> : null}
        {activeView === 'debug' ? <DebugPanel conversation={currentConversation} /> : null}
      </div>
    </aside>
  );
}
