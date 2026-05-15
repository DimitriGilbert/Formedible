export type ApiPropertyTableRow = {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly description: string;
  readonly required?: boolean;
};

type ApiPropertyTableProps = {
  readonly rows: readonly ApiPropertyTableRow[];
};

export function ApiPropertyTable({ rows }: ApiPropertyTableProps) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-border">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="bg-background">
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                Property
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                Type
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                Default
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="bg-background align-top">
                <td className="border-t border-border px-4 py-3 text-foreground">
                  <div className="flex min-w-40 items-center gap-2">
                    <code className="font-mono text-xs font-semibold text-foreground">{row.name}</code>
                    {row.required ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-primary">
                        Required
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="border-t border-border px-4 py-3 text-muted-foreground">
                  <div className="max-w-64 overflow-x-auto pb-1">
                    <code className="font-mono text-xs whitespace-nowrap text-muted-foreground">{row.type}</code>
                  </div>
                </td>
                <td className="border-t border-border px-4 py-3 text-muted-foreground">
                  {row.defaultValue ? <code className="font-mono text-xs text-muted-foreground">{row.defaultValue}</code> : <span>—</span>}
                </td>
                <td className="min-w-72 border-t border-border px-4 py-3 leading-relaxed text-muted-foreground">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
