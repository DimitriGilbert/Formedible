import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/advanced-features');

export const Route = createFileRoute('/docs/advanced-features')({
  head: () => routeHead,
  component: AdvancedFeaturesRoute,
});

function AdvancedFeaturesRoute() {
  return (
    <DocsGuidePage
      eyebrow="Flows"
      title="Build pages, tabs, conditionals, and dynamic options from the same configuration."
      description="Advanced Formedible flows are still plain field config: add page or tab membership, configure progress, and make visibility depend on current values."
      sections={[
        {
          title: 'Pages and tabs',
          body: 'Pages use numeric page identifiers and optional page metadata. Tabs use stable string ids and can include descriptions. Both can be conditional.',
          bullets: ['Start page numbers at 1.', 'Keep page titles accessible and descriptive.', 'Use progress.showSteps or progress.showPercentage when users need orientation.'],
        },
        {
          title: 'Conditional UI and dependent choices',
          body: 'Conditional callbacks receive the current values and must return a boolean. Dynamic options callbacks return the choices available for the current state.',
          bullets: ['Avoid returning undefined from conditionals.', 'Reset dependent defaults when a controlling choice changes.', 'Prefer readable helper functions for repeated conditions.'],
        },
      ]}
    />
  );
}
