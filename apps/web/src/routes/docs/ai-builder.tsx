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
      title="Generate draft forms while preserving human review."
      description="AI Builder provider selection, chat, generated preview, and renderer paths live in the app so generated forms still target the public field model."
      codeExampleIds={['ai-builder-imports']}
      sections={[
        {
          title: 'Safe generation workflow',
          body: 'Use prompts to draft structure, then inspect the generated fields, options, defaults, validation, and copy before shipping.',
          bullets: ['Prefer structured prompts with audience, fields, and success criteria.', 'Reject generated secrets or hidden network assumptions.', 'Run generated config through type checks.'],
        },
        {
          title: 'Provider boundaries',
          body: 'Provider selection belongs outside the renderer. The final form should not depend on AI availability once configuration has been accepted.',
          bullets: ['Store accepted config separately from chat history.', 'Show generated diffs to reviewers.', 'Keep deterministic defaults in production code.'],
        },
      ]}
    />
  );
}
