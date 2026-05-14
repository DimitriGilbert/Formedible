import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface AgentBrowserResult {
  readonly stdout: string;
  readonly stderr: string;
}

export type BrowserFailureSource = 'console' | 'page-error' | 'network';

export interface AllowedBrowserFailure {
  readonly source: BrowserFailureSource;
  readonly pattern: RegExp;
  readonly reason: string;
}

interface BrowserFailure {
  readonly source: BrowserFailureSource;
  readonly diagnostic: string;
}

type JsonObject = Record<string, unknown>;

export async function runAgentBrowser(args: readonly string[], session: string): Promise<AgentBrowserResult> {
  const result = await execFileAsync('pnpm', ['exec', 'agent-browser', '--session', session, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AGENT_BROWSER_MAX_OUTPUT: process.env.AGENT_BROWSER_MAX_OUTPUT ?? '50000',
    },
    maxBuffer: 1024 * 1024 * 10,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function runAgentBrowserEval(script: string, session: string): Promise<AgentBrowserResult> {
  return await new Promise<AgentBrowserResult>((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'agent-browser', '--session', session, 'eval', '--stdin'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        AGENT_BROWSER_MAX_OUTPUT: process.env.AGENT_BROWSER_MAX_OUTPUT ?? '50000',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to start agent-browser eval for session ${session}: ${error.message}`));
    });

    child.on('close', (code) => {
      const result: AgentBrowserResult = {
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      };

      if (code !== 0) {
        reject(new Error(`agent-browser eval failed for session ${session} with exit code ${code ?? -1}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`));
        return;
      }

      resolve(result);
    });

    child.stdin.end(script);
  });
}

export async function openPageAndCheckBrowserFailures<TInteractionResult>(options: {
  readonly session: string;
  readonly url: string;
  readonly allowedFailures?: readonly AllowedBrowserFailure[];
  readonly run: () => Promise<TInteractionResult>;
}): Promise<TInteractionResult> {
  validateAllowedFailures(options.allowedFailures ?? []);
  await clearBrowserDiagnostics(options.session);
  await runAgentBrowser(['open', options.url], options.session);

  let interactionResult!: TInteractionResult;
  let interactionError: unknown;

  try {
    interactionResult = await options.run();
  } catch (error) {
    interactionError = error;
  }

  const diagnosticsError = await getBrowserFailureAssertionError(options.session, options.allowedFailures ?? []);

  if (interactionError && diagnosticsError) {
    throw new Error(
      [
        'Generated consumer page interaction failed and browser diagnostics reported failures.',
        'Interaction failure:',
        formatErrorDiagnostic(interactionError),
        'Browser diagnostics failure:',
        diagnosticsError.message,
      ].join('\n'),
    );
  }

  if (interactionError) {
    throw interactionError;
  }

  if (diagnosticsError) {
    throw diagnosticsError;
  }

  return interactionResult;
}

export async function closeAgentBrowser(session: string): Promise<void> {
  try {
    await runAgentBrowser(['close'], session);
  } catch {
    return;
  }
}

async function clearBrowserDiagnostics(session: string): Promise<void> {
  await runAgentBrowser(['console', '--clear'], session);
  await runAgentBrowser(['errors', '--clear'], session);
  await runAgentBrowser(['network', 'requests', '--clear'], session);
}

async function getBrowserFailureAssertionError(
  session: string,
  allowedFailures: readonly AllowedBrowserFailure[],
): Promise<Error | undefined> {
  const [consoleResult, errorsResult, networkResult] = await Promise.all([
    runAgentBrowser(['console', '--json'], session),
    runAgentBrowser(['errors', '--json'], session),
    runAgentBrowser(['network', 'requests', '--json'], session),
  ]);
  const failures = [
    ...getConsoleFailures(consoleResult),
    ...getPageFailures(errorsResult),
    ...getNetworkFailures(networkResult),
  ];

  const unallowedFailures = failures.filter((failure) => !isAllowedFailure(failure, allowedFailures));

  if (unallowedFailures.length === 0) {
    return undefined;
  }

  const diagnostics = unallowedFailures.map((failure, index) => `${index + 1}. [${failure.source}] ${failure.diagnostic}`).join('\n\n');

  return new Error(`Browser diagnostics reported runtime failures.\n\n${diagnostics}`);
}

function validateAllowedFailures(allowedFailures: readonly AllowedBrowserFailure[]): void {
  for (const allowedFailure of allowedFailures) {
    if (allowedFailure.reason.trim() === '') {
      throw new Error('Allowed browser failures must include a reason.');
    }
  }
}

function isAllowedFailure(failure: BrowserFailure, allowedFailures: readonly AllowedBrowserFailure[]): boolean {
  return allowedFailures.some((allowedFailure) => {
    if (allowedFailure.source !== failure.source) {
      return false;
    }

    allowedFailure.pattern.lastIndex = 0;

    return allowedFailure.pattern.test(failure.diagnostic);
  });
}

function getConsoleFailures(result: AgentBrowserResult): readonly BrowserFailure[] {
  const messages = readJsonArray(result.stdout, 'messages');

  return messages.flatMap((message) => {
    const diagnostic = formatUnknownDiagnostic(message);
    const level = getStringProperty(message, ['level', 'type', 'severity']);

    if (level && ['error', 'fatal'].includes(level.toLowerCase())) {
      return [{ source: 'console', diagnostic }];
    }

    return [];
  });
}

function getPageFailures(result: AgentBrowserResult): readonly BrowserFailure[] {
  const errors = readJsonArray(result.stdout, 'errors');

  return errors.map((error) => ({
    source: 'page-error',
    diagnostic: formatUnknownDiagnostic(error),
  }));
}

function getNetworkFailures(result: AgentBrowserResult): readonly BrowserFailure[] {
  const requests = readJsonArray(result.stdout, 'requests');

  return requests.flatMap((request) => {
    const diagnostic = formatUnknownDiagnostic(request);
    const status = getNumberProperty(request, ['status', 'statusCode', 'responseStatus']);
    const errorText = getStringProperty(request, ['errorText', 'failureText', 'error', 'failedReason']);
    const failed = getBooleanProperty(request, ['failed', 'failure']);

    if ((status !== undefined && status >= 400) || Boolean(errorText) || failed === true) {
      return [{ source: 'network', diagnostic }];
    }

    return [];
  });
}

function readJsonArray(stdout: string, propertyName: string): readonly unknown[] {
  const parsed = parseJsonObject(stdout);
  const data = toJsonObject(parsed.data);
  const value = data?.[propertyName];

  if (!Array.isArray(value)) {
    throw new Error(`agent-browser JSON output did not include data.${propertyName} array. Output: ${stdout}`);
  }

  return value;
}

function parseJsonObject(stdout: string): JsonObject {
  const parsed: unknown = JSON.parse(stdout);
  const object = toJsonObject(parsed);

  if (!object) {
    throw new Error(`agent-browser JSON output was not an object. Output: ${stdout}`);
  }

  return object;
}

function toJsonObject(value: unknown): JsonObject | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as JsonObject;
}

function getStringProperty(value: unknown, propertyNames: readonly string[]): string | undefined {
  const object = toJsonObject(value);

  if (!object) {
    return undefined;
  }

  for (const propertyName of propertyNames) {
    const propertyValue = object[propertyName];

    if (typeof propertyValue === 'string') {
      return propertyValue;
    }
  }

  return undefined;
}

function getNumberProperty(value: unknown, propertyNames: readonly string[]): number | undefined {
  const object = toJsonObject(value);

  if (!object) {
    return undefined;
  }

  for (const propertyName of propertyNames) {
    const propertyValue = object[propertyName];

    if (typeof propertyValue === 'number') {
      return propertyValue;
    }
  }

  return undefined;
}

function getBooleanProperty(value: unknown, propertyNames: readonly string[]): boolean | undefined {
  const object = toJsonObject(value);

  if (!object) {
    return undefined;
  }

  for (const propertyName of propertyNames) {
    const propertyValue = object[propertyName];

    if (typeof propertyValue === 'boolean') {
      return propertyValue;
    }
  }

  return undefined;
}

function formatUnknownDiagnostic(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatErrorDiagnostic(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return formatUnknownDiagnostic(error);
}
