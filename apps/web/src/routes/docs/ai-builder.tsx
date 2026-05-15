import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/ai-builder');

export const Route = createFileRoute('/docs/ai-builder')({
  head: () => routeHead,
  component: AiBuilderRoute,
});

function AiBuilderRoute() {
  return (
    <DocsGuidePage
      eyebrow="AI Builder"
      title="Generate forms from chat, then review the live result."
      description="AI Builder turns an LLM prompt into Formedible code, parses that code through the local parser, and shows the form beside the chat so teams can edit before they ship."
      codeExampleIds={['ai-builder-imports']}
      related={[
        { title: 'Builder', description: 'Use the visual builder when form authors prefer fields, tabs, and preview controls over chat.', href: '/docs/builder' },
        { title: 'Parser', description: 'See how generated text becomes a checked Formedible form config.', href: '/docs/parser' },
        { title: 'Getting started', description: 'Install shape, first form, and project conventions for the copied component path.', href: '/docs/getting-started' },
      ]}
      sections={[
        {
          title: 'Overview',
          body: 'AI Builder gives form authors a chat-driven drafting room. The left side handles provider access and conversation controls; the right side renders a live Formedible preview as soon as valid form code appears.',
          bullets: [
            'Chat with an LLM to create or revise fields, pages, labels, validation copy, and default values.',
            'Preview the parsed form in the same renderer path used by hand-written Formedible config.',
            'Keep provider settings, model choice, and browser-side key handling visible to the reviewer.',
          ],
        },
        {
          title: 'Setup',
          body: 'Mount AIBuilder where product teams work on forms. You can let it own provider state, or pass providerSettings and providerSecrets with matching change handlers for controlled mode.',
          bullets: [
            'AIBuilderProps accepts className, mode, providerSettings, providerSecrets, onProviderSettingsChange, onProviderSecretsChange, onFormGenerated, and onFormSubmit.',
            'Uncontrolled mode reads saved provider settings and conversations from browser storage, then keeps local component state in sync.',
            'Controlled mode lets the host app own provider selection and keys while AIBuilder still manages chat, parser settings, and preview state.',
          ],
          table: {
            headers: ['Property', 'Type', 'Default', 'Description'],
            rows: [
              { cells: ['mode', "'client'", "'client'", 'Runs generation in the browser with the selected TanStack AI adapter.'] },
              { cells: ['providerSettings', 'ProviderSettings', 'Saved settings', 'Controls provider, model, temperature, token limit, and Anthropic thinking budget.'] },
              { cells: ['providerSecrets', 'ProviderSecrets', 'Empty key or saved key', 'Keeps the API key paired with the selected provider.'] },
              { cells: ['onFormGenerated', '(formCode: string) => void', 'undefined', 'Receives the latest extracted Formedible code block.'] },
              { cells: ['onFormSubmit', '(formData: FormedibleFormValues) => void | Promise<void>', 'undefined', 'Receives values from the live preview form.'] },
            ],
          },
        },
        {
          title: 'Provider support',
          body: 'The adapter layer supports OpenAI, Anthropic, and OpenRouter through TanStack AI. Each provider has a default model, a guarded model list, and the same API-key check before a request starts.',
          bullets: [
            'OpenAI defaults to gpt-4o-mini and also accepts gpt-4o, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, and o3-mini.',
            'Anthropic defaults to claude-sonnet-4-5 and supports Claude Opus, Sonnet, and Haiku variants, plus thinking budget tokens.',
            'OpenRouter defaults to openai/gpt-4o-mini and also supports anthropic/claude-sonnet-4, anthropic/claude-3.7-sonnet, and meta-llama/llama-3.3-70b-instruct.',
          ],
          table: {
            headers: ['Property', 'OpenAI', 'Anthropic', 'OpenRouter'],
            rows: [
              { cells: ['Temperature', 'Supported', 'Supported', 'Supported'] },
              { cells: ['Max tokens', 'Supported', 'Supported', 'Supported'] },
              { cells: ['Thinking budget', 'Not supported', 'Supported', 'Not supported'] },
              { cells: ['Custom endpoint', 'Blocked', 'Blocked', 'Blocked'] },
            ],
          },
        },
        {
          title: 'Chat interface',
          body: 'ChatInterface appends the user message, streams assistant output, updates the visible message as text arrives, and marks the answer completed, errored, or aborted from the final stream events.',
          bullets: [
            'Enter submits the prompt, Shift+Enter adds a line break, and Stop aborts the active request.',
            'Streaming text, thinking chunks, raw events, provider, model, finish reason, and timing data stay attached to the assistant message.',
            'When the answer completes, extractFormCode pulls the fenced Formedible block and sends it to onFormGenerated.',
          ],
        },
        {
          title: 'Parser integration',
          body: 'Generated code never jumps straight to rendering. It flows through FormedibleParser.parseAiOutput, then parseAiToFormedible fills safe defaults and returns formOptions for the live preview.',
          bullets: [
            'Parser settings can require strict validation, infer default values, and restrict accepted field types.',
            'Parse errors stay on the assistant message and generated form snapshot so reviewers can fix the prompt or code.',
            'AiFormRenderer receives the parsed options and submits values through the AIBuilder onFormSubmit prop.',
          ],
        },
        {
          title: 'Storage',
          body: 'AI Builder stores provider settings, conversations, current UI state, and optional provider secrets in separate browser keys. Exports sanitize conversations before writing the JSON file.',
          bullets: [
            'Provider secrets can stay in memory, session storage, or local storage; local storage requires a clear opt-in.',
            'Conversation history persists assistant messages, generated code, parser results, status, provider, model, and timestamps.',
            'Secret redaction covers titles, message text, metadata, parser errors, persistence keys, tokens, credentials, passwords, and bearer strings.',
          ],
        },
      ]}
    />
  );
}
