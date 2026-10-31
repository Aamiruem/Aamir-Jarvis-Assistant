// Streaming chat with the plain Fetch API. Axios can't read a response body as it arrives in the
// browser, so the one streaming endpoint uses fetch + ReadableStream instead.
import { refreshAccessToken } from "@/lib/api-client";
import { expireSession, getAccessToken } from "@/lib/auth-token";
import type { ChatEvent } from "@/types/api";

/** Splits buffered SSE text into complete events plus the unfinished tail. */
export function parseSSE(buffer: string): { events: ChatEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events = parts
    .map((part) => part.split("\n").find((line) => line.startsWith("data: ")))
    .filter((line): line is string => Boolean(line))
    .map((line) => JSON.parse(line.slice(6)) as ChatEvent);
  return { events, rest };
}

export async function streamChat(
  message: string,
  conversationId: string | undefined,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal,
) {
  const open = () =>
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
      body: JSON.stringify({ message, conversationId }),
      signal,
    });

  let res = await open();
  if (res.status === 401) {
    await refreshAccessToken().catch(() => expireSession());
    res = await open();
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Chat failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const parsed = parseSSE(buffer + decoder.decode(value, { stream: true }));
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
}
