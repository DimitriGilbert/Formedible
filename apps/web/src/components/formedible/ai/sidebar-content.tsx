'use client';

import { RawOutputPanel } from '@/components/formedible/ai/raw-output-panel';
import { ConversationHistory } from '@/components/formedible/ai/conversation-history';
import type { SidebarView } from '@/components/formedible/ai/sidebar-icons';
import { ProviderSelection } from '@/components/formedible/ai/provider-selection';
import type { AIBuilderProviderAccess } from '@/components/formedible/ai/ai-builder';
import type { AiConversation, ProviderSecrets, ProviderSettings } from '@/lib/formedible/ai-types';
import { cn } from '@/lib/utils';

export interface SidebarContentProps {
  readonly activeView: SidebarView | null;
  readonly isCollapsed: boolean;
  readonly conversations: readonly AiConversation[];
  readonly currentConversation?: AiConversation;
  readonly currentConversationId?: string;
  readonly providerSettings: ProviderSettings;
  readonly providerSecrets: ProviderSecrets;
  readonly onProviderAccessChange: (settings: ProviderSettings, secrets: ProviderSecrets) => void;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onDeleteConversation: (conversationId: string) => void;
  readonly onNewConversation: () => void;
  readonly onExportConversation: (conversation: AiConversation) => void;
  readonly className?: string;
}

function EmptySettingsPanel({ title, description }: { readonly title: string; readonly description: string }) {
  return (
    <section className="rounded-lg border bg-background p-4" aria-labelledby={`${title.toLowerCase().replaceAll(' ', '-')}-title`}>
      <h2 id={`${title.toLowerCase().replaceAll(' ', '-')}-title`} className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </section>
  );
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

function ProviderPanel({ providerSettings, providerSecrets, onProviderAccessChange }: Pick<SidebarContentProps, 'providerSettings' | 'providerSecrets' | 'onProviderAccessChange'>) {
  const access: AIBuilderProviderAccess = { settings: providerSettings, secrets: providerSecrets };

  return <ProviderSelection settings={access.settings} secrets={access.secrets} onChange={onProviderAccessChange} />;
}

export function SidebarContent({ activeView, isCollapsed, conversations, currentConversation, currentConversationId, providerSettings, providerSecrets, onProviderAccessChange, onSelectConversation, onDeleteConversation, onNewConversation, onExportConversation, className }: SidebarContentProps) {
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
        {activeView === 'provider' ? <ProviderPanel providerSettings={providerSettings} providerSecrets={providerSecrets} onProviderAccessChange={onProviderAccessChange} /> : null}
        {activeView === 'model' ? <EmptySettingsPanel title="Model settings" description="Model controls will be available in the model settings phase. Current generation continues to use the selected provider model, temperature, max token, and thinking values." /> : null}
        {activeView === 'parser' ? <EmptySettingsPanel title="Parser settings" description="Parser configuration controls will be available in the parser settings phase. Current parsing uses the synced Formedible parser contract and lowercase formedible fenced blocks." /> : null}
        {activeView === 'debug' ? <DebugPanel conversation={currentConversation} /> : null}
      </div>
    </aside>
  );
}
