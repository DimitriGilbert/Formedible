import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/persistence');

const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'API', description: 'Hook return values, FormediblePersistenceConfig, and form lifecycle details.', href: '/docs/api' },
  { title: 'Form Persistence & Auto-Save', description: 'Open the live draft restore, manual controls, and excluded fields demo.', href: '/docs/examples?example=persistence' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Configuration',
    body: 'Add persistence to useFormedible when a form should keep a draft between visits. Keep the key stable for the same schema, and change it when saved values no longer match the fields on screen.',
    bullets: [
      'Use localStorage for longer-lived drafts or sessionStorage for tab-scoped work.',
      'Set restoreOnMount when returning users should see the saved draft without pressing a restore button.',
      'Put regulated fields, one-time uploads, signatures, and consent checkboxes in exclude.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('key', 'string', 'Required', 'Storage key for the saved draft. Include product area, form name, and a version such as onboarding:v2.'),
        createPropertyRow('storage', "'localStorage' | 'sessionStorage'", "'sessionStorage'", 'Browser storage target. Pick localStorage for drafts that should survive closed tabs.'),
        createPropertyRow('debounceMs', 'number', '500', 'Delay after value changes before Formedible writes the draft.'),
        createPropertyRow('exclude', 'readonly (Extract<keyof TFormValues, string> | string)[]', '[]', 'Field names removed from the saved values object before each write.'),
        createPropertyRow('restoreOnMount', 'boolean', 'false', 'Loads the saved payload during mount and applies its values and page when present.'),
      ],
    },
  },
  {
    title: 'Auto-save behavior',
    body: 'When persistence is configured, Formedible watches form values and schedules a debounced write after each change. Rapid typing resets the timer, so storage receives the latest settled draft instead of every keystroke.',
    bullets: [
      'Each write stores values, timestamp, and currentPage when the form has page state.',
      'Excluded fields are filtered before JSON is saved, so they are not restored later.',
      'Browser storage is skipped during server rendering, which keeps the route safe for SSR builds.',
    ],
  },
  {
    title: 'Manual controls',
    body: 'The hook also returns explicit storage helpers. They are useful for Save draft buttons, Restore draft links, and Clear draft actions outside the rendered form.',
    bullets: [
      'saveToStorage() writes the current values and current page immediately.',
      'loadFromStorage() parses the saved payload, applies stored fields, restores a valid page, and returns the payload when one exists.',
      'clearStorage() removes the configured key. Formedible calls it after a successful submit so finished work does not reappear as a stale draft.',
    ],
  },
  {
    title: 'Payload structure',
    body: 'The stored JSON is small on purpose. It is a draft snapshot, not an audit log or a server record.',
    bullets: [
      'PersistedFormPayload<TFormValues>.values is a Partial<TFormValues> object after excluded fields are removed.',
      'timestamp is a number from Date.now(), which is handy for “saved moments ago” copy or draft age checks.',
      'currentPage is optional. It is only written when the form is running with page state.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('values', 'Partial<TFormValues>', 'Required', 'Saved field values after exclude has been applied.'),
        createPropertyRow('timestamp', 'number', 'Required', 'Save time in milliseconds since the Unix epoch.'),
        createPropertyRow('currentPage', 'number', 'undefined', 'Saved page number for multi-page forms. It restores only when it fits the current page count.'),
      ],
    },
  },
  {
    title: 'UX patterns',
    body: 'Persistence works best when users know what is happening. Show plain draft copy near the form, give them a way to clear stored work, and treat submit as the point where the browser draft is done.',
    bullets: [
      'Long forms benefit most: applications, onboarding flows, quotes, intake forms, and setup wizards.',
      'Draft restoration should feel calm. Tell users a saved draft was restored and show its saved time when you surface timestamp.',
      'Version keys when the field shape changes, for example quote-request:v1 to quote-request:v2.',
    ],
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/persistence')({
  head: () => routeHead,
  component: PersistenceRoute,
});

function PersistenceRoute() {
  return (
    <DocsGuidePage
      eyebrow="Persistence"
      title="Restore drafts with a small, explicit storage contract."
      description="Persistence stores form values under a stable key, writes on a debounce, filters fields you exclude, and can restore a draft as soon as the form mounts."
      sections={sections}
      related={relatedLinks}
    />
  );
}
