import { JSDOM } from 'jsdom';

/**
 * React DOM decides at module-evaluation time whether native `input` events
 * can drive `onChange` (`isInputEventSupported` derives from `canUseDOM`). In a
 * plain Node process there is no `window`, so typing-driven benchmarks would
 * dispatch input events that React silently ignores. This module installs a
 * bootstrap DOM window BEFORE `react-dom` is evaluated. It mirrors the
 * `tests/formedible/advanced-fields-dom-bootstrap.ts` discipline: every entry
 * point that reaches `react-dom` must import this module first (import order
 * within `adapter-current.ts` enforces it for the whole bench tree).
 */
const bootstrapDom = new JSDOM('<!doctype html><html><body></body></html>');
const bootstrapWindow = bootstrapDom.window as unknown as Window & typeof globalThis;

globalThis.window = bootstrapWindow;
globalThis.document = bootstrapWindow.document;
