"use client";

// Recharts: declarative SVG charts built from React components.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard } from "@/components/charts/chart-card";

const label = (intent: string) => intent.replace(/_/g, " ");

export function IntentBarChart({ data }: { data: { intent: string; count: number }[] }) {
  const top = data.slice(0, 8);
  return (
    <ChartCard
      title="What you ask about"
      description="Messages per intent, as classified by the NLP model"
      table={{ columns: ["Intent", "Messages"], rows: top.map((d) => [label(d.intent), d.count]) }}
    >
      <div className="h-64" role="img" aria-label="Bar chart of messages per intent">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }} barCategoryGap={4}>
            <CartesianGrid horizontal={false} stroke="var(--viz-grid)" />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--viz-axis)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="intent"
              tickFormatter={label}
              width={96}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              labelFormatter={(v) => label(String(v))}
              formatter={(v) => [v, "Messages"]}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }}
            />
            <Bar dataKey="count" fill="var(--viz-1)" radius={[0, 4, 4, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
