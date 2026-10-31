// A small GraphQL layer in front of the REST API ("backend for frontend").
// The overview page asks for exactly the fields it draws, in one request, and the server
// fans out to four REST endpoints in parallel with the caller's own access token.
import { buildSchema, graphql } from "graphql";

import type { ChatStats, ConversationSummary, Memory, Task } from "@/types/api";

export const typeDefs = /* GraphQL */ `
  type IntentCount {
    intent: String!
    count: Int!
  }

  type RecentChat {
    message: String!
    intent: String
    sentiment: Float
    latencyMs: Int
    at: String
  }

  type Stats {
    totalMessages: Int!
    avgLatencyMs: Int!
    inputTokens: Int!
    outputTokens: Int!
    byIntent: [IntentCount!]!
    recent: [RecentChat!]!
  }

  type Task {
    id: Int!
    title: String!
    due: String
    remindAt: String
    done: Boolean!
  }

  type TaskSummary {
    open: Int!
    done: Int!
    upcoming(limit: Int = 5): [Task!]!
  }

  type Overview {
    stats: Stats!
    tasks: TaskSummary!
    memoryCount: Int!
    conversationCount: Int!
  }

  type Query {
    overview: Overview!
  }
`;

export const schema = buildSchema(typeDefs);

/** Fetches a REST path on the gateway on behalf of the caller. Throws BackendError on failure. */
export type BackendFetch = <T>(path: string) => Promise<T>;

export class BackendError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const toTask = (t: Task) => ({ id: t.id, title: t.title, due: t.due, remindAt: t.remind_at, done: t.done });

// Root resolvers: graphql-js calls a function-valued field on the root object to resolve it.
const rootValue = {
  async overview(_args: unknown, { backend }: { backend: BackendFetch }) {
    const [stats, tasks, memories, conversations] = await Promise.all([
      backend<ChatStats>("/ai/stats"),
      backend<Task[]>("/ai/tasks?include_done=true"),
      backend<Memory[]>("/ai/memories"),
      backend<ConversationSummary[]>("/conversations"),
    ]);
    const open = tasks.filter((t) => !t.done);
    return {
      stats: {
        totalMessages: stats.total_messages,
        avgLatencyMs: stats.avg_latency_ms,
        inputTokens: stats.input_tokens,
        outputTokens: stats.output_tokens,
        byIntent: Object.entries(stats.by_intent)
          .map(([intent, count]) => ({ intent, count }))
          .sort((a, b) => b.count - a.count),
        recent: stats.recent.map((r) => ({ ...r, latencyMs: r.latency_ms })),
      },
      tasks: {
        open: open.length,
        done: tasks.length - open.length,
        upcoming: ({ limit }: { limit: number }) =>
          open
            .filter((t) => t.remind_at)
            .sort((a, b) => a.remind_at!.localeCompare(b.remind_at!))
            .slice(0, limit)
            .map(toTask),
      },
      memoryCount: memories.length,
      conversationCount: conversations.length,
    };
  },
};

export function execute(source: string, variableValues: Record<string, unknown> | undefined, backend: BackendFetch) {
  return graphql({ schema, source, rootValue, variableValues, contextValue: { backend } });
}
