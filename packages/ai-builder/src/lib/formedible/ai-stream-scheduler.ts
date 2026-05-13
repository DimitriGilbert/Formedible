import type { AiStreamEvent } from '@/lib/formedible/ai-types';

export interface AiStreamFlush {
  readonly textDelta: string;
  readonly thinkingDelta: string;
  readonly events: readonly AiStreamEvent[];
}

export type AiStreamFlushCallback = (flush: AiStreamFlush) => void;
export type AiFrameScheduler = (callback: () => void) => number;
export type AiFrameCancellation = (frameId: number) => void;

export interface AiStreamSchedulerOptions {
  readonly scheduleFrame?: AiFrameScheduler;
  readonly cancelFrame?: AiFrameCancellation;
}

function createDefaultFrameScheduler(): AiFrameScheduler {
  return (callback) => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback);
    }

    return globalThis.setTimeout(callback, 16) as unknown as number;
  };
}

function createDefaultFrameCancellation(): AiFrameCancellation {
  return (frameId) => {
    if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(frameId);
      return;
    }

    globalThis.clearTimeout(frameId);
  };
}

export class AiStreamScheduler {
  private textBuffer = '';
  private thinkingBuffer = '';
  private readonly eventBuffer: AiStreamEvent[] = [];
  private frameId: number | undefined;
  private readonly scheduleFrame: AiFrameScheduler;
  private readonly cancelFrame: AiFrameCancellation;
  private readonly onFlush: AiStreamFlushCallback;

  constructor(onFlush: AiStreamFlushCallback, options: AiStreamSchedulerOptions = {}) {
    this.onFlush = onFlush;
    this.scheduleFrame = options.scheduleFrame ?? createDefaultFrameScheduler();
    this.cancelFrame = options.cancelFrame ?? createDefaultFrameCancellation();
  }

  enqueue(event: AiStreamEvent): void {
    this.eventBuffer.push(event);

    if (event.type === 'text-delta') {
      this.textBuffer += event.delta;
    }

    if (event.type === 'thinking-delta') {
      this.thinkingBuffer += event.delta;
    }

    this.scheduleFlush();
  }

  flushNow(): void {
    if (this.frameId !== undefined) {
      this.cancelFrame(this.frameId);
      this.frameId = undefined;
    }

    this.flush();
  }

  private scheduleFlush(): void {
    if (this.frameId !== undefined) {
      return;
    }

    this.frameId = this.scheduleFrame(() => {
      this.frameId = undefined;
      this.flush();
    });
  }

  private flush(): void {
    if (this.textBuffer.length === 0 && this.thinkingBuffer.length === 0 && this.eventBuffer.length === 0) {
      return;
    }

    const flush: AiStreamFlush = {
      textDelta: this.textBuffer,
      thinkingDelta: this.thinkingBuffer,
      events: [...this.eventBuffer],
    };

    this.textBuffer = '';
    this.thinkingBuffer = '';
    this.eventBuffer.length = 0;
    this.onFlush(flush);
  }
}

export function createAiStreamScheduler(onFlush: AiStreamFlushCallback, options?: AiStreamSchedulerOptions): AiStreamScheduler {
  return new AiStreamScheduler(onFlush, options);
}
