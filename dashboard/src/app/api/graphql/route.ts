// POST /api/graphql: runs a GraphQL query against the REST gateway with the caller's token.
import { BackendError, execute, type BackendFetch } from "@/lib/graphql/schema";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) return Response.json({ errors: [{ message: "Sign in first" }] }, { status: 401 });

  let body: { query?: string; variables?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ errors: [{ message: "Body must be JSON" }] }, { status: 400 });
  }
  if (!body.query) return Response.json({ errors: [{ message: "Missing query" }] }, { status: 400 });

  const backend: BackendFetch = async (path) => {
    const res = await fetch(`${BACKEND_URL}/api${path}`, { headers: { authorization }, cache: "no-store" });
    if (!res.ok) throw new BackendError(`${path} failed (${res.status})`, res.status);
    return res.json();
  };

  const result = await execute(body.query, body.variables, backend);
  // An expired token surfaces as HTTP 401 so the browser's Axios interceptor refreshes and retries.
  const expired = result.errors?.some((e) => e.originalError instanceof BackendError && e.originalError.status === 401);
  return Response.json(result, { status: expired ? 401 : 200 });
}
