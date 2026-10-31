"use client";

// Chart.js draws on a <canvas>, so it can't read CSS variables by itself: we resolve the
// theme's colors in JavaScript and redraw when the theme changes.
import { ArcElement, Chart as ChartJS, Tooltip } from "chart.js";
import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";

import { ChartCard } from "@/components/charts/chart-card";
import { useTheme } from "@/context/theme-context";
import { countSentiment, type SentimentBucket } from "@/lib/sentiment";

ChartJS.register(ArcElement, Tooltip);

const ORDER: SentimentBucket[] = ["positive", "neutral", "negative"];
const LABEL: Record<SentimentBucket, string> = { positive: "Positive", neutral: "Neutral", negative: "Negative" };

const cssVar = (name: string) =>
  typeof window === "undefined" ? "#888" : getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function SentimentDoughnut({ scores }: { scores: (number | null)[] }) {
  const { resolved } = useTheme();
  const counts = countSentiment(scores);
  const total = scores.length;

  const data = useMemo(() => {
    const colors = ORDER.map((b) => cssVar(`--viz-${b}`));
    return {
      labels: ORDER.map((b) => LABEL[b]),
      datasets: [
        {
          data: ORDER.map((b) => counts[b]),
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderColor: cssVar("--card"), // 2px surface gap between slices
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };
    // `resolved` is a dependency on purpose: the CSS variables change with the theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.positive, counts.neutral, counts.negative, resolved]);

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <ChartCard
      title="How you sound"
      description={`Sentiment of your last ${total} messages`}
      table={{ columns: ["Sentiment", "Messages"], rows: total ? ORDER.map((b) => [LABEL[b], counts[b]]) : [] }}
    >
      <div className="flex items-center gap-6">
        <div className="relative size-40 shrink-0" role="img" aria-label="Doughnut chart of message sentiment">
          <Doughnut
            key={resolved}
            data={data}
            options={{ cutout: "68%", maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: (c) => ` ${c.parsed} messages` } } } }}
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-semibold tabular-nums">{pct(counts.positive)}%</div>
              <div className="text-xs text-muted-foreground">positive</div>
            </div>
          </div>
        </div>
        {/* Legend with values: identity never depends on color alone. */}
        <ul className="grid gap-2 text-sm">
          {ORDER.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <span className="size-3 rounded-sm" style={{ background: `var(--viz-${b})` }} aria-hidden="true" />
              <span>{LABEL[b]}</span>
              <span className="ml-auto pl-4 whitespace-nowrap text-muted-foreground tabular-nums">
                {counts[b]} · {pct(counts[b])}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
