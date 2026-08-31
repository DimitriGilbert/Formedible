import type { BenchEnvironment, BenchRecord } from './artifacts';

/**
 * Shared stdout report formatting for the benchmark runners (`run.ts` for the
 * current implementation, `run-main.ts` for the main baseline). Both runners
 * print identical tables so their outputs can be read side by side.
 */

export interface ReportOptions {
  readonly mode: string;
  readonly runs: number;
  readonly only: readonly string[];
  readonly warmupRuns: number;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function formatNumber(value: number): string {
  return value.toFixed(4);
}

export function printReport(
  implementation: string,
  records: readonly BenchRecord[],
  environment: BenchEnvironment,
  options: ReportOptions,
): void {
  const versions = Object.entries(environment.versions)
    .map(([name, version]) => `${name} ${version}`)
    .join(' | ');

  console.log(`Formedible benchmark — implementation: ${implementation}`);
  console.log(`node ${environment.node} | branch ${environment.gitBranch} | sha ${environment.gitSha}`);
  console.log(versions);
  console.log(
    `mode: ${options.mode}${options.only.length > 0 ? ` (--only ${options.only.join(', ')})` : ''} | measured runs: ${options.runs} | warmup runs: ${options.warmupRuns}`,
  );
  console.log('');

  const header = ['scenario', 'metric', 'unit', 'median', 'p75', 'min', 'max', 'runs'];
  const rows = records.map((record) => [
    record.scenario,
    record.metric,
    record.unit,
    formatNumber(record.median),
    formatNumber(record.p75),
    formatNumber(record.min),
    formatNumber(record.max),
    String(record.runs),
  ]);
  const widths = header.map((title, columnIndex) =>
    Math.max(title.length, ...rows.map((row) => row[columnIndex]?.length ?? 0)),
  );
  const formatRow = (row: readonly string[]): string =>
    row
      .map((cell, columnIndex) => (columnIndex < 3 ? cell.padEnd(widths[columnIndex] ?? 0) : cell.padStart(widths[columnIndex] ?? 0)))
      .join('  ')
      .trimEnd();

  console.log(formatRow(header));

  for (const row of rows) {
    console.log(formatRow(row));
  }

  const notedRecords = records.filter((record) => record.notes.length > 0);

  // Scenarios with several metric records each repeat the same scenario-level
  // notes; print every distinct note once per scenario.
  const printedNotes = new Set<string>();

  for (const record of notedRecords) {
    for (const note of record.notes) {
      const key = `${record.scenario}::${note}`;

      if (printedNotes.has(key)) {
        continue;
      }

      printedNotes.add(key);
      console.log(`note [${record.scenario}]: ${note}`);
    }
  }
}
