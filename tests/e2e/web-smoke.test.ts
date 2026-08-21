import assert from 'node:assert/strict';
import test from 'node:test';

import {
  closeAgentBrowser,
  getWebTarget,
  openPageAndCheckBrowserFailures,
  runAgentBrowser,
} from './utils/agent-browser';

test('web landing page renders and exposes primary docs navigation', async () => {
  const session = `formedible-e2e-${process.pid}`;
  const web = await getWebTarget();

  try {
    await openPageAndCheckBrowserFailures({
      session,
      testName: 'web landing page renders and exposes primary docs navigation',
      url: web.origin,
      allowedFailures: [
        {
          source: 'network',
          pattern: /(?=.*favicon\.ico)(?=.*"status": 404)/s,
          reason: 'Headless Chrome automatically requests /favicon.ico; this app does not ship one and page behavior is unaffected.',
        },
      ],
      run: async () => {
        await runAgentBrowser(['wait', '--text', 'Shadcn component'], session);

        const snapshot = await runAgentBrowser(['snapshot', '-i', '-c'], session);

        assert.match(snapshot.stdout, /Read the docs/);
        assert.match(snapshot.stdout, /View examples/);
      },
    });
  } finally {
    await closeAgentBrowser(session);
    await web.stop();
  }
});
