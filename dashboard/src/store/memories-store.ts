// Memories live in a Zustand store: no provider, no reducers, just a hook with state + actions.
// Compare it with tasks-slice.ts to see the two state-management styles side by side.
import { create } from "zustand";

import { errorMessage, memoriesApi } from "@/lib/api-client";
import type { Memory } from "@/types/api";

interface MemoriesState {
  memories: Memory[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (q: string) => void;
  load: () => Promise<void>;
  add: (fact: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useMemories = create<MemoriesState>()((set, get) => ({
  memories: [],
  loading: false,
  error: null,
  query: "",
  setQuery: (query) => set({ query }),
  load: async () => {
    set({ loading: true, error: null });
    try {
      set({ memories: await memoriesApi.list(), loading: false });
    } catch (e) {
      set({ error: errorMessage(e), loading: false });
    }
  },
  add: async (fact) => {
    const memory = await memoriesApi.add(fact);
    set({ memories: [memory, ...get().memories] });
  },
  remove: async (id) => {
    const before = get().memories;
    set({ memories: before.filter((m) => m.id !== id) });
    try {
      await memoriesApi.remove(id);
    } catch (e) {
      set({ memories: before, error: errorMessage(e) });
    }
  },
}));

/** Derived data stays outside the store; components pick what they need. */
export const filterMemories = (memories: Memory[], query: string) => {
  const q = query.trim().toLowerCase();
  return q ? memories.filter((m) => m.fact.toLowerCase().includes(q)) : memories;
};
