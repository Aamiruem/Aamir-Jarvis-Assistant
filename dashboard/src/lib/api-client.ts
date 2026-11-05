// REST client for the Express gateway, built on Axios.
// Interceptors attach the in-memory access token and, on a 401, refresh it once and retry.
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { expireSession, getAccessToken, setAccessToken } from "@/lib/auth-token";
import type { AuthResult, ConversationSummary, Memory, SignedIn, Task, UserNote } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
  }
}

export const http = axios.create({ baseURL: "/api", withCredentials: true, timeout: 30_000 });

let refreshing: Promise<SignedIn> | null = null;

/** One refresh at a time, shared by every request that hit a 401 at the same moment. */
export function refreshAccessToken() {
  refreshing ??= axios
    .post<SignedIn>("/api/auth/refresh", null, { withCredentials: true })
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      return data;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

http.interceptors.response.use(undefined, async (error: AxiosError<{ error?: string; detail?: string; code?: string }>) => {
  const config = error.config as RetryConfig | undefined;
  const isAuthCall = config?.url?.startsWith("/auth/");
  if (error.response?.status === 401 && config && !config._retried && !isAuthCall && getAccessToken()) {
    config._retried = true;
    try {
      await refreshAccessToken();
    } catch {
      expireSession();
      throw new ApiError("Your session has ended. Please sign in again.", 401, "UNAUTHENTICATED");
    }
    return http(config);
  }
  throw toApiError(error);
});

function toApiError(error: AxiosError<{ error?: string; detail?: string; code?: string }>) {
  const res = error.response;
  if (!res) return new ApiError("Can't reach the server. Is the Azarvis backend running? (npm run dev in the project folder)");
  // A non-JSON 5xx comes from the proxy, not our API: the backend isn't reachable.
  const isJson = String(res.headers["content-type"] ?? "").includes("application/json");
  if (!isJson && res.status >= 500) return new ApiError("Can't reach the Azarvis server. Make sure backend/express-api is running.", res.status);
  return new ApiError(res.data?.error ?? res.data?.detail ?? `Request failed (${res.status})`, res.status, res.data?.code);
}

/** Works for thrown Errors and for Redux Toolkit's serialized errors (plain { message } objects). */
export const errorMessage = (e: unknown) => {
  const message = (e as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : "Something went wrong";
};

// ---------- endpoints ----------

const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const authApi = {
  /** On page load: trade the refresh cookie (if any) for an access token. */
  restore: () => refreshAccessToken().then((r) => r.user).catch(() => null),
  login: (email: string, password: string) => data(http.post<AuthResult>("/auth/login", { email, password })),
  verifyLogin: (challengeId: string, code: string) => data(http.post<SignedIn>("/auth/login/verify", { challengeId, code })),
  register: (name: string, email: string, password: string) =>
    data(http.post<AuthResult>("/auth/register", { name, email, password })),
  verifyEmail: (challengeId: string, code: string) => data(http.post<SignedIn>("/auth/verify-email", { challengeId, code })),
  resendOtp: (challengeId: string) => data(http.post("/auth/otp/resend", { challengeId })),
  logout: () => http.post("/auth/logout").catch(() => {}),
};

export const tasksApi = {
  list: () => data(http.get<Task[]>("/ai/tasks", { params: { include_done: true } })),
  add: (title: string, due: string | null, remindAt: string | null) =>
    data(http.post<Task>("/ai/tasks", { title, due, remind_at: remindAt })),
  setDone: (id: number, done: boolean) => data(http.patch<Task>(`/ai/tasks/${id}`, { done })),
  remove: (id: number) => http.delete(`/ai/tasks/${id}`),
};

export const memoriesApi = {
  list: () => data(http.get<Memory[]>("/ai/memories")),
  add: (fact: string) => data(http.post<Memory>("/ai/memories", { fact })),
  remove: (id: number) => http.delete(`/ai/memories/${id}`),
};

export const notesApi = {
  list: () => data(http.get<UserNote[]>("/user-notes")),
  add: (title: string, content: string, category = "General") => data(http.post<UserNote>("/user-notes", { title, content, category })),
  update: (id: string, patch: Partial<Pick<UserNote, "title" | "content" | "category">>) =>
    data(http.put<UserNote>(`/user-notes/${id}`, patch)),
  remove: (id: string) => http.delete(`/user-notes/${id}`),
};

export const conversationsApi = {
  list: () => data(http.get<ConversationSummary[]>("/conversations")),
};
