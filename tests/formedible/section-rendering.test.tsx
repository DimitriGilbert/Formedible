import assert from 'node:assert/strict';
import test from 'node:test';
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
