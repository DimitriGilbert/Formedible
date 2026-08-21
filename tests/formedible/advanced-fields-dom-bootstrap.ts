import { JSDOM } from 'jsdom';

/**
 * React DOM decides at module-evaluation time whether native `input` events can
 * drive `onChange` (`isInputEventSupported` is derived from `canUseDOM`). In a
 * plain Node test process there is no `window`, so date/text input changes would
 * be silently ignored. This module must be imported BEFORE `react-dom` so the
 * interactive tests in `advanced-fields.test.tsx` can fire real input events.
 */
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const domWindow = dom.window as unknown as Window & typeof globalThis;

globalThis.window = domWindow;
globalThis.document = domWindow.document;
