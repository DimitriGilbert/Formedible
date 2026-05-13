import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/persistence');

export const Route = createFileRoute('/docs/persistence')({
  head: () => routeHead,
  component: PersistenceRoute,
});

function PersistenceRoute() {
  return (
    <DocsGuidePage
      eyebrow="Persistence"
      title="Restore drafts with a small, explicit storage contract."
      description="Persistence stores form values under a stable key and can debounce writes, exclude sensitive fields, and restore on mount."
      sections={[
        {
          title: 'Storage configuration',
          body: 'Use localStorage for longer drafts and sessionStorage for tab-scoped work. Choose a key that includes product area and form version.',
          bullets: ['Set debounceMs for large forms.', 'Exclude terms, secrets, one-time uploads, and ephemeral acknowledgements.', 'Version keys when field shape changes.'],
        },
        {
          title: 'User experience',
          body: 'Draft restoration is most useful in long forms. Pair it with clear copy so users know their work survives navigation.',
          bullets: ['Keep submit behavior authoritative.', 'Clear drafts after successful persistence to your backend.', 'Avoid storing regulated data unless the product policy allows it.'],
        },
      ]}
    />
  );
}
