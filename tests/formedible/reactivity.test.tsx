import './advanced-fields-dom-bootstrap';
import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ReactElement } from 'react';

import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import type {
  FormedibleFieldComponentProps,
  FormedibleFieldController,
  FormedibleFormValues,
  UseFormedibleOptions,
} from '../../packages/formedible/src/lib/formedible/types';

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface ScheduledTimeout {
  readonly id: number;
  handler: () => void;
  remainingMs: number;
}

/**
 * Deterministic replacement for the jsdom `window.setTimeout`/`clearTimeout`
 * pair. The persistence hook debounces through `window.setTimeout`, so tests
 * advance time explicitly instead of sleeping for real debounce windows.
 */
class FakeWindowTimers {
  private nextId = 1;
  private readonly pending = new Map<number, ScheduledTimeout>();

  setTimeout(handler: () => void, ms: number) {
    const id = this.nextId++;
    this.pending.set(id, { id, handler, remainingMs: ms });
    return id;
  }

  clearTimeout(id: number) {
    this.pending.delete(id);
  }

  advance(totalMs: number) {
    let elapsed = 0;

    for (;;) {
      const due = [...this.pending.values()]
        .filter((scheduled) => scheduled.remainingMs <= totalMs - elapsed)
        .sort((first, second) => first.remainingMs - second.remainingMs)
        .at(0);

      if (!due) {
        break;
      }

      elapsed += due.remainingMs;

      for (const scheduled of this.pending.values()) {
        scheduled.remainingMs -= due.remainingMs;
      }

      this.pending.delete(due.id);
      due.handler();
    }

    const leftover = totalMs - elapsed;

    if (leftover > 0) {
      for (const scheduled of this.pending.values()) {
        scheduled.remainingMs -= leftover;
      }
    }
  }
}

function renderClient(element: ReactElement, setupStorage?: (storage: Storage) => void) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
  const rootElement = dom.window.document.getElementById('root');

  assert.ok(rootElement);

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousEvent = globalThis.Event;
  const actGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT;
  const elementPrototype = dom.window.HTMLElement.prototype as HTMLElement & {
    attachEvent?: () => void;
    detachEvent?: () => void;
  };

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Event = dom.window.Event;
  actGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  elementPrototype.attachEvent = () => undefined;
  elementPrototype.detachEvent = () => undefined;

  const fakeTimers = new FakeWindowTimers();
  const windowWithTimers = dom.window as unknown as {
    setTimeout: (handler: () => void, ms?: number) => number;
    clearTimeout: (id: number) => void;
  };
  windowWithTimers.setTimeout = (handler, ms = 0) => fakeTimers.setTimeout(handler, ms);
  windowWithTimers.clearTimeout = (id) => fakeTimers.clearTimeout(id);

  setupStorage?.(dom.window.sessionStorage);

  const root = createRoot(rootElement);
  act(() => {
    root.render(element);
  });

  return {
    document: dom.window.document,
    fakeTimers,
    storage: dom.window.sessionStorage,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      globalThis.HTMLElement = previousHTMLElement;
      globalThis.Event = previousEvent;
      actGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      dom.window.close();
    },
  };
}

type FieldStore = Record<string, FormedibleFieldController | undefined>;

function createCaptureComponent(fieldStore: FieldStore, name: string) {
  return function CapturedField(props: FormedibleFieldComponentProps<FormedibleFormValues>) {
    fieldStore[name] = props.field;

    return (
      <span data-captured-field={props.field.name}>
        <input
          name={props.field.name}
          value={String(props.field.value ?? '')}
          onChange={() => undefined}
          readOnly
        />
        {props.field.error ? <span data-field-error={props.field.name}>{props.field.error}</span> : null}
      </span>
    );
  };
}

interface HookSnapshot {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly visiblePages: readonly number[];
}

function createRecordedForm(snapshots?: HookSnapshot[]) {
  return function RecordedExampleForm({ config }: { readonly config: UseFormedibleOptions<FormedibleFormValues> }) {
    const formedible = useFormedible<FormedibleFormValues>(config);

    if (snapshots) {
      snapshots.push({
        currentPage: formedible.currentPage,
        totalPages: formedible.totalPages,
        visiblePages: formedible.visiblePages,
      });
    }

    return <formedible.Form />;
  };
}

function findButton(document: Document, label: string) {
  const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent === label);

  assert.ok(button, `Expected to find a "${label}" button`);

  return button;
}

test('conditional pages react to typing and Next targets the newly visible page', async () => {
  const fieldStore: FieldStore = {};
  const snapshots: HookSnapshot[] = [];
  const ExampleForm = createRecordedForm(snapshots);
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          { name: 'applicationType', type: 'text', label: 'Application type', page: 1, component: createCaptureComponent(fieldStore, 'applicationType') },
          {
            name: 'firstName',
            type: 'text',
            label: 'First name',
            page: 2,
            conditional: (values) => String(values.applicationType) === 'individual',
          },
          {
            name: 'companyName',
            type: 'text',
            label: 'Company name',
            page: 3,
            conditional: (values) => String(values.applicationType) === 'business',
          },
        ],
        pages: [
          { page: 1, title: 'Type' },
          { page: 2, title: 'Individual' },
          { page: 3, title: 'Business' },
        ],
        formOptions: {
          defaultValues: { applicationType: 'business', firstName: '', companyName: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 3]);
  assert.equal(snapshots.at(-1)?.totalPages, 2);

  act(() => {
    fieldStore.applicationType?.onChange('individual');
  });
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 2]);
  assert.equal(snapshots.at(-1)?.totalPages, 2);
  assert.equal(snapshots.at(-1)?.currentPage, 1);

  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(snapshots.at(-1)?.currentPage, 2);
  assert.ok(rendered.document.querySelector('input[name="firstName"]'), 'Next should land on the conditional page 2');
  assert.equal(rendered.document.querySelector('input[name="companyName"]'), null);
  rendered.unmount();
});

test('typing schedules a debounced save and storage receives the typed value', async () => {
  const fieldStore: FieldStore = {};
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'name', type: 'text', label: 'Name', component: createCaptureComponent(fieldStore, 'name') }],
        persistence: { key: 'reactivity:autosave', storage: 'sessionStorage', debounceMs: 100 },
        formOptions: {
          defaultValues: { name: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  rendered.storage.clear();
  act(() => {
    fieldStore.name?.onChange('Ada Lovelace');
  });
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.fakeTimers.advance(50);
  });
  assert.equal(rendered.storage.getItem('reactivity:autosave'), null, 'debounced save must not fire before debounceMs elapsed');

  act(() => {
    rendered.fakeTimers.advance(50);
  });
  await act(async () => {
    await wait(0);
  });

  const storedPayload: { values?: { name?: string } } = JSON.parse(rendered.storage.getItem('reactivity:autosave') ?? '{}');
  assert.equal(storedPayload.values?.name, 'Ada Lovelace');
  rendered.unmount();
});

test('restore runs once: typed values and current page survive navigation', async () => {
  const fieldStore: FieldStore = {};
  const snapshots: HookSnapshot[] = [];
  const ExampleForm = createRecordedForm(snapshots);
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          { name: 'name', type: 'text', label: 'Name', page: 1, component: createCaptureComponent(fieldStore, 'name') },
          { name: 'email', type: 'text', label: 'Email', page: 2 },
        ],
        pages: [
          { page: 1, title: 'Identity' },
          { page: 2, title: 'Contact' },
        ],
        persistence: { key: 'reactivity:restore-once', storage: 'sessionStorage', debounceMs: 50, restoreOnMount: true },
        formOptions: {
          defaultValues: { name: '', email: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.name?.onChange('Grace');
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    rendered.fakeTimers.advance(60);
  });

  act(() => {
    fieldStore.name?.onChange('Grace Hopper');
  });
  await act(async () => {
    await wait(0);
  });

  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.fakeTimers.advance(100);
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(snapshots.at(-1)?.currentPage, 2, 'navigation re-renders must not snap the page back to the stored snapshot');
  assert.ok(rendered.document.querySelector('input[name="email"]'), 'page 2 field should stay visible after navigation');

  act(() => {
    findButton(rendered.document, 'Previous').click();
  });
  await act(async () => {
    await wait(0);
  });

  const nameInput = rendered.document.querySelector('input[name="name"]') as HTMLInputElement | null;
  assert.ok(nameInput);
  assert.equal(nameInput.value, 'Grace Hopper', 'typed values must survive host re-renders without being reverted to the stored snapshot');
  rendered.unmount();
});

test('mount autosave does not clobber pre-seeded restored storage', async () => {
  const fieldStore: FieldStore = {};
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'name', type: 'text', label: 'Name', component: createCaptureComponent(fieldStore, 'name') }],
        persistence: { key: 'reactivity:no-clobber', storage: 'sessionStorage', debounceMs: 100, restoreOnMount: true },
        formOptions: {
          defaultValues: { name: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
    (storage) => {
      storage.setItem('reactivity:no-clobber', JSON.stringify({ values: { name: 'Ada Lovelace' }, timestamp: 12345 }));
    },
  );
  await act(async () => {
    await wait(0);
  });

  assert.equal(fieldStore.name?.value, 'Ada Lovelace');

  act(() => {
    rendered.fakeTimers.advance(10_000);
  });
  await act(async () => {
    await wait(0);
  });

  const storedPayload: { values?: { name?: string }; timestamp?: number } = JSON.parse(rendered.storage.getItem('reactivity:no-clobber') ?? '{}');
  assert.equal(storedPayload.values?.name, 'Ada Lovelace');
  assert.equal(storedPayload.timestamp, 12345, 'no save may fire between mount-restore and the first real edit');

  act(() => {
    fieldStore.name?.onChange('Grace Hopper');
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    rendered.fakeTimers.advance(100);
  });
  await act(async () => {
    await wait(0);
  });

  const updatedPayload: { values?: { name?: string }; timestamp?: number } = JSON.parse(rendered.storage.getItem('reactivity:no-clobber') ?? '{}');
  assert.equal(updatedPayload.values?.name, 'Grace Hopper');
  assert.notEqual(updatedPayload.timestamp, 12345, 'the first post-restore edit must persist through the debounced save');
  rendered.unmount();
});

test('successful submit clears the draft and the post-submit reset does not resurrect a phantom draft', async () => {
  const fieldStore: FieldStore = {};
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'name', type: 'text', label: 'Name', component: createCaptureComponent(fieldStore, 'name') }],
        persistence: { key: 'reactivity:submit-clear', storage: 'sessionStorage', debounceMs: 50 },
        formOptions: {
          defaultValues: { name: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.name?.onChange('Ada Lovelace');
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    rendered.fakeTimers.advance(50);
  });
  await act(async () => {
    await wait(0);
  });

  const draftPayload: { values?: { name?: string } } = JSON.parse(rendered.storage.getItem('reactivity:submit-clear') ?? '{}');
  assert.equal(draftPayload.values?.name, 'Ada Lovelace', 'the typed draft must be persisted before the submit');

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.storage.getItem('reactivity:submit-clear'), null, 'a successful submit must remove the persisted draft');

  act(() => {
    rendered.fakeTimers.advance(1000);
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.storage.getItem('reactivity:submit-clear'), null, 'the post-submit reset must not re-save the reset defaults as a phantom draft');

  act(() => {
    fieldStore.name?.onChange('Grace Hopper');
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    rendered.fakeTimers.advance(50);
  });
  await act(async () => {
    await wait(0);
  });

  const resurrectedPayload: { values?: { name?: string } } = JSON.parse(rendered.storage.getItem('reactivity:submit-clear') ?? '{}');
  assert.equal(resurrectedPayload.values?.name, 'Grace Hopper', 'a real user edit after the clear must still save through the debounce');
  rendered.unmount();
});

test('inline field errors survive host re-renders triggered by typing in another field', async () => {
  const fieldStore: FieldStore = {};
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          { name: 'email', type: 'text', label: 'Email', required: true, component: createCaptureComponent(fieldStore, 'email') },
          { name: 'firstName', type: 'text', label: 'First name', component: createCaptureComponent(fieldStore, 'firstName') },
        ],
        formOptions: {
          defaultValues: { email: '', firstName: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.email?.onBlur();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.document.querySelector('[data-field-error="email"]')?.textContent, 'Email is required');

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  assert.match(rendered.document.body.textContent ?? '', /Please fix 1 invalid field/);
  assert.equal(rendered.document.querySelector('[data-field-error="email"]')?.textContent, 'Email is required', 'field errors must survive the submit-attempt host re-render');

  act(() => {
    fieldStore.firstName?.onChange('Ada');
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.document.querySelector('[data-field-error="email"]')?.textContent, 'Email is required', 'field errors must survive host re-renders without a Form remount');
  assert.match(rendered.document.body.textContent ?? '', /Please fix 1 invalid field/);
  rendered.unmount();
});

test('submit button and fieldset disable while an async onSubmit is pending', async () => {
  let resolveSubmit: (() => void) | undefined;
  const fieldStore: FieldStore = {};
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'email', type: 'text', label: 'Email', component: createCaptureComponent(fieldStore, 'email') }],
        formOptions: {
          defaultValues: { email: 'ada@example.com' },
          onSubmit: () =>
            new Promise<void>((resolve) => {
              resolveSubmit = resolve;
            }),
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  const submitButton = findButton(rendered.document, 'Submit');
  assert.equal(submitButton.disabled, false);
  assert.equal(rendered.document.querySelector('fieldset')?.hasAttribute('disabled'), false);

  await act(async () => {
    rendered.document.querySelector('form')?.requestSubmit();
    await wait(0);
  });

  assert.equal(submitButton.disabled, true, 'submit button must disable while onSubmit is pending');
  assert.equal(rendered.document.querySelector('fieldset')?.hasAttribute('disabled'), true);

  await act(async () => {
    resolveSubmit?.();
    await wait(0);
  });

  assert.equal(submitButton.disabled, false, 'submit button must re-enable after onSubmit resolves');
  rendered.unmount();
});

test('bare invalid submit surfaces inline field errors and fires onSubmitInvalid exactly once', async () => {
  const fieldStore: FieldStore = {};
  let submitInvalidCalls = 0;
  let consumerSubmitCalls = 0;
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'email', type: 'text', label: 'Email', required: true, component: createCaptureComponent(fieldStore, 'email') }],
        formOptions: {
          defaultValues: { email: '' },
          onSubmit: () => {
            consumerSubmitCalls += 1;
          },
          onSubmitInvalid: () => {
            submitInvalidCalls += 1;
          },
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.document.querySelector('[data-field-error="email"]'), null, 'no inline error may show before any interaction');

  await act(async () => {
    rendered.document.querySelector('form')?.requestSubmit();
    await wait(0);
  });

  assert.equal(submitInvalidCalls, 1, 'onSubmitInvalid must fire exactly once per invalid submit');
  assert.equal(consumerSubmitCalls, 0, 'the consumer onSubmit must not run for an invalid form');
  assert.equal(
    rendered.document.querySelector('[data-field-error="email"]')?.textContent,
    'Email is required',
    'inline errors must appear on a bare submit without a prior blur or edit',
  );
  assert.match(rendered.document.body.textContent ?? '', /Please fix 1 invalid field/);
  rendered.unmount();
});

test('nested field paths deliver clean values objects through formOptions.onChange', async () => {
  const fieldStore: FieldStore = {};
  const onChangePayloads: { readonly value: unknown; readonly formApiValues: unknown }[] = [];
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          { name: 'contacts[0].email', type: 'text', label: 'Contact email', component: createCaptureComponent(fieldStore, 'contactEmail') },
          { name: 'nickname', type: 'text', label: 'Nickname', component: createCaptureComponent(fieldStore, 'nickname') },
        ],
        formOptions: {
          defaultValues: { contacts: [{ email: '' }], nickname: 'Ada' },
          onSubmit: () => undefined,
          onChange: ({ value, formApi }) => {
            onChangePayloads.push({ value, formApiValues: formApi?.state.values });
          },
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.contactEmail?.onChange('ada@example.com');
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(onChangePayloads.length, 1);
  const payload = onChangePayloads[0] as { readonly value: Record<string, unknown>; readonly formApiValues: Record<string, unknown> };

  assert.deepEqual(
    Object.keys(payload.value).sort(),
    ['contacts', 'nickname'],
    'no literal bracket keys may leak into the top-level values object',
  );
  assert.deepEqual(payload.value.contacts, [{ email: 'ada@example.com' }]);
  assert.deepEqual(payload.formApiValues, { contacts: [{ email: 'ada@example.com' }], nickname: 'Ada' });
  rendered.unmount();
});

test('consumer onSubmit failure keeps the persisted draft, skips completion analytics and logs the error', async () => {
  const fieldStore: FieldStore = {};
  let completeCalls = 0;
  const submissionError = new Error('post failed');
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'email', type: 'text', label: 'Email', component: createCaptureComponent(fieldStore, 'email') }],
        persistence: { key: 'reactivity:failed-submit', storage: 'sessionStorage', debounceMs: 50 },
        analytics: {
          onFormComplete: () => {
            completeCalls += 1;
          },
        },
        formOptions: {
          defaultValues: { email: 'ada@example.com' },
          onSubmit: () => {
            throw submissionError;
          },
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.email?.onChange('grace@example.com');
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    rendered.fakeTimers.advance(50);
  });
  await act(async () => {
    await wait(0);
  });

  assert.ok(rendered.storage.getItem('reactivity:failed-submit'), 'the draft must be persisted before the submit attempt');

  const originalConsoleError = console.error;
  const consoleErrors: (readonly unknown[])[] = [];
  console.error = (...args: readonly unknown[]) => {
    consoleErrors.push(args);
  };

  try {
    await act(async () => {
      rendered.document.querySelector('form')?.requestSubmit();
      await wait(0);
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.ok(rendered.storage.getItem('reactivity:failed-submit'), 'the persisted draft must survive a failed submit');
  assert.equal(completeCalls, 0, 'completion analytics must not fire when the consumer onSubmit throws');
  assert.ok(
    consoleErrors.some((args) => args.includes(submissionError)),
    'the submit rejection must be surfaced through console.error',
  );
  rendered.unmount();
});

test('resetting the form restores defaultValues and notifies the consumer onReset', async () => {
  const fieldStore: FieldStore = {};
  let resetCalls = 0;
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'name', type: 'text', label: 'Name', component: createCaptureComponent(fieldStore, 'name') }],
        formOptions: {
          defaultValues: { name: 'Ada' },
          onSubmit: () => undefined,
          onReset: () => {
            resetCalls += 1;
          },
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });
  assert.equal(fieldStore.name?.value, 'Ada');

  act(() => {
    fieldStore.name?.onChange('Grace');
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(fieldStore.name?.value, 'Grace');

  act(() => {
    rendered.document.querySelector('form')?.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }));
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(resetCalls, 1, 'the consumer onReset must fire on form reset');
  assert.equal(fieldStore.name?.value, 'Ada', 'form.reset() must restore the defaultValues');
  rendered.unmount();
});

test('unmount-time onFormAbandon reads the live completion state', async () => {
  const fieldStore: FieldStore = {};
  const abandonContexts: { readonly completionPercentage: number; readonly lastActiveField?: string }[] = [];
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [{ name: 'name', type: 'text', label: 'Name', component: createCaptureComponent(fieldStore, 'name') }],
        analytics: {
          onFormAbandon: (completionPercentage, context) => {
            abandonContexts.push({ completionPercentage, lastActiveField: context?.lastActiveField });
          },
        },
        formOptions: {
          defaultValues: { name: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.name?.onFocus?.();
    fieldStore.name?.onChange('Grace');
  });
  await act(async () => {
    await wait(0);
  });

  rendered.unmount();

  assert.equal(abandonContexts.length, 1);
  const [abandonContext] = abandonContexts;
  assert.ok(abandonContext);
  assert.equal(abandonContext.completionPercentage, 100, 'the abandon context must reflect the values live at unmount, not a mount-time snapshot');
  assert.equal(abandonContext.lastActiveField, 'name');
});

test('sections with ReactNode titles render exactly one header per section run', async () => {
  const profileTitle = <em>Profile</em>;
  const contactTitle = <em>Contact</em>;
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          { name: 'firstName', type: 'text', label: 'First name', section: { title: profileTitle } },
          { name: 'lastName', type: 'text', label: 'Last name', section: { title: profileTitle } },
          { name: 'phone', type: 'text', label: 'Phone', section: { description: 'Shared note' } },
          { name: 'email', type: 'text', label: 'Email', section: { title: contactTitle } },
        ],
        formOptions: {
          defaultValues: { firstName: '', lastName: '', phone: '', email: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  const headers = [...rendered.document.querySelectorAll('[data-formedible-section="true"]')];

  assert.equal(headers.length, 3, 'one header per section run: Profile, the description-only note, and Contact');
  assert.equal(headers[0]?.textContent, 'Profile');
  assert.equal(rendered.document.body.textContent?.split('Profile').length ?? 0, 2, 'the shared ReactNode-titled section header renders exactly once');
  assert.equal(headers[1]?.textContent, 'Shared note');
  assert.equal(headers[2]?.textContent, 'Contact');
  rendered.unmount();
});

test('adjacent sections with different ReactNode titles and identical descriptions render separate headers', async () => {
  const firstTitle = <em>First</em>;
  const secondTitle = <em>Second</em>;
  const ExampleForm = createRecordedForm();
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          { name: 'email', type: 'text', label: 'Email', section: { title: firstTitle, description: 'Shared description' } },
          { name: 'phone', type: 'text', label: 'Phone', section: { title: firstTitle, description: 'Shared description' } },
          { name: 'fax', type: 'text', label: 'Fax', section: { title: secondTitle, description: 'Shared description' } },
          { name: 'pager', type: 'text', label: 'Pager', section: { title: secondTitle, description: 'Different description' } },
        ],
        formOptions: {
          defaultValues: { email: '', phone: '', fax: '', pager: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  const headers = [...rendered.document.querySelectorAll('[data-formedible-section="true"]')];

  assert.equal(headers.length, 3, 'a shared description must not collapse different ReactNode titles, and identical titles with different descriptions split too');
  assert.equal(headers[0]?.textContent, 'FirstShared description');
  assert.equal(headers[1]?.textContent, 'SecondShared description');
  assert.equal(headers[2]?.textContent, 'SecondDifferent description');
  rendered.unmount();
});

test('conditional-pages example shape: page-level conditionals react to typing across a six-page flow', async () => {
  const fieldStore: FieldStore = {};
  const snapshots: HookSnapshot[] = [];
  const ExampleForm = createRecordedForm(snapshots);
  const rendered = renderClient(
    <ExampleForm
      config={{
        fields: [
          {
            name: 'applicationType',
            type: 'radio',
            label: 'Application Type',
            page: 1,
            options: [
              { value: 'individual', label: 'Individual Application' },
              { value: 'business', label: 'Business Application' },
            ],
            component: createCaptureComponent(fieldStore, 'applicationType'),
          },
          { name: 'firstName', type: 'text', label: 'First Name', page: 2, conditional: (values) => String(values.applicationType) === 'individual' },
          { name: 'companyName', type: 'text', label: 'Company Name', page: 3, conditional: (values) => String(values.applicationType) === 'business' },
          { name: 'needsPremium', type: 'checkbox', label: 'Premium', page: 4, component: createCaptureComponent(fieldStore, 'needsPremium') },
          { name: 'premiumFeatures', type: 'multiSelect', label: 'Premium Features', page: 5, options: ['analytics'], conditional: (values) => values.needsPremium === true },
          { name: 'email', type: 'email', label: 'Email', page: 6 },
        ],
        pages: [
          { page: 1, title: 'Application Type' },
          { page: 2, title: 'Personal Information', conditional: (values) => String(values.applicationType) === 'individual' },
          { page: 3, title: 'Business Information', conditional: (values) => String(values.applicationType) === 'business' },
          { page: 4, title: 'Premium Features' },
          { page: 5, title: 'Premium Options', conditional: (values) => values.needsPremium === true },
          { page: 6, title: 'Contact Information' },
        ],
        progress: { showSteps: true, showPercentage: true },
        formOptions: {
          defaultValues: { applicationType: 'business', firstName: '', companyName: '', needsPremium: false, premiumFeatures: [], email: '' },
          onSubmit: () => undefined,
        },
      }}
    />,
  );
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 3, 4, 6]);

  act(() => {
    fieldStore.applicationType?.onChange('individual');
  });
  await act(async () => {
    await wait(0);
  });
  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 2, 4, 6]);

  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(snapshots.at(-1)?.currentPage, 2, 'Next must land on the conditional page 2, not skip ahead');
  assert.ok(rendered.document.querySelector('input[name="firstName"]'));
  assert.equal(rendered.document.querySelector('input[name="companyName"]'), null);

  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(snapshots.at(-1)?.currentPage, 4, 'Next must skip the hidden business page and land on page 4');

  act(() => {
    fieldStore.needsPremium?.onChange(true);
  });
  await act(async () => {
    await wait(0);
  });
  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 2, 4, 5, 6]);
  assert.equal(snapshots.at(-1)?.currentPage, 4);

  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(snapshots.at(-1)?.currentPage, 5, 'Next must target the newly revealed premium page');

  act(() => {
    fieldStore.applicationType?.onChange('business');
  });
  await act(async () => {
    await wait(0);
  });
  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 3, 4, 5, 6]);
  assert.equal(snapshots.at(-1)?.currentPage, 5, 'typing that keeps the current page visible must not move it');

  act(() => {
    fieldStore.needsPremium?.onChange(false);
  });
  await act(async () => {
    await wait(0);
  });
  assert.deepEqual(snapshots.at(-1)?.visiblePages, [1, 3, 4, 6]);
  assert.equal(snapshots.at(-1)?.currentPage, 1, 'hiding the current page via typing must clamp to the first visible page');
  rendered.unmount();
});

test('registration-shaped config with clock-churning defaultValues stays within bounded renders (no max-update-depth)', async () => {
  const fieldStore: FieldStore = {};
  const submitted: unknown[] = [];
  let hostRenders = 0;
  let renderOrdinal = 0;

  /**
   * Reproduces the docs "Multi-Step Registration" example shape: pages with
   * progress and inline `defaultValues` containing `new Date()`. The date is
   * advanced by a full millisecond on EVERY render, which deterministically
   * simulates the slowed-environment pacing where each render cycle crosses a
   * clock boundary (the field of real `new Date()` calls is machine-speed
   * dependent). Before the defaultValues adoption gate, any host re-render
   * while no field is touched (page navigation, the post-submit reset)
   * re-triggered TanStack's defaultValues reseed, whose store notify re-rendered
   * the host and minted another timestamp: an unbounded cascade ending in
   * React error #185.
   */
  function ChurningRegistrationForm() {
    hostRenders += 1;
    renderOrdinal += 1;

    const formedible = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'firstName', type: 'text', label: 'First Name', page: 1, component: createCaptureComponent(fieldStore, 'firstName') },
        { name: 'lastName', type: 'text', label: 'Last Name', page: 1 },
        { name: 'birthDate', type: 'date', label: 'Birth Date', page: 1 },
        { name: 'email', type: 'email', label: 'Email', page: 2 },
        { name: 'address', type: 'textarea', label: 'Address', page: 2 },
      ],
      pages: [
        { page: 1, title: 'Personal Information', description: 'Tell us about yourself' },
        { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}} ?' },
      ],
      progress: { showSteps: true, showPercentage: true },
      formOptions: {
        defaultValues: {
          firstName: '',
          lastName: '',
          birthDate: new Date(1_750_000_000_000 + renderOrdinal),
          email: '',
          address: '',
        },
        onSubmit: ({ value }) => {
          submitted.push(value);
        },
      },
    });

    return <formedible.Form />;
  }

  const rendered = renderClient(<ChurningRegistrationForm />);
  await act(async () => {
    await wait(0);
  });

  // Untouched page navigation re-renders the host: pre-fix this alone ignited
  // the reseed cascade (#185 thrown out of act).
  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    findButton(rendered.document, 'Previous').click();
  });
  await act(async () => {
    await wait(0);
  });

  const rendersAfterNavigation = hostRenders;

  assert.ok(rendersAfterNavigation <= 5, `navigation must render a bounded number of times (got ${rendersAfterNavigation})`);

  act(() => {
    fieldStore.firstName?.onChange('Ada');
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    findButton(rendered.document, 'Next').click();
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(submitted.length, 1, 'the submit must complete exactly once');

  // Return to page 1 so the captured page-1 controller re-renders with the
  // post-reset value (the capture only refreshes while its field is mounted).
  act(() => {
    findButton(rendered.document, 'Previous').click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(fieldStore.firstName?.value, '', 'the post-submit reset must restore the adopted defaultValues');
  assert.ok(hostRenders <= 14, `the whole flow must stay within bounded renders (got ${hostRenders})`);
  rendered.unmount();
});

test('a discrete defaultValues change on an untouched form still reseeds the displayed values', async () => {
  const fieldStore: FieldStore = {};
  let hostRenders = 0;

  /**
   * Builder-preview shape: a memoized-config consumer whose defaultValues
   * content is stable between real edits. A single discrete change (no churn
   * burst) must still be adopted so the untouched preview shows the new
   * defaults — the adoption gate may only freeze clock-churning configs.
   */
  function LiveDefaultsForm() {
    const [defaultName, setDefaultName] = useState('initial');
    const formedible = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'name', type: 'text', label: 'Name', component: createCaptureComponent(fieldStore, 'name') }],
      formOptions: {
        defaultValues: { name: defaultName },
        onSubmit: () => undefined,
      },
    });

    hostRenders += 1;

    return (
      <div>
        <formedible.Form />
        <button type="button" name="__bump-default" onClick={() => setDefaultName('edited')}>
          bump
        </button>
      </div>
    );
  }

  const rendered = renderClient(<LiveDefaultsForm />);
  await act(async () => {
    await wait(0);
  });

  assert.equal(fieldStore.name?.value, 'initial');

  act(() => {
    (rendered.document.querySelector('button[name="__bump-default"]') as HTMLButtonElement).click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(fieldStore.name?.value, 'edited', 'a discrete defaultValues change must reseed the untouched form');
  assert.ok(hostRenders <= 6, `the discrete change must settle within bounded renders (got ${hostRenders})`);
  rendered.unmount();
});
