"use client";

import { motion } from "framer-motion";
import { Bell, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { IntentBarChart } from "@/components/charts/intent-bar-chart";
import { LatencyLineChart } from "@/components/charts/latency-line-chart";
import { SentimentDoughnut } from "@/components/charts/sentiment-doughnut";
import { PageHeader } from "@/components/dashboard/page-header";
import { FormError } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";
import { gql, OVERVIEW_QUERY, type OverviewData } from "@/lib/graphql/client";
import { formatDateTime } from "@/lib/utils";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="gap-1 py-5">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function OverviewView() {
  const [data, setData] = useState<OverviewData["overview"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      gql<OverviewData>(OVERVIEW_QUERY)
        .then((d) => {
          setData(d.overview);
          setError(null);
        })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    load();
  };

  const s = data?.stats;
  // The API lists recent chats newest first; a time series reads left to right, oldest first.
  const timeline = (s?.recent ?? [])
    .filter((r) => r.latencyMs != null && r.at)
    .map((r) => ({ at: r.at!, latencyMs: r.latencyMs! }))
    .reverse();

  return (
    <>
      <PageHeader title="Overview" description="Fetched in a single GraphQL query that combines four REST endpoints">
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </PageHeader>
      <FormError message={error} />

      {!data && loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
          <Skeleton className="h-72 sm:col-span-2" />
          <Skeleton className="h-72 sm:col-span-2" />
        </div>
      ) : data && s ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Messages" value={s.totalMessages.toLocaleString()} sub={`${data.conversationCount} conversations`} />
            <StatTile label="Average response" value={`${(s.avgLatencyMs / 1000).toFixed(1)}s`} sub="per answer" />
            <StatTile label="Open tasks" value={String(data.tasks.open)} sub={`${data.tasks.done} done`} />
            <StatTile
              label="Tokens used"
              value={(s.inputTokens + s.outputTokens).toLocaleString()}
              sub={`${data.memoryCount} memories stored`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <IntentBarChart data={s.byIntent} />
            <SentimentDoughnut scores={s.recent.map((r) => r.sentiment)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LatencyLineChart points={timeline} />
            </div>
            <Card className="gap-4">
              <CardHeader>
                <CardTitle className="font-display text-lg">Upcoming reminders</CardTitle>
              </CardHeader>
              <CardContent>
                {data.tasks.upcoming.length ? (
                  <ul className="grid gap-3">
                    {data.tasks.upcoming.map((t) => (
                      <li key={t.id} className="flex gap-3">
                        <Bell className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(t.remindAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
