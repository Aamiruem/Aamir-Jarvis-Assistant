// Tasks live in Redux Toolkit: async thunks talk to the API, the slice keeps the list.
// Toggling is optimistic: the checkbox flips at once and rolls back if the server says no.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { errorMessage, tasksApi } from "@/lib/api-client";
import type { Task } from "@/types/api";

export type TaskFilter = "all" | "open" | "done";

export interface TasksState {
  items: Task[];
  status: "idle" | "loading" | "ready" | "failed";
  error: string | null;
  filter: TaskFilter;
}

const initialState: TasksState = { items: [], status: "idle", error: null, filter: "open" };

export const fetchTasks = createAsyncThunk("tasks/fetch", () => tasksApi.list());

export const addTask = createAsyncThunk("tasks/add", (t: { title: string; due: string | null; remindAt: string | null }) =>
  tasksApi.add(t.title, t.due, t.remindAt),
);

export const toggleTask = createAsyncThunk("tasks/toggle", (t: { id: number; done: boolean }) => tasksApi.setDone(t.id, t.done));

export const deleteTask = createAsyncThunk("tasks/delete", async (id: number) => {
  await tasksApi.remove(id);
  return id;
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setFilter(state, action: { payload: TaskFilter }) {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = errorMessage(action.error);
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(toggleTask.pending, (state, action) => {
        const task = state.items.find((t) => t.id === action.meta.arg.id);
        if (task) task.done = action.meta.arg.done;
      })
      .addCase(toggleTask.rejected, (state, action) => {
        const task = state.items.find((t) => t.id === action.meta.arg.id);
        if (task) task.done = !action.meta.arg.done;
        state.error = errorMessage(action.error);
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      });
  },
});

export const { setFilter } = tasksSlice.actions;
export default tasksSlice.reducer;

export const selectVisibleTasks = (state: { tasks: TasksState }) => {
  const { items, filter } = state.tasks;
  if (filter === "all") return items;
  return items.filter((t) => (filter === "done" ? t.done : !t.done));
};
