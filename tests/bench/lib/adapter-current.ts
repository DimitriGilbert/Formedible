import './dom-bootstrap';

import { createElement } from 'react';

import { useFormedible } from '../../../packages/formedible/src/hooks/use-formedible';
import type {
  FormedibleArrayConfig,
  FormedibleFieldConfig,
  FormedibleFormValues,
  UseFormedibleOptions,
} from '../../../packages/formedible/src/lib/formedible/types';
import { timeMs } from './bench-timing';
import { renderClient } from './render-client';
import type { RenderedClient } from './render-client';
import type {
  BenchAdapter,
  BenchArrayConfig,
  BenchField,
  BenchPersistenceConfig,
  MountFormOptions,
  MountedForm,
  MsElapsed,
} from './adapter-types';

/**
 * Benchmark adapter for the CURRENT implementation (`packages/formedible/src`).
 *
 * `./dom-bootstrap` must stay the first import: it installs the DOM window
 * `react-dom` needs at module-evaluation time so synthetic `input` events
 * actually drive React `onChange`.
 *
 * Every timed operation measures through the shared `timeMs` helper, so this
 * adapter and the Phase 2 `adapter-main.ts` measure identically. The adapter
 * knows nothing about scenarios; it only implements the mount/operate contract
 * from `adapter-types.ts`.
 */

type UseFormedibleResult = ReturnType<typeof useFormedible<FormedibleFormValues>>;

function toArrayConfig(config: BenchArrayConfig): FormedibleArrayConfig<FormedibleFormValues> {
  return {
    itemType: config.itemType as FormedibleArrayConfig<FormedibleFormValues>['itemType'],
    minItems: config.minItems,
    maxItems: config.maxItems,
    defaultValue: config.defaultValue,
    objectConfig: config.objectConfig
      ? {
          layout: config.objectConfig.layout,
          columns: config.objectConfig.columns,
          fields: config.objectConfig.fields.map((field) => toFieldConfig(field)),
        }
      : undefined,
  };
}

function toFieldConfig(field: BenchField): FormedibleFieldConfig<FormedibleFormValues> {
  return {
    name: field.name,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder,
    required: field.required,
    options: field.options?.map((option) => ({ value: option.value, label: option.label })),
    page: field.page,
    tab: field.tab,
    arrayConfig: field.arrayConfig ? toArrayConfig(field.arrayConfig) : undefined,
  };
}

function toPersistenceConfig(config: BenchPersistenceConfig) {
  return { key: config.key, storage: config.storage, debounceMs: config.debounceMs };
}

async function mountForm(options: MountFormOptions): Promise<MountedForm> {
  const userSubmit = options.onSubmit;
  const config: UseFormedibleOptions<FormedibleFormValues> = {
    fields: options.fields.map((field) => toFieldConfig(field)),
    schema: options.schema,
    pages: options.pages?.map((page) => ({ page: page.page, title: page.title, description: page.description })),
    tabs: options.tabs?.map((tab) => ({ id: tab.id, label: tab.label })),
    persistence: options.persistence ? toPersistenceConfig(options.persistence) : undefined,
    submitLabel: options.submitLabel,
    formOptions: {
      defaultValues: { ...options.defaultValues },
      onSubmit: userSubmit ? (context) => { userSubmit({ value: context.value }); } : undefined,
    },
  };

  let captured: UseFormedibleResult | undefined;

  function BenchFormComponent() {
    const formedible = useFormedible<FormedibleFormValues>(config);

    captured = formedible;

    return createElement(formedible.Form);
  }

  let client: RenderedClient | undefined;
  const mountMs = await timeMs(() => {
    client = renderClient(createElement(BenchFormComponent));
  });

  if (!client) {
    throw new Error('Current-adapter mount did not produce a rendered client.');
  }

  await client.settle();

  function requireClient(): RenderedClient {
    if (!client) {
      throw new Error('The benchmark form client is no longer mounted.');
    }

    return client;
  }

  function requireCaptured(): UseFormedibleResult {
    const hook = captured;

    if (!hook) {
      throw new Error('The current-implementation hook result was not captured during mount.');
    }

    return hook;
  }

  function requireControl(fieldName: string): HTMLInputElement | HTMLTextAreaElement {
    const control = requireClient()
      .document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `input[name="${fieldName}"], textarea[name="${fieldName}"]`,
    );

    if (!control) {
      throw new Error(`No rendered input control is named "${fieldName}".`);
    }

    return control;
  }

  function setNativeValue(control: HTMLInputElement | HTMLTextAreaElement, nextValue: string): void {
    const window = requireClient().window;
    const prototype =
      control instanceof window.HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (!valueSetter) {
      throw new Error('Unable to resolve the native value setter for the typing control.');
    }

    valueSetter.call(control, nextValue);
  }

  return {
    root: {
      unmount: () => {
        requireClient().unmount();
        client = undefined;
        captured = undefined;
      },
    },
    mountMs,
    keystroke: async (fieldName: string, text: string): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const control = requireControl(fieldName);
      const elapsed = await timeMs(() => {
        for (let charCount = 1; charCount <= text.length; charCount += 1) {
          const nextValue = text.slice(0, charCount);

          activeClient.runAct(() => {
            setNativeValue(control, nextValue);
            control.dispatchEvent(new activeClient.window.Event('input', { bubbles: true }));
          });
        }
      });

      await activeClient.settle();

      return elapsed;
    },
    switchPage: async (pageNumber: number): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const setCurrentPage = requireCaptured().setCurrentPage;
      const elapsed = await timeMs(() => {
        activeClient.runAct(() => {
          setCurrentPage(pageNumber);
        });
      });

      await activeClient.settle();

      return elapsed;
    },
    switchTab: async (tabId: string): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const tabIndex = options.tabs?.findIndex((tab) => tab.id === tabId) ?? -1;

      if (tabIndex < 0) {
        throw new Error(`The mounted form has no tab with id "${tabId}".`);
      }

      const trigger = activeClient.document.querySelectorAll<HTMLButtonElement>('[data-tabs-trigger="true"]')[tabIndex];

      if (!trigger) {
        throw new Error(`No rendered tab trigger for tab index ${tabIndex} ("${tabId}").`);
      }

      const elapsed = await timeMs(() => {
        activeClient.runAct(() => {
          trigger.click();
        });
      });

      await activeClient.settle();

      return elapsed;
    },
    arrayAdd: async (fieldName: string): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const fieldRoot = activeClient.document.querySelector(`[data-formedible-array-field="${fieldName}"]`);

      if (!fieldRoot) {
        throw new Error(`No rendered array field named "${fieldName}".`);
      }

      const addButton = [...fieldRoot.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
        button.textContent?.startsWith('Add'),
      );

      if (!addButton) {
        throw new Error(`The array field "${fieldName}" renders no add-item button.`);
      }

      const elapsed = await timeMs(() => {
        activeClient.runAct(() => {
          addButton.click();
        });
      });

      await activeClient.settle();

      return elapsed;
    },
    arrayRemove: async (fieldName: string, itemIndex: number): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const fieldRoot = activeClient.document.querySelector(`[data-formedible-array-field="${fieldName}"]`);

      if (!fieldRoot) {
        throw new Error(`No rendered array field named "${fieldName}".`);
      }

      const removeButton = [...fieldRoot.querySelectorAll<HTMLButtonElement>('button')]
        .filter((button) => button.getAttribute('aria-label')?.startsWith('Remove'))[itemIndex];

      if (!removeButton) {
        throw new Error(`The array field "${fieldName}" renders no remove button for item index ${itemIndex}.`);
      }

      const elapsed = await timeMs(() => {
        activeClient.runAct(() => {
          removeButton.click();
        });
      });

      await activeClient.settle();

      return elapsed;
    },
    submit: async (): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const form = activeClient.document.querySelector('form');

      if (!form) {
        throw new Error('The mounted bench form renders no <form> element.');
      }

      return timeMs(async () => {
        activeClient.runAct(() => {
          form.requestSubmit();
        });
        await activeClient.settle();
        await activeClient.settle();
      });
    },
    persistenceSave: async (): Promise<MsElapsed> => {
      const activeClient = requireClient();
      const saveToStorage = requireCaptured().saveToStorage;

      return timeMs(() => {
        activeClient.runAct(() => {
          saveToStorage();
        });
      });
    },
    getRenderedFieldCount: (): number => {
      const names = new Set<string>();

      requireClient()
        .document.querySelectorAll('form [name]')
        .forEach((control) => {
          const name = control.getAttribute('name');

          if (name !== null) {
            names.add(name);
          }
        });

      return names.size;
    },
  };
}

export const currentAdapter: BenchAdapter = {
  implementation: 'current',
  mountForm,
};
