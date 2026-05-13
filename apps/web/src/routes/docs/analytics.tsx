import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/analytics');

export const Route = createFileRoute('/docs/analytics')({
  head: () => routeHead,
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return (
    <DocsGuidePage
      eyebrow="Analytics"
      title="Instrument form behavior without coupling analytics to rendering."
      description="Analytics callbacks expose start, focus, blur, page change, completion, and abandonment events while the form remains a normal React component."
      sections={[
        {
          title: 'Callback contract',
          body: 'Use analytics for product telemetry, funnel analysis, or UX research. Callbacks receive timestamps, field names, page transitions, completion percentages, and submitted data.',
          bullets: ['Memoize callbacks in component code.', 'Keep payloads privacy-aware.', 'Treat analytics failures as non-blocking.'],
        },
        {
          title: 'Performance and stability',
          body: 'Because callback identity can affect effects, create stable analytics objects with useMemo when analytics are declared inside components.',
          bullets: ['Use useCallback for individual handlers.', 'Use useMemo for the analytics config object.', 'Do not mutate form data inside analytics callbacks.'],
        },
      ]}
    />
  );
}
