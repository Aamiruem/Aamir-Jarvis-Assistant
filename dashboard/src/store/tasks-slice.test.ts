import { beforeEach, describe, expect, it, vi } from "vitest";

import { tasksApi } from "@/lib/api-client";
import { makeStore } from "@/store";
import { fetchTasks, selectVisibleTasks, setFilter, toggleTask } from "@/store/tasks-slice";
import type { Task } from "@/types/api";

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...actual, tasksApi: { list: vi.fn(), add: vi.fn(), setDone: vi.fn(), remove: vi.fn() } };
});

const task = (id: number, done = false): Task => ({ id, title: `Task ${id}`, due: null, remind_at: null, done, created_at: "2026-10-31T10:00:00Z" });

describe("tasks slice", () => {
  beforeEach(() => vi.resetAllMocks());

  it("loads tasks and filters them", async () => {
    vi.mocked(tasksApi.list).mockResolvedValue([task(1), task(2, true)]);
    const store = makeStore();
    await store.dispatch(fetchTasks());

    expect(store.getState().tasks.status).toBe("ready");
    expect(selectVisibleTasks(store.getState()).map((t) => t.id)).toEqual([1]); // default filter: open
    store.dispatch(setFilter("done"));
    expect(selectVisibleTasks(store.getState()).map((t) => t.id)).toEqual([2]);
  });

  it("rolls back an optimistic toggle when the server refuses", async () => {
    vi.mocked(tasksApi.list).mockResolvedValue([task(1)]);
    vi.mocked(tasksApi.setDone).mockRejectedValue(new Error("Server said no"));
    const store = makeStore();
    await store.dispatch(fetchTasks());

    const pending = store.dispatch(toggleTask({ id: 1, done: true }));
    expect(store.getState().tasks.items[0].done).toBe(true); // flipped at once
    await pending;
    expect(store.getState().tasks.items[0].done).toBe(false); // and rolled back
    expect(store.getState().tasks.error).toBe("Server said no");
  });
});
