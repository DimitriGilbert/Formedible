import type { AiErrorInfo } from '@formedible/ui/components/formedible/lib/ai-types';

export interface NormalizedAiError extends AiErrorInfo {
  readonly raw: unknown;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringProperty(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];

  return typeof property === 'string' ? property : undefined;
}

function readNestedStringProperty(value: unknown, parentKey: string, childKey: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return readStringProperty(value[parentKey], childKey);
}

function isAbortLikeError(error: unknown): boolean {
  return readStringProperty(error, 'name') === 'AbortError' || readStringProperty(error, 'code') === 'ABORT_ERR';
}

function isAuthLikeMessage(message: string): boolean {
  return /api\s*key|auth|unauthori[sz]ed|forbidden|401|403/i.test(message);
}

function isRateLimitLikeMessage(message: string): boolean {
  return /rate\s*limit|quota|too many requests|429/i.test(message);
}

function isNetworkLikeMessage(message: string): boolean {
  return /network|failed to fetch|connection|timeout|timed out|dns|cors/i.test(message);
}

export function normalizeAiError(error: unknown): NormalizedAiError {
  const directMessage = readStringProperty(error, 'message') ?? readNestedStringProperty(error, 'error', 'message');
  const code = readStringProperty(error, 'code') ?? readNestedStringProperty(error, 'error', 'code');
  const message = directMessage ?? (typeof error === 'string' ? error : 'Unknown AI generation error.');

  if (isAbortLikeError(error)) {
    return {
      message: 'Generation was stopped.',
      code: code ?? 'aborted',
      recoverable: true,
      details: error,
      raw: error,
    };
  }

  if (isAuthLikeMessage(message)) {
    return {
      message: 'The selected provider rejected the request. Check the API key and provider settings.',
      code: code ?? 'provider-auth',
      recoverable: true,
      details: error,
      raw: error,
    };
  }

  if (isRateLimitLikeMessage(message)) {
    return {
      message: 'The selected provider rate-limited the request. Try again later or choose a different model.',
      code: code ?? 'provider-rate-limit',
      recoverable: true,
      details: error,
      raw: error,
    };
  }

  if (isNetworkLikeMessage(message)) {
    return {
      message: 'The request could not reach the selected provider. Check network access and provider availability.',
      code: code ?? 'provider-network',
      recoverable: true,
      details: error,
      raw: error,
    };
  }

  return {
    message: 'The AI provider could not complete the request. Review debug output for provider details.',
    code: code ?? 'provider-error',
    recoverable: true,
    details: error,
    raw: error,
  };
}

export function createAiConfigurationError(message: string, code: string): NormalizedAiError {
  return {
    message,
    code,
    recoverable: true,
    details: { message, code },
    raw: { message, code },
  };
}
