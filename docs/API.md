# API reference

## How a request flows

```
Browser ──JWT──► backend/express-api (:4000) ──X-Internal-Key + X-User-Id + X-User-Role──► backend/fastapi-ai (:8000)
```

- The **browser** only talks to the Express API, with `Authorization: Bearer <access token>`.
  The access token lasts 15 minutes; the browser gets a new one from `POST /api/auth/refresh`
  using the httpOnly `jarvis_rt` cookie.
- The **gateway** verifies the JWT, then calls the AI service with the shared `X-Internal-Key` and
  the user's id and role, taken from the token. Any `X-User-*` headers sent by the browser are
  overwritten, so nobody can impersonate another user.
- Everything under `/api/ai/*` is forwarded to the AI service with the `/api/ai` prefix removed:
  `GET /api/ai/tasks` → `GET /tasks`.

---

## Express API (Node + MongoDB): `http://localhost:4000`

### Auth: `/api/auth`
Responses that complete a sign-in return `{accessToken, user}` and set the `jarvis_rt` refresh cookie.
Responses that need a code return a challenge: `{challengeId, channel, maskedDestination, expiresAt, resendAvailableAt}`
plus `emailVerificationRequired: true` or `mfaRequired: true`.

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/register` | `{name, email, password}` | strong password required → challenge (email OTP) |
| POST | `/verify-email` | `{challengeId, code}` | → signed in |
| POST | `/login` | `{email, password}` | → challenge (`mfaRequired`) · 401 wrong · **423 locked** |
| POST | `/login/verify` | `{challengeId, code}` | → signed in |
| POST | `/otp/resend` | `{challengeId}` | 60 s cooldown, max 3 → **429** with `retryAfterSeconds` |
| POST | `/refresh` | *(cookie)* | rotates the refresh token → new access token |
| POST | `/logout` | *(cookie)* | signs out this device |
| POST | `/logout-all` | | signs out every device |
| GET | `/sessions` | | signed-in devices (`current: true` marks this one) |
| DELETE | `/sessions/:id` | | sign out one device |
| POST | `/password/forgot` | `{email}` | always the same answer + a `challengeId` |
| POST | `/password/reset` | `{challengeId, code, newPassword}` | signs out every device |
| POST | `/password` | `{currentPassword, newPassword}` | signs out *other* devices |
| GET | `/me` | | current user |
| PATCH | `/me` | `{name?, preferences?: {voice?, language?, otpChannel?}}` | `otpChannel: "sms"` needs a verified phone |
| POST | `/me/phone` | `{phone}` | E.164 (`+919876543210`) → SMS challenge |
| POST | `/me/phone/verify` | `{challengeId, code}` | |
| GET | `/activity` | | security events with time, IP, device |
| DELETE | `/me` | `{password}` | deletes the account **and all data** in MongoDB, SQL, vector store, S3 |

Errors are JSON `{error, code}` where `code` is one of `VALIDATION` (400), `UNAUTHENTICATED` (401),
`FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `LOCKED` (423), `RATE_LIMITED` (429).

### Conversations: `/api/conversations` (MongoDB)
| Method | Path | Notes |
|---|---|---|
| GET | `/?q=text` | list (optionally search message text) |
| GET | `/:id` | full conversation with messages |
| PATCH | `/:id` | `{title}`: rename |
| DELETE | `/:id` | |

### Chat: `/api/chat`
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/` | `{message, conversationId?}` | **Server-Sent Events** stream (see event types below); the turn is saved to MongoDB |

### Admin: `/api/admin` (role `admin` only)
| Method | Path | Notes |
|---|---|---|
| GET | `/overview` | user & conversation counts (MongoDB) + global AI analytics (SQL) |
| PATCH | `/users/:id/role` | `{role: "user" \| "admin"}`; signs the user out so it applies at once |
| POST | `/users/:id/unlock` | clear a lockout |

### Other
`GET /api/health` → `{server, mongo, ai}` status.

---

## AI service (FastAPI): `http://localhost:8000`

Interactive docs: **http://localhost:8000/docs**. Every route except `/health` needs `X-Internal-Key`;
`X-User-Id` selects the user (default `local`), `X-User-Role: admin` unlocks admin routes.

| Area | Method | Path | Notes |
|---|---|---|---|
| Chat | POST | `/chat/stream` | `{message, history[]}` → SSE stream |
| | POST | `/chat` | same, non-streaming JSON `{reply, tools, nlp, usage}` |
| RAG | POST | `/rag/upload` | multipart `file` (.pdf/.txt/.md, 20 MB) |
| | POST | `/rag/text` | `{title, text}` |
| | GET | `/rag/documents` | |
| | DELETE | `/rag/documents/{doc_id}` | |
| | POST | `/rag/search` | `{query, k}` → passages + scores |
| | POST | `/rag/query` | classic RAG answer with sources |
| Tasks | GET | `/tasks?include_done=` | |
| | POST | `/tasks` | `{title, due?, remind_at?}` (`remind_at` ISO-8601) |
| | PATCH | `/tasks/{id}` | `{done}` |
| | DELETE | `/tasks/{id}` | |
| Notifications | GET | `/notifications?unread_only=` | reminders that have fired |
| | POST | `/notifications/read` | `{ids: []}` |
| Memory | GET | `/memories` | |
| | POST | `/memories` | `{fact}` (max 200 per user) |
| | DELETE | `/memories/{id}` | |
| Vision | POST | `/vision/analyze` | multipart `file`, `question?`, `use_llm?` → faces, stats, description |
| NLP | POST | `/nlp/analyze` | `{text}` → intent, sentiment, entities |
| | POST | `/nlp/retrain` | **admin** |
| Analytics | GET | `/stats` | this user's usage |
| | GET | `/admin/stats` | **admin**: all users |
| Account | DELETE | `/me/data` | erase this user's tasks, memories, notifications, logs, documents, files |
| Command Center | GET | `/command-center` | the dashboard in one call: status, AI core, agents (tool use in the last 24 h), today's timeline, live feed, this PC's CPU/RAM/disk/network, memory counts, AI providers (key set / not linked, Ollama models, Claude Code/Cursor/Copilot installed). Via the gateway: `/api/ai/command-center` |
| Orchestrator | POST | `/orchestrator/runs` | `{instruction}` → a multi-agent run: Claude plans subtasks (structured output), specialist agents run in parallel (max 3), results are verified; actions that act for the user wait for approval |
| | GET | `/orchestrator/runs`, `/orchestrator/runs/{id}` | this user's runs (in memory while the AI service runs) |
| | POST | `/orchestrator/runs/{id}/pause` · `resume` · `cancel` | run control |
| | POST | `/orchestrator/runs/{id}/subtasks/{sid}/retry` | retry a failed/skipped subtask of a finished run |
| | POST | `/orchestrator/runs/{id}/approvals/{aid}` | `{approve: bool}`: runs the prepared action, or rejects it |
| | GET | `/orchestrator/agents` | the specialist agents and their tools |
| Cyber Ops | GET | `/ops/actions` | the 17 quick actions (`laptop`, `devices`, `network`, `ip`, `security`, `hardware`, `cpu_ram`, `disk`, `files`, `speed`, `bluetooth`, `wifi`, `website`, `ports`, `report`, `emergency`, `investigate`) and whether this service can run them (`SYSTEM_CONTROL` on = Azarvis runs on the user's PC) |
| | POST | `/ops/run` | `{action, params}` → a background job. `devices` / `network` need `params.authorized: true` (the user confirmed they own the network) or answer 428; `website` takes `url`, `files` an optional `path`, `investigate` a `target` (a domain or public IP, looked up in public records only — DNS/RDAP/CT/TLS/headers, no scanning) |
| | GET | `/ops/jobs`, `/ops/jobs/{id}` | this user's jobs with live steps; finished ones are kept (60 per user) in `data/ops_history.json` |
| | GET | `/ops/jobs/{id}/report.md` | the result as a Markdown report |
| | POST | `/ops/jobs/{id}/cancel`, `/ops/stop-all` | cancel one job / every running job (kills its PowerShell and Defender child processes) |
| Health | GET | `/health` | no auth |

### Chat stream events
Each SSE line is `data: {json}`:

| `type` | Fields | Meaning |
|---|---|---|
| `conversation` | `id, title` | (gateway only) which MongoDB conversation this turn belongs to |
| `nlp` | `intent, confidence, sentiment, entities` | ML analysis of the user's message |
| `text` | `text` | a chunk of Jarvis's reply |
| `tool` | `name, input, ok` | Jarvis called a tool |
| `error` | `message` | something went wrong |
| `done` | `usage, tools` | end of the turn |

### Agent tools
`get_time`, `calculate`, `get_weather`, `wikipedia`, `search_knowledge` (RAG), `create_task`
(with reminders), `list_tasks`, `complete_task`, `remember`, `forget`, plus Anthropic's hosted
`web_search` when `ENABLE_WEB_SEARCH=true`.

### Background jobs
The reminder scheduler (`app/scheduler.py`) checks every `REMINDER_INTERVAL_SECONDS` (30) for due
reminders and turns them into notifications; the React bell polls `/api/ai/notifications`.
