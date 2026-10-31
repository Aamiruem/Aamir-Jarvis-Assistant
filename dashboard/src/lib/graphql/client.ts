import { ApiError, http } from "@/lib/api-client";

/** Sends a GraphQL query through the shared Axios client, so token refresh works the same way. */
export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data } = await http.post<{ data?: T; errors?: { message: string }[] }>("/graphql", { query, variables });
  if (data.errors?.length) throw new ApiError(data.errors.map((e) => e.message).join("; "));
  return data.data as T;
}

export const OVERVIEW_QUERY = /* GraphQL */ `
  query Overview {
    overview {
      memoryCount
      conversationCount
      tasks {
        open
        done
        upcoming(limit: 4) {
          id
          title
          remindAt
        }
      }
      stats {
        totalMessages
        avgLatencyMs
        inputTokens
        outputTokens
        byIntent {
          intent
          count
        }
        recent {
          intent
          sentiment
          latencyMs
          at
        }
      }
    }
  }
`;

export interface OverviewData {
  overview: {
    memoryCount: number;
    conversationCount: number;
    tasks: { open: number; done: number; upcoming: { id: number; title: string; remindAt: string }[] };
    stats: {
      totalMessages: number;
      avgLatencyMs: number;
      inputTokens: number;
      outputTokens: number;
      byIntent: { intent: string; count: number }[];
      recent: { intent: string | null; sentiment: number | null; latencyMs: number | null; at: string | null }[];
    };
  };
}
