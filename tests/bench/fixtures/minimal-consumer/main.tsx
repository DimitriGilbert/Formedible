import { createRoot } from 'react-dom/client';

import { useFormedible } from '@formedible-src/hooks/use-formedible';
import type { FormedibleFormValues } from '@formedible-src/lib/formedible/types';

/**
 * MINIMAL consumer fixture — exists only for the `bundle-minimal` scenario
 * (PERF-BENCHMARK-PLAN.md §3.2): the smallest realistic formedible consumer
 * (one 3-field form, no validation, no persistence, no scenario machinery, no
 * harness surface). It stays a separate fixture on purpose — the scenario
 * fixture mounts every scenario form and would inflate the byte count; this
 * page's built `assets/*.js` payload is the honest "what does a minimal
 * formedible app ship" number. Formedible is imported from LOCAL SOURCE
 * (`@formedible-src`), so the bundle measures the working tree, exactly what a
 * consumer would install from the registry item built from this source.
 */

function MinimalConsumerForm() {
  const formedible = useFormedible<FormedibleFormValues>({
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'Email' },
      { name: 'notes', type: 'textarea', label: 'Notes' },
    ],
    formOptions: { defaultValues: { name: '', email: '', notes: '' } },
  });

  return <formedible.Form />;
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('The minimal consumer fixture document is missing #root.');
}

createRoot(container).render(<MinimalConsumerForm />);
