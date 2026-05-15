import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/persistence');

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const persistenceExample = { title: 'Live example: persistence', description: 'Project inquiry form with localStorage, restoreOnMount, debounce, and excluded agreement field.', href: '/docs/examples?example=persistence' };

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
    body: 'Persistence is a useFormedible option with five supported properties. The runtime chooses browser storage from the config, returns no storage during SSR, and defaults to sessionStorage unless storage is localStorage.',
    bullets: [
      'key is required and is passed directly to storage.setItem, getItem, and removeItem.',
      'storage accepts localStorage or sessionStorage; leaving it blank uses sessionStorage.',
      'exclude is applied before each payload is stringified, so excluded top-level field names do not come back on restore.',
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
      sourceReference('Types: FormediblePersistenceConfig', 'packages/formedible/src/lib/formedible/types.ts#L395-L402', 'The persistence option contract.'),
      sourceReference('Source: getConfiguredStorage', 'packages/formedible/src/hooks/use-form-persistence.ts#L23-L29', 'SSR guard and localStorage/sessionStorage selection.'),
      persistenceExample,
    ],
  },
  {
    title: 'Auto-save behavior',
    body: 'The persistence hook watches form.state.values. When config exists in a browser, it schedules saveToStorage after debounceMs or 500 ms, then clears that timer if values change again before it fires.',
    bullets: [
      'createPersistedFormPayload writes values and timestamp every time.',
      'currentPage is included only when the runtime passes a current page number.',
      'The submit path calls clearStorage after onSubmit resolves, so a completed draft is removed from the configured key.',
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
      sourceReference('Source: createPersistedFormPayload', 'packages/formedible/src/hooks/use-form-persistence.ts#L31-L52', 'Excluded fields, timestamp, and optional currentPage payload creation.'),
      sourceReference('Source: debounce effect', 'packages/formedible/src/hooks/use-form-persistence.ts#L150-L162', 'Debounced writes tied to form values.'),
      sourceReference('Test: payload shape', 'tests/formedible/phase10-behavior.test.ts#L94-L107', 'Asserts values, timestamp, currentPage, and exclude behavior.'),
    ],
  },
  {
    title: 'Manual controls',
    body: 'useFormedible returns the persistence helpers from useFormPersistence. They use the same configured key and storage target as auto-save, so manual buttons and debounce writes share one payload format.',
    bullets: [
      'saveToStorage writes the current form values with the current page supplied by useFormedible.',
      'loadFromStorage parses the payload, sets each saved field, restores currentPage only when it is not greater than the configured total page count, and returns the payload.',
      'clearStorage removes the configured key when a storage object and config are available.',
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
    body: 'The stored value is JSON.stringify(payload), where payload has values, timestamp, and optional currentPage. loadPersistedFormPayload returns undefined when JSON is malformed or the shape is missing values or timestamp.',
    bullets: [
      'values must parse as an object and timestamp must parse as a number.',
      'currentPage is copied only when the parsed value is a number.',
      'loadFromStorage applies values with form.setFieldValue before returning the parsed payload.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('values', 'Partial<TFormValues>', 'Required', 'Saved field values after exclude has been applied.'),
        createPropertyRow('timestamp', 'number', 'Required', 'Save time in milliseconds since the Unix epoch.'),
        createPropertyRow('currentPage', 'number', 'undefined', 'Saved page number for multi-page forms. It restores when the saved number is not greater than the current total page count.'),
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
    body: 'The source gives you storage mechanics, not a status banner. If the product needs visible draft controls, build them around the returned helpers and the payload timestamp returned by loadFromStorage.',
    bullets: [
      'Use restoreOnMount for automatic restore, or call loadFromStorage from a user-initiated control when restore needs consent.',
      'Use the returned timestamp to show when a draft was saved; the hook stores Date.now in milliseconds.',
      'Use a new key when the field set changes, because the parser validates payload shape but does not migrate old field names.',
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
      sourceReference('Example: persistence form', 'apps/web/src/components/docs/examples/persistence-form.tsx', 'The live docs example uses localStorage, debounceMs 1500, exclude, and restoreOnMount.'),
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
      title="Restore drafts with a small, explicit storage contract."
      description="Persistence stores form values under a stable key, writes on a debounce, filters fields you exclude, and can restore a draft as soon as the form mounts."
      sections={sections}
      related={relatedLinks}
    />
  );
}
