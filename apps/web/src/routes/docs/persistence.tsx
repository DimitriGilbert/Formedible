import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/persistence');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const persistenceExample = { title: 'Live example: persistence', description: 'Project inquiry form with localStorage, restoreOnMount, debounce, and an excluded agreement field.', href: '/docs/examples?example=persistence' };

const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'API', description: 'Hook return values, FormediblePersistenceConfig, and form lifecycle details.', href: '/docs/api' },
  { title: 'Form Persistence & Auto-Save', description: 'Open the draft restore demo with manual controls and excluded fields.', href: '/docs/examples?example=persistence' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Configuration',
    body: 'Persistence is a useFormedible option with five properties. In the browser, Formedible uses the configured storage and falls back to sessionStorage unless you choose localStorage.',
    bullets: [
      'key is required and is passed to storage.setItem, getItem, and removeItem.',
      'storage accepts localStorage or sessionStorage; blank means sessionStorage.',
      'exclude removes top-level field names before Formedible writes the payload.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('key', 'string', 'Required', 'Storage key for the saved draft. Include product area, form name, and a version, such as onboarding:v2.'),
        createPropertyRow('storage', "'localStorage' | 'sessionStorage'", "'sessionStorage'", 'Browser storage target. Use localStorage for drafts that should survive closed tabs.'),
        createPropertyRow('debounceMs', 'number', '500', 'Delay after value changes before Formedible writes a draft.'),
        createPropertyRow('exclude', 'readonly (Extract<keyof TFormValues, string> | string)[]', '[]', 'Field names removed from saved values before each write.'),
        createPropertyRow('restoreOnMount', 'boolean', 'false', 'Loads the saved payload on mount and applies its values and page when present.'),
      ],
    },
    snippet: {
      title: 'Persistence config from the live example',
      language: 'tsx',
      code: `const { Form, saveToStorage, loadFromStorage, clearStorage } = useFormedible({
  fields,
  pages,
  persistence: {
    key: 'demo-project-inquiry-form',
    storage: 'localStorage',
    debounceMs: 1500,
    exclude: ['agreeToTerms'],
    restoreOnMount: true,
  },
  formOptions: { defaultValues, onSubmit },
});`,
    },
    references: [
      sourceReference('Types: FormediblePersistenceConfig', 'packages/formedible/src/lib/formedible/types.ts#L395-L402', 'The persistence option shape.'),
      sourceReference('Source: getConfiguredStorage', 'packages/formedible/src/hooks/use-form-persistence.ts#L23-L29', 'SSR guard and localStorage/sessionStorage selection.'),
      persistenceExample,
    ],
  },
  {
    title: 'Auto-save behavior',
    body: 'The persistence hook watches form.state.values. In the browser, it schedules saveToStorage after debounceMs, or 500 ms by default, and cancels that write if values change first.',
    bullets: [
      'createPersistedFormPayload always writes values and timestamp.',
      'currentPage is included only when Formedible passes a page number.',
      'After onSubmit resolves, Formedible clears the configured storage key.',
    ],
    snippet: {
      title: 'What the hook writes',
      language: 'ts',
      code: `const payload = createPersistedFormPayload(
  { name: 'Ada', email: 'ada@example.com', agreeToTerms: true },
  3,
  ['agreeToTerms'],
);

// With Date.now() mocked to 1234, tests assert:
// {
//   values: { name: 'Ada', email: 'ada@example.com' },
//   timestamp: 1234,
//   currentPage: 3,
// }`,
    },
    references: [
      sourceReference('Source: createPersistedFormPayload', 'packages/formedible/src/hooks/use-form-persistence.ts#L31-L52', 'Excluded fields, timestamp, and optional currentPage payload.'),
      sourceReference('Source: debounce effect', 'packages/formedible/src/hooks/use-form-persistence.ts#L150-L162', 'Debounced writes tied to form values.'),
      sourceReference('Test: payload shape', 'tests/formedible/phase10-behavior.test.ts#L94-L107', 'Asserts values, timestamp, currentPage, and exclude behavior.'),
    ],
  },
  {
    title: 'Manual controls',
    body: 'useFormedible returns the persistence helpers from useFormPersistence. Manual buttons and debounce writes use the same key, storage target, and payload format.',
    bullets: [
      'saveToStorage writes current form values with the current page from useFormedible.',
      'loadFromStorage sets saved fields, restores a valid currentPage, and returns the parsed payload.',
      'clearStorage removes the configured key when storage is available.',
    ],
    snippet: {
      title: 'Manual draft buttons',
      language: 'tsx',
      code: `const { Form, saveToStorage, loadFromStorage, clearStorage } = useFormedible(config);

return (
  <>
    <Form />
    <button type="button" onClick={saveToStorage}>Save draft</button>
    <button type="button" onClick={() => void loadFromStorage()}>Restore draft</button>
    <button type="button" onClick={clearStorage}>Clear draft</button>
  </>
);`,
    },
    references: [
      sourceReference('Source: helper callbacks', 'packages/formedible/src/hooks/use-form-persistence.ts#L95-L164', 'saveToStorage, loadFromStorage, clearStorage, restoreOnMount, and debounce effects.'),
      sourceReference('Source: useFormedible return', 'packages/formedible/src/hooks/use-formedible.tsx#L428-L443', 'The hook return contract includes saveToStorage, loadFromStorage, and clearStorage.'),
      sourceReference('Test: helpers', 'tests/formedible/phase10-behavior.test.ts#L109-L124', 'Save, load, clear, malformed payload rejection, and currentPage metadata.'),
    ],
  },
  {
    title: 'Payload structure',
    body: 'The stored value is JSON.stringify(payload). The parser returns undefined for bad JSON, missing values, or a missing timestamp.',
    bullets: [
      'values must parse as an object; timestamp must parse as a number.',
      'currentPage is kept only when it parses as a number.',
      'loadFromStorage calls form.setFieldValue for each saved field before returning the payload.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('values', 'Partial<TFormValues>', 'Required', 'Saved field values after exclude runs.'),
        createPropertyRow('timestamp', 'number', 'Required', 'Save time in milliseconds since the Unix epoch.'),
        createPropertyRow('currentPage', 'number', 'undefined', 'Saved page number for multi-page forms. It restores when the saved number fits within the current page count.'),
      ],
    },
    snippet: {
      title: 'PersistedFormPayload interface',
      language: 'ts',
      code: `export interface PersistedFormPayload<TFormValues extends FormedibleFormValues> {
  readonly values: Partial<TFormValues>;
  readonly timestamp: number;
  readonly currentPage?: number;
}`,
    },
    references: [
      sourceReference('Source: payload parser', 'packages/formedible/src/hooks/use-form-persistence.ts#L54-L89', 'JSON parsing, shape checks, and optional currentPage handling.'),
      sourceReference('Source: storage IO', 'packages/formedible/src/hooks/use-form-persistence.ts#L81-L93', 'JSON.stringify, getItem, and removeItem helpers.'),
      sourceReference('Test: malformed payloads', 'tests/formedible/phase10-behavior.test.ts#L109-L124', 'Bad JSON and bad shape resolve to undefined.'),
    ],
  },
  {
    title: 'UX patterns',
    body: 'Formedible gives you storage mechanics, not a status banner. Build visible draft controls around the returned helpers and the timestamp from loadFromStorage.',
    bullets: [
      'Use restoreOnMount for automatic restore.',
      'Call loadFromStorage from a button when users should choose whether to restore.',
      'Change the key when field names change; the parser validates shape but does not migrate old drafts.',
    ],
    snippet: {
      title: 'Timestamp-driven restore copy',
      language: 'tsx',
      code: `const restored = await loadFromStorage();

if (restored) {
  setDraftMessage('Draft restored from ' + new Date(restored.timestamp).toLocaleString());
}`,
    },
    references: [
      sourceReference('Source: loadFromStorage return value', 'packages/formedible/src/hooks/use-form-persistence.ts#L110-L134', 'loadFromStorage returns the parsed payload after applying values and page state.'),
      sourceReference('Example: persistence form', 'apps/web/src/components/docs/examples/persistence-form.tsx', 'The live example uses localStorage, debounceMs 1500, exclude, and restoreOnMount.'),
      persistenceExample,
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
      title="Restore drafts with a clear storage contract."
      description="Persistence saves form values under a stable key, writes after a debounce, skips excluded fields, and can restore a draft on mount."
      sections={sections}
      related={relatedLinks}
    />
  );
}
