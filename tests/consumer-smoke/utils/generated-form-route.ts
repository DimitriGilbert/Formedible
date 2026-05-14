import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { GeneratedBetterTStackAppInspection } from './package-inspection.js';
import type { CommandSpec } from './registry-boundary.js';

export interface GeneratedLargeFormRoute {
  readonly routePath: '/formedible-smoke';
  readonly routeFilePath: string;
  readonly routeDirectoryEntries: readonly string[];
  readonly source: string;
}

export type GeneratedAppCommandPurpose = 'typecheck' | 'build';

/**
 * Inspects the generated TanStack Start route directory, then writes a large
 * consumer smoke page that imports only installed registry files from the app.
 */
export async function writeGeneratedLargeFormRoute(
  inspection: GeneratedBetterTStackAppInspection,
): Promise<GeneratedLargeFormRoute> {
  const routesDirectory = join(inspection.webPackageDirectory, 'src', 'routes');
  const routeDirectoryEntries = await readdir(routesDirectory);
  const routeFilePath = join(routesDirectory, 'formedible-smoke.tsx');
  const source = createLargeConsumerFormRouteSource(inspection.uiPackage.name);

  await mkdir(routesDirectory, { recursive: true });
  await writeFile(routeFilePath, source, 'utf8');

  return {
    routePath: '/formedible-smoke',
    routeFilePath,
    routeDirectoryEntries,
    source,
  };
}

/**
 * Chooses generated app commands only from inspected package.json scripts.
 */
export function createGeneratedAppCommand(
  inspection: GeneratedBetterTStackAppInspection,
  purpose: GeneratedAppCommandPurpose,
): CommandSpec {
  if (purpose === 'build') {
    return scriptCommand(inspection.webPackage.scripts.build, 'build', inspection.webPackage.path, inspection.webPackage.path, [
      'run',
      'build',
    ]);
  }

  const webTypecheckScript = firstExistingScript(inspection.webPackage.scripts, ['check-types', 'typecheck', 'tsc']);
  if (webTypecheckScript) {
    return scriptCommand(webTypecheckScript, 'typecheck', inspection.webPackage.path, inspection.webPackage.path, [
      'run',
      webTypecheckScript,
    ]);
  }

  if (typeof inspection.webPackage.scripts.build === 'string') {
    return {
      command: 'pnpm',
      args: ['exec', 'tsc', '--noEmit'],
      cwd: packageDirectory(inspection.webPackage.path),
    };
  }

  const rootTypecheckScript = firstExistingScript(inspection.rootPackage.scripts, ['check-types', 'typecheck', 'tsc']);
  if (rootTypecheckScript) {
    return scriptCommand(rootTypecheckScript, 'typecheck', inspection.rootPackage.path, inspection.rootPackage.path, [
      'run',
      rootTypecheckScript,
    ]);
  }

  throw new Error(
    `Generated app does not expose a typecheck script. Root package: ${inspection.rootPackage.path}. Web package: ${inspection.webPackage.path}.`,
  );
}

function firstExistingScript(scripts: Readonly<Record<string, string>>, names: readonly string[]): string | undefined {
  return names.find((name) => typeof scripts[name] === 'string');
}

function scriptCommand(
  script: string | undefined,
  purpose: GeneratedAppCommandPurpose,
  packagePath: string,
  cwdSourcePath: string,
  args: readonly string[],
): CommandSpec {
  if (typeof script !== 'string') {
    throw new Error(`Generated app does not expose a ${purpose} script in ${packagePath}.`);
  }

  return {
    command: 'pnpm',
    args,
    cwd: packageDirectory(cwdSourcePath),
  };
}

function packageDirectory(packagePath: string): string {
  return packagePath.endsWith('/package.json') ? packagePath.slice(0, -'/package.json'.length) : packagePath;
}

function createLargeConsumerFormRouteSource(uiPackageName: string): string {
  return String.raw`import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { useFormedible } from '${uiPackageName}/components/formedible/hooks/use-formedible';
import type {
  FormedibleAnalyticsConfig,
  FormedibleFieldConfig,
  FormedibleLocationSearchOptions,
  FormedibleLocationValue,
} from '${uiPackageName}/components/formedible/lib/types';

export const Route = createFileRoute('/formedible-smoke')({
  component: FormedibleSmokePage,
});

const smokeFormSchema = z.object({
  fullName: z.string().min(2),
  workEmail: z.string().email(),
  password: z.string().min(8),
  bio: z.string().min(20),
  age: z.number().min(18),
  birthDate: z.date(),
  department: z.enum(['engineering', 'design', 'product', 'support']),
  contactMethod: z.enum(['email', 'phone', 'both']),
  acceptTerms: z.boolean().refine((value) => value),
  remoteFriendly: z.boolean(),
  satisfaction: z.number().min(1).max(5),
  improvements: z.string().optional(),
  phoneNumber: z.string().min(1),
  skills: z.array(z.string()).min(1),
  subject: z.enum(['general', 'support', 'sales']),
  categories: z.array(z.string()),
  country: z.enum(['us', 'ca', 'uk', 'au']),
  state: z.string().min(1),
  experienceLevel: z.number().min(1).max(10),
  favoriteColor: z.string().min(1),
  workLocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  dailyDuration: z.object({
    hours: z.number().min(0),
    minutes: z.number().min(0),
    seconds: z.number().min(0),
    totalSeconds: z.number().min(0),
  }),
  resume: z.unknown().optional(),
  contactMethods: z.array(z.string().email()).min(1),
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['developer', 'designer', 'manager', 'qa']),
        skills: z.string(),
        startDate: z.string().min(1),
      }),
    )
    .min(1),
  roomDetails: z
    .array(
      z.object({
        equipementRoom: z.boolean(),
        equipementListRoom: z.string().optional(),
      }),
    )
    .min(1),
});

type SmokeFormValues = z.infer<typeof smokeFormSchema>;

const stateOptions = {
  us: [
    { value: 'ca', label: 'California' },
    { value: 'ny', label: 'New York' },
    { value: 'tx', label: 'Texas' },
  ],
  ca: [
    { value: 'on', label: 'Ontario' },
    { value: 'qc', label: 'Quebec' },
    { value: 'bc', label: 'British Columbia' },
  ],
  uk: [
    { value: 'england', label: 'England' },
    { value: 'scotland', label: 'Scotland' },
    { value: 'wales', label: 'Wales' },
  ],
  au: [
    { value: 'nsw', label: 'New South Wales' },
    { value: 'vic', label: 'Victoria' },
    { value: 'qld', label: 'Queensland' },
  ],
} satisfies Record<SmokeFormValues['country'], readonly { readonly value: string; readonly label: string }[]>;

const stableLocationResults: readonly FormedibleLocationValue[] = [
  {
    lat: 37.7749,
    lng: -122.4194,
    address: 'Market Street, San Francisco, CA',
    city: 'San Francisco',
    country: 'United States',
  },
  {
    lat: 43.6532,
    lng: -79.3832,
    address: 'Queen Street West, Toronto, ON',
    city: 'Toronto',
    country: 'Canada',
  },
];

const defaultValues: SmokeFormValues = {
  fullName: 'Ada Lovelace',
  workEmail: 'ada@example.com',
  password: 'formedible-password',
  bio: 'A deterministic consumer smoke profile for broad Formedible field coverage.',
  age: 36,
  birthDate: new Date('1990-01-01T00:00:00.000Z'),
  department: 'engineering',
  contactMethod: 'email',
  acceptTerms: true,
  remoteFriendly: true,
  satisfaction: 3,
  improvements: 'Keep the generated form stable and dependency-rich.',
  phoneNumber: '+14155550100',
  skills: ['typescript', 'react'],
  subject: 'general',
  categories: ['documentation'],
  country: 'us',
  state: 'ca',
  experienceLevel: 7,
  favoriteColor: '#2563eb',
  workLocation: stableLocationResults[0],
  dailyDuration: { hours: 8, minutes: 30, seconds: 0, totalSeconds: 30600 },
  resume: undefined,
  contactMethods: ['ada@example.com'],
  teamMembers: [
    {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'developer',
      skills: 'compilers, debugging',
      startDate: '2026-01-01',
    },
  ],
  roomDetails: [{ equipementRoom: false, equipementListRoom: '' }],
};

function FormedibleSmokePage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [analyticsEvents, setAnalyticsEvents] = React.useState(0);

  const recordAnalyticsEvent = React.useCallback(() => {
    setAnalyticsEvents((count) => count + 1);
  }, []);

  const searchLocations = React.useCallback(
    async (query: string, options: FormedibleLocationSearchOptions): Promise<readonly FormedibleLocationValue[]> => {
      const limit = options.limit ?? stableLocationResults.length;
      const normalizedQuery = query.trim().toLowerCase();
      return stableLocationResults
        .filter((location) => location.address?.toLowerCase().includes(normalizedQuery) ?? true)
        .slice(0, limit);
    },
    [],
  );

  const analytics = React.useMemo<FormedibleAnalyticsConfig<SmokeFormValues>>(
    () => ({
      onFormStart: recordAnalyticsEvent,
      onFieldFocus: recordAnalyticsEvent,
      onFieldBlur: recordAnalyticsEvent,
      onPageChange: recordAnalyticsEvent,
      onFormComplete: recordAnalyticsEvent,
      onFormAbandon: recordAnalyticsEvent,
    }),
    [recordAnalyticsEvent],
  );

  const fields = React.useMemo<readonly FormedibleFieldConfig<SmokeFormValues>[]>(
    () => [
      {
        name: 'fullName',
        type: 'text',
        label: 'Full Name',
        tab: 'profile',
        section: { title: 'Identity', description: 'Basic account information from the registration and tabbed examples.' },
      },
      { name: 'workEmail', type: 'email', label: 'Work Email', tab: 'profile' },
      {
        name: 'password',
        type: 'password',
        label: 'Password',
        tab: 'profile',
        passwordConfig: { showToggle: true, strengthMeter: true, minStrength: 3 },
      },
      {
        name: 'bio',
        type: 'textarea',
        label: 'Project brief for {{fullName}}',
        description: 'Dynamic text interpolation should include {{fullName}}.',
        tab: 'profile',
        textareaConfig: { rows: 4, maxLength: 500, showWordCount: true, resize: 'vertical' },
      },
      { name: 'age', type: 'number', label: 'Age', tab: 'profile', min: 18, step: 1 },
      { name: 'birthDate', type: 'date', label: 'Birth Date', tab: 'profile', dateConfig: { format: 'MM/dd/yyyy' } },
      {
        name: 'department',
        type: 'select',
        label: 'Department',
        tab: 'profile',
        options: [
          { value: 'engineering', label: 'Engineering' },
          { value: 'design', label: 'Design' },
          { value: 'product', label: 'Product' },
          { value: 'support', label: 'Support' },
        ],
      },
      {
        name: 'contactMethod',
        type: 'radio',
        label: 'Preferred Contact Method',
        tab: 'preferences',
        section: { title: 'Preferences', description: 'Radio, checkbox, switch, and conditional fields.' },
        options: [
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Phone' },
          { value: 'both', label: 'Both' },
        ],
      },
      { name: 'acceptTerms', type: 'checkbox', label: 'Accept terms for smoke testing', tab: 'preferences' },
      { name: 'remoteFriendly', type: 'switch', label: 'Remote friendly workspace', tab: 'preferences' },
      {
        name: 'satisfaction',
        type: 'rating',
        label: 'Satisfaction',
        tab: 'preferences',
        ratingConfig: { max: 5, allowHalf: true, icon: 'star', size: 'lg', showValue: true },
      },
      {
        name: 'improvements',
        type: 'textarea',
        label: 'Improvement Notes',
        tab: 'preferences',
        conditional: (values) => values.satisfaction < 4,
        textareaConfig: { rows: 3, maxLength: 300, showWordCount: true },
      },
      { name: 'phoneNumber', type: 'phone', label: 'Phone Number', tab: 'preferences', phoneConfig: { defaultCountry: 'US', format: 'international' } },
      {
        name: 'skills',
        type: 'multiSelect',
        label: 'Technical Skills',
        tab: 'advanced',
        section: { title: 'Advanced Fields', description: 'Advanced field type coverage from the docs examples.' },
        options: [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'react', label: 'React' },
          { value: 'nodejs', label: 'Node.js' },
          { value: 'python', label: 'Python' },
        ],
        multiSelectConfig: { searchable: true, creatable: true, maxSelections: 5, placeholder: 'Select skills' },
      },
      {
        name: 'subject',
        type: 'combobox',
        label: 'Support Subject',
        tab: 'advanced',
        options: [
          { value: 'general', label: 'General Inquiry' },
          { value: 'support', label: 'Technical Support' },
          { value: 'sales', label: 'Sales Question' },
        ],
        comboboxConfig: { searchable: true, placeholder: 'Choose a subject', searchPlaceholder: 'Search subjects' },
      },
      {
        name: 'categories',
        type: 'multiCombobox',
        label: 'Issue Categories',
        tab: 'advanced',
        options: [
          { value: 'bug', label: 'Bug Report' },
          { value: 'feature', label: 'Feature Request' },
          { value: 'documentation', label: 'Documentation' },
          { value: 'performance', label: 'Performance Issue' },
        ],
        multiComboboxConfig: { searchable: true, creatable: true, maxSelections: 3 },
      },
      {
        name: 'country',
        type: 'select',
        label: 'Country',
        tab: 'advanced',
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'au', label: 'Australia' },
        ],
      },
      {
        name: 'state',
        type: 'select',
        label: 'State or Province',
        tab: 'advanced',
        options: (values) => stateOptions[values.country],
      },
      {
        name: 'experienceLevel',
        type: 'slider',
        label: 'Experience Level',
        tab: 'advanced',
        sliderConfig: {
          min: 1,
          max: 10,
          step: 1,
          showValue: true,
          marks: [
            { value: 1, label: 'Beginner' },
            { value: 5, label: 'Intermediate' },
            { value: 10, label: 'Expert' },
          ],
        },
      },
      {
        name: 'favoriteColor',
        type: 'colorPicker',
        label: 'Favorite Color',
        tab: 'advanced',
        colorConfig: { format: 'hex', showPreview: true, presetColors: ['#2563eb', '#16a34a', '#dc2626'], allowCustom: true },
      },
      {
        name: 'workLocation',
        type: 'location',
        label: 'Work Location',
        tab: 'advanced',
        locationConfig: {
          defaultLocation: stableLocationResults[0],
          enableSearch: true,
          enableGeolocation: false,
          enableManualEntry: true,
          showMap: false,
          searchPlaceholder: 'Search stable smoke locations',
          searchOptions: { debounceMs: 50, minQueryLength: 2, maxResults: 2 },
          searchCallback: searchLocations,
        },
      },
      {
        name: 'dailyDuration',
        type: 'duration',
        label: 'Daily Work Duration',
        tab: 'advanced',
        durationConfig: { format: 'hm', maxHours: 24, showLabels: true },
      },
      {
        name: 'resume',
        type: 'file',
        label: 'Resume',
        tab: 'advanced',
        fileConfig: { accept: '.pdf,.doc,.docx', multiple: false, maxSize: 5 * 1024 * 1024, maxFiles: 1 },
      },
      {
        name: 'contactMethods',
        type: 'array',
        label: 'Contact Email Addresses',
        tab: 'arrays',
        section: { title: 'Arrays and Nested Conditionals', description: 'Scalar arrays, object arrays, and nested conditional fields.' },
        arrayConfig: {
          itemType: 'email',
          itemLabel: 'Email Address',
          minItems: 1,
          maxItems: 5,
          addButtonLabel: 'Add Email',
          removeButtonLabel: 'Remove Email',
          defaultValue: '',
        },
      },
      {
        name: 'teamMembers',
        type: 'array',
        label: 'Team Members',
        tab: 'arrays',
        arrayConfig: {
          itemType: 'object',
          itemLabel: 'Team Member',
          minItems: 1,
          maxItems: 10,
          sortable: true,
          addButtonLabel: 'Add Team Member',
          removeButtonLabel: 'Remove Member',
          defaultValue: { name: '', email: '', role: 'developer', skills: '', startDate: '2026-01-01' },
          objectConfig: {
            layout: 'grid',
            columns: 2,
            fields: [
              { name: 'name', type: 'text', label: 'Name' },
              { name: 'email', type: 'email', label: 'Email' },
              {
                name: 'role',
                type: 'select',
                label: 'Role',
                options: [
                  { value: 'developer', label: 'Developer' },
                  { value: 'designer', label: 'Designer' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'qa', label: 'QA' },
                ],
              },
              { name: 'skills', type: 'text', label: 'Skills' },
              { name: 'startDate', type: 'text', label: 'Start Date' },
            ],
          },
        },
      },
      {
        name: 'roomDetails',
        type: 'array',
        label: 'Room Details',
        tab: 'arrays',
        arrayConfig: {
          itemType: 'object',
          itemLabel: 'Room',
          minItems: 1,
          maxItems: 20,
          sortable: true,
          addButtonLabel: 'Add Room',
          removeButtonLabel: 'Remove Room',
          defaultValue: { equipementRoom: false, equipementListRoom: '' },
          objectConfig: {
            collapsible: true,
            showCard: false,
            layout: 'grid',
            columns: 2,
            fields: [
              { name: 'equipementRoom', type: 'switch', label: 'Specific equipment' },
              {
                name: 'equipementListRoom',
                type: 'textarea',
                label: 'Equipment List',
                conditional: (values) => isRoomValue(values) && values.equipementRoom,
                textareaConfig: { rows: 3, maxLength: 1000, showWordCount: true },
              },
            ],
          },
        },
      },
    ],
    [searchLocations],
  );

  const { Form } = useFormedible<SmokeFormValues>({
    schema: smokeFormSchema,
    fields,
    tabs: [
      { id: 'profile', label: 'Profile', description: 'Identity for {{fullName}}' },
      { id: 'preferences', label: 'Preferences', description: 'Preferences and conditional feedback' },
      { id: 'advanced', label: 'Advanced Fields', description: 'Dynamic options and uncommon field types' },
      { id: 'arrays', label: 'Arrays', description: 'Scalar, object, and nested object arrays' },
    ],
    progress: { showSteps: true, showPercentage: true },
    persistence: {
      key: 'formedible-consumer-smoke-large-form',
      storage: 'localStorage',
      debounceMs: 1500,
      exclude: ['acceptTerms', 'resume'],
      restoreOnMount: true,
    },
    analytics,
    formOptions: {
      defaultValues,
      onSubmit: async () => {
        setSubmitted(true);
      },
    },
    submitLabel: 'Submit Smoke Form',
    formClassName: 'space-y-6',
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Formedible Consumer Smoke Form</h1>
        <p className="text-muted-foreground">
          Large generated Better-T-Stack route covering fields, tabs, sections, conditionals, dynamic options,
          persistence, and analytics callbacks.
        </p>
      </header>
      {submitted ? (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-green-800" role="status">
          Smoke form submitted
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Analytics events observed: {analyticsEvents}
      </p>
      <Form className="space-y-6" />
    </main>
  );
}

function isRoomValue(value: unknown): value is { readonly equipementRoom: boolean } {
  return typeof value === 'object' && value !== null && 'equipementRoom' in value && typeof value.equipementRoom === 'boolean';
}
`;
}
