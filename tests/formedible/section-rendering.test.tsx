import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import type { FormedibleFieldConfig, FormedibleFormValues } from '../../packages/formedible/src/lib/formedible/types';

interface SectionRenderingValues extends FormedibleFormValues {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
}

function renderSectionForm(fields: readonly FormedibleFieldConfig<SectionRenderingValues>[]) {
  function SectionForm() {
    const { Form } = useFormedible<SectionRenderingValues>({
      fields,
      formOptions: {
        defaultValues: {
          firstName: 'Ada',
          lastName: '',
          email: '',
          phone: '',
        },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  return renderToStaticMarkup(<SectionForm />);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function renderSectionFormClient(
  fields: readonly FormedibleFieldConfig<SectionRenderingValues>[],
  options?: { readonly collapseLabel?: string; readonly expandLabel?: string },
) {
  function SectionForm() {
    const { Form } = useFormedible<SectionRenderingValues>({
      fields,
      collapseLabel: options?.collapseLabel,
      expandLabel: options?.expandLabel,
      formOptions: {
        defaultValues: {
          firstName: 'Ada',
          lastName: '',
          email: '',
          phone: '',
        },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const element = <SectionForm />;
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
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

  const root = createRoot(rootElement);
  act(() => {
    root.render(element);
  });

  return {
    document: dom.window.document,
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

const collapsibleContactSection = {
  title: 'Contact details',
  description: 'How should we reach you?',
  collapsible: true,
} as const;

const collapsibleSectionFields: readonly FormedibleFieldConfig<SectionRenderingValues>[] = [
  { name: 'firstName', label: 'First name' },
  { name: 'email', label: 'Email', section: collapsibleContactSection },
  { name: 'phone', label: 'Phone', section: collapsibleContactSection },
];

function occurrenceCount(source: string, value: string) {
  return source.split(value).length - 1;
}

test('renders string section metadata as a section title', () => {
  const markup = renderSectionForm([
    { name: 'firstName', label: 'First name', section: 'Personal information' },
  ]);

  assert.match(markup, /data-formedible-section="true"/);
  assert.match(markup, />Personal information</);
});

test('renders object section metadata with title and description', () => {
  const markup = renderSectionForm([
    {
      name: 'email',
      label: 'Email',
      section: {
        title: 'Contact details',
        description: 'How should we reach you?',
      },
    },
  ]);

  assert.match(markup, />Contact details</);
  assert.match(markup, />How should we reach you\?</);
});

test('does not duplicate adjacent headers for fields in the same section', () => {
  const markup = renderSectionForm([
    { name: 'email', label: 'Email', section: 'Contact details' },
    { name: 'phone', label: 'Phone', section: 'Contact details' },
  ]);

  assert.equal(occurrenceCount(markup, 'data-formedible-section="true"'), 1);
  assert.equal(occurrenceCount(markup, 'Contact details'), 1);
  assert.match(markup, />Email</);
  assert.match(markup, />Phone</);
});

test('does not duplicate adjacent object section headers with matching title and description', () => {
  const section = { title: 'Contact details', description: 'Shared contact information' };
  const markup = renderSectionForm([
    { name: 'email', label: 'Email', section },
    { name: 'phone', label: 'Phone', section: { ...section } },
  ]);

  assert.equal(occurrenceCount(markup, 'data-formedible-section="true"'), 1);
  assert.equal(occurrenceCount(markup, 'Contact details'), 1);
  assert.equal(occurrenceCount(markup, 'Shared contact information'), 1);
});

test('interpolates form values in section title and description', () => {
  const markup = renderSectionForm([
    {
      name: 'lastName',
      label: 'Last name',
      section: {
        title: 'Profile for {{ firstName }}',
        description: '{{firstName}} can update these details later.',
      },
    },
  ]);

  assert.match(markup, />Profile for Ada</);
  assert.match(markup, />Ada can update these details later\.</);
});

test('collapsible section renders expanded with a toggle by default', async () => {
  const rendered = renderSectionFormClient(collapsibleSectionFields);
  await act(async () => {
    await wait(0);
  });

  assert.match(rendered.document.body.textContent ?? '', /Contact details/);
  assert.ok(rendered.document.querySelector('input[name="email"]'), 'section fields render while expanded');
  assert.ok(rendered.document.querySelector('input[name="phone"]'), 'all section fields render while expanded');

  const toggle = rendered.document.querySelector<HTMLElement>('[data-formedible-section-toggle="true"]');
  assert.ok(toggle, 'the collapsible section must render a toggle button');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.match(toggle.textContent ?? '', /Collapse/);

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(rendered.document.querySelector('input[name="email"]'), null, 'collapsing must hide the section fields');
  assert.equal(rendered.document.querySelector('input[name="phone"]'), null, 'collapsing must hide every section field');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.match(toggle.textContent ?? '', /Expand/);
  assert.ok(rendered.document.querySelector('input[name="firstName"]'), 'fields outside the section stay visible');

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.ok(rendered.document.querySelector('input[name="email"]'), 'expanding must restore the section fields');
  rendered.unmount();
});

test('collapsible section starts collapsed when defaultExpanded is false', async () => {
  const rendered = renderSectionFormClient([
    { name: 'email', label: 'Email', section: { ...collapsibleContactSection, defaultExpanded: false } },
  ]);
  await act(async () => {
    await wait(0);
  });

  assert.match(rendered.document.body.textContent ?? '', /Contact details/);
  assert.equal(rendered.document.querySelector('input[name="email"]'), null, 'defaultExpanded: false must start collapsed');

  const toggle = rendered.document.querySelector<HTMLElement>('[data-formedible-section-toggle="true"]');
  assert.ok(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.ok(rendered.document.querySelector('input[name="email"]'), 'the toggle must expand the section');
  rendered.unmount();
});

test('collapsible section honors custom collapse and expand labels', async () => {
  const rendered = renderSectionFormClient(collapsibleSectionFields, {
    collapseLabel: 'Hide contact',
    expandLabel: 'Show contact',
  });
  await act(async () => {
    await wait(0);
  });

  const toggle = rendered.document.querySelector<HTMLElement>('[data-formedible-section-toggle="true"]');
  assert.ok(toggle);
  assert.match(toggle.textContent ?? '', /Hide contact/);

  act(() => {
    toggle.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.match(toggle.textContent ?? '', /Show contact/);
  rendered.unmount();
});

test('collapsible section renders only one header for adjacent fields', () => {
  const markup = renderSectionForm(collapsibleSectionFields);

  assert.equal(occurrenceCount(markup, 'data-formedible-section="true"'), 1);
  assert.equal(occurrenceCount(markup, 'Contact details'), 1);
  assert.equal(occurrenceCount(markup, 'data-formedible-section-toggle="true"'), 1);
  assert.match(markup, /<h2[^>]*>Contact details<\/h2>/);
  assert.match(markup, />How should we reach you\?</);
});
