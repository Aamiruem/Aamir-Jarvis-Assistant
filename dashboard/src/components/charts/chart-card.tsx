import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description: string;
  /** Every chart also ships its numbers as a table, for screen readers and exact values. */
  table: { columns: [string, string]; rows: [string, string | number][] };
  children: React.ReactNode;
}

export function ChartCard({ title, description, table, children }: ChartCardProps) {
  return (
    <Card className="min-w-0 gap-4">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {table.rows.length ? children : <p className="py-10 text-center text-sm text-muted-foreground">No chats yet. Say hello to Azarvis first.</p>}
        {table.rows.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
            <table className="mt-2 w-full text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 font-medium">{table.columns[0]}</th>
                  <th className="py-1 text-right font-medium">{table.columns[1]}</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map(([k, v], i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">{k}</td>
                    <td className="py-1 text-right tabular-nums">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
