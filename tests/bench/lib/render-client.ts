import './dom-bootstrap';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { ReactElement } from 'react';

/**
 * Shared jsdom mount harness for the benchmark adapters, modeled on the
 * `renderClient` helpers in `tests/formedible/reactivity.test.tsx` and
 * `tests/formedible/advanced-fields.test.tsx`: a fresh JSDOM instance per
 * mount, `globalThis` DOM globals patched for the lifetime of the mount,
 * `IS_REACT_ACT_ENVIRONMENT` enabled, and everything restored on unmount.
 *
 * The first import (`./dom-bootstrap`) must stay first so `react-dom` sees a
 * DOM window when it is evaluated and keeps native `input` event support.
 */
export interface RenderedClient {
  readonly document: Document;
  readonly window: Window & typeof globalThis;
  readonly storage: Storage;
  /** Runs a synchronous interaction inside `act` (event dispatch, clicks). */
  runAct(operation: () => void): void;
  /** Runs an asynchronous interaction inside `act`. */
  runAsyncAct(operation: () => Promise<void>): Promise<void>;
  /** Flushes pending microtasks/macrotasks inside `act` until the tree settles. */
  settle(): Promise<void>;
  unmount(): void;
}

function wait(durationMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

export function renderClient(element: ReactElement): RenderedClient {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const rootElement = dom.window.document.getElementById('root');

  if (!rootElement) {
    throw new Error('Bench JSDOM document is missing its #root element.');
  }

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousElement = globalThis.Element;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const previousGetComputedStyle = globalThis.getComputedStyle;
  const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
  const previousCancelAnimationFrame = globalThis.cancelAnimationFrame;
  const actGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT;
  const elementPrototype = dom.window.HTMLElement.prototype as HTMLElement & {
    attachEvent?: () => void;
    detachEvent?: () => void;
  };

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;
  globalThis.Event = dom.window.Event;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame =
    dom.window.requestAnimationFrame?.bind(dom.window) ?? previousRequestAnimationFrame;
  globalThis.cancelAnimationFrame =
    dom.window.cancelAnimationFrame?.bind(dom.window) ?? previousCancelAnimationFrame;
  actGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  elementPrototype.attachEvent = () => undefined;
  elementPrototype.detachEvent = () => undefined;

  const root = createRoot(rootElement);

  act(() => {
    root.render(element);
  });

  return {
    document: dom.window.document,
    window: dom.window as unknown as Window & typeof globalThis,
    storage: dom.window.sessionStorage,
    runAct: (operation: () => void) => {
      act(() => {
        operation();
      });
    },
    runAsyncAct: async (operation: () => Promise<void>) => {
      await act(async () => {
        await operation();
      });
    },
    settle: async () => {
      await act(async () => {
        await wait(0);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      globalThis.HTMLElement = previousHTMLElement;
      globalThis.Element = previousElement;
      globalThis.Node = previousNode;
      globalThis.Event = previousEvent;
      globalThis.getComputedStyle = previousGetComputedStyle;
      globalThis.requestAnimationFrame = previousRequestAnimationFrame;
      globalThis.cancelAnimationFrame = previousCancelAnimationFrame;
      actGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      dom.window.close();
    },
  };
}
