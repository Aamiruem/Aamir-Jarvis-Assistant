import { beforeEach, describe, expect, it, vi } from "vitest";

import { memoriesApi } from "@/lib/api-client";
import { filterMemories, useMemories } from "@/store/memories-store";

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...actual, memoriesApi: { list: vi.fn(), add: vi.fn(), remove: vi.fn() } };
});

const memory = (id: number, fact: string) => ({ id, fact, created_at: "2026-10-31T10:00:00Z" });
const initial = useMemories.getState();

describe("memories store", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useMemories.setState(initial, true);
  });

  it("loads, adds and searches memories", async () => {
    vi.mocked(memoriesApi.list).mockResolvedValue([memory(1, "Likes tea")]);
    vi.mocked(memoriesApi.add).mockResolvedValue(memory(2, "Lives in Pune"));

    await useMemories.getState().load();
    await useMemories.getState().add("Lives in Pune");

    const { memories } = useMemories.getState();
    expect(memories.map((m) => m.id)).toEqual([2, 1]);
    expect(filterMemories(memories, "PUNE").map((m) => m.id)).toEqual([2]);
  });

  it("puts a memory back if deleting it fails", async () => {
    useMemories.setState({ memories: [memory(1, "Likes tea")] });
    vi.mocked(memoriesApi.remove).mockRejectedValue(new Error("Offline"));

    await useMemories.getState().remove(1);

    expect(useMemories.getState().memories).toHaveLength(1);
    expect(useMemories.getState().error).toBe("Offline");
  });
});
