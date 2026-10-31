import { describe, expect, it } from "vitest";

import { parseSSE } from "@/lib/sse";

describe("parseSSE", () => {
  it("returns complete events and keeps the unfinished tail", () => {
    const buffer = 'data: {"type":"text","text":"Hel"}\n\ndata: {"type":"text","text":"lo"}\n\ndata: {"type":"do';
    const { events, rest } = parseSSE(buffer);
    expect(events).toEqual([
      { type: "text", text: "Hel" },
      { type: "text", text: "lo" },
    ]);
    expect(rest).toBe('data: {"type":"do');
  });

  it("ignores comments and lines that aren't data", () => {
    const { events } = parseSSE(': keep-alive\n\nevent: ping\ndata: {"type":"done","usage":null,"tools":[]}\n\n');
    expect(events).toEqual([{ type: "done", usage: null, tools: [] }]);
  });

  it("joins a chunk split across two reads", () => {
    const first = parseSSE('data: {"type":"te');
    const second = parseSSE(first.rest + 'xt","text":"hi"}\n\n');
    expect(first.events).toEqual([]);
    expect(second.events).toEqual([{ type: "text", text: "hi" }]);
  });
});
