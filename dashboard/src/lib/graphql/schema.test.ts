import { describe, expect, it } from "vitest";

import { OVERVIEW_QUERY, type OverviewData } from "@/lib/graphql/client";
import { BackendError, execute, type BackendFetch } from "@/lib/graphql/schema";

const responses: Record<string, unknown> = {
  "/ai/stats": {
    total_messages: 3,
    active_users: 1,
    by_intent: { weather: 1, task: 2 },
    avg_latency_ms: 1200,
    input_tokens: 100,
    output_tokens: 50,
    recent: [{ message: "hi", intent: "task", sentiment: 0.4, tools: null, latency_ms: 900, at: "2026-10-31T10:00:00Z" }],
  },
  "/ai/tasks?include_done=true": [
    { id: 1, title: "Later", due: null, remind_at: "2026-11-02T10:00:00Z", done: false, created_at: "" },
    { id: 2, title: "Sooner", due: null, remind_at: "2026-11-01T10:00:00Z", done: false, created_at: "" },
    { id: 3, title: "Done", due: null, remind_at: null, done: true, created_at: "" },
  ],
  "/ai/memories": [{ id: 1, fact: "x", created_at: "" }],
  "/conversations": [{ id: "a" }, { id: "b" }],
};

const fakeBackend: BackendFetch = async <T,>(path: string) => responses[path] as T;

describe("GraphQL overview", () => {
  it("combines the REST endpoints into one result", async () => {
    const result = await execute(OVERVIEW_QUERY, undefined, fakeBackend);
    expect(result.errors).toBeUndefined();
    const { overview } = result.data as unknown as OverviewData;

    expect(overview.conversationCount).toBe(2);
    expect(overview.memoryCount).toBe(1);
    expect(overview.tasks).toMatchObject({ open: 2, done: 1 });
    expect(overview.tasks.upcoming.map((t) => t.title)).toEqual(["Sooner", "Later"]);
    expect(overview.stats.byIntent[0]).toEqual({ intent: "task", count: 2 });
    expect(overview.stats.recent[0].latencyMs).toBe(900);
  });

  it("reports backend failures as GraphQL errors", async () => {
    const failing: BackendFetch = async () => {
      throw new BackendError("expired", 401);
    };
    const result = await execute("{ overview { memoryCount } }", undefined, failing);
    expect(result.errors?.[0].originalError).toBeInstanceOf(BackendError);
  });
});
