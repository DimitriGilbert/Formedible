import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/advanced-features');

const sections = [
  {
    title: 'Multi-page forms',
    body: 'Use FormediblePageConfig for step metadata, then put each field on a step with its page number. Fields without page stay on page 1, so small forms can grow into stepped flows without a rewrite.',
    bullets: [
      'Each FormediblePageConfig entry needs page and title; description gives the progress header a second line of context.',
      'A page can be conditional, and the runtime hides it unless the condition passes and at least one field on that page is visible.',
      'Navigation controls come from the hook config: nextLabel, previousLabel, submitLabel, onPageChange, and showSubmitButton.',
    ],
  },
  {
    title: 'Tabbed forms',
    body: 'Tabs are for grouping fields without a step-by-step flow. The tabs array accepts bare string ids for quick layouts, or FormedibleTabConfig objects when the label, description, or visibility needs more control.',
    bullets: [
      'Set tab on fields to match a tab id. If no tabs array is passed, ids are inferred from the fields that declare tab.',
      'String tabs render the id as the label. FormedibleTabConfig adds id, label, description, and conditional.',
      'Conditional tabs drop out of the tab list when their condition fails or when none of their fields are visible.',
    ],
  },
  {
    title: 'Progress indicators',
    body: 'FormedibleProgressConfig controls the header shown in multi-page mode. It does not change page order or validation; it only decides how much orientation copy users see.',
    bullets: [
      'showSteps displays the current visible step count, which stays correct after conditional pages are skipped.',
      'showPercentage displays the progressValue returned from useFormedible.',
      'progressValue is 100 for a one-page flow; with several visible pages, it is based on the active visible-page index from first step to last step.',
    ],
  },
  {
    title: 'Conditional UI',
    body: 'The conditional property works on fields, pages, and tab configs. Use a string path for simple truthy checks, or a typed function when the rule needs to compare several values.',
    bullets: [
      'A string path reads the current values with Formedible field-path lookup, then treats the result as truthy or falsey.',
      'A function receives the current form values and returns a boolean, which keeps product rules close to the field or group they affect.',
      'Page-level and tab-level conditions are checked before rendering those groups, then field-level conditions are checked inside the group.',
    ],
  },
  {
    title: 'Dynamic options',
    body: 'Option-based fields can accept a function instead of a static list. That function receives current values, so a later field can react to an earlier answer without duplicating whole form branches.',
    bullets: [
      'Dependent selects are the common case: country drives state, plan drives add-ons, or role drives permission choices.',
      'Return the same option shape used by static options: value, label, disabled, description, and metadata for custom renderers.',
      'When a parent answer changes, clear or replace stale child values in formOptions.onChange or in the surrounding product logic.',
    ],
  },
  {
    title: 'Auto-submit',
    body: 'autoSubmitOnChange turns value changes into debounced submits. It fits filters, preference panels, and autosave-style forms where a full submit button would slow users down.',
    bullets: [
      'Set autoSubmitOnChange to true to schedule form.handleSubmit after each field change.',
      'autoSubmitDebounceMs changes the delay; the default is 300 ms.',
      'Keep showSubmitButton off for pure autosave flows, but keep clear status text nearby so users know their changes are being saved.',
    ],
  },
] satisfies readonly DocsGuideSection[];

const relatedLinks = [
  { title: 'API', description: 'Hook options and type contracts for pages, tabs, progress, conditions, dynamic options, and auto-submit.', href: '/docs/api' },
  { title: 'Fields', description: 'Field config reference, including page, tab, conditional, and function-based options.', href: '/docs/fields' },
  { title: 'Multi-Step Registration', description: 'Open the live multi-page registration flow in the examples browser.', href: '/docs/examples?example=registration' },
  { title: 'Tabbed Form Layout', description: 'Open the live tabbed settings-style form in the examples browser.', href: '/docs/examples?example=tabbed' },
  { title: 'Conditional Pages', description: 'Open the live conditional page flow in the examples browser.', href: '/docs/examples?example=conditional-pages' },
] satisfies readonly DocsGuideLink[];

export const Route = createFileRoute('/docs/advanced-features')({
  head: () => routeHead,
  component: AdvancedFeaturesRoute,
});

function AdvancedFeaturesRoute() {
  return (
    <DocsGuidePage
      eyebrow="Flows"
      title="Build rich form flows from the same field config."
      description="Pages, tabs, progress, conditional groups, dependent choices, and debounced submits all live in the Formedible config model. Add the behavior where the product needs it; leave the rest out."
      sections={sections}
      related={relatedLinks}
    />
  );
}
