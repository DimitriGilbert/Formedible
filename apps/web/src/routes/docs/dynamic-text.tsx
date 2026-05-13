import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/dynamic-text');

export const Route = createFileRoute('/docs/dynamic-text')({
  head: () => routeHead,
  component: DynamicTextRoute,
});

function DynamicTextRoute() {
  return (
    <DocsGuidePage
      eyebrow="Dynamic text"
      title="Personalize labels and page copy with template interpolation."
      description="Labels, descriptions, input hints, and page descriptions can include tokens such as {{firstName}} that resolve from current form values."
      sections={[
        {
          title: 'Token usage',
          body: 'Use dynamic copy to make multi-step flows feel continuous. Tokens are best for already-collected values that improve orientation.',
          bullets: ['Keep fallback copy readable before values exist.', 'Use tokens in labels, descriptions, and page copy.', 'Avoid placing sensitive values in decorative copy.'],
        },
        {
          title: 'Dynamic input hints',
          body: 'Fields can opt into dynamic hint behavior when input guidance should resolve from values too.',
          bullets: ['Prefer labels over hints for required instructions.', 'Keep interpolated copy short.', 'Test empty, partial, and completed states.'],
        },
      ]}
    />
  );
}
