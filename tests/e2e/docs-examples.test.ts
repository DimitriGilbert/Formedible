import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertNoBrowserFailures,
  closeAgentBrowser,
  getWebTarget,
  openPageAndCheckBrowserFailures,
  runAgentBrowser,
} from './utils/agent-browser';
import type { AllowedBrowserFailure } from './utils/agent-browser';

const allowedKnownFailures: readonly AllowedBrowserFailure[] = [
  {
    source: 'network',
    pattern: /(?=.*favicon\.ico)(?=.*"status": 404)/s,
    reason: 'Headless Chrome automatically requests /favicon.ico; this app does not ship one and page behavior is unaffected.',
  },
];

test('/docs/examples supports category selection and code tab inspection', async () => {
  const session = `formedible-docs-examples-e2e-${process.pid}`;
  const web = await getWebTarget();

  try {
    await openPageAndCheckBrowserFailures({
      session,
      url: `${web.origin}/docs/examples`,
      allowedFailures: allowedKnownFailures,
      run: async () => {
        await waitForRequiredExamplesRouteText(session);

        await runAgentBrowser(['find', 'role', 'button', 'click', '--name', 'Basic examples (6)', '--exact'], session);
        await runAgentBrowser(['find', 'role', 'button', 'click', '--name', 'Contact Form'], session);

        const previewText = await getBodyText(session);

        assert.match(previewText, /Contact Form/);
        assert.match(
          previewText,
          /A contact form with combobox subject selection, creatable categories, validation, and an urgent flag\./,
        );

        await clickVisibleButtonByText(session, 'Code');
        await runAgentBrowser(['wait', '--text', 'Contact Form Implementation'], session);

        const codeText = await getBodyText(session);

        assert.match(codeText, /Contact Form Implementation/);
        assert.match(codeText, /const contactSchema = z\.object/);
        assert.match(codeText, /Subject combobox, multi-combobox categories, validation, and toast submit handling\./);
        assert.match(codeText, /submitLabel: "Send Message"/);
        assert.match(codeText, /Copy/);
      },
    });
  } finally {
    await closeAgentBrowser(session);
    await web.stop();
  }
});

test('/docs/examples supports live Formedible form interactions', async () => {
  const session = `formedible-docs-examples-live-e2e-${process.pid}`;
  const web = await getWebTarget();

  try {
    await openPageAndCheckBrowserFailures({
      session,
      url: `${web.origin}/docs/examples`,
      allowedFailures: allowedKnownFailures,
      run: async () => {
        await waitForRequiredExamplesRouteText(session);

        await submitContactForm(session);
        await assertNoBrowserFailures(session, allowedKnownFailures);

        await completeMultiStepRegistration(session);
        await assertNoBrowserFailures(session, allowedKnownFailures);

        await resetExamplesPage(session, web.origin);
        await verifyCheckoutConditionalPaymentFields(session);
        await resetExamplesPage(session, web.origin);
        await verifyArrayFieldInteractions(session);
      },
    });
  } finally {
    await closeAgentBrowser(session);
    await web.stop();
  }
});

async function submitContactForm(session: string): Promise<void> {
  await runAgentBrowser(['find', 'role', 'button', 'click', '--name', 'Basic examples (6)', '--exact'], session);
  await clickVisibleExampleButton(session, 'Contact Form');
  await runAgentBrowser(['wait', '--text', 'Full Name'], session);

  await fillVisibleFieldByLabel(session, 'Full Name', 'Ada Lovelace');
  await fillVisibleFieldByLabel(session, 'Email', 'ada@example.com');
  await fillVisibleFieldByLabel(session, 'Message', 'Please help me test this contact workflow.');
  await checkVisibleControlByLabel(session, 'This is urgent');
  await clickVisibleButtonByText(session, 'Send Message');
  await runAgentBrowser(['wait', '--text', 'Message sent successfully!'], session);
}

async function resetExamplesPage(session: string, origin: string): Promise<void> {
  await runAgentBrowser(['open', `${origin}/docs/examples`], session);
  await waitForRequiredExamplesRouteText(session);
}

async function completeMultiStepRegistration(session: string): Promise<void> {
  await runAgentBrowser(['find', 'role', 'button', 'click', '--name', 'Basic examples (6)', '--exact'], session);
  await clickVisibleExampleButton(session, 'Multi-Step Registration');
  await runAgentBrowser(['wait', '--text', 'Personal Information'], session);

  await fillVisibleFieldByLabel(session, 'First Name', 'Ada');
  await fillVisibleFieldByLabel(session, 'Last Name', 'Lovelace');
  await fillVisibleFieldByLabel(session, 'Birth Date', '1990-01-02');
  await clickVisibleButtonByText(session, 'Next');
  await runAgentBrowser(['wait', '--text', 'Contact Details'], session);

  const contactPageText = await getBodyText(session);

  assert.match(contactPageText, /How can we reach you Ada \?/);

  await fillVisibleFieldByLabel(session, 'Email', 'ada.registration@example.com');
  await fillVisibleFieldByLabel(session, 'Phone', '+15555550123');
  await fillVisibleFieldByLabel(session, 'Address', '123 Analytical Engine Way');
  await clickVisibleButtonByText(session, 'Next');
  await runAgentBrowser(['wait', '--text', 'Preferences'], session);

  const preferencesText = await getBodyText(session);

  assert.match(preferencesText, /Choose Plan/);
  assert.match(preferencesText, /Basic - Free|Pro - \$9\/month|Enterprise - \$29\/month/);
  await clickVisibleButtonByText(session, 'Submit');
  await runAgentBrowser(['wait', '--text', 'Registration completed!'], session);
}

async function verifyCheckoutConditionalPaymentFields(session: string): Promise<void> {
  await runAgentBrowser(['find', 'role', 'button', 'click', '--name', 'Basic examples (6)', '--exact'], session);
  await clickVisibleExampleButton(session, 'E-commerce Checkout');
  await runAgentBrowser(['wait', '--text', 'Shipping Address'], session);

  await fillVisibleFieldByLabel(session, 'First Name', 'Ada');
  await fillVisibleFieldByLabel(session, 'Last Name', 'Lovelace');
  await fillVisibleFieldByLabel(session, 'Email', 'ada.checkout@example.com');
  await fillVisibleFieldByLabel(session, 'Address', '123 Checkout Lane');
  await fillVisibleFieldByLabel(session, 'City', 'London');
  await fillVisibleFieldByLabel(session, 'ZIP Code', '12345');
  await clickVisibleButtonByText(session, 'Next');
  await runAgentBrowser(['wait', '--text', 'Payment'], session);

  const paymentPageText = await getBodyText(session);

  assert.match(paymentPageText, /Payment Method/);
  assert.match(paymentPageText, /Card Number/);
  assert.match(paymentPageText, /Expiry Date/);

  await checkVisibleControlByLabel(session, 'PayPal');
  await assertVisibleTextAbsent(session, 'Card Number');
  await assertVisibleTextAbsent(session, 'Expiry Date');
}

async function verifyArrayFieldInteractions(session: string): Promise<void> {
  await clickVisibleButtonByText(session, 'Advanced examples (8)');
  await runAgentBrowser(['wait', '--text', 'Dynamic Array Fields'], session);
  await clickVisibleExampleButton(session, 'Dynamic Array Fields');
  await runAgentBrowser(['wait', '--text', 'Team Members'], session);

  await assertSelectorExists(session, '[data-formedible-array-field="teamMembers"]');
  await assertSelectorExists(session, '[data-formedible-array-item="teamMembers[0]"]');
  await clickVisibleButtonByText(session, 'Add Team Member');
  await assertSelectorExists(session, '[data-formedible-array-item="teamMembers[1]"]');
  await clickVisibleButtonByAccessibleName(session, 'Move Team Member 2 up');
  await assertSelectorExists(session, '[data-formedible-array-item="teamMembers[1]"]');
}

async function waitForRequiredExamplesRouteText(session: string): Promise<void> {
  const requiredTexts = [
    'Interactive Examples',
    'All (14)',
    'Basic examples (6)',
    'Advanced examples (8)',
    'Preview',
    'Code',
  ] as const;

  for (const text of requiredTexts) {
    await runAgentBrowser(['wait', '--text', text], session);
  }

  const bodyText = await getBodyText(session);

  for (const text of requiredTexts) {
    assert.match(bodyText, new RegExp(escapeRegExp(text)));
  }
}

async function getBodyText(session: string): Promise<string> {
  const result = await runAgentBrowser(['get', 'text', 'body'], session);

  return result.stdout;
}

async function clickVisibleButtonByText(session: string, text: string): Promise<void> {
  await runAgentBrowser(
    [
      'eval',
      `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find((candidate) => {
          const rect = candidate.getBoundingClientRect();

          return candidate.textContent?.trim() === ${JSON.stringify(text)} && rect.width > 0 && rect.height > 0;
        });

        if (!button) {
          throw new Error('Visible button not found: ${text}');
        }

        button.click();
      })()`,
    ],
    session,
  );
}

async function clickVisibleExampleButton(session: string, title: string): Promise<void> {
  await runAgentBrowser(
    [
      'eval',
      `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          const labels = Array.from(candidate.querySelectorAll('span')).map((span) => span.textContent?.trim());

          return rect.width > 0 && rect.height > 0 && labels.includes(${JSON.stringify(title)});
        });

        if (!button) {
          throw new Error('Visible example button not found: ${title}');
        }

        button.click();
      })()`,
    ],
    session,
  );
}

async function clickVisibleButtonByAccessibleName(session: string, name: string): Promise<void> {
  await runAgentBrowser(['find', 'role', 'button', 'click', '--name', name, '--exact'], session);
}

async function fillVisibleFieldByLabel(session: string, labelText: string, value: string): Promise<void> {
  await runAgentBrowser(['find', 'label', labelText, 'fill', value, '--exact'], session);
}

async function checkVisibleControlByLabel(session: string, labelText: string): Promise<void> {
  await runAgentBrowser(['find', 'label', labelText, 'check', '--exact'], session);
}

async function assertVisibleTextAbsent(session: string, text: string): Promise<void> {
  await runAgentBrowser(
    [
      'eval',
      `(() => {
        const visibleMatches = Array.from(document.querySelectorAll('body *')).filter((element) => {
          const rect = element.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0 && element.textContent?.trim() === ${JSON.stringify(text)};
        });

        if (visibleMatches.length > 0) {
          throw new Error('Expected visible text to be absent: ${text}');
        }
      })()`,
    ],
    session,
  );
}

async function assertSelectorExists(session: string, selector: string): Promise<void> {
  await runAgentBrowser(
    [
      'eval',
      `(() => {
        const element = document.querySelector(${JSON.stringify(selector)});

        if (!element) {
          throw new Error('Selector not found: ${selector}');
        }
      })()`,
    ],
    session,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
