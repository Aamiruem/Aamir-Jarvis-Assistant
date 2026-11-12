// Thin client for the Express API. All calls go to /api (proxied by Vite in dev, nginx in Docker).
//
// Banking-style token handling:
//  - the short-lived access token is kept ONLY in memory (not localStorage, so XSS can't steal it)
//  - the refresh token is an httpOnly cookie the browser sends to /api/auth automatically
//  - when the access token expires (401), we refresh once and retry the request

let accessToken = null;
let refreshing = null; // one refresh at a time, shared by concurrent requests
let onSignedOut = () => {};

export function setAccessToken(t) {
  accessToken = t;
}
export function onSessionExpired(fn) {
  onSignedOut = fn;
}

// Starting only the web page (npm run dev inside frontend/) is the usual cause, so say where to run it.
const SERVER_DOWN =
  "Can't reach the Azarvis server. Start everything with \"npm run dev\" in the main project folder (not inside frontend), or double-click the Azarvis shortcut, then try again.";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refreshAccessToken() {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
    .then(async (res) => {
      if (!res.ok) throw new ApiError('Session expired', res.status);
      const data = await res.json();
      accessToken = data.accessToken;
      return data;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path, { method = 'GET', body, form, auth = true } = {}) {
  const headers = auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  if (body) headers['Content-Type'] = 'application/json';
  return fetch(`/api${path}`, { method, headers, credentials: 'same-origin', body: form ?? (body ? JSON.stringify(body) : undefined) });
}

async function request(path, options = {}) {
  let res = await send(path, options);
  if (res.status === 401 && options.auth !== false && accessToken) {
    try {
      await refreshAccessToken();
      res = await send(path, options);
    } catch {
      accessToken = null;
      onSignedOut();
    }
  }
  if (res.status === 204) return null;
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    // A non-JSON 5xx comes from the dev proxy / nginx, not from our API: the server isn't reachable.
    if (!isJson && res.status >= 500) {
      throw new ApiError(SERVER_DOWN, res.status, data);
    }
    // FastAPI validation errors arrive as a list: show their messages, not "[object Object]".
    const detail = Array.isArray(data.detail)
      ? data.detail.map((d) => `${(d.loc || []).filter((p) => p !== 'body').join('.')}: ${d.msg}`.replace(/^: /, '')).join('; ')
      : data.detail;
    throw new ApiError(data.error || detail || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

/** Like request(), but returns the raw Response (audio, files). Null when signed out. */
export async function requestRaw(path, options = {}) {
  if (!accessToken) return null;
  let res = await send(path, options);
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await send(path, options);
    } catch {
      return null;
    }
  }
  return res;
}

const post = (path, body, extra) => request(path, { method: 'POST', body, ...extra });
const publicPost = (path, body) => post(path, body, { auth: false });

export const auth = {
  /** On page load: use the refresh cookie (if any) to get an access token. */
  async restore() {
    try {
      const data = await refreshAccessToken();
      return data.user;
    } catch {
      return null;
    }
  },
  register: (name, email, password) => publicPost('/auth/register', { name, email, password }),
  verifyEmail: (challengeId, code) => publicPost('/auth/verify-email', { challengeId, code }),
  login: (email, password) => publicPost('/auth/login', { email, password }),
  verifyLogin: (challengeId, code) => publicPost('/auth/login/verify', { challengeId, code }),
  resendOtp: (challengeId) => publicPost('/auth/otp/resend', { challengeId }),
  forgotPassword: (email) => publicPost('/auth/password/forgot', { email }),
  resetPassword: (challengeId, code, newPassword) => publicPost('/auth/password/reset', { challengeId, code, newPassword }),
  // Passkeys (see passkeys.js): no password, the device's Face ID / fingerprint / Windows Hello.
  passkeyOptions: (email) => publicPost('/auth/passkeys/login/options', { email }),
  passkeyLogin: (challengeId, response) => publicPost('/auth/passkeys/login', { challengeId, response }),
  async logout() {
    await publicPost('/auth/logout').catch(() => {});
    accessToken = null;
  },
  logoutAll: () => post('/auth/logout-all'),
  sessions: () => request('/auth/sessions'),
  revokeSession: (id) => request(`/auth/sessions/${id}`, { method: 'DELETE' }),
  activity: () => request('/auth/activity'),
  startPhone: (phone) => post('/auth/me/phone', { phone }),
  verifyPhone: (challengeId, code) => post('/auth/me/phone/verify', { challengeId, code }),
};

export const api = {
  health: () => request('/health', { auth: false }),
  me: () => request('/auth/me'),
  updateMe: (patch) => request('/auth/me', { method: 'PATCH', body: patch }),
  changePassword: (currentPassword, newPassword) => post('/auth/password', { currentPassword, newPassword }),
  deleteAccount: (password) => request('/auth/me', { method: 'DELETE', body: { password } }),

  conversations: (q = '') => request(`/conversations${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  conversation: (id) => request(`/conversations/${id}`),
  renameConversation: (id, title) => request(`/conversations/${id}`, { method: 'PATCH', body: { title } }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),

  memories: () => request('/ai/memories'),
  network: () => request('/system/network'),
  pcWatcher: () => request('/ai/pc-watcher'),
  setPcWatcher: (enabled, checks) => request('/ai/pc-watcher', { method: 'PUT', body: { enabled, checks } }),
  testPcAlert: () => request('/ai/pc-watcher/test', { method: 'POST' }),
  // ML Lab (backend/fastapi-ai/app/routers/mllab.py)
  mlModels: () => request('/ai/mllab/models'),
  mlModel: (id) => request(`/ai/mllab/models/${id}`),
  mlUpload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/ai/mllab/datasets', { method: 'POST', form });
  },
  mlProfile: (datasetId, target) => request(`/ai/mllab/datasets/${datasetId}/profile?target=${encodeURIComponent(target)}`),
  mlTrain: (datasetId, target, name) => request(`/ai/mllab/datasets/${datasetId}/train`, { method: 'POST', body: { target, name } }),
  mlJob: (id) => request(`/ai/mllab/jobs/${id}`),
  mlPredict: (id, rows) => request(`/ai/mllab/models/${id}/predict`, { method: 'POST', body: { rows } }),
  mlDelete: (id) => request(`/ai/mllab/models/${id}`, { method: 'DELETE' }),
  mlRuns: () => request('/ai/mllab/runs'),
  housePrice: () => request('/ai/mllab/house-price'),
  housePredict: (inputs) => request('/ai/mllab/house-price/predict', { method: 'POST', body: inputs }),
  addMemory: (fact) => request('/ai/memories', { method: 'POST', body: { fact } }),
  deleteMemory: (id) => request(`/ai/memories/${id}`, { method: 'DELETE' }),

  notifications: (unreadOnly = false) => request(`/ai/notifications?unread_only=${unreadOnly}`),
  markRead: (ids) => request('/ai/notifications/read', { method: 'POST', body: { ids } }),

  myStats: () => request('/ai/stats'),
  adminOverview: () => request('/admin/overview'),
  setRole: (userId, role) => request(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role } }),
  unlockUser: (userId) => post(`/admin/users/${userId}/unlock`),
  adminFeedback: (limit = 50) => request(`/admin/feedback?limit=${limit}`),
  passkeys: () => request('/auth/passkeys'),
  passkeyRegisterOptions: () => post('/auth/passkeys/register/options', {}),
  addPasskey: (challengeId, response, name) => post('/auth/passkeys', { challengeId, response, name }),
  removePasskey: (id) => request(`/auth/passkeys/${id}`, { method: 'DELETE' }),
  // Public: works signed out (the website and the demo); linked to the account when signed in.
  sendFeedback: (feedback) => post('/feedback', feedback),

  documents: () => request('/ai/rag/documents'),
  // Personal notes (Express /api/user-notes, also shown in the dashboard)
  userNotes: () => request('/user-notes'),
  addUserNote: (title, content, category = 'General') => request('/user-notes', { method: 'POST', body: { title, content, category } }),
  updateUserNote: (id, patch) => request(`/user-notes/${id}`, { method: 'PUT', body: patch }),
  // Notes written by Azarvis with the master prompt (AI service, background job)
  makeStudyNotes: (body) => request('/ai/study-notes/generate', { method: 'POST', body }),
  studyNotesJob: (id) => request(`/ai/study-notes/jobs/${id}`),
  addTextDocument: (title, text) => request('/ai/rag/text', { method: 'POST', body: { title, text } }),
  addWebPage: (url) => request('/ai/rag/url', { method: 'POST', body: { url } }),
  uploadDocument: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/ai/rag/upload', { method: 'POST', form });
  },
  deleteDocument: (id) => request(`/ai/rag/documents/${id}`, { method: 'DELETE' }),
  searchDocuments: (query) => request('/ai/rag/search', { method: 'POST', body: { query, k: 4 } }),

  /** useLlm: false = local face detection only (fast, free, nothing sent to Claude). */
  analyzeImage: (blob, question, { useLlm = true } = {}) => {
    const form = new FormData();
    form.append('file', blob, 'capture.jpg');
    form.append('question', question || '');
    form.append('use_llm', String(useLlm));
    return request('/ai/vision/analyze', { method: 'POST', form });
  },

  systemStatus: () => request('/ai/system/status'),
  whatsappStatus: () => request('/ai/whatsapp/status'),
  whatsappTest: () => request('/ai/whatsapp/test', { method: 'POST' }),
  whatsappServer: () => request('/whatsapp/status'),
  systemAction: (action, target) => request('/ai/system/action', { method: 'POST', body: { action, target } }),

  contacts: (q = '') => request(`/ai/contacts${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  addContact: (contact) => request('/ai/contacts', { method: 'POST', body: contact }),
  updateContact: (id, patch) => request(`/ai/contacts/${id}`, { method: 'PATCH', body: patch }),
  deleteContact: (id) => request(`/ai/contacts/${id}`, { method: 'DELETE' }),

  tasks: (includeDone = true) => request(`/ai/tasks?include_done=${includeDone}`),
  addTask: (title, due, remindAt) =>
    request('/ai/tasks', { method: 'POST', body: { title, due: due || null, remind_at: remindAt || null } }),
  toggleTask: (id, done) => request(`/ai/tasks/${id}`, { method: 'PATCH', body: { done } }),
  deleteTask: (id) => request(`/ai/tasks/${id}`, { method: 'DELETE' }),
};

/** Streams a chat turn. onEvent receives each parsed SSE event object. */
export async function streamChat(message, conversationId, onEvent, signal, { voice = false } = {}) {
  const open = () =>
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ message, conversationId, voice }),
      signal,
    });
  let res = await open();
  if (res.status === 401) {
    await refreshAccessToken().catch(() => onSignedOut());
    res = await open();
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Chat failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop();
    for (const part of parts) {
      if (part.startsWith('data: ')) onEvent(JSON.parse(part.slice(6)));
    }
  }
}
